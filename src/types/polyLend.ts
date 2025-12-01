export type LoanOffer = {
  _id: string
  lender: `0x${string}`
  loanAmount: string
  rate: string
  positionIds: string[]
  collateralAmounts: string[]
  minimumLoanAmount: string
  duration: string
  startTime: string
  borrowedAmount: string
  perpetual: boolean
}

export type Loan = {
  _id: string
  borrower: `0x${string}`
  borrowerWallet: `0x${string}`
  lender: `0x${string}`
  positionId: string
  collateralAmount: bigint
  loanAmount: string
  rate: string
  startTime: string
  minimumDuration: string
  callTime: string
  offerId: string
  isTransfered: boolean
}
