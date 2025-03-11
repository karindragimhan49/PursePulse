describe("Budget Controller", () => {
    it("should create a budget", async () => {
      const res = await request(app).post("/api/budget").send({
        category: "Food",
        amount: 100,
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
    });
  
    afterAll(async () => {
      await mongoose.connection.close();
    });
  });
  