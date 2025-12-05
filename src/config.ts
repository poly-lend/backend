import dotenv from 'dotenv'
dotenv.config()

export const RPC_URL = process.env.RPC_URL
export const WS_URL = process.env.WS_URL
export const polylendAddress = '0xC49bAFA0F7791De29Df0F1288593ecAa5a7Ae069'
export const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 79726000
export const BLOCK_INTERVAL = 10000
export const MONGO_URL = process.env.MONGO_URL!
