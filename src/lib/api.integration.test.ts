import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";

describe("API Integration Tests with MSW", () => {
  describe("GET /api/flashcards", () => {
    it("should fetch flashcards successfully", async () => {
      // Act
      const response = await fetch("/api/flashcards");
      const data = await response.json();

      // Assert
      expect(response.ok).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toHaveProperty("front");
      expect(data.data[0]).toHaveProperty("back");
    });

    it("should handle empty flashcards list", async () => {
      // Arrange - override handler for this test
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ data: [] });
        })
      );

      // Act
      const response = await fetch("/api/flashcards");
      const data = await response.json();

      // Assert
      expect(response.ok).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it("should handle server errors", async () => {
      // Arrange - override handler to return error
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ error: "Database connection failed" }, { status: 500 });
        })
      );

      // Act
      const response = await fetch("/api/flashcards");
      const data = await response.json();

      // Assert
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it("should handle network errors", async () => {
      // Arrange - simulate network error
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.error();
        })
      );

      // Act & Assert
      await expect(fetch("/api/flashcards")).rejects.toThrow();
    });
  });

  describe("POST /auth/v1/token", () => {
    it("should authenticate user successfully", async () => {
      // Arrange
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      // Act
      const response = await fetch("/auth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();

      // Assert
      expect(response.ok).toBe(true);
      expect(data.access_token).toBe("mock-access-token");
      expect(data.user).toHaveProperty("email", "test@example.com");
    });

    it("should handle invalid credentials", async () => {
      // Arrange - override handler for invalid credentials
      server.use(
        http.post("/auth/v1/token", () => {
          return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
        })
      );

      // Act
      const response = await fetch("/auth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "wrong@example.com",
          password: "wrongpassword",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });
  });
});
