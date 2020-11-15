import path from "path";
require('dotenv').config({ path: path.join(process.cwd(), '.env') })
import { expect } from "chai";
import { Server } from "http";
import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import { bryptAsync } from "../src/utils/bcrypt-async-helper"
import { getConnectedClient } from "../src/config/setupDB"

import { positionCreator, getLatitudeInside, getLatitudeOutside } from "../src/utils/geoUtils"
import { USER_COLLECTION_NAME, POSITION_COLLECTION_NAME } from "../src/config/collectionNames"
import { ConsoleTransportOptions } from "winston/lib/winston/transports";

let server: Server;
const TEST_PORT = "7777"
let client: MongoClient;
const DISTANCE_TO_SEARCH = 100


describe("Verify /gameapi/getPostIfReached", () => {
  let URL: string;
  let usersCollection: any;
  let positionsCollection: any;

  //IMPORTANT --> this does now work with Mocha for ARROW-functions
  before(async function () {

    //@ts-ignore
    this.timeout(Number(process.env["MOCHA_TIMEOUT"]));

    process.env["PORT"] = TEST_PORT;
    process.env["SKIP_AUTHENTICATION"] = "1";
    process.env["DB_NAME"] = "semester_case_test"

    const client = await getConnectedClient();
    const db = client.db(process.env.DB_NAME)
    usersCollection = db.collection(USER_COLLECTION_NAME)
    positionsCollection = db.collection(POSITION_COLLECTION_NAME)

    server = require("../src/app").server;
    URL = `http://localhost:${process.env.PORT}`;
  })

  beforeEach(async () => {
    await usersCollection.deleteMany({})
    const secretHashed = await bryptAsync("secret");
    const team1 = { name: "Team1", userName: "t1", password: secretHashed, role: "team" }
    const team2 = { name: "Team2", userName: "t2", password: secretHashed, role: "team" }
    const team3 = { name: "Team3", userName: "t3", password: secretHashed, role: "team" }

    const status = await usersCollection.insertMany([team1, team2, team3])

    await positionsCollection.deleteMany({})
    await positionsCollection.createIndex({ lastUpdated: 1 }, { expireAfterSeconds: 30 })
    await positionsCollection.createIndex({ location: "2dsphere" })
    const positions = [
      positionCreator(12.48, 55.77, team1.userName, team1.name, true),
      //TODO --> Change latitude below, to a value INSIDE the radius given by DISTANCE_TO_SEARC, and the position of team1
      positionCreator(12.48, getLatitudeInside(55.77, DISTANCE_TO_SEARCH), team2.userName, team2.name, true),
      //TODO --> Change latitude below, to a value OUTSIDE the radius given by DISTANCE_TO_SEARC, and the position of team1
      positionCreator(12.48, getLatitudeOutside(55.77, DISTANCE_TO_SEARCH), team3.userName, team3.name, true)
    ]
    const locations = await positionsCollection.insertMany(positions)
  })

  after(async () => { })

  it.only("Should find team2, since inside range", async function () {
    const newPosition = { userName: "t1", password: "secret", lat: 55.77, lon: 12.48, distance: DISTANCE_TO_SEARCH }
    const config = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPosition)
    }
    const result = await fetch(`${URL}/gameapi/nearbyplayers`, config).then(r => r.json());
    expect(result.length).to.be.equal(1)
    expect(result[0].userName).to.be.equal('t2')
  })

  it("Should find team2 +team3, since both are inside range", async function () {
    const newPosition = { userName: 't1', password: 'secret', lat:55.77, lon: 12.48, distance: DISTANCE_TO_SEARCH+2}
    const config = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPosition)    
    }
    const result = await fetch(`${URL}/gameapi/nearbyplayers`, config).then(r => r.json());
    expect(result.length).to.be.equal(2)
    expect(result[0].userName).to.be.equal('t2')
  })

  xit("Should NOT find team2, since not in range", async function () {
    //TODO
  })

  xit("Should NOT find team2, since since credentials are wrong", async function () {
    //TODO
  })

  xit("Should .....", async () => {
  })


})