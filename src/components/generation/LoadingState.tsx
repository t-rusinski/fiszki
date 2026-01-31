import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  estimatedTime?: number;
  onCancel?: () => void;
}

export function LoadingState({ message = "Generowanie fiszek w toku...", estimatedTime, onCancel }: LoadingStateProps) {
  return (
    <div
      data-testid="loading-state"
      className="flex flex-col items-center justify-center py-12 space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-12 animate-spin text-primary" aria-hidden="true" />

      <div className="text-center space-y-2">
        <p className="text-lg font-medium" data-testid="loading-message">
          {message}
        </p>

        {estimatedTime && <p className="text-sm text-muted-foreground">Szacowany czas: ~{estimatedTime}s</p>}
      </div>

      {onCancel && (
        <button
          data-testid="cancel-generation-button"
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
          aria-label="Anuluj generowanie"
        >
          Anuluj
        </button>
      )}
    </div>
  );
}
