import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ZodError, z } from "zod";
import { handleApiError } from "./error-handler";
import {
  NotFoundError,
  ValidationError,
  ServiceUnavailableError,
  DatabaseError,
  UnauthorizedError,
  RateLimitError,
} from "./errors";
import type { ErrorDTO } from "../types";

describe("handleApiError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("ZodError handling", () => {
    it("returns 400 status code", () => {
      const schema = z.object({ name: z.string() });
      const error = schema.safeParse({ name: 123 }).error as ZodError;

      const response = handleApiError(error);

      expect(response.status).toBe(400);
    });

    it("returns ErrorDTO structure with code 'VALIDATION_ERROR'", async () => {
      const schema = z.object({ name: z.string() });
      const error = schema.safeParse({ name: 123 }).error as ZodError;

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("maps Zod error details to ErrorDTO.error.details object", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const error = schema.safeParse({ name: 123, age: "not-a-number" }).error as ZodError;

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.details).toBeDefined();
      expect(body.error.details).toHaveProperty("name");
      expect(body.error.details).toHaveProperty("age");
    });

    it("uses first error message as main message", async () => {
      const schema = z.object({
        name: z.string().min(5, "Name too short"),
      });
      const error = schema.safeParse({ name: "abc" }).error as ZodError;

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("Name too short");
    });

    it("sets Content-Type to application/json", () => {
      const schema = z.object({ name: z.string() });
      const error = schema.safeParse({ name: 123 }).error as ZodError;

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("handles nested Zod error paths", async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
        }),
      });
      const error = schema.safeParse({ user: { name: 123 } }).error as ZodError;

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.details).toHaveProperty("user.name");
    });
  });

  describe("NotFoundError handling", () => {
    it("returns 404 status code", () => {
      const error = new NotFoundError("Resource not found");

      const response = handleApiError(error);

      expect(response.status).toBe(404);
    });

    it("returns ErrorDTO with error.code = 'NOT_FOUND'", async () => {
      const error = new NotFoundError("Resource not found");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("preserves original error message", async () => {
      const error = new NotFoundError("Flashcard not found");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("Flashcard not found");
    });

    it("sets Content-Type to application/json", () => {
      const error = new NotFoundError("Resource not found");

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("ValidationError handling", () => {
    it("returns 400 status code", () => {
      const error = new ValidationError("Invalid input");

      const response = handleApiError(error);

      expect(response.status).toBe(400);
    });

    it("returns ErrorDTO with error.code = 'VALIDATION_ERROR'", async () => {
      const error = new ValidationError("Invalid input");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("includes error.details when provided", async () => {
      const details = { field: "email", reason: "invalid format" };
      const error = new ValidationError("Invalid email", details);

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.details).toEqual(details);
    });

    it("preserves error message", async () => {
      const error = new ValidationError("Custom validation error");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("Custom validation error");
    });

    it("sets Content-Type to application/json", () => {
      const error = new ValidationError("Invalid input");

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("UnauthorizedError handling", () => {
    it("returns 401 status code", () => {
      const error = new UnauthorizedError();

      const response = handleApiError(error);

      expect(response.status).toBe(401);
    });

    it("returns ErrorDTO with error.code = 'UNAUTHORIZED'", async () => {
      const error = new UnauthorizedError();

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("preserves error message", async () => {
      const error = new UnauthorizedError("Invalid token");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("Invalid token");
    });

    it("uses default message when not provided", async () => {
      const error = new UnauthorizedError();

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("Authentication required");
    });

    it("sets Content-Type to application/json", () => {
      const error = new UnauthorizedError();

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("RateLimitError handling", () => {
    it("returns 429 status code", () => {
      const error = new RateLimitError("Too many requests");

      const response = handleApiError(error);

      expect(response.status).toBe(429);
    });

    it("returns ErrorDTO with error.code = 'RATE_LIMIT_EXCEEDED'", async () => {
      const error = new RateLimitError("Too many requests");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("preserves error message", async () => {
      const error = new RateLimitError("Rate limit exceeded, try again later");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("Rate limit exceeded, try again later");
    });

    it("sets Content-Type to application/json", () => {
      const error = new RateLimitError("Too many requests");

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("ServiceUnavailableError handling", () => {
    it("returns 503 status code", () => {
      const error = new ServiceUnavailableError("AI service unavailable");

      const response = handleApiError(error);

      expect(response.status).toBe(503);
    });

    it("returns ErrorDTO with error.code = 'AI_SERVICE_ERROR'", async () => {
      const error = new ServiceUnavailableError("AI service unavailable");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("AI_SERVICE_ERROR");
    });

    it("preserves error message", async () => {
      const error = new ServiceUnavailableError("OpenRouter API is down");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("OpenRouter API is down");
    });

    it("sets Content-Type to application/json", () => {
      const error = new ServiceUnavailableError("AI service unavailable");

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("DatabaseError handling", () => {
    it("returns 500 status code", () => {
      const error = new DatabaseError("Database connection failed");

      const response = handleApiError(error);

      expect(response.status).toBe(500);
    });

    it("returns ErrorDTO with error.code = 'DATABASE_ERROR'", async () => {
      const error = new DatabaseError("Database connection failed");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("DATABASE_ERROR");
    });

    it("preserves error message", async () => {
      const error = new DatabaseError("Failed to insert record");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("Failed to insert record");
    });

    it("sets Content-Type to application/json", () => {
      const error = new DatabaseError("Database error");

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Unknown error handling", () => {
    it("returns 500 status code", () => {
      const error = new Error("Unknown error");

      const response = handleApiError(error);

      expect(response.status).toBe(500);
    });

    it("returns ErrorDTO with error.code = 'INTERNAL_SERVER_ERROR'", async () => {
      const error = new Error("Unknown error");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("returns generic message 'An unexpected error occurred'", async () => {
      const error = new Error("Some internal error with sensitive data");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).toBe("An unexpected error occurred");
    });

    it("does not leak error details", async () => {
      const error = new Error("Database connection string: postgres://...");

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(body.error.message).not.toContain("Database connection string");
      expect(body.error.message).not.toContain("postgres://");
    });

    it("sets Content-Type to application/json", () => {
      const error = new Error("Unknown error");

      const response = handleApiError(error);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("handles non-Error objects", async () => {
      const error = "String error";

      const response = handleApiError(error);
      const body = (await response.json()) as ErrorDTO;

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });

    it("handles null error", async () => {
      const response = handleApiError(null);
      const body = (await response.json()) as ErrorDTO;

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });

    it("handles undefined error", async () => {
      const response = handleApiError(undefined);
      const body = (await response.json()) as ErrorDTO;

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });
  });

  describe("General behavior", () => {
    it("logs all errors to console", () => {
      const error = new NotFoundError("Test error");

      handleApiError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith("API Error:", error);
    });

    it("always returns Response object", () => {
      const errors = [
        new ZodError([]),
        new NotFoundError("Not found"),
        new ValidationError("Validation error"),
        new UnauthorizedError(),
        new RateLimitError("Rate limit"),
        new ServiceUnavailableError("Service down"),
        new DatabaseError("DB error"),
        new Error("Unknown"),
      ];

      errors.forEach((error) => {
        const response = handleApiError(error);
        expect(response).toBeInstanceOf(Response);
      });
    });

    it("always sets application/json Content-Type", () => {
      const errors = [
        new ZodError([]),
        new NotFoundError("Not found"),
        new ValidationError("Validation error"),
        new UnauthorizedError(),
        new RateLimitError("Rate limit"),
        new ServiceUnavailableError("Service down"),
        new DatabaseError("DB error"),
        new Error("Unknown"),
      ];

      errors.forEach((error) => {
        const response = handleApiError(error);
        expect(response.headers.get("Content-Type")).toBe("application/json");
      });
    });
  });
});
