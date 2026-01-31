Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
   <prd>
   @.ai/ui-plan.md
   </prd>

2. Opis widoku:
   <view_description>
   ### 2.3 Widok generowania fiszek (/ generate)

**Główny cel:** Umożliwienie generowania fiszek z wykorzystaniem AI oraz recenzja i akceptacja propozycji.

**Kluczowe informacje do wyświetlenia:**

- Formularz do wklejania tekstu źródłowego
- Licznik znaków (real-time)
- Komunikaty walidacyjne
- Stan ładowania podczas generowania
- Lista propozycji AI do recenzji
- Opcje akceptacji/edycji/odrzucenia dla każdej propozycji

**Kluczowe komponenty widoku:**

1. **GenerationForm (React):**
   - Textarea (min 1000, max 10000 znaków)
   - Character counter display: "1250 / 10000" (dynamiczny)
   - Validation message area (inline below textarea)
   - "Generuj fiszki" button (primary, disabled until valid)
   - "Wyczyść" button (secondary, clears textarea)

2. **LoadingState (React):**
   - Progress spinner / animation
   - Text: "Generowanie fiszek w toku..."
   - Cancel button (opcjonalnie)
   - Estimated time (jeśli dostępne z API)

3. **SuggestionsList (React):**
   - Section header: "Przejrzyj propozycje AI"
   - Instructions: "Zaznacz fiszki do zapisania, edytuj w razie potrzeby lub odrzuć"
   - List of `SuggestionCard` components:
     - Checkbox (dla bulk selection)
     - Front text display (bold)
     - Back text display (regular)
     - "Edytuj" button (opens inline edit mode)
     - "Odrzuć" button (removes from list)
   - When editing (inline form):
     - Front textarea (max 200 chars) + counter
     - Back textarea (max 500 chars) + counter
     - "Zapisz" / "Anuluj" buttons
   - Bulk action section (sticky bottom or fixed):
     - Selection counter: "5 fiszek zaznaczonych"
     - "Zapisz wszystkie" button (secondary)
     - "Zapisz zaznaczone" button (primary)

**UX, dostępność i względy bezpieczeństwa:**

- **UX:**
  - Real-time character counter z color coding:
    - < 1000 znaków: red
    - 1000-10000: green
    - > 10000: red
  - Disable "Generuj" button dopóki walidacja nie przejdzie
  - Preserve textarea content on error
  - Smooth transition: loading → suggestions
  - Visual feedback: checkbox selection (highlight card)
  - Confirmation dialog dla "Odrzuć" (lub undo stack)
  - Optimistic UI: mark as saved immediately, rollback on error
  - Auto-scroll to suggestions after generation
- **Dostępność:**
  - Textarea z `aria-label="Tekst źródłowy do generowania fiszek"`
  - Character counter jako aria-live region (announces changes)
  - Validation messages z `aria-describedby`
  - Focus management: po generowaniu focus na pierwsze checkbox
  - Keyboard shortcuts:
    - Enter w textarea → trigger generate (z modifier, np. Ctrl+Enter)
    - Space → toggle checkbox
    - Escape → cancel inline edit
  - Wszystkie przyciski z visible focus indicators
  - Semantic HTML: `<section>`, `<article>` dla cards
- **Bezpieczeństwo:**
  - Sanitize textarea input przed wysłaniem do API
  - Rate limiting feedback: "Limit osiągnięty. Spróbuj ponownie za 45 minut."
  - No sensitive data warning (optional info message)
  - Client-side validation prevents unnecessary API calls

**Przepływ:**

1. Użytkownik wkleja tekst do textarea 2. Character counter aktualizuje się w czasie rzeczywistym 3. Validation message pokazuje status (za krótki/za długi/ok) 4. User klika "Generuj fiszki" 5. Loading state pojawia się (spinner + message) 6. API call: `POST /api/generations/generate` 7. Success → suggestions list renderuje się poniżej formularza 8. User przegląda każdą propozycję: - Zaznacza checkbox przy fiszkach do zachowania - Klika "Edytuj" dla modyfikacji → inline form → "Zapisz" - Klika "Odrzuć" dla usunięcia z listy 9. User klika "Zapisz zaznaczone" LUB "Zapisz wszystkie" 10. API call: `POST /api/generations/:id/accept` z listą flashcards 11. Success message inline: "Fiszki zapisane pomyślnie" 12. Suggestions list znika, textarea wraca do pustego stanu
   </view_description>

2. User Stories:
   <user_stories>
   ID: US-003
   Tytuł: Generowanie fiszek przy użyciu AI
   Opis: Jako zalogowany użytkownik chcę wkleić kawałek tekstu i za pomocą przycisku wygenerować propozycje fiszek, aby zaoszczędzić czas na ręcznym tworzeniu pytań i odpowiedzi.
   Kryteria akceptacji:

- W widoku generowania fiszek znajduje się pole tekstowe, w którym użytkownik może wkleić swój tekst.
- Pole tekstowe oczekuje od 1000 do 10 000 znaków.
- Po kliknięciu przycisku generowania aplikacja komunikuje się z API modelu LLM i wyświetla listę wygenerowanych propozycji fiszek do akceptacji przez użytkownika.
- W przypadku problemów z API lub braku odpowiedzi modelu użytkownik zobaczy stosowny komunikat o błędzie.

ID: US-004
Tytuł: Przegląd i zatwierdzanie propozycji fiszek
Opis: Jako zalogowany użytkownik chcę móc przeglądać wygenerowane fiszki i decydować, które z nich chcę dodać do mojego zestawu, aby zachować tylko przydatne pytania i odpowiedzi.
Kryteria akceptacji:

- Lista wygenerowanych fiszek jest wyświetlana pod formularzem generowania.
- Przy każdej fiszce znajduje się przycisk pozwalający na jej zatwierdzenie, edycję lub odrzucenie.
- Po zatwierdzeniu wybranych fiszek użytkownik może kliknąć przycisk zapisu i dodać je do bazy danych.
  </user_stories>

4. Endpoint Description:
   <endpoint_description>
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
  </endpoint_description>

5. Endpoint Implementation:
   <endpoint_implementation>
   @src\pages\api\generations\generate.ts
   </endpoint_implementation>

6. Type Definitions:
   <type_definitions>
   @src/types.ts
   </type_definitions>

7. Tech Stack:
   <tech_stack>
   @.ai/tech-stack.md
   </tech_stack>

Przed utworzeniem ostatecznego planu wdrożenia przeprowadź analizę i planowanie wewnątrz tagów <implementation_breakdown> w swoim bloku myślenia. Ta sekcja może być dość długa, ponieważ ważne jest, aby być dokładnym.

W swoim podziale implementacji wykonaj następujące kroki:

1. Dla każdej sekcji wejściowej (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):

- Podsumuj kluczowe punkty
- Wymień wszelkie wymagania lub ograniczenia
- Zwróć uwagę na wszelkie potencjalne wyzwania lub ważne kwestie

2. Wyodrębnienie i wypisanie kluczowych wymagań z PRD
3. Wypisanie wszystkich potrzebnych głównych komponentów, wraz z krótkim opisem ich opisu, potrzebnych typów, obsługiwanych zdarzeń i warunków walidacji
4. Stworzenie wysokopoziomowego diagramu drzewa komponentów
5. Zidentyfikuj wymagane DTO i niestandardowe typy ViewModel dla każdego komponentu widoku. Szczegółowo wyjaśnij te nowe typy, dzieląc ich pola i powiązane typy.
6. Zidentyfikuj potencjalne zmienne stanu i niestandardowe hooki, wyjaśniając ich cel i sposób ich użycia
7. Wymień wymagane wywołania API i odpowiadające im akcje frontendowe
8. Zmapuj każdej historii użytkownika do konkretnych szczegółów implementacji, komponentów lub funkcji
9. Wymień interakcje użytkownika i ich oczekiwane wyniki
10. Wymień warunki wymagane przez API i jak je weryfikować na poziomie komponentów
11. Zidentyfikuj potencjalne scenariusze błędów i zasugeruj, jak sobie z nimi poradzić
12. Wymień potencjalne wyzwania związane z wdrożeniem tego widoku i zasugeruj możliwe rozwiązania

Po przeprowadzeniu analizy dostarcz plan wdrożenia w formacie Markdown z następującymi sekcjami:

1. Przegląd: Krótkie podsumowanie widoku i jego celu.
2. Routing widoku: Określenie ścieżki, na której widok powinien być dostępny.
3. Struktura komponentów: Zarys głównych komponentów i ich hierarchii.
4. Szczegóły komponentu: Dla każdego komponentu należy opisać:

- Opis komponentu, jego przeznaczenie i z czego się składa
- Główne elementy HTML i komponenty dzieci, które budują komponent
- Obsługiwane zdarzenia
- Warunki walidacji (szczegółowe warunki, zgodnie z API)
- Typy (DTO i ViewModel) wymagane przez komponent
- Propsy, które komponent przyjmuje od rodzica (interfejs komponentu)

5. Typy: Szczegółowy opis typów wymaganych do implementacji widoku, w tym dokładny podział wszelkich nowych typów lub modeli widoku według pól i typów.
6. Zarządzanie stanem: Szczegółowy opis sposobu zarządzania stanem w widoku, określenie, czy wymagany jest customowy hook.
7. Integracja API: Wyjaśnienie sposobu integracji z dostarczonym punktem końcowym. Precyzyjnie wskazuje typy żądania i odpowiedzi.
8. Interakcje użytkownika: Szczegółowy opis interakcji użytkownika i sposobu ich obsługi.
9. Warunki i walidacja: Opisz jakie warunki są weryfikowane przez interfejs, których komponentów dotyczą i jak wpływają one na stan interfejsu
10. Obsługa błędów: Opis sposobu obsługi potencjalnych błędów lub przypadków brzegowych.
11. Kroki implementacji: Przewodnik krok po kroku dotyczący implementacji widoku.

Upewnij się, że Twój plan jest zgodny z PRD, historyjkami użytkownika i uwzględnia dostarczony stack technologiczny.

Ostateczne wyniki powinny być w języku polskim i zapisane w pliku o nazwie .ai/{view-name}-view-implementation-plan.md. Nie uwzględniaj żadnej analizy i planowania w końcowym wyniku.

Oto przykład tego, jak powinien wyglądać plik wyjściowy (treść jest do zastąpienia):

```markdown
# Plan implementacji widoku [Nazwa widoku]

## 1. Przegląd

[Krótki opis widoku i jego celu]

## 2. Routing widoku

[Ścieżka, na której widok powinien być dostępny]

## 3. Struktura komponentów

[Zarys głównych komponentów i ich hierarchii]

## 4. Szczegóły komponentów

### [Nazwa komponentu 1]

- Opis komponentu [opis]
- Główne elementy: [opis]
- Obsługiwane interakcje: [lista]
- Obsługiwana walidacja: [lista, szczegółowa]
- Typy: [lista]
- Propsy: [lista]

### [Nazwa komponentu 2]

[...]

## 5. Typy

[Szczegółowy opis wymaganych typów]

## 6. Zarządzanie stanem

[Opis zarządzania stanem w widoku]

## 7. Integracja API

[Wyjaśnienie integracji z dostarczonym endpointem, wskazanie typów żądania i odpowiedzi]

## 8. Interakcje użytkownika

[Szczegółowy opis interakcji użytkownika]

## 9. Warunki i walidacja

[Szczegółowy opis warunków i ich walidacji]

## 10. Obsługa błędów

[Opis obsługi potencjalnych błędów]

## 11. Kroki implementacji

1. [Krok 1]
2. [Krok 2]
3. [...]
```

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku .ai/{view-name}-view-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacji.
