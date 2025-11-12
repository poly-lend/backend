import { parseEventLogs } from 'viem'
import { BLOCK_INTERVAL, polylendAddress, START_BLOCK } from '../config'
import { polylendConfig } from '../contracts/polylend'
import { publicClient } from '../utils/blockchain'
import { sleep } from '../utils/common'
import logger from '../utils/logger'
import { mongoDb } from '../utils/mongodb'
import { fetchLoans } from './fetchLoans'
import { fetchOffers } from './fetchOffers'
import { fetchRequests } from './fetchRequests'

export type DataIds = {
  requests: string[]
  offers: string[]
  loans: string[]
}

export async function extractIds(events: any[]): Promise<DataIds> {
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

export async function fetchDataFromChain(dataIds: DataIds) {
  dataIds.requests = [...new Set(dataIds.requests)]
  dataIds.offers = [...new Set(dataIds.offers)]
  dataIds.loans = [...new Set(dataIds.loans)]
  const loans = await fetchLoans(dataIds.loans)
  const requests = await fetchRequests(dataIds.requests)
  const offers = await fetchOffers(dataIds.offers)

  const loanBulkWriteOps = loans.map((loan) => ({
    updateOne: {
      filter: { _id: loan._id },
      update: { $set: loan },
      upsert: true,
    },
  })) as any // @ts-ignore
  const requestBulkWriteOps = requests.map((request) => ({
    updateOne: {
      filter: { _id: request._id as any },
      update: { $set: request },
      upsert: true,
    } as any, // @ts-ignore
  }))

  const offerBulkWriteOps = offers.map((offer) => ({
    updateOne: {
      filter: { _id: offer._id as any },
      update: { $set: offer },
      upsert: true,
    },
  })) as any // @ts-ignore

  await mongoDb.collection('offers').bulkWrite(offerBulkWriteOps)
  await mongoDb.collection('requests').bulkWrite(requestBulkWriteOps)
  await mongoDb.collection('loans').bulkWrite(loanBulkWriteOps)
  logger.info(`Inserted ${loans.length} loans, ${requests.length} requests, ${offers.length} offers`)
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
  await fetchDataFromChain(dataIds)
}
