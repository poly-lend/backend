import { Db, MongoClient } from 'mongodb'
import { MONGO_URL } from '../config'

let mongoDb: Db

const initializeMongoDb = async () => {
  const client = new MongoClient(MONGO_URL)
  await client.connect()
  mongoDb = client.db('polylend')
}

async function getLastProcessedBlock(): Promise<number | null> {
  const doc = await mongoDb.collection('state').findOne({ _id: 'lastProcessedBlock' as any })
  return doc?.block ?? null
}

async function setLastProcessedBlock(block: number): Promise<void> {
  await mongoDb.collection('state').updateOne(
    { _id: 'lastProcessedBlock' as any },
    { $set: { block } },
    { upsert: true },
  )
}

export { initializeMongoDb, mongoDb, getLastProcessedBlock, setLastProcessedBlock }
