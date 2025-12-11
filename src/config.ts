import dotenv from 'dotenv'
dotenv.config()

export const RPC_URL = process.env.RPC_URL
export const WS_URL = process.env.WS_URL
export const polylendAddress = '0x1620A7d943B0DeAf1c2123BE6413F87B5dacEf2b'
export const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 79726000
export const BLOCK_INTERVAL = 10000
export const MONGO_URL = process.env.MONGO_URL!
