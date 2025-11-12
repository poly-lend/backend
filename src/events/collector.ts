import { parseEventLogs } from 'viem'
import { BLOCK_INTERVAL, polylendAddress, START_BLOCK } from '../config'
import { polylendConfig } from '../contracts/polylend'
import { publicClient } from '../utils/blockchain'

export type DataIds = {
  requests: number[]
  offers: number[]
  loans: number[]
}

async function extractIds(events: any[]): Promise<DataIds> {
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

export async function getDataIds(blockNumber: bigint) {
  let currentBlock = START_BLOCK
  let counter = 0
  const dataIds: DataIds = {
    requests: [],
    offers: [],
    loans: [],
  }
  while (currentBlock <= blockNumber) {
    const events = await publicClient!.getLogs({
      address: polylendAddress,
      fromBlock: BigInt(currentBlock),
      toBlock: BigInt(Math.min(currentBlock + BLOCK_INTERVAL, Number(blockNumber))),
    })
    const logs = parseEventLogs({
      abi: polylendConfig.abi,
      logs: events,
    })
    const newDataIds = await extractIds(logs)
    dataIds.requests.push(...newDataIds.requests)
    dataIds.offers.push(...newDataIds.offers)
    dataIds.loans.push(...newDataIds.loans)

    currentBlock += BLOCK_INTERVAL
    counter++
  }
  dataIds.requests = [...new Set(dataIds.requests)]
  dataIds.offers = [...new Set(dataIds.offers)]
  dataIds.loans = [...new Set(dataIds.loans)]
  console.log(`Processed ${counter} iterations`)
  console.log(dataIds)
  return dataIds
}
