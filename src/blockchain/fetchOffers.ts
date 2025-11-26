import { polylendAddress } from '../config'
import { polylendConfig } from '../contracts/polylend'

import { LoanOffer } from '../types/polyLend'
import { publicClient } from '../utils/blockchain'

export const fetchOffers = async (ids: string[]): Promise<LoanOffer[]> => {
  const calls = ids.map((id) => ({
    address: polylendAddress as `0x${string}`,
    abi: polylendConfig.abi,
    functionName: 'offers',
    args: [id],
  }))

  const offersData = await publicClient.multicall({
    contracts: calls,
  })

  const positionIdCalls = ids.map((id) => ({
    address: polylendAddress as `0x${string}`,
    abi: polylendConfig.abi,
    functionName: 'getOffersPositionIds',
    args: [id],
  }))
  const positionIdsData = await publicClient.multicall({
    contracts: positionIdCalls,
  })

  return offersData.map((offer: any, index: number): LoanOffer => {
    const positionIds = positionIdsData[index]?.result as unknown as string[]

    return {
      _id: offer.result[0].toString(),
      lender: offer.result[1] as `0x${string}`,
      loanAmount: offer.result[2].toString(),
      rate: offer.result[3].toString(),
      borrowedAmount: offer.result[4].toString(),
      collateralAmount: offer.result[5].toString(),
      minimumLoanAmount: offer.result[6].toString(),
      duration: offer.result[7].toString(),
      startTime: offer.result[8].toString(),
      positionIds: positionIds.map((positionId: any) => positionId.toString()),
      perpetual: offer.result[9].toString(),
    }
  })
}
