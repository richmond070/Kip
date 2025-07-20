import app from './src/app';
import request from 'supertest';
import mongoose from "mongoose";
import config from './src/configs/config';

beforeAll(async () => {
  // Set up: Establish connection
  if (!config.mongoDBUri) {
    throw new Error("MongoDb url not defined")
  }

  await mongoose.connect(config.mongoDBUri);
});

afterAll(async () => {
  // Teardown: Close the connection after all the test have been completed
  await mongoose.connection.close();
});

//Unit test for testing initial route
describe("GET /", () => {
  it('responds with "Welcome to unit testing guide for nodejs, typescript and express!', async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      "Welcome to unit testing guide for nodejs, typescript and express!"
    );
  });
});
