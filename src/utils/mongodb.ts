import { Db, MongoClient } from 'mongodb'
import { MONGO_DB, MONGO_URL } from '../config'

let client: MongoClient
let mongoDb: Db

const initializeMongoDb = async () => {
  client = new MongoClient(MONGO_URL)
  await client.connect()
  mongoDb = client.db(MONGO_DB)
}

const closeMongoDb = async () => {
  if (client) await client.close()
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

export { initializeMongoDb, closeMongoDb, mongoDb, getLastProcessedBlock, setLastProcessedBlock }
