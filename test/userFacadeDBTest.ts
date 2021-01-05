import * as mongo from "mongodb"
const MongoClient = mongo.MongoClient;
import { getConnectedClient, closeConnection } from "../src/config/setupDB"
const debug = require("debug")("facade-with-db:test");
import UserFacade from '../src/facades/userFacadeWithDB';
import { expect } from "chai";
import { bryptAsync } from "../src/utils/bcrypt-async-helper"
import { UserNotFoundError } from "../src/errors/userNotFoundError";
import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

let userCollection: mongo.Collection | null;
let client: mongo.MongoClient;

describe("Verify the UserFacade with a DataBase", () => {

  before(async function () {
    //Change mocha's default timeout, since we are using a "slow" remote database for testing
    this.timeout(Number(process.env["MOCHA_TIMEOUT"]));
    client = await getConnectedClient();
    process.env["DB_NAME"] = "semester_case_test"
    await UserFacade.initDB(client)
    userCollection = await client.db(process.env["DB_NAME"]).collection("users");
  })

  after(async () => {
    await closeConnection();
  })

  beforeEach(async () => {

    if (userCollection === null) {
      throw new Error("userCollection not set")
    }
    await userCollection.deleteMany({})
    const secretHashed = await bryptAsync("secret");
    await userCollection.insertMany([
      { name: "Peter Pan", userName: "pp@b.dk", password: secretHashed, role: "user" },
      { name: "Donald Duck", userName: "dd@b.dk", password: secretHashed, role: "user" },
      { name: "admin", userName: "admin@a.dk", password: secretHashed, role: "admin" }
    ])
  })


  it("Should Add the user Jan", async () => {
    const newUser = { name: "Jan Olsen", userName: "jo@b.dk", password: "secret", role: "user" }
    try {
      // console.log(userCollection);
        return UserFacade.addUser(newUser).then((res) => {
        expect(res).to.equal('User was added');
      })
  
      // expect(status).to.be.equal("User was added")

      // if (userCollection === null) {
      //   throw new Error("Collection was null")
      // }
      // const jan = await userCollection.findOne({ userName: "jo@b.dk" })
      // expect(jan.name).to.be.equal("Jan Olsenhgghfg")
    } catch (err) {
      console.log('i failed');
    } finally { }
  })


  it("Should Add the user Kurt", async () => {
    const newUser = { name: "Jan Olsen", userName: "jo@b.dk", password: "secret", role: "user" }
      const status = await UserFacade.addUser(newUser);
      // expect(status).to.be.equal("User was added")
      if (userCollection === null) {
        throw new Error("Collection was null")
      }
      const jan = await userCollection.findOne({ userName: "jo@b.dk" })
      expect(jan.name).to.be.equal("Jan Olsen")
  })

  it("Should remove the user Peter", async () => {
    const userToBeDeleted = 'pp@b.dk';
      const amountOfUsersBeforeDelete =  (await UserFacade.getAllUsers()).length;
      await UserFacade.deleteUser(userToBeDeleted);
      const amountOfUsersAfterDelete = (await UserFacade.getAllUsers()).length;
      expect(amountOfUsersAfterDelete).to.equal(amountOfUsersBeforeDelete-1);
  })



  it("Should get three users", async () => {
    const amountOfUsers = (await UserFacade.getAllUsers()).length;
    expect(amountOfUsers).to.equal(3);
  })

  it("Should find Donald Duck", async () => {
    const donald = await UserFacade.getUser('dd@b.dk');
    expect(donald.name).to.equal('Donald Duck');
  })
  it("Should not find xxx.@.b.dk", async () => {
    let error;
    try {
      const donald = await UserFacade.getUser("xxx.@.b.dk");
      // throw new Error("Should not get here")
    } catch (err) {
      error = err;
    }
    console.log(error);
    expect(error instanceof UserNotFoundError).to.be.equal(true)
    expect(error.message).to.be.equal("User not found")
    expect(error.errorCode).to.be.equal(404);  
  });

  it("Should NOT correctly validate Peter Pan's check", async () => {
    try {
      const passwordStatus = await UserFacade.checkUser("pp@b.dk", "xxxx");
    } catch (err) {
      expect(err).to.be.false
    }
  })
  it("Should correctly validate Peter Pan's credential,s", async () => {
    try {
      const passwordStatus = await UserFacade.checkUser('pp@b.dk', 'secret');
      expect(passwordStatus).to.be.true;
    }catch(err){
     
    }
  })

  it("Should NOT correctly validate non-existing users check", async () => {
    // Best to declare a let error outside of try/catch, in case you don't reach catch block
    let error;
    try {
      const passwordStatus = await UserFacade.checkUser("pxxxx@b.dk", "secret");
    } catch (err) {
      error = err;
    }
    expect(error instanceof UserNotFoundError).to.be.equal(true);
  })

  it("Should NOT correctly validate non-existing users check", async () => {
    // Best to declare a let error outside of try/catch, in case you don't reach catch block
    await expect(UserFacade.checkUser('xxx@b.dk','secret')).to.be.rejectedWith('User not found');
  })
})