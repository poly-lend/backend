import dotenv from 'dotenv'
import { fetchData } from './blockchain/fetchLogs'
import { initBlockchain, publicClient } from './utils/blockchain'
import logger from './utils/logger'
import { initializeMongoDb } from './utils/mongodb'
dotenv.config()

async function main() {
  logger.info('🚀 Starting...')
  logger.info(`🔄 Connecting to MongoDB`)
  await initializeMongoDb()
  logger.info(`🔄 Connecting to Blockchain`)
  await initBlockchain()
  const blockNumber = await publicClient.getBlockNumber()
  //logger.info(`🔄 Listening data from block ${blockNumber}...`)

  await fetchData(blockNumber)
}

main().catch(console.error)
