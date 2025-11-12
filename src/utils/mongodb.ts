import { Db, MongoClient } from 'mongodb'
import { MONGO_URL } from '../config'

let mongoDb: Db

const initializeMongoDb = async () => {
  const client = new MongoClient(MONGO_URL)
  await client.connect()
  mongoDb = client.db('polylend')
}

export { initializeMongoDb, mongoDb }
