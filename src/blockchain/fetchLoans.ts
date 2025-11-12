import { polylendAddress } from '../config'
import { polylendConfig } from '../contracts/polylend'
import { Loan } from '../types/polyLend'
import { publicClient } from '../utils/blockchain'

export const fetchLoans = async (): Promise<Loan[]> => {
  const calls = []
  for (var i = 0; i < 100; i++) {
    calls.push({
      address: polylendAddress as `0x${string}`,
      abi: polylendConfig.abi,
      functionName: 'loans',
      args: [i],
    })
  }
  const loansData = await publicClient.multicall({
    contracts: calls,
  })

  return loansData.map(
    (loan: any, index: number): Loan => ({
      loanId: loan.result[0].toString(),
      borrower: loan.result[1] as `0x${string}`,
      borrowerWallet: loan.result[2],
      lender: loan.result[3] as `0x${string}`,
      positionId: loan.result[4].toString(),
      collateralAmount: loan.result[5].toString(),
      loanAmount: loan.result[6].toString(),
      rate: loan.result[7].toString(),
      startTime: loan.result[8].toString(),
      minimumDuration: loan.result[9].toString(),
      callTime: loan.result[10].toString(),
    }),
  )
}
