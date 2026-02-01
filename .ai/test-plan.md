# Plan Testów dla projektu fiszki

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu

Niniejszy dokument definiuje kompleksową strategię testowania aplikacji fiszki - webowej platformy do tworzenia i zarządzania fiszkami edukacyjnymi z wykorzystaniem sztucznej inteligencji i algorytmu spaced repetition.

### 1.2 Cele testowania

- **Weryfikacja funkcjonalności**: Zapewnienie, że wszystkie funkcjonalności działają zgodnie z wymaganiami z PRD
- **Bezpieczeństwo danych**: Potwierdzenie izolacji danych użytkowników (szczególnie krytyczne ze względu na wyłączony RLS)
- **Jakość integracji**: Weryfikacja prawidłowej komunikacji z zewnętrznymi serwisami (Supabase Auth, Openrouter.ai)
- **Wydajność i skalowalność**: Sprawdzenie rate limiting i optymalizacji zapytań bazodanowych
- **Dostępność**: Potwierdzenie zgodności z WCAG 2.1 Level AA
- **User Experience**: Weryfikacja responsywności, obsługi błędów i optimistic updates

### 1.3 Zakres czasowy

Plan obejmuje fazy testowania:

- Testy jednostkowe i integracyjne: iteracyjnie podczas developmentu
- Testy E2E: po zakończeniu implementacji każdej głównej funkcjonalności
- Testy bezpieczeństwa: przed wdrożeniem na produkcję
- Testy akceptacyjne: przed każdym release

## 2. Zakres testów

### 2.1 W zakresie testów

**Funkcjonalności:**

- System uwierzytelniania (rejestracja, logowanie, wylogowanie, usuwanie konta)
- Generowanie fiszek przez AI z walidacją tekstu źródłowego (1000-10000 znaków)
- Tryb demo dla niezalogowanych użytkowników
- CRUD operations dla fiszek (ręczne tworzenie, edycja, usuwanie)
- Akceptacja i edycja propozycji AI
- Filtrowanie i paginacja listy fiszek
- Sesja nauki z algorytmem spaced repetition
- Statystyki generowania i kolekcji fiszek
- Ochrona tras i middleware authorization

**Komponenty techniczne:**

- REST API endpoints (authentication, flashcards, generations, statistics)
- Integracja z Supabase Auth i Database
- Integracja z Openrouter.ai
- Middleware Astro
- Validation schemas (Zod)
- React components (interactive UI)
- Astro pages (SSR)
- Error handling i logging

**Bezpieczeństwo:**

- Autoryzacja na poziomie aplikacji (user_id filtering)
- JWT token management i refresh
- Rate limiting (10 req/h dla AI, 100 req/min dla reszty)
- SQL injection prevention
- XSS/CSRF protection
- Cascade delete przy usuwaniu konta

**UI/UX:**

- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA)
- Loading states i skeleton loaders
- Inline error messages
- Optimistic UI updates z rollback
- Keyboard navigation

### 2.2 Poza zakresem testów (w MVP)

- Zaawansowany algorytm powtórek (używamy gotowej biblioteki)
- Mechanizmy gamifikacji
- Import dokumentów (PDF, DOCX)
- Współdzielenie fiszek między użytkownikami
- Rozbudowany system powiadomień
- Zaawansowane wyszukiwanie fiszek
- Email confirmation przy rejestracji
- Reset/forgot password flow
- Strona ustawień użytkownika

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

**Zakres:**

- Validation schemas (Zod) dla formularzy i API
- Helper functions (auth-helpers, error mapping)
- Utility functions (formatowanie dat, hash generation)
- Pure functions w services

**Przykładowe scenariusze:**

- Walidacja email format, password length, text length (1000-10000)
- Mapowanie błędów Supabase Auth na przyjazne komunikaty
- Generowanie SHA-256 hash dla source_text
- Formatowanie statystyk (acceptance rate, edit rate calculations)

**Narzędzia:** Vitest, @testing-library/react (dla React hooks)

**Kryteria pokrycia:** Min. 80% dla critical business logic

### 3.2 Testy integracyjne (Integration Tests)

**Zakres:**

- API endpoints z rzeczywistą bazą danych (test database)
- Integracja z Supabase Auth
- Middleware authorization i token validation
- Database operations z foreign keys i cascade delete
- Error handling w API routes

**Przykładowe scenariusze:**

- `POST /api/flashcards` z JWT token → verify database insert z user_id
- `DELETE /api/auth/account` → verify cascade delete (flashcards, generations, error_logs)
- `POST /api/generations/generate` → mock Openrouter.ai, verify metadata save
- `GET /api/flashcards?source=manual` → verify filtering i user_id isolation
- Expired JWT → verify refresh token flow lub 401 response

**Narzędzia:** Vitest + Supabase local dev environment, MSW (Mock Service Worker) dla external APIs

**Środowisko:** Lokalny Supabase z test database

### 3.3 Testy End-to-End (E2E Tests)

**Zakres:**

- Kompletne user journeys przez aplikację
- Multi-page flows z rzeczywistym auth state
- Form submissions z walidacją
- Optimistic updates i error rollbacks
- Mobile i desktop viewports

**Scenariusze testowe:**
Szczegółowe scenariusze w sekcji 4.

**Narzędzia:** Playwright

**Środowisko:** Staging environment z test users

### 3.4 Testy bezpieczeństwa (Security Tests)

**Zakres (KRYTYCZNY):**

- **Data isolation**: Weryfikacja, że user A nie może dostać danych user B
- SQL injection attempts w query params i body
- XSS attempts w textarea i input fields
- CSRF token validation
- Rate limiting enforcement
- JWT token manipulation attempts
- Authorization bypass attempts

**Przykładowe scenariusze:**

- User A próbuje `GET /api/flashcards?user_id=B` → 403 lub filtracja po A
- User A próbuje `PUT /api/flashcards/:id_należący_do_B` → 404 (nie owned by user)
- SQL injection w `?source='OR 1=1--` → sanitized query
- Expired JWT bez refresh token → 401 i redirect do /login
- 11th AI generation request w ciągu godziny → 429 z retry-after header
- Manipulacja JWT payload (zmiana user_id claim) → 401 Invalid signature

**Narzędzia:** Custom test scripts, OWASP ZAP (optional), Playwright dla auth flows

**Krytyczność:** **BLOCKER** - musi przejść przed deployment

### 3.5 Testy wydajnościowe (Performance Tests)

**Zakres:**

- Response time dla API endpoints (target: <500ms dla CRUD, <5s dla AI generation)
- Database query optimization (n+1 problem, proper indexing)
- Rate limiting accuracy
- Concurrent user handling
- Memory leaks w React components

**Scenariusze:**

- 100 concurrent `GET /api/flashcards` requests → latency analysis
- Pagination performance z 1000+ flashcards → query time <200ms
- AI generation latency tracking → compare with SLA
- React component render profiling (Generation view z 20 suggestions)

**Narzędzia:** k6 lub Artillery (load testing), Lighthouse (frontend performance), Chrome DevTools Performance

**Kryteria:**

- API response time p95 < 500ms (non-AI endpoints)
- Lighthouse Performance score > 90
- No memory leaks po 10 min usage

### 3.6 Testy dostępności (Accessibility Tests)

**Zakres:**

- WCAG 2.1 Level AA compliance
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader compatibility (NVDA, JAWS)
- Focus management w modals i dropdowns
- Color contrast (min 4.5:1 dla tekstu)
- aria-labels, aria-live regions, semantic HTML

**Scenariusze:**

- Keyboard-only navigation przez cały flow (no mouse)
- Screen reader announces dla error messages (aria-live="polite")
- Modal focus trap → Escape closes → focus returns to trigger
- Form validation errors announced i linked (aria-describedby)
- Color contrast check dla wszystkich text/background combinations

**Narzędzia:** Axe DevTools, Lighthouse Accessibility audit, NVDA/JAWS manual testing

**Kryteria:** Axe violations = 0, Lighthouse Accessibility score = 100

### 3.7 Testy kompatybilności (Compatibility Tests)

**Zakres:**

- Browsers: Chrome, Firefox, Safari, Edge (latest versions)
- Devices: Desktop (1920x1080, 1366x768), Tablet (768px), Mobile (375px, 414px)
- Operating systems: Windows, macOS, iOS, Android

**Scenariusze:**

- Responsive layout na różnych breakpointach
- Touch gestures na mobile (swipe, tap)
- Form submissions na różnych przeglądarkach
- JWT cookie handling w różnych browsers

**Narzędzia:** BrowserStack lub Playwright multi-browser mode

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Autentykacja i autoryzacja

#### SC-AUTH-001: Rejestracja nowego użytkownika

**Cel:** Weryfikacja pomyślnej rejestracji i auto-login

**Kroki:**

1. Nawiguj do `/register`
2. Wprowadź email: `test@example.com`
3. Wprowadź hasło: `SecurePass123` (min 8 znaków)
4. Wprowadź potwierdzenie hasła: `SecurePass123`
5. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**

- Sukces API call `POST /auth/v1/signup`
- User automatycznie zalogowany (JWT token w httpOnly cookie)
- Redirect do `/generate`
- User record w `auth.users` table

**Warunki brzegowe:**

- Email już istnieje → error "Konto z tym adresem email już istnieje"
- Hasła nie pasują → error "Hasła nie są identyczne"
- Hasło < 8 znaków → error "Hasło musi mieć co najmniej 8 znaków"

#### SC-AUTH-002: Logowanie istniejącego użytkownika

**Cel:** Weryfikacja logowania z valid credentials

**Kroki:**

1. Nawiguj do `/login`
2. Wprowadź email: `existing@example.com`
3. Wprowadź hasło: `CorrectPassword`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- Sukces API call `POST /auth/v1/token?grant_type=password`
- JWT token zapisany w httpOnly cookie
- Redirect do `/generate`

**Warunki brzegowe:**

- Invalid credentials → error "Nieprawidłowy email lub hasło"
- Empty fields → client-side validation error

#### SC-AUTH-003: Wylogowanie

**Cel:** Weryfikacja wylogowania i czyszczenia sesji

**Kroki:**

1. Zaloguj się jako user
2. Kliknij user dropdown (top-right)
3. Kliknij "Wyloguj się"

**Oczekiwany rezultat:**

- API call: Supabase Auth logout
- JWT cookie cleared
- Redirect do `/login`
- Próba dostępu do `/flashcards` → redirect do `/login?return=/flashcards`

#### SC-AUTH-004: Usuwanie konta

**Cel:** Weryfikacja cascade delete i GDPR compliance

**Pre-conditions:**

- User zalogowany z 10 flashcards, 3 generations, 1 error log

**Kroki:**

1. Kliknij user dropdown
2. Kliknij "Usuń konto"
3. Modal otwiera się z ostrzeżeniem
4. Zaznacz checkbox "Rozumiem, że ta operacja jest nieodwracalna"
5. Kliknij "Usuń konto" (button becomes enabled)

**Oczekiwany rezultat:**

- API call: `DELETE /api/auth/account`
- Backend cascade deletes:
  - All flashcards WHERE user_id = [user]
  - All generations WHERE user_id = [user]
  - All generation_error_logs WHERE user_id = [user]
  - User record from auth.users (Supabase Admin API)
- Auto-logout
- Redirect do `/login` z message "Konto zostało usunięte"
- Database verification: 0 records dla deleted user_id

#### SC-AUTH-005: Ochrona tras - niezalogowany user

**Cel:** Weryfikacja middleware redirect

**Kroki:**

1. Wyloguj się (jeśli zalogowany)
2. Nawiguj bezpośrednio do `/flashcards`

**Oczekiwany rezultat:**

- Middleware intercepts request
- Redirect do `/login?return=/flashcards`
- Po zalogowaniu → redirect do `/flashcards` (preserved return URL)

#### SC-AUTH-006: Token expiration i refresh

**Cel:** Weryfikacja automatic token refresh

**Kroki:**

1. Zaloguj się jako user
2. Symuluj token expiration (manual cookie manipulation lub wait 1h)
3. Wykonaj akcję wymagającą auth (np. `GET /api/flashcards`)

**Oczekiwany rezultat:**

- Initial request fails z 401
- Supabase SDK automatycznie wywołuje refresh token
- Retry original request z nowym access token
- Success response

**Failure case (refresh token expired):**

- Refresh fails → 401
- Message: "Sesja wygasła. Zaloguj się ponownie."
- Redirect do `/login?return=[current_page]`

### 4.2 Generowanie fiszek przez AI

#### SC-GEN-001: Pomyślne generowanie fiszek

**Cel:** Happy path dla AI generation

**Pre-conditions:** User zalogowany

**Kroki:**

1. Nawiguj do `/generate` (lub `/`)
2. Wklej tekst do textarea (2500 znaków)
3. Character counter pokazuje "2500 / 10000" (green)
4. Validation message: "Długość tekstu OK"
5. Kliknij "Generuj fiszki"

**Oczekiwany rezultat:**

- Loading state: spinner + "Generowanie fiszek w toku..."
- Textarea i button disabled
- API call: `POST /api/generations/generate` z source_text
- Backend:
  - Hash calculation (SHA-256)
  - Openrouter.ai API call (mocked w integration tests)
  - Metadata save do `generations` table (user_id, model, generated_count, duration, hash)
- Success response: generation_id + flashcardSuggestions array (5-10 items)
- Loading znika
- Suggestions list renders poniżej formularza
- Auto-scroll do suggestions

**Database verification:**

- 1 new record w `generations` table z correct user_id, model, generated_count

#### SC-GEN-002: Walidacja długości tekstu - za krótki

**Cel:** Client-side validation dla min length

**Kroki:**

1. Nawiguj do `/generate`
2. Wpisz tekst: 500 znaków
3. Character counter: "500 / 10000" (red)
4. Próba kliknięcia "Generuj fiszki"

**Oczekiwany rezultat:**

- Button "Generuj fiszki" disabled
- Validation message: "Tekst musi mieć minimum 1000 znaków"
- Brak API call

#### SC-GEN-003: Walidacja długości tekstu - za długi

**Cel:** Client-side validation dla max length

**Kroki:**

1. Wklej tekst: 11000 znaków
2. Character counter: "11000 / 10000" (red)

**Oczekiwany rezultat:**

- Button disabled
- Validation message: "Tekst nie może przekraczać 10000 znaków"

#### SC-GEN-004: Rate limiting - przekroczony limit

**Cel:** Weryfikacja rate limiting (10 req/h)

**Pre-conditions:**

- User wykonał 10 generations w ostatniej godzinie

**Kroki:**

1. Spróbuj 11th generation

**Oczekiwany rezultat:**

- API response: `429 Too Many Requests`
- Error body:
  ```json
  {
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Generation rate limit exceeded",
      "details": { "reset_time": 1702558800 }
    }
  }
  ```
- UI inline error: "Osiągnięto limit generowań. Spróbuj ponownie za 45 minut."
- Button disabled until reset time
- (Optional) Countdown timer

#### SC-GEN-005: API failure - Openrouter.ai down

**Cel:** Graceful error handling dla external API failure

**Kroki:**

1. Mock Openrouter.ai response: 500 Internal Server Error
2. Spróbuj generation

**Oczekiwany rezultat:**

- API response: `500 Internal Server Error`
- Backend logs error do `generation_error_logs` table (user_id, model, hash, error_code, error_message)
- UI inline error: "Nie udało się wygenerować fiszek. Spróbuj ponownie."
- "Spróbuj ponownie" button visible
- Original text preserved w textarea
- Retry button → repeat API call

#### SC-GEN-006: Tryb demo dla niezalogowanych użytkowników

**Cel:** Generowanie w demo mode bez zapisu

**Pre-conditions:** User niezalogowany

**Kroki:**

1. Nawiguj do `/generate`
2. Wklej text (2500 znaków)
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat:**

- Generation działa normalnie (API call success)
- Suggestions list wyświetla się
- Banner pojawia się:
  - "Tryb Demo"
  - "Zarejestruj się, aby zapisać wygenerowane fiszki..."
  - Link do `/register`
- Przyciski "Zapisz zaznaczone" i "Zapisz wszystkie" **ukryte**
- Edycja suggestions: możliwa (tylko w memory, bez API save)
- Odświeżenie strony → suggestions znikają

### 4.3 Akceptacja i zarządzanie propozycjami AI

#### SC-GEN-007: Akceptacja propozycji bez edycji

**Cel:** Zapisanie AI-generated flashcards jako "ai-full"

**Pre-conditions:**

- User wykonał generation → 5 suggestions visible

**Kroki:**

1. Przejrzyj suggestions
2. Zaznacz checkbox przy 3 z 5 suggestions
3. Selection counter: "3 fiszek zaznaczonych"
4. Kliknij "Zapisz zaznaczone"

**Oczekiwany rezultat:**

- API call: `POST /api/generations/:id/accept`
- Request body:
  ```json
  {
    "flashcards": [
      { "front": "...", "back": "...", "edited": false },
      { "front": "...", "back": "...", "edited": false },
      { "front": "...", "back": "...", "edited": false }
    ]
  }
  ```
- Backend:
  - Verify generation belongs to user
  - Insert 3 flashcards z source="ai-full", generation_id=[id], user_id=[user]
  - Update generation: accepted_unedited_count=3, accepted_edited_count=0
- Success response: list of created flashcards
- UI: "3 fiszki zostały zapisane pomyślnie"
- Suggestions list znika
- Textarea clears (ready for next generation)

**Database verification:**

- 3 new records w `flashcards` table z correct user_id, source="ai-full", generation_id
- `generations` record updated z accepted_unedited_count=3

#### SC-GEN-008: Edycja propozycji przed akceptacją

**Cel:** Zapisanie edited flashcards jako "ai-edited"

**Kroki:**

1. Po generation: 5 suggestions visible
2. Kliknij "Edytuj" na suggestion #2
3. Inline form pojawia się:
   - Front textarea (pre-filled)
   - Back textarea (pre-filled)
   - Character counters
4. Modyfikuj back text: dodaj "Paris is the capital and largest city of France."
5. Kliknij "Zapisz"

**Oczekiwany rezultat:**

- Inline form znika
- Card updates z nową treścią
- Checkbox auto-checked (oznacza edited + accepted)
- Internal state: `edited: true` dla tej fiszki

**Następnie:** 6. Zaznacz też 2 inne (unedited) suggestions 7. Kliknij "Zapisz zaznaczone" (total: 3 zaznaczone, 1 edited)

**Oczekiwany rezultat API:**

- Request body:
  ```json
  {
    "flashcards": [
      { "front": "...", "back": "... (original)", "edited": false },
      { "front": "...", "back": "... (modified)", "edited": true },
      { "front": "...", "back": "... (original)", "edited": false }
    ]
  }
  ```
- Backend sets source:
  - edited: false → source="ai-full"
  - edited: true → source="ai-edited"
- Update generation: accepted_unedited_count=2, accepted_edited_count=1

**Database verification:**

- 2 flashcards z source="ai-full"
- 1 flashcard z source="ai-edited"

#### SC-GEN-009: Odrzucenie propozycji

**Cel:** Usunięcie suggestion z listy

**Kroki:**

1. Po generation: 5 suggestions
2. Kliknij "Odrzuć" na suggestion #3
3. (Optional) Confirmation modal: "Czy na pewno odrzucić?"
4. Confirm

**Oczekiwany rezultat:**

- Card znika z listy (removed from local state)
- Brak API call (odrzucenie = po prostu nie save)
- Pozostałe 4 suggestions visible

### 4.4 Zarządzanie fiszkami (CRUD)

#### SC-FLASH-001: Wyświetlanie listy fiszek

**Cel:** Pagination i filtering

**Pre-conditions:**

- User ma 150 flashcards (55 manual, 70 ai-full, 25 ai-edited)

**Kroki:**

1. Nawiguj do `/flashcards`

**Oczekiwany rezultat:**

- API call: `GET /api/flashcards?page=1&limit=20&sort=created_at&order=desc`
- Loading skeletons podczas fetch
- Grid renders z 20 flashcards
- Pagination: "Strona 1 z 8"
- Filter tabs:
  - "Wszystkie (150)" [active]
  - "Manualne (55)"
  - "AI (nieedytowane) (70)"
  - "AI (edytowane) (25)"

**Database verification:**

- Query includes `WHERE user_id = [user]` (user isolation)

#### SC-FLASH-002: Filtrowanie fiszek

**Cel:** Source filtering

**Kroki:**

1. Kliknij tab "Manualne"

**Oczekiwany rezultat:**

- URL updates: `/flashcards?source=manual`
- API call: `GET /api/flashcards?source=manual&page=1&limit=20`
- Grid re-renders z tylko manual flashcards
- Pagination: "Strona 1 z 3" (55 / 20 = 3 pages)
- Active tab: "Manualne (55)"

#### SC-FLASH-003: Tworzenie fiszki ręcznie

**Cel:** Manual flashcard creation

**Kroki:**

1. Na `/flashcards`, kliknij "+ Nowa fiszka"
2. Modal opens, focus na front field
3. Wprowadź front: "Jak nazywa się stolica Polski?"
4. Character counter: "33 / 200"
5. Wprowadź back: "Warszawa"
6. Character counter: "8 / 500"
7. Kliknij "Zapisz"

**Oczekiwany rezultat:**

- API call: `POST /api/flashcards` (single flashcard)
- Request body:
  ```json
  {
    "front": "Jak nazywa się stolica Polski?",
    "back": "Warszawa",
    "source": "manual",
    "generation_id": null
  }
  ```
- Backend insert z user_id from JWT
- Success response: created flashcard z id
- Modal closes
- New flashcard appears w grid (optimistic add, top of list)
- Success message: "Fiszka utworzona"

**Database verification:**

- 1 new record z source="manual", user_id=[user], generation_id=null

#### SC-FLASH-004: Edycja istniejącej fiszki

**Cel:** Update flashcard

**Kroki:**

1. Kliknij "Edytuj" na konkretnej karcie
2. Modal opens (edit mode) z pre-filled values
3. Modyfikuj back text: "Warszawa jest stolicą Polski i jej największym miastem."
4. Character counter updates
5. Kliknij "Zapisz"

**Oczekiwany rezultat:**

- API call: `PUT /api/flashcards/:id`
- Request body: `{ "back": "Warszawa jest stolicą Polski..." }`
- Backend:
  - Verify flashcard belongs to user: `WHERE id = :id AND user_id = [user]`
  - Update record
- Success response: updated flashcard
- Card w grid updates immediately (optimistic)
- Modal closes
- Success message: "Fiszka zaktualizowana"

#### SC-FLASH-005: Usuwanie fiszki

**Cel:** Delete z confirmation

**Kroki:**

1. Kliknij "Usuń" na karcie
2. Confirmation modal: "Usunąć fiszkę? Ta operacja jest nieodwracalna."
3. Kliknij "Usuń" (confirm)

**Oczekiwany rezultat:**

- Card znika z grid immediately (optimistic delete)
- API call: `DELETE /api/flashcards/:id`
- Backend:
  - Verify ownership: `WHERE id = :id AND user_id = [user]`
  - Delete record
- Success response
- Success message: "Fiszka usunięta"

**Error case:**

- API fails z 500 → card reappears (rollback)
- Error message: "Nie udało się usunąć fiszki. Spróbuj ponownie."

#### SC-FLASH-006: Validation przy tworzeniu - puste pola

**Cel:** Client-side validation

**Kroki:**

1. Otwórz modal "Nowa fiszka"
2. Wypełnij tylko front: "Test pytanie"
3. Zostawia back puste
4. Kliknij "Zapisz"

**Oczekiwany rezultat:**

- Validation error inline pod back field: "Tył fiszki nie może być pusty"
- Button "Zapisz" disabled
- Brak API call

**Fix:** 5. Wypełnij back: "Test odpowiedź" 6. Validation passes, button enabled 7. Submit succeeds

#### SC-FLASH-007: Izolacja danych użytkowników (SECURITY - CRITICAL)

**Cel:** Weryfikacja, że user A nie widzi fiszek user B

**Pre-conditions:**

- User A: 10 flashcards
- User B: 15 flashcards

**Kroki:**

1. Zaloguj jako User A
2. `GET /api/flashcards`

**Oczekiwany rezultat:**

- Response: 10 flashcards (tylko User A)
- Database query: `SELECT * FROM flashcards WHERE user_id = 'A' ...`

**Attack scenario (manual API call):** 3. Spróbuj `GET /api/flashcards?user_id=B` (manipulation attempt)

**Oczekiwany rezultat:**

- Backend MUSI ignorować client-provided user_id
- Backend MUSI używać user_id from JWT token
- Response: 10 flashcards (User A only)

**Attack scenario 2:** 4. User A dostaje ID fiszki User B (np. id=999) 5. Spróbuj `PUT /api/flashcards/999` (edit attempt)

**Oczekiwany rezultat:**

- Backend query: `WHERE id = 999 AND user_id = 'A'`
- No record found (999 należy do B)
- Response: `404 Not Found` (not "403 Forbidden" - don't leak existence)

### 4.5 Sesja nauki (Spaced Repetition)

#### SC-LEARN-001: Rozpoczęcie sesji nauki

**Cel:** Load scheduled flashcards

**Pre-conditions:**

- User ma 50 flashcards
- 15 flashcards zaplanowanych na dzisiaj (by algorithm)

**Kroki:**

1. Kliknij "Sesja nauki" w navigation
2. Redirect do `/learn`

**Oczekiwany rezultat:**

- API call: `GET /api/learning/session` (endpoint TBD)
- Response: array of 15 flashcards (sorted by algorithm priority)
- First card loads:
  - Progress: "Fiszka 1 z 15"
  - Progress bar: 6.7% filled
  - Front text visible: "What is the capital of France?"
  - "Pokaż odpowiedź" button visible, auto-focused

#### SC-LEARN-002: Przejście przez sesję nauki

**Cel:** Rating flashcards i progress tracking

**Kroki:**

1. User czyta front fiszki
2. Kliknij "Pokaż odpowiedź" (lub Space key)
3. Card flips (animation)
4. Back text appears: "Paris"
5. Rating buttons appear:
   - "Powtórz" (Again)
   - "Trudne" (Hard)
   - "Dobre" (Good)
   - "Łatwe" (Easy)
6. User klika "Dobre" (lub keyboard: 3)

**Oczekiwany rezultat:**

- API call: `POST /api/learning/rate` z flashcard_id + rating="good"
- Backend updates spaced repetition metadata:
  - next_review_date (calculated by algorithm)
  - ease_factor (updated)
  - interval (days until next review)
- Success response
- Next card auto-loads (transition animation)
- Progress updates: "Fiszka 2 z 15", progress bar: 13.3%

**Repeat 6 for all 15 cards**

#### SC-LEARN-003: Zakończenie sesji

**Cel:** Session completion screen

**Po ostatniej karcie (15/15) rated:**

**Oczekiwany rezultat:**

- SessionComplete screen appears:
  - Success icon/illustration
  - "Sesja zakończona!"
  - "Przejrzano 15 fiszek"
  - "Następna sesja za 8 godzin" (calculated by algorithm)
  - "Wróć do fiszek" button
- User klika button → redirect do `/flashcards`

#### SC-LEARN-004: Empty state - brak fiszek do nauki

**Cel:** Handle 0 cards scheduled

**Pre-conditions:**

- User ma fiszki, ale wszystkie reviewed today, none scheduled

**Kroki:**

1. Nawiguj do `/learn`

**Oczekiwany rezultat:**

- API response: empty array (0 cards)
- EmptyState component renders:
  - Illustration (celebration icon)
  - "Brak fiszek do nauki dzisiaj. Świetna robota!"
  - "Wróć do Moich fiszek" button
- User klika button → redirect do `/flashcards`

#### SC-LEARN-005: Przedwczesne wyjście z sesji

**Cel:** Confirmation i progress save

**Kroki:**

1. Start session (15 cards)
2. Rate 7 cards (progress: 7/15)
3. Kliknij "Zakończ sesję" (lub Escape key)

**Oczekiwany rezultat:**

- Confirmation modal opens:
  - "Czy na pewno chcesz zakończyć sesję?"
  - "Twój postęp z dotychczasowych 7 kart został zapisany."
  - Actions: "Kontynuuj sesję" / "Zakończ"

**If "Zakończ":**

- Modal closes
- Redirect do `/flashcards`
- Ratings dla 7 cards saved (persistent w database)
- 8 remaining cards pozostają scheduled

**If "Kontynuuj sesję":**

- Modal closes
- User wraca do card #8

### 4.6 Statystyki

#### SC-STATS-001: Wyświetlanie statystyk generowania

**Cel:** Generation metrics aggregation

**Pre-conditions:**

- User: 25 generations total
- 125 generated flashcards
- 95 accepted (70 unedited, 25 edited)

**Kroki:**

1. Nawiguj do `/stats`

**Oczekiwany rezultat:**

- API call: `GET /api/statistics/generations?period=all`
- Loading skeletons
- Stats render:
  - "Łączna liczba generowań": 25
  - "Wskaźnik akceptacji": 76.0% (95/125 \* 100) - green indicator (>70%)
  - "Wskaźnik edycji": 26.3% (25/95 \* 100)
  - "Średni czas generowania": 3.25s
  - Models breakdown:
    - GPT-4: 15 generowań
    - GPT-3.5-turbo: 10 generowań

**Database verification:**

- Query aggregates from `generations` table WHERE user_id=[user]
- Calculations correct

#### SC-STATS-002: Filtrowanie statystyk po okresie

**Cel:** Time period filtering

**Kroki:**

1. Kliknij filter button "30 dni"

**Oczekiwany rezultat:**

- URL updates: `/stats?period=30d`
- API call: `GET /api/statistics/generations?period=30d`
- Generation metrics re-render z filtered data (only last 30 days)
- Collection metrics remain unchanged (no period filter)

#### SC-STATS-003: Statystyki kolekcji fiszek

**Cel:** Flashcard collection breakdown

**Oczekiwany rezultat (na `/stats`):**

- API call: `GET /api/statistics/flashcards`
- Stats render:
  - "Łączna liczba fiszek": 150
  - "Ręczne": 55 (36.7%)
  - "AI (nieedytowane)": 70 (46.7%)
  - "AI (edytowane)": 25 (16.7%)
  - Pie chart: 63.3% AI-created ((70+25)/150 \* 100)

**Database verification:**

- Query: `SELECT source, COUNT(*) FROM flashcards WHERE user_id=[user] GROUP BY source`

### 4.7 UI/UX i Accessibility

#### SC-UI-001: Responsive design - mobile viewport

**Cel:** Layout adaptacja na mobile

**Kroki:**

1. Resize viewport do 375px width (iPhone)
2. Nawiguj przez wszystkie główne views

**Oczekiwany rezultat:**

- Topbar: Logo + hamburger menu (nie full navigation)
- Grid layouts: 1 column (flashcards list)
- Forms: full width, large touch targets (min 44x44px)
- Modals: full-screen lub nearly full-screen
- Text readable (min 16px body)
- No horizontal scroll

#### SC-UI-002: Keyboard navigation

**Cel:** Full keyboard accessibility

**Kroki:**

1. Na `/generate`, użyj tylko keyboard (no mouse):
   - Tab przez formularz
   - Focus na textarea, wpisz text
   - Tab do "Generuj fiszki" button
   - Enter → submit

**Oczekiwany rezultat:**

- Focus indicators visible (ring/outline) na każdym elemencie
- Tab order logiczny (top-to-bottom, left-to-right)
- Enter key submits form

2. Po generation, suggestions list:
   - Tab przez checkboxes i buttons
   - Space → toggle checkbox
   - Tab do "Edytuj" → Enter opens inline form
   - Escape → cancel edit

3. Modal navigation:
   - Modal opens → focus trap (Tab nie wychodzi poza modal)
   - Escape closes modal
   - Focus returns do trigger button po zamknięciu

#### SC-UI-003: Screen reader compatibility

**Cel:** NVDA/JAWS announcements

**Kroki:**

1. Enable screen reader (NVDA)
2. Na `/generate`, wpisz za krótki tekst (< 1000 znaków)

**Oczekiwany rezultat:**

- Character counter z aria-live="polite" announces: "500 z 10000 znaków"
- Validation error z aria-live="polite" announces: "Tekst musi mieć minimum 1000 znaków"

3. Submit form z błędem

**Oczekiwany rezultat:**

- Error message z aria-describedby linked do input
- Screen reader announces error i focuses na input field

4. Modal opens

**Oczekiwany rezultat:**

- aria-labelledby announces modal title
- Focus moves do close button lub first form field

#### SC-UI-004: Color contrast

**Cel:** WCAG 2.1 AA compliance

**Kroki:**

1. Use Axe DevTools lub Chrome DevTools Accessibility panel
2. Scan wszystkie pages

**Oczekiwany rezultat:**

- Wszystkie text/background combinations: min 4.5:1 contrast ratio
- Large text (18px+): min 3:1
- Interactive elements (buttons, links): visible focus state z sufficient contrast
- Axe violations = 0

#### SC-UI-005: Loading states i optimistic updates

**Cel:** User feedback podczas async operations

**Kroki:**

1. Kliknij "Zapisz" na nowej fiszce (simulate slow network: DevTools throttling)

**Oczekiwany rezultat:**

- Button shows loading spinner
- Button disabled podczas API call
- Card pojawia się w grid immediately (optimistic add)
- Skeleton loader (optional) podczas fetch

2. API fails (mock 500 error)

**Oczekiwany rezultat:**

- Card disappears (rollback optimistic add)
- Error message inline: "Nie udało się utworzyć fiszki. Spróbuj ponownie."
- Button enabled again

### 4.8 Error Handling

#### SC-ERR-001: Network failure - offline

**Cel:** Graceful degradation

**Kroki:**

1. Disable network (DevTools offline mode)
2. Spróbuj operation (np. save flashcard)

**Oczekiwany rezultat:**

- API call fails
- Error message: "Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie."
- Retry button visible
- User może restore network → retry succeeds

#### SC-ERR-002: Server error - 500

**Cel:** Generic error handling

**Kroki:**

1. Mock API endpoint: 500 Internal Server Error
2. Spróbuj operation

**Oczekiwany rezultat:**

- Error message: "Wystąpił błąd serwera. Spróbuj ponownie."
- Original state preserved (np. form data, textarea content)
- Retry button available

#### SC-ERR-003: Validation error - backend reject

**Cel:** Backend validation feedback

**Kroki:**

1. Bypass client validation (manipulate request)
2. Submit invalid data (np. flashcard front > 200 chars)

**Oczekiwany rezultat:**

- API response: `400 Bad Request`
- Error body:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Front text exceeds maximum length of 200 characters",
      "details": { "field": "front", "max_length": 200, "provided_length": 250 }
    }
  }
  ```
- UI displays inline error pod front field: "Przód fiszki nie może przekraczać 200 znaków"

## 5. Środowisko testowe

### 5.1 Środowiska

**Lokalne (Development):**

- Localhost: `http://localhost:4321`
- Supabase Local Dev: `http://localhost:54321` (via Supabase CLI)
- Mock Openrouter.ai: MSW (Mock Service Worker)

**Staging:**

- URL: `https://staging.fiszki.app` (TBD)
- Supabase Staging Project
- Openrouter.ai: Test API key z niższym rate limiting

**Production:**

- URL: `https://fiszki.app` (TBD)
- Supabase Production Project
- Openrouter.ai: Production API key

### 5.2 Testowe dane

**Test Users:**

- `test-user-a@example.com` / `TestPass123` - 50 flashcards, 10 generations
- `test-user-b@example.com` / `TestPass123` - 0 flashcards (new user)
- `test-user-security@example.com` / `TestPass123` - for security testing

**Test Flashcards:**

- Seed database z mixed sources (manual, ai-full, ai-edited)
- Various creation dates (dla spaced repetition testing)

**Test Generations:**

- Pre-seeded generation records z różnymi models, acceptance rates

### 5.3 Konfiguracja środowiska

**Required ENV variables:**

```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
OPENROUTER_API_KEY=[api-key]
```

**Database setup:**

- Run migrations: `supabase db push`
- Seed data: `npm run db:seed`
- Reset: `supabase db reset`

**Supabase Auth setup:**

- Email provider enabled
- Email confirmation: DISABLED (MVP)
- Password min length: 8 characters
- JWT expiration: 1 hour
- Refresh token expiration: 7 days

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe i integracyjne

**Vitest** - Test runner dla TypeScript/JavaScript

- Konfiguracja: `vitest.config.ts`
- Komendy:
  - `npm run test` - run all tests
  - `npm run test:watch` - watch mode
  - `npm run test:coverage` - coverage report (target: 80%)

**@testing-library/react** - React component testing

- User-centric testing approach
- DOM queries, events, async utils

**MSW (Mock Service Worker)** - API mocking

- Mock Openrouter.ai responses
- Mock Supabase Auth responses (optional)
- Setup w `src/tests/mocks/handlers.ts`

### 6.2 Testy E2E

**Playwright** - End-to-end testing

- Multi-browser support (Chromium, Firefox, WebKit)
- Konfiguracja: `playwright.config.ts`
- Komendy:
  - `npm run test:e2e` - run E2E tests
  - `npm run test:e2e:ui` - interactive UI mode
  - `npm run test:e2e:debug` - debug mode
- Page Object Model pattern dla reusability

### 6.3 Testy bezpieczeństwa

**Custom security test suite** - Vitest-based

- SQL injection attempts
- Authorization bypass scenarios
- Data isolation verification
- JWT manipulation tests

**OWASP ZAP** (optional) - Security scanner

- Automated vulnerability scanning
- Run przed production deployment

### 6.4 Testy wydajnościowe

**k6** - Load testing

- Script w `tests/performance/load-test.js`
- Scenarios:
  - 100 concurrent users na `/api/flashcards`
  - AI generation stress test (rate limiting verification)
- Komendy: `k6 run tests/performance/load-test.js`

**Lighthouse** - Frontend performance

- Automated audits via Playwright
- Metrics: Performance, Accessibility, Best Practices, SEO
- Target scores: Performance > 90, Accessibility = 100

### 6.5 Testy dostępności

**Axe DevTools** - Accessibility testing

- Automated WCAG 2.1 checks
- Integration z Playwright: `@axe-core/playwright`
- Komendy: `npm run test:a11y`

**Manual testing:**

- NVDA (screen reader) - Windows
- JAWS (screen reader) - Windows
- VoiceOver - macOS/iOS
- Keyboard-only navigation

### 6.6 Narzędzia pomocnicze

**Supabase CLI** - Database management

- Local dev environment: `supabase start`
- Migrations: `supabase migration new [name]`
- Studio UI: `http://localhost:54323`

**Chrome DevTools**

- Network throttling (simulate slow connections)
- Device emulation (responsive testing)
- Performance profiling
- Accessibility panel

**BrowserStack** (optional) - Cross-browser testing

- Real device testing (iOS, Android)
- Legacy browser support verification

## 7. Harmonogram testów

### 7.1 Faza developmentu (iteracyjna)

**Tydzień 1-2: Autentykacja**

- Unit tests dla validation schemas → dzień 1-2
- Integration tests dla auth endpoints → dzień 3-4
- E2E tests dla login/register/logout flows → dzień 5-6
- Security tests dla data isolation → dzień 7

**Tydzień 3-4: Generowanie fiszek AI**

- Unit tests dla text validation, hash generation → dzień 1
- Integration tests dla `/api/generations/generate` (z MSW mock) → dzień 2-3
- E2E tests dla generation flow + acceptance → dzień 4-5
- Performance tests dla rate limiting → dzień 6-7

**Tydzień 5-6: Zarządzanie fiszkami**

- Unit tests dla flashcard validation → dzień 1
- Integration tests dla CRUD endpoints → dzień 2-3
- E2E tests dla list view, filtering, pagination → dzień 4-5
- Security tests dla authorization (user isolation) → dzień 6-7

**Tydzień 7: Sesja nauki**

- Integration tests dla learning session endpoints → dzień 1-2
- E2E tests dla session flow (rating, progress) → dzień 3-4
- Unit tests dla spaced repetition calculations → dzień 5

**Tydzień 8: Statystyki i UI/UX**

- Integration tests dla statistics endpoints → dzień 1-2
- E2E tests dla stats view + filtering → dzień 3
- Accessibility tests (Axe + manual) → dzień 4-5
- Responsive design tests → dzień 6
- Cross-browser tests → dzień 7

### 7.2 Faza pre-deployment

**Tydzień 9: Comprehensive testing**

- Regression testing (run all test suites) → dzień 1-2
- Security audit (OWASP ZAP scan + manual review) → dzień 3-4
- Performance testing (k6 load tests, Lighthouse audits) → dzień 5
- Bug fixing i retesting → dzień 6-7

**Tydzień 10: UAT (User Acceptance Testing)**

- Staging deployment → dzień 1
- Internal QA team testing → dzień 2-3
- Beta users testing (optional) → dzień 4-5
- Final fixes → dzień 6-7

### 7.3 Post-deployment

**Monitoring (ciągłe):**

- Production error tracking (Sentry lub podobne)
- Performance monitoring (Supabase analytics)
- User feedback collection

**Regression testing (co 2 tygodnie):**

- Run full E2E test suite na staging przed każdym release
- Critical path smoke tests na production po każdym deployment

## 8. Kryteria akceptacji testów

### 8.1 Kryteria minimalnego przejścia (MVP Release)

**Testy jednostkowe:**

- ✅ 100% critical business logic covered (validation, calculations)
- ✅ Min. 80% overall code coverage
- ✅ 0 failing tests

**Testy integracyjne:**

- ✅ Wszystkie API endpoints przetestowane (CRUD, generations, statistics)
- ✅ Database operations verified (insert, update, delete, cascade)
- ✅ Supabase Auth integration working (login, register, logout)
- ✅ 0 failing tests

**Testy E2E:**

- ✅ Wszystkie kluczowe user journeys passing:
  - Rejestracja → generowanie → akceptacja → flashcards list → sesja nauki
  - Login → ręczne tworzenie → edycja → usuwanie
  - Statystyki → filtrowanie → logout
- ✅ Multi-browser tests passing (Chrome, Firefox, Safari)
- ✅ Mobile viewport tests passing
- ✅ 0 failing tests

**Testy bezpieczeństwa (BLOCKER):**

- ✅ Data isolation verified: User A nie widzi danych User B
- ✅ Authorization bypass attempts blocked
- ✅ SQL injection attempts sanitized
- ✅ XSS attempts blocked
- ✅ Rate limiting enforced (10 req/h AI, 100 req/min rest)
- ✅ JWT token validation working (expiration, refresh, manipulation detection)
- ✅ Cascade delete verified (account deletion removes all user data)

**Testy wydajnościowe:**

- ✅ API response time p95 < 500ms (non-AI endpoints)
- ✅ Lighthouse Performance score > 90
- ✅ No memory leaks detected (10 min usage test)
- ✅ Database queries optimized (no n+1 problems)

**Testy dostępności:**

- ✅ Axe violations = 0 (all pages)
- ✅ Lighthouse Accessibility score = 100
- ✅ Keyboard navigation fully functional (all flows completable)
- ✅ Screen reader compatible (NVDA basic testing passing)

**Bug severity limits:**

- ✅ 0 Critical bugs (app unusable, data loss, security breach)
- ✅ 0 High bugs (major functionality broken)
- ✅ < 5 Medium bugs (minor functionality issues, workarounds available)
- Low bugs (cosmetic, minor UX issues) - acceptable

### 8.2 Kryteria jakości (Quality Gates)

**Code quality:**

- ESLint: 0 errors (warnings acceptable)
- TypeScript: 0 type errors
- Prettier: all files formatted

**Documentation:**

- README updated z setup instructions
- API documentation complete (endpoints, request/response schemas)
- Test documentation up-to-date

**Database:**

- All migrations applied successfully
- RLS policies reviewed (nawet jeśli disabled, dokumentacja zaktualizowana)
- Indexes verified (user_id, generation_id)
- Foreign keys z CASCADE DELETE working

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 Zespół testowy

**QA Engineer (Lead):**

- Tworzenie i utrzymanie planu testów
- Koordynacja testowania (scheduling, prioritization)
- Review test results i bug reports
- Sign-off przed deployment
- Communication z Product Owner i Dev Team

**Developers:**

- Unit tests dla własnego kodu (TDD approach)
- Integration tests dla API endpoints
- Fixing bugs assigned from QA
- Code reviews (including test code)
- Pair testing z QA dla complex features

**Frontend Developer:**

- React component tests
- E2E tests dla UI flows (współpraca z QA)
- Accessibility fixes (Axe violations)
- Responsive design verification

**Backend Developer:**

- API endpoint tests (integration)
- Database query optimization
- Security testing support (authorization logic)
- Rate limiting implementation i testing

**DevOps Engineer:**

- CI/CD pipeline setup dla automated tests
- Test environment management (staging, test databases)
- Performance monitoring setup (production)
- Load testing infrastructure (k6 setup)

### 9.2 External roles

**Product Owner:**

- UAT coordination (staging testing)
- Acceptance criteria definition
- Priority decisions dla bug fixes
- Final approval przed production deployment

**Beta Users (optional):**

- Real-world usage testing na staging
- Feedback collection
- Edge case discovery

## 10. Procedury raportowania błędów

### 10.1 Kanały raportowania

**Dla zespołu wewnętrznego:**

- GitHub Issues (primary) - `https://github.com/[org]/fiszki/issues`
- Labels: `bug`, `security`, `performance`, `accessibility`, `ui/ux`
- Severity labels: `critical`, `high`, `medium`, `low`

**Dla użytkowników (post-MVP):**

- Email: `support@fiszki.app` (TBD)
- In-app feedback form (future feature)

### 10.2 Format raportu błędu

**Required fields:**

```markdown
## Bug Title

[Krótki, opisowy tytuł - max 80 znaków]

## Severity

[Critical / High / Medium / Low]

## Environment

- **URL:** [e.g., https://staging.fiszki.app/flashcards]
- **Browser:** [e.g., Chrome 120.0.6099.109]
- **Device:** [e.g., Desktop Windows 11, iPhone 14 iOS 17]
- **User:** [e.g., test-user-a@example.com]

## Steps to Reproduce

1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

## Expected Result

[Co powinno się stać]

## Actual Result

[Co faktycznie się stało]

## Screenshots/Videos

[Załącz zrzuty ekranu lub video jeśli możliwe]

## Console Errors

[Załącz błędy z browser console / network tab]

## Additional Context

[Dodatkowe informacje: częstotliwość występowania, workaround, related issues]
```

### 10.3 Bug severity definitions

**Critical:**

- App jest całkowicie unusable (nie można się zalogować, white screen)
- Security breach (data leak, unauthorized access)
- Data loss (user traci fiszki, account deletion fails)
- **SLA:** Fix within 24 hours, hotfix deployment

**High:**

- Major functionality broken (nie można tworzyć fiszek, AI generation fails zawsze)
- Affects large % users
- No workaround available
- **SLA:** Fix within 3 days, include in next release

**Medium:**

- Minor functionality issues (filtering nie działa, pagination bug)
- Affects specific use case
- Workaround available
- **SLA:** Fix within 1-2 weeks, include in next release

**Low:**

- Cosmetic issues (alignment off, text typo)
- Minor UX annoyances
- Does not impact functionality
- **SLA:** Fix in backlog, prioritize based on effort

### 10.4 Bug workflow

**Status flow:**

1. **New** - Bug reported, awaiting triage
2. **Confirmed** - QA verified, ready for assignment
3. **In Progress** - Developer assigned, working on fix
4. **In Review** - Fix implemented, code review pending
5. **Testing** - QA retesting fix
6. **Resolved** - Fix verified, closed
7. **Reopened** - Fix insufficient, back to In Progress

**Triage process (daily):**

- QA Lead reviews New bugs
- Assigns severity i priority
- Duplicates closed, links added
- Critical/High bugs escalated immediately

### 10.5 Regression testing po fix

**Przed zamknięciem bug ticket:**

1. Developer fix committed → PR created
2. Code review approval
3. Automated tests passing (unit, integration, E2E related)
4. QA manual retest (verify fix)
5. Regression check (verify no new bugs introduced)
6. Ticket closed z comment: "Verified on [environment] [date]"

---

## Podsumowanie

Niniejszy plan testów zapewnia kompleksowe pokrycie wszystkich krytycznych obszarów aplikacji fiszki. Szczególny nacisk położony jest na **bezpieczeństwo danych użytkowników** (izolacja z wyłączonym RLS), **integrację z zewnętrznymi serwisami** (Supabase, Openrouter.ai), oraz **accessibility** (WCAG 2.1 AA).

Harmonogram testów jest dostosowany do iteracyjnego procesu developmentu, z continuous testing podczas implementacji oraz dedykowaną fazą comprehensive testing przed deployment.

Kryteria akceptacji są jasno zdefiniowane, z zerowymi tolerancjami dla critical bugs i security issues. Plan jest elastyczny i będzie aktualizowany w miarę ewolucji projektu.

**Kluczowe priorytety testowe:**

1. **Security** (data isolation, authorization, rate limiting)
2. **Core functionality** (auth, AI generation, flashcard CRUD)
3. **User experience** (responsive, accessible, error handling)
4. **Performance** (API latency, database optimization)
