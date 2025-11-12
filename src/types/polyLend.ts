export type LoanRequest = {
  _id: string
  borrower: `0x${string}`
  borrowerWallet: `0x${string}`
  positionId: string
  collateralAmount: string
  minimumDuration: string
}

export type LoanOffer = {
  _id: string
  requestId: string
  lender: `0x${string}`
  loanAmount: string
  rate: string
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
  callTime: string
  minimumDuration: string
}
