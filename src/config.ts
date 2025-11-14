import dotenv from 'dotenv'
dotenv.config()

export const RPC_URL = process.env.RPC_URL
export const WS_URL = process.env.WS_URL
export const polylendAddress = '0x9BF793E4759154D84313485ca8b95fB933Aac1d6'
export const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 78876000
export const BLOCK_INTERVAL = 10000
export const MONGO_URL = process.env.MONGO_URL!
