import { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 1000;
const MAX_LENGTH = 10000;

// Darmowe modele (Free tier)
const FREE_MODELS = [
  { value: "arcee-ai/trinity-large-preview:free", label: "Arcee Trinity Large ✅ DOMYŚLNY" },
] as const;

// Płatne modele (Paid tier)
const PAID_MODELS = [
  { value: "openai/gpt-4", label: "GPT-4 (Paid)" },
  { value: "openai/gpt-3.5-turbo", label: "GPT-3.5 Turbo (Paid)" },
  { value: "anthropic/claude-3-opus", label: "Claude 3 Opus (Paid)" },
  { value: "anthropic/claude-3-sonnet", label: "Claude 3 Sonnet (Paid)" },
  { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku (Paid)" },
  { value: "google/gemini-pro", label: "Gemini Pro (Paid)" },
] as const;

interface GenerationFormProps {
  onGenerate: (sourceText: string, model: string) => void;
  isGenerating: boolean;
}

export function GenerationForm({ onGenerate, isGenerating }: GenerationFormProps) {
  const [sourceText, setSourceText] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(FREE_MODELS[0].value);
  const [error, setError] = useState<string | null>(null);

  const currentLength = sourceText.length;
  const isValid = currentLength >= MIN_LENGTH && currentLength <= MAX_LENGTH;
  const isDisabled = !isValid || isGenerating;

  const getValidationMessage = useCallback(() => {
    if (currentLength === 0) return null;
    if (currentLength < MIN_LENGTH) {
      return `Tekst jest za krótki. Potrzebujesz jeszcze ${MIN_LENGTH - currentLength} znaków.`;
    }
    if (currentLength > MAX_LENGTH) {
      return `Tekst jest za długi. Przekroczono limit o ${currentLength - MAX_LENGTH} znaków.`;
    }
    return "Długość tekstu OK. Możesz wygenerować fiszki.";
  }, [currentLength]);

  const getCounterColor = useCallback(() => {
    if (currentLength === 0) return "text-muted-foreground";
    if (currentLength < MIN_LENGTH || currentLength > MAX_LENGTH) return "text-destructive";
    return "text-green-600 dark:text-green-500";
  }, [currentLength]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!isValid) {
        setError("Tekst musi mieć od 1000 do 10000 znaków.");
        return;
      }

      onGenerate(sourceText, selectedModel);
    },
    [isValid, sourceText, selectedModel, onGenerate]
  );

  const handleClear = useCallback(() => {
    setSourceText("");
    setError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && isValid && !isGenerating) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [isValid, isGenerating, handleSubmit]
  );

  const validationMessage = getValidationMessage();

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Model Selection */}
      <div className="space-y-2">
        <label htmlFor="model-select" className="block text-sm font-medium">
          Model AI
        </label>
        <select
          id="model-select"
          data-testid="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isGenerating}
          className={cn(
            "w-full p-2 border rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-background"
          )}
        >
          <optgroup label="🆓 Darmowe modele">
            {FREE_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="💰 Płatne modele">
            {PAID_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="text-xs text-muted-foreground">
          💡 Rekomendacja: <strong>Arcee Trinity Large</strong> - domyślny model. Unikaj modeli oznaczonych ⚠️.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="source-text" className="block text-sm font-medium">
          Tekst źródłowy do generowania fiszek
        </label>
        <textarea
          id="source-text"
          data-testid="source-text-input"
          aria-label="Tekst źródłowy do generowania fiszek"
          aria-describedby="char-counter validation-message"
          aria-invalid={error ? "true" : "false"}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          placeholder="Wklej tekst źródłowy (1000-10000 znaków)"
          className={cn(
            "w-full min-h-[200px] p-4 border rounded-md resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-destructive focus:ring-destructive"
          )}
        />

        {/* Character Counter */}
        <div
          id="char-counter"
          data-testid="char-counter"
          className={cn("text-sm font-medium", getCounterColor())}
          aria-live="polite"
          aria-atomic="true"
        >
          {currentLength} / {MAX_LENGTH}
        </div>

        {/* Validation Message */}
        {validationMessage && (
          <div
            id="validation-message"
            data-testid="validation-message"
            className={cn("text-sm", isValid ? "text-green-600 dark:text-green-500" : "text-destructive")}
            aria-live="polite"
          >
            {validationMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div data-testid="form-error" className="text-sm text-destructive" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isDisabled} className="flex-1" data-testid="generate-button">
          {isGenerating ? "Generowanie..." : "Generuj fiszki"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={isGenerating}
          data-testid="clear-button"
        >
          Wyczyść
        </Button>
      </div>

      {/* Keyboard Hint */}
      <p className="text-xs text-muted-foreground">Wskazówka: Użyj Ctrl+Enter aby szybko wygenerować fiszki</p>
    </form>
  );
}
