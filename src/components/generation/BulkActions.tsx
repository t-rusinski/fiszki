import { Button } from "../ui/button";

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSaveAll: () => void;
  onSaveSelected: () => void;
  isAccepting: boolean;
}

export function BulkActions({ selectedCount, totalCount, onSaveAll, onSaveSelected, isAccepting }: BulkActionsProps) {
  const hasSelections = selectedCount > 0;

  return (
    <div
      data-testid="bulk-actions"
      className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4 md:-mx-6 shadow-lg"
      role="region"
      aria-label="Akcje zbiorcze"
    >
      <div className="max-w-screen-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Selection Counter */}
        <div className="text-sm font-medium" aria-live="polite" aria-atomic="true" data-testid="selection-counter">
          {selectedCount > 0 ? (
            <>
              <span className="text-primary">{selectedCount}</span> fiszek zaznaczonych
            </>
          ) : (
            <>Zaznacz fiszki do zapisania</>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveAll}
            disabled={isAccepting}
            className="flex-1 sm:flex-none"
            data-testid="save-all-button"
          >
            Zapisz wszystkie ({totalCount})
          </Button>
          <Button
            type="button"
            onClick={onSaveSelected}
            disabled={!hasSelections || isAccepting}
            className="flex-1 sm:flex-none"
            data-testid="save-selected-button"
          >
            {isAccepting ? "Zapisywanie..." : `Zapisz zaznaczone${hasSelections ? ` (${selectedCount})` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
