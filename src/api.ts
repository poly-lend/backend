import dotenv from 'dotenv'
import express from 'express'
import NodeCache from 'node-cache'
import logger from './utils/logger'
import { initializeMongoDb, mongoDb } from './utils/mongodb'

const cache = new NodeCache({ stdTTL: 60 * 5 })

dotenv.config()

const app = express()
const port = 3001

const ENABLED_EVENTS = ['presidential-election-winner-2028']

app.get('/health', async (_req, res) => {
  try {
    await mongoDb.command({ ping: 1 })
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ ok: false, error: String(err) })
  }
})

app.get('/positions', async (req, res) => {
  const address = req.query.address as string
  const url = `https://data-api.polymarket.com/positions?user=${address}`
  const response = await fetch(url)
  if (!response.ok) {
    res.status(response.status).send(response.statusText)
    return
  }
  const positions = await response.json()
  res.send(positions)
})

app.get('/loans', async (req, res) => {
  const loans = await mongoDb
    .collection('loans')
    .find({
      borrower: { $ne: '0x0000000000000000000000000000000000000000' },
    })
    .toArray()
  res.send(loans)
})

app.get('/requests', async (req, res) => {
  const requests = await mongoDb
    .collection('requests')
    .find({
      borrower: { $ne: '0x0000000000000000000000000000000000000000' },
    })
    .toArray()
  res.send(requests)
})

app.get('/offers', async (req, res) => {
  const offers = await mongoDb
    .collection('offers')
    .find({
      lender: { $ne: '0x0000000000000000000000000000000000000000' },
    })
    .toArray()
  res.send(offers)
})

app.get('/stats', async (req, res) => {
  const cacheKey = 'stats'
  const cached = cache.get(cacheKey)
  if (cached) {
    res.send(cached)
    return
  }

  const [offers, loans] = await Promise.all([
    mongoDb
      .collection('offers')
      .find({ lender: { $ne: '0x0000000000000000000000000000000000000000' } })
      .toArray(),
    mongoDb
      .collection('loans')
      .find({ borrower: { $ne: '0x0000000000000000000000000000000000000000' } })
      .toArray(),
  ])

  const totalLiquidity = offers.reduce(
    (sum, o) => sum + (Number(o.loanAmount || 0) - Number(o.borrowedAmount || 0)),
    0,
  )
  const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.loanAmount || 0), 0)
  const activeLoans = loans.length
  const activeOffers = offers.length
  const uniqueLenders = new Set(offers.map((o) => o.lender)).size
  const uniqueBorrowers = new Set(loans.map((l) => l.borrower)).size

  const stats = {
    totalLiquidity,
    totalBorrowed,
    activeLoans,
    activeOffers,
    uniqueLenders,
    uniqueBorrowers,
  }

  cache.set(cacheKey, stats)
  res.send(stats)
})

app.get('/events', async (req, res) => {
  const result: any[] = []
  for (const event of ENABLED_EVENTS) {
    const cacheKey = `event:${event}`
    const item = cache.get(cacheKey)
    if (item) {
      result.push(item)
      continue
    }
    const url = `https://gamma-api.polymarket.com/events/slug/${event}`
    const response = await fetch(url)
    if (!response.ok) {
      res.status(response.status).send(response.statusText)
      return
    }
    const eventData: any = await response.json()
    cache.set(cacheKey, eventData)
    result.push(eventData)
  }
  res.send(result)
})

app.get('/markets', async (req, res) => {
  const result: any[] = []
  let clobTokenIdsParam = req.query.clob_token_ids
  if (!clobTokenIdsParam) {
    res.status(400).send('clob_token_ids is required')
    return
  }

  const clobTokenIds = (Array.isArray(clobTokenIdsParam) ? clobTokenIdsParam : [clobTokenIdsParam]).map((param) =>
    param.toString(),
  )

  const remainingIds = []
  for (const id of clobTokenIds) {
    const cacheKey = `market:${id}`
    const item = cache.get(cacheKey)
    if (item) {
      result.push(item)
    } else {
      remainingIds.push(id)
    }
  }
  logger.info(`Cached ids: ${result.length} of ${clobTokenIds.length}`)

  if (remainingIds.length > 0) {
    const params = remainingIds.map((id: string) => `clob_token_ids=${id}`)
    const url = `http://gamma-api.polymarket.com/markets?${params.join('&')}`
    const response = await fetch(url)
    if (!response.ok) {
      res.status(response.status).send(response.statusText)
      return
    }
    const data: any[] = (await response.json()) as any[]
    for (const item of data) {
      const ids = JSON.parse(item.clobTokenIds)
      for (const id of ids) {
        const cacheKey = `market:${id}`
        cache.set(cacheKey, item)
      }
      result.push(item)
    }
  }
  res.send(result)
})

async function main() {
  logger.info('🚀 Starting...')
  logger.info(`🔄 Connecting to MongoDB`)
  await initializeMongoDb()
  logger.info(`✅ Connected to MongoDB`)
  app.listen(port, () => {
    logger.info(`Listening on port ${port}`)
  })
}

main().catch(console.error)
