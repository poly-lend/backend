import type { Request, Response } from 'express'
import { isAddress } from 'viem'
import { mongoDb } from '../utils/mongodb'

export async function getPointsForWallet(req: Request, res: Response) {
  const raw = req.params.address
  if (!raw || !isAddress(raw)) {
    res.status(400).json({ error: 'address must be a valid 0x-prefixed hex address' })
    return
  }
  const wallet = raw.toLowerCase()
  const events = await mongoDb.collection('points_events').find({ wallet }).toArray()
  const breakdown: Record<string, { count: number; points: number }> = {}
  let total = 0
  for (const e of events) {
    const a = e.action as string
    total += e.points as number
    const bucket = breakdown[a] ?? { count: 0, points: 0 }
    bucket.count += 1
    bucket.points += e.points as number
    breakdown[a] = bucket
  }
  res.json({ wallet, total, eventCount: events.length, breakdown })
}

export async function getLeaderboard(req: Request, res: Response) {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200))
  const rows = await mongoDb
    .collection('points_events')
    .aggregate([
      { $group: { _id: '$wallet', total: { $sum: '$points' }, events: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: limit },
    ])
    .toArray()
  res.json(
    rows.map((r, i) => ({
      rank: i + 1,
      wallet: r._id as string,
      total: r.total as number,
      events: r.events as number,
    })),
  )
}
