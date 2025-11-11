import dotenv from 'dotenv'
import { initBlockchain, publicClient } from './utils/blockchain'
import logger from './utils/logger'
dotenv.config()

async function main() {
  logger.info('🚀 Starting...')
  await initBlockchain()
  const blockNumber = await publicClient.getBlockNumber()
  logger.info(`🔄 Listening data from block ${blockNumber}...`)
}

main().catch(console.error)
