import dotenv from 'dotenv'
import logger from './utils/logger'
dotenv.config()

async function main() {
  logger.info('🚀 Starting...')
  while (true) {
    logger.info('🔄 Listening for new loans...')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

main().catch(console.error)
