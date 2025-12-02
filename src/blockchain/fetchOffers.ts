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
    functionName: 'getOfferPositionIds',
    args: [id],
  }))
  const positionIdsData = await publicClient.multicall({
    contracts: positionIdCalls,
  })

  const collateralAmountCalls = ids.map((id) => ({
    address: polylendAddress as `0x${string}`,
    abi: polylendConfig.abi,
    functionName: 'getOfferCollateralAmounts',
    args: [id],
  }))
  const collateralAmountsData = await publicClient.multicall({
    contracts: collateralAmountCalls,
  })

  return offersData.map((offer: any, index: number): LoanOffer => {
    const positionIds = positionIdsData[index]?.result as unknown as string[]
    const collateralAmounts = collateralAmountsData[index]?.result as unknown as string[]
    return {
      _id: offer.result[0].toString(),
      lender: offer.result[1] as `0x${string}`,
      loanAmount: offer.result[2].toString(),
      rate: offer.result[3].toString(),
      minimumLoanAmount: offer.result[4].toString(),
      duration: offer.result[5].toString(),
      startTime: offer.result[6].toString(),
      borrowedAmount: offer.result[7].toString(),
      perpetual: offer.result[8],
      positionIds: positionIds.map((positionId: any) => positionId.toString()),
      collateralAmounts: collateralAmounts.map((collateralAmount: any) => collateralAmount.toString()),
    }
  })
}
