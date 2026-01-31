/**
 * Custom error classes for API error handling
 * These provide typed errors with specific HTTP status codes
 */

/**
 * 404 Not Found - Resource not found or access denied
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NOT_FOUND";
  }
}

/**
 * 400 Bad Request - Validation error with optional details
 */
export class ValidationError extends Error {
  public details?: object;

  constructor(message: string, details?: object) {
    super(message);
    this.name = "VALIDATION_ERROR";
    this.details = details;
  }
}

/**
 * 503 Service Unavailable - External service (AI) is unavailable
 */
export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AI_SERVICE_ERROR";
  }
}

/**
 * 500 Internal Server Error - Database operation failed
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DATABASE_ERROR";
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UNAUTHORIZED";
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RATE_LIMIT_EXCEEDED";
  }
}
