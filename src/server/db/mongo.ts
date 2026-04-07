import { MongoClient } from "mongodb";

import { env } from "~/env";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
};

export const mongoClient =
  globalForMongo.mongoClient ?? new MongoClient(env.MONGODB_URI);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = mongoClient;
}

export const db = env.MONGODB_DB_NAME
  ? mongoClient.db(env.MONGODB_DB_NAME)
  : mongoClient.db();
