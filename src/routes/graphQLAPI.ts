import express, { json } from "express";
import userFacade from "../facades/userFacadeWithDB";
const debug = require("debug")("user-endpoint");
const router = express.Router();
import { ApiError } from "../errors/apiError"
import authMiddleware from "../middlewares/basic-auth";
import * as mongo from "mongodb"
import { getConnectedClient } from "../config/setupDB";
import app from '../app';
const { graphqlHTTP } = require('express-graphql');
import { buildSchema, SchemaMetaFieldDef } from "graphql";
import GameUser from "../interfaces/GameUser"

const MongoClient = mongo.MongoClient;

const USE_AUTHENTICATION = !process.env["SKIP_AUTHENTICATION"];

let dbInitialized = false;

(async function initDb() {
  const client = await getConnectedClient();
  await userFacade.initDB(client);
  dbInitialized = true
})()



const schema = buildSchema(`
  type User {
    name: String!
    userName: String!
    role: String!
  }

  input UserInput {
    name: String!
    userName: String!
    password: String!
  }

  type Query {
    users: [User!]!
    user(userName: String!): User!
  }

  type Mutation {
    deleteUser(userName: String!): String
    createUser(UserInput: UserInput!): String 
  }
`)

const root = {
  users: async () => {
    const users = await userFacade.getAllUsers();
    const usersDTO = users.map((user) => {
      const { name, userName, role } = user;
      return { name, userName, role }
    })
    return usersDTO;
  },
  user: async ({ userName }: any) => {
    const { name, role } = await userFacade.getUser(userName);
      return { name, userName, role }
  },
  createUser: async (inp: any) => {
    const { UserInput } = inp;
    try {
      const newUser: GameUser = {
        name: UserInput.name,
        userName: UserInput.userName,
        password: UserInput.password,
        role: 'user'
      }
      const status = await userFacade.addUser(newUser);
      return status;
    } catch (err) {
      throw err;
    }
  },
  deleteUser: async ( { userName }: any ) => {
      const status = await userFacade.deleteUser(userName);
      return status;
  }
}

if (USE_AUTHENTICATION) {
  router.use(authMiddleware)
}
 
router.use("/", (req: any, res, next) => {
  if (USE_AUTHENTICATION) {
    if (!req.userName) {
      throw new ApiError("Not Authorized", 403)
    }
  }
  next();
})


router.use('/', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));


module.exports = router;