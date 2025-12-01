import dotenv from 'dotenv'
dotenv.config()

export const RPC_URL = process.env.RPC_URL
export const WS_URL = process.env.WS_URL
export const polylendAddress = '0x092b68bb8b1da1639237593dcb60f00c7a276f45'
export const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 79726000
export const BLOCK_INTERVAL = 10000
export const MONGO_URL = process.env.MONGO_URL!
