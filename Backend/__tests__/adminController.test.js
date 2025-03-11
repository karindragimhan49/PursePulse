const request = require("supertest");
const app = require("../server"); // Adjust path as needed
const mongoose = require("mongoose");

// Mock admin credentials
const adminCredentials = { email: "admin@example.com", password: "admin123" };

describe("Admin Controller", () => {
  it("should return 200 for valid admin login", async () => {
    const res = await request(app).post("/api/admin/login").send(adminCredentials);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should return 400 for missing credentials", async () => {
    const res = await request(app).post("/api/admin/login").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
});
