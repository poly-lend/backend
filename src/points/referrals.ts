import crypto from 'node:crypto'
import { NETWORK } from '../config'
import logger from '../utils/logger'
import { mongoDb } from '../utils/mongodb'

const REFERRAL_POINTS = 10

type ReferralCode = {
  _id: string // the code itself
  wallet: string
  createdAt: Date
}

type Referral = {
  _id: string // referred wallet (lowercase), so each wallet can only be referred once
  referrer: string
  status: 'pending' | 'rewarded'
  createdAt: Date
  rewardedAt?: Date
  rewardedByTx?: string
}

function generateCode(): string {
  // 8 hex chars = 32 bits = ~4B codes. For testnet scale, collisions are
  // handled by the unique _id constraint + retry.
  return crypto.randomBytes(4).toString('hex')
}

export async function getOrCreateReferralCode(wallet: string): Promise<string> {
  const w = wallet.toLowerCase()
  const existing = await mongoDb.collection<ReferralCode>('referral_codes').findOne({ wallet: w })
  if (existing) return existing._id
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    try {
      await mongoDb.collection<ReferralCode>('referral_codes').insertOne({
        _id: code,
        wallet: w,
        createdAt: new Date(),
      })
      return code
    } catch (err: any) {
      // Duplicate _id (code collision) OR duplicate wallet (race with another
      // request for the same wallet). On wallet-dup, return the stored code.
      if (err?.code === 11000) {
        const raced = await mongoDb.collection<ReferralCode>('referral_codes').findOne({ wallet: w })
        if (raced) return raced._id
        continue // code collision — retry with a fresh code
      }
      throw err
    }
  }
  throw new Error('exhausted referral-code generation attempts')
}

export type BindResult =
  | { ok: true }
  | { ok: false; reason: 'unknown_code' | 'self_referral' | 'already_bound' }

export async function bindReferral(code: string, referred: string): Promise<BindResult> {
  const r = referred.toLowerCase()
  const codeDoc = await mongoDb.collection<ReferralCode>('referral_codes').findOne({ _id: code })
  if (!codeDoc) return { ok: false, reason: 'unknown_code' }
  if (codeDoc.wallet === r) return { ok: false, reason: 'self_referral' }
  const existing = await mongoDb.collection<Referral>('referrals').findOne({ _id: r })
  if (existing) return { ok: false, reason: 'already_bound' }
  try {
    await mongoDb.collection<Referral>('referrals').insertOne({
      _id: r,
      referrer: codeDoc.wallet,
      status: 'pending',
      createdAt: new Date(),
    })
    return { ok: true }
  } catch (err: any) {
    if (err?.code === 11000) return { ok: false, reason: 'already_bound' }
    throw err
  }
}

// Called from awardPointsFromLogs after the per-event row lands. If the actor
// has a pending referral binding, award REFERRAL_POINTS to the referrer and
// flip the binding to 'rewarded'. Idempotent: the points_events row uses
// `referral:${referred}` as _id and `findOneAndUpdate` with the status gate
// ensures we only pay out once.
export async function maybeAwardReferral(wallet: string, txHash: string): Promise<void> {
  const w = wallet.toLowerCase()
  const binding = await mongoDb
    .collection<Referral>('referrals')
    .findOneAndUpdate(
      { _id: w, status: 'pending' },
      { $set: { status: 'rewarded', rewardedAt: new Date(), rewardedByTx: txHash } },
    )
  if (!binding) return
  try {
    await mongoDb.collection('points_events').insertOne({
      _id: `referral:${w}` as unknown as never,
      wallet: binding.referrer,
      action: 'Referral',
      points: REFERRAL_POINTS,
      referred: w,
      timestamp: new Date(),
    })
    logger.info({ referrer: binding.referrer, referred: w }, '🏅 Awarded referral points')
  } catch (err: any) {
    // If the referral row already exists (shouldn't, because of the status
    // gate above, but defensively), swallow the dup.
    if (err?.code !== 11000) throw err
  }
}

export async function ensureReferralIndexes(): Promise<void> {
  if (NETWORK !== 'testnet') return
  await mongoDb.collection('referral_codes').createIndex({ wallet: 1 }, { unique: true })
}
