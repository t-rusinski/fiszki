# API Endpoint Implementation Plan: Generations Endpoints

## 1. Endpoint Overview

The Generations endpoints handle AI-powered flashcard generation through Openrouter.ai integration. Three endpoints work together to provide a complete workflow:

1. **POST /api/generations/generate** - Generates flashcard suggestions from source text using AI, stores metadata
2. **POST /api/generations/:id/accept** - Accepts user-selected suggestions and creates actual flashcard records
3. **GET /api/generations** - Retrieves paginated generation history for analytics

**Key Business Flow**:

- User submits source text (1000-10000 characters)
- System calls Openrouter.ai, tracks duration, calculates hash for deduplication
- Returns suggestions WITHOUT creating flashcards
- User reviews, edits if needed, then accepts selected suggestions
- System creates flashcard records with proper source attribution ('ai-full' or 'ai-edited')

## 2. Request Details

### 2.1 POST /api/generations/generate

- **HTTP Method**: POST
- **URL Structure**: `/api/generations/generate`
- **Authentication**: Required (Bearer token in Authorization header)

**Parameters**:

- Required:
  - `source_text` (string, body) - Text to generate flashcards from

**Request Body Structure**:

```typescript
{
  "source_text": string // 1000-10000 characters after trimming
}
```

**Validation Rules**:

```typescript
const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters"),
});
```

### 2.2 POST /api/generations/:id/accept

- **HTTP Method**: POST
- **URL Structure**: `/api/generations/:id/accept`
- **Path Parameters**: `id` (integer) - Generation ID
- **Authentication**: Required (Bearer token)

**Parameters**:

- Required:
  - `id` (integer, path) - Generation record ID
  - `flashcards` (array, body) - Accepted flashcards with edit status

**Request Body Structure**:

```typescript
{
  "flashcards": [
    {
      "front": string,    // max 200 chars
      "back": string,     // max 500 chars
      "edited": boolean   // true if user modified AI suggestion
    }
  ]
}
```

**Validation Rules**:

```typescript
const AcceptFlashcardSchema = z.object({
  front: z.string().trim().min(1).max(200, "Front text exceeds 200 characters"),
  back: z.string().trim().min(1).max(500, "Back text exceeds 500 characters"),
  edited: z.boolean(),
});

const AcceptGeneratedFlashcardsSchema = z.object({
  flashcards: z
    .array(AcceptFlashcardSchema)
    .min(1, "At least one flashcard must be provided")
    .max(100, "Cannot accept more than 100 flashcards at once"),
});
```

### 2.3 GET /api/generations

- **HTTP Method**: GET
- **URL Structure**: `/api/generations?page=1&limit=20&sort=created_at&order=desc`
- **Authentication**: Required (Bearer token)

**Query Parameters**:

- Optional:
  - `page` (integer, default: 1) - Page number (min: 1)
  - `limit` (integer, default: 20, max: 100) - Items per page
  - `sort` (string, default: 'created_at') - Sort field (only 'created_at' supported per spec)
  - `order` (string, default: 'desc') - Sort order ('asc' or 'desc')

**Validation Rules**:

```typescript
const GetGenerationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

## 3. Utilized Types

### DTOs (from src/types.ts)

**Command Models (Input)**:

```typescript
GenerateFlashcardsCommand;
AcceptGeneratedFlashcardsCommand;
AcceptFlashcardInput;
```

**Response DTOs (Output)**:

```typescript
GenerateFlashcardsResponseDTO;
FlashcardSuggestionDTO;
AcceptGeneratedFlashcardsResponseDTO;
FlashcardDTO;
PaginatedGenerationsDTO;
GenerationDTO;
PaginationDTO;
ErrorDTO;
```

**Internal Types (Database)**:

```typescript
CreateGenerationCommand;
CreateGenerationErrorLogCommand;
FlashcardSource;
```

### Type Mappings by Endpoint

**POST /api/generations/generate**:

- Input: `GenerateFlashcardsCommand`
- Output: `GenerateFlashcardsResponseDTO`
- Internal: `CreateGenerationCommand`, `CreateGenerationErrorLogCommand` (on error)

**POST /api/generations/:id/accept**:

- Input: `AcceptGeneratedFlashcardsCommand`
- Output: `AcceptGeneratedFlashcardsResponseDTO`
- Internal: Uses `FlashcardDTO` for created records

**GET /api/generations**:

- Output: `PaginatedGenerationsDTO`
- Internal: `GenerationDTO` for individual records

## 4. Response Details

### 4.1 POST /api/generations/generate

**Success Response (200 OK)**:

```typescript
{
  "generation_id": number,              // Created generation record ID
  "model": string,                      // AI model used (e.g., "gpt-4")
  "generated_count": number,            // Number of suggestions generated
  "generation_duration": number,        // Duration in milliseconds
  "source_text_hash": string,          // SHA-256 hash for deduplication
  "flashcardSuggestions": [
    {
      "front": string,
      "back": string
    }
  ]
}
```

**Error Responses**:

- **401 Unauthorized**: Missing or invalid JWT token
- **400 Bad Request**: Validation errors (text length out of range)
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Source text must be at least 1000 characters",
      "details": {
        "field": "source_text",
        "provided_length": 850,
        "min_length": 1000
      }
    }
  }
  ```
- **422 Unprocessable Entity**: Invalid JSON structure
- **500 Internal Server Error**: Database operation failed
- **503 Service Unavailable**: Openrouter.ai service unavailable

### 4.2 POST /api/generations/:id/accept

**Success Response (201 Created)**:

```typescript
{
  "message": "Flashcards successfully saved",
  "accepted_count": number,
  "accepted_unedited_count": number,
  "accepted_edited_count": number,
  "flashcards": FlashcardDTO[]
}
```

**Error Responses**:

- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Generation not found or not owned by user
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Generation not found or access denied"
    }
  }
  ```
- **400 Bad Request**: Validation errors (front/back length, empty array)
- **422 Unprocessable Entity**: Invalid JSON structure
- **500 Internal Server Error**: Database operation failed

### 4.3 GET /api/generations

**Success Response (200 OK)**:

```typescript
{
  "data": GenerationDTO[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "total_pages": number
  }
}
```

**Error Responses**:

- **401 Unauthorized**: Missing or invalid JWT token
- **400 Bad Request**: Invalid query parameters
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid pagination parameters",
      "details": {
        "field": "limit",
        "max_value": 100,
        "provided_value": 150
      }
    }
  }
  ```

## 5. Data Flow

### 5.1 POST /api/generations/generate Flow

```
1. Request received → Extract JWT token from Authorization header
2. Middleware authentication → Verify token, extract user_id
3. Parse request body → Validate with GenerateFlashcardsSchema
4. Prepare AI request:
   - Trim source_text, calculate SHA-256 hash
   - Get AI model from environment variable (OPENROUTER_MODEL)
   - Record generation start time
5. Call Openrouter.ai API:
   - Send source_text with prompt engineering for flashcard format
   - Set timeout (30 seconds recommended)
6. Process AI response:
   - Parse JSON response for flashcard suggestions
   - Record generation end time, calculate duration
   - Count generated flashcards
7. Store generation metadata:
   - Insert into generations table with user_id filter
   - Fields: model, generated_count, source_text_hash, source_text_length, generation_duration
8. Return response:
   - Include generation_id for later acceptance
   - Return flashcard suggestions WITHOUT creating flashcard records
9. Error handling:
   - On AI service failure: log to generation_error_logs, return 503
   - On database failure: return 500
   - On validation failure: return 400
```

**Database Operations**:

```sql
-- Store generation record
INSERT INTO generations (
  user_id, model, generated_count,
  source_text_hash, source_text_length, generation_duration
) VALUES ($1, $2, $3, $4, $5, $6)
WHERE user_id = $authenticated_user_id
RETURNING *;

-- On error: log to error table
INSERT INTO generation_error_logs (
  user_id, model, source_text_hash,
  source_text_length, error_code, error_message
) VALUES ($1, $2, $3, $4, $5, $6)
WHERE user_id = $authenticated_user_id;
```

### 5.2 POST /api/generations/:id/accept Flow

```
1. Request received → Extract JWT token and generation_id from path
2. Middleware authentication → Verify token, extract user_id
3. Parse request body → Validate with AcceptGeneratedFlashcardsSchema
4. Verify generation ownership:
   - Query: SELECT id FROM generations WHERE id = $1 AND user_id = $2
   - If not found: return 404 (prevents cross-user access)
5. Process flashcards:
   - For each flashcard, determine source:
     * edited === false → source = 'ai-full'
     * edited === true → source = 'ai-edited'
   - Count unedited and edited acceptances
6. Begin database transaction:
   a. Batch insert flashcards with generation_id and user_id
   b. Update generation record with accepted counts
   c. Commit transaction
7. Return created flashcard records with 201 status
8. Error handling:
   - On ownership verification failure: return 404
   - On validation failure: return 400
   - On database failure: rollback transaction, return 500
```

**Database Operations** (in transaction):

```sql
-- Verify ownership (CRITICAL for security)
SELECT id FROM generations
WHERE id = $1 AND user_id = $authenticated_user_id;

-- Batch insert flashcards
INSERT INTO flashcards (front, back, source, generation_id, user_id)
VALUES
  ($1, $2, $3, $4, $authenticated_user_id),
  ($5, $6, $7, $8, $authenticated_user_id)
RETURNING *;

-- Update generation statistics
UPDATE generations
SET
  accepted_unedited_count = $1,
  accepted_edited_count = $2,
  updated_at = NOW()
WHERE id = $3 AND user_id = $authenticated_user_id;
```

### 5.3 GET /api/generations Flow

```
1. Request received → Extract JWT token and query parameters
2. Middleware authentication → Verify token, extract user_id
3. Parse query parameters → Validate with GetGenerationsSchema
4. Calculate pagination:
   - offset = (page - 1) * limit
5. Query database:
   - Fetch generations with user_id filter
   - Apply sorting and pagination
   - Count total records for pagination metadata
6. Transform results:
   - Map to GenerationDTO (omit user_id for security)
   - Calculate total_pages = ceil(total / limit)
7. Return paginated response with 200 status
8. Error handling:
   - On validation failure: return 400
   - On database failure: return 500
```

**Database Operations**:

```sql
-- Fetch paginated generations
SELECT
  id, model, generated_count, generation_duration,
  source_text_hash, source_text_length,
  accepted_unedited_count, accepted_edited_count,
  created_at, updated_at
FROM generations
WHERE user_id = $authenticated_user_id
ORDER BY created_at DESC
LIMIT $limit OFFSET $offset;

-- Count total for pagination
SELECT COUNT(*) as total
FROM generations
WHERE user_id = $authenticated_user_id;
```

## 6. Security Considerations

### 6.1 Authentication & Authorization

**CRITICAL SECURITY NOTE**: RLS policies are disabled. All authorization MUST be implemented at application level.

1. **JWT Token Validation**:
   - Verify token signature using Supabase public key
   - Extract `user_id` from `sub` claim
   - Check token expiration
   - Reject requests with missing/invalid tokens (401)

2. **User ID Handling**:
   - **NEVER trust client-provided user_id**
   - Always use `user_id` extracted from JWT token
   - Include `WHERE user_id = <authenticated_user_id>` in ALL database queries

3. **Generation Ownership Verification**:
   - Before accepting flashcards, verify generation belongs to authenticated user
   - Query: `SELECT id FROM generations WHERE id = $1 AND user_id = $2`
   - Return 404 if not found (don't reveal existence to unauthorized users)

4. **Middleware Implementation**:
   ```typescript
   // Astro middleware should extract user from JWT
   const user = await context.locals.supabase.auth.getUser();
   if (!user) return new Response(null, { status: 401 });
   context.locals.user = user; // Available in API routes
   ```

### 6.2 Input Validation & Sanitization

1. **Source Text Validation**:
   - Trim whitespace before length validation
   - Enforce 1000-10000 character limits
   - Sanitize for SQL injection (use parameterized queries)
   - Consider content filtering for inappropriate content

2. **Flashcard Content Validation**:
   - Enforce length limits (front: 200, back: 500)
   - Trim whitespace
   - Validate edited boolean type

3. **Pagination Parameters**:
   - Coerce to numbers, validate ranges
   - Whitelist sort fields (only 'created_at')
   - Whitelist order values (only 'asc', 'desc')

### 6.3 API Key Security

1. **Openrouter.ai API Key**:
   - Store in environment variable (OPENROUTER_API_KEY)
   - Never expose to client-side code
   - Never return in API responses
   - Rotate periodically

2. **Environment Variables**:
   ```typescript
   OPENROUTER_API_KEY=<secret>
   OPENROUTER_MODEL=gpt-4
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
   ```

### 6.4 Rate Limiting

Per API specification:

- **AI Generation**: 10 requests per hour per user
- **Standard Endpoints**: 100 requests per minute per user

Implementation approach:

1. Store rate limit counters in Redis or database
2. Key by user_id from JWT token
3. Return 429 Too Many Requests when exceeded
4. Include rate limit headers:
   ```
   X-RateLimit-Limit: 10
   X-RateLimit-Remaining: 7
   X-RateLimit-Reset: 1702555200
   ```

### 6.5 SQL Injection Prevention

**CRITICAL**: Use parameterized queries exclusively:

```typescript
// CORRECT - Parameterized query
const { data } = await supabase.from("generations").select("*").eq("user_id", userId).eq("id", generationId);

// WRONG - String interpolation (NEVER DO THIS)
const query = `SELECT * FROM generations WHERE user_id = '${userId}'`;
```

### 6.6 Cross-Origin Security

1. **CORS Configuration**:
   - Whitelist only authorized origins
   - Require credentials for authenticated requests

2. **HTTPS Only**:
   - Enforce HTTPS in production
   - JWT tokens must never be transmitted over HTTP

## 7. Error Handling

### 7.1 Error Response Structure

All errors follow standardized format:

```typescript
{
  "error": {
    "code": string,        // Machine-readable error code
    "message": string,     // Human-readable message
    "details": object?     // Optional additional context
  }
}
```

### 7.2 Error Scenarios by Endpoint

#### POST /api/generations/generate

| Scenario                  | Status | Error Code           | Details                                 |
| ------------------------- | ------ | -------------------- | --------------------------------------- |
| Missing auth token        | 401    | UNAUTHORIZED         | "Authentication required"               |
| Invalid token             | 401    | UNAUTHORIZED         | "Invalid or expired token"              |
| Source text < 1000 chars  | 400    | VALIDATION_ERROR     | Include provided_length, min_length     |
| Source text > 10000 chars | 400    | VALIDATION_ERROR     | Include provided_length, max_length     |
| Invalid JSON              | 422    | UNPROCESSABLE_ENTITY | "Invalid request body format"           |
| Openrouter.ai timeout     | 503    | AI_SERVICE_ERROR     | "AI service request timed out"          |
| Openrouter.ai error       | 503    | AI_SERVICE_ERROR     | Include external error message          |
| Database insert failure   | 500    | DATABASE_ERROR       | "Failed to save generation record"      |
| Rate limit exceeded       | 429    | RATE_LIMIT_EXCEEDED  | "10 generations per hour limit reached" |

#### POST /api/generations/:id/accept

| Scenario                       | Status | Error Code       | Details                                    |
| ------------------------------ | ------ | ---------------- | ------------------------------------------ |
| Missing auth token             | 401    | UNAUTHORIZED     | "Authentication required"                  |
| Generation not found           | 404    | NOT_FOUND        | "Generation not found or access denied"    |
| Generation owned by other user | 404    | NOT_FOUND        | "Generation not found or access denied"    |
| Empty flashcards array         | 400    | VALIDATION_ERROR | "At least one flashcard required"          |
| Front > 200 chars              | 400    | VALIDATION_ERROR | Include field, max_length, provided_length |
| Back > 500 chars               | 400    | VALIDATION_ERROR | Include field, max_length, provided_length |
| Invalid edited type            | 400    | VALIDATION_ERROR | "edited must be boolean"                   |
| Database transaction failure   | 500    | DATABASE_ERROR   | "Failed to create flashcards"              |

#### GET /api/generations

| Scenario               | Status | Error Code       | Details                          |
| ---------------------- | ------ | ---------------- | -------------------------------- |
| Missing auth token     | 401    | UNAUTHORIZED     | "Authentication required"        |
| Invalid page number    | 400    | VALIDATION_ERROR | "page must be >= 1"              |
| Invalid limit          | 400    | VALIDATION_ERROR | "limit must be 1-100"            |
| Invalid sort field     | 400    | VALIDATION_ERROR | "sort must be 'created_at'"      |
| Invalid order value    | 400    | VALIDATION_ERROR | "order must be 'asc' or 'desc'"  |
| Database query failure | 500    | DATABASE_ERROR   | "Failed to retrieve generations" |

### 7.3 Error Logging Strategy

1. **Generation Error Logging**:
   - Log all AI service failures to `generation_error_logs` table
   - Include: user_id, model, source_text_hash, source_text_length, error_code, error_message
   - Use for analytics and debugging

2. **Application Error Logging**:
   - Log all 500 errors to application logging system
   - Include: timestamp, user_id, endpoint, request_id, stack trace

3. **Security Event Logging**:
   - Log all 401/403 errors (potential security issues)
   - Log rate limit violations

### 7.4 Error Handling Implementation

```typescript
// Service layer error handling example
async function generateFlashcards(userId: string, sourceText: string) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        /* ... */
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`Openrouter.ai error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Log error to generation_error_logs
    await logGenerationError(userId, model, sourceText, error);

    // Re-throw with appropriate error type
    if (error.name === "AbortError") {
      throw new ServiceUnavailableError("AI service request timed out");
    }
    throw new ServiceUnavailableError("AI service unavailable");
  }
}
```

## 8. Performance Considerations

### 8.1 Potential Bottlenecks

1. **AI Generation Latency**:
   - Openrouter.ai calls typically take 3-10 seconds
   - Network latency adds overhead
   - Large source texts increase processing time

2. **Database Transaction Performance**:
   - Batch flashcard insertion in acceptance endpoint
   - Multiple queries in same transaction

3. **Pagination Query Performance**:
   - COUNT(\*) queries can be slow on large tables
   - Sorting by created_at requires index

### 8.2 Optimization Strategies

#### 8.2.1 AI Service Optimization

1. **Timeout Configuration**:

   ```typescript
   const AI_GENERATION_TIMEOUT = 30000; // 30 seconds
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), AI_GENERATION_TIMEOUT);
   ```

2. **Retry Strategy**:
   - Implement exponential backoff for transient failures
   - Max 2 retries with 1s, 2s delays
   - Don't retry on validation errors (4xx)

3. **Response Streaming** (future enhancement):
   - Consider Server-Sent Events for real-time progress updates
   - Stream flashcards as they're generated

#### 8.2.2 Database Optimization

1. **Indexes** (verify exist per db-plan.md):

   ```sql
   CREATE INDEX idx_generations_user_id ON generations(user_id);
   CREATE INDEX idx_generations_created_at ON generations(created_at);
   CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
   ```

2. **Batch Insertions**:

   ```typescript
   // Use single INSERT with multiple VALUE rows
   await supabase.from("flashcards").insert(flashcardsArray);
   ```

3. **Query Optimization**:
   ```typescript
   // Combine count and data fetch if possible
   const { data, count } = await supabase
     .from("generations")
     .select("*", { count: "exact" })
     .eq("user_id", userId)
     .order("created_at", { ascending: false })
     .range(offset, offset + limit - 1);
   ```

#### 8.2.3 Caching Strategy

Per API specification:

- **Generation History**: Cache for 1 minute per user
- **Statistics**: Not applicable to these endpoints

Implementation:

```typescript
// In-memory cache with TTL (consider Redis for production)
const generationCache = new Map();
const CACHE_TTL = 60000; // 1 minute

function getCachedGenerations(userId: string, cacheKey: string) {
  const cached = generationCache.get(`${userId}:${cacheKey}`);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

#### 8.2.4 Connection Pooling

- Supabase client handles connection pooling automatically
- Ensure single Supabase client instance per application
- Don't create new clients per request

## 9. Implementation Steps

### Step 1: Setup Environment Configuration

**Files to modify**: `.env`, `src/env.d.ts`

1. Add environment variables to `.env`:

   ```env
   OPENROUTER_API_KEY=your_api_key_here
   OPENROUTER_MODEL=gpt-4
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
   ```

2. Update `src/env.d.ts` to include type definitions:
   ```typescript
   interface ImportMetaEnv {
     readonly OPENROUTER_API_KEY: string;
     readonly OPENROUTER_MODEL: string;
     readonly OPENROUTER_API_URL: string;
   }
   ```

### Step 2: Create Validation Schemas

**New file**: `src/lib/validation/generation.schemas.ts`

1. Install Zod if not already: `npm install zod`
2. Create Zod schemas for all three endpoints:

   ```typescript
   import { z } from "zod";

   export const GenerateFlashcardsSchema = z.object({
     source_text: z
       .string()
       .trim()
       .min(1000, "Source text must be at least 1000 characters")
       .max(10000, "Source text must not exceed 10000 characters"),
   });

   export const AcceptFlashcardSchema = z.object({
     front: z.string().trim().min(1).max(200),
     back: z.string().trim().min(1).max(500),
     edited: z.boolean(),
   });

   export const AcceptGeneratedFlashcardsSchema = z.object({
     flashcards: z
       .array(AcceptFlashcardSchema)
       .min(1, "At least one flashcard must be provided")
       .max(100, "Cannot accept more than 100 flashcards at once"),
   });

   export const GetGenerationsSchema = z.object({
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(20),
     sort: z.enum(["created_at"]).default("created_at"),
     order: z.enum(["asc", "desc"]).default("desc"),
   });
   ```

### Step 3: Create Generation Service

**New file**: `src/services/generation.service.ts`

1. Implement service methods for:
   - `generateFlashcards(userId, sourceText)` - AI generation logic
   - `acceptGeneration(userId, generationId, flashcards)` - Acceptance logic
   - `getGenerations(userId, pagination)` - List retrieval
   - `logGenerationError(userId, model, sourceText, error)` - Error logging

2. Key implementation details:

   ```typescript
   import crypto from "crypto";
   import type { SupabaseClient } from "src/db/supabase.client";

   export class GenerationService {
     constructor(private supabase: SupabaseClient) {}

     async generateFlashcards(userId: string, sourceText: string) {
       // Calculate hash
       const hash = crypto.createHash("sha256").update(sourceText).digest("hex");

       // Track time
       const startTime = Date.now();

       // Call Openrouter.ai
       const suggestions = await this.callOpenRouter(sourceText);

       const duration = Date.now() - startTime;

       // Store generation record
       const { data: generation } = await this.supabase
         .from("generations")
         .insert({
           user_id: userId,
           model: import.meta.env.OPENROUTER_MODEL,
           generated_count: suggestions.length,
           source_text_hash: hash,
           source_text_length: sourceText.trim().length,
           generation_duration: duration,
         })
         .select()
         .single();

       return {
         generation_id: generation.id,
         model: generation.model,
         generated_count: suggestions.length,
         generation_duration: duration,
         source_text_hash: hash,
         flashcardSuggestions: suggestions,
       };
     }

     private async callOpenRouter(sourceText: string) {
       // Implement Openrouter.ai API call
       // Include timeout, error handling
       // Parse and validate response format
     }

     async acceptGeneration(userId: string, generationId: number, flashcards: AcceptFlashcardInput[]) {
       // Verify ownership
       const { data: generation } = await this.supabase
         .from("generations")
         .select("id")
         .eq("id", generationId)
         .eq("user_id", userId)
         .single();

       if (!generation) {
         throw new NotFoundError("Generation not found or access denied");
       }

       // Count edited vs unedited
       const unedited = flashcards.filter((f) => !f.edited).length;
       const edited = flashcards.filter((f) => f.edited).length;

       // Batch insert flashcards
       const flashcardInserts = flashcards.map((f) => ({
         front: f.front,
         back: f.back,
         source: f.edited ? "ai-edited" : "ai-full",
         generation_id: generationId,
         user_id: userId,
       }));

       const { data: created } = await this.supabase.from("flashcards").insert(flashcardInserts).select();

       // Update generation statistics
       await this.supabase
         .from("generations")
         .update({
           accepted_unedited_count: unedited,
           accepted_edited_count: edited,
         })
         .eq("id", generationId)
         .eq("user_id", userId);

       return {
         message: "Flashcards successfully saved",
         accepted_count: flashcards.length,
         accepted_unedited_count: unedited,
         accepted_edited_count: edited,
         flashcards: created,
       };
     }

     async getGenerations(userId: string, params: PaginationParams) {
       const offset = (params.page - 1) * params.limit;

       const { data, count } = await this.supabase
         .from("generations")
         .select("*", { count: "exact" })
         .eq("user_id", userId)
         .order(params.sort, { ascending: params.order === "asc" })
         .range(offset, offset + params.limit - 1);

       return {
         data: data || [],
         pagination: {
           page: params.page,
           limit: params.limit,
           total: count || 0,
           total_pages: Math.ceil((count || 0) / params.limit),
         },
       };
     }

     async logGenerationError(userId: string, model: string, sourceText: string, error: Error) {
       const hash = crypto.createHash("sha256").update(sourceText).digest("hex");

       await this.supabase.from("generation_error_logs").insert({
         user_id: userId,
         model,
         source_text_hash: hash,
         source_text_length: sourceText.trim().length,
         error_code: error.name || "UNKNOWN_ERROR",
         error_message: error.message,
       });
     }
   }
   ```

### Step 4: Create Error Classes

**New file**: `src/lib/errors.ts`

1. Define custom error classes for different scenarios:

   ```typescript
   export class NotFoundError extends Error {
     constructor(message: string) {
       super(message);
       this.name = "NOT_FOUND";
     }
   }

   export class ValidationError extends Error {
     constructor(
       message: string,
       public details?: object
     ) {
       super(message);
       this.name = "VALIDATION_ERROR";
     }
   }

   export class ServiceUnavailableError extends Error {
     constructor(message: string) {
       super(message);
       this.name = "AI_SERVICE_ERROR";
     }
   }
   ```

### Step 5: Implement API Route Handlers

**New files**:

- `src/pages/api/generations/generate.ts`
- `src/pages/api/generations/[id]/accept.ts`
- `src/pages/api/generations/index.ts`

1. Create Astro API route for POST /api/generations/generate:

   ```typescript
   import type { APIRoute } from "astro";
   import { GenerationService } from "src/services/generation.service";
   import { GenerateFlashcardsSchema } from "src/lib/validation/generation.schemas";

   export const POST: APIRoute = async ({ request, locals }) => {
     try {
       // Authenticate
       const user = locals.user;
       if (!user) {
         return new Response(
           JSON.stringify({
             error: {
               code: "UNAUTHORIZED",
               message: "Authentication required",
             },
           }),
           { status: 401 }
         );
       }

       // Parse and validate
       const body = await request.json();
       const validated = GenerateFlashcardsSchema.parse(body);

       // Generate flashcards
       const service = new GenerationService(locals.supabase);
       const result = await service.generateFlashcards(user.id, validated.source_text);

       return new Response(JSON.stringify(result), { status: 200 });
     } catch (error) {
       // Handle errors (see step 6)
     }
   };
   ```

2. Create Astro API route for POST /api/generations/[id]/accept
3. Create Astro API route for GET /api/generations

### Step 6: Implement Error Handling Middleware

**New file**: `src/lib/error-handler.ts`

1. Create centralized error handler:

   ```typescript
   import { ZodError } from "zod";
   import { NotFoundError, ValidationError, ServiceUnavailableError } from "./errors";

   export function handleApiError(error: unknown): Response {
     console.error("API Error:", error);

     if (error instanceof ZodError) {
       return new Response(
         JSON.stringify({
           error: {
             code: "VALIDATION_ERROR",
             message: error.errors[0].message,
             details: error.errors,
           },
         }),
         { status: 400 }
       );
     }

     if (error instanceof NotFoundError) {
       return new Response(
         JSON.stringify({
           error: {
             code: error.name,
             message: error.message,
           },
         }),
         { status: 404 }
       );
     }

     if (error instanceof ServiceUnavailableError) {
       return new Response(
         JSON.stringify({
           error: {
             code: error.name,
             message: error.message,
           },
         }),
         { status: 503 }
       );
     }

     // Default 500 error
     return new Response(
       JSON.stringify({
         error: {
           code: "INTERNAL_SERVER_ERROR",
           message: "An unexpected error occurred",
         },
       }),
       { status: 500 }
     );
   }
   ```

### Step 7: Add Authentication Middleware

**File to modify**: `src/middleware/index.ts`

1. Verify JWT token and extract user:

   ```typescript
   import { defineMiddleware } from "astro:middleware";

   export const onRequest = defineMiddleware(async (context, next) => {
     const {
       data: { user },
       error,
     } = await context.locals.supabase.auth.getUser();

     if (context.url.pathname.startsWith("/api/") && !user) {
       return new Response(
         JSON.stringify({
           error: {
             code: "UNAUTHORIZED",
             message: "Authentication required",
           },
         }),
         { status: 401 }
       );
     }

     context.locals.user = user;
     return next();
   });
   ```

### Step 8: Implement Rate Limiting

**New file**: `src/lib/rate-limiter.ts`

1. Create rate limiter for AI generation endpoint:

   ```typescript
   const rateLimits = new Map<string, { count: number; resetAt: number }>();

   export function checkRateLimit(userId: string, maxRequests: number, windowMs: number): boolean {
     const now = Date.now();
     const userLimit = rateLimits.get(userId);

     if (!userLimit || now > userLimit.resetAt) {
       rateLimits.set(userId, {
         count: 1,
         resetAt: now + windowMs,
       });
       return true;
     }

     if (userLimit.count >= maxRequests) {
       return false;
     }

     userLimit.count++;
     return true;
   }

   export function getRateLimitHeaders(userId: string, maxRequests: number) {
     const userLimit = rateLimits.get(userId);
     return {
       "X-RateLimit-Limit": maxRequests.toString(),
       "X-RateLimit-Remaining": userLimit ? (maxRequests - userLimit.count).toString() : maxRequests.toString(),
       "X-RateLimit-Reset": userLimit?.resetAt.toString() || "0",
     };
   }
   ```

2. Apply to generate endpoint:
   ```typescript
   // In generate.ts
   const allowed = checkRateLimit(user.id, 10, 3600000); // 10 per hour
   if (!allowed) {
     return new Response(
       JSON.stringify({
         error: {
           code: "RATE_LIMIT_EXCEEDED",
           message: "10 generations per hour limit reached",
         },
       }),
       {
         status: 429,
         headers: getRateLimitHeaders(user.id, 10),
       }
     );
   }
   ```

### Step 11: Documentation

**Files to create/update**:

1. Update API documentation with actual endpoint URLs
2. Create OpenAPI/Swagger specification (optional)
3. Add JSDoc comments to service methods
4. Update README with setup instructions

### Step 12: Deployment Checklist

1. **Environment Variables**:
   - Verify all env vars set in production
   - Rotate API keys if needed

2. **Database Migrations**:
   - Verify indexes exist (see db-plan.md)
   - Verify RLS disabled configuration

3. **Security Audit**:
   - Verify all queries include user_id filters
   - Verify authentication on all endpoints
   - Verify rate limiting works
   - Verify CORS configuration

4. **Rollback Plan**:
   - Document rollback procedure
   - Keep previous version deployable
   - Have database backup strategy

---

## Summary

This implementation plan covers all aspects of the generations endpoints:

- Three endpoints working together for AI flashcard generation workflow, on developement stage use a mock AI service
- Comprehensive security with application-level authorization
- Input validation using Zod schemas
- Service layer separation for maintainability
- Error handling with standardized responses
- Performance optimizations including caching and indexes
- Rate limiting for cost control
- Detailed step-by-step implementation guide

**Critical security reminder**: With RLS disabled, every database query MUST include `WHERE user_id = <authenticated_user_id>` to prevent data leakage between users.
