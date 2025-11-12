import dotenv from 'dotenv'
dotenv.config()

export const RPC_URL = process.env.RPC_URL
export const WS_URL = process.env.WS_URL
export const polylendAddress = '0x7bCaA23aB1777C7c19935E3872A165B10cD0F650'
export const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 78876000
export const BLOCK_INTERVAL = 10000
