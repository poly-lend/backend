import dotenv from 'dotenv'
import { parseEventLogs } from 'viem'
import { BLOCK_INTERVAL, polylendAddress, START_BLOCK } from './config'
import { polylendConfig } from './contracts/polylend'
import { initBlockchain, publicClient } from './utils/blockchain'
import logger from './utils/logger'
dotenv.config()

type DataIds = {
  requests: number[]
  offers: number[]
  loans: number[]
}

async function parseEvents(events: any[]) {
  const dataIds: DataIds = {
    requests: [],
    offers: [],
    loans: [],
  }
  for (const event of events) {
    switch (event.eventName) {
      case 'LoanRequested':
        dataIds.requests.push(Number(event.args.id))
        break
      case 'LoanOffered':
        dataIds.offers.push(Number(event.args.id))
        break
      case 'LoanAccepted':
        dataIds.loans.push(Number(event.args.id))
        break
      case 'LoanCalled':
        dataIds.loans.push(Number(event.args.id))
        break
      case 'LoanRepaid':
        dataIds.loans.push(Number(event.args.id))
        break
      case 'LoanReclaimed':
        dataIds.loans.push(Number(event.args.id))
        break
      case 'LoanTransferred':
        dataIds.loans.push(Number(event.args.newId))
        dataIds.offers.push(Number(event.args.oldId))
        break
    }
  }
  return dataIds
}

async function getData(blockNumber: number, callback: (events: any[]) => void) {
  let currentBlock = START_BLOCK
  while (currentBlock < blockNumber) {
    const events = await publicClient!.getLogs({
      address: polylendAddress,
      fromBlock: BigInt(currentBlock),
      toBlock: BigInt(Math.min(currentBlock + BLOCK_INTERVAL, blockNumber)),
    })
    const logs = parseEventLogs({
      abi: polylendConfig.abi,
      logs: events,
    })
    const dataIds = await callback(logs)
    console.log(dataIds)

    currentBlock += BLOCK_INTERVAL
  }
}

async function main() {
  logger.info('🚀 Starting...')
  await initBlockchain()
  const blockNumber = await publicClient.getBlockNumber()
  //logger.info(`🔄 Listening data from block ${blockNumber}...`)

  await getData(Number(blockNumber), parseEvents)
}

main().catch(console.error)
