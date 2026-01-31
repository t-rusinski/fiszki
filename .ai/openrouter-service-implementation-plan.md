# OpenRouter Service - Plan Implementacji

## 1. Opis Usługi

`OpenRouterService` to serwis odpowiedzialny za komunikację z API OpenRouter.ai w celu generowania odpowiedzi od modeli LLM (Large Language Models). Usługa zapewnia zunifikowany interfejs do różnych dostawców AI (OpenAI, Anthropic, Google, Meta i innych) poprzez pojedynczy punkt dostępu.

### Główne Funkcjonalności

1. **Wysyłanie Chat Completion Requests** - Komunikacja z różnymi modelami LLM
2. **System & User Messages** - Pełna kontrola nad kontekstem konwersacji (role: system, user, assistant)
3. **Structured Outputs** - Wymuszanie formatu odpowiedzi poprzez JSON Schema (response_format)
4. **Model Parameters Configuration** - Dostosowanie parametrów generacji (temperature, max_tokens, top_p, etc.)
5. **Comprehensive Error Handling** - Mapowanie błędów API na niestandardowe typy błędów projektu
6. **Type Safety** - Pełne wsparcie TypeScript z walidacją Zod

### Kluczowe Cechy

- **Model Flexibility**: Obsługa wielu modeli (GPT-4, Claude, Gemini, LLaMA, itp.)
- **Cost Optimization**: OpenRouter automatycznie wybiera najtańszy dostępny model lub routing
- **Rate Limit Protection**: Wbudowana obsługa limitów z retry logic
- **Secure API Key Management**: Bezpieczne przechowywanie kluczy w zmiennych środowiskowych

---

## 2. Opis Konstruktora

### `constructor(apiKey: string)`

Konstruktor inicjalizuje serwis z kluczem API wymaganym do autentykacji w OpenRouter.

#### Parametry

- **apiKey** (string): Klucz API do OpenRouter.ai (rozpoczynający się od `sk-or-v1-`)

#### Odpowiedzialności

1. Walidacja obecności i poprawności klucza API
2. Inicjalizacja konfiguracji bazowego URL (`https://openrouter.ai/api/v1`)
3. Przygotowanie domyślnych nagłówków HTTP

#### Przykład Użycia

```typescript
const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
```

#### Walidacja w Konstruktorze

```typescript
constructor(apiKey: string) {
  if (!apiKey || apiKey.trim() === '') {
    throw new ValidationError('OpenRouter API key is required');
  }
  this.apiKey = apiKey;
}
```

---

## 3. Publiczne Metody i Pola

### 3.1. `async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>`

Główna metoda do wysyłania zapytań do modeli LLM przez OpenRouter API.

#### Parametry: ChatCompletionRequest

```typescript
interface ChatCompletionRequest {
  // === WYMAGANE ===
  model: string;                    // ID modelu, np. "openai/gpt-4", "anthropic/claude-3-opus"
  messages: ChatMessage[];          // Tablica wiadomości (min. 1)

  // === OPCJONALNE - Parametry Modelu ===
  temperature?: number;             // 0.0 - 2.0 (default: 1.0)
                                    // Niższe = bardziej deterministyczne
                                    // Wyższe = bardziej kreatywne

  max_tokens?: number;              // Maksymalna liczba tokenów w odpowiedzi
                                    // Zalecane: 500-2000 dla fiszek

  top_p?: number;                   // 0.0 - 1.0 (default: 1.0)
                                    // Nucleus sampling - alternatywa dla temperature

  frequency_penalty?: number;       // -2.0 - 2.0 (default: 0)
                                    // Kara za powtarzające się tokeny
                                    // Dodatnie wartości zmniejszają powtórzenia

  presence_penalty?: number;        // -2.0 - 2.0 (default: 0)
                                    // Kara za tokeny już obecne w tekście
                                    // Zachęca do nowych tematów

  // === OPCJONALNE - Structured Output ===
  response_format?: ResponseFormat; // Wymuszenie struktury JSON w odpowiedzi
}
```

#### Typ: ChatMessage

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

**Znaczenie ról:**
- **system**: Definiuje zachowanie modelu (np. "You are a flashcard creator")
- **user**: Wiadomość od użytkownika/promptu
- **assistant**: Poprzednie odpowiedzi modelu (dla kontekstu konwersacji)

#### Typ: ResponseFormat

```typescript
interface ResponseFormat {
  type: 'json_schema';              // Jedyna wspierana wartość
  json_schema: {
    name: string;                   // Nazwa schematu (snake_case, bez spacji)
    strict: boolean;                // MUSI być true - wymusza zgodność ze schematem
    schema: Record<string, any>;    // JSON Schema object (nie Zod, już przekonwertowany)
  };
}
```

**WAŻNE**: OpenRouter wymaga **czystego JSON Schema**, nie Zod schema. Schemat musi być zgodny ze specyfikacją JSON Schema Draft 2020-12.

#### Zwraca: ChatCompletionResponse

```typescript
interface ChatCompletionResponse {
  id: string;                       // Unikalny ID odpowiedzi od OpenRouter
  model: string;                    // Model użyty do generowania (może różnić się od requestu)
  created: number;                  // Unix timestamp utworzenia
  choices: Choice[];                // Tablica wygenerowanych odpowiedzi (zazwyczaj 1)
  usage: Usage;                     // Statystyki użycia tokenów
}

interface Choice {
  index: number;                    // Indeks wyboru (0 dla pojedynczej odpowiedzi)
  message: ChatMessage;             // Wygenerowana wiadomość
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
  // stop = normalne zakończenie
  // length = osiągnięto max_tokens
  // content_filter = zablokowane przez filtr treści
}

interface Usage {
  prompt_tokens: number;            // Tokeny użyte w prompcie
  completion_tokens: number;        // Tokeny użyte w odpowiedzi
  total_tokens: number;             // Suma tokenów (prompt + completion)
}
```

#### Przykład 1: Prosty Chat Completion (bez structured output)

```typescript
const response = await service.complete({
  model: 'openai/gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant that creates educational flashcards.'
    },
    {
      role: 'user',
      content: 'Create a flashcard about the Pythagorean theorem.'
    }
  ],
  temperature: 0.7,
  max_tokens: 500
});

// Dostęp do odpowiedzi
const generatedText = response.choices[0].message.content;
console.log(generatedText);
// Przykładowa odpowiedź (plain text):
// "Front: What is the Pythagorean theorem?
//  Back: In a right triangle, a² + b² = c², where c is the hypotenuse."
```

#### Przykład 2: Structured Output z JSON Schema

```typescript
// 1. Definicja schematu JSON (WAŻNE: to jest JSON Schema, nie Zod!)
const flashcardSchema = {
  type: 'object',
  properties: {
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          front: {
            type: 'string',
            maxLength: 200,
            description: 'Question on the flashcard'
          },
          back: {
            type: 'string',
            maxLength: 500,
            description: 'Answer on the flashcard'
          }
        },
        required: ['front', 'back'],
        additionalProperties: false
      }
    }
  },
  required: ['flashcards'],
  additionalProperties: false
};

// 2. Wysłanie requestu ze structured output
const response = await service.complete({
  model: 'openai/gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are a flashcard generator. Generate flashcards in the specified JSON format.'
    },
    {
      role: 'user',
      content: 'Generate 5 flashcards about World War II.'
    }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'flashcard_generation',  // snake_case, bez spacji
      strict: true,                  // WYMAGANE - wymusza zgodność
      schema: flashcardSchema        // JSON Schema object
    }
  },
  temperature: 0.7,
  max_tokens: 2000
});

// 3. Parsowanie strukturalnej odpowiedzi
const parsed = JSON.parse(response.choices[0].message.content);

// parsed ma strukturę:
// {
//   flashcards: [
//     { front: "When did World War II start?", back: "September 1, 1939" },
//     { front: "Who were the Axis powers?", back: "Germany, Italy, and Japan" },
//     ...
//   ]
// }

console.log(parsed.flashcards);
```

#### Przykład 3: Wykorzystanie Parametrów Modelu

```typescript
const response = await service.complete({
  model: 'anthropic/claude-3-opus',
  messages: [
    { role: 'system', content: 'You are a creative writing assistant.' },
    { role: 'user', content: 'Write a unique story opening.' }
  ],
  temperature: 1.2,              // Wyższa temperatura = bardziej kreatywne
  max_tokens: 1000,
  presence_penalty: 0.6,         // Zachęca do nowych tematów
  frequency_penalty: 0.3         // Zmniejsza powtórzenia
});
```

---

## 4. Prywatne Metody i Pola

### 4.1. Pola Prywatne

```typescript
private readonly apiKey: string;
private readonly baseURL = 'https://openrouter.ai/api/v1';
```

### 4.2. `private async makeRequest(endpoint: string, body: unknown): Promise<Response>`

Wykonuje HTTP POST request do OpenRouter API.

#### Odpowiedzialności

1. Dodanie wymaganych nagłówków HTTP
2. Serializacja body do JSON
3. Obsługa timeout (30 sekund)
4. Rzucanie błędów sieciowych

#### Nagłówki HTTP

```typescript
{
  'Authorization': `Bearer ${this.apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://10xdevs.pl',      // Opcjonalne - dla OpenRouter dashboard
  'X-Title': 'Fiszki App'                     // Opcjonalne - nazwa aplikacji
}
```

**Znaczenie opcjonalnych nagłówków:**
- `HTTP-Referer`: Pokazuje źródło requestów w OpenRouter dashboard (ranking)
- `X-Title`: Wyświetla nazwę aplikacji w statystykach OpenRouter

#### Implementacja z Timeout

```typescript
private async makeRequest(endpoint: string, body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://10xdevs.pl',
        'X-Title': 'Fiszki App',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 4.3. `private async parseErrorResponse(response: Response): Promise<string>`

Parsuje błędy zwrócone przez OpenRouter API i wyciąga szczegółowy komunikat.

#### Format Błędów OpenRouter

```typescript
{
  "error": {
    "code": "invalid_request_error",
    "message": "Invalid model specified"
  }
}
```

#### Implementacja

```typescript
private async parseErrorResponse(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData.error?.message || `HTTP ${response.status} Error`;
  } catch {
    return await response.text() || `HTTP ${response.status} Error`;
  }
}
```

### 4.4. `private mapHttpStatusToError(status: number, message: string): Error`

Mapuje kody statusu HTTP na niestandardowe typy błędów projektu (z `src/lib/errors.ts`).

#### Mapowanie Statusów

| Status HTTP | Typ Błędu | Scenariusz |
|-------------|-----------|------------|
| 400 | `ValidationError` | Nieprawidłowe parametry, błędny model, błędny schemat JSON |
| 401 | `UnauthorizedError` | Nieprawidłowy lub brakujący klucz API |
| 429 | `RateLimitError` | Przekroczony limit requestów lub limit finansowy |
| 500 | `ServiceUnavailableError` | Błąd wewnętrzny OpenRouter |
| 503 | `ServiceUnavailableError` | OpenRouter tymczasowo niedostępny |
| Network Error | `ServiceUnavailableError` | Timeout, utrata połączenia |

#### Implementacja

```typescript
private mapHttpStatusToError(status: number, message: string): Error {
  switch (status) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new UnauthorizedError(message);
    case 429:
      return new RateLimitError(message);
    case 503:
      return new ServiceUnavailableError(message);
    default:
      return new ServiceUnavailableError(`${message} (HTTP ${status})`);
  }
}
```

### 4.5. `private validateRequest(request: ChatCompletionRequest): void`

Waliduje parametry requestu przed wysłaniem do API.

#### Walidacje

1. **Model**: Niepusty string
2. **Messages**: Co najmniej 1 wiadomość, prawidłowe role
3. **Temperature**: 0 ≤ temperature ≤ 2
4. **max_tokens**: > 0
5. **Response Format**: Jeśli podany, walidacja name (snake_case) i schema (valid JSON Schema)

#### Przykładowa Implementacja

```typescript
private validateRequest(request: ChatCompletionRequest): void {
  // Model
  if (!request.model || request.model.trim() === '') {
    throw new ValidationError('Model name is required');
  }

  // Messages
  if (!request.messages || request.messages.length === 0) {
    throw new ValidationError('At least one message is required');
  }

  // Temperature
  if (request.temperature !== undefined) {
    if (request.temperature < 0 || request.temperature > 2) {
      throw new ValidationError('Temperature must be between 0 and 2');
    }
  }

  // max_tokens
  if (request.max_tokens !== undefined && request.max_tokens <= 0) {
    throw new ValidationError('max_tokens must be positive');
  }

  // Response Format
  if (request.response_format?.json_schema) {
    const { name, schema, strict } = request.response_format.json_schema;

    // Walidacja name (snake_case)
    if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new ValidationError(
        'Schema name must be snake_case (lowercase, underscores, no spaces)'
      );
    }

    // Walidacja schema
    if (!schema || typeof schema !== 'object') {
      throw new ValidationError('Schema must be a valid JSON Schema object');
    }

    // Walidacja strict mode
    if (strict !== true) {
      throw new ValidationError('Schema strict mode must be enabled (strict: true)');
    }
  }
}
```

---

## 5. Obsługa Błędów

### 5.1. Wykorzystanie Istniejących Klas Błędów

Serwis używa niestandardowych klas błędów z `src/lib/errors.ts` zgodnie z wzorcem projektu:

```typescript
import {
  ValidationError,      // 400 - Błędy walidacji
  UnauthorizedError,    // 401 - Błędy autentykacji
  RateLimitError,       // 429 - Rate limiting
  ServiceUnavailableError // 503/500 - Problemy z serwisem
} from '@/lib/errors';
```

### 5.2. Szczegółowe Scenariusze Błędów

#### Błąd 1: Nieprawidłowy Model

**Przyczyna**: Podano nieistniejący lub nieprawidłowy ID modelu

```typescript
// Request
const response = await service.complete({
  model: 'invalid/model-name',
  messages: [{ role: 'user', content: 'Hello' }]
});

// Rzucony błąd
throw new ValidationError('Invalid model specified: invalid/model-name');
```

**Rozwiązanie**: Sprawdź listę dostępnych modeli na https://openrouter.ai/models

#### Błąd 2: Nieprawidłowy Klucz API

**Przyczyna**: Klucz API jest nieprawidłowy, wygasły lub nie ma wystarczających uprawnień

```typescript
// Rzucony błąd (HTTP 401)
throw new UnauthorizedError('Invalid API key provided');
```

**Rozwiązanie**: Sprawdź poprawność `OPENROUTER_API_KEY` w pliku `.env`

#### Błąd 3: Rate Limit Exceeded

**Przyczyna**: Przekroczono limit requestów lub limity finansowe

```typescript
// Rzucony błąd (HTTP 429)
throw new RateLimitError('Rate limit exceeded. Please try again later.');
```

**Rozwiązanie**:
- Poczekaj przed kolejnym requestem
- Sprawdź limity w OpenRouter dashboard
- Zwiększ limity finansowe jeśli to konieczne

#### Błąd 4: Nieprawidłowy JSON Schema

**Przyczyna**: Schema ma nieprawidłową nazwę lub strukturę

```typescript
// Request z błędnym schematem
const response = await service.complete({
  model: 'openai/gpt-4',
  messages: [/* ... */],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'invalid schema',  // ❌ Spacje niedozwolone
      strict: true,
      schema: { type: 'object' }
    }
  }
});

// Rzucony błąd
throw new ValidationError('Schema name must be snake_case (lowercase, underscores, no spaces)');
```

**Rozwiązanie**: Użyj snake_case dla nazwy schematu (np. `flashcard_generation`)

#### Błąd 5: Timeout Sieci

**Przyczyna**: OpenRouter nie odpowiedział w ciągu 30 sekund

```typescript
// Rzucony błąd
throw new ServiceUnavailableError('Request timeout: OpenRouter did not respond');
```

**Rozwiązanie**:
- Ponów request
- Sprawdź połączenie sieciowe
- Zmniejsz `max_tokens` jeśli generacja jest bardzo długa

#### Błąd 6: Brak Wiadomości

**Przyczyna**: Nie podano żadnych wiadomości w tablicy messages

```typescript
// Request bez messages
const response = await service.complete({
  model: 'openai/gpt-4',
  messages: []  // ❌ Pusta tablica
});

// Rzucony błąd
throw new ValidationError('At least one message is required');
```

#### Błąd 7: Nieprawidłowa Temperature

**Przyczyna**: Temperature poza zakresem 0-2

```typescript
// Request z nieprawidłową temperature
const response = await service.complete({
  model: 'openai/gpt-4',
  messages: [/* ... */],
  temperature: 3.0  // ❌ > 2
});

// Rzucony błąd
throw new ValidationError('Temperature must be between 0 and 2');
```

### 5.3. Obsługa Błędów w Endpoint

Przykład właściwego handling'u błędów w Astro API endpoint:

```typescript
export const POST: APIRoute = async (context) => {
  try {
    const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
    const response = await service.complete(/* ... */);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleApiError(error);  // Centralized error handler
  }
};
```

Funkcja `handleApiError` z `src/lib/error-handler.ts` automatycznie mapuje błędy na odpowiednie Response objects.

---

## 6. Kwestie Bezpieczeństwa

### 6.1. Ochrona Klucza API

#### Problem
Klucz API jest wrażliwy i nie powinien być eksponowany w kodzie klienta.

#### Rozwiązania

**1. Przechowywanie w Zmiennych Środowiskowych**

```bash
# .env (NIGDY w repozytorium)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
# .env.example (w repozytorium jako dokumentacja)
OPENROUTER_API_KEY=your-key-here
```

```typescript
// src/env.d.ts - TypeScript typing
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**2. Walidacja w Konstruktorze**

```typescript
constructor(apiKey: string) {
  if (!apiKey) {
    throw new ServiceUnavailableError('OpenRouter API key not configured');
  }
  this.apiKey = apiKey;
}
```

**3. Server-Side Only**

```typescript
// ✅ POPRAWNE - w API endpoint (server-side)
export const POST: APIRoute = async (context) => {
  const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
  // ...
};

// ❌ NIEPOPRAWNE - w React component (client-side)
function MyComponent() {
  const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
  // NIE RÓB TEGO - klucz będzie widoczny w przeglądarce!
}
```

**4. Nigdy Nie Loguj Klucza**

```typescript
// ❌ NIEPOPRAWNE
console.log('API Key:', this.apiKey);

// ✅ POPRAWNE
console.log('API Key:', '[REDACTED]');
```

### 6.2. Walidacja Danych Wejściowych

#### Problem
Niezwalidowane dane wejściowe mogą prowadzić do nieprawidłowych requestów, injection attacks lub nadmiernego wykorzystania API.

#### Rozwiązania

**1. Zod Schemas w API Endpoints**

```typescript
// src/lib/validation/generation.schemas.ts
export const GenerateFlashcardsSchema = z.object({
  content: z.string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content must not exceed 5000 characters'),

  model: z.enum([
    'openai/gpt-4',
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-sonnet'
  ]).default('openai/gpt-3.5-turbo'),

  count: z.number()
    .int('Count must be an integer')
    .min(1, 'Must generate at least 1 flashcard')
    .max(20, 'Cannot generate more than 20 flashcards at once')
    .default(5),

  temperature: z.number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must not exceed 2')
    .optional()
    .default(0.7),
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;
```

**2. Sanityzacja Promptów**

```typescript
// Ograniczenie długości i usunięcie znaków kontrolnych
const sanitizePrompt = (content: string): string => {
  return content
    .trim()
    .slice(0, 5000)  // Max 5000 znaków
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Usuń znaki kontrolne
};
```

**3. Walidacja JSON Schema przed Użyciem**

```typescript
private validateJsonSchema(schema: any): void {
  if (!schema || typeof schema !== 'object') {
    throw new ValidationError('Schema must be an object');
  }

  if (!schema.type) {
    throw new ValidationError('Schema must have a type property');
  }

  if (schema.type === 'object' && !schema.properties) {
    throw new ValidationError('Object schema must have properties');
  }
}
```

### 6.3. Rate Limiting i Kontrola Kosztów

#### Problem
Nadmierne użycie API może prowadzić do wysokich kosztów lub przekroczenia limitów.

#### Rozwiązania

**1. Application-Level Rate Limiting**

```typescript
// Prosty in-memory rate limiter (dla development)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(userId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Usuń requesty poza oknem czasowym
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}

// Użycie w endpoint
const rateLimiter = new RateLimiter();

export const POST: APIRoute = async (context) => {
  const userId = context.locals.userId;

  if (!rateLimiter.canMakeRequest(userId, 10, 60000)) { // 10 requestów/min
    throw new RateLimitError('Too many requests. Please try again later.');
  }

  // Kontynuuj z requestem...
};
```

**2. Database-Tracked Quotas**

```typescript
// Śledzenie użycia w bazie danych (Supabase)
interface UserQuota {
  user_id: string;
  requests_today: number;
  tokens_used_today: number;
  last_reset: Date;
  daily_limit_requests: number;
  daily_limit_tokens: number;
}

async function checkUserQuota(userId: string): Promise<boolean> {
  const { data: quota } = await supabase
    .from('user_quotas')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Reset jeśli nowy dzień
  if (isNewDay(quota.last_reset)) {
    await resetUserQuota(userId);
    return true;
  }

  // Sprawdź limity
  if (quota.requests_today >= quota.daily_limit_requests) {
    return false;
  }

  if (quota.tokens_used_today >= quota.daily_limit_tokens) {
    return false;
  }

  return true;
}
```

**3. Cost Estimation**

```typescript
// Oszacowanie kosztów przed requestem
interface ModelPricing {
  model: string;
  prompt_price_per_million: number;
  completion_price_per_million: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'openai/gpt-4': {
    model: 'openai/gpt-4',
    prompt_price_per_million: 30,      // $30 per 1M tokens
    completion_price_per_million: 60,  // $60 per 1M tokens
  },
  'openai/gpt-3.5-turbo': {
    model: 'openai/gpt-3.5-turbo',
    prompt_price_per_million: 0.5,
    completion_price_per_million: 1.5,
  },
  // ...
};

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

function estimateCost(
  model: string,
  promptText: string,
  estimatedCompletionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const promptTokens = estimateTokens(promptText);

  const promptCost = (promptTokens / 1_000_000) * pricing.prompt_price_per_million;
  const completionCost = (estimatedCompletionTokens / 1_000_000) * pricing.completion_price_per_million;

  return promptCost + completionCost;
}

// Użycie
const estimatedCost = estimateCost(
  'openai/gpt-4',
  userPrompt,
  2000 // estimated completion tokens
);

if (estimatedCost > MAX_COST_PER_REQUEST) {
  throw new ValidationError('Request would exceed cost limit');
}
```

### 6.4. Timeout Configuration

#### Problem
Long-running requests mogą blokować zasoby i prowadzić do timeoutów.

#### Rozwiązania

**1. Konfigurowalny Timeout**

```typescript
const DEFAULT_TIMEOUT = 30000; // 30 sekund
const MAX_TIMEOUT = 120000;    // 2 minuty (dla bardzo długich generacji)

// W makeRequest
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
  // ...
} finally {
  clearTimeout(timeoutId);
}
```

**2. Timeout w Zależności od Operacji**

```typescript
// Krótkie generacje (fiszki)
const timeout = 30000;

// Długie generacje (eseje, artykuły)
const timeout = 60000;

// Bardzo długie generacje
const timeout = 120000;
```

### 6.5. Logging i Monitoring

#### Problem
Potrzeba monitorowania użycia bez eksponowania wrażliwych danych.

#### Rozwiązania

**1. Sanitized Logging**

```typescript
private sanitizeForLogging(data: any): any {
  const sanitized = { ...data };

  if (sanitized.headers?.Authorization) {
    sanitized.headers.Authorization = 'Bearer [REDACTED]';
  }

  if (sanitized.apiKey) {
    sanitized.apiKey = '[REDACTED]';
  }

  return sanitized;
}

private log(level: 'info' | 'error', message: string, metadata?: any) {
  const sanitized = metadata ? this.sanitizeForLogging(metadata) : {};

  console[level]({
    timestamp: new Date().toISOString(),
    service: 'OpenRouterService',
    message,
    ...sanitized
  });
}
```

**2. Metryki do Śledzenia**

```typescript
interface ServiceMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_tokens_used: number;
  average_response_time_ms: number;
  errors_by_type: Record<string, number>;
  requests_by_model: Record<string, number>;
}
```

**3. Structured Logging Example**

```typescript
// Success log
this.log('info', 'Completion successful', {
  model: response.model,
  tokens_used: response.usage.total_tokens,
  duration_ms: Date.now() - startTime
});

// Error log
this.log('error', 'Completion failed', {
  error_type: error.constructor.name,
  error_message: error.message,
  model: request.model,
  status_code: error.statusCode
});
```

---

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Dodanie Typów do `src/types.ts`

Rozszerz istniejący plik o typy OpenRouter.

```typescript
// ============================================================================
// OpenRouter Service Types
// ============================================================================

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, any>;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

export interface Choice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Choice[];
  usage: Usage;
}
```

### Krok 2: Utworzenie Serwisu `src/services/openrouter.service.ts`

```typescript
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
} from '@/types';
import {
  ValidationError,
  UnauthorizedError,
  RateLimitError,
  ServiceUnavailableError,
} from '@/lib/errors';

export class OpenRouterService {
  private readonly baseURL = 'https://openrouter.ai/api/v1';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new ValidationError('OpenRouter API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Wysyła request do OpenRouter API w celu wygenerowania completion
   * @param request - Parametry chat completion
   * @returns Promise z odpowiedzią zawierającą wygenerowany tekst
   * @throws {ValidationError} Gdy parametry requestu są nieprawidłowe
   * @throws {UnauthorizedError} Gdy klucz API jest nieprawidłowy
   * @throws {RateLimitError} Gdy przekroczono limit requestów
   * @throws {ServiceUnavailableError} Gdy OpenRouter jest niedostępny
   */
  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Walidacja input
    this.validateRequest(request);

    try {
      const response = await this.makeRequest('/chat/completions', request);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as ChatCompletionResponse;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof ValidationError ||
          error instanceof UnauthorizedError ||
          error instanceof RateLimitError ||
          error instanceof ServiceUnavailableError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableError('Request timeout: OpenRouter did not respond');
      }

      throw new ServiceUnavailableError(
        `Unexpected error communicating with OpenRouter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Wykonuje HTTP request do OpenRouter API
   */
  private async makeRequest(endpoint: string, body: unknown): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://10xdevs.pl',
          'X-Title': 'Fiszki App',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Waliduje parametry requestu przed wysłaniem
   */
  private validateRequest(request: ChatCompletionRequest): void {
    if (!request.model || request.model.trim() === '') {
      throw new ValidationError('Model name is required');
    }

    if (!request.messages || request.messages.length === 0) {
      throw new ValidationError('At least one message is required');
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new ValidationError('Temperature must be between 0 and 2');
      }
    }

    if (request.max_tokens !== undefined && request.max_tokens <= 0) {
      throw new ValidationError('max_tokens must be positive');
    }

    // Walidacja response_format
    if (request.response_format?.json_schema) {
      const { name, schema, strict } = request.response_format.json_schema;

      if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
        throw new ValidationError(
          'Schema name must be snake_case (lowercase, underscores, no spaces)'
        );
      }

      if (!schema || typeof schema !== 'object') {
        throw new ValidationError('Schema must be a valid JSON Schema object');
      }

      if (strict !== true) {
        throw new ValidationError('Schema strict mode must be enabled (strict: true)');
      }
    }
  }

  /**
   * Obsługuje błędne odpowiedzi z OpenRouter API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `OpenRouter API error (${status})`;

    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = await response.text() || errorMessage;
    }

    // Mapowanie statusów HTTP na typy błędów
    switch (status) {
      case 400:
        throw new ValidationError(errorMessage);
      case 401:
        throw new UnauthorizedError(errorMessage);
      case 429:
        throw new RateLimitError(errorMessage);
      case 503:
        throw new ServiceUnavailableError(errorMessage);
      default:
        throw new ServiceUnavailableError(`${errorMessage} (HTTP ${status})`);
    }
  }
}
```

### Krok 3: Rozszerzenie Validation Schemas

Dodaj/rozszerz `src/lib/validation/generation.schemas.ts`:

```typescript
import { z } from 'zod';

// Dozwolone modele OpenRouter
export const ALLOWED_MODELS = [
  'openai/gpt-4',
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-sonnet',
  'anthropic/claude-3-haiku',
  'google/gemini-pro',
] as const;

export const GenerateFlashcardsSchema = z.object({
  content: z.string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content must not exceed 5000 characters'),

  model: z.enum(ALLOWED_MODELS, {
    errorMap: () => ({ message: 'Invalid model selected' })
  }).default('openai/gpt-3.5-turbo'),

  count: z.number()
    .int('Count must be an integer')
    .min(1, 'Must generate at least 1 flashcard')
    .max(20, 'Cannot generate more than 20 flashcards at once')
    .default(5),

  temperature: z.number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must not exceed 2')
    .optional()
    .default(0.7),
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;
```

### Krok 4: Utworzenie/Modyfikacja API Endpoint

Utwórz lub zmodyfikuj `src/pages/api/generations/generate.ts`:

```typescript
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/services/openrouter.service';
import { GenerateFlashcardsSchema } from '@/lib/validation/generation.schemas';
import { handleApiError } from '@/lib/error-handler';
import { ServiceUnavailableError } from '@/lib/errors';

// Tymczasowe userId (do zastąpienia autentykacją)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export const POST: APIRoute = async (context) => {
  try {
    // 1. Pobranie API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableError('OpenRouter API key not configured');
    }

    // 2. Walidacja input
    const body = await context.request.json();
    const validatedInput = GenerateFlashcardsSchema.parse(body);

    // 3. Przygotowanie schematu JSON dla fiszek
    const flashcardSchema = {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string', maxLength: 200 },
              back: { type: 'string', maxLength: 500 },
            },
            required: ['front', 'back'],
            additionalProperties: false,
          },
        },
      },
      required: ['flashcards'],
      additionalProperties: false,
    };

    // 4. Wywołanie OpenRouter
    const openRouterService = new OpenRouterService(apiKey);
    const completion = await openRouterService.complete({
      model: validatedInput.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful flashcard generator. Create high-quality flashcards from the provided content. Each flashcard should have a concise question on the front and a clear answer on the back.',
        },
        {
          role: 'user',
          content: `Generate exactly ${validatedInput.count} flashcards from the following content:\n\n${validatedInput.content}`,
        },
      ],
      temperature: validatedInput.temperature,
      max_tokens: 2000,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'flashcard_generation',
          strict: true,
          schema: flashcardSchema,
        },
      },
    });

    // 5. Parsowanie odpowiedzi
    const generatedContent = JSON.parse(completion.choices[0].message.content);
    const flashcards = generatedContent.flashcards;

    // 6. Zwrócenie wyniku (zapisanie do bazy można dodać później)
    return new Response(
      JSON.stringify({
        flashcards,
        usage: completion.usage,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Krok 5: Dodanie Environment Variable

#### `.env.example`

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
```

#### `.env` (lokalnie, NIE commitować)

```bash
OPENROUTER_API_KEY=sk-or-v1-actual_key_here
```

### Krok 6: TypeScript Environment Types

Dodaj do `src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Krok 7: Testowanie

#### Test 1: Prosty Request (bez structured output)

```bash
curl -X POST http://localhost:4321/api/generations/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "The Pythagorean theorem states that in a right triangle, a² + b² = c²",
    "model": "openai/gpt-3.5-turbo",
    "count": 3,
    "temperature": 0.7
  }'
```

**Oczekiwana odpowiedź:**
```json
{
  "flashcards": [
    {
      "front": "What is the Pythagorean theorem?",
      "back": "In a right triangle, a² + b² = c², where c is the hypotenuse"
    },
    {
      "front": "What does 'a' and 'b' represent in the Pythagorean theorem?",
      "back": "The two shorter sides (legs) of a right triangle"
    },
    {
      "front": "What does 'c' represent in a² + b² = c²?",
      "back": "The longest side (hypotenuse) of a right triangle"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 120,
    "total_tokens": 165
  }
}
```

#### Test 2: Walidacja Błędów - Pusty Content

```bash
curl -X POST http://localhost:4321/api/generations/generate \
  -H "Content-Type: application/json" \
  -d '{"content": "", "count": 5}'
```

**Oczekiwany wynik:** 400 ValidationError

#### Test 3: Walidacja Błędów - Nieprawidłowy Model

```bash
curl -X POST http://localhost:4321/api/generations/generate \
  -H "Content-Type: application/json" \
  -d '{"content": "Test content", "model": "invalid/model", "count": 5}'
```

**Oczekiwany wynik:** 400 ValidationError

#### Test 4: Duża Liczba Fiszek

```bash
curl -X POST http://localhost:4321/api/generations/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "World War II was a global conflict that lasted from 1939 to 1945...",
    "model": "openai/gpt-4",
    "count": 20,
    "temperature": 0.8
  }'
```

---

## 8. Checklist Implementacji

- [ ] Dodanie typów OpenRouter do `src/types.ts`
- [ ] Utworzenie `src/services/openrouter.service.ts`
- [ ] Rozszerzenie/utworzenie `src/lib/validation/generation.schemas.ts`
- [ ] Utworzenie/modyfikacja `src/pages/api/generations/generate.ts`
- [ ] Dodanie `OPENROUTER_API_KEY` do `.env` i `.env.example`
- [ ] Rozszerzenie `src/env.d.ts` o typy environment variables
- [ ] Testowanie podstawowych requestów (prosty completion)
- [ ] Testowanie structured outputs (JSON Schema)
- [ ] Testowanie walidacji błędów (validation errors)
- [ ] Testowanie błędów autentykacji (invalid API key)
- [ ] Testowanie timeoutów i błędów sieciowych
- [ ] Code review i refactoring
- [ ] Dokumentacja użycia w komentarzach JSDoc
- [ ] Integracja z istniejącym GenerationService (jeśli dotyczy)

---

## 9. Opcjonalne Rozszerzenia

Po podstawowej implementacji, rozważ dodanie:

### 9.1. Retry Logic z Exponential Backoff

```typescript
async completeWithRetry(
  request: ChatCompletionRequest,
  maxRetries = 3
): Promise<ChatCompletionResponse> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await this.complete(request);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        throw error;
      }

      // Retry tylko dla rate limit i server errors
      if (error instanceof RateLimitError ||
          error instanceof ServiceUnavailableError) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
  throw new Error('Unreachable');
}
```

### 9.2. Streaming Responses

Dla długich odpowiedzi, można dodać wsparcie dla streaming:

```typescript
async completeStream(
  request: ChatCompletionRequest
): AsyncGenerator<string> {
  const response = await this.makeRequest('/chat/completions', {
    ...request,
    stream: true,
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    yield chunk;
  }
}
```

### 9.3. Response Caching

```typescript
private cache = new Map<string, ChatCompletionResponse>();

private getCacheKey(request: ChatCompletionRequest): string {
  return JSON.stringify({
    model: request.model,
    messages: request.messages,
    temperature: request.temperature,
  });
}

async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const cacheKey = this.getCacheKey(request);

  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey)!;
  }

  const response = await this.completeInternal(request);
  this.cache.set(cacheKey, response);

  return response;
}
```

---

## 10. Referencje

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [OpenRouter Models List](https://openrouter.ai/models)
- [JSON Schema Specification](https://json-schema.org/)
- [OpenRouter Structured Outputs](https://openrouter.ai/docs/structured-outputs)
- [Rate Limiting Best Practices](https://openrouter.ai/docs/limits)
- [OpenRouter Pricing](https://openrouter.ai/docs/pricing)

---

## Podsumowanie

Ten plan wdrożenia zapewnia:

✅ **Zgodność z projektem**: Wykorzystuje istniejące wzorce (FlashcardService, GenerationService)
✅ **Type Safety**: Pełne wsparcie TypeScript z walidacją Zod
✅ **Error Handling**: Wykorzystuje istniejące klasy błędów z `src/lib/errors.ts`
✅ **Security**: Proper handling kluczy API, server-side only
✅ **Validation**: Walidacja na poziomie serwisu i endpoint
✅ **Maintainability**: Jasna struktura, dobre nazewnictwo, dokumentacja JSDoc
✅ **Testability**: Łatwe do przetestowania scenariusze

Implementacja tego planu zapewni niezawodną, bezpieczną i łatwą w utrzymaniu usługę do komunikacji z OpenRouter API.
