import dotenv from 'dotenv'
import express from 'express'
import logger from './utils/logger'
dotenv.config()

const app = express()
const port = 3001

app.get('/markets', async (req, res) => {
  let clobTokenIds = req.query.clob_token_ids
  if (!clobTokenIds) {
    res.status(400).send('clob_token_ids is required')
    return
  }

  const params = (Array.isArray(clobTokenIds) ? clobTokenIds : [clobTokenIds])
    .map((param) => param.toString())
    .map((id: string) => `clob_token_ids=${id}`)
  const url = `http://gamma-api.polymarket.com/markets?${params.join('&')}`
  const response = await fetch(url)
  if (!response.ok) {
    res.status(response.status).send(response.statusText)
    return
  }
  const data = await response.json()
  res.send(data)
})

async function main() {
  logger.info('🚀 Starting...')
  app.listen(port, () => {
    logger.info(`Listening on port ${port}`)
  })
}

main().catch(console.error)
