import dotenv from 'dotenv'
import express from 'express'
import NodeCache from 'node-cache'
import logger from './utils/logger'

const cache = new NodeCache({ stdTTL: 60 * 5 })

dotenv.config()

const app = express()
const port = 3001

app.get('/markets', async (req, res) => {
  const result: any[] = []
  let clobTokenIdsParam = req.query.clob_token_ids
  if (!clobTokenIdsParam) {
    res.status(400).send('clob_token_ids is required')
    return
  }

  const clobTokenIds = (Array.isArray(clobTokenIdsParam) ? clobTokenIdsParam : [clobTokenIdsParam]).map((param) =>
    param.toString(),
  )

  const remainingIds = []
  for (const id of clobTokenIds) {
    const item = cache.get(id)
    if (item) {
      result.push(item)
    } else {
      remainingIds.push(id)
    }
  }
  logger.info(`Cached ids: ${result.length} of ${clobTokenIds.length}`)

  if (remainingIds.length > 0) {
    const params = remainingIds.map((id: string) => `clob_token_ids=${id}`)
    const url = `http://gamma-api.polymarket.com/markets?${params.join('&')}`
    const response = await fetch(url)
    if (!response.ok) {
      res.status(response.status).send(response.statusText)
      return
    }
    const data: any[] = (await response.json()) as any[]
    for (const item of data) {
      const ids = JSON.parse(item.clobTokenIds)
      for (const id of ids) {
        cache.set(id, item)
      }
      result.push(item)
    }
  }
  res.send(result)
})

async function main() {
  logger.info('🚀 Starting...')
  app.listen(port, () => {
    logger.info(`Listening on port ${port}`)
  })
}

main().catch(console.error)
