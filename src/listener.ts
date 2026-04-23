import dotenv from 'dotenv'
import http from 'node:http'
import { extractIds, fetchData, fetchDataFromChain } from './blockchain/fetchLogs'
import { polylendAddress } from './config'
import { polylendConfig } from './contracts/polylend'
import { initBlockchain, publicClient } from './utils/blockchain'
import { sleep } from './utils/common'
import logger from './utils/logger'
import { closeMongoDb, getLastProcessedBlock, initializeMongoDb, mongoDb } from './utils/mongodb'

dotenv.config()

const HEALTH_PORT = 3002
const MAX_LAG_BLOCKS = 1000
const BACKOFF_MIN_MS = 1000
const BACKOFF_MAX_MS = 30000

let stopping = false
let currentUnsubscribe: (() => void) | null = null

function startHealthServer() {
  const server = http.createServer(async (req, res) => {
    if (req.url !== '/health') {
      res.statusCode = 404
      res.end()
      return
    }
    try {
      await mongoDb.command({ ping: 1 })
      const [head, checkpoint] = await Promise.all([publicClient.getBlockNumber(), getLastProcessedBlock()])
      const lag = checkpoint !== null ? Number(head) - checkpoint : Number(head)
      const ok = lag < MAX_LAG_BLOCKS
      res.statusCode = ok ? 200 : 503
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ok, lag, head: Number(head), checkpoint }))
    } catch (err) {
      res.statusCode = 503
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: String(err) }))
    }
  })
  server.listen(HEALTH_PORT, () => {
    logger.info(`🩺 Health server listening on port ${HEALTH_PORT}`)
  })
  return server
}

async function runSubscription() {
  let backoff = BACKOFF_MIN_MS
  while (!stopping) {
    await new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const unsubscribe = publicClient.watchContractEvent({
        address: polylendAddress,
        abi: polylendConfig.abi,
        onLogs: async (logs) => {
          try {
            const dataIds = await extractIds(logs)
            await fetchDataFromChain(dataIds)
            backoff = BACKOFF_MIN_MS
          } catch (err) {
            logger.error({ err }, '⚠️ onLogs handler failed')
          }
        },
        onError: (err) => {
          logger.error({ err }, '⚠️ WS subscription error')
          done()
        },
      })
      currentUnsubscribe = () => {
        try {
          unsubscribe()
        } catch {}
        done()
      }
    })
    currentUnsubscribe = null
    if (stopping) return
    logger.warn(`🔄 Reconnecting in ${backoff}ms`)
    await sleep(backoff)
    backoff = Math.min(backoff * 2, BACKOFF_MAX_MS)
    try {
      const head = await publicClient.getBlockNumber()
      await fetchData(head)
    } catch (err) {
      logger.error({ err }, '⚠️ Gap-fill after reconnect failed')
    }
  }
}

async function shutdown(signal: string) {
  if (stopping) return
  stopping = true
  logger.info(`🛑 ${signal} received, shutting down...`)
  try {
    currentUnsubscribe?.()
  } catch {}
  try {
    await closeMongoDb()
    logger.info('✅ MongoDB closed')
  } catch (err) {
    logger.error({ err }, '⚠️ Error closing MongoDB')
  }
  process.exit(0)
}

async function main() {
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('unhandledRejection', (err) => {
    logger.error({ err }, '💥 Unhandled promise rejection')
  })

  logger.info('🚀 Starting...')
  logger.info(`🔄 Connecting to MongoDB`)
  await initializeMongoDb()
  logger.info(`🔄 Connecting to Blockchain`)
  await initBlockchain()

  startHealthServer()

  const blockNumber = await publicClient.getBlockNumber()
  logger.info(`🔄 Listening data from block ${blockNumber}...`)
  const subscriptionPromise = runSubscription()

  logger.info(`🔄 Fetching data from block ${blockNumber}...`)
  await fetchData(blockNumber)

  await subscriptionPromise
}

main().catch((err) => {
  logger.error({ err }, '💥 Fatal error')
  process.exit(1)
})
