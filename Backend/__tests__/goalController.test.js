describe("Goal Controller", () => {
    it("should create a goal", async () => {
      const res = await request(app).post("/api/goal").send({
        title: "Save for vacation",
        targetAmount: 1000,
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("goal");
    });
  
    afterAll(async () => {
      await mongoose.connection.close();
    });
  });
  