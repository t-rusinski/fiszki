# UI Architecture Planning Summary - t-rusinski fiszki MVP

## Conversation Summary

### Decisions Made

1. **Struktura ekranów aplikacji**: Auth (login/register), Dashboard, Widok generowania fiszek z AI, Widok listy fiszek z modalem do edycji i przyciskiem usuwania, Panel użytkownika, Ekran do sesji powtórek

2. **Główny przepływ użytkownika**: Użytkownik zalogowany → przekierowanie do widoku generowania z AI → wprowadzenie tekstu źródłowego → otrzymanie listy propozycji fiszek → recenzja przez jednostkową akceptację/edycję/odrzucenie każdej fiszki → finalny zapis bulk za pomocą dwóch opcji: "Zapisz wszystkie" lub "Zapisz zatwierdzone"

3. **Mechanizm recenzji propozycji AI**: Propozycje fiszek przychodzą jako odpowiedź z endpointu generowania i są wyświetlane w formie listy bezpośrednio pod formularzem, umożliwiając użytkownikowi recenzję każdej fiszki indywidualnie

4. **Strategia uwierzytelniania**: JWT będzie wdrożone w późniejszym etapie; na start wykorzystanie Supabase Auth z wbudowanym zarządzaniem sesją

5. **Biblioteka komponentów UI**: Wykorzystanie gotowych komponentów Shadcn/ui dla wszystkich elementów interfejsu

6. **Zarządzanie stanem aplikacji**: Na start React hooks (useState, useEffect) i React Context API; Zustand jako opcja do rozważenia w późniejszym etapie przy większej złożoności

7. **Strategia obsługi błędów**: Komunikaty błędów wyświetlane inline (nie toast notifications) - błędy walidacji pod polami formularza, błędy API w kontekście akcji

8. **Responsywność**: Wykorzystanie Tailwind CSS utility variants (sm:, md:, lg:, xl:) dla adaptacji interfejsu do różnych rozmiarów ekranów

9. **Nawigacja główna**: Shadcn/ui Navigation Menu w formie topbara z sekcjami: Generuj, Moje fiszki, Sesja nauki, Statystyki, Panel użytkownika (dropdown)

10. **Dostępność**: Implementacja zgodna z wymogami WCAG 2.1 Level AA, obejmująca kontrast kolorów, nawigację klawiaturą, semantyczny HTML i aria-labels

### Matched Recommendations

1. **Formularz generowania z walidacją w czasie rzeczywistym**: Licznik znaków (1000-10000) i komunikaty walidacyjne inline informujące o spełnieniu wymagań przed wysłaniem do API, minimalizując niepotrzebne requesty zwracające błąd 400

2. **Stan ładowania podczas generowania AI**: Interfejs z komunikatem "Generowanie fiszek w toku...", opcją anulowania requestu i animacją/progress barem, z automatycznym przejściem do widoku recenzji propozycji po otrzymaniu odpowiedzi

3. **Interfejs recenzji propozycji fiszek**: Lista wyświetlana pod formularzem generowania z opcjami dla każdej fiszki: checkbox do zaznaczenia, inline formularz edycji (front/back), przycisk "Odrzuć", oraz dwa finalne przyciski: "Zapisz wszystkie" i "Zapisz zatwierdzone" wywołujące endpoint `/api/generations/:id/accept`

4. **Filtrowanie w widoku "Moje fiszki"**: Domyślne wyświetlanie wszystkich fiszek z filterami tabs/pills umożliwiającymi przełączanie między: "Wszystkie", "Manualne", "AI (nieedytowane)", "AI (edytowane)", wykorzystując query parameter `source` z API

5. **Widok "Sesja nauki"**: Pełnoekranowy interfejs pokazujący przód fiszki z przyciskiem "Pokaż odpowiedź", następnie tył z przyciskami oceny zgodnie z algorytmem spaced repetition, progress (np. "5/20 fiszek") i opcją wyjścia - wymaga doprecyzowania API endpoint

6. **Dedykowany widok statystyk**: Wykorzystanie endpointów `/api/statistics/generations` (metryki AI z filtrami czasowymi) i `/api/statistics/flashcards` (struktura kolekcji) w osobnym widoku lub zintegrowanym z dashboard

7. **Struktura nawigacji głównej**: Navigation bar z Shadcn/ui zawierający sekcje: Generuj (główny widok po zalogowaniu), Moje fiszki, Sesja nauki, Statystyki, Panel użytkownika (dropdown: Ustawienia, Usuń konto, Wyloguj)

8. **Obsługa błędów inline**: Implementacja komunikatów błędów kontekstowych: pod polami formularzy (Shadcn/ui Form), nad/pod formularzem generowania dla błędów API, inline dla rate limiting z informacją o czasie resetu, inline dla błędów 500/503 z opcją "Spróbuj ponownie"

9. **Ręczne tworzenie fiszek**: Modal/Dialog (Shadcn/ui) otwierany przyciskiem "+ Nowa fiszka" w widoku "Moje fiszki", z formularzem zawierającym walidację długości (front: 200, back: 500 znaków), liczniki znaków i komunikaty błędów inline

10. **Zarządzanie stanem i API**: React Context API dla globalnego auth state, custom hooks (np. `useFetchFlashcards`, `useGenerateFlashcards`) dla komunikacji z API, brak cachowania list fiszek (real-time), cachowanie statystyk (5 min), optymistyczne UI dla operacji delete/update

11. **Responsywność z Tailwind**: Wykorzystanie utility variants dla adaptacji layoutu: grid/flex z breakpointami (sm:, md:, lg:, xl:), mobilne menu hamburger dla topbara na małych ekranach, touch targets min. 44x44px dla mobile

12. **Topbar Navigation z Shadcn/ui**: Implementacja Navigation Menu jako topbar responsywny z menu hamburger na mobile, zawierający główne sekcje nawigacji i dropdown panel użytkownika w prawym górnym rogu

13. **Wymagania WCAG AA**: Kontrast kolorów min. 4.5:1 (tekst normalny) i 3:1 (duży tekst), focus indicators na wszystkich elementach interaktywnych, pełna nawigacja klawiaturą (Tab, Enter, Escape, Arrow keys), skip navigation link, semantyczny HTML (nav, main, article, button), aria-labels dla ikon bez tekstu, aria-live regions dla dynamicznych komunikatów, zachowanie wbudowanej dostępności komponentów Shadcn/ui

14. **Struktura widoków/ekranów**: Auth (/login, /register - Astro pages), Widok generowania (/ - główny landing po logowaniu), Widok listy fiszek (/flashcards - z filtrowaniem i modalem edycji), Sesja nauki (/learn - spaced repetition), Statystyki (/stats - opcjonalny dashboard), Panel użytkownika (dropdown w topbar, nie osobny widok), wszystkie chronione endpointy z redirect do /login

15. **JWT i Supabase Auth**: Początkowe wykorzystanie Supabase Auth z built-in session management, automatyczne zarządzanie tokenami (access + refresh), przechowywanie w httpOnly cookies, w późniejszym etapie możliwość dodania własnej logiki JWT

---

## Detailed UI Architecture Planning

### 1. Główne wymagania dotyczące architektury UI

Aplikacja 10x-cards to webowa platforma do tworzenia i zarządzania fiszkami edukacyjnymi z wykorzystaniem AI (LLM) oraz algorytmu spaced repetition. Architektura UI opiera się na następującym stosie technologicznym:

#### Frontend Framework:

- Astro 5 jako główny framework dla szybkich, wydajnych stron z minimalną ilością JavaScript
- React 19 dla komponentów interaktywnych
- TypeScript 5 dla statycznego typowania

#### Stylowanie i Komponenty:

- Tailwind CSS 4 dla stylowania z wykorzystaniem utility-first approach
- Shadcn/ui jako biblioteka gotowych, dostępnych komponentów React
- Responsive design z wykorzystaniem Tailwind variants (sm:, md:, lg:, xl:)

#### Backend i Dane:

- Supabase jako Backend-as-a-Service (PostgreSQL database, Authentication)
- REST API zgodne z planem API (endpoint prefix: /api)
- Openrouter.ai dla generowania fiszek przez AI

#### Dostępność:

- Zgodność z WCAG 2.1 Level AA
- Semantyczny HTML, pełna nawigacja klawiaturą, odpowiednie kontrasty kolorów

### 2. Kluczowe widoki, ekrany i przepływy użytkownika

#### Ekrany aplikacji:

##### a) Ekran Auth (/login, /register)

- Formularz rejestracji: email + hasło
- Formularz logowania: email + hasło
- Obsługa błędów inline (nieprawidłowe dane, brak konta, etc.)
- Po poprawnym logowaniu redirect do widoku generowania

##### b) Widok generowania fiszek z AI (/ - główny landing page)

Główny ekran roboczy po zalogowaniu, składający się z:

**Formularz generowania:**

- Textarea dla tekstu źródłowego (min. 1000, max. 10000 znaków)
- Licznik znaków w czasie rzeczywistym
- Walidacja inline z komunikatami o spełnieniu/niespełnieniu wymagań
- Przycisk "Generuj fiszki"

**Stan ładowania:**

- Komunikat "Generowanie fiszek w toku..."
- Progress bar lub animacja
- Opcja anulowania requestu

**Lista propozycji do recenzji (wyświetlana pod formularzem po generowaniu):**

- Każda propozycja fiszki jako card z:
  - Checkbox do zaznaczenia
  - Wyświetlenie front/back
  - Przycisk "Edytuj" (inline formularz edycji)
  - Przycisk "Odrzuć" (usunięcie z listy)
- Dwa finalne przyciski na końcu listy:
  - **"Zapisz wszystkie"** - zapisuje wszystkie propozycje z listy (bulk save)
  - **"Zapisz zatwierdzone"** - zapisuje tylko zaznaczone checkboxem fiszki
- Wywołanie endpointu `POST /api/generations/:id/accept` z odpowiednią listą

##### c) Widok listy fiszek (/flashcards - "Moje fiszki")

- Lista wszystkich fiszek użytkownika z paginacją (20 items/page)
- Filtry tabs/pills: "Wszystkie" | "Manualne" | "AI (nieedytowane)" | "AI (edytowane)"
- Query parameter `source` dla filtrowania po stronie API
- Każda fiszka na liście z:
  - Wyświetleniem front/back
  - Przyciskiem "Edytuj" (otwiera modal)
  - Przyciskiem "Usuń" (z potwierdzeniem)
- Przycisk "+ Nowa fiszka" (otwiera modal do ręcznego tworzenia)

**Modal edycji/tworzenia fiszki (Shadcn/ui Dialog):**

- Pola: Front (max 200 znaków), Back (max 500 znaków)
- Liczniki znaków
- Walidacja inline
- Przyciski: "Zapisz", "Anuluj"

##### e) Widok statystyk (/stats - opcjonalny dashboard)

Wykorzystanie dwóch endpointów:

- `GET /api/statistics/generations` - metryki generowania AI:
  - Total generations, acceptance rate, edit rate
  - Average generation duration
  - Models used breakdown
  - Filtry czasowe: 7d/30d/90d/all
- `GET /api/statistics/flashcards` - struktura kolekcji:
  - Total flashcards
  - By source: manual/ai-full/ai-edited
  - AI created percentage

Wizualizacja w formie kart statystyk (cards) z kluczowymi metrykami.

##### f) Panel użytkownika (dropdown w topbar)

Dropdown menu (Shadcn/ui) w prawym górnym rogu topbar z opcjami:

- Link: "Ustawienia konta"
- Link: "Usuń konto" (z modal confirmation)
- Przycisk: "Wyloguj"

#### Główny przepływ użytkownika (happy path):

1. **Logowanie:** Użytkownik wchodzi na /login → wprowadza credentials → po sukcesie redirect do /
2. **Generowanie fiszek:** Na / użytkownik wkleja tekst (1000-10000 znaków) → klika "Generuj fiszki" → czeka na odpowiedź (loading state)
3. **Recenzja propozycji:** Lista propozycji pojawia się pod formularzem → użytkownik przegląda każdą fiszkę → zaznacza checkboxy przy tych, które chce zapisać LUB edytuje niektóre inline
4. **Zapis fiszek:** Użytkownik klika "Zapisz zatwierdzone" (tylko zaznaczone) LUB "Zapisz wszystkie" (wszystkie z listy) → wywołanie API → sukces → komunikat inline
5. **Zarządzanie:** Użytkownik przechodzi do /flashcards → widzi zapisane fiszki → może filtrować, edytować, usuwać, dodawać nowe ręcznie
6. **Nauka:** Użytkownik przechodzi do /learn → rozpoczyna sesję nauki → przegląda fiszki zgodnie z algorytmem → ocenia swoje przyswojenie

### 3. Strategia integracji z API i zarządzania stanem

#### Integracja z API:

##### Uwierzytelnianie:

- Wykorzystanie Supabase Auth (built-in endpoints: signup, login, logout)
- JWT tokeny zarządzane automatycznie przez Supabase SDK
- Przechowywanie w httpOnly cookies
- W późniejszym etapie możliwość dodania własnej logiki JWT

##### Komunikacja z REST API:

Custom hooks dla każdego zasobu:

- `useGenerateFlashcards()` → `POST /api/generations/generate`
- `useAcceptFlashcards(generationId)` → `POST /api/generations/:id/accept`
- `useFetchFlashcards(filters)` → `GET /api/flashcards`
- `useCreateFlashcard()` → `POST /api/flashcards`
- `useUpdateFlashcard(id)` → `PUT /api/flashcards/:id`
- `useDeleteFlashcard(id)` → `DELETE /api/flashcards/:id`
- `useFetchStatistics()` → `GET /api/statistics/*`

##### Wykorzystanie Supabase z Astro:

- Dostęp do Supabase przez `context.locals` w Astro routes (nie bezpośredni import supabaseClient)
- Użycie typu `SupabaseClient` z `src/db/supabase.client.ts`

##### Walidacja danych:

- Zod schemas dla walidacji danych wymienianych z backendem
- Walidacja po stronie klienta przed wysłaniem requestu
- Obsługa błędów walidacji z API (400 Bad Request)

#### Zarządzanie stanem:

##### Na start (MVP):

**React Context API** dla globalnego stanu:

- AuthContext: user state, isAuthenticated, login/logout functions
- Dostępny dla wszystkich komponentów React

**React hooks (useState, useEffect)** dla lokalnego stanu komponentów:

- Stan formularzy (input values, validation errors)
- Stan UI (loading, modals open/closed)
- Stan list (filtered data, pagination)

**Custom hooks** dla abstrakcji logiki API:

- Enkapsulacja fetch logic
- Obsługa loading/error states
- Return: { data, loading, error, refetch }

##### W przyszłości (jeśli potrzeba):

- **Zustand** dla bardziej złożonego zarządzania stanem (np. współdzielony stan między wieloma komponentami)

##### Strategia cachowania:

- **Flashcard lists:** Brak cachowania (real-time updates expected, użytkownik często modyfikuje)
- **Statystyki:** Cache na 5 minut (dane zmieniają się rzadziej)
- **Generation history:** Cache na 1 minutę

##### Optymistyczne UI:

- DELETE flashcard: natychmiastowe usunięcie z listy UI, rollback w przypadku błędu API
- UPDATE flashcard: natychmiastowa aktualizacja w UI, rollback w przypadku błędu
- CREATE flashcard: dodanie do listy lokalnej, synchronizacja z API

### 4. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa

#### Responsywność:

##### Tailwind CSS Utility Variants:

- Wykorzystanie breakpointów: `sm:` (≥640px), `md:` (≥768px), `lg:` (≥1024px), `xl:` (≥1280px)
- Mobile-first approach

##### Layout adaptations:

**Topbar Navigation:**

- Desktop: pełne menu z linkami
- Mobile: hamburger menu (collapsible)

**Lista fiszek:**

- Desktop: grid 2-3 kolumny (md:grid-cols-2 lg:grid-cols-3)
- Mobile: single column

**Formularz generowania:**

- Desktop: textarea większy, boczny panel z instrukcjami
- Mobile: textarea full-width, instrukcje poniżej

**Sesja nauki:**

- Pełnoekranowy interfejs na wszystkich urządzeniach
- Większe przyciski na mobile (min. 44x44px touch targets)

#### Dostępność (WCAG 2.1 Level AA):

##### Percepcja:

- Kontrast kolorów min. 4.5:1 dla tekstu normalnego, 3:1 dla dużego tekstu
- Wszystkie elementy interaktywne z widocznymi focus indicators (ring/outline)
- Etykiety formularzy powiązane z polami input (label + htmlFor)
- Alt text dla obrazów (jeśli będą używane)

##### Obsługa:

**Pełna nawigacja klawiaturą:**

- Tab/Shift+Tab: przechodzenie między elementami interaktywnymi
- Enter/Space: aktywacja przycisków/linków
- Escape: zamykanie modali/dropdownów
- Arrow keys: nawigacja w menu/listach
- Rozmiar obszarów klikalnych min. 44x44px (mobile touch targets)
- Skip navigation link dla użytkowników czytników ekranu (link "Przejdź do głównej treści")

##### Zrozumiałość:

- Komunikaty błędów opisowe i konkretne (nie tylko "Błąd", ale "Front fiszki przekracza maksymalną długość 200 znaków")
- Aria-live regions dla dynamicznych komunikatów:
  - `aria-live="polite"` dla komunikatów sukcesu ("Fiszka zapisana")
  - `aria-live="assertive"` dla błędów krytycznych
- Aria-labels dla ikon bez tekstu:
  - Przycisk z ikoną edycji: `aria-label="Edytuj fiszkę"`
  - Przycisk zamknięcia modalu: `aria-label="Zamknij"`

##### Solidność:

**Semantyczny HTML:**

- `<nav>` dla nawigacji głównej
- `<main>` dla głównej treści strony
- `<article>` dla kart fiszek
- `<button>` zamiast `<div onClick>`
- `<form>` dla formularzy z submit handling

**Aria-roles gdzie konieczne:**

- `role="dialog"` dla modali
- `role="alertdialog"` dla modal confirmations
- `role="status"` dla komunikatów statusu
- Zachowanie wbudowanej dostępności komponentów Shadcn/ui (nie nadpisywać aria attributes)

#### Bezpieczeństwo:

##### Uwierzytelnianie i autoryzacja:

- JWT tokeny (Supabase Auth) przesyłane tylko przez HTTPS
- Przechowywanie tokenów w httpOnly cookies (ochrona przed XSS)
- Automatyczne odświeżanie tokenów (refresh token rotation)
- Wszystkie chronione routes z redirect do /login jeśli brak auth

##### RLS (Row-Level Security) - KRYTYCZNE:

- **⚠️ UWAGA:** RLS policies WYŁĄCZONE na tabelach: flashcards, generations, generation_error_logs
- **Aplikacja jest 100% odpowiedzialna** za izolację danych między użytkownikami
- Wszystkie zapytania DB MUSZĄ zawierać `WHERE user_id = <authenticated_user_id>`
- user_id ZAWSZE z JWT token (sub claim), NIGDY z client request
- Middleware do automatycznego wstrzykiwania user_id filters (rekomendowane)

##### Walidacja:

- Zod schemas dla walidacji wszystkich danych z formularzy
- Walidacja długości strings (front: 200, back: 500, source_text: 1000-10000)
- Sanityzacja input przed wysłaniem do API
- Backend również waliduje (defence in depth)

##### Rate limiting:

- AI Generation endpoint: 10 req/h per user
- Standard endpoints: 100 req/min per user
- Wyświetlanie komunikatów inline o przekroczeniu limitu z czasem do resetu

##### CORS:

- Konfiguracja tylko dla autoryzowanych origins
- Brak wildcard allow-all w produkcji

### 5. Nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia

#### 1. API endpoint dla sesji nauki (spaced repetition):

- **Problem:** Brak w api-plan.md endpointu do pobierania fiszek dla sesji nauki z algorytmem spaced repetition
- **Potrzeba:** Endpoint zwracający fiszki do nauki dla danego użytkownika według harmonogramu algorytmu (np. `GET /api/learning/session` lub `POST /api/learning/session/start`)
- **Dane:** Algorytm musi śledzić metadata dla każdej fiszki: ostatnia sesja, interval, ease factor, itp.
- **Wymaga:** Doprecyzowanie w API plan i potencjalnie nowych tabel DB lub kolumn w tabeli flashcards

#### 2. Dashboard jako osobny ekran:

- **Niejasność:** Czy Dashboard jest osobnym widokiem (/dashboard) czy to alias dla głównego widoku generowania (/)
- **Decyzja:** Według US-002 użytkownik po logowaniu trafia do "widoku generowania fiszek" - sugeruje to, że / to widok generowania, nie osobny dashboard
- **Rekomendacja:** Dashboard jako opcjonalny widok /stats ze statystykami, lub zintegrowanie statystyk z widokiem /flashcards jako sidebar

#### 3. Integracja z algorytmem spaced repetition:

- **Problem:** PRD wspomina "korzystanie z gotowego algorytmu" ale nie specyfikuje biblioteki/rozwiązania
- **Wymaga:** Wybór konkretnej biblioteki open-source (np. sm2, fsrs) lub API
- **Implikacje:** Wpływ na strukturę DB (dodatkowe kolumny dla metadata fiszek) i logikę backendu

#### 4. Obsługa anulowania requestu generowania AI:

- **Problem:** Jak techniczne zaimplementować anulowanie requestu podczas generowania fiszek
- **Rozważenia:** AbortController w fetch, timeout handling, czy backend wspiera graceful cancellation
- **UX:** Co się dzieje z częściowo wygenerowanymi fiszkami

#### 5. Potwierdzenie usunięcia konta:

- **Problem:** Czy usunięcie konta wymaga dodatkowej weryfikacji (np. ponowne wprowadzenie hasła, email confirmation)
- **RODO:** Jak szybko dane są usuwane, czy jest grace period
- **UX:** Modal z ostrzeżeniem "Ta operacja jest nieodwracalna" + checkbox "Rozumiem konsekwencje"

#### 6. Error handling dla offline mode:

- **Problem:** Jak aplikacja zachowuje się gdy użytkownik traci połączenie internetowe
- **Rozważenia:** Wyświetlanie komunikatu "Brak połączenia", retry logic, cache offline data (Service Workers?)
- **MVP:** Prawdopodobnie poza zakresem, ale warto mieć podstawowy komunikat

#### 7. Image optimization i lazy loading:

- **Problem:** Czy w MVP będą jakiekolwiek obrazy (np. avatary użytkowników, ilustracje w fiszkach)
- **Jeśli tak:** Wykorzystanie Astro Image integration dla optymalizacji
- **Jeśli nie:** Nie dotyczy MVP

#### 8. Lokalizacja i internacjonalizacja:

- **Problem:** Czy aplikacja będzie tylko po polsku czy multi-language
- **MVP:** Prawdopodobnie tylko polski
- **Przyszłość:** Struktura do dodania i18n later (np. nazwy kluczy w plikach translation)

#### 9. Analytics i monitoring:

- **Problem:** Czy MVP wymaga integracji z analytics (Google Analytics, Plausible, etc.)
- **Metryki sukcesu:** PRD wspomina o 75% acceptance rate - jak to mierzyć
- **Rozwiązanie:** Dane dostępne przez endpoint /api/statistics, ale czy też external analytics dla user behavior

#### 10. Testowanie komponentów UI:

- **Problem:** Strategia testowania (unit tests, integration tests, e2e)
- **Narzędzia:** Vitest dla unit tests, Testing Library dla React components, Playwright dla e2e?
- **MVP:** Minimalne testy dla krytycznych flows (auth, generate, save flashcards)

---

## Następne kroki

Na podstawie tego podsumowania, kolejnym etapem powinno być:

2. **Utworzenie szczegółowej dokumentacji architektury UI** zawierającej:
   - Mapy podróży użytkownika (user journey maps) dla każdego głównego flow
   - Wireframes/mockupy dla każdego ekranu
   - Strukturę katalogów i komponentów
   - Data flow diagrams (jak dane przepływają między komponentami)

3. **Rozpoczęcie implementacji** w kolejności:
   - Phase 1: Auth screens + podstawowa nawigacja
   - Phase 2: Widok generowania z AI + recenzja propozycji
   - Phase 3: Widok listy fiszek + CRUD operations
   - Phase 4: Sesja nauki (po doprecyzowaniu API)
   - Phase 5: Statystyki i polish
