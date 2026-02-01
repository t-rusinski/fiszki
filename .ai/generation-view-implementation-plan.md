# Plan implementacji widoku generowania fiszek

## 1. Przegląd

Widok generowania fiszek jest dostępnym pod ścieżką `/generate`. Umożliwia użytkownikowi wklejenie tekstu źródłowego (1000-10000 znaków), wygenerowanie propozycji fiszek przy użyciu AI, a następnie przegląd, edycję i zatwierdzenie wybranych propozycji. Widok składa się z trzech głównych stanów: formularz wejściowy, stan ładowania oraz lista propozycji do recenzji.

## 2. Routing widoku

**Ścieżka:** `/generate` (główna strona aplikacji)

**Plik:** `src/pages/generate.astro`

**Wymagania:**

- Dostępny tylko dla zalogowanych użytkowników
- Przekierowanie do `/login` dla niezalogowanych
- Strona server-side rendered z wyspami React dla interaktywności

## 3. Struktura komponentów

```
generate.astro (Astro page)
└── Layout.astro
    └── GenerationView.tsx (React, client:load)
        ├── GenerationForm.tsx
        │   ├── HTML textarea
        │   ├── Character counter (inline)
        │   ├── Validation message (inline)
        │   └── Button (Shadcn/ui) - clear, generate
        ├── LoadingState.tsx (warunkowy)
        │   ├── Spinner
        │   └── LoadingText
        └── SuggestionsList.tsx (warunkowy)
            ├── Header (inline)
            ├── SuggestionCard.tsx[] (wiele)
            │   ├── HTML checkbox
            │   ├── Card (Shadcn/ui)
            │   ├── Front/Back display
            │   ├── Button (Shadcn/ui) - edit, reject
            │   └── Inline edit form (warunkowy)
            │       ├── HTML textarea (front) + counter (inline)
            │       ├── HTML textarea (back) + counter (inline)
            │       └── Button (Shadcn/ui) - save, cancel
            └── BulkActions.tsx
                ├── SelectionCounter
                ├── Button (Shadcn/ui) - save all
                └── Button (Shadcn/ui) - save selected
```

**Uwaga:** Liczniki znaków i komunikaty walidacyjne są zintegrowane inline w komponentach, nie jako osobne komponenty.

## 4. Szczegóły komponentów

### GenerationView.tsx (główny komponent React)

**Opis:** Główny kontener widoku zarządzający stanem całego procesu generowania. Wyświetla odpowiedni podkomponent w zależności od stanu (formularz, loading, propozycje).

**Główne elementy:**

- `<section>` element semantyczny z role="main"
- Warunkowe renderowanie: GenerationForm, LoadingState lub SuggestionsList
- Container z max-width i padding (responsywny)

**Obsługiwane interakcje:**

- Delegowanie wszystkich interakcji do komponentów dzieci
- Zarządzanie globalnym stanem widoku

**Obsługiwana walidacja:**

- Brak (delegowana do komponentów dzieci)

**Typy:**

- `GenerationViewState` (własny)
- `GenerateFlashcardsResponseDTO` (z API)

**Propsy:**

```typescript
interface GenerationViewProps {
  initialError?: string; // opcjonalny błąd z SSR
}
```

---

### GenerationForm.tsx

**Opis:** Formularz wprowadzania tekstu źródłowego z licznikiem znaków i przyciskami akcji. Zawiera logikę walidacji tekstu w czasie rzeczywistym. Licznik znaków i komunikaty walidacyjne są zintegrowane inline.

**Główne elementy:**

- `<form>` z onSubmit handler
- `<textarea>` (HTML textarea) dla source_text
- Licznik znaków (inline div z aria-live)
- Komunikat walidacyjny (inline div z aria-live)
- Dwa `<Button>` (Shadcn/ui) komponenty (Wyczyść, Generuj)

**Obsługiwane interakcje:**

- `onChange` na textarea - aktualizacja stanu i walidacja
- `onClick` na "Wyczyść" - reset formularza
- `onSubmit` / `onClick` na "Generuj fiszki" - wywołanie API
- `onKeyDown` - Ctrl+Enter dla generowania (accessibility)

**Obsługiwana walidacja:**

- Długość tekstu minimum 1000 znaków
- Długość tekstu maximum 10000 znaków
- Tekst nie może być pusty
- Real-time walidacja z debounce 300ms

**Typy:**

- `GenerateFlashcardsCommand` (request body)
- `CharacterValidation` (własny)

**Propsy:**

```typescript
interface GenerationFormProps {
  sourceText: string;
  isLoading: boolean;
  onTextChange: (text: string) => void;
  onClear: () => void;
  onGenerate: () => Promise<void>;
  error: string | null;
}
```

---

### LoadingState.tsx

**Opis:** Komponent wyświetlany podczas oczekiwania na odpowiedź z API generowania. Pokazuje spinner i komunikat o trwającym procesie.

**Główne elementy:**

- `<div>` wrapper z centrowanym contentem
- Spinner komponent (Shadcn/ui lub custom)
- `<p>` z tekstem "Generowanie fiszek w toku..."
- Opcjonalny `<Button>` "Anuluj" (future feature)

**Obsługiwane interakcje:**

- `onClick` na "Anuluj" (opcjonalnie) - anulowanie requestu

**Obsługiwana walidacja:**

- Brak

**Typy:**

- Brak specjalnych typów

**Propsy:**

```typescript
interface LoadingStateProps {
  onCancel?: () => void; // opcjonalne
}
```

---

### SuggestionsList.tsx

**Opis:** Kontener dla listy propozycji fiszek zwróconych przez API. Zarządza stanem wszystkich propozycji i bulk actions.

**Główne elementy:**

- `<section>` wrapper
- `<SuggestionsHeader>` z tytułem i instrukcjami
- Lista `<SuggestionCard>` komponentów
- `<BulkActions>` komponent na dole

**Obsługiwane interakcje:**

- Delegowanie akcji do poszczególnych kart
- Obsługa bulk actions (save all, save selected)

**Obsługiwana walidacja:**

- Sprawdzanie czy są zaznaczone jakiekolwiek fiszki przed zapisem

**Typy:**

- `SuggestionViewModel[]` (własny)
- `AcceptGeneratedFlashcardsCommand` (request)
- `AcceptGeneratedFlashcardsResponseDTO` (response)

**Propsy:**

```typescript
interface SuggestionsListProps {
  generationId: number;
  suggestions: SuggestionViewModel[];
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onSaveEdit: (id: string, front: string, back: string) => void;
  onCancelEdit: (id: string) => void;
  onReject: (id: string) => void;
  onSaveSelected: () => Promise<void>;
  onSaveAll: () => Promise<void>;
}
```

---

### SuggestionCard.tsx

**Opis:** Pojedyncza karta propozycji fiszki z możliwością zaznaczenia, edycji lub odrzucenia. Może przełączać się między trybem wyświetlania a trybem edycji inline. Formularz edycji jest zintegrowany w komponencie.

**Główne elementy:**

- `Card` (Shadcn/ui) wrapper
- HTML checkbox dla selekcji
- `<div>` content area z front/back text
- `Button` (Shadcn/ui) akcji (Edytuj, Odrzuć)
- Warunkowy inline edit form gdy isEditing=true:
  - HTML textarea dla front (max 200) + licznik znaków inline
  - HTML textarea dla back (max 500) + licznik znaków inline
  - Buttony (Zapisz, Anuluj)

**Obsługiwane interakcje:**

- `onChange` na checkbox - toggle selection
- `onClick` na "Edytuj" - przejście do trybu edycji
- `onClick` na "Odrzuć" - usunięcie z listy
- `onClick` na "Zapisz" w trybie edycji - walidacja i zapis
- `onClick` na "Anuluj" w trybie edycji - powrót do wyświetlania
- `onKeyDown` - Escape dla anulowania edycji

**Obsługiwana walidacja:**

- W trybie display: brak
- W trybie edit: walidacja inline (front max 200, back max 500, oba wymagane)

**Typy:**

- `SuggestionViewModel` (własny)

**Propsy:**

```typescript
interface SuggestionCardProps {
  suggestion: SuggestionViewModel;
  onToggleSelect: () => void;
  onEdit: () => void;
  onSaveEdit: (front: string, back: string) => void;
  onCancelEdit: () => void;
  onReject: () => void;
}
```

---

### BulkActions.tsx

**Opis:** Panel z akcjami masowymi na dole listy propozycji. Pozwala na zapisanie wszystkich lub tylko zaznaczonych fiszek.

**Główne elementy:**

- `<div>` sticky/fixed wrapper (przyklejony do dołu)
- `<span>` z licznikiem zaznaczonych: "X fiszek zaznaczonych"
- `<Button>` "Zapisz wszystkie" (secondary)
- `<Button>` "Zapisz zaznaczone" (primary)

**Obsługiwane interakcje:**

- `onClick` na "Zapisz wszystkie" - zapis wszystkich propozycji
- `onClick` na "Zapisz zaznaczone" - zapis tylko zaznaczonych

**Obsługiwana walidacja:**

- Disable "Zapisz zaznaczone" jeśli selectedCount = 0

**Typy:**

- Brak specjalnych typów

**Propsy:**

```typescript
interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSaveAll: () => Promise<void>;
  onSaveSelected: () => Promise<void>;
  isLoading: boolean;
}
```

---

## 5. Typy

### Typy z API (istniejące w src/types.ts):

```typescript
// Request dla generowania
export interface GenerateFlashcardsCommand {
  source_text: string;
}

// Response z API generowania
export interface GenerateFlashcardsResponseDTO {
  generation_id: number;
  model: string;
  generated_count: number;
  generation_duration: number;
  source_text_hash: string;
  flashcardSuggestions: FlashcardSuggestionDTO[];
}

// Pojedyncza propozycja fiszki
export interface FlashcardSuggestionDTO {
  front: string;
  back: string;
  source?: FlashcardSource;
}

// Input dla akceptacji pojedynczej fiszki
export interface AcceptFlashcardInput {
  front: string;
  back: string;
  edited: boolean;
}

// Request dla akceptacji propozycji
export interface AcceptGeneratedFlashcardsCommand {
  flashcards: AcceptFlashcardInput[];
}

// Response z API akceptacji
export interface AcceptGeneratedFlashcardsResponseDTO {
  message: string;
  accepted_count: number;
  accepted_unedited_count: number;
  accepted_edited_count: number;
  flashcards: FlashcardDTO[];
}
```

### Nowe typy ViewModels (do utworzenia w osobnym pliku lub inline):

```typescript
// Rozszerzona propozycja ze stanem UI
export interface SuggestionViewModel {
  id: string; // lokalny UUID dla React key
  front: string;
  back: string;
  isSelected: boolean;
  isEditing: boolean;
  wasEdited: boolean; // czy użytkownik edytował tę fiszkę
  originalFront: string; // oryginalna wartość (dla anulowania)
  originalBack: string;
}

// Stan formularza generowania
export interface GenerationFormState {
  sourceText: string;
  characterCount: number;
  isValid: boolean;
  validationMessage: string;
}

// Wynik walidacji liczby znaków
export interface CharacterValidation {
  count: number;
  isValid: boolean;
  color: "red" | "green";
  message: string;
}

// Stan całego widoku
export interface GenerationViewState {
  // Stan formularza
  sourceText: string;

  // Stan generowania
  isLoading: boolean;
  generationId: number | null;

  // Stan propozycji
  suggestions: SuggestionViewModel[];

  // Stan błędów
  errorMessage: string | null;

  // Stan sukcesu
  successMessage: string | null;
}

// Stan formularza edycji inline
export interface EditFormState {
  front: string;
  back: string;
  isValid: boolean;
}
```

### Funkcje walidacji (utility):

```typescript
export const validateCharacterCount = (text: string, min: number, max: number): CharacterValidation => {
  const count = text.length;
  const isValid = count >= min && count <= max;

  let message = "";
  let color: "red" | "green" = "red";

  if (count === 0) {
    message = "Wklej tekst źródłowy do wygenerowania fiszek";
  } else if (count < min) {
    message = `Tekst jest za krótki. Minimum ${min} znaków.`;
  } else if (count > max) {
    message = `Tekst jest za długi. Maksimum ${max} znaków.`;
  } else {
    message = "Długość tekstu OK. Możesz wygenerować fiszki.";
    color = "green";
  }

  return { count, isValid, color, message };
};

export const validateFlashcardEdit = (
  front: string,
  back: string
): { isValid: boolean; errors: { front?: string; back?: string } } => {
  const errors: { front?: string; back?: string } = {};

  if (front.trim().length === 0) {
    errors.front = "Przód fiszki nie może być pusty";
  } else if (front.length > 200) {
    errors.front = "Przód fiszki może mieć maksymalnie 200 znaków";
  }

  if (back.trim().length === 0) {
    errors.back = "Tył fiszki nie może być pusty";
  } else if (back.length > 500) {
    errors.back = "Tył fiszki może mieć maksymalnie 500 znaków";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

---

## 6. Zarządzanie stanem

### Główna strategia:

Wykorzystanie custom hooka `useGenerationView` do scentralizowania całej logiki biznesowej i zarządzania stanem. Hook ten będzie używany w głównym komponencie `GenerationView.tsx`.

### Custom Hook: useGenerationView

```typescript
export const useGenerationView = () => {
  // Stan formularza
  const [sourceText, setSourceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Stan generowania
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionViewModel[]>([]);

  // Stan komunikatów
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Walidacja tekstu źródłowego
  const characterValidation = useMemo(() => validateCharacterCount(sourceText, 1000, 10000), [sourceText]);

  // Obliczenie liczby zaznaczonych
  const selectedCount = useMemo(() => suggestions.filter((s) => s.isSelected).length, [suggestions]);

  // Handler zmiany tekstu
  const handleTextChange = useCallback((text: string) => {
    setSourceText(text);
    setErrorMessage(null);
  }, []);

  // Handler wyczyszczenia formularza
  const handleClear = useCallback(() => {
    setSourceText("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  // Handler generowania fiszek
  const handleGenerate = useCallback(async () => {
    if (!characterValidation.isValid) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: sourceText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Błąd generowania");
      }

      const data: GenerateFlashcardsResponseDTO = await response.json();

      // Mapowanie propozycji na ViewModels
      const viewModels: SuggestionViewModel[] = data.flashcardSuggestions.map((suggestion) => ({
        id: crypto.randomUUID(),
        front: suggestion.front,
        back: suggestion.back,
        isSelected: false,
        isEditing: false,
        wasEdited: false,
        originalFront: suggestion.front,
        originalBack: suggestion.back,
      }));

      setGenerationId(data.generation_id);
      setSuggestions(viewModels);

      // Auto-scroll do propozycji
      setTimeout(() => {
        document.getElementById("suggestions-list")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nie udało się wygenerować fiszek. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, characterValidation.isValid]);

  // Handler zaznaczania propozycji
  const handleToggleSelect = useCallback((id: string) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, isSelected: !s.isSelected } : s)));
  }, []);

  // Handler rozpoczęcia edycji
  const handleEdit = useCallback((id: string) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, isEditing: true } : s)));
  }, []);

  // Handler zapisu edycji
  const handleSaveEdit = useCallback((id: string, front: string, back: string) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              front,
              back,
              isEditing: false,
              wasEdited: true,
              isSelected: true, // auto-select po edycji
            }
          : s
      )
    );
  }, []);

  // Handler anulowania edycji
  const handleCancelEdit = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              front: s.originalFront,
              back: s.originalBack,
              isEditing: false,
            }
          : s
      )
    );
  }, []);

  // Handler odrzucenia propozycji
  const handleReject = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Handler zapisu zaznaczonych fiszek
  const handleSaveSelected = useCallback(async () => {
    if (generationId === null || selectedCount === 0) return;

    const selectedSuggestions = suggestions.filter((s) => s.isSelected);
    await saveSuggestions(generationId, selectedSuggestions);
  }, [generationId, suggestions, selectedCount]);

  // Handler zapisu wszystkich fiszek
  const handleSaveAll = useCallback(async () => {
    if (generationId === null) return;

    await saveSuggestions(generationId, suggestions);
  }, [generationId, suggestions]);

  // Wspólna funkcja zapisu
  const saveSuggestions = async (genId: number, suggestionsToSave: SuggestionViewModel[]) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const flashcards: AcceptFlashcardInput[] = suggestionsToSave.map((s) => ({
        front: s.front,
        back: s.back,
        edited: s.wasEdited,
      }));

      const response = await fetch(`/api/generations/${genId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcards }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Błąd zapisu");
      }

      const data: AcceptGeneratedFlashcardsResponseDTO = await response.json();

      // Sukces - reset widoku
      setSuccessMessage(`${data.accepted_count} fiszek zostało zapisanych pomyślnie`);
      setSuggestions([]);
      setGenerationId(null);
      setSourceText("");

      // Ukryj komunikat sukcesu po 5 sekundach
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nie udało się zapisać fiszek. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Stan formularza
    sourceText,
    characterValidation,
    isValid: characterValidation.isValid,

    // Stan ładowania
    isLoading,

    // Stan propozycji
    generationId,
    suggestions,
    selectedCount,

    // Komunikaty
    errorMessage,
    successMessage,

    // Akcje formularza
    handleTextChange,
    handleClear,
    handleGenerate,

    // Akcje propozycji
    handleToggleSelect,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleReject,

    // Bulk actions
    handleSaveSelected,
    handleSaveAll,
  };
};
```

### Dodatkowy hook pomocniczy: useDebounce (opcjonalny)

```typescript
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

---

## 7. Integracja API

### Endpoint 1: POST /api/generations/generate

**Cel:** Wygenerowanie propozycji fiszek z tekstu źródłowego.

**Request:**

```typescript
// Typ: GenerateFlashcardsCommand
{
  "source_text": string // 1000-10000 znaków
}
```

**Response (200 OK):**

```typescript
// Typ: GenerateFlashcardsResponseDTO
{
  "generation_id": number,
  "model": string,
  "generated_count": number,
  "generation_duration": number,
  "source_text_hash": string,
  "flashcardSuggestions": FlashcardSuggestionDTO[]
}
```

**Obsługa błędów:**

- `400 Bad Request`: Walidacja - tekst poza zakresem 1000-10000
- `401 Unauthorized`: Brak lub nieprawidłowy token
- `422 Unprocessable Entity`: Nieprawidłowy format JSON
- `429 Too Many Requests`: Przekroczony limit requestów
- `500 Internal Server Error`: Błąd API AI
- `503 Service Unavailable`: Usługa AI niedostępna

**Implementacja w hook:**

```typescript
const response = await fetch("/api/generations/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ source_text: sourceText }),
});

if (!response.ok) {
  // Obsługa błędów z odpowiednim komunikatem
  const errorData = await response.json();
  throw new Error(errorData.error?.message);
}

const data: GenerateFlashcardsResponseDTO = await response.json();
```

---

### Endpoint 2: POST /api/generations/:id/accept

**Cel:** Zaakceptowanie i zapisanie wybranych propozycji fiszek.

**Request:**

```typescript
// Typ: AcceptGeneratedFlashcardsCommand
{
  "flashcards": [
    {
      "front": string, // max 200 znaków
      "back": string,  // max 500 znaków
      "edited": boolean
    }
  ]
}
```

**Response (201 Created):**

```typescript
// Typ: AcceptGeneratedFlashcardsResponseDTO
{
  "message": string,
  "accepted_count": number,
  "accepted_unedited_count": number,
  "accepted_edited_count": number,
  "flashcards": FlashcardDTO[]
}
```

**Obsługa błędów:**

- `400 Bad Request`: Walidacja - front/back poza limitami
- `401 Unauthorized`: Brak lub nieprawidłowy token
- `404 Not Found`: Generation nie istnieje lub nie należy do użytkownika
- `422 Unprocessable Entity`: Nieprawidłowy format danych

**Implementacja w hook:**

```typescript
const flashcards: AcceptFlashcardInput[] = suggestionsToSave.map((s) => ({
  front: s.front,
  back: s.back,
  edited: s.wasEdited,
}));

const response = await fetch(`/api/generations/${generationId}/accept`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ flashcards }),
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error?.message);
}

const data: AcceptGeneratedFlashcardsResponseDTO = await response.json();
```

---

## 8. Interakcje użytkownika

### Interakcja 1: Wklejanie tekstu

**Akcja użytkownika:** Użytkownik wkleja lub wpisuje tekst w textarea.

**Reakcja systemu:**

1. Aktualizacja stanu `sourceText`
2. Przeliczenie liczby znaków (real-time)
3. Aktualizacja komunikatu walidacyjnego
4. Zmiana koloru licznika (czerwony/zielony)
5. Włączenie/wyłączenie przycisku "Generuj"

**Komponenty zaangażowane:** GenerationForm, CharacterCounter, ValidationMessage

---

### Interakcja 2: Kliknięcie "Generuj fiszki"

**Akcja użytkownika:** Użytkownik klika przycisk "Generuj fiszki" (lub Ctrl+Enter).

**Reakcja systemu:**

1. Sprawdzenie walidacji (1000-10000 znaków)
2. Wyświetlenie LoadingState (spinner + tekst)
3. Zablokowanie formularza
4. Wywołanie POST /api/generations/generate
5. Po sukcesie:
   - Zapisanie generationId
   - Mapowanie propozycji na ViewModels
   - Wyświetlenie SuggestionsList
   - Auto-scroll do listy propozycji
   - Focus na pierwszym checkboxie
6. Po błędzie:
   - Wyświetlenie komunikatu błędu inline
   - Zachowanie zawartości textarea
   - Opcjonalny przycisk "Spróbuj ponownie"

**Komponenty zaangażowane:** GenerationForm, LoadingState, SuggestionsList

---

### Interakcja 3: Wybranie propozycji (checkbox)

**Akcja użytkownika:** Użytkownik zaznacza/odznacza checkbox przy propozycji.

**Reakcja systemu:**

1. Toggle stanu `isSelected` dla danej propozycji
2. Aktualizacja licznika zaznaczonych
3. Highlight karty (wizualna zmiana tła/ramki)
4. Aktualizacja stanu przycisku "Zapisz zaznaczone"

**Komponenty zaangażowane:** SuggestionCard, BulkActions

---

### Interakcja 4: Edycja propozycji

**Akcja użytkownika:** Użytkownik klika "Edytuj" przy propozycji.

**Reakcja systemu:**

1. Zmiana `isEditing = true` dla danej propozycji
2. Wyświetlenie InlineEditForm z aktualnymi wartościami
3. Auto-focus na pierwszym polu textarea (front)
4. Wyświetlenie liczników znaków dla obu pól

**Komponenty zaangażowane:** SuggestionCard, InlineEditForm

---

### Interakcja 5: Zapisanie edycji

**Akcja użytkownika:** Użytkownik modyfikuje tekst i klika "Zapisz".

**Reakcja systemu:**

1. Walidacja front (max 200) i back (max 500)
2. Jeśli valid:
   - Aktualizacja wartości front/back
   - Ustawienie `wasEdited = true`
   - Ustawienie `isSelected = true` (auto-select)
   - Powrót do trybu wyświetlania
3. Jeśli invalid:
   - Wyświetlenie komunikatów błędów
   - Zablokowanie przycisku "Zapisz"

**Komponenty zaangażowane:** InlineEditForm, SuggestionCard

---

### Interakcja 6: Anulowanie edycji

**Akcja użytkownika:** Użytkownik klika "Anuluj" lub Escape.

**Reakcja systemu:**

1. Przywrócenie oryginalnych wartości (originalFront, originalBack)
2. Ustawienie `isEditing = false`
3. Powrót do trybu wyświetlania
4. Focus wraca na kartę propozycji

**Komponenty zaangażowane:** InlineEditForm, SuggestionCard

---

### Interakcja 7: Odrzucenie propozycji

**Akcja użytkownika:** Użytkownik klika "Odrzuć".

**Reakcja systemu:**

1. Opcjonalne potwierdzenie (dialog "Czy na pewno?")
2. Usunięcie propozycji z tablicy `suggestions`
3. Aktualizacja licznika zaznaczonych (jeśli była zaznaczona)
4. Jeśli lista stała się pusta - wyświetlenie pustego stanu

**Komponenty zaangażowane:** SuggestionCard, SuggestionsList

---

### Interakcja 8: Zapisanie zaznaczonych fiszek

**Akcja użytkownika:** Użytkownik klika "Zapisz zaznaczone".

**Reakcja systemu:**

1. Sprawdzenie czy są zaznaczone fiszki (selectedCount > 0)
2. Wyświetlenie loading state na przycisku
3. Mapowanie zaznaczonych propozycji na AcceptFlashcardInput[]
4. Wywołanie POST /api/generations/:id/accept
5. Po sukcesie:
   - Wyświetlenie komunikatu sukcesu: "X fiszek zostało zapisanych pomyślnie"
   - Wyczyszczenie listy propozycji
   - Reset formularza
   - Auto-hide komunikatu po 5 sekundach
6. Po błędzie:
   - Wyświetlenie komunikatu błędu
   - Zachowanie stanu propozycji

**Komponenty zaangażowane:** BulkActions, SuggestionsList, GenerationView

---

### Interakcja 9: Zapisanie wszystkich fiszek

**Akcja użytkownika:** Użytkownik klika "Zapisz wszystkie".

**Reakcja systemu:**

1. Mapowanie wszystkich propozycji (bez filtrowania) na AcceptFlashcardInput[]
2. Dalszy przepływ identyczny jak w "Zapisz zaznaczone"

**Komponenty zaangażowane:** BulkActions, SuggestionsList, GenerationView

---

### Interakcja 10: Wyczyszczenie formularza

**Akcja użytkownika:** Użytkownik klika "Wyczyść".

**Reakcja systemu:**

1. Reset sourceText do pustego stringa
2. Reset komunikatów błędów i sukcesu
3. Licznik pokazuje "0 / 10000"
4. Przycisk "Generuj" zostaje wyłączony

**Komponenty zaangażowane:** GenerationForm

---

## 9. Warunki i walidacja

### Walidacja 1: Długość tekstu źródłowego (GenerationForm)

**Warunki:**

- Minimum: 1000 znaków
- Maximum: 10000 znaków
- Wymagane: niepuste

**Wpływ na UI:**

- **< 1000 znaków:**
  - Licznik: czerwony kolor
  - Komunikat: "Tekst jest za krótki. Minimum 1000 znaków."
  - Przycisk "Generuj": disabled

- **1000-10000 znaków:**
  - Licznik: zielony kolor
  - Komunikat: "Długość tekstu OK. Możesz wygenerować fiszki."
  - Przycisk "Generuj": enabled

- **> 10000 znaków:**
  - Licznik: czerwony kolor
  - Komunikat: "Tekst jest za długi. Maksimum 10000 znaków."
  - Przycisk "Generuj": disabled

**Komponenty:** GenerationForm, CharacterCounter, ValidationMessage

**Implementacja:**

```typescript
const isValid = sourceText.length >= 1000 && sourceText.length <= 10000;
const buttonDisabled = !isValid || isLoading;
```

---

### Walidacja 2: Edycja front fiszki (InlineEditForm)

**Warunki:**

- Wymagane: niepuste (po trim)
- Maximum: 200 znaków

**Wpływ na UI:**

- **Puste po trim:**
  - Komunikat błędu: "Przód fiszki nie może być pusty"
  - Przycisk "Zapisz": disabled

- **> 200 znaków:**
  - Licznik: czerwony kolor
  - Komunikat błędu: "Przód fiszki może mieć maksymalnie 200 znaków"
  - Przycisk "Zapisz": disabled

- **1-200 znaków:**
  - Licznik: zielony kolor
  - Brak komunikatu błędu
  - Przycisk "Zapisz": enabled (jeśli back też valid)

**Komponenty:** InlineEditForm, CharacterCounter

---

### Walidacja 3: Edycja back fiszki (InlineEditForm)

**Warunki:**

- Wymagane: niepuste (po trim)
- Maximum: 500 znaków

**Wpływ na UI:**

- **Puste po trim:**
  - Komunikat błędu: "Tył fiszki nie może być pusty"
  - Przycisk "Zapisz": disabled

- **> 500 znaków:**
  - Licznik: czerwony kolor
  - Komunikat błędu: "Tył fiszki może mieć maksymalnie 500 znaków"
  - Przycisk "Zapisz": disabled

- **1-500 znaków:**
  - Licznik: zielony kolor
  - Brak komunikatu błędu
  - Przycisk "Zapisz": enabled (jeśli front też valid)

**Komponenty:** InlineEditForm, CharacterCounter

---

### Walidacja 4: Zaznaczone fiszki (BulkActions)

**Warunki:**

- Minimum: 1 zaznaczona fiszka dla "Zapisz zaznaczone"
- Brak warunku dla "Zapisz wszystkie"

**Wpływ na UI:**

- **selectedCount = 0:**
  - Przycisk "Zapisz zaznaczone": disabled
  - Licznik: "Nie zaznaczono żadnych fiszek"

- **selectedCount > 0:**
  - Przycisk "Zapisz zaznaczone": enabled
  - Licznik: "X fiszek zaznaczonych"

**Komponenty:** BulkActions

**Implementacja:**

```typescript
const saveSelectedDisabled = selectedCount === 0 || isLoading;
```

---

### Walidacja 5: Dostępność generationId (BulkActions)

**Warunki:**

- generationId nie może być null przed zapisem

**Wpływ na UI:**

- Jeśli generationId = null: oba przyciski save disabled (nie powinno wystąpić w normalnym flow)

**Komponenty:** BulkActions, GenerationView

---

## 10. Obsługa błędów

### Błąd 1: Tekst za krótki (client-side)

**Scenariusz:** Użytkownik próbuje wygenerować fiszki z tekstem < 1000 znaków.

**Obsługa:**

- Walidacja blokuje wywołanie API (przycisk disabled)
- Wyświetlenie komunikatu: "Tekst jest za krótki. Minimum 1000 znaków."
- Licznik czerwony

**Komponent:** GenerationForm, ValidationMessage

---

### Błąd 2: Tekst za długi (client-side)

**Scenariusz:** Użytkownik wkleja tekst > 10000 znaków.

**Obsługa:**

- Walidacja blokuje wywołanie API (przycisk disabled)
- Wyświetlenie komunikatu: "Tekst jest za długi. Maksimum 10000 znaków."
- Licznik czerwony

**Komponent:** GenerationForm, ValidationMessage

---

### Błąd 3: API generowania zwraca 400 (Bad Request)

**Scenariusz:** API odrzuca request z powodu walidacji.

**Obsługa:**

- Parsowanie errorData.error.message z response
- Wyświetlenie komunikatu błędu inline pod formularzem
- Zachowanie zawartości textarea
- Opcja "Spróbuj ponownie"

**Komunikat przykładowy:** "Nieprawidłowa długość tekstu. Sprawdź wymagania."

**Komponent:** GenerationForm (errorMessage)

---

### Błąd 4: API generowania zwraca 429 (Rate Limit)

**Scenariusz:** Użytkownik przekroczył limit requestów.

**Obsługa:**

- Parsowanie errorData.error.details.reset_time (jeśli dostępny)
- Wyświetlenie komunikatu: "Limit osiągnięty. Spróbuj ponownie za X minut."
- Opcjonalny countdown timer
- Przycisk "Generuj" disabled do czasu reset

**Komponent:** GenerationForm (errorMessage)

---

### Błąd 5: API generowania zwraca 500 (Internal Server Error)

**Scenariusz:** Błąd na serwerze lub błąd API AI.

**Obsługa:**

- Wyświetlenie komunikatu: "Nie udało się wygenerować fiszek. Spróbuj ponownie."
- Zachowanie zawartości textarea
- Przycisk "Spróbuj ponownie" (retry)

**Komponent:** GenerationForm (errorMessage)

---

### Błąd 6: API generowania zwraca 503 (Service Unavailable)

**Scenariusz:** Usługa AI jest niedostępna.

**Obsługa:**

- Wyświetlenie komunikatu: "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie później."
- Zachowanie zawartości textarea
- Sugestia czekania kilku minut

**Komponent:** GenerationForm (errorMessage)

---

### Błąd 7: Błąd sieci podczas generowania

**Scenariusz:** Brak połączenia internetowego lub timeout.

**Obsługa:**

- Wychwycenie błędu fetch (network error)
- Wyświetlenie komunikatu: "Błąd połączenia. Sprawdź połączenie internetowe."
- Przycisk "Spróbuj ponownie"

**Komponent:** GenerationForm (errorMessage)

---

### Błąd 8: API akceptacji zwraca 404 (Not Found)

**Scenariusz:** Generation nie istnieje lub nie należy do użytkownika.

**Obsługa:**

- Wyświetlenie komunikatu: "Nie znaleziono generowania. Spróbuj wygenerować fiszki ponownie."
- Reset widoku do początkowego stanu
- Wyczyszczenie propozycji

**Komponent:** GenerationView (errorMessage)

---

### Błąd 9: API akceptacji zwraca 400 (Validation Error)

**Scenariusz:** Front/back przekracza limity znaków.

**Obsługa:**

- Wyświetlenie komunikatu: "Błąd walidacji. Sprawdź długość fiszek."
- Zachowanie propozycji (możliwość korekty)
- Highlight problematycznych kart (jeśli szczegóły dostępne)

**Komponent:** SuggestionsList (errorMessage)

---

### Błąd 10: Błąd sieci podczas zapisu

**Scenariusz:** Brak połączenia podczas POST /api/generations/:id/accept.

**Obsługa:**

- Wyświetlenie komunikatu: "Nie udało się zapisać fiszek. Sprawdź połączenie i spróbuj ponownie."
- Zachowanie propozycji (brak utraty danych)
- Przycisk "Spróbuj ponownie"

**Komponent:** BulkActions, SuggestionsList (errorMessage)

---

### Błąd 11: Edycja - pusty front lub back

**Scenariusz:** Użytkownik próbuje zapisać fiszkę z pustym polem.

**Obsługa:**

- Walidacja lokalna przed wywołaniem onSave
- Wyświetlenie komunikatu pod polem: "To pole nie może być puste"
- Przycisk "Zapisz" disabled
- Highlight pola z błędem (czerwona ramka)

**Komponent:** InlineEditForm

---

### Błąd 12: Edycja - przekroczenie limitu znaków

**Scenariusz:** Użytkownik wpisuje > 200 znaków w front lub > 500 w back.

**Obsługa:**

- Real-time walidacja podczas pisania
- Licznik zmienia kolor na czerwony
- Komunikat: "Przekroczono limit znaków"
- Przycisk "Zapisz" disabled

**Komponent:** InlineEditForm, CharacterCounter

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Akcje:**

1. Utworzyć folder `src/components/generation/`
2. Zaktualizować `src/pages/generate.astro`

**Pliki do utworzenia:**

```
src/
├── components/
│   └── generation/
│       ├── GenerationView.tsx (główny komponent ze stanem)
│       ├── GenerationForm.tsx (z walidacją inline)
│       ├── LoadingState.tsx
│       ├── SuggestionsList.tsx
│       ├── SuggestionCard.tsx (z inline edit form)
│       └── BulkActions.tsx
└── pages/
    └── generate.astro
```

**Uwaga:** Liczniki znaków, komunikaty walidacyjne i formularz edycji są zintegrowane inline w komponentach, nie jako osobne pliki.

---

### Krok 2: Implementacja GenerationView (główny komponent)

**Akcje:**

1. Utworzyć główny komponent React z zarządzaniem stanem
2. Zdefiniować typy stanu inline lub w src/types.ts:
   - `ViewState` - enum dla stanów widoku
   - Rozszerzyć istniejące typy z `src/types.ts` przy użyciu lokalnego stanu
3. Zaimplementować handlery:
   - `handleGenerate()` - generowanie fiszek
   - `handleAccept()` - akceptacja fiszek
4. Dodać wywołania API z obsługą błędów
5. Zaimplementować warunkowe renderowanie (form/loading/suggestions)
6. Dodać komunikaty sukcesu i błędów

**Kluczowe elementy:**

- Stan zarządzany bezpośrednio w komponencie (bez custom hooka)
- Walidacja inline w komponentach dzieci
- Auto-scroll do propozycji po wygenerowaniu

---

### Krok 3: Implementacja GenerationForm

**Akcje:**

1. Utworzyć komponent z HTML textarea
2. Dodać licznik znaków inline z kolorowaniem (czerwony/zielony)
3. Dodać komunikat walidacyjny inline z aria-live
4. Dodać przyciski "Wyczyść" i "Generuj fiszki" (Shadcn/ui Button)
5. Zaimplementować lokalną walidację (1000-10000 znaków)
6. Dodać obsługę Ctrl+Enter dla generowania
7. Dodać aria attributes dla accessibility
8. Stylować z Tailwind (mobile-first)

**Kluczowe elementy:**

- Walidacja inline w komponencie
- Licznik znaków jako div z dynamicznym kolorem
- Disabled state podczas loading
- Visible focus indicators
- Keyboard shortcuts

---

### Krok 4: Implementacja LoadingState

**Akcje:**

1. Utworzyć prosty komponent z spinnerem
2. Dodać tekst "Generowanie fiszek w toku..."
3. Opcjonalnie: przycisk anulowania
4. Dodać aria-live dla accessibility

**Kluczowe elementy:**

- Centrowanie zawartości
- Animacja spinnera (Lucide React)
- Opcjonalny estimated time parameter

---

### Krok 5: Implementacja SuggestionCard

**Akcje:**

1. Utworzyć komponent karty z Card (Shadcn/ui)
2. Dodać HTML checkbox z obsługą isSelected
3. Wyświetlić front (bold) i back (regular)
4. Dodać przyciski "Edytuj" i "Odrzuć" (Shadcn/ui Button)
5. Zaimplementować inline edit form jako warunkowy render:
   - Dwa HTML textarea (front max 200, back max 500)
   - Liczniki znaków inline dla każdego pola
   - Walidacja inline z komunikatami błędów
   - Buttony "Zapisz" i "Anuluj"
6. Dodać obsługę Escape key dla anulowania edycji
7. Auto-focus na pierwszym polu przy edycji
8. Dodać visual highlight gdy isSelected
9. Stylować z Tailwind

**Kluczowe elementy:**

- Toggle między display mode a edit mode
- Inline edit form zintegrowany w komponencie
- Walidacja real-time w trybie edycji
- Visual feedback dla selection
- Accessibility (aria-labels)

---

### Krok 6: Implementacja BulkActions

**Akcje:**

1. Utworzyć komponent jako osobny plik
2. Dodać licznik zaznaczonych fiszek
3. Dodać przycisk "Zapisz wszystkie" (variant="outline")
4. Dodać przycisk "Zapisz zaznaczone" (variant="default")
5. Zaimplementować disabled state dla "Zapisz zaznaczone" gdy selectedCount=0
6. Dodać sticky positioning na dole
7. Stylować z Tailwind (mobile-responsive)

**Kluczowe elementy:**

- Sticky bottom bar z shadow
- Selection counter z aria-live
- Loading state w przyciskach
- Mobile-friendly layout

---

### Krok 7: Implementacja SuggestionsList

**Akcje:**

1. Utworzyć komponent kontenera (`<section>`)
2. Dodać header z tytułem i instrukcjami (inline)
3. Zaimplementować zarządzanie stanem propozycji (useState)
4. Zrenderować listę SuggestionCard w grid
5. Zintegrować BulkActions na dole
6. Zaimplementować handlery dla check/edit/reject
7. Obsłużyć pusty stan (brak propozycji)

**Kluczowe elementy:**

- Responsywny grid (md:grid-cols-2)
- Rozszerzenie propozycji o lokalne stany (isChecked, isEdited)
- Empty state handling

---

### Krok 8: Integracja z Astro page (generate.astro)

**Akcje:**

1. Zaimportować Layout.astro
2. Zaimportować GenerationView z directive `client:load`
3. Opcjonalnie: dodać protection check (redirect jeśli niezalogowany)
4. Dodać meta tags (title, description)

**Przykład:**

```astro
---
import Layout from "../layouts/Layout.astro";
import { GenerationView } from "../components/generation/GenerationView";
---

<Layout title="Generuj fiszki - 10x-cards">
  <main class="min-h-screen bg-background">
    <GenerationView client:load />
  </main>
</Layout>
```

---

### Krok 9: Stylowanie z Tailwind CSS

**Akcje:**

1. Zaimplementować mobile-first responsive classes
2. Dodać dark mode variants (jeśli wymagane)
3. Użyć Tailwind utilities dla:
   - Spacing (p-4, m-2, gap-4)
   - Typography (text-lg, font-bold)
   - Colors (text-red-600, bg-green-50)
   - Borders (border, rounded-lg)
   - Shadows (shadow-md dla cards)
4. Zdefiniować custom colors w tailwind.config jeśli potrzebne
5. Użyć focus-visible dla accessibility

**Przykładowe klasy:**

- Container: `max-w-4xl mx-auto px-4 py-8`
- Button primary: `bg-blue-600 hover:bg-blue-700 text-white`
- Card: `border rounded-lg p-4 shadow-sm`
- Character counter (valid): `text-green-600`
- Character counter (invalid): `text-red-600`

---

### Krok 10: Implementacja accessibility features

**Akcje:**

1. Dodać aria-label/aria-labelledby dla kluczowych elementów
2. Zaimplementować aria-live regions dla:
   - Character counter
   - Validation messages
   - Error/success messages
3. Dodać aria-describedby dla textarea (związanie z validation)
4. Zaimplementować focus management:
   - Auto-focus po generowaniu (pierwszy checkbox)
   - Focus trap w inline edit form
   - Focus return po zamknięciu edycji
5. Dodać keyboard shortcuts:
   - Ctrl+Enter dla generowania
   - Space dla toggle checkbox
   - Escape dla cancel edit
6. Zapewnić visible focus indicators
7. Użyć semantic HTML (`<section>`, `<article>`, `<form>`)
8. Sprawdzić color contrast (min 4.5:1)

---

### Krok 11: Testowanie i debugging

**Akcje:**

1. Test flow generowania:
   - Wklejenie tekstu o różnych długościach
   - Sprawdzenie walidacji (< 1000, 1000-10000, > 10000)
   - Test generowania z valid text
   - Sprawdzenie loading state

2. Test flow propozycji:
   - Zaznaczanie/odznaczanie checkboxów
   - Edycja propozycji (save, cancel)
   - Odrzucanie propozycji
   - Test "Zapisz zaznaczone" i "Zapisz wszystkie"

3. Test error handling:
   - Symulacja błędów API (400, 429, 500, 503)
   - Test błędów sieci (offline)
   - Sprawdzenie komunikatów błędów

4. Test accessibility:
   - Keyboard navigation (Tab, Enter, Space, Escape)
   - Screen reader testing (NVDA/JAWS)
   - Focus management
   - Color contrast

5. Test responsywności:
   - Mobile (320px+)
   - Tablet (768px+)
   - Desktop (1024px+)

6. Performance testing:
   - Sprawdzenie re-renders (React DevTools)
   - Test z dużą liczbą propozycji (50+)

---

### Krok 12: Optymalizacje i refaktoryzacja

**Akcje:**

1. Dodać React.memo dla komponentów:
   - BulkActions (jeśli problemy z performance)
   - LoadingState (jeśli problemy z performance)
   - SuggestionCard (jeśli problemy z performance)

2. Zoptymalizować callbacks z useCallback

3. Dodać debounce dla inline character counters (jeśli lagują)

4. Rozważyć code splitting:
   - Lazy load SuggestionsList (jeśli duży bundle)

5. Dodać error boundary dla całego widoku

6. Zaimplementować analytics tracking (opcjonalnie):
   - Tracking generowania
   - Tracking acceptance rate
   - Tracking edit rate

7. Dodać unit tests dla:
   - Kluczowe funkcje w GenerationView
   - Walidacja inline w komponentach

---

### Krok 13: Dokumentacja

**Akcje:**

1. Dodać JSDoc comments do wszystkich komponentów
2. Udokumentować propsy (interfejsy)
3. Dodać przykłady użycia w komentarzach
4. Utworzyć README.md w folderze generation/ z:
   - Opisem architektury
   - Flow diagramem
   - Listą komponentów
   - Instrukcją rozszerzania

5. Dodać TODO comments dla future features:
   - Cancel button w LoadingState
   - Retry logic z exponential backoff
   - Optimistic UI dla accept
   - Undo functionality

---

## Podsumowanie implementacji

Plan implementacji obejmuje 13 kroków od przygotowania struktury plików po dokumentację. Kluczowe punkty:

1. **Struktura komponentów:** 6 głównych komponentów React (GenerationView, GenerationForm, LoadingState, SuggestionsList, SuggestionCard, BulkActions)
2. **Typy:** Używamy typów z `src/types.ts` z rozszerzeniami inline dla lokalnego stanu UI
3. **Zarządzanie stanem:** Stan zarządzany bezpośrednio w GenerationView (bez custom hooka)
4. **Walidacja:** Inline w komponentach, client-side przed API calls, real-time feedback
5. **Accessibility:** WCAG 2.1 Level AA, keyboard navigation, ARIA attributes
6. **Error handling:** Szczegółowe komunikaty dla wszystkich scenariuszy błędów
7. **UX:** Auto-scroll, smooth transitions, responsive design

**Podejście architektoniczne:**

- Liczniki znaków i komunikaty walidacyjne zintegrowane inline w komponentach
- Formularz edycji zintegrowany w SuggestionCard (nie osobny komponent)
- BulkActions jako jedyny osobny komponent pomocniczy
- Pragmatyczne podejście: mniej plików, łatwiejsza nawigacja, zachowana funkcjonalność

Widok generowania fiszek jest sercem aplikacji i wymaga szczególnej uwagi na UX, accessibility i error handling. Implementacja powinna być wykonywana iteracyjnie, z testowaniem po każdym kroku.
