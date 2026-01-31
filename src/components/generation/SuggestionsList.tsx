import { useState, useCallback, useEffect } from "react";
import { SuggestionCard } from "./SuggestionCard";
import { BulkActions } from "./BulkActions";
import type { FlashcardSuggestionDTO } from "@/types";

interface SuggestionsListProps {
  suggestions: FlashcardSuggestionDTO[];
  onAcceptSelected: (flashcards: FlashcardSuggestionDTO[]) => void;
  onAcceptAll: (flashcards: FlashcardSuggestionDTO[]) => void;
  isAccepting: boolean;
}

interface SuggestionState extends FlashcardSuggestionDTO {
  id: string;
  isChecked: boolean;
  isEdited: boolean;
}

export function SuggestionsList({ suggestions, onAcceptSelected, onAcceptAll, isAccepting }: SuggestionsListProps) {
  const [suggestionStates, setSuggestionStates] = useState<SuggestionState[]>([]);

  // Initialize suggestion states
  useEffect(() => {
    setSuggestionStates(
      suggestions.map((suggestion, index) => ({
        ...suggestion,
        id: `suggestion-${index}`,
        isChecked: false,
        isEdited: false,
      }))
    );
  }, [suggestions]);

  const selectedCount = suggestionStates.filter((s) => s.isChecked).length;
  const hasSelections = selectedCount > 0;

  const handleCheck = useCallback((id: string, checked: boolean) => {
    setSuggestionStates((prev) => prev.map((s) => (s.id === id ? { ...s, isChecked: checked } : s)));
  }, []);

  const handleEdit = useCallback((id: string, front: string, back: string) => {
    setSuggestionStates((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              front,
              back,
              isChecked: true, // Auto-check when edited
              isEdited: true,
              source: "ai-edited" as const,
            }
          : s
      )
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setSuggestionStates((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleAcceptSelected = useCallback(() => {
    const selected = suggestionStates.filter((s) => s.isChecked);
    const flashcards = selected.map(({ id, isChecked, isEdited, ...rest }) => rest);
    onAcceptSelected(flashcards);
  }, [suggestionStates, onAcceptSelected]);

  const handleAcceptAll = useCallback(() => {
    const flashcards = suggestionStates.map(({ id, isChecked, isEdited, ...rest }) => rest);
    onAcceptAll(flashcards);
  }, [suggestionStates, onAcceptAll]);

  if (suggestionStates.length === 0) {
    return null;
  }

  return (
    <section className="w-full space-y-6" aria-labelledby="suggestions-heading">
      {/* Header */}
      <div className="space-y-2">
        <h2 id="suggestions-heading" className="text-2xl font-bold">
          Przejrzyj propozycje AI
        </h2>
        <p className="text-muted-foreground">Zaznacz fiszki do zapisania, edytuj w razie potrzeby lub odrzuć</p>
      </div>

      {/* Suggestions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {suggestionStates.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            isChecked={suggestion.isChecked}
            onCheck={(checked) => handleCheck(suggestion.id, checked)}
            onEdit={(front, back) => handleEdit(suggestion.id, front, back)}
            onReject={() => handleReject(suggestion.id)}
          />
        ))}
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedCount}
        totalCount={suggestionStates.length}
        onSaveAll={handleAcceptAll}
        onSaveSelected={handleAcceptSelected}
        isAccepting={isAccepting}
      />
    </section>
  );
}
