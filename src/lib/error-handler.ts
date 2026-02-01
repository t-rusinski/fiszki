import { ZodError } from "zod";
import {
  NotFoundError,
  ValidationError,
  ServiceUnavailableError,
  DatabaseError,
  UnauthorizedError,
  RateLimitError,
} from "./errors";
import type { ErrorDTO } from "../types";

/**
 * Centralized error handler for API routes
 * Converts various error types into standardized Response objects
 *
 * @param error - Any error thrown in API route
 * @returns Response with appropriate status code and error body
 */
export function handleApiError(error: unknown): Response {
  // Log errors in non-production environments (excluding tests)
  if (import.meta.env.MODE !== "production" && !import.meta.env.VITEST) {
    // eslint-disable-next-line no-console
    console.error("API Error:", error);
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const errorDTO: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: error.errors[0]?.message || "Validation failed",
        details: error.errors.reduce(
          (acc, err) => {
            const path = err.path.join(".");
            acc[path] = err.message;
            return acc;
          },
          {} as Record<string, unknown>
        ),
      },
    };
    return new Response(JSON.stringify(errorDTO), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Not found errors (404)
  if (error instanceof NotFoundError) {
    const errorDTO: ErrorDTO = {
      error: {
        code: error.name,
        message: error.message,
      },
    };
    return new Response(JSON.stringify(errorDTO), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validation errors (400)
  if (error instanceof ValidationError) {
    const errorDTO: ErrorDTO = {
      error: {
        code: error.name,
        message: error.message,
        details: error.details,
      },
    };
    return new Response(JSON.stringify(errorDTO), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Unauthorized errors (401)
  if (error instanceof UnauthorizedError) {
    const errorDTO: ErrorDTO = {
      error: {
        code: error.name,
        message: error.message,
      },
    };
    return new Response(JSON.stringify(errorDTO), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit errors (429)
  if (error instanceof RateLimitError) {
    const errorDTO: ErrorDTO = {
      error: {
        code: error.name,
        message: error.message,
      },
    };
    return new Response(JSON.stringify(errorDTO), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Service unavailable errors (503)
  if (error instanceof ServiceUnavailableError) {
    const errorDTO: ErrorDTO = {
      error: {
        code: error.name,
        message: error.message,
      },
    };
    return new Response(JSON.stringify(errorDTO), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Database errors (500)
  if (error instanceof DatabaseError) {
    const errorDTO: ErrorDTO = {
      error: {
        code: error.name,
        message: error.message,
      },
    };
    return new Response(JSON.stringify(errorDTO), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Default internal server error (500)
  const errorDTO: ErrorDTO = {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  };
  return new Response(JSON.stringify(errorDTO), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

// Export alias for convenience
export { handleApiError as handleError };
