import dotenv from 'dotenv'
import express from 'express'
import logger from './utils/logger'
dotenv.config()

const app = express()
const port = 3001

app.get('/markets', (req, res) => {
  res.send('Hello World')
})

async function main() {
  logger.info('🚀 Starting...\n')
  app.listen(port, () => {
    logger.info(`Listening on port ${port}`)
  })
}

main().catch(console.error)
