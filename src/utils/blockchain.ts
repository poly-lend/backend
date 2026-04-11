import { createPublicClient, http, PublicClient, webSocket } from 'viem'
import { sonic } from 'viem/chains'
import { RPC_URL, WS_URL } from '../config'

export let publicClient: PublicClient
export let httpClient: PublicClient

export async function initBlockchain() {
  publicClient = createPublicClient({
    chain: sonic,
    transport: webSocket(WS_URL),
  })
  httpClient = createPublicClient({
    chain: sonic,
    transport: http(RPC_URL),
  })
}
