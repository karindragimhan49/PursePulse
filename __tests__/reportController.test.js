describe("Report Controller", () => {
    it("should generate a report", async () => {
      const res = await request(app).get("/api/report");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
    })
  
    afterAll(async () => {
      await mongoose.connection.close()
    });
  })
  