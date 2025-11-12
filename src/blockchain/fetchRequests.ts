import { polylendAddress } from '../config'
import { polylendConfig } from '../contracts/polylend'

import { LoanRequest } from '../types/polyLend'
import { publicClient } from '../utils/blockchain'

export const fetchRequests = async (ids: string[]): Promise<LoanRequest[]> => {
  const calls = ids.map((id) => ({
    address: polylendAddress as `0x${string}`,
    abi: polylendConfig.abi,
    functionName: 'requests',
    args: [id],
  }))

  const requestsData = await publicClient.multicall({
    contracts: calls,
  })

  return requestsData.map(
    (request: any, index: number): LoanRequest => ({
      _id: request.result[0].toString(),
      borrower: request.result[1] as `0x${string}`,
      borrowerWallet: request.result[2],
      positionId: request.result[3].toString(),
      collateralAmount: request.result[4].toString(),
      minimumDuration: request.result[5].toString(),
    }),
  )
}
