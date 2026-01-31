# Create Feature Command

Generuj pełną funkcjonalność według wzorca: **Astro Page → React Component → API Endpoint**

## Wzorzec z projektu

Bazuj na architekturze z `user.astro` → `UsersList.tsx` → `api/users.ts`

## Instrukcje

Gdy wykonujesz `/create-feature [nazwa-funkcji] [NazwaEncji]`, wygeneruj:

### 1. Typ w `/src/types.ts`

```typescript
export interface [NazwaEncji] {
  id: string;
  // pola specyficzne dla encji
  createdAt: string;
}
```

### 2. API Endpoint `/src/pages/api/[nazwa-funkcji].ts`

- `export const prerender = false`
- `export const GET: APIRoute`
- Dummy data (3-5 przykładów)
- TODO komentarz: integracja z Supabase przez `Astro.locals.supabase`
- Error handling z odpowiednimi statusami

### 3. React Component `/src/components/[NazwaEncji]List.tsx`

- `useState` dla: data, loading, error
- `useEffect` → `fetch("/api/[nazwa-funkcji]")`
- Renderowanie stanów: loading, error, success
- Grid layout z kartami (glassmorphism style)
- Footer z informacją o dummy data

### 4. Astro Page `/src/pages/[nazwa-funkcji].astro`

- Import Layout i React component
- Render component z `client:load`
- Header z tytułem i opisem
- Link powrotny do home

## Kluczowe zasady

- React component **NIE pobiera** danych w Astro - tylko przez `fetch()` w `useEffect`
- API endpoint przygotowany na przyszłą integrację z Supabase
- Spójny styling (gradient backgrounds, backdrop-blur, glassmorphism)
- Zawsze obsługa loading i error states
- Uppercase dla metod HTTP w API (`GET`, `POST`)

## Przykłady użycia

```bash
/create-feature challenges Challenge
/create-feature leaderboard LeaderboardEntry
/create-feature achievements Achievement
```

## Po wygenerowaniu

Zapytaj użytkownika o:

- Konkretne pola dla typu
- Przykładowe dummy data
- Tytuł i opis strony
- Layout karty w komponencie React
