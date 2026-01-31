# REST API Plan for 10x-cards

**⚠️ SECURITY NOTE**: Row-Level Security (RLS) policies are disabled on flashcards, generations, and generation_error_logs tables. All authorization must be implemented at the application level. See section 3 (Authentication and Authorization) for critical implementation details.

## 1. Resources

| Resource          | Database Table        | Description                                                     |
| ----------------- | --------------------- | --------------------------------------------------------------- |
| Flashcards        | flashcards            | User-created or AI-generated flashcards with front/back content |
| Generations       | generations           | Metadata about AI generation sessions                           |
| Generation Errors | generation_error_logs | Error tracking for failed AI generation attempts                |
| Users             | users                 | User accounts (managed by Supabase Auth)                        |

## 2. Endpoints

### 2.1 Authentication

Authentication is handled by Supabase Auth. The application uses Supabase's built-in endpoints:

- `POST /auth/v1/signup` - User registration
- `POST /auth/v1/token?grant_type=password` - User login
- `POST /auth/v1/logout` - User logout
- `POST /auth/v1/recover` - Password recovery

All subsequent API endpoints require authentication via Bearer token (JWT) in the Authorization header.

#### DELETE /api/auth/account

Delete user account and all associated data.

**Authentication**: Required (Bearer token)

**Request Body**: None

**Success Response (200 OK)**:

```json
{
  "message": "Account and all associated data successfully deleted"
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Database deletion failed

### 2.2 Flashcards

#### GET /api/flashcards

Retrieve a paginated list of user's flashcards.

**Authentication**: Required (Bearer token)

**Query Parameters**:

- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `source` (string, optional) - Filter by source: 'ai-full', 'ai-edited', 'manual'
- `sort` (string, default: 'created_at') - Sort field: 'created_at', 'updated_at', 'front'
- `order` (string, default: 'desc') - Sort order: 'asc', 'desc'

**Success Response (200 OK)**:

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

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid query parameters

#### GET /api/flashcards/:id

Retrieve a specific flashcard by ID.

**Authentication**: Required (Bearer token)

**Path Parameters**:

- `id` (integer) - Flashcard ID

**Success Response (200 OK)**:

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

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Flashcard not found or not owned by user

#### POST /api/flashcards

Create one or multiple flashcards. Used for manual creation and for saving AI-generated flashcards.

**Authentication**: Required (Bearer token)

**Request Body (Single Flashcard)**:

```json
{
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "generation_id": null
}
```

**Request Body (Multiple Flashcards)**:

```json
{
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "ai-full",
      "generation_id": 42
    },
    {
      "front": "Which city is the most populous in France?",
      "back": "Paris is the most populous city in France.",
      "source": "ai-edited",
      "generation_id": 42
    },
    {
      "front": "Manual flashcard",
      "back": "Created by user",
      "source": "manual",
      "generation_id": null
    }
  ]
}
```

**Validation**:

- `front`: Required, string, max 200 characters
- `back`: Required, string, max 500 characters
- `source`: Optional, string, one of: 'manual', 'ai-full', 'ai-edited' (default: 'manual')
- `generation_id`: Optional, integer, reference to generations table (required when source is 'ai-full' or 'ai-edited')
- `flashcards`: When creating multiple, array of flashcard objects (max 100 cards per request)

**Success Response (201 Created) - Single Flashcard**:

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

**Success Response (201 Created) - Multiple Flashcards**:

```json
{
  "message": "Flashcards successfully created",
  "created_count": 3,
  "flashcards": [
    {
      "id": 101,
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "ai-full",
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z",
      "generation_id": 42
    },
    {
      "id": 102,
      "front": "Which city is the most populous in France?",
      "back": "Paris is the most populous city in France.",
      "source": "ai-edited",
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z",
      "generation_id": 42
    },
    {
      "id": 103,
      "front": "Manual flashcard",
      "back": "Created by user",
      "source": "manual",
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z",
      "generation_id": null
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Validation errors (missing fields, exceeding character limits, invalid source value, too many flashcards)
- `404 Not Found`: generation_id not found or not owned by user
- `422 Unprocessable Entity`: Invalid data format

#### PUT /api/flashcards/:id

Update an existing flashcard.

**Authentication**: Required (Bearer token)

**Path Parameters**:

- `id` (integer) - Flashcard ID

**Request Body**:

```json
{
  "front": "What is the capital of France?",
  "back": "Paris is the capital and most populous city of France."
}
```

**Validation**:

- `front`: Optional, string, max 200 characters
- `back`: Optional, string, max 500 characters
- `source`: Must be one of 'manual', 'ai-edited' (cannot be changed)
- At least one field must be provided

**Success Response (200 OK)**:

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

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Flashcard not found or not owned by user
- `400 Bad Request`: Validation errors
- `422 Unprocessable Entity`: Invalid data format

#### DELETE /api/flashcards/:id

Delete a flashcard permanently.

**Authentication**: Required (Bearer token)

**Path Parameters**:

- `id` (integer) - Flashcard ID

**Success Response (200 OK)**:

```json
{
  "message": "Flashcard successfully deleted"
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Flashcard not found or not owned by user

### 2.3 Generations

#### POST /api/generations/generate

Generate flashcard suggestions from source text using AI.

**Authentication**: Required (Bearer token)

**Request Body**:

```json
{
  "source_text": "Paris is the capital and most populous city of France..."
}
```

**Validation**:

- `source_text`: Required, string, min 1000 characters, max 10000 characters

**Note**: The AI model is configured on the backend and cannot be selected by the user.

**Success Response (200 OK)**:

```json
{
  "generation_id": 42,
  "model": "gpt-4",
  "generated_count": 5,
  "generation_duration": 3450,
  "source_text_hash": "a3f2b8c9d1e5f6a7b8c9d0e1f2a3b4c5",
  "flashcardSuggestions": [
    {
      "front": "What is the capital of France?",
      "back": "Paris"
    },
    {
      "front": "Which city is the most populous in France?",
      "back": "Paris"
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Validation errors (text length out of range)
- `422 Unprocessable Entity`: Invalid data format
- `500 Internal Server Error`: AI generation failed
- `503 Service Unavailable`: External AI service unavailable

**Business Logic**:

- Calculate SHA-256 hash of source_text for deduplication tracking
- Record generation start time
- Call Openrouter.ai API with source_text and model
- Record generation end time and calculate duration
- Save generation metadata to `generations` table
- Return flashcard suggestions without saving flashcards (user will accept/reject later)
- On error, log to `generation_error_logs` table

#### POST /api/generations/:id/accept

Accept generated flashcard suggestions and save them to user's collection.

**Authentication**: Required (Bearer token)

**Path Parameters**:

- `id` (integer) - Generation ID

**Request Body**:

```json
{
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris",
      "edited": false
    },
    {
      "front": "Which city is the most populous in France?",
      "back": "Paris is the most populous city in France with over 2 million inhabitants.",
      "edited": true
    }
  ]
}
```

**Validation**:

- `flashcards`: Required, array of objects
- `flashcards[].front`: Required, string, max 200 characters
- `flashcards[].back`: Required, string, max 500 characters
- `flashcards[].edited`: Required, boolean

**Success Response (201 Created)**:

```json
{
  "message": "Flashcards successfully saved",
  "accepted_count": 2,
  "accepted_unedited_count": 1,
  "accepted_edited_count": 1,
  "flashcards": [
    {
      "id": 101,
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "ai-full",
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z",
      "generation_id": 42
    },
    {
      "id": 102,
      "front": "Which city is the most populous in France?",
      "back": "Paris is the most populous city in France with over 2 million inhabitants.",
      "source": "ai-edited",
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z",
      "generation_id": 42
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Generation not found or not owned by user
- `400 Bad Request`: Validation errors
- `422 Unprocessable Entity`: Invalid data format

**Business Logic**:

- Verify generation belongs to authenticated user
- For each flashcard, set `source` based on `edited` flag:
  - `edited: false` → `source: 'ai-full'`
  - `edited: true` → `source: 'ai-edited'`
- Create flashcard records with `generation_id` reference
- Update generation record with `accepted_unedited_count` and `accepted_edited_count`

#### GET /api/generations

Retrieve paginated list of user's generation history.

**Authentication**: Required (Bearer token)

**Query Parameters**:

- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `sort` (string, default: 'created_at') - Sort field: 'created_at'
- `order` (string, default: 'desc') - Sort order: 'asc', 'desc'

**Success Response (200 OK)**:

```json
{
  "data": [
    {
      "id": 42,
      "model": "gpt-4",
      "generated_count": 5,
      "accepted_unedited_count": 1,
      "accepted_edited_count": 1,
      "source_text_hash": "a3f2b8c9d1e5f6a7b8c9d0e1f2a3b4c5",
      "source_text_length": 2500,
      "generation_duration": 3450,
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:02:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid query parameters

### 2.4 Statistics

#### GET /api/statistics/generations

Get aggregated statistics about AI flashcard generation.

**Authentication**: Required (Bearer token)

**Query Parameters**:

- `period` (string, optional) - Time period: '7d', '30d', '90d', 'all' (default: 'all')

**Success Response (200 OK)**:

```json
{
  "total_generations": 25,
  "total_generated_flashcards": 125,
  "total_accepted_flashcards": 95,
  "total_accepted_unedited": 70,
  "total_accepted_edited": 25,
  "acceptance_rate": 76.0,
  "edit_rate": 26.3,
  "average_generation_duration": 3250,
  "models_used": {
    "gpt-4": 15,
    "gpt-3.5-turbo": 10
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid query parameters

**Business Logic**:

- Aggregate data from `generations` table for authenticated user
- Calculate acceptance rate: (total_accepted / total_generated) \* 100
- Calculate edit rate: (total_accepted_edited / total_accepted) \* 100
- Filter by date range if period specified

#### GET /api/statistics/flashcards

Get statistics about user's flashcard collection.

**Authentication**: Required (Bearer token)

**Success Response (200 OK)**:

```json
{
  "total_flashcards": 150,
  "by_source": {
    "manual": 55,
    "ai-full": 70,
    "ai-edited": 25
  },
  "ai_created_percentage": 63.3
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token

**Business Logic**:

- Count flashcards by source from `flashcards` table
- Calculate AI usage percentage: ((ai-full + ai-edited) / total) \* 100

## 3. Authentication and Authorization

### Authentication Method

The API uses **Bearer Token authentication** with JWT tokens provided by Supabase Auth.

**Token Format**:

```
Authorization: Bearer <jwt_token>
```

### Token Acquisition

1. User registers via Supabase Auth: `POST /auth/v1/signup`
2. User logs in via Supabase Auth: `POST /auth/v1/token?grant_type=password`
3. Supabase returns JWT access token and refresh token
4. Client includes access token in Authorization header for all API requests

### Token Validation

- All endpoints (except auth endpoints) require valid JWT token
- API validates token signature using Supabase public key
- API extracts user_id from token payload (`sub` claim)
- Token expiration is enforced (default: 1 hour, refreshable)

### Authorization Rules

**Note**: Row-Level Security (RLS) policies have been disabled for flashcards, generations, and generation_error_logs tables. Authorization must be implemented at the application level.

1. **Flashcards Resource**:
   - API must filter all queries with `WHERE user_id = <authenticated_user_id>`
   - All CRUD operations must explicitly check user ownership
   - Before update/delete operations, verify the flashcard belongs to the authenticated user

2. **Generations Resource**:
   - API must filter all queries with `WHERE user_id = <authenticated_user_id>`
   - Generation acceptance requires explicit ownership verification
   - All queries must include user_id filter in WHERE clause

3. **Statistics Resource**:
   - Statistics aggregation queries must include `WHERE user_id = <authenticated_user_id>`
   - No cross-user data access allowed
   - All calculations scoped to authenticated user only

### Implementation Details

**CRITICAL**: With RLS disabled, the application layer is solely responsible for data isolation.

- Extract `user_id` from JWT token (`sub` claim) for every authenticated request
- **All database queries** must include `WHERE user_id = <authenticated_user_id>` clause
- Before any update/delete operation:
  1. Verify the resource exists
  2. Verify the resource belongs to the authenticated user
  3. Return 404 if not found or not owned by user
- Use parameterized queries to prevent SQL injection
- Never trust client-provided `user_id` - always use the value from JWT token
- Implement middleware to automatically inject user_id filters (recommended)

**Example Query Patterns**:

```sql
-- SELECT queries
SELECT * FROM flashcards WHERE user_id = $1 AND id = $2

-- INSERT queries
INSERT INTO flashcards (front, back, source, user_id)
VALUES ($1, $2, $3, $4)  -- $4 must be from JWT token

-- UPDATE queries
UPDATE flashcards SET front = $1, back = $2
WHERE id = $3 AND user_id = $4  -- $4 must be from JWT token

-- DELETE queries
DELETE FROM flashcards WHERE id = $1 AND user_id = $2  -- $2 must be from JWT token
```

### Security Considerations

- JWT tokens transmitted over HTTPS only
- Tokens stored securely in httpOnly cookies (recommended) or secure storage
- Refresh token rotation implemented
- Rate limiting applied per user to prevent abuse
- CORS configured to allow only authorized origins

**⚠️ CRITICAL SECURITY WARNING**:

- **RLS is disabled** on flashcards, generations, and generation_error_logs tables
- The application is **100% responsible** for data isolation between users
- **Every database query** must include `WHERE user_id = <authenticated_user_id>` filter
- Failure to implement proper filtering will result in **data leakage** between users
- **Never** trust user_id from client requests - always extract from JWT token
- Implement automated tests to verify authorization checks on all endpoints
- Consider implementing middleware/interceptors to automatically inject user_id filters
- Regular security audits recommended to ensure no queries bypass user_id filtering

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Flashcards

- **front**:
  - Required for creation
  - Type: string
  - Max length: 200 characters
  - Cannot be empty after trimming

- **back**:
  - Required for creation
  - Type: string
  - Max length: 500 characters
  - Cannot be empty after trimming

- **source**:
  - Auto-assigned based on creation method
  - Must be one of: 'ai-full', 'ai-edited', 'manual'
  - Cannot be modified directly by user

#### Generations

- **source_text**:
  - Required
  - Type: string
  - Min length: 1000 characters
  - Max length: 10000 characters
  - Stripped of excessive whitespace before validation

**Note**: The AI model is configured on the backend (not a user input parameter).

### 4.2 Business Logic Implementation

#### AI Flashcard Generation Flow

1. **Authentication**: Extract user_id from JWT token
2. **Input Validation**: Check source_text length (1000-10000 chars)
3. **Hash Generation**: Calculate SHA-256 hash of source_text for tracking
4. **Model Selection**: Use backend-configured AI model (e.g., from environment variable or config file)
5. **API Call**: Send request to Openrouter.ai with the configured model
6. **Duration Tracking**: Record generation_duration in milliseconds
7. **Metadata Storage**: Save to `generations` table with user_id and model name from JWT token
8. **Error Handling**: On failure, log to `generation_error_logs` with user_id and error details
9. **Response**: Return flashcard suggestions without persisting flashcards

#### Flashcard Acceptance Flow

1. **Authentication**: Extract user_id from JWT token
2. **Ownership Verification**: Query `SELECT id FROM generations WHERE id = $1 AND user_id = $2` to confirm generation belongs to authenticated user (return 404 if not found)
3. **Source Assignment**:
   - If edited=false → source='ai-full'
   - If edited=true → source='ai-edited'
4. **Batch Creation**: Insert all accepted flashcards with generation_id reference and user_id from JWT token
5. **Statistics Update**: Update generation record with `WHERE id = $1 AND user_id = $2`:
   - Count unedited acceptances → accepted_unedited_count
   - Count edited acceptances → accepted_edited_count
6. **Response**: Return created flashcard records

#### Manual Flashcard Creation

1. **Authentication**: Extract user_id from JWT token
2. **Validation**: Check front/back lengths
3. **Source Assignment**: Set source='manual'
4. **Creation**: Insert into flashcards table with user_id from JWT token
5. **Response**: Return created flashcard

#### Statistics Calculation

1. **Generation Statistics**:
   - Extract user_id from JWT token
   - Aggregate from `generations` table with `WHERE user_id = <authenticated_user_id>`
   - Calculate acceptance_rate = (sum of accepted counts / sum of generated_count) \* 100
   - Calculate edit_rate = (sum of accepted_edited_count / sum of all accepted) \* 100
   - Group by model for usage breakdown (scoped to user)

2. **Flashcard Statistics**:
   - Count records by source from `flashcards` table with `WHERE user_id = <authenticated_user_id>`
   - Calculate AI usage percentage
   - Must explicitly filter by user_id in application code

#### Data Deletion (GDPR Compliance)

1. **Account Deletion Request**: User initiates account deletion
2. **Authentication**: Extract user_id from JWT token
3. **Cascade Operations** (in transaction):
   - Delete all flashcards: `DELETE FROM flashcards WHERE user_id = <authenticated_user_id>`
   - Delete all generations: `DELETE FROM generations WHERE user_id = <authenticated_user_id>`
   - Delete all generation_error_logs: `DELETE FROM generation_error_logs WHERE user_id = <authenticated_user_id>`
   - Delete user record from auth.users via Supabase Auth API
4. **Verification**: Confirm all user data removed
5. **Response**: Return success confirmation

### 4.3 Error Handling

#### Standard Error Response Format

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

#### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User lacks permission for resource
- `NOT_FOUND`: Resource not found or not owned by user
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `AI_SERVICE_ERROR`: External AI service failure
- `DATABASE_ERROR`: Database operation failed

### 4.4 Rate Limiting

To protect against abuse and manage costs:

- **AI Generation Endpoint**: 10 requests per hour per user
- **Standard Endpoints**: 100 requests per minute per user

Rate limit headers returned in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702555200
```

### 4.5 Caching Strategy

- **Statistics Endpoints**: Cache for 5 minutes per user
- **Generation History**: Cache for 1 minute per user
- **Flashcard Lists**: No caching (real-time updates expected)

## 5. API Versioning

Current version: **v1**

All endpoints are prefixed with `/api` to allow future versioning without breaking changes.

Future versions would use path-based versioning:

- v1: `/api/flashcards`
- v2: `/api/v2/flashcards`

## 6. Response Formats

### Success Response Structure

All successful responses follow this structure:

- Single resource: Return object directly
- Collection: Return object with `data` array and `pagination` object
- Action confirmation: Return object with `message` field

### Timestamp Format

All timestamps use ISO 8601 format with UTC timezone:

```
2025-12-14T10:00:00Z
```

### Pagination Format

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## 7. External Dependencies

### Supabase

- **Authentication**: JWT token generation and validation
- **Database**: PostgreSQL database (RLS policies disabled - authorization handled at application level)
- **SDK**: Supabase JavaScript client for API calls

### Openrouter.ai

- **Purpose**: LLM API access for flashcard generation
- **Authentication**: API key (server-side only)
- **Rate Limits**: Managed via Openrouter.ai dashboard
- **Cost Control**: Financial limits set on API keys

## 8. Performance Considerations

### Database Optimization

- Indexes on `user_id` for all user-scoped queries (flashcards, generations, error_logs)
- Index on `generation_id` for flashcard-generation joins
- Trigger for automatic `updated_at` timestamp updates

### Query Optimization

- Pagination prevents large result sets
- Application-level filtering with indexed `user_id` columns ensures efficient queries
- All queries must include `WHERE user_id = <authenticated_user_id>` to leverage indexes
- Statistics use aggregation functions for efficiency

### Caching

- Statistics cached to reduce database load
- Consider CDN for static assets

### Scalability

- Stateless API design enables horizontal scaling
- Database connection pooling via Supabase
- Background jobs for expensive operations (AI generation can be async if needed)

## 9. Development Phases

### Phase 1: MVP Core (Priority: High)

- User authentication (Supabase Auth integration)
- Manual flashcard CRUD
- AI flashcard generation and acceptance
- Basic statistics

### Phase 2: Enhanced Features (Priority: Medium)

- Advanced statistics and analytics
- Generation error handling and retry
- Performance optimization
- Rate limiting implementation

### Phase 3: Polish (Priority: Low)

- API documentation (OpenAPI/Swagger)
- Webhooks for async notifications
- Export functionality
- Admin endpoints for monitoring
