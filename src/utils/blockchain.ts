import { createPublicClient, PublicClient, webSocket } from 'viem'
import { sonic } from 'viem/chains'
import { WS_URL } from '../config'
export let publicClient: PublicClient

export async function initBlockchain() {
  publicClient = createPublicClient({
    chain: sonic,
    transport: webSocket(WS_URL),
  })
}
