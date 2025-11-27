import dotenv from 'dotenv'
dotenv.config()

export const RPC_URL = process.env.RPC_URL
export const WS_URL = process.env.WS_URL
export const polylendAddress = '0x683216767FF2dd123406C69B724258c37Ab6F949'
export const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 79516000
export const BLOCK_INTERVAL = 10000
export const MONGO_URL = process.env.MONGO_URL!
