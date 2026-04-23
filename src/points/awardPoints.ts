import { NETWORK } from '../config'
import { httpClient } from '../utils/blockchain'
import logger from '../utils/logger'
import { mongoDb } from '../utils/mongodb'
import { maybeAwardReferral } from './referrals'

// On-chain actions scored per the points table in proposal 001.
// Off-chain points (bug reports +50, UX feedback +5, referrals +10) are
// awarded separately by Featurebase webhooks / #21, not here.
const POINTS_BY_EVENT: Record<string, number> = {
  LoanOffered: 10,
  LoanAccepted: 10,
  LoanRepaid: 10,
  LoanCalled: 15,
  LoanTransferred: 20,
  LoanReclaimed: 15,
}

type Log = {
  eventName?: string
  args?: Record<string, unknown>
  transactionHash: `0x${string}`
  logIndex: number
  blockNumber: bigint
}

async function walletForLog(log: Log): Promise<string | null> {
  switch (log.eventName) {
    case 'LoanOffered':
      return (log.args?.lender as string) ?? null
    case 'LoanAccepted':
      return (log.args?.borrower as string) ?? null
    case 'LoanTransferred':
      return (log.args?.newLender as string) ?? null
    case 'LoanRepaid':
    case 'LoanCalled':
    case 'LoanReclaimed': {
      // Actor isn't in event args — the caller's address is the actor.
      // PolyLend enforces msg.sender === borrower for repay and
      // msg.sender === lender for call/reclaim, so tx.from is authoritative.
      try {
        const tx = await httpClient.getTransaction({ hash: log.transactionHash })
        return tx.from
      } catch (err) {
        logger.warn({ err, tx: log.transactionHash }, 'could not fetch tx for points')
        return null
      }
    }
    default:
      return null
  }
}

export async function awardPointsFromLogs(logs: Log[]): Promise<void> {
  if (NETWORK !== 'testnet') return
  if (logs.length === 0) return

  const operations = []
  const referralCheck: { wallet: string; txHash: string }[] = []
  for (const log of logs) {
    const points = POINTS_BY_EVENT[log.eventName ?? '']
    if (!points) continue
    const wallet = await walletForLog(log)
    if (!wallet) continue
    operations.push({
      updateOne: {
        filter: { _id: `${log.transactionHash}:${log.logIndex}` as unknown as never },
        update: {
          $setOnInsert: {
            wallet: wallet.toLowerCase(),
            action: log.eventName,
            points,
            blockNumber: Number(log.blockNumber),
            timestamp: new Date(),
          },
        },
        upsert: true,
      },
    })
    referralCheck.push({ wallet, txHash: log.transactionHash })
  }

  if (operations.length === 0) return
  const result = await mongoDb.collection('points_events').bulkWrite(operations)
  if (result.upsertedCount > 0) {
    logger.info({ inserted: result.upsertedCount, total: operations.length }, '🏅 Awarded points')
  }

  // Deduplicate by wallet so a wallet taking two actions in the same log
  // batch only triggers one referral lookup.
  const seen = new Set<string>()
  for (const { wallet, txHash } of referralCheck) {
    const key = wallet.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    try {
      await maybeAwardReferral(wallet, txHash)
    } catch (err) {
      logger.warn({ err, wallet }, '⚠️ maybeAwardReferral failed')
    }
  }
}

// Called once at startup (idempotent on re-run).
export async function ensurePointsIndexes(): Promise<void> {
  if (NETWORK !== 'testnet') return
  await mongoDb.collection('points_events').createIndex({ wallet: 1 })
}
