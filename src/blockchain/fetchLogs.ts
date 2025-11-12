import { parseEventLogs } from 'viem'
import { BLOCK_INTERVAL, polylendAddress, START_BLOCK } from '../config'
import { polylendConfig } from '../contracts/polylend'
import { publicClient } from '../utils/blockchain'
import { sleep } from '../utils/common'
import { fetchLoans } from './fetchLoans'
import { fetchOffers } from './fetchOffers'
import { fetchRequests } from './fetchRequests'

export type DataIds = {
  requests: string[]
  offers: string[]
  loans: string[]
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
        dataIds.requests.push(event.args.id.toString())
        break
      case 'LoanOffered':
        dataIds.offers.push(event.args.id.toString())
        break
      case 'LoanAccepted':
        dataIds.loans.push(event.args.id.toString())
        break
      case 'LoanCalled':
        dataIds.loans.push(event.args.id.toString())
        break
      case 'LoanRepaid':
        dataIds.loans.push(event.args.id.toString())
        break
      case 'LoanReclaimed':
        dataIds.loans.push(event.args.id.toString())
        break
      case 'LoanTransferred':
        dataIds.loans.push(event.args.newId.toString())
        dataIds.offers.push(event.args.oldId.toString())
        break
    }
  }
  return dataIds
}

export async function fetchData(blockNumber: bigint) {
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
    await sleep(1000)
  }
  dataIds.requests = [...new Set(dataIds.requests)]
  dataIds.offers = [...new Set(dataIds.offers)]
  dataIds.loans = [...new Set(dataIds.loans)]
  console.log(`Processed ${counter} iterations`)
  console.log(dataIds)
  const loans = await fetchLoans(dataIds.loans)
  const requests = await fetchRequests(dataIds.requests)
  const offers = await fetchOffers(dataIds.offers)

  return dataIds
}
