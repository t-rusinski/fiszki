import { useState, useCallback, useRef, useEffect } from "react";
import { GenerationForm } from "./GenerationForm";
import { LoadingState } from "./LoadingState";
import { SuggestionsList } from "./SuggestionsList";
import type { GenerateFlashcardsResponseDTO, FlashcardSuggestionDTO, AcceptFlashcardInput, ErrorDTO } from "@/types";

type ViewState = "idle" | "generating" | "reviewing" | "accepting";

export function GenerationView() {
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<FlashcardSuggestionDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isGenerating = viewState === "generating";
  const isReviewing = viewState === "reviewing";
  const isAccepting = viewState === "accepting";

  // Auto-scroll to suggestions after generation
  useEffect(() => {
    if (isReviewing && suggestionsRef.current) {
      suggestionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isReviewing]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleGenerate = useCallback(async (sourceText: string, model: string) => {
    setError(null);
    setSuccessMessage(null);
    setViewState("generating");

    try {
      const response = await fetch("/api/generations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: sourceText, model }),
      });

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();

        // Handle rate limiting
        if (errorData.error.code === "RATE_LIMIT_EXCEEDED") {
          const resetTime = errorData.error.details?.reset_time as number | undefined;
          const minutesLeft = resetTime ? Math.ceil((resetTime - Date.now() / 1000) / 60) : 45;
          throw new Error(`Osiągnięto limit generowań. Spróbuj ponownie za ${minutesLeft} minut.`);
        }

        throw new Error(errorData.error.message || "Nie udało się wygenerować fiszek");
      }

      const data: GenerateFlashcardsResponseDTO = await response.json();

      setGenerationId(data.generation_id);
      setSuggestions(data.flashcardSuggestions);
      setViewState("reviewing");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Nieznany błąd podczas generowania");
      setViewState("idle");
    }
  }, []);

  const handleAccept = useCallback(
    async (flashcards: FlashcardSuggestionDTO[]) => {
      if (!generationId) {
        setError("Brak ID generacji");
        return;
      }

      setError(null);
      setSuccessMessage(null);
      setViewState("accepting");

      try {
        const acceptInputs: AcceptFlashcardInput[] = flashcards.map((f) => ({
          front: f.front,
          back: f.back,
          edited: f.source === "ai-edited",
        }));

        const response = await fetch(`/api/generations/${generationId}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flashcards: acceptInputs }),
        });

        if (!response.ok) {
          const errorData: ErrorDTO = await response.json();
          throw new Error(errorData.error.message || "Nie udało się zapisać fiszek");
        }

        const data = await response.json();
        const count = data.accepted_count;

        setSuccessMessage(
          `${count} ${count === 1 ? "fiszka została zapisana" : count >= 2 && count <= 4 ? "fiszki zostały zapisane" : "fiszek zostało zapisanych"} pomyślnie!`
        );

        // Reset state
        setGenerationId(null);
        setSuggestions([]);
        setViewState("idle");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Accept error:", err);
        setError(err instanceof Error ? err.message : "Nieznany błąd podczas zapisywania");
        setViewState("reviewing");
      }
    },
    [generationId]
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Generuj fiszki z AI</h1>
        <p className="text-muted-foreground">
          Wklej tekst źródłowy, a AI wygeneruje dla Ciebie gotowe fiszki edukacyjne
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          data-testid="success-message"
          className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          data-testid="error-message"
          className="p-4 rounded-md bg-destructive/10 border border-destructive text-destructive"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <svg
              className="size-5 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="space-y-2 flex-1">
              <p className="font-medium" data-testid="error-message-text">
                {error}
              </p>
              <button
                data-testid="error-message-close"
                onClick={() => setError(null)}
                className="text-sm underline-offset-4 hover:underline"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Form */}
      <GenerationForm onGenerate={handleGenerate} isGenerating={isGenerating} />

      {/* Loading State */}
      {isGenerating && <LoadingState />}

      {/* Suggestions List */}
      {isReviewing && suggestions.length > 0 && (
        <div ref={suggestionsRef} data-testid="suggestions-container">
          <SuggestionsList
            suggestions={suggestions}
            onAcceptSelected={handleAccept}
            onAcceptAll={handleAccept}
            isAccepting={isAccepting}
          />
        </div>
      )}
    </div>
  );
}
