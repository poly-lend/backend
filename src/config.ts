import dotenv from 'dotenv'
dotenv.config()

const MAINNET_POLYLEND_ADDRESS: `0x${string}` = '0x1620A7d943B0DeAf1c2123BE6413F87B5dacEf2b'

const rawNetwork = process.env.NETWORK ?? 'mainnet'
if (rawNetwork !== 'mainnet' && rawNetwork !== 'testnet') {
  throw new Error(`NETWORK must be "mainnet" or "testnet", got "${rawNetwork}"`)
}

export type Network = 'mainnet' | 'testnet'
export const NETWORK: Network = rawNetwork

export const RPC_URL = process.env.RPC_URL
export const WS_URL = process.env.WS_URL
export const MONGO_URL = process.env.MONGO_URL!
export const MONGO_DB = process.env.MONGO_DB ?? 'polylend'

export const polylendAddress: `0x${string}` =
  (process.env.POLYLEND_ADDRESS as `0x${string}` | undefined) ?? MAINNET_POLYLEND_ADDRESS
export const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 84700000
export const BLOCK_INTERVAL = 10000
