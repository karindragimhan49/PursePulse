describe("Transaction Controller", () => {
    it("should create a transaction", async () => {
      const res = await request(app).post("/api/transaction").send({
        description: "Grocery shopping",
        amount: 50,
        type: "expense",
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("transaction");
    });
  
    afterAll(async () => {
      await mongoose.connection.close();
    });
  });
  