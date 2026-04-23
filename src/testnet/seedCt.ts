import type { Request, Response } from 'express'
import {
  createTestClient,
  encodeAbiParameters,
  getAddress,
  http,
  isAddress,
  keccak256,
  pad,
  toHex,
} from 'viem'
import { anvil } from 'viem/chains'
import { RPC_URL } from '../config'
import logger from '../utils/logger'

// Polymarket ConditionalTokens on Polygon — carries over from the fork.
const CT_ADDRESS: `0x${string}` = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045'

// Polymarket ConditionalTokens holds `mapping(uint256 => mapping(address => uint256)) balances`
// at storage slot 1 (verified empirically against a known holder's balance —
// slot 0 is occupied by something in the inheritance chain).
//   inner slot  = keccak256(abi.encode(positionId, BALANCES_SLOT))
//   outer slot  = keccak256(abi.encode(account, innerSlot))
const BALANCES_SLOT = 1n

const testClient = createTestClient({
  chain: anvil,
  mode: 'anvil',
  transport: http(RPC_URL),
})

function balanceSlot(positionId: bigint, account: `0x${string}`): `0x${string}` {
  const innerKey = keccak256(
    encodeAbiParameters(
      [{ type: 'uint256' }, { type: 'uint256' }],
      [positionId, BALANCES_SLOT],
    ),
  )
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [account, innerKey],
    ),
  )
}

export async function seedCtHandler(req: Request, res: Response) {
  const { address, positionId, amount } = (req.body ?? {}) as {
    address?: unknown
    positionId?: unknown
    amount?: unknown
  }

  if (typeof address !== 'string' || !isAddress(address)) {
    res.status(400).json({ error: 'address must be a valid 0x-prefixed hex address' })
    return
  }
  if (typeof positionId !== 'string' || !/^\d+$/.test(positionId)) {
    res.status(400).json({ error: 'positionId must be a decimal string' })
    return
  }
  if (typeof amount !== 'string' || !/^\d+$/.test(amount) || BigInt(amount) === 0n) {
    res.status(400).json({ error: 'amount must be a positive decimal string' })
    return
  }

  const to = getAddress(address)
  const positionIdBig = BigInt(positionId)
  const amountBig = BigInt(amount)
  const slot = balanceSlot(positionIdBig, to)
  const value = pad(toHex(amountBig), { size: 32 })

  try {
    await testClient.setStorageAt({ address: CT_ADDRESS, index: slot, value })
    logger.info({ to, positionId, amount }, '✅ Seeded CT balance')
    res.json({ ok: true, ctAddress: CT_ADDRESS, slot, value })
  } catch (err) {
    logger.error({ err }, '⚠️ seed-ct failed')
    res.status(500).json({ error: String(err) })
  }
}
