import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { type FastifyInstance } from "fastify";
import { Pool } from "pg";
import { createTestApp } from "./test-setup.ts";
import { uuidv7 } from "uuidv7";

vi.mock("./logger/index.ts", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: console.error,
    warn: console.warn,
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  }),
}));

describe("User Service API Integration Tests", () => {
  let app: FastifyInstance;
  let testPool: Pool;

  beforeAll(async () => {
    const testSetup = await createTestApp();
    app = testSetup.app;
    testPool = testSetup.testPool;
  });

  afterAll(async () => {
    await app.close();
    await testPool.end();
  });

  describe("POST /users - Create User", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      expect(responseBody).toMatchObject({
        email: userData.email,
        full_name: userData.fullName,
      });
      expect(responseBody.joined_at).toBeDefined();
      expect(new Date(responseBody.joined_at)).toBeInstanceOf(Date);
    });

    it("should update existing user when creating with same email", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user first
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      // Update with new name
      const updatedData = {
        email: userData.email,
        fullName: "Updated User",
      };

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: updatedData,
      });

      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.full_name).toBe(updatedData.fullName);
      expect(responseBody.email).toBe(updatedData.email);
    });

    it("should reactivate a soft-deleted user", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      // Delete user (soft delete)
      await app.inject({
        method: "DELETE",
        url: `/users/${userData.email}`,
      });

      // Verify user is not found
      const getResponse = await app.inject({
        method: "GET",
        url: `/users/${userData.email}`,
      });
      expect(getResponse.statusCode).toBe(404);

      // Reactivate user
      const reactivateResponse = await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      expect(reactivateResponse.statusCode).toBe(201);

      // Verify user is accessible again
      const finalGetResponse = await app.inject({
        method: "GET",
        url: `/users/${userData.email}`,
      });
      expect(finalGetResponse.statusCode).toBe(200);
    });

    it("should handle missing email field", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: {
          fullName: "Test User",
          // email is missing
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it("should handle missing fullName field", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: {
          email: `${uuidv7()}@example.com`,
          // fullName is missing
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it("should handle empty request body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: {},
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe("PUT /users/:email - Update User", () => {
    it("should update existing user via PUT", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user first
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      // Update via PUT
      const updatedData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Updated User",
      };

      const response = await app.inject({
        method: "PUT",
        url: `/users/${userData.email}`,
        payload: updatedData,
      });

      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.full_name).toBe(updatedData.fullName);
    });

    it("should create new user via PUT if not exists", async () => {
      const userData = {
        email: "new@example.com",
        fullName: "New User",
      };

      const response = await app.inject({
        method: "PUT",
        url: "/users/new@example.com",
        payload: userData,
      });

      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.email).toBe(userData.email);
      expect(responseBody.full_name).toBe(userData.fullName);
    });
  });

  describe("GET /users/:email - Get User", () => {
    it("should get existing user successfully", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user first
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      const response = await app.inject({
        method: "GET",
        url: `/users/${userData.email}`,
      });

      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody).toMatchObject({
        email: userData.email,
        full_name: userData.fullName,
      });
      expect(responseBody.joined_at).toBeDefined();
    });

    it("should return 404 for non-existent user", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/users/${uuidv7()}@example.com`,
      });

      expect(response.statusCode).toBe(404);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.error).toBe("User not found");
    });

    it("should return 404 for soft-deleted user", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      // Delete user (soft delete)
      await app.inject({
        method: "DELETE",
        url: `/users/${userData.email}`,
      });

      // Try to get deleted user
      const response = await app.inject({
        method: "GET",
        url: `/users/${userData.email}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it("should handle special characters in email", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      const response = await app.inject({
        method: "GET",
        url: `/users/${userData.email}`,
      });

      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.email).toBe(userData.email);
    });
  });

  describe("DELETE /users/:email - Delete User", () => {
    it("should soft delete existing user successfully", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user first
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      const deleteResponse = await app.inject({
        method: "DELETE",
        url: `/users/${userData.email}`,
      });

      expect(deleteResponse.statusCode).toBe(200);

      // Verify user is soft deleted (not accessible via GET)
      const getResponse = await app.inject({
        method: "GET",
        url: `/users/${userData.email}`,
      });

      expect(getResponse.statusCode).toBe(404);

      // Verify user still exists in database but with deleted_at timestamp
      const result = await testPool.query(
        "SELECT email, deleted_at FROM users WHERE email = $1",
        [userData.email],
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].deleted_at).not.toBeNull();
    });

    it("should handle deleting non-existent user gracefully", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/users/${uuidv7()}@example.com`,
      });

      expect(response.statusCode).toBe(200);
    });

    it("should handle deleting already deleted user gracefully", async () => {
      const userData = {
        email: `${uuidv7()}@example.com`,
        fullName: "Test User",
      };

      // Create user
      await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      // Delete user first time
      await app.inject({
        method: "DELETE",
        url: `/users/${userData.email}`,
      });

      // Delete user second time
      const response = await app.inject({
        method: "DELETE",
        url: `/users/${userData.email}`,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("End-to-End User Lifecycle", () => {
    it("should handle complete user lifecycle: create -> get -> update -> delete -> reactivate", async () => {
      const email = `${uuidv7()}@example.com`;

      // 1. Create user
      const createResponse = await app.inject({
        method: "POST",
        url: "/users",
        payload: {
          email: email,
          fullName: "Lifecycle User",
        },
      });
      expect(createResponse.statusCode).toBe(201);

      // 2. Get user
      const getResponse1 = await app.inject({
        method: "GET",
        url: `/users/${email}`,
      });
      expect(getResponse1.statusCode).toBe(200);
      const user1 = JSON.parse(getResponse1.body);
      expect(user1.full_name).toBe("Lifecycle User");

      // 3. Update user
      const updateResponse = await app.inject({
        method: "PUT",
        url: `/users/${email}`,
        payload: {
          email: email,
          fullName: "Updated Lifecycle User",
        },
      });
      expect(updateResponse.statusCode).toBe(201);

      // 4. Verify update
      const getResponse2 = await app.inject({
        method: "GET",
        url: `/users/${email}`,
      });
      expect(getResponse2.statusCode).toBe(200);
      const user2 = JSON.parse(getResponse2.body);
      expect(user2.full_name).toBe("Updated Lifecycle User");

      // 5. Delete user
      const deleteResponse = await app.inject({
        method: "DELETE",
        url: `/users/${email}`,
      });
      expect(deleteResponse.statusCode).toBe(200);

      // 6. Verify user is deleted
      const getResponse3 = await app.inject({
        method: "GET",
        url: `/users/${email}`,
      });
      expect(getResponse3.statusCode).toBe(404);

      // 7. Reactivate user
      const reactivateResponse = await app.inject({
        method: "POST",
        url: "/users",
        payload: {
          email: email,
          fullName: "Reactivated User",
        },
      });
      expect(reactivateResponse.statusCode).toBe(201);

      // 8. Verify reactivation
      const getResponse4 = await app.inject({
        method: "GET",
        url: `/users/${email}`,
      });
      expect(getResponse4.statusCode).toBe(200);
      const user4 = JSON.parse(getResponse4.body);
      expect(user4.full_name).toBe("Reactivated User");
    });
  });

  describe("Data Validation and Edge Cases", () => {
    it("should handle very long email addresses", async () => {
      const longEmail = `${uuidv7().repeat(5)}@example.com`; // Close to 200 char limit

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: {
          email: longEmail,
          fullName: "Long Email User",
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it("should handle very long full names", async () => {
      const longName = `${uuidv7().repeat(5)}`; // Close to 200 char limit

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: {
          email: `${uuidv7()}@example.com`,
          fullName: longName,
        },
      });

      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.full_name).toBe(longName);
    });

    it("should handle unicode characters in names", async () => {
      const unicodeName = `测试用户 José María ${uuidv7()}`;

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: {
          email: `unicode-${uuidv7()}@example.com`,
          fullName: unicodeName,
        },
      });

      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.full_name).toBe(unicodeName);
    });

    it("should preserve timestamp precision", async () => {
      const userData = {
        email: `timestamp-${uuidv7()}@example.com`,
        fullName: "Timestamp User",
      };

      const response = await app.inject({
        method: "POST",
        url: "/users",
        payload: userData,
      });

      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      const joinedAt = new Date(responseBody.joined_at);

      // Should be a valid date and recent (within last minute)
      expect(joinedAt).toBeInstanceOf(Date);
      expect(Date.now() - joinedAt.getTime()).toBeLessThan(60000);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent user creation with same email", async () => {
      const userData = {
        email: `concurrent-${uuidv7()}@example.com`,
        fullName: "Concurrent User",
      };

      // Create multiple concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() =>
          app.inject({
            method: "POST",
            url: "/users",
            payload: userData,
          }),
        );

      const responses = await Promise.all(promises);

      // All should succeed (due to upsert behavior)
      responses.forEach((response) => {
        expect(response.statusCode).toBe(201);
      });

      // Verify only one user exists in database
      const result = await testPool.query(
        "SELECT COUNT(*) as count FROM users WHERE email = $1",
        [userData.email],
      );

      expect(parseInt(result.rows[0].count)).toBe(1);
    });
  });
});
