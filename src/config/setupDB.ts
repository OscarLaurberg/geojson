import path from "path";
require('dotenv').config({ path: path.join(process.cwd(), '.env') })
const debug = require("debug")("db-setup");
import { MongoClient } from "mongodb";

const connection = process.env.CONNECTION || ""
let client = new MongoClient(connection, { useNewUrlParser: true, useUnifiedTopology: true })



export async function getConnectedClient() {
  if (client && client.isConnected()) {
    return client;
  }
  debug("--------- Connecting (You should only see this ONCE)  ------------")
  client = await client.connect();
  return client;
}
export async function closeConnection() {
  if (client && client.isConnected()) {
    await client.close();
    debug("--------- Connection Closed ---------")
  }
}





