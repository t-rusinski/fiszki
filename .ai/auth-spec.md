# Specyfikacja techniczna systemu autentykacji - Fiszki

## 1. Wprowadzenie

Niniejszy dokument przedstawia szczegółową architekturę techniczną systemu autentykacji dla aplikacji Fiszki. Specyfikacja obejmuje implementację funkcjonalności rejestracji, logowania, wylogowywania i usuwania konta użytkowników zgodnie z wymaganiami z PRD (US-001, US-002, US-009, US-010).

System autentykacji został zaprojektowany z wykorzystaniem Supabase Auth jako dostawcy usług autentykacyjnych, zintegrowanego z frameworkiem Astro 5 i komponentami React 19.

### 1.1 Zakres MVP vs Przyszłe wersje

**Zakres MVP (zgodnie z PRD):**

- Rejestracja i logowanie użytkowników (email + hasło)
- Natychmiastowa aktywacja konta po rejestracji (bez email confirmation)
- Wylogowanie
- Usuwanie konta wraz z danymi
- Tryb demo generowania fiszek dla niezalogowanych użytkowników
- Ochrona tras i autoryzacja dostępu do danych

**Poza zakresem MVP (oznaczone jako [OPCJONALNE]):**

- Resetowanie hasła (forgot/reset password flow)
- Potwierdzanie email przy rejestracji
- Strona ustawień użytkownika
- Zmiana hasła dla zalogowanego użytkownika

Wszystkie sekcje oznaczone jako "[OPCJONALNE - POZA MVP]" mogą być zaimplementowane w przyszłych wersjach, ale nie są wymagane dla pierwszej wersji produktu.

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Przegląd struktury stron i komponentów

Aplikacja będzie działać w dwóch trybach:

- **Tryb niezalogowany (non-auth)**: Dostęp tylko do `/login`, `/register` oraz widoku demo generowania fiszek
- **Tryb zalogowany (auth)**: Dostęp do pełnej funkcjonalności aplikacji z chronionych tras

#### 2.1.1 Struktura routingu

**Strony publiczne (dostępne bez logowania):**

- `/login` - Strona logowania
- `/register` - Strona rejestracji
- `/generate` - Widok demo generowania fiszek (tylko odczyt, bez zapisywania)

**Strony publiczne (opcjonalne dla przyszłych wersji - poza MVP):**

- `/forgot-password` - Strona resetowania hasła (wysyłka emaila)
- `/reset-password` - Strona ustawiania nowego hasła (z tokenu w linku)

**Strony chronione (wymagają autentykacji):**

- `/` - Strona główna (przekierowuje do `/generate` dla zalogowanych)
- `/generate` - Pełny widok generowania z możliwością zapisu
- `/flashcards` - Lista fiszek użytkownika
- `/learn` - Sesja nauki
- `/stats` - Statystyki

### 2.2 Komponenty stron autentykacji

#### 2.2.1 Strona logowania (`/login`)

**Plik**: `src/pages/login.astro`

**Struktura**:

```
<Layout title="Logowanie">
  <main class="min-h-screen bg-background flex items-center justify-center">
    <Container maxWidth="sm">
      <LoginForm client:load />
    </Container>
  </main>
</Layout>
```

**Odpowiedzialność strony Astro**:

- Renderowanie layoutu strony
- Server-side sprawdzenie czy użytkownik jest już zalogowany (redirect do `/generate` jeśli tak)
- Obsługa query params (np. `?error=invalid_credentials`, `?return=/flashcards`)
- SEO meta tags

**Server-side logic w Astro**:

```typescript
// W pliku login.astro (kod frontmatter)
const session = await Astro.locals.supabase.auth.getSession();
if (session.data.session) {
  return Astro.redirect("/generate");
}

const errorCode = Astro.url.searchParams.get("error");
const returnUrl = Astro.url.searchParams.get("return") || "/generate";
```

#### 2.2.2 Komponent formularza logowania (`LoginForm`)

**Plik**: `src/components/auth/LoginForm.tsx`

**Props**:

```typescript
interface LoginFormProps {
  errorCode?: string | null;
  returnUrl?: string;
}
```

**Stan komponentu**:

```typescript
interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
    password?: string;
  };
}
```

**Odpowiedzialność**:

- Walidacja formularza po stronie klienta (format email, hasło niepuste)
- Obsługa zdarzeń user input (onChange, onSubmit)
- Komunikacja z Supabase Auth API (przez helper function)
- Wyświetlanie komunikatów błędów inline
- Zarządzanie stanem ładowania
- Przekierowanie po udanym logowaniu

**Przepływ logowania**:

1. Użytkownik wypełnia formularz
2. Walidacja client-side (sprawdzenie formatu email, min długość hasła)
3. Submit → wywołanie `signInWithPassword` z Supabase Auth
4. Obsługa odpowiedzi:
   - Sukces: Redirect do `returnUrl` lub `/generate`
   - Błąd: Wyświetlenie komunikatu błędu inline

**Struktura komponentu**:

```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>Logowanie do Fiszki</CardTitle>
    <CardDescription>Wprowadź swoje dane aby się zalogować</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={handleEmailChange}
        error={validationErrors.email}
        required
      />
      <PasswordInput
        label="Hasło"
        value={password}
        onChange={handlePasswordChange}
        error={validationErrors.password}
        required
      />
      {error && <ErrorMessage message={error} />}
      <Button type="submit" loading={isLoading} disabled={isLoading || !isFormValid} className="w-full">
        Zaloguj się
      </Button>
    </form>
  </CardContent>
  <CardFooter>
    <p className="text-sm text-muted-foreground">
      Nie masz konta?{" "}
      <a href="/register" className="text-primary hover:underline">
        Zarejestruj się
      </a>
    </p>
  </CardFooter>
</Card>
```

**Walidacja**:

- Email: Regex dla formatu email `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Hasło: Min 1 znak (Supabase enforce własne reguły na backendzie)

**Komunikaty błędów**:

- `"invalid_credentials"` → "Nieprawidłowy email lub hasło"
- `"email_not_confirmed"` → "Potwierdź swój adres email przed logowaniem"
- `"too_many_requests"` → "Zbyt wiele prób logowania. Spróbuj ponownie później"
- Domyślny → "Wystąpił błąd podczas logowania. Spróbuj ponownie"

#### 2.2.3 Strona rejestracji (`/register`)

**Plik**: `src/pages/register.astro`

**Struktura**:

```
<Layout title="Rejestracja">
  <main class="min-h-screen bg-background flex items-center justify-center">
    <Container maxWidth="sm">
      <RegisterForm client:load />
    </Container>
  </main>
</Layout>
```

**Server-side logic**:

- Sprawdzenie czy użytkownik jest już zalogowany (redirect do `/generate`)
- Obsługa query params dla błędów i komunikatów

#### 2.2.4 Komponent formularza rejestracji (`RegisterForm`)

**Plik**: `src/components/auth/RegisterForm.tsx`

**Stan komponentu**:

```typescript
interface RegisterFormState {
  email: string;
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
    password?: string;
    passwordConfirm?: string;
  };
}
```

**Odpowiedzialność**:

- Walidacja formularza (format email, zgodność haseł, min długość hasła)
- Real-time walidacja dla pola potwierdzenia hasła
- Komunikacja z Supabase Auth API (signup)
- Auto-login po udanej rejestracji
- Przekierowanie do `/generate` po sukcesie

**Walidacja**:

- Email: Format email
- Hasło: Min 8 znaków (wymaganie Supabase domyślne)
- Potwierdzenie hasła: Musi być identyczne z hasłem

**Komunikaty błędów**:

- `"email_exists"` → "Konto z tym adresem email już istnieje"
- `"weak_password"` → "Hasło musi mieć co najmniej 8 znaków"
- `"invalid_email"` → "Wprowadź poprawny adres email"
- Passwords mismatch → "Hasła nie są identyczne"

**Struktura komponentu**:

```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>Rejestracja</CardTitle>
    <CardDescription>Utwórz konto aby korzystać z pełnej funkcjonalności</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={handleEmailChange}
        error={validationErrors.email}
        required
      />
      <PasswordInput
        label="Hasło"
        value={password}
        onChange={handlePasswordChange}
        error={validationErrors.password}
        helperText="Minimum 8 znaków"
        required
      />
      <PasswordInput
        label="Potwierdź hasło"
        value={passwordConfirm}
        onChange={handlePasswordConfirmChange}
        error={validationErrors.passwordConfirm}
        required
      />
      {error && <ErrorMessage message={error} />}
      <Button type="submit" loading={isLoading} disabled={isLoading || !isFormValid} className="w-full">
        Zarejestruj się
      </Button>
    </form>
  </CardContent>
  <CardFooter>
    <p className="text-sm text-muted-foreground">
      Masz już konto?{" "}
      <a href="/login" className="text-primary hover:underline">
        Zaloguj się
      </a>
    </p>
  </CardFooter>
</Card>
```

#### 2.2.5 Strona resetowania hasła - żądanie (`/forgot-password`) [OPCJONALNE - POZA MVP]

**Plik**: `src/pages/forgot-password.astro`

**Struktura**:

```
<Layout title="Resetowanie hasła">
  <main class="min-h-screen bg-background flex items-center justify-center">
    <Container maxWidth="sm">
      <ForgotPasswordForm client:load />
    </Container>
  </main>
</Layout>
```

**Server-side logic**:

- Sprawdzenie czy użytkownik jest już zalogowany (redirect do `/generate`)
- Obsługa query params dla komunikatów (np. `?success=true`)

#### 2.2.6 Komponent formularza resetowania hasła (`ForgotPasswordForm`) [OPCJONALNE - POZA MVP]

**Plik**: `src/components/auth/ForgotPasswordForm.tsx`

**Stan komponentu**:

```typescript
interface ForgotPasswordFormState {
  email: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  validationErrors: {
    email?: string;
  };
}
```

**Odpowiedzialność**:

- Walidacja formatu email
- Wywołanie Supabase Auth API (`resetPasswordForEmail`)
- Wyświetlenie komunikatu sukcesu (nie ujawnianie czy email istnieje w systemie)
- Link powrotny do logowania

**Struktura komponentu**:

```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>Resetowanie hasła</CardTitle>
    <CardDescription>Wprowadź adres email powiązany z Twoim kontem</CardDescription>
  </CardHeader>
  <CardContent>
    {!success ? (
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          error={validationErrors.email}
          required
        />
        {error && <ErrorMessage message={error} />}
        <Button type="submit" loading={isLoading} disabled={isLoading || !isFormValid} className="w-full">
          Wyślij link resetujący
        </Button>
      </form>
    ) : (
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Email wysłany</AlertTitle>
        <AlertDescription>
          Jeśli konto z tym adresem istnieje, otrzymasz email z linkiem do resetowania hasła. Link będzie ważny przez 1
          godzinę.
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
  <CardFooter>
    <p className="text-sm text-muted-foreground">
      Pamiętasz hasło?{" "}
      <a href="/login" className="text-primary hover:underline">
        Wróć do logowania
      </a>
    </p>
  </CardFooter>
</Card>
```

**Przepływ**:

1. Użytkownik wpisuje email
2. Walidacja formatu email
3. Submit → wywołanie `supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: 'https://yourdomain.com/reset-password' })`
4. Sukces → wyświetlenie komunikatu o wysłanym emailu (zawsze sukces, niezależnie czy email istnieje)
5. Użytkownik otrzymuje email z linkiem zawierającym token

**Komunikaty błędów**:

- Invalid email format → "Wprowadź poprawny adres email"
- Generic error → "Wystąpił błąd. Spróbuj ponownie"

#### 2.2.7 Strona ustawiania nowego hasła (`/reset-password`) [OPCJONALNE - POZA MVP]

**Plik**: `src/pages/reset-password.astro`

**Struktura**:

```
<Layout title="Ustaw nowe hasło">
  <main class="min-h-screen bg-background flex items-center justify-center">
    <Container maxWidth="sm">
      <ResetPasswordForm client:load />
    </Container>
  </main>
</Layout>
```

**Server-side logic**:

- Wyciągnięcie tokenu z URL hash (`#access_token=...&type=recovery`)
- Przekazanie tokenu do komponentu
- Sprawdzenie ważności tokenu (Supabase SDK to obsłuży)

**Kod frontmatter**:

```typescript
// Supabase przekierowuje do /reset-password#access_token=...&type=recovery
// Token jest w hash, więc musimy go wyciągnąć client-side
const session = await Astro.locals.supabase.auth.getSession();

if (session.data.session) {
  // User już zalogowany przez token z URL
  // Redirect do strony resetowania hasła
}
```

#### 2.2.8 Komponent formularza nowego hasła (`ResetPasswordForm`) [OPCJONALNE - POZA MVP]

**Plik**: `src/components/auth/ResetPasswordForm.tsx`

**Stan komponentu**:

```typescript
interface ResetPasswordFormState {
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  validationErrors: {
    password?: string;
    passwordConfirm?: string;
  };
}
```

**Odpowiedzialność**:

- Walidacja hasła (min 8 znaków)
- Walidacja zgodności haseł
- Wywołanie Supabase Auth API (`updateUser`)
- Redirect do `/login` po sukcesie z komunikatem

**Struktura komponentu**:

```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>Ustaw nowe hasło</CardTitle>
    <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
  </CardHeader>
  <CardContent>
    {!success ? (
      <form onSubmit={handleSubmit}>
        <PasswordInput
          label="Nowe hasło"
          value={password}
          onChange={handlePasswordChange}
          error={validationErrors.password}
          helperText="Minimum 8 znaków"
          required
        />
        <PasswordInput
          label="Potwierdź nowe hasło"
          value={passwordConfirm}
          onChange={handlePasswordConfirmChange}
          error={validationErrors.passwordConfirm}
          required
        />
        {error && <ErrorMessage message={error} />}
        <Button type="submit" loading={isLoading} disabled={isLoading || !isFormValid} className="w-full">
          Ustaw nowe hasło
        </Button>
      </form>
    ) : (
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Hasło zmienione</AlertTitle>
        <AlertDescription>Twoje hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.</AlertDescription>
      </Alert>
    )}
  </CardContent>
  {success && (
    <CardFooter>
      <Button asChild className="w-full">
        <a href="/login">Przejdź do logowania</a>
      </Button>
    </CardFooter>
  )}
</Card>
```

**Przepływ**:

1. Użytkownik klika link w emailu
2. Supabase przekierowuje do `/reset-password#access_token=...&type=recovery`
3. Komponent wywołuje `supabaseClient.auth.getSession()` aby zweryfikować token
4. Jeśli token ważny, wyświetla formularz
5. Użytkownik wprowadza nowe hasło
6. Submit → wywołanie `supabaseClient.auth.updateUser({ password: newPassword })`
7. Sukces → wyświetlenie komunikatu + redirect do `/login` po 3 sekundach

**Walidacja**:

- Hasło: Min 8 znaków
- Potwierdzenie hasła: Musi być identyczne z hasłem

**Komunikaty błędów**:

- Token expired → "Link resetujący wygasł. Poproś o nowy link"
- Invalid token → "Nieprawidłowy link. Poproś o nowy link resetujący"
- Passwords mismatch → "Hasła nie są identyczne"
- Weak password → "Hasło musi mieć co najmniej 8 znaków"

### 2.3 Modyfikacje istniejących komponentów

#### 2.3.1 Header - rozszerzenie o nawigację i menu użytkownika

**Plik**: `src/components/Header.tsx`

**Nowy interfejs Props**:

```typescript
interface HeaderProps {
  user?: User | null;
  currentPath?: string;
}
```

**Rozszerzenie funkcjonalności**:

1. **Nawigacja główna** (tylko dla zalogowanych użytkowników):

```tsx
{
  user && (
    <nav className="flex items-center gap-6">
      <NavLink href="/generate" active={currentPath === "/generate"}>
        Generuj
      </NavLink>
      <NavLink href="/flashcards" active={currentPath === "/flashcards"}>
        Moje fiszki
      </NavLink>
      <NavLink href="/learn" active={currentPath === "/learn"}>
        Sesja nauki
      </NavLink>
      <NavLink href="/stats" active={currentPath === "/stats"}>
        Statystyki
      </NavLink>
    </nav>
  );
}
```

2. **User dropdown** (prawy górny róg):

```tsx
{
  user && <UserDropdown user={user} />;
}
```

3. **Mobile menu** (hamburger dla < 768px):

- Rozwijane menu z pełną nawigacją
- Elementy menu użytkownika zintegrowane w mobile view

**Komponenty pomocnicze**:

**NavLink** (`src/components/navigation/NavLink.tsx`):

```typescript
interface NavLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}
```

#### 2.3.2 UserDropdown - nowy komponent

**Plik**: `src/components/navigation/UserDropdown.tsx`

**Props**:

```typescript
interface UserDropdownProps {
  user: User;
}
```

**Struktura**:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Avatar>
        <AvatarFallback>{userInitials}</AvatarFallback>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem disabled>
      <span className="text-sm text-muted-foreground">{user.email}</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive" onClick={handleDeleteAccount}>
      <Trash2 className="mr-2 h-4 w-4" />
      Usuń konto
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Wyloguj się
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Odpowiedzialność**:

- Wyświetlanie menu użytkownika
- Obsługa kliknięcia "Wyloguj się" → wywołanie funkcji logout
- Obsługa kliknięcia "Usuń konto" → otwarcie modal potwierdzenia
- Keyboard navigation (Arrow keys, Enter, Escape)

#### 2.3.3 DeleteAccountModal - nowy komponent

**Plik**: `src/components/auth/DeleteAccountModal.tsx`

**Props**:

```typescript
interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
```

**Stan komponentu**:

```typescript
interface DeleteAccountModalState {
  isConfirmChecked: boolean;
  isDeleting: boolean;
  error: string | null;
}
```

**Struktura**:

```tsx
<AlertDialog open={isOpen} onOpenChange={onClose}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        Usunąć konto?
      </AlertDialogTitle>
      <AlertDialogDescription>
        Ta operacja spowoduje trwałe usunięcie Twojego konta oraz wszystkich fiszek. Nie można tego cofnąć.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="flex items-center space-x-2">
      <Checkbox id="confirm" checked={isConfirmChecked} onCheckedChange={setIsConfirmChecked} />
      <label htmlFor="confirm" className="text-sm">
        Rozumiem, że ta operacja jest nieodwracalna
      </label>
    </div>

    {error && <ErrorMessage message={error} />}

    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
      <AlertDialogAction
        disabled={!isConfirmChecked || isDeleting}
        onClick={handleConfirm}
        className="bg-destructive text-destructive-foreground"
      >
        {isDeleting ? "Usuwanie..." : "Usuń konto"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Odpowiedzialność**:

- Wyświetlanie modal ostrzeżenia
- Wymuszenie zaznaczenia checkboxa przed aktywacją przycisku "Usuń konto"
- Wywołanie API endpoint do usunięcia konta
- Obsługa błędów podczas usuwania
- Auto-logout po udanym usunięciu

### 2.4 Modyfikacje widoku generowania fiszek

**Plik**: `src/pages/generate.astro`

**Rozszerzenie server-side logic**:

```typescript
const session = await Astro.locals.supabase.auth.getSession();
const user = session.data.session?.user || null;
const isDemoMode = !user;
```

**Przekazanie user do komponentu**:

```tsx
<GenerationView client:load user={user} isDemoMode={isDemoMode} />
```

**Modyfikacje komponentu GenerationView** (`src/components/generation/GenerationView.tsx`):

**Nowe Props**:

```typescript
interface GenerationViewProps {
  user?: User | null;
  isDemoMode: boolean;
}
```

**Logika dla trybu demo**:

- Jeśli `isDemoMode === true`:
  - Formularz generowania działa normalnie
  - Po otrzymaniu sugestii, wyświetlany jest banner:
    ```tsx
    <Alert variant="info" className="mb-4">
      <InfoCircle className="h-4 w-4" />
      <AlertTitle>TrybDemo</AlertTitle>
      <AlertDescription>
        Zarejestruj się, aby zapisać wygenerowane fiszki i korzystać z algorytmu powtórek.{" "}
        <a href="/register" className="underline font-medium">
          Zarejestruj się teraz
        </a>
      </AlertDescription>
    </Alert>
    ```
  - Przyciski "Zapisz zaznaczone" i "Zapisz wszystkie" są ukryte
  - Sugestie są tylko do odczytu (można przeglądać, ale nie zapisywać)

- Jeśli `isDemoMode === false` (użytkownik zalogowany):
  - Pełna funkcjonalność zapisu fiszek

### 2.5 Komponenty pomocnicze UI

#### 2.5.1 PasswordInput

**Plik**: `src/components/ui/PasswordInput.tsx`

**Props**:

```typescript
interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
}
```

**Funkcjonalność**:

- Input type="password" z toggle visibility (ikona oka)
- Pokazanie/ukrycie hasła po kliknięciu ikony
- Wyświetlanie error message inline
- Helper text (np. "Minimum 8 znaków")

#### 2.5.2 TextInput

**Plik**: `src/components/ui/TextInput.tsx`

Rozszerzenie istniejącego komponentu o:

- `error?: string` - komunikat błędu
- `helperText?: string` - tekst pomocniczy

## 3. LOGIKA BACKENDOWA

### 3.1 Endpointy API

#### 3.1.1 Endpoint wylogowania

**Endpoint**: `POST /api/auth/logout`
**Plik**: `src/pages/api/auth/logout.ts`

**Response**:

```typescript
interface LogoutResponse {
  success: boolean;
}
```

**Implementacja**:

```typescript
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    await locals.supabase.auth.signOut();

    // Usunięcie cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
};
```

#### 3.1.2 Endpoint usuwania konta

**Endpoint**: `DELETE /api/auth/account`
**Plik**: `src/pages/api/auth/account.ts`

**Wymagania**: Autentykacja (sprawdzenie JWT token)

**Response**:

```typescript
interface DeleteAccountResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}
```

**Implementacja**:

```typescript
export const DELETE: APIRoute = async ({ locals, cookies }) => {
  try {
    const session = await locals.supabase.auth.getSession();
    const user = session.data.session?.user;

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Musisz być zalogowany",
          },
        }),
        { status: 401 }
      );
    }

    // 1. Usunięcie wszystkich fiszek użytkownika
    await locals.supabase.from("flashcards").delete().eq("user_id", user.id);

    // 2. Usunięcie wszystkich generacji użytkownika
    await locals.supabase.from("generations").delete().eq("user_id", user.id);

    // 3. Usunięcie logów błędów generacji (jeśli istnieją)
    await locals.supabase.from("generation_error_logs").delete().eq("user_id", user.id);

    // 4. Usunięcie konta użytkownika przez Supabase Admin API
    // Wymaga użycia service role key (nie anon key)
    // To musi być wykonane przez Admin API lub funkcję edge

    // Wywołanie Supabase Admin API (wymaga backend function)
    const deleteUserResponse = await fetch(`${import.meta.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: {
        apikey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${import.meta.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!deleteUserResponse.ok) {
      throw new Error("Failed to delete user account");
    }

    // Wylogowanie i czyszczenie cookies
    await locals.supabase.auth.signOut();
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: "Nie udało się usunąć konta",
        },
      }),
      { status: 500 }
    );
  }
};
```

**Uwaga**: Usuwanie użytkownika przez Supabase Admin API wymaga **Service Role Key** (nie Anon Key). Należy dodać do `.env`:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 3.1.3 Password reset [OPCJONALNE - POZA MVP, Supabase obsługuje bezpośrednio]

**Uwaga**: Funkcjonalność resetowania hasła jest w pełni obsługiwana przez Supabase Auth bezpośrednio z komponentów React. Nie ma potrzeby tworzenia własnych endpointów API. Komponenty używają:

1. **Forgot Password Flow**:

```typescript
// W ForgotPasswordForm.tsx
await supabaseClient.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

Supabase:

- Wysyła email z linkiem resetującym
- Link zawiera token recovery w URL hash
- Link jest ważny przez 1 godzinę (domyślnie)

2. **Reset Password Flow**:

```typescript
// W ResetPasswordForm.tsx
// Supabase automatycznie wykrywa token z URL hash (#access_token=...&type=recovery)
const { data, error } = await supabaseClient.auth.updateUser({
  password: newPassword,
});
```

**Email template configuration**:
W Supabase Dashboard → Authentication → Email Templates należy skonfigurować szablon "Reset Password":

```html
<h2>Resetowanie hasła</h2>
<p>Kliknij poniższy link aby zresetować swoje hasło:</p>
<p><a href="{{ .ConfirmationURL }}">Zresetuj hasło</a></p>
<p>Link jest ważny przez 1 godzinę.</p>
<p>Jeśli nie prosiłeś o reset hasła, zignoruj ten email.</p>
```

**Konfiguracja Redirect URL**:
W Supabase Dashboard → Authentication → URL Configuration dodaj:

- `http://localhost:4321/reset-password` (dev)
- `https://yourdomain.com/reset-password` (production)

### 3.2 Middleware - autentykacja i autoryzacja

**Plik**: `src/middleware/index.ts`

**Rozszerzenie istniejącego middleware**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

// MVP: tylko login i register jako publiczne strony auth
// /generate jest dostępny dla wszystkich (demo mode dla niezalogowanych)
const PUBLIC_ROUTES = ["/login", "/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Przypisanie Supabase client do context.locals
  context.locals.supabase = supabaseClient;

  // Pobranie sesji użytkownika z cookies lub header
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  let user = null;

  if (accessToken) {
    const { data, error } = await supabaseClient.auth.getUser(accessToken);

    if (!error && data.user) {
      user = data.user;
    } else if (refreshToken) {
      // Token wygasł, próba odświeżenia
      const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && refreshData.session) {
        user = refreshData.user;

        // Aktualizacja cookies z nowym tokenem
        context.cookies.set("sb-access-token", refreshData.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60,
        });
      }
    }
  }

  // Przypisanie user do context.locals
  context.locals.user = user;

  const pathname = context.url.pathname;

  // Logika przekierowań
  if (!user && !PUBLIC_ROUTES.includes(pathname) && pathname !== "/generate") {
    // Użytkownik niezalogowany próbuje dostać się do chronionej strony
    const returnUrl = encodeURIComponent(pathname);
    return context.redirect(`/login?return=${returnUrl}`);
  }

  if (user && PUBLIC_ROUTES.includes(pathname)) {
    // Zalogowany użytkownik próbuje dostać się do /login lub /register
    return context.redirect("/generate");
  }

  // Dla /generate: zarówno zalogowani jak i niezalogowani mają dostęp
  // Tryb demo vs full mode będzie obsłużony w komponencie

  return next();
});
```

**Aktualizacja typu `App.Locals`** w `src/env.d.ts`:

```typescript
interface Locals {
  supabase: SupabaseClient<Database>;
  user: User | null; // <-- Dodanie user
}
```

### 3.3 Helper functions i utilities

#### 3.3.1 Auth helpers

**Plik**: `src/lib/auth/auth-helpers.ts`

**Funkcje**:

```typescript
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Mapowanie błędów Supabase Auth na przyjazne komunikaty dla użytkownika
 */
export function mapAuthError(errorCode: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Nieprawidłowy email lub hasło",
    "Email not confirmed": "Potwierdź swój adres email przed logowaniem",
    "User already registered": "Konto z tym adresem email już istnieje",
    "Password should be at least 8 characters": "Hasło musi mieć co najmniej 8 znaków",
    "Invalid email": "Wprowadź poprawny adres email",
    "Too many requests": "Zbyt wiele prób. Spróbuj ponownie później",
  };

  return errorMap[errorCode] || "Wystąpił błąd. Spróbuj ponownie";
}

/**
 * Walidacja formatu email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sprawdzenie czy użytkownik jest zalogowany
 */
export function isAuthenticated(user: User | null): boolean {
  return user !== null;
}

/**
 * Pobieranie inicjałów użytkownika dla avatara
 */
export function getUserInitials(user: User): string {
  const email = user.email || "";
  return email.substring(0, 2).toUpperCase();
}

/**
 * Client-side login function
 */
export async function loginUser(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error.message),
    };
  }

  return { success: true };
}

/**
 * Client-side register function
 */
export async function registerUser(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error.message),
    };
  }

  return { success: true };
}

/**
 * Client-side logout function
 */
export async function logoutUser(supabase: SupabaseClient): Promise<{ success: boolean }> {
  await supabase.auth.signOut();
  return { success: true };
}

/**
 * Client-side forgot password function
 * Wysyła email z linkiem do resetowania hasła
 */
export async function requestPasswordReset(
  supabase: SupabaseClient,
  email: string,
  redirectUrl: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error.message),
    };
  }

  // Zawsze zwracamy sukces (nie ujawniamy czy email istnieje)
  return { success: true };
}

/**
 * Client-side reset password function
 * Ustawia nowe hasło dla użytkownika
 */
export async function resetPassword(
  supabase: SupabaseClient,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error.message),
    };
  }

  return { success: true };
}
```

#### 3.3.2 Hook React dla autentykacji

**Plik**: `src/lib/auth/useAuth.ts`

```typescript
import { useState, useEffect } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Custom hook do zarządzania stanem autentykacji
 * Nasłuchuje zmian w sesji użytkownika
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pobranie aktualnej sesji
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Nasłuchiwanie zmian w sesji
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabaseClient.auth.signOut();
  };

  return { user, loading, signOut };
}
```

### 3.4 Walidacja danych wejściowych

**Plik**: `src/lib/validation/auth-validation.ts`

```typescript
import { z } from "zod";

/**
 * Schema walidacji dla logowania
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Wprowadź poprawny adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Schema walidacji dla rejestracji
 */
export const registerSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Wprowadź poprawny adres email"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są identyczne",
    path: ["passwordConfirm"],
  });

/**
 * Type inference z schema
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Helper do walidacji po stronie serwera
 */
export function validateLoginInput(input: unknown): {
  success: boolean;
  data?: LoginInput;
  errors?: z.ZodError;
} {
  const result = loginSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

export function validateRegisterInput(input: unknown): {
  success: boolean;
  data?: RegisterInput;
  errors?: z.ZodError;
} {
  const result = registerSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Schema walidacji dla forgot password
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Wprowadź poprawny adres email"),
});

/**
 * Schema walidacji dla reset password
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są identyczne",
    path: ["passwordConfirm"],
  });

/**
 * Type inference z schema
 */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Helper do walidacji forgot password
 */
export function validateForgotPasswordInput(input: unknown): {
  success: boolean;
  data?: ForgotPasswordInput;
  errors?: z.ZodError;
} {
  const result = forgotPasswordSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Helper do walidacji reset password
 */
export function validateResetPasswordInput(input: unknown): {
  success: boolean;
  data?: ResetPasswordInput;
  errors?: z.ZodError;
} {
  const result = resetPasswordSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
```

### 3.5 Obsługa błędów

**Standardowy format odpowiedzi błędów**:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Kody błędów**:

- `UNAUTHORIZED` - Brak autoryzacji (401)
- `FORBIDDEN` - Brak uprawnień (403)
- `VALIDATION_ERROR` - Błąd walidacji danych (400)
- `AUTH_ERROR` - Błąd autentykacji (401)
- `INTERNAL_ERROR` - Błąd serwera (500)
- `RATE_LIMIT_EXCEEDED` - Przekroczono limit żądań (429)

**Handler błędów** (`src/lib/error-handler.ts`) - rozszerzenie istniejącego:

```typescript
export function handleAuthError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Nieprawidłowe dane wejściowe",
          details: error.errors,
        },
      }),
      { status: 400 }
    );
  }

  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "Wystąpił błąd. Spróbuj ponownie",
      },
    }),
    { status: 500 }
  );
}
```

## 4. SYSTEM AUTENTYKACJI Z SUPABASE

### 4.1 Konfiguracja Supabase Auth

**Wymagane zmienne środowiskowe** (`.env`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Aktualizacja `src/env.d.ts`**:

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}
```

### 4.2 Inicjalizacja klienta Supabase

**Aktualizacja `src/db/supabase.client.ts`**:

```typescript
import { createClient, SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side Supabase client (używa anon key)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Server-side admin client (używa service role key)
// Tylko dla operacji administracyjnych (np. usuwanie użytkownika)
export const supabaseAdmin = createClient<Database>(supabaseUrl, import.meta.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type SupabaseClient = SupabaseClientBase<Database>;
```

### 4.3 Konfiguracja Supabase Auth Settings

**W Supabase Dashboard → Authentication → Settings**:

1. **Email Auth**:
   - Enable Email provider
   - Confirm email: **WYŁĄCZONE dla MVP** (zgodnie z PRD US-001 - natychmiastowa aktywacja konta)
   - Secure email change: Enabled

2. **Password Requirements**:
   - Minimum length: 8 characters
   - Require uppercase: Optional
   - Require lowercase: Optional
   - Require numbers: Optional
   - Require special characters: Optional

3. **Email Templates**:
   - Customize "Confirm your signup" email (jeśli email confirmation włączone)
   - Customize "Reset your password" email (dla przyszłych funkcji)

4. **URL Configuration**:
   - Site URL: `http://localhost:4321` (dev) / `https://yourdomain.com` (prod)
   - Redirect URLs:
     - `http://localhost:4321/auth/callback` (dev)
     - `https://yourdomain.com/auth/callback` (prod)

5. **Security**:
   - Enable Captcha: Optional (dla MVP można pominąć)
   - Rate Limiting: Default settings

### 4.4 Flow autentykacji z Supabase

#### 4.4.1 Flow rejestracji

```
1. User wypełnia formularz /register
   ↓
2. Client validation (email format, password length, passwords match)
   ↓
3. Component wywołuje: supabaseClient.auth.signUp({ email, password })
   ↓
4. Supabase tworzy nowego użytkownika w auth.users
   ↓
5. MVP: Email confirmation WYŁĄCZONE (zgodnie z PRD US-001):
    - User automatycznie zalogowany
    - Session token zwrócony
    - Redirect do /generate
```

#### 4.4.2 Flow logowania

```
1. User wypełnia formularz /login
   ↓
2. Client validation (email format, password not empty)
   ↓
3. Component wywołuje: supabaseClient.auth.signInWithPassword({ email, password })
   ↓
4. Supabase weryfikuje credentials
   ↓
5a. Sukces:
    - Session token zwrócony i zapisany (localStorage przez Supabase SDK)
    - Opcjonalnie: zapisanie w httpOnly cookies przez middleware
    - Redirect do /generate lub returnUrl
   ↓
5b. Błąd:
    - Wyświetlenie komunikatu błędu inline
    - Focus na polu email
```

#### 4.4.3 Flow wylogowania

```
1. User klika "Wyloguj się" w dropdown menu
   ↓
2. Component wywołuje: supabaseClient.auth.signOut()
   ↓
3. Supabase usuwa session token z localStorage
   ↓
4. Opcjonalnie: wywołanie /api/auth/logout do usunięcia cookies
   ↓
5. Redirect do /login
```

#### 4.4.4 Flow odświeżania tokenu

```
1. User wykonuje chronioną akcję (np. zapisuje fiszkę)
   ↓
2. Middleware sprawdza access_token w cookie lub localStorage
   ↓
3a. Token ważny:
    - Request przechodzi normalnie
   ↓
3b. Token wygasły:
    - Middleware wywołuje: supabaseClient.auth.refreshSession({ refresh_token })
    - Nowy access_token zwrócony
    - Aktualizacja cookies
    - Retry original request
   ↓
3c. Refresh token również wygasły:
    - User wylogowany
    - Redirect do /login?return=[current_url]
```

### 4.5 Server-side rendering z auth

**Przykład chronionej strony** (`src/pages/flashcards.astro`):

```astro
---
import Layout from "../layouts/Layout.astro";
import { FlashcardList } from "../components/flashcards/FlashcardList";

// Sprawdzenie autentykacji (middleware już to zrobi, ale dla pewności)
const user = Astro.locals.user;

if (!user) {
  return Astro.redirect("/login?return=/flashcards");
}

// Pobranie danych użytkownika server-side
const { data: flashcards, error } = await Astro.locals.supabase
  .from("flashcards")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
---

<Layout title="Moje fiszki">
  <main class="min-h-screen bg-background py-8">
    <div class="container">
      <h1 class="text-3xl font-bold mb-8">Moje fiszki</h1>
      {
        error ? (
          <div class="text-destructive">Wystąpił błąd podczas ładowania fiszek</div>
        ) : (
          <FlashcardList client:load initialFlashcards={flashcards} user={user} />
        )
      }
    </div>
  </main>
</Layout>
```

### 4.6 Cookie management (opcjonalnie)

Jeśli zdecydujemy się na cookie-based auth zamiast localStorage:

**Middleware rozszerzenie** (`src/middleware/index.ts`):

```typescript
// Po udanym logowaniu/rejestracji - ustawienie cookies
context.cookies.set("sb-access-token", session.access_token, {
  path: "/",
  httpOnly: true,
  secure: import.meta.env.PROD, // tylko HTTPS w produkcji
  sameSite: "lax",
  maxAge: 60 * 60, // 1 hour
});

context.cookies.set("sb-refresh-token", session.refresh_token, {
  path: "/",
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```

### 4.7 Bezpieczeństwo

**Najlepsze praktyki**:

1. **Tokens storage**:
   - Access token: httpOnly cookies (zalecane) lub localStorage
   - Refresh token: httpOnly cookies (zalecane) lub localStorage
   - Nigdy w sessionStorage (brak persistence)

2. **HTTPS**:
   - W produkcji wymuszenie HTTPS
   - Cookies z flagą `secure: true`

3. **CORS**:
   - Konfiguracja Supabase CORS do whitelist tylko zaufanych domen

4. **Rate limiting**:
   - Supabase ma wbudowane rate limiting dla auth endpoints
   - Dodatkowe rate limiting na poziomie aplikacji dla custom endpoints

5. **Validation**:
   - Zawsze walidacja po stronie serwera (nie tylko client-side)
   - Użycie Zod schemas dla typesafety

6. **Error handling**:
   - Nie ujawnianie szczegółów błędów użytkownikowi (np. "user not found")
   - Generic messages: "Nieprawidłowy email lub hasło"
   - Detale logowane tylko server-side

7. **XSS Protection**:
   - React automatycznie escapuje dane
   - Unikanie dangerouslySetInnerHTML bez sanityzacji

8. **CSRF Protection**:
   - SameSite cookies: "lax" lub "strict"
   - Supabase SDK obsługuje CSRF protection

## 5. Testy integracyjne (rekomendacje)

**Scenariusze do przetestowania**:

1. **Rejestracja**:
   - Udana rejestracja → auto-login → redirect do /generate
   - Rejestracja z istniejącym emailem → error message
   - Rejestracja ze słabym hasłem → error message
   - Rejestracja z niezgodnymi hasłami → error message

2. **Logowanie**:
   - Udane logowanie → redirect do /generate
   - Logowanie z błędnym hasłem → error message
   - Logowanie z nieistniejącym emailem → error message
   - Logowanie po wylogowaniu → sukces

3. **Ochrona tras**:
   - Niezalogowany user próbuje wejść na /flashcards → redirect do /login
   - Zalogowany user próbuje wejść na /login → redirect do /generate
   - Niezalogowany user na /generate → widzi tryb demo
   - Zalogowany user na /generate → widzi pełny widok

4. **Wylogowanie**:
   - Kliknięcie "Wyloguj się" → redirect do /login
   - Po wylogowaniu próba wejścia na /flashcards → redirect do /login

5. **Usuwanie konta**:
   - Usunięcie konta → wszystkie fiszki usunięte → auto-logout → redirect
   - Próba logowania na usunięte konto → error

6. **Odświeżanie tokenu**:
   - Token wygasł → automatyczne odświeżenie → request succeeds
   - Refresh token wygasł → wylogowanie → redirect do /login

## 6. Migracje bazy danych

**Aktualizacja schemy Supabase** (jeśli potrzebne):

Obecnie struktura `flashcards` i `generations` już zawiera `user_id`. Należy upewnić się, że:

1. **RLS (Row Level Security) Policies**:

```sql
-- Polityka dla flashcards: użytkownik widzi tylko swoje fiszki
CREATE POLICY "Users can view their own flashcards"
  ON flashcards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards"
  ON flashcards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON flashcards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
  ON flashcards
  FOR DELETE
  USING (auth.uid() = user_id);

-- Analogiczne polityki dla generations
CREATE POLICY "Users can view their own generations"
  ON generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
  ON generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

2. **Włączenie RLS**:

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

3. **Foreign Key do auth.users**:

```sql
ALTER TABLE flashcards
ADD CONSTRAINT flashcards_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE generations
ADD CONSTRAINT generations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
```

## 7. Checklist implementacji

### Frontend (MVP)

- [ ] Utworzenie strony `/login` (Astro)
- [ ] Utworzenie komponentu `LoginForm` (React)
- [ ] Utworzenie strony `/register` (Astro)
- [ ] Utworzenie komponentu `RegisterForm` (React)
- [ ] Utworzenie komponentu `PasswordInput` (React)
- [ ] Rozszerzenie `Header` o nawigację i user dropdown
- [ ] Utworzenie komponentu `UserDropdown` (React) - bez linku do /settings
- [ ] Utworzenie komponentu `DeleteAccountModal` (React)
- [ ] Utworzenie komponentu `NavLink` (React)
- [ ] Modyfikacja `GenerationView` o tryb demo

### Frontend (Opcjonalne - poza MVP)

- [ ] Utworzenie strony `/forgot-password` (Astro)
- [ ] Utworzenie komponentu `ForgotPasswordForm` (React)
- [ ] Utworzenie strony `/reset-password` (Astro)
- [ ] Utworzenie komponentu `ResetPasswordForm` (React)
- [ ] Utworzenie strony `/settings` z opcją zmiany hasła

### Backend (MVP)

- [ ] Rozszerzenie middleware o autentykację i autoryzację (PUBLIC_ROUTES: /login, /register)
- [ ] Utworzenie `/api/auth/logout` endpoint
- [ ] Utworzenie `/api/auth/account` (DELETE) endpoint
- [ ] Aktualizacja `src/env.d.ts` (dodanie `user` do `App.Locals`)
- [ ] Utworzenie helper functions w `src/lib/auth/auth-helpers.ts` (bez forgot/reset password)
- [ ] Utworzenie `useAuth` hook w `src/lib/auth/useAuth.ts`
- [ ] Utworzenie validation schemas w `src/lib/validation/auth-validation.ts` (login, register)
- [ ] Rozszerzenie error handler o obsługę błędów auth
- [ ] Aktualizacja `supabase.client.ts` (dodanie `supabaseAdmin`)

### Backend (Opcjonalne - poza MVP)

- [ ] Rozszerzenie helper functions o forgot/reset password
- [ ] Rozszerzenie validation schemas o forgot/reset password

### Database (MVP)

- [ ] Utworzenie RLS policies dla `flashcards`
- [ ] Utworzenie RLS policies dla `generations`
- [ ] Utworzenie RLS policies dla `generation_error_logs`
- [ ] Włączenie RLS na tabelach
- [ ] Dodanie foreign keys z `user_id` do `auth.users` z CASCADE DELETE
- [ ] Konfiguracja Supabase Auth Settings (email provider, **email confirmation WYŁĄCZONE**, password min 8 chars)
- [ ] Konfiguracja Site URL w Supabase Dashboard (bez redirect URLs dla email confirmation)

### Environment

- [ ] Dodanie `SUPABASE_SERVICE_ROLE_KEY` do `.env`
- [ ] Aktualizacja `ImportMetaEnv` w `src/env.d.ts`
- [ ] Dodanie `.env.example` z nowymi zmiennymi
- [ ] Weryfikacja konfiguracji CORS w Supabase

### Testing

- [ ] Testy rejestracji (sukces, błędy walidacji, duplikat email)
- [ ] Testy logowania (sukces, błędne credentials)
- [ ] Testy wylogowania
- [ ] Testy usuwania konta (cascade delete fiszek)
- [ ] Testy ochrony tras (middleware redirects)
- [ ] Testy trybu demo generowania fiszek
- [ ] Testy odświeżania tokenu

## 8. Podsumowanie

Specyfikacja opisuje kompletny system autentykacji zintegrowany z istniejącą architekturą aplikacji Fiszki. Kluczowe punkty:

1. **Frontend**: Nowe strony `/login` i `/register` z komponentami React do obsługi formularzy. Rozszerzenie `Header` o nawigację i user menu. Tryb demo dla niezalogowanych użytkowników w widoku generowania.

2. **Backend**: Middleware sprawdzający autentykację i przekierowujący do odpowiednich stron. Endpointy API do wylogowania i usuwania konta. Helper functions i validation schemas dla typesafety.

3. **Supabase Auth**: Wykorzystanie Supabase jako dostawcy autentykacji. Client SDK do logowania/rejestracji po stronie klienta. Admin SDK do operacji administracyjnych (usuwanie użytkownika).

4. **Bezpieczeństwo**: RLS policies na poziomie bazy danych. HttpOnly cookies dla tokenów. Walidacja po stronie serwera. Generic error messages.

5. **UX**: Inline validation i error messages. Auto-login po rejestracji. Zachowanie `returnUrl` po przekierowaniu do logowania. Tryb demo bez konieczności rejestracji.

Implementacja tego systemu zapewni pełną funkcjonalność autentykacji zgodną z wymaganiami PRD, z zachowaniem bezpieczeństwa i dobrej praktyki UX.
