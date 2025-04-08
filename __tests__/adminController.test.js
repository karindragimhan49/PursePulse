import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";

describe("Admin Controller", () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should get admin data", async () => {
    const res = await request(app).get("/api/admin");
    expect(res.status).toBe(200);
  });
});
