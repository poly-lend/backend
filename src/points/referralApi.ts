import type { Request, Response } from 'express'
import { isAddress } from 'viem'
import { bindReferral, getOrCreateReferralCode } from './referrals'

export async function getReferralCode(req: Request, res: Response) {
  const raw = req.params.address
  if (!raw || !isAddress(raw)) {
    res.status(400).json({ error: 'address must be a valid 0x-prefixed hex address' })
    return
  }
  const code = await getOrCreateReferralCode(raw)
  res.json({ code })
}

export async function postReferralBind(req: Request, res: Response) {
  const { code, referred } = req.body ?? {}
  if (typeof code !== 'string' || code.length === 0) {
    res.status(400).json({ error: 'code is required' })
    return
  }
  if (typeof referred !== 'string' || !isAddress(referred)) {
    res.status(400).json({ error: 'referred must be a valid 0x-prefixed hex address' })
    return
  }
  const result = await bindReferral(code, referred)
  if (result.ok) {
    res.json({ ok: true })
    return
  }
  const status = result.reason === 'unknown_code' ? 404 : 409
  res.status(status).json({ ok: false, reason: result.reason })
}
