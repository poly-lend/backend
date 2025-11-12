import dotenv from 'dotenv'
import { extractIds, fetchData, fetchDataFromChain } from './blockchain/fetchLogs'
import { polylendAddress } from './config'
import { polylendConfig } from './contracts/polylend'
import { initBlockchain, publicClient } from './utils/blockchain'
import { sleep } from './utils/common'
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

  logger.info(`🔄 Listening data from block ${blockNumber}...`)
  await publicClient.watchContractEvent({
    address: polylendAddress,
    abi: polylendConfig.abi,
    onLogs: async (logs) => {
      const dataIds = await extractIds(logs)
      await fetchDataFromChain(dataIds)
    },
  })

  logger.info(`🔄 Fetching data from block ${blockNumber}...`)
  await fetchData(blockNumber)

  while (true) {
    sleep(1000)
  }
}

main().catch(console.error)
