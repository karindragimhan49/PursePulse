import request from "supertest";
import app from "../server"; // Adjust the path to match where your app is exported

describe("Auth Controller", () => {
  it("should return 400 for missing login credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 200 for valid login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
  });
});
