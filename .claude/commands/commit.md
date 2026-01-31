---
description: Utwórz git commit z konwencjonalnym formatem wiadomości
argument-hint: [type] [scope] [message]
allowed-tools: Bash(git:*)
---

Utwórz git commit używając Conventional Commits format.

## Parametry:

- **Type**: $1 (feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert)
- **Scope**: $2 (astro, db, ui, components, api, types, config, itp.)
- **Message**: $ARGUMENTS (wszystko po $2)

## Proces:

### 1. Sprawdź status

```bash
git status
```

### 2. Zobacz zmiany

```bash
git diff --name-only HEAD
```

### 3. Stwórz commit message

Format: `type(scope): message`

Przykłady:

- `feat(components): add UsersList component with API integration`
- `fix(api): handle error in users endpoint`
- `docs(readme): update installation instructions`
- `refactor(db): simplify supabase client initialization`
- `style(ui): improve button hover states`
- `test(api): add unit tests for users endpoint`
- `chore(deps): update dependencies`

### 4. Wykonaj commit

Użyj formatu z emoji:

```
type(scope): message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 5. Zasady:

- **feat**: nowa funkcjonalność
- **fix**: naprawa błędu
- **docs**: zmiany w dokumentacji
- **style**: formatowanie, brakujące średniki itp. (nie CSS)
- **refactor**: refaktoryzacja kodu (nie zmienia funkcjonalności)
- **test**: dodanie lub modyfikacja testów
- **chore**: zmiany w build process, zależnościach itp.
- **perf**: optymalizacje wydajności
- **ci**: zmiany w CI/CD
- **build**: zmiany w systemie budowania
- **revert**: cofnięcie poprzedniego commita

### 6. Walidacja:

Przed commitem upewnij się, że:

- Wszystkie zmodyfikowane pliki są dodane (`git add`)
- Nie commitujemy plików z secretami (.env, credentials itp.)
- Message jest jasny i opisowy
- Type i scope są odpowiednie

### 7. Po commit:

Pokaż status i ostatni commit:

```bash
git status
git log -1 --oneline
```

## Przykład użycia:

```
/commit feat components "add UsersList with loading and error states"
```

Wygeneruje commit:

```
feat(components): add UsersList with loading and error states

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```
