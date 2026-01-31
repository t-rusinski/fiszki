# Unit Test Plan - Priority Tasks

This document outlines the critical components that MUST be covered with unit tests in the fiszki project.

## Testing Guidelines

When writing unit tests for these components, strictly follow the testing practices defined in:
- `@.claude/rules/vitest-unit-testing.md`

Key principles to apply:
- Use `vi.fn()`, `vi.spyOn()`, and `vi.mock()` for test doubles
- Follow Arrange-Act-Assert pattern
- Group tests with descriptive `describe` blocks
- Leverage TypeScript type checking in tests
- Use inline snapshots for complex assertions

---

## 1. Validation Schemas (HIGH PRIORITY)

**Files to test:**
- `src/lib/validation/flashcard.schemas.ts`
- `src/lib/validation/generation.schemas.ts`

**Why:** First line of defense against bad data in the database. Validation errors can lead to data corruption or security vulnerabilities.

### Test Cases for `flashcard.schemas.ts`

#### `CreateFlashcardSchema`
- ✅ Validates front text length (min 1, max 200 characters)
- ✅ Validates back text length (min 1, max 500 characters)
- ✅ Trims whitespace from front and back
- ✅ Requires front and back fields
- ✅ Sets default source to "manual" when not provided
- ✅ Accepts valid FlashcardSource enum values (manual, ai-full, ai-edited)
- ✅ Rejects invalid source values
- ✅ **Refinement rule:** Requires generation_id when source is "ai-full"
- ✅ **Refinement rule:** Requires generation_id when source is "ai-edited"
- ✅ Allows null generation_id when source is "manual"

#### `CreateMultipleFlashcardsSchema`
- ✅ Requires at least 1 flashcard in array
- ✅ Rejects empty array
- ✅ Rejects more than 100 flashcards at once
- ✅ Validates each flashcard in array using CreateFlashcardSchema

#### `UpdateFlashcardSchema`
- ✅ Validates front max length (200 characters)
- ✅ Validates back max length (500 characters)
- ✅ Trims whitespace
- ✅ **Refinement rule:** Requires at least one field (front or back) to be provided
- ✅ Rejects update with neither front nor back

#### `GetFlashcardsSchema`
- ✅ Transforms string "page" to number with default 1
- ✅ Transforms string "limit" to number with default 20
- ✅ Validates page is positive integer
- ✅ Validates limit is positive integer
- ✅ Enforces max limit of 100
- ✅ Transforms null values to defaults
- ✅ Sets default sort to "created_at"
- ✅ Sets default order to "desc"
- ✅ Accepts valid sort values (created_at, updated_at, front)
- ✅ Accepts valid order values (asc, desc)
- ✅ Filters source by FlashcardSource enum

#### `FlashcardIdSchema`
- ✅ Transforms string ID to number
- ✅ Validates ID is positive integer
- ✅ Rejects negative or zero IDs
- ✅ Rejects non-numeric strings

### Test Cases for `generation.schemas.ts`

#### `GenerateFlashcardsSchema`
- ✅ Validates source_text min length (1000 characters)
- ✅ Validates source_text max length (10000 characters)
- ✅ Trims whitespace from source_text
- ✅ Validates model against ALLOWED_MODELS enum
- ✅ Sets default model to "mistralai/mistral-7b-instruct:free"
- ✅ Validates count is integer between 1-20
- ✅ Sets default count to 5
- ✅ Validates temperature range (0-2)
- ✅ Sets default temperature to 0.7
- ✅ Rejects invalid model names

#### `AcceptFlashcardSchema`
- ✅ Validates front text required and max 200 chars
- ✅ Validates back text required and max 500 chars
- ✅ Trims whitespace
- ✅ Requires edited boolean field

#### `AcceptGeneratedFlashcardsSchema`
- ✅ Requires at least 1 flashcard
- ✅ Rejects empty array
- ✅ Rejects more than 100 flashcards
- ✅ Validates each flashcard using AcceptFlashcardSchema

#### `GetGenerationsSchema`
- ✅ Coerces page to number with default 1
- ✅ Coerces limit to number with default 20
- ✅ Validates min/max values for page and limit
- ✅ Sets default sort to "created_at"
- ✅ Sets default order to "desc"

---

## 2. Error Handler (HIGH PRIORITY)

**File to test:**
- `src/lib/error-handler.ts`

**Why:** Central point for handling all API errors. Incorrect error conversion can lead to information leaks or wrong HTTP status codes.

### Test Cases for `handleApiError()`

#### ZodError handling
- ✅ Returns 400 status code
- ✅ Returns ErrorDTO structure with code "VALIDATION_ERROR"
- ✅ Maps Zod error details to ErrorDTO.error.details object
- ✅ Uses first error message as main message
- ✅ Sets Content-Type to application/json

#### NotFoundError handling
- ✅ Returns 404 status code
- ✅ Returns ErrorDTO with error.code = "NOT_FOUND"
- ✅ Preserves original error message

#### ValidationError handling
- ✅ Returns 400 status code
- ✅ Returns ErrorDTO with error.code = "VALIDATION_ERROR"
- ✅ Includes error.details when provided

#### UnauthorizedError handling
- ✅ Returns 401 status code
- ✅ Returns ErrorDTO with error.code = "UNAUTHORIZED"
- ✅ Preserves error message

#### RateLimitError handling
- ✅ Returns 429 status code
- ✅ Returns ErrorDTO with error.code = "RATE_LIMIT_EXCEEDED"

#### ServiceUnavailableError handling
- ✅ Returns 503 status code
- ✅ Returns ErrorDTO with error.code = "AI_SERVICE_ERROR"

#### DatabaseError handling
- ✅ Returns 500 status code
- ✅ Returns ErrorDTO with error.code = "DATABASE_ERROR"

#### Unknown error handling
- ✅ Returns 500 status code
- ✅ Returns ErrorDTO with error.code = "INTERNAL_SERVER_ERROR"
- ✅ Returns generic message "An unexpected error occurred"
- ✅ Does not leak error details

#### General
- ✅ Logs all errors to console
- ✅ Always returns Response object
- ✅ Always sets application/json Content-Type

---

## 3. Model Checker (HIGH PRIORITY)

**File to test:**
- `src/lib/model-checker.ts`

**Why:** Controls access to AI models and potentially usage costs. Errors can lead to using unavailable models or incorrect categorization.

### Test Cases for `fetchAvailableModels()`

- ✅ Fetches models from OpenRouter API with correct URL
- ✅ Sends Authorization header with Bearer token
- ✅ Returns array of ModelInfo objects on success
- ✅ Returns empty array on fetch failure
- ✅ Returns empty array on non-200 response
- ✅ Handles network errors gracefully
- ✅ Logs errors to console

### Test Cases for `isModelAvailable()`

- ✅ Returns true when model exists in fetched list
- ✅ Returns false when model does not exist in list
- ✅ Handles empty model list
- ✅ Performs exact ID matching

### Test Cases for `getFreeModels()`

- ✅ Filters models ending with ":free"
- ✅ Returns empty array when no free models available
- ✅ Returns all free models when multiple exist
- ✅ Does not include paid models

### Test Cases for `checkMultipleModels()`

- ✅ Returns correct availability map for multiple models
- ✅ Returns true for available models
- ✅ Returns false for unavailable models
- ✅ Handles mixed availability (some true, some false)
- ✅ Handles empty input array
- ✅ Returns all false when no models available

### Mocking Strategy

**Important:** Use `vi.stubGlobal('fetch', vi.fn())` to mock the global fetch function. Mock responses should follow OpenRouter API structure:

```typescript
{
  data: ModelInfo[]
}
```

---

## Execution Order

1. **Start with validation schemas** - These protect data integrity and are easier to test (pure functions)
2. **Then test error-handler** - Critical for API consistency
3. **Finally test model-checker** - Requires fetch mocking but controls AI access

## Coverage Goals

- Aim for 100% coverage on validation schemas (business critical)
- Aim for 100% coverage on error-handler (security critical)
- Aim for 90%+ coverage on model-checker (handles external API)

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test src/lib/validation/flashcard.schemas.test.ts
```
