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

  return offersData.map(
    (offer: any, index: number): LoanOffer => ({
      offerId: offer.result[0].toString(),
      requestId: offer.result[1].toString(),
      lender: offer.result[2] as `0x${string}`,
      loanAmount: offer.result[3].toString(),
      rate: offer.result[4].toString(),
    }),
  )
}
