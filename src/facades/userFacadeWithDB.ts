const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '.env') })
const debug = require("debug")("facade-with-db");
import IGameUser from '../interfaces/GameUser';
import { bryptAsync, bryptCheckAsync } from "../utils/bcrypt-async-helper"
import * as mongo from "mongodb"
import { getConnectedClient } from "../config/setupDB"
import { UserNotFoundError } from "../errors/userNotFoundError"
import { updateLanguageServiceSourceFile } from 'typescript';



let userCollection: mongo.Collection;

export default class UserFacade {

  static async initDB(client: mongo.MongoClient) {

    const dbName = process.env.DB_NAME;
    //debug(`Database ${dbName} about to be setup: ${client}`)
    if (!dbName) {
      throw new Error("Database name not provided")
    }
    try {
      userCollection = await client.db(dbName).collection("users");
      debug(`userCollection initialized on database '${dbName}'`)
      // Creating a unique index below, so field 'userName' cannot hold duplicate values 
      userCollection.createIndex({ userName: 1}, { unique: true})

    } catch (err) {
      console.error("Could not create connection", err)
    }
  }

  static async addUser(user: IGameUser): Promise<string> {
    const hash = await bryptAsync(user.password);
    let newUser = { ...user, password: hash }
    // If the collection does not exist, then the insertOne() method creates the collection.
    const result = await userCollection.insertOne(newUser);
    return "User was added";
  }

  static async deleteUser(userName: string): Promise<string> {
    //db.collection.deleteOne deletes the first document that matches the filter.
    //Use a field that is part of a unique index such as _id for precise deletions.
    console.log('xxx');
    console.log(userName);
    await userCollection.deleteOne({ userName });
    return 'User deleted successfully';
  }
  //static async getAllUsers(): Promise<Array<IGameUser>> {
  static async getAllUsers(proj?: object): Promise<Array<any>> {
    const users = await userCollection.find({}, { projection: proj }).toArray()

    return users;
  }

  static async getUser(userName: string, proj?: object): Promise<any> {
    console.log('sadsa');
    const user = await userCollection.findOne({ userName });
    console.log(user);
    if(!user){
      throw new UserNotFoundError('User not found');
    }

    return user;
  }

  static async updateUser(query: object, updatedValues: object): Promise<any> {
    try {
      const updatedUser = await userCollection.updateOne(query, updatedValues);
      return updatedUser;
    } catch(err) {
      console.log('something went wrong')
    }

  }
  

  static async checkUser(userName: string, password: string): Promise<boolean> {
    let userPassword = "";
    console.log("Checking")
    let user;

    user = await UserFacade.getUser(userName);

    console.log("Found ", user)
    userPassword = user.password;
    const status = await bryptCheckAsync(password, userPassword);
    console.log(status);
    return status
  }


}





async function test() {
  const client = await getConnectedClient();
  await UserFacade.initDB(client);

  await userCollection.deleteMany({})
  await UserFacade.addUser({ name: "kim-admin", userName: "kim@b.dk", password: "secret", role: "admin" })
  await UserFacade.addUser({ name: "ole", userName: "ole@b.dk", password: "secret", role: "user" })

  const all = await UserFacade.getAllUsers();
  debug(all)
  debug(all.length)

  //client.close();
  // const projection = {projection:{_id:0, role:0,password:0}}
  // const kim = await UserFacade.getUser("kim@b.dk",projection)
  // debug(kim)

  // try {
  //     let status = await UserFacade.deleteUser("kim@b.dk");
  //     debug(status)
  //     status = await UserFacade.deleteUser("xxxx@b.dk");
  //     debug("Should not get here")
  // } catch (err) {
  //     debug(err.message)
  // }

  // try {
  //     const passwordStatus = await UserFacade.checkUser("kim@b.dk", "secret");
  //     debug("Expects true: ", passwordStatus)
  // } catch (err) {
  //     debug("Should not get here 1", err)
  // }
  // try {
  //     const passwordStatus = await UserFacade.checkUser("kim@b.dk", "xxxx");
  //     debug("Should not get here ", passwordStatus)
  // } catch (err) {
  //     debug("Should get here with failded 2", err)
  // }
  // try {
  //     const passwordStatus = await UserFacade.checkUser("xxxx@b.dk", "secret");
  //     debug("Should not get here")
  // } catch (err) {
  //     debug("hould get here with failded 2", err)
  // }


}
//test();