# API Endpoint Implementation Plan: Flashcards CRUD Operations

## 1. Overview

This plan covers the implementation of five RESTful API endpoints for managing flashcards in the 10x-cards application. These endpoints enable users to create, read, update, and delete flashcards, supporting both manual creation and AI-generated flashcards.

**Endpoints to implement:**

- `GET /api/flashcards` - Retrieve paginated list of user's flashcards
- `GET /api/flashcards/:id` - Retrieve a specific flashcard
- `POST /api/flashcards` - Create one or multiple flashcards
- `PUT /api/flashcards/:id` - Update an existing flashcard
- `DELETE /api/flashcards/:id` - Delete a flashcard

## 2. Request Details

### 2.1 GET /api/flashcards

**Method:** GET
**Authentication:** Required (Bearer JWT token)
**URL Pattern:** `/api/flashcards`

**Query Parameters:**

- `page` (integer, optional, default: 1) - Page number for pagination
- `limit` (integer, optional, default: 20, max: 100) - Items per page
- `source` (string, optional) - Filter by flashcard source: 'ai-full', 'ai-edited', 'manual'
- `sort` (string, optional, default: 'created_at') - Sort field: 'created_at', 'updated_at', 'front'
- `order` (string, optional, default: 'desc') - Sort order: 'asc' or 'desc'

**Request Body:** None

---

### 2.2 GET /api/flashcards/:id

**Method:** GET
**Authentication:** Required (Bearer JWT token)
**URL Pattern:** `/api/flashcards/:id`

**Path Parameters:**

- `id` (integer, required) - Flashcard ID

**Query Parameters:** None
**Request Body:** None

---

### 2.3 POST /api/flashcards

**Method:** POST
**Authentication:** Required (Bearer JWT token)
**URL Pattern:** `/api/flashcards`

**Path Parameters:** None
**Query Parameters:** None

**Request Body (Single Flashcard):**

```json
{
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "generation_id": null
}
```

**Request Body (Multiple Flashcards):**

```json
{
  "flashcards": [
    {
      "front": "Question 1",
      "back": "Answer 1",
      "source": "ai-full",
      "generation_id": 42
    },
    {
      "front": "Question 2",
      "back": "Answer 2",
      "source": "ai-edited",
      "generation_id": 42
    }
  ]
}
```

**Validation Rules:**

- `front`: Required, string, max 200 characters (after trim)
- `back`: Required, string, max 500 characters (after trim)
- `source`: Optional, enum ('manual', 'ai-full', 'ai-edited'), defaults to 'manual'
- `generation_id`: Optional, integer, required when source is 'ai-full' or 'ai-edited'
- `flashcards`: When creating multiple, array (min 1, max 100 items)

---

### 2.4 PUT /api/flashcards/:id

**Method:** PUT
**Authentication:** Required (Bearer JWT token)
**URL Pattern:** `/api/flashcards/:id`

**Path Parameters:**

- `id` (integer, required) - Flashcard ID

**Query Parameters:** None

**Request Body:**

```json
{
  "front": "Updated question text",
  "back": "Updated answer text"
}
```

**Validation Rules:**

- `front`: Optional, string, max 200 characters (after trim)
- `back`: Optional, string, max 500 characters (after trim)
- At least one field (front or back) must be provided
- Cannot modify `source` or `generation_id` fields

---

### 2.5 DELETE /api/flashcards/:id

**Method:** DELETE
**Authentication:** Required (Bearer JWT token)
**URL Pattern:** `/api/flashcards/:id`

**Path Parameters:**

- `id` (integer, required) - Flashcard ID

**Query Parameters:** None
**Request Body:** None

---

## 3. Types Used

### DTOs (Data Transfer Objects)

**FlashcardDTO** - Single flashcard response (omits user_id):

```typescript
type FlashcardDTO = Pick<
  FlashcardRow,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;
```

**PaginatedFlashcardsDTO** - Paginated list response:

```typescript
interface PaginatedFlashcardsDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}
```

**PaginationDTO** - Pagination metadata:

```typescript
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

**CreateFlashcardResponseDTO** - Single creation response:

```typescript
type CreateFlashcardResponseDTO = FlashcardDTO;
```

**CreateMultipleFlashcardsResponseDTO** - Bulk creation response:

```typescript
interface CreateMultipleFlashcardsResponseDTO {
  message: string;
  created_count: number;
  flashcards: FlashcardDTO[];
}
```

**DeleteFlashcardResponseDTO** - Deletion confirmation:

```typescript
interface DeleteFlashcardResponseDTO {
  message: string;
}
```

### Command Models (Request Input)

**CreateFlashcardCommand** - Single flashcard creation:

```typescript
type CreateFlashcardCommand = Pick<FlashcardInsert, "front" | "back" | "source" | "generation_id">;
```

**CreateMultipleFlashcardsCommand** - Bulk creation:

```typescript
interface CreateMultipleFlashcardsCommand {
  flashcards: CreateFlashcardCommand[];
}
```

**UpdateFlashcardCommand** - Update command:

```typescript
type UpdateFlashcardCommand = Pick<FlashcardUpdate, "front" | "back">;
```

### Constants

**FlashcardSource** - Source type enum:

```typescript
export const FlashcardSource = {
  Manual: "manual",
  AiFull: "ai-full",
  AiEdited: "ai-edited",
} as const;
```

---

## 4. Response Details

### 4.1 GET /api/flashcards

**Success (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual",
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z",
      "generation_id": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `400 Bad Request` - Invalid query parameters (e.g., limit > 100, invalid sort field)

---

### 4.2 GET /api/flashcards/:id

**Success (200 OK):**

```json
{
  "id": 1,
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "created_at": "2025-12-14T10:00:00Z",
  "updated_at": "2025-12-14T10:00:00Z",
  "generation_id": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Flashcard not found or not owned by user

---

### 4.3 POST /api/flashcards

**Success (201 Created) - Single Flashcard:**

```json
{
  "id": 1,
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "created_at": "2025-12-14T10:00:00Z",
  "updated_at": "2025-12-14T10:00:00Z",
  "generation_id": null
}
```

**Success (201 Created) - Multiple Flashcards:**

```json
{
  "message": "Flashcards successfully created",
  "created_count": 3,
  "flashcards": [
    {
      "id": 101,
      "front": "Question 1",
      "back": "Answer 1",
      "source": "ai-full",
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z",
      "generation_id": 42
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `400 Bad Request` - Validation errors (field length, missing required fields, too many flashcards)
- `404 Not Found` - generation_id not found or not owned by user
- `422 Unprocessable Entity` - Malformed JSON

---

### 4.4 PUT /api/flashcards/:id

**Success (200 OK):**

```json
{
  "id": 1,
  "front": "What is the capital of France?",
  "back": "Paris is the capital and most populous city of France.",
  "source": "manual",
  "created_at": "2025-12-14T10:00:00Z",
  "updated_at": "2025-12-14T10:30:00Z",
  "generation_id": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Flashcard not found or not owned by user
- `400 Bad Request` - Validation errors (field length, no fields provided)
- `422 Unprocessable Entity` - Malformed JSON

---

### 4.5 DELETE /api/flashcards/:id

**Success (200 OK):**

```json
{
  "message": "Flashcard successfully deleted"
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Flashcard not found or not owned by user

---

## 5. Data Flow

### 5.1 GET /api/flashcards (List)

```
1. Astro API Route receives request
2. Extract JWT token and validate authentication
3. Parse and validate query parameters using Zod schema
4. Call FlashcardService.getFlashcards(user_id, params)
   ├─ Build Supabase query with user_id filter
   ├─ Apply pagination (offset, limit)
   ├─ Apply optional source filter
   ├─ Apply sorting (sort field, order)
   ├─ Execute query with count: 'exact'
   └─ Map results to FlashcardDTO[]
5. Calculate pagination metadata (total_pages)
6. Return PaginatedFlashcardsDTO with 200 status
```

**Database Query Pattern:**

```typescript
await supabase
  .from("flashcards")
  .select("*", { count: "exact" })
  .eq("user_id", userId)
  .eq("source", source) // Optional filter
  .order(sort, { ascending: order === "asc" })
  .range(offset, offset + limit - 1);
```

---

### 5.2 GET /api/flashcards/:id (Single)

```
1. Astro API Route receives request
2. Extract JWT token and validate authentication
3. Parse and validate path parameter (id) using Zod schema
4. Call FlashcardService.getFlashcardById(user_id, id)
   ├─ Query Supabase with user_id AND id filters
   ├─ If not found, throw NotFoundError
   └─ Map result to FlashcardDTO
5. Return FlashcardDTO with 200 status
```

**Database Query Pattern:**

```typescript
await supabase.from("flashcards").select("*").eq("id", id).eq("user_id", userId).single();
```

---

### 5.3 POST /api/flashcards (Create)

```
1. Astro API Route receives request
2. Extract JWT token and validate authentication
3. Parse request body and detect single vs. multiple creation
4. Validate using appropriate Zod schema
5. If generation_id provided:
   ├─ Verify generation exists and belongs to user
   └─ Throw NotFoundError if invalid
6. Call appropriate service method:
   - FlashcardService.createFlashcard(user_id, data) OR
   - FlashcardService.createFlashcards(user_id, data[])
   ├─ Prepare insert data with user_id
   ├─ Execute Supabase insert with .select()
   ├─ Handle database errors
   └─ Map results to FlashcardDTO[]
7. Return appropriate response DTO with 201 status
```

**Database Query Pattern (Single):**

```typescript
await supabase
  .from("flashcards")
  .insert({
    front: data.front,
    back: data.back,
    source: data.source || "manual",
    generation_id: data.generation_id,
    user_id: userId,
  })
  .select()
  .single();
```

**Database Query Pattern (Multiple):**

```typescript
const inserts = data.map((card) => ({
  ...card,
  user_id: userId,
}));

await supabase.from("flashcards").insert(inserts).select();
```

---

### 5.4 PUT /api/flashcards/:id (Update)

```
1. Astro API Route receives request
2. Extract JWT token and validate authentication
3. Parse and validate path parameter (id) using Zod schema
4. Parse and validate request body using Zod schema
5. Call FlashcardService.updateFlashcard(user_id, id, data)
   ├─ First, verify flashcard exists and belongs to user
   ├─ Execute Supabase update with user_id filter
   ├─ If no rows affected, throw NotFoundError
   └─ Map result to FlashcardDTO
6. Return FlashcardDTO with 200 status
```

**Database Query Pattern:**

```typescript
// Verify ownership first
const { data: existing } = await supabase.from("flashcards").select("id").eq("id", id).eq("user_id", userId).single();

if (!existing) throw new NotFoundError();

// Perform update
await supabase
  .from("flashcards")
  .update({
    front: data.front,
    back: data.back,
    // updated_at handled by trigger
  })
  .eq("id", id)
  .eq("user_id", userId)
  .select()
  .single();
```

---

### 5.5 DELETE /api/flashcards/:id (Delete)

```
1. Astro API Route receives request
2. Extract JWT token and validate authentication
3. Parse and validate path parameter (id) using Zod schema
4. Call FlashcardService.deleteFlashcard(user_id, id)
   ├─ Execute Supabase delete with user_id filter
   ├─ Check affected rows count
   └─ If no rows affected, throw NotFoundError
5. Return DeleteFlashcardResponseDTO with 200 status
```

**Database Query Pattern:**

```typescript
const { error, count } = await supabase
  .from("flashcards")
  .delete({ count: "exact" })
  .eq("id", id)
  .eq("user_id", userId);

if (count === 0) throw new NotFoundError();
```

---

## 6. Security Considerations

### 6.1 Input Validation

- **Zod schemas** for all inputs (query params, path params, request body)
- **String trimming** before validation to prevent whitespace bypasses
- **Max length enforcement**: front (200 chars), back (500 chars)
- **Enum validation** for source field
- **Array size limits**: max 100 flashcards per bulk creation
- **SQL injection prevention**: Supabase client uses parameterized queries

### 6.2 Authentication

- All endpoints require valid Bearer token in Authorization header
- JWT token validation handled by Supabase auth helper
- Extract user_id from token's sub claim
- Reject requests with missing or invalid tokens (401 Unauthorized)

### 6.3 Data Security

- Never expose user_id in response DTOs
- Verify generation_id ownership before flashcard creation
- All database queries filtered by authenticated user_id

---

## 7. Error Handling

### 7.1 Error Types and Status Codes

| Error Type                | Status Code | Scenarios                                                                                                                                                                   |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unauthorized**          | 401         | Missing JWT token, invalid JWT signature, expired token                                                                                                                     |
| **Bad Request**           | 400         | Invalid query params (limit > 100, invalid sort field), validation errors (field too long, missing required fields), no update fields provided, too many flashcards (> 100) |
| **Not Found**             | 404         | Flashcard not found, flashcard not owned by user, generation_id not found/not owned                                                                                         |
| **Unprocessable Entity**  | 422         | Malformed JSON request body                                                                                                                                                 |
| **Internal Server Error** | 500         | Database connection failure, unexpected errors                                                                                                                              |

### 7.2 Error Response Format

All errors follow consistent ErrorDTO structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text exceeds maximum length of 200 characters",
    "details": {
      "field": "front",
      "max_length": 200,
      "provided_length": 250
    }
  }
}
```

### 7.3 Custom Error Classes

Use existing error classes from `src/lib/errors.ts`:

- `UnauthorizedError` - 401 status
- `ValidationError` - 400 status
- `NotFoundError` - 404 status
- `DatabaseError` - 500 status

### 7.4 Error Handler

Use existing `handleError` function from `src/lib/error-handler.ts` to:

- Catch all errors in try-catch blocks
- Map custom errors to appropriate HTTP status codes
- Format error responses consistently
- Log errors for monitoring (without exposing internals to client)

### 7.5 Validation Error Details

Zod validation errors should be transformed to include:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "issues": [
        {
          "path": ["front"],
          "message": "String must contain at most 200 character(s)"
        }
      ]
    }
  }
}
```

---

## 8. Performance Considerations

### 8.1 Database Indexes

Ensure the following indexes exist (already defined in db-plan.md):

- `user_id` column in flashcards table (critical for filtering queries)
- `generation_id` column in flashcards table (for joins and filtering)
- Composite index on `(user_id, created_at)` for common list queries

### 8.2 Query Optimization

- **Pagination**: Use `range(offset, offset + limit - 1)` instead of fetching all rows
- **Count queries**: Use `{ count: 'exact' }` only when needed (list endpoint)
- **Single queries**: Use `.single()` to enforce single-row expectation
- **Select specific fields**: If DTO only needs certain fields, use `.select('id, front, back')`

### 8.3 N+1 Query Prevention

- No joins needed for basic CRUD operations
- generation_id verification: single query, not per-flashcard
- Bulk creation: single insert with array, not multiple inserts

### 8.4 Response Size Management

- Pagination limits max response size (default 20, max 100 items)
- No full-text search on `back` field (can be large)
- Consider implementing cursor-based pagination for very large datasets (future enhancement)

---

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/validation/flashcard.schemas.ts`

Create Zod schemas for all endpoints:

1. `CreateFlashcardSchema` - single flashcard creation validation
   - Include refinement: if source is 'ai-full' or 'ai-edited', generation_id is required
2. `CreateMultipleFlashcardsSchema` - bulk creation validation
3. `UpdateFlashcardSchema` - update validation with at least one field refinement
4. `GetFlashcardsSchema` - query parameter validation for list endpoint
5. `FlashcardIdSchema` - path parameter validation

Export TypeScript types using `z.infer<>` for type safety.

---

### Step 2: Create FlashcardService

**File:** `src/services/flashcard.service.ts`

Implement service class with methods:

```typescript
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcards(userId: string, params: GetFlashcardsInput): Promise<PaginatedFlashcardsDTO>;

  async getFlashcardById(userId: string, id: number): Promise<FlashcardDTO>;

  async createFlashcard(userId: string, data: CreateFlashcardCommand): Promise<FlashcardDTO>;

  async createFlashcards(userId: string, data: CreateFlashcardCommand[]): Promise<CreateMultipleFlashcardsResponseDTO>;

  async updateFlashcard(userId: string, id: number, data: UpdateFlashcardCommand): Promise<FlashcardDTO>;

  async deleteFlashcard(userId: string, id: number): Promise<void>;

  // Helper method
  private async verifyGenerationOwnership(userId: string, generationId: number): Promise<void>;
}
```

**Key implementation details:**

- All queries must include `eq('user_id', userId)` filter
- Use `.select()` to return created/updated records
- Throw `NotFoundError` when resource not found or not owned
- Throw `DatabaseError` for database failures
- Use `verifyGenerationOwnership` helper before creating flashcards with generation_id

---

### Step 3: Implement GET /api/flashcards

**File:** `src/pages/api/flashcards/index.ts` (or `get.ts` if using file-based routing)

```typescript
export const GET: APIRoute = async (context) => {
  try {
    // 1. Extract and validate JWT
    const {
      data: { user },
    } = await context.locals.supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // 2. Validate query parameters
    const params = GetFlashcardsSchema.parse({
      page: context.url.searchParams.get("page"),
      limit: context.url.searchParams.get("limit"),
      source: context.url.searchParams.get("source"),
      sort: context.url.searchParams.get("sort"),
      order: context.url.searchParams.get("order"),
    });

    // 3. Call service
    const service = new FlashcardService(context.locals.supabase);
    const result = await service.getFlashcards(user.id, params);

    // 4. Return response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
```

---

### Step 4: Implement GET /api/flashcards/:id

**File:** `src/pages/api/flashcards/[id].ts` (or `[id]/get.ts`)

```typescript
export const GET: APIRoute = async (context) => {
  try {
    // 1. Extract and validate JWT
    const {
      data: { user },
    } = await context.locals.supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // 2. Validate path parameter
    const { id } = FlashcardIdSchema.parse({
      id: context.params.id,
    });

    // 3. Call service
    const service = new FlashcardService(context.locals.supabase);
    const flashcard = await service.getFlashcardById(user.id, id);

    // 4. Return response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
```

---

### Step 5: Implement POST /api/flashcards

**File:** `src/pages/api/flashcards/index.ts` (or `post.ts`)

```typescript
export const POST: APIRoute = async (context) => {
  try {
    // 1. Extract and validate JWT
    const {
      data: { user },
    } = await context.locals.supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // 2. Parse request body
    const body = await context.request.json();

    // 3. Detect single vs. multiple creation
    const isMultiple = "flashcards" in body;

    // 4. Validate and call appropriate service method
    const service = new FlashcardService(context.locals.supabase);
    let result;

    if (isMultiple) {
      const validated = CreateMultipleFlashcardsSchema.parse(body);
      result = await service.createFlashcards(user.id, validated.flashcards);
    } else {
      const validated = CreateFlashcardSchema.parse(body);
      result = await service.createFlashcard(user.id, validated);
    }

    // 5. Return response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
```

---

### Step 6: Implement PUT /api/flashcards/:id

**File:** `src/pages/api/flashcards/[id].ts` (or `[id]/put.ts`)

```typescript
export const PUT: APIRoute = async (context) => {
  try {
    // 1. Extract and validate JWT
    const {
      data: { user },
    } = await context.locals.supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // 2. Validate path parameter
    const { id } = FlashcardIdSchema.parse({
      id: context.params.id,
    });

    // 3. Parse and validate request body
    const body = await context.request.json();
    const validated = UpdateFlashcardSchema.parse(body);

    // 4. Call service
    const service = new FlashcardService(context.locals.supabase);
    const result = await service.updateFlashcard(user.id, id, validated);

    // 5. Return response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
```

---

### Step 7: Implement DELETE /api/flashcards/:id

**File:** `src/pages/api/flashcards/[id].ts` (or `[id]/delete.ts`)

```typescript
export const DELETE: APIRoute = async (context) => {
  try {
    // 1. Extract and validate JWT
    const {
      data: { user },
    } = await context.locals.supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // 2. Validate path parameter
    const { id } = FlashcardIdSchema.parse({
      id: context.params.id,
    });

    // 3. Call service
    const service = new FlashcardService(context.locals.supabase);
    await service.deleteFlashcard(user.id, id);

    // 4. Return response
    const response: DeleteFlashcardResponseDTO = {
      message: "Flashcard successfully deleted",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
```

---

### Step 8: Write Unit Tests

**Files:** `src/services/__tests__/flashcard.service.test.ts`

Test scenarios for FlashcardService:

1. **getFlashcards**: pagination, filtering by source, sorting, user isolation
2. **getFlashcardById**: success, not found, wrong user
3. **createFlashcard**: success, validation errors, generation_id verification
4. **createFlashcards**: bulk creation, generation_id verification, max limit
5. **updateFlashcard**: success, not found, wrong user, validation errors
6. **deleteFlashcard**: success, not found, wrong user

Use mocked Supabase client to avoid database dependencies.

---

### Step 9: Write Integration Tests

**Files:** `src/pages/api/flashcards/__tests__/flashcards.test.ts`

Test scenarios for API routes:

1. Authentication: missing token, invalid token
2. Authorization: accessing another user's flashcards
3. Validation: invalid query params, invalid request body
4. CRUD operations: end-to-end success flows
5. Error responses: proper status codes and error format

---

### Step 10: Manual Testing

Create API collection with test requests:

1. Obtain JWT token from Supabase Auth
2. Test all CRUD operations with valid data
3. Test error scenarios (404, 400, 401)
4. Test pagination and filtering
5. Test bulk creation with max limit
6. Verify user isolation (cannot access other users' flashcards)

---

### Step 11: Documentation

Update API documentation:

1. Add endpoint descriptions to README or API docs
2. Document authentication requirements
3. Provide example requests and responses
4. Document error codes and meanings

---

### Step 12: Performance Testing

1. Test pagination with large datasets (1000+ flashcards)
2. Benchmark bulk creation with 100 flashcards
3. Monitor database query performance
4. Verify indexes are being used (EXPLAIN ANALYZE in PostgreSQL)
