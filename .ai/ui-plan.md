# Architektura UI dla fiszki

## 1. Przegląd struktury UI

Aplikacja fiszki jest webową platformą do tworzenia i zarządzania fiszkami edukacyjnymi z wykorzystaniem sztucznej inteligencji (LLM) oraz algorytmu spaced repetition. Architektura UI opiera się na następującym stosie technologicznym:

**Frontend:**

- Astro 5 jako główny framework
- React 19 dla komponentów interaktywnych
- TypeScript 5 dla statycznego typowania
- Tailwind CSS 4 dla stylowania
- Shadcn/ui jako biblioteka komponentów

**Backend:**

- Supabase (PostgreSQL, Authentication)
- REST API z endpointami pod prefixem `/api`
- Openrouter.ai dla generowania fiszek przez AI

**Główne zasady projektowe:**

- Mobile-first responsive design
- Zgodność z WCAG 2.1 Level AA
- Minimalizacja JavaScriptu (wykorzystanie Astro dla statycznych części)
- Optymistyczne aktualizacje UI z obsługą błędów
- Inline komunikaty błędów (nie toast notifications)

Struktura aplikacji składa się z 6 głównych widoków: ekrany uwierzytelniania, widok generowania fiszek z AI, widok listy fiszek, widok sesji nauki, widok statystyk oraz panel użytkownika (dropdown w topbarze).

## 2. Lista widoków

### 2.1 Widok logowania (/login)

**Główny cel:** Umożliwienie zalogowania się zarejestrowanym użytkownikom.

**Kluczowe informacje do wyświetlenia:**

- Formularz logowania (email, hasło)
- Link do rejestracji
- Komunikaty błędów (inline)

**Kluczowe komponenty widoku:**

- `LoginForm` (React):
  - Email input field (type="email", required)
  - Password input field (type="password", required, z toggle visibility)
  - Submit button ("Zaloguj się")
  - Link: "Nie masz konta? Zarejestruj się"
  - Error display area (aria-live="polite")
- Logo aplikacji (Astro component)
- Layout wrapper (centered, max-width)

**UX, dostępność i względy bezpieczeństwa:**

- **UX:**
  - Auto-focus na polu email
  - Enter key submits form
  - Loading state na przycisku podczas API call
  - Jasne komunikaty błędów: "Nieprawidłowy email lub hasło"
  - Zachowanie wprowadzonego emaila po błędzie
- **Dostępność:**
  - Labels powiązane z inputami (htmlFor)
  - Komunikaty błędów z aria-live="polite"
  - Focus management: po błędzie focus wraca na pierwsze pole z błędem
  - Min. kontrast 4.5:1 dla tekstu
  - Visible focus indicators
- **Bezpieczeństwo:**
  - Password field type="password" (ukrywanie znaków)
  - Walidacja client-side przed wysłaniem
  - HTTPS dla transmisji danych
  - JWT token przechowywany w httpOnly cookies (Supabase Auth)
  - Rate limiting na poziomie API

**Przepływ:**

1. Użytkownik wpisuje credentials
2. Walidacja client-side (email format, hasło niepuste)
3. Submit → POST do Supabase Auth
4. Success → redirect do `/` (Generation View)
5. Failure → inline error message, focus na email field

---

### 2.2 Widok rejestracji (/register)

**Główny cel:** Umożliwienie tworzenia nowych kont użytkowników.

**Kluczowe informacje do wyświetlenia:**

- Formularz rejestracji (email, hasło)
- Link do logowania
- Komunikaty błędów/sukcesu (inline)

**Kluczowe komponenty widoku:**

- `RegisterForm` (React):
  - Email input field (type="email", required)
  - Password input field (type="password", required, z toggle visibility)
  - Password confirmation field (type="password", required)
  - Submit button ("Zarejestruj się")
  - Link: "Masz już konto? Zaloguj się"
  - Error display area (aria-live="polite")
- Logo aplikacji (Astro component)
- Layout wrapper (centered, max-width)

**UX, dostępność i względy bezpieczeństwa:**

- **UX:**
  - Auto-focus na polu email
  - Real-time walidacja (hasła muszą się zgadzać)
  - Password strength indicator (opcjonalnie, jeśli Supabase nie obsługuje)
  - Jasne komunikaty: "Konto z tym adresem już istnieje"
  - Potwierdzenie sukcesu przed redirect
- **Dostępność:**
  - Labels z htmlFor dla wszystkich inputów
  - aria-describedby dla wskazówek dotyczących hasła
  - Komunikaty błędów z aria-live="polite"
  - Keyboard navigation (Tab, Enter)
- **Bezpieczeństwo:**
  - Client-side walidacja formatów
  - Password matching validation
  - Backend validation (Supabase Auth)
  - Automatic login po rejestracji

**Przepływ:**

1. Użytkownik wypełnia formularz
2. Walidacja: email format, hasła się zgadzają, hasło min. długość
3. Submit → POST do Supabase Auth signup
4. Success → auto-login + redirect do `/`
5. Failure → inline error (np. "Email już używany")

---

### 2.3 Widok generowania fiszek (/generate)

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

1. Użytkownik wkleja tekst do textarea
2. Character counter aktualizuje się w czasie rzeczywistym
3. Validation message pokazuje status (za krótki/za długi/ok)
4. User klika "Generuj fiszki"
5. Loading state pojawia się (spinner + message)
6. API call: `POST /api/generations/generate`
7. Success → suggestions list renderuje się poniżej formularza
8. User przegląda każdą propozycję:
   - Zaznacza checkbox przy fiszkach do zachowania
   - Klika "Edytuj" dla modyfikacji → inline form → "Zapisz"
   - Klika "Odrzuć" dla usunięcia z listy
9. User klika "Zapisz zaznaczone" LUB "Zapisz wszystkie"
10. API call: `POST /api/generations/:id/accept` z listą flashcards
11. Success message inline: "Fiszki zapisane pomyślnie"
12. Suggestions list znika, textarea wraca do pustego stanu

---

### 2.4 Widok listy fiszek (/flashcards - "Moje fiszki")

**Główny cel:** Zarządzanie wszystkimi fiszkami użytkownika (wyświetlanie, filtrowanie, edycja, usuwanie, tworzenie ręczne).

**Kluczowe informacje do wyświetlenia:**

- Lista wszystkich fiszek użytkownika (paginowana)
- Filtry według źródła (manual, ai-full, ai-edited)
- Licznik fiszek
- Opcje edycji i usuwania dla każdej fiszki
- Opcja tworzenia nowej fiszki ręcznie

**Kluczowe komponenty widoku:**

1. **FlashcardsHeader (React/Astro):**
   - Page title: "Moje fiszki"
   - Total count: "150 fiszek"
   - "+ Nowa fiszka" button (primary action)

2. **FlashcardsFilters (React):**
   - Tab/pill navigation:
     - "Wszystkie (150)" [active by default]
     - "Manualne (55)"
     - "AI (nieedytowane) (70)"
     - "AI (edytowane) (25)"
   - Updates URL query param: `?source=manual`

3. **FlashcardGrid (React):**
   - Responsive grid layout:
     - Desktop: 2-3 columns (md:grid-cols-2 lg:grid-cols-3)
     - Mobile: 1 column
   - Each `FlashcardCard`:
     - Front text (bold, truncated with ellipsis if > 50 chars)
     - Back text (regular, truncated)
     - Source badge: "Manualna" / "AI" / "AI (edytowane)"
     - Action buttons row:
       - Edit button (icon: pencil, tooltip: "Edytuj")
       - Delete button (icon: trash, tooltip: "Usuń")
   - Empty state: illustration + "Nie masz jeszcze żadnych fiszek. Utwórz pierwszą!"

4. **Pagination (React):**
   - Previous/Next buttons (disabled gdy N/A)
   - Page numbers: 1 2 3 ... 8
   - Current page indicator: "Strona 2 z 8"
   - Items per page: 20 (fixed)

5. **FlashcardModal (React) - dla create/edit:**
   - Modal overlay z dialogiem (Shadcn/ui Dialog)
   - Header:
     - Title: "Nowa fiszka" / "Edytuj fiszkę"
     - Close button (X)
   - Form content:
     - Front field:
       - Label: "Przód fiszki"
       - Textarea (max 200 chars)
       - Character counter: "45 / 200"
     - Back field:
       - Label: "Tył fiszki"
       - Textarea (max 500 chars)
       - Character counter: "123 / 500"
     - Validation errors inline (below fields)
   - Footer actions:
     - "Anuluj" button (secondary, closes modal)
     - "Zapisz" button (primary, disabled until valid)

6. **DeleteConfirmationModal (React):**
   - Modal overlay z alert dialog
   - Warning icon
   - Title: "Usunąć fiszkę?"
   - Message: "Ta operacja jest nieodwracalna."
   - Actions:
     - "Anuluj" (secondary)
     - "Usuń" (danger, red styling)

**UX, dostępność i względy bezpieczeństwa:**

- **UX:**
  - Filter state persists in URL (?source=manual)
  - Smooth filter transitions (no full reload)
  - Loading skeletons during pagination
  - Optimistic delete: remove card immediately, rollback on API error
  - Optimistic edit: update card immediately, rollback on error
  - Preserve scroll position after edit
  - Modal focus trap (can't Tab outside)
  - Escape key closes modals
  - Auto-focus on first form field when modal opens
  - Truncation with tooltip on hover (show full text)
- **Dostępność:**
  - Filter tabs z `role="tablist"`
  - Active tab z `aria-selected="true"`
  - Keyboard navigation: Arrow keys dla tabs, Enter dla selection
  - Modal z `role="dialog"` i `aria-labelledby` (title id)
  - Delete modal z `role="alertdialog"`
  - Focus management:
    - Modal opens → focus na close button lub first field
    - Modal closes → focus wraca do trigger button
  - Semantic grid z `<article>` dla każdej karty
  - All buttons z visible focus rings
- **Bezpieczeństwo:**
  - API verifies ownership przed edit/delete (user_id from JWT)
  - Client nie może edytować czyjejś innej fiszki (403 from API)
  - Sanitize input w form fields

**Przepływ:**

**Filtrowanie:**

1. User klika tab "Manualne"
2. URL updates: `/flashcards?source=manual`
3. React component fetches: `GET /api/flashcards?source=manual&page=1&limit=20`
4. Grid re-renders z filtered flashcards
5. Loading skeletons during fetch

**Tworzenie ręczne:**

1. User klika "+ Nowa fiszka"
2. Modal opens, focus na front field
3. User wypełnia front (max 200) i back (max 500)
4. Character counters update real-time
5. Validation inline (nie może być puste, max length)
6. User klika "Zapisz"
7. API call: `POST /api/flashcards` (single flashcard, source: manual)
8. Success → modal closes, nowa fiszka pojawia się w grid (optimistic add)
9. Success message: "Fiszka utworzona"

**Edycja:**

1. User klika "Edytuj" na karcie
2. Modal opens z pre-filled values
3. User modyfikuje front lub back
4. User klika "Zapisz"
5. API call: `PUT /api/flashcards/:id`
6. Success → card updates in grid immediately
7. Success message: "Fiszka zaktualizowana"

**Usuwanie:**

1. User klika "Usuń"
2. Confirmation modal opens
3. User klika "Usuń" (confirm)
4. API call: `DELETE /api/flashcards/:id`
5. Optimistic delete: card znika z grid immediately
6. Success → permanent, success message: "Fiszka usunięta"
7. Error → card reappears, error message inline

---

### 2.5 Widok sesji nauki (/learn)

**Główny cel:** Przeprowadzenie użytkownika przez sesję nauki fiszek z wykorzystaniem algorytmu spaced repetition.

**Kluczowe informacje do wyświetlenia:**

- Aktualna fiszka (przód → tył)
- Progress sesji (X z Y fiszek)
- Opcje oceny przyswojenia (zgodne z algorytmem)
- Możliwość wyjścia z sesji

**Kluczowe komponenty widoku:**

1. **SessionHeader (React):**
   - Progress text: "Fiszka 5 z 20"
   - Progress bar (visual, filled percentage)
   - Exit button ("Zakończ sesję", secondary, top-right)

2. **FlashcardDisplay (React):**
   - Large centered card container (full-screen feel)
   - **State 1 - Front:**
     - Front text (large, centered, min 24px)
     - "Pokaż odpowiedź" button (primary, centered below)
   - **State 2 - Back:**
     - Front text (smaller, top of card, 18px)
     - Horizontal divider line
     - Back text (large, centered, min 24px)
     - Rating buttons (bottom row):
       - "Powtórz" (hard difficulty, red)
       - "Trudne" (medium, orange)
       - "Dobre" (easy, green)
       - "Łatwe" (very easy, bright green)
       - (Labels zależne od algorytmu: sm2, fsrs, etc.)

3. **SessionComplete (React):**
   - Success icon/illustration
   - Message: "Sesja zakończona!"
   - Summary stats:
     - "Przejrzano 20 fiszek"
     - "Następna sesja za X godzin"
   - Actions:
     - "Powtórz sesję" (secondary)
     - "Wróć do fiszek" (primary)

4. **EmptyState (React):**
   - Illustration (optional)
   - Message: "Brak fiszek do nauki dzisiaj. Świetna robota!"
   - Action: "Wróć do Moich fiszek" button

**UX, dostępność i względy bezpieczeństwa:**

- **UX:**
  - Full-screen mode (minimal distractions, hide topbar lub make minimal)
  - Large touch targets (min 44x44px, especially rating buttons)
  - Smooth transitions between cards (fade or slide animation)
  - Keyboard shortcuts:
    - Space: show answer
    - 1-4: rating buttons (Again/Hard/Good/Easy)
    - Escape: open exit confirmation modal
  - Auto-advance after rating (no manual "next")
  - Visual feedback: rating button highlight on click
  - Prevent accidental exit: confirmation modal ("Czy na pewno chcesz zakończyć sesję?")
  - Card flip animation (front → back)
- **Dostępność:**
  - Main content z `role="main"`
  - aria-live region dla progress updates ("Fiszka 6 z 20")
  - Focus management:
    - "Pokaż odpowiedź" auto-focused
    - After reveal: focus on first rating button
  - High contrast dla rating buttons (distinct colors)
  - Large, readable text (min 18px, ideally 24px+)
  - Semantic buttons z aria-label jeśli tylko ikony
- **Bezpieczeństwo:**
  - Session state stored locally (no sensitive data)
  - API validates card ownership dla każdej fiszki
  - Rate review data sent to backend dla algorytmu

**Przepływ:**

**Rozpoczęcie sesji:**

1. User klika "Sesja nauki" w navigation
2. Redirect do `/learn`
3. API call: `GET /api/learning/session` (endpoint do doprecyzowania)
4. Response: lista fiszek do nauki (sorted by algorithm)
5. First card loads: front visible, "Pokaż odpowiedź" button

**W trakcie sesji:**

1. User czyta front fiszki
2. User klika "Pokaż odpowiedź" (lub Space)
3. Card flips/transitions to back view
4. Back text appears
5. Rating buttons appear
6. User klika rating button (np. "Dobre") lub używa keyboard (3)
7. API call: `POST /api/learning/rate` z flashcard_id + rating
8. Backend updates metadata dla algorytmu (next review date, ease factor, etc.)
9. Next card auto-loads (transition animation)
10. Progress bar updates
11. Repeat until no more cards

**Zakończenie sesji:**

1. Last card rated
2. SessionComplete screen pojawia się
3. Summary stats displayed
4. User klika "Wróć do fiszek"
5. Redirect do `/flashcards`

**Exit przedwcześnie:**

1. User klika "Zakończ sesję" lub Escape
2. Confirmation modal: "Czy na pewno chcesz zakończyć? Postęp zostanie zapisany."
3. User confirms
4. Redirect do `/flashcards`

**Empty state:**

1. API returns 0 cards for session
2. EmptyState component renders
3. User klika button → redirect do `/flashcards`

---

### 2.6 Widok statystyk (/stats)

**Główny cel:** Wyświetlenie zagregowanych statystyk dotyczących generowania fiszek przez AI oraz struktury kolekcji użytkownika.

**Kluczowe informacje do wyświetlenia:**

- Metryki generowania AI (total generations, acceptance rate, edit rate, średni czas)
- Breakdown modeli użytych do generowania
- Statystyki kolekcji fiszek (total, podział na źródła, procent AI)
- Filtry czasowe dla metryk (7d/30d/90d/all)

**Kluczowe komponenty widoku:**

1. **StatisticsHeader (React/Astro):**
   - Page title: "Statystyki"
   - Time period filter (dla generation metrics):
     - Button group / pills:
       - "7 dni"
       - "30 dni"
       - "90 dni"
       - "Wszystko" [default active]
     - Updates URL query: `?period=30d`

2. **GenerationMetricsSection (React):**
   - Section title: "Metryki generowania AI"
   - Grid of stat cards (2x2 on desktop, 1 col on mobile):
     - **Total Generations Card:**
       - Label: "Łączna liczba generowań"
       - Value: "25"
     - **Acceptance Rate Card:**
       - Label: "Wskaźnik akceptacji"
       - Value: "76.0%"
       - Color indicator: green if > 70%, orange if 50-70%, red if < 50%
     - **Edit Rate Card:**
       - Label: "Wskaźnik edycji"
       - Value: "26.3%"
       - Subtext: "z zaakceptowanych fiszek"
     - **Avg Duration Card:**
       - Label: "Średni czas generowania"
       - Value: "3.25s"
   - **Models Used Breakdown:**
     - List or bar chart:
       - "GPT-4: 15 generowań"
       - "GPT-3.5-turbo: 10 generowań"

3. **CollectionMetricsSection (React):**
   - Section title: "Statystyki kolekcji"
   - Grid of stat cards:
     - **Total Flashcards Card:**
       - Label: "Łączna liczba fiszek"
       - Value: "150"
     - **Manual Flashcards Card:**
       - Label: "Ręczne"
       - Value: "55"
       - Percentage: "(36.7%)"
     - **AI Unedited Card:**
       - Label: "AI (nieedytowane)"
       - Value: "70"
       - Percentage: "(46.7%)"
     - **AI Edited Card:**
       - Label: "AI (edytowane)"
       - Value: "25"
       - Percentage: "(16.7%)"
   - **Visual chart** (pie lub bar):
     - AI vs Manual usage
     - Color-coded segments
     - Legend below

**UX, dostępność i względy bezpieczeństwa:**

- **UX:**
  - Cache stats for 5 minutes (reduce API calls, display stale-while-revalidate)
  - Loading skeletons dla stat cards podczas fetch
  - Visual indicators dla metrics:
    - Green dla good rates (> target)
    - Orange dla medium
    - Red dla low rates
  - Responsive grid: stacks na mobile
  - Period filter state persists in URL (?period=30d)
  - Smooth transitions między period changes
  - Tooltips dla wyjaśnienia metryk (hover/focus)
- **Dostępność:**
  - Semantic HTML: `<section>` dla każdej metrics section
  - `<article>` dla stat cards
  - aria-label dla charts (jeśli visual-only)
  - Screen reader announcements dla stat values (aria-live)
  - High contrast dla chart colors (distinct, colorblind-friendly)
  - Keyboard navigation dla period filter (Arrow keys)
  - Focus indicators na filter buttons
- **Bezpieczeństwo:**
  - API filters by user_id (only authenticated user's stats)
  - No cross-user data leakage
  - Rate limiting applied (100 req/min)

**Przepływ:**

1. User klika "Statystyki" w navigation
2. Redirect do `/stats`
3. Parallel API calls:
   - `GET /api/statistics/generations?period=all`
   - `GET /api/statistics/flashcards`
4. Loading skeletons podczas fetch
5. Stats render w cards
6. Charts render (if applicable)
7. User klika "30 dni" filter
8. URL updates: `/stats?period=30d`
9. API call: `GET /api/statistics/generations?period=30d`
10. Generation metrics re-render z filtered data
11. Collection metrics remain unchanged (no period filter)

---

### 2.7 Panel użytkownika (dropdown w topbar)

**Główny cel:** Umożliwienie zarządzania kontem użytkownika (ustawienia, usunięcie konta, wylogowanie).

**Kluczowe informacje do wyświetlenia:**

- Opcje konta (ustawienia, usunięcie)
- Opcja wylogowania
- Potwierdzenie usunięcia konta (modal)

**Kluczowe komponenty widoku:**

1. **UserDropdown (React) - w topbar navigation:**
   - Trigger button:
     - Avatar icon / User icon
     - Username (opcjonalnie, jeśli dostępny)
     - Dropdown arrow icon
   - Dropdown menu (Shadcn/ui DropdownMenu):
     - Menu items (lista):
       - "Ustawienia konta" (icon: gear) [link do /settings - future]
       - Divider
       - "Usuń konto" (icon: trash, red text)
       - Divider
       - "Wyloguj się" (icon: logout)

2. **DeleteAccountModal (React):**
   - Modal overlay z alert dialog
   - Warning icon (red)
   - Title: "Usunąć konto?"
   - Message: "Ta operacja spowoduje trwałe usunięcie Twojego konta oraz wszystkich fiszek. Nie można tego cofnąć."
   - Checkbox: "Rozumiem, że ta operacja jest nieodwracalna"
   - Actions:
     - "Anuluj" button (secondary)
     - "Usuń konto" button (danger, red, disabled until checkbox checked)

**UX, dostępność i względy bezpieczeństwa:**

- **UX:**
  - Dropdown closes on:
    - Selection (item clicked)
    - Outside click
    - Escape key
  - Hover/focus states dla menu items
  - Smooth open/close transitions (fade/slide)
  - Checkbox required przed enable "Usuń konto" button
  - Loading state na "Usuń konto" button podczas API call
  - Confirmation success message (jeśli możliwe przed logout redirect)
- **Dostępność:**
  - Dropdown z `aria-haspopup="menu"`
  - Menu z `role="menu"`
  - Menu items z `role="menuitem"`
  - Keyboard navigation:
    - Arrow Down: open dropdown, move to first item
    - Arrow Up/Down: navigate menu items
    - Enter: select item
    - Escape: close dropdown
  - Focus trap w dropdown (Tab wraps within menu)
  - Focus management: dropdown closes → focus wraca do trigger button
  - Modal z `role="alertdialog"` i `aria-describedby`
- **Bezpieczeństwo:**
  - API endpoint: `DELETE /api/auth/account`
  - JWT user_id used dla deletion
  - Cascade delete: flashcards → generations → generation_error_logs → auth.users
  - GDPR compliance (data right to deletion)
  - Logout clears JWT token (Supabase Auth logout)

**Przepływ:**

**Wylogowanie:**

1. User klika user dropdown trigger
2. Dropdown opens
3. User klika "Wyloguj się"
4. API call: Supabase Auth logout
5. JWT token cleared (httpOnly cookie)
6. Redirect do `/login`

**Usunięcie konta:**

1. User klika "Usuń konto" w dropdown
2. DeleteAccountModal opens
3. Focus na close button
4. User czyta warning message
5. User zaznacza checkbox: "Rozumiem..."
6. "Usuń konto" button becomes enabled
7. User klika "Usuń konto"
8. API call: `DELETE /api/auth/account`
9. Backend cascade deletes:
   - All flashcards (WHERE user_id = ...)
   - All generations
   - All generation_error_logs
   - User record from auth.users (Supabase API)
10. Success → Logout triggered automatically
11. Redirect do `/login` z message: "Konto zostało usunięte"

---

## 3. Mapa podróży użytkownika

### 3.1 Główny przepływ (Happy Path)

**Krok 1: Onboarding i Logowanie**

- **Entry point:** User wchodzi na domenę aplikacji
- **Jeśli nie zalogowany:** Redirect automatyczny do `/login`
- **Jeśli zalogowany:** Redirect automatyczny do `/` (Generation View)

**Logowanie:**

1. User na `/login`
2. Wprowadza email i hasło
3. Klika "Zaloguj się" (lub Enter)
4. Walidacja client-side
5. API call: Supabase Auth login
6. Success → JWT token zapisany w httpOnly cookie
7. Redirect do `/` (Generation View)

**Alternatywnie - Rejestracja:**

1. User klika link "Zarejestruj się" na `/login`
2. Redirect do `/register`
3. Wprowadza email, hasło, potwierdzenie hasła
4. Klika "Zarejestruj się"
5. Walidacja: email format, hasła match, długość
6. API call: Supabase Auth signup
7. Success → auto-login + redirect do `/`

---

**Krok 2: Generowanie fiszek z AI**

1. User ląduje na `/` (Generation View)
2. Widzi textarea z placeholderem: "Wklej tekst źródłowy (1000-10000 znaków)"
3. User wkleja tekst (np. fragment podręcznika)
4. Character counter aktualizuje się: "2500 / 10000" (green)
5. Validation message: "Długość tekstu OK. Możesz wygenerować fiszki."
6. User klika "Generuj fiszki"
7. Loading state pojawia się:
   - Textarea i button disabled
   - Spinner z tekstem: "Generowanie fiszek w toku..."
   - (Opcjonalnie) Cancel button
8. API call: `POST /api/generations/generate` z source_text
9. Backend:
   - Wywołuje Openrouter.ai API
   - Zapisuje metadata do `generations` table
   - Zwraca generation_id + flashcardSuggestions
10. Success → Loading state znika
11. Suggestions list pojawia się poniżej formularza
12. Auto-scroll do suggestions

---

**Krok 3: Recenzja propozycji AI**

1. User widzi listę 5-10 propozycji fiszek
2. Każda propozycja jako card:
   - Checkbox (unchecked by default)
   - Front: "What is the capital of France?"
   - Back: "Paris"
   - "Edytuj" button
   - "Odrzuć" button
3. User przegląda każdą fiszkę:

   **Scenariusz A - Akceptacja bez zmian:**
   - User zaznacza checkbox przy fiszce
   - Card highlight (visual feedback)

   **Scenariusz B - Edycja przed akceptacją:**
   - User klika "Edytuj"
   - Inline form pojawia się:
     - Front textarea (pre-filled)
     - Back textarea (pre-filled)
     - Character counters
   - User modyfikuje back: "Paris is the capital and largest city of France."
   - User klika "Zapisz"
   - Inline form znika, card updates z nową treścią
   - Checkbox auto-checked (oznacza edited + accepted)

   **Scenariusz C - Odrzucenie:**
   - User klika "Odrzuć"
   - (Opcjonalnie) Confirmation: "Czy na pewno odrzucić tę fiszkę?"
   - Card znika z listy (removed from local state)

4. Po recenzji wszystkich:
   - User zaznaczył 7 z 10 fiszek
   - Selection counter na dole: "7 fiszek zaznaczonych"
5. Dwa przyciski dostępne:
   - "Zapisz wszystkie" (zapisze 10 fiszek, including niezaznaczone)
   - "Zapisz zaznaczone" (zapisze tylko 7 zaznaczonych)

---

**Krok 4: Zapis zaakceptowanych fiszek**

1. User klika "Zapisz zaznaczone"
2. API call: `POST /api/generations/:id/accept`
3. Request body:
   ```json
   {
     "flashcards": [
       { "front": "...", "back": "...", "edited": false },
       { "front": "...", "back": "... (modified)", "edited": true },
       ...
     ]
   }
   ```
4. Backend:
   - Verifies generation belongs to user
   - Sets source based on edited flag:
     - edited: false → source: 'ai-full'
     - edited: true → source: 'ai-edited'
   - Inserts all 7 flashcards do `flashcards` table
   - Updates `generations` record:
     - accepted_unedited_count: 6
     - accepted_edited_count: 1
5. Success response: list of created flashcards with IDs
6. Success message inline: "7 fiszek zostało zapisanych pomyślnie"
7. Suggestions list znika
8. Textarea wraca do pustego stanu (ready for next generation)

---

**Krok 5: Zarządzanie fiszkami**

**Wyświetlanie listy:**

1. User klika "Moje fiszki" w navigation
2. Redirect do `/flashcards`
3. API call: `GET /api/flashcards?page=1&limit=20&sort=created_at&order=desc`
4. Loading skeletons podczas fetch
5. Grid renders z 20 fiszkami (mix manual + AI)
6. Default filter: "Wszystkie (150)"

**Filtrowanie:**

1. User klika tab "AI (nieedytowane)"
2. URL updates: `/flashcards?source=ai-full`
3. API call: `GET /api/flashcards?source=ai-full&page=1&limit=20`
4. Grid re-renders z tylko AI-generated (unedited) flashcards
5. Tab count updates: "AI (nieedytowane) (70)"

**Tworzenie ręczne:**

1. User klika "+ Nowa fiszka"
2. Modal opens (create mode)
3. Focus na front field
4. User wpisuje:
   - Front: "Jak nazywa się stolica Polski?"
   - Back: "Warszawa"
5. Character counters: "33 / 200" i "8 / 500"
6. User klika "Zapisz"
7. API call: `POST /api/flashcards` (single, source: manual)
8. Success → Modal closes
9. New flashcard appears w grid (optimistic add, top of list)
10. Success message: "Fiszka utworzona"

**Edycja:**

1. User klika "Edytuj" na konkretnej karcie
2. Modal opens (edit mode) z pre-filled values
3. User modyfikuje back text
4. User klika "Zapisz"
5. API call: `PUT /api/flashcards/:id`
6. Success → Card w grid updates immediately (optimistic)
7. Modal closes
8. Success message: "Fiszka zaktualizowana"

**Usuwanie:**

1. User klika "Usuń"
2. Confirmation modal: "Usunąć fiszkę? Ta operacja jest nieodwracalna."
3. User klika "Usuń" (confirm)
4. Card znika z grid immediately (optimistic delete)
5. API call: `DELETE /api/flashcards/:id`
6. Success → permanent deletion
7. Success message: "Fiszka usunięta"
8. Jeśli error → card reappears, error message

---

**Krok 6: Sesja nauki**

1. User klika "Sesja nauki" w navigation
2. Redirect do `/learn`
3. API call: `GET /api/learning/session` (endpoint TBD)
4. Response: array of flashcards scheduled for today (sorted by algorithm)
5. First card loads:
   - Progress: "Fiszka 1 z 15"
   - Progress bar: 6.7% filled
   - Front text: "What is the capital of France?"
   - "Pokaż odpowiedź" button visible
6. User czyta pytanie, klika "Pokaż odpowiedź" (or Space)
7. Card transitions (flip animation)
8. Back text appears: "Paris"
9. Rating buttons appear:
   - "Powtórz" (Again)
   - "Trudne" (Hard)
   - "Dobre" (Good)
   - "Łatwe" (Easy)
10. User ocenia swoje przyswojenie: klika "Dobre" (or keyboard 3)
11. API call: `POST /api/learning/rate` (flashcard_id, rating)
12. Backend updates spaced repetition metadata (next_review_date, ease_factor, interval)
13. Success → next card auto-loads (transition)
14. Progress updates: "Fiszka 2 z 15", progress bar: 13.3%
15. Repeat steps 6-14 until all 15 cards reviewed
16. Last card rated → SessionComplete screen:
    - "Sesja zakończona!"
    - "Przejrzano 15 fiszek"
    - "Następna sesja za 8 godzin"
    - "Wróć do fiszek" button
17. User klika button → redirect do `/flashcards`

---

**Krok 7: Przegląd statystyk**

1. User klika "Statystyki" w navigation
2. Redirect do `/stats`
3. Parallel API calls:
   - `GET /api/statistics/generations?period=all`
   - `GET /api/statistics/flashcards`
4. Loading skeletons
5. Stats render:
   - **Generation metrics:**
     - 25 total generations
     - 76% acceptance rate (green indicator)
     - 26.3% edit rate
     - 3.25s avg duration
     - Models: GPT-4 (15), GPT-3.5 (10)
   - **Collection metrics:**
     - 150 total flashcards
     - 55 manual (36.7%)
     - 70 AI unedited (46.7%)
     - 25 AI edited (16.7%)
     - Pie chart: 63.3% AI-created
6. User klika "30 dni" filter
7. URL updates: `/stats?period=30d`
8. API call: `GET /api/statistics/generations?period=30d`
9. Generation metrics re-render z filtered data
10. Collection metrics remain unchanged (no period filter)

---

**Krok 8: Wylogowanie**

1. User klika user dropdown trigger (top-right topbar)
2. Dropdown menu opens:
   - Ustawienia konta
   - Usuń konto
   - Wyloguj się
3. User klika "Wyloguj się"
4. Dropdown closes
5. API call: Supabase Auth logout
6. JWT token cleared from httpOnly cookie
7. Redirect do `/login`
8. Session ended

---

### 3.2 Alternatywne przepływy i edge cases

**Edge Case 1: Rate Limiting podczas generowania**

1. User na `/`, wkleja tekst, klika "Generuj fiszki"
2. API call: `POST /api/generations/generate`
3. Response: `429 Too Many Requests`
4. Error response body:
   ```json
   {
     "error": {
       "code": "RATE_LIMIT_EXCEEDED",
       "message": "Generation rate limit exceeded",
       "details": { "reset_time": 1702558800 }
     }
   }
   ```
5. UI displays inline error:
   - "Osiągnięto limit generowań. Spróbuj ponownie za 45 minut."
6. "Generuj fiszki" button disabled until reset time
7. (Opcjonalnie) Countdown timer showing time remaining

**Edge Case 2: API failure podczas generowania**

1. User generuje fiszki
2. API call fails: `500 Internal Server Error` (LLM API down)
3. Error message inline:
   - "Nie udało się wygenerować fiszek. Spróbuj ponownie."
   - "Spróbuj ponownie" button
4. Original text preserved w textarea
5. User klika "Spróbuj ponownie" → retry API call

**Edge Case 3: Token expiration w trakcie sesji**

1. User ma otwartą sesję, JWT expired (1 hour)
2. User próbuje wykonać action (np. save flashcard)
3. API call: `401 Unauthorized`
4. Frontend Supabase SDK automatycznie próbuje refresh token
5. **Jeśli refresh succeeds:**
   - Retry original API call transparently
   - User nie zauważa interruption
6. **Jeśli refresh fails:**
   - Display message: "Sesja wygasła. Zaloguj się ponownie."
   - Redirect do `/login?return=/flashcards` (preserve destination)
7. After login → redirect back do original page

**Edge Case 4: Empty learning session**

1. User klika "Sesja nauki"
2. Redirect do `/learn`
3. API call: `GET /api/learning/session`
4. Response: empty array (no cards scheduled for today)
5. EmptyState renders:
   - Illustration (celebration icon)
   - "Brak fiszek do nauki dzisiaj. Świetna robota!"
   - "Wróć do Moich fiszek" button
6. User klika button → redirect do `/flashcards`

**Edge Case 5: Przedwczesne wyjście z sesji nauki**

1. User w trakcie sesji (card 8 z 15)
2. User klika "Zakończ sesję" (lub Escape)
3. Confirmation modal opens:
   - "Czy na pewno chcesz zakończyć sesję?"
   - "Twój postęp z dotychczasowych 7 kart został zapisany."
4. Actions: "Kontynuuj sesję" / "Zakończ"
5. **Jeśli "Zakończ":**
   - Modal closes
   - Redirect do `/flashcards`
6. **Jeśli "Kontynuuj sesję":**
   - Modal closes
   - User wraca do current card

**Edge Case 6: Validation errors podczas tworzenia fiszki**

1. User otwiera modal "Nowa fiszka"
2. Wpisuje tylko front: "Test pytanie"
3. Zostawia back puste
4. Klika "Zapisz"
5. Validation error inline pod back field:
   - "Tył fiszki nie może być pusty"
6. "Zapisz" button disabled
7. User wypełnia back
8. Validation passes, "Zapisz" button enabled
9. Submit succeeds

**Edge Case 7: Optimistic delete rollback**

1. User klika "Usuń" na fiszce
2. Confirmation → "Usuń"
3. Card znika z grid immediately (optimistic)
4. API call: `DELETE /api/flashcards/:id`
5. Response: `500 Internal Server Error` (database error)
6. Card reappears w grid (rollback)
7. Error message: "Nie udało się usunąć fiszki. Spróbuj ponownie."

---

## 4. Układ i struktura nawigacji

### 4.1 Primary Navigation - Topbar

**Layout:**

- Fixed position at top (sticky)
- Full width
- Height: 64px (desktop), 56px (mobile)
- Background: white (light mode) / dark gray (dark mode)
- Border-bottom: 1px solid gray-200

**Desktop Structure (≥768px):**

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo]  [Generuj]  [Moje fiszki]  [Sesja nauki]  [Statystyki] │
│                                                  [User Dropdown▼]│
└────────────────────────────────────────────────────────────────┘
```

- **Logo (left):**
  - Text logo: "fiszki" (or icon + text)
  - Link to `/` (home)
  - Always visible

- **Main navigation links (center-left):**
  - "Generuj" → `/`
  - "Moje fiszki" → `/flashcards`
  - "Sesja nauki" → `/learn`
  - "Statystyki" → `/stats`
  - Active state: underline + bold + primary color
  - Hover state: opacity change or background highlight

- **User dropdown (right):**
  - Trigger: Avatar icon + Username (optional)
  - Dropdown arrow icon
  - Opens menu on click

**Mobile Structure (<768px):**

```
┌────────────────────────────────────┐
│ [Logo]              [Hamburger ☰] │
└────────────────────────────────────┘
```

- **Logo (left):** Same as desktop
- **Hamburger menu (right):**
  - Icon: three horizontal lines
  - Opens slide-in menu on click

**Mobile Menu (expanded):**

```
┌────────────────────────────────┐
│ [✕ Close]                      │
│                                │
│ [Generuj]                      │
│ [Moje fiszki]                  │
│ [Sesja nauki]                  │
│ [Statystyki]                   │
│ ────────────────────           │
│ [Ustawienia konta]             │
│ [Usuń konto]                   │
│ [Wyloguj się]                  │
└────────────────────────────────┘
```

- Full-screen overlay (or slide from right)
- Dark background (backdrop)
- All navigation links + user menu items expanded inline
- Close button (X) top-right
- Clicking link closes menu + navigates

### 4.2 Navigation Behavior

**Active State:**

- Current page highlighted in navigation
- Visual indicator: underline + primary color + bold
- aria-current="page" for accessibility

**Keyboard Navigation:**

- Tab: move between navigation links
- Enter: activate link
- Arrow Down (on User Dropdown): open menu
- Arrow Up/Down (in menu): navigate items
- Escape: close dropdown/mobile menu

**Skip Navigation:**

- Hidden link at very top: "Przejdź do głównej treści"
- Visible on focus (keyboard users)
- Skips topbar navigation, jumps to main content
- Improves screen reader UX

**Protected Routes:**

- All routes except `/login` and `/register` require authentication
- Middleware checks JWT token on route access
- **If not authenticated:**
  - Redirect to `/login?return=[original_url]`
  - After successful login → redirect to original destination
- **If authenticated:**
  - Allow access to route

**Mobile Menu Behavior:**

- Opens with slide-in animation (from right or bottom)
- Backdrop click closes menu
- Escape key closes menu
- Link click closes menu + navigates
- Focus trap within menu when open

### 4.3 User Dropdown Menu

**Desktop Dropdown Menu:**

- Trigger: Avatar/icon + dropdown arrow
- Opens below trigger (popover)
- Width: 200px
- Shadow for depth

**Menu Items:**

1. **Ustawienia konta** (icon: gear)
   - Link to `/settings` (future)
   - Hover: background highlight
2. **Divider** (horizontal line)
3. **Usuń konto** (icon: trash, red text)
   - Click opens DeleteAccountModal
   - Hover: background highlight (light red)
4. **Divider**
5. **Wyloguj się** (icon: logout)
   - Click triggers logout flow
   - Hover: background highlight

**Accessibility:**

- role="menu" for dropdown
- role="menuitem" for each item
- aria-haspopup="menu" on trigger
- aria-expanded="true/false" based on state
- Keyboard navigation: Arrow keys, Enter, Escape
- Focus trap within menu

### 4.4 Breadcrumb Navigation (Optional, Future)

Nie w MVP, ale rozważenie dla future:

- Breadcrumbs na subpages (np. `/flashcards/123/edit`)
- Format: Home > Moje fiszki > Edytuj fiszkę
- Improves UX dla głębszych hierarchii

### 4.5 Footer (Optional, Future)

Nie w MVP, ale dla completeness:

- Links: Privacy Policy, Terms of Service, Contact
- Copyright notice
- Social links (if applicable)

---

## 5. Kluczowe komponenty

Poniżej lista kluczowych, reużywalnych komponentów używanych w wielu widokach aplikacji.

### 5.1 Komponenty formularzy

**TextInput (React):**

- Props: label, type, value, onChange, error, required, maxLength, placeholder
- Features:
  - Label z htmlFor binding
  - Error message display (inline below input)
  - aria-describedby dla error messages
  - aria-invalid when error present
  - Focus styles (ring)
- Usage: Login, Register, Flashcard forms

**Textarea (React):**

- Props: label, value, onChange, error, maxLength, rows, placeholder
- Features:
  - Character counter (optional)
  - Auto-resize (optional)
  - Label + htmlFor
  - Error message inline
  - aria-describedby, aria-invalid
- Usage: Generation form, Flashcard front/back fields

**Button (React) - Shadcn/ui:**

- Variants: primary, secondary, danger, ghost
- Sizes: sm, md, lg
- States: default, hover, active, disabled, loading
- Props: onClick, disabled, loading, variant, size, children
- Features:
  - Loading spinner when loading=true
  - Disabled styling + cursor-not-allowed
  - Full keyboard support (Enter, Space)
- Usage: All forms, actions across app

**CharacterCounter (React):**

- Props: currentLength, maxLength, minLength (optional)
- Features:
  - Display: "1250 / 10000"
  - Color coding:
    - Red: out of range (< min or > max)
    - Green: within range
  - aria-live="polite" for screen readers
- Usage: Generation form, Flashcard forms

### 5.2 Komponenty nawigacji

**Topbar (React/Astro):**

- Responsive layout (desktop vs mobile)
- Desktop: Logo + nav links + user dropdown
- Mobile: Logo + hamburger menu
- Props: currentPath (for active state)
- Features:
  - Active state highlighting
  - Keyboard navigation
  - Accessible (semantic nav, aria attributes)
- Usage: All authenticated pages

**MobileMenu (React):**

- Slide-in overlay menu
- Props: isOpen, onClose, navItems, userMenuItems
- Features:
  - Backdrop click to close
  - Escape key to close
  - Focus trap when open
  - Smooth animations
- Usage: Mobile version of navigation

**UserDropdown (React):**

- Dropdown trigger + menu
- Props: username, onLogout, onDeleteAccount
- Features:
  - Menu items: Settings, Delete Account, Logout
  - Keyboard navigation (Arrow keys, Enter, Escape)
  - aria-haspopup, role="menu"
- Usage: Topbar (desktop + mobile expanded)

### 5.3 Komponenty listy i wyświetlania

**FlashcardCard (React):**

- Display single flashcard in grid
- Props: flashcard (object: id, front, back, source), onEdit, onDelete
- Features:
  - Front/back text display (truncated if long)
  - Source badge ("Manualna" / "AI" / "AI (edytowane)")
  - Edit/Delete action buttons
  - Hover state (elevation/shadow)
- Usage: Flashcards list view (/flashcards)

**FlashcardGrid (React):**

- Responsive grid container
- Props: flashcards (array), onEdit, onDelete
- Features:
  - Grid layout: 1 col (mobile), 2-3 cols (desktop)
  - Empty state handling
  - Loading skeletons
- Usage: Flashcards list view

**Pagination (React):**

- Page navigation controls
- Props: currentPage, totalPages, onPageChange
- Features:
  - Previous/Next buttons (disabled when N/A)
  - Page numbers (1 2 3 ... 8)
  - Current page indicator
  - Keyboard support (Arrow keys optional)
- Usage: Flashcards list, Generations history (future)

**FilterTabs (React):**

- Tab-based filtering
- Props: tabs (array: {label, value, count}), activeTab, onTabChange
- Features:
  - Active tab highlighting
  - Tab counts: "Wszystkie (150)"
  - role="tablist", aria-selected
  - Keyboard navigation (Arrow keys)
- Usage: Flashcards list filtering

### 5.4 Komponenty modal i dialog

**Modal (React) - Shadcn/ui Dialog:**

- Reusable modal wrapper
- Props: isOpen, onClose, title, children
- Features:
  - Overlay backdrop
  - Close button (X)
  - Escape key to close
  - Focus trap
  - role="dialog", aria-labelledby
- Usage: Flashcard create/edit, Delete confirmations

**ConfirmationDialog (React):**

- Alert dialog for confirmations
- Props: isOpen, onClose, onConfirm, title, message, confirmText, confirmVariant
- Features:
  - Warning icon
  - Message text
  - Cancel/Confirm buttons
  - role="alertdialog"
  - Checkbox option (optional, for "I understand" cases)
- Usage: Delete flashcard, Delete account

### 5.5 Komponenty feedback i stanu

**LoadingSpinner (React):**

- Simple spinner animation
- Props: size (sm, md, lg), color
- Usage: Button loading states, page loading

**SkeletonLoader (React):**

- Placeholder for loading content
- Props: variant (text, card, avatar), count
- Features:
  - Animated shimmer effect
  - Mimics final content layout
- Usage: Flashcards grid, Stats cards during fetch

**ErrorMessage (React):**

- Inline error display
- Props: message, variant (inline, banner)
- Features:
  - Error icon
  - Red color scheme
  - aria-live="polite" (for dynamic errors)
- Usage: Forms, API error feedback

**SuccessMessage (React):**

- Inline success display
- Props: message
- Features:
  - Success icon (checkmark)
  - Green color scheme
  - aria-live="polite"
- Usage: After successful actions (save, delete, etc.)

### 5.6 Komponenty specyficzne dla domeny

**SuggestionCard (React):**

- Display AI-generated flashcard suggestion
- Props: suggestion (front, back), isChecked, onCheck, onEdit, onReject
- Features:
  - Checkbox for selection
  - Front/back text display
  - Edit button → inline edit mode
  - Reject button
  - Edited indicator (if edited: true)
- Usage: Generation view suggestions list

**SuggestionsList (React):**

- Container for multiple SuggestionCard
- Props: suggestions (array), onAcceptSelected, onAcceptAll
- Features:
  - List of SuggestionCard components
  - Bulk action buttons (bottom)
  - Selection counter
- Usage: Generation view after AI generation

**StatCard (React):**

- Display single statistic
- Props: label, value, subtext, colorIndicator
- Features:
  - Large value display (bold, primary)
  - Label (smaller, secondary)
  - Optional subtext (context)
  - Optional color indicator (green/orange/red dot)
- Usage: Statistics view

**ProgressBar (React):**

- Visual progress indicator
- Props: current, total, showText
- Features:
  - Filled bar (percentage)
  - Text display: "5 / 20" (optional)
  - aria-valuenow, aria-valuemin, aria-valuemax
- Usage: Learning session progress

### 5.7 Komponenty układu

**PageLayout (Astro):**

- Main layout wrapper for all pages
- Props: title (for <title>), children
- Features:
  - HTML structure: <html>, <head>, <body>
  - Meta tags (viewport, charset)
  - Topbar inclusion (if authenticated)
  - <main> wrapper with skip-nav target
- Usage: All pages

**Container (Astro/React):**

- Centered content container
- Props: maxWidth (sm, md, lg, xl), children
- Features:
  - Responsive max-width
  - Horizontal padding
  - Centered with margin auto
- Usage: Form pages, content sections

**Card (React) - Shadcn/ui:**

- Generic card container
- Props: children, variant (default, elevated)
- Features:
  - Border, rounded corners
  - Optional shadow (elevated variant)
  - Padding
- Usage: Flashcard cards, Stat cards

---

**Koniec dokumentu architektury UI.**
