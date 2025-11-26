import { parseEventLogs } from 'viem'
import { BLOCK_INTERVAL, polylendAddress, START_BLOCK } from '../config'
import { polylendConfig } from '../contracts/polylend'
import { publicClient } from '../utils/blockchain'
import { sleep } from '../utils/common'
import logger from '../utils/logger'
import { mongoDb } from '../utils/mongodb'
import { fetchLoans } from './fetchLoans'
import { fetchOffers } from './fetchOffers'

export type DataIds = {
  offers: string[]
  loans: string[]
}

export async function extractIds(events: any[]): Promise<DataIds> {
  const dataIds: DataIds = {
    offers: [],
    loans: [],
  }
  for (const event of events) {
    switch (event.eventName) {
      case 'LoanAccepted':
        dataIds.loans.push(event.args.id.toString())
        dataIds.offers.push(event.args.offerId.toString())
        break
      case 'LoanCalled':
        dataIds.loans.push(event.args.id.toString())
        break
      case 'LoanOffered':
        dataIds.offers.push(event.args.id.toString())
        break
      case 'LoanRepaid':
        dataIds.loans.push(event.args.id.toString())
        break
      case 'LoanTransferred':
        dataIds.loans.push(event.args.newId.toString())
        dataIds.loans.push(event.args.oldId.toString())
        break
      case 'LoanReclaimed':
        dataIds.loans.push(event.args.id.toString())
        break
      case 'LoanOfferCanceled':
        dataIds.offers.push(event.args.id.toString())
        break
    }
  }
  return dataIds
}

export async function fetchDataFromChain(dataIds: DataIds) {
  dataIds.offers = [...new Set(dataIds.offers)]
  dataIds.loans = [...new Set(dataIds.loans)]
  logger.info(`🔄 Fetching ${dataIds.loans.length} loans, ${dataIds.offers.length} offers`)
  const loans = await fetchLoans(dataIds.loans)
  const offers = await fetchOffers(dataIds.offers)

  const loanBulkWriteOps = loans.map((loan) => ({
    updateOne: {
      filter: { _id: loan._id },
      update: { $set: loan },
      upsert: true,
    },
  })) as any // @ts-ignore

  const offerBulkWriteOps = offers.map((offer) => ({
    updateOne: {
      filter: { _id: offer._id as any },
      update: { $set: offer },
      upsert: true,
    },
  })) as any // @ts-ignore

  logger.info(`🔄 Inserting ${loans.length} loans, ${offers.length} offers`)
  offerBulkWriteOps.length > 0 && (await mongoDb.collection('offers').bulkWrite(offerBulkWriteOps))
  loanBulkWriteOps.length > 0 && (await mongoDb.collection('loans').bulkWrite(loanBulkWriteOps))
  logger.info(`✅ Inserted ${loans.length} loans, ${offers.length} offers`)
}

export async function fetchData(blockNumber: bigint) {
  let currentBlock = START_BLOCK
  let counter = 0
  const dataIds: DataIds = {
    offers: [],
    loans: [],
  }
  while (currentBlock <= blockNumber) {
    const toBlock = Math.min(currentBlock + BLOCK_INTERVAL, Number(blockNumber))
    logger.info(`🔄 Fetching data from block ${currentBlock} to ${toBlock}`)
    const events = await publicClient!.getLogs({
      address: polylendAddress,
      fromBlock: BigInt(currentBlock),
      toBlock: BigInt(toBlock),
    })
    const logs = parseEventLogs({
      abi: polylendConfig.abi,
      logs: events,
    })
    const newDataIds = await extractIds(logs)
    dataIds.offers.push(...newDataIds.offers)
    dataIds.loans.push(...newDataIds.loans)

    currentBlock += BLOCK_INTERVAL
    counter++
    await sleep(100)
  }
  await fetchDataFromChain(dataIds)
}
