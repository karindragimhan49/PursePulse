describe("Setting Controller", () => {
    it("should update user settings", async () => {
      const res = await request(app).put("/api/settings").send({
        theme: "dark",
        notifications: true,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
  
    afterAll(async () => {
      await mongoose.connection.close();
    });
  });
  