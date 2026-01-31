import { useState, useCallback } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlashcardSuggestionDTO } from "@/types";

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

interface SuggestionCardProps {
  suggestion: FlashcardSuggestionDTO;
  isChecked: boolean;
  onCheck: (checked: boolean) => void;
  onEdit: (front: string, back: string) => void;
  onReject: () => void;
}

export function SuggestionCard({ suggestion, isChecked, onCheck, onEdit, onReject }: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState(suggestion.front);
  const [editBack, setEditBack] = useState(suggestion.back);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  const handleSaveEdit = useCallback(() => {
    setFrontError(null);
    setBackError(null);

    let hasError = false;

    if (!editFront.trim()) {
      setFrontError("Przód fiszki nie może być pusty");
      hasError = true;
    } else if (editFront.length > MAX_FRONT_LENGTH) {
      setFrontError(`Przekroczono limit ${MAX_FRONT_LENGTH} znaków`);
      hasError = true;
    }

    if (!editBack.trim()) {
      setBackError("Tył fiszki nie może być pusty");
      hasError = true;
    } else if (editBack.length > MAX_BACK_LENGTH) {
      setBackError(`Przekroczono limit ${MAX_BACK_LENGTH} znaków`);
      hasError = true;
    }

    if (hasError) return;

    onEdit(editFront, editBack);
    setIsEditing(false);
  }, [editFront, editBack, onEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditFront(suggestion.front);
    setEditBack(suggestion.back);
    setFrontError(null);
    setBackError(null);
    setIsEditing(false);
  }, [suggestion.front, suggestion.back]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleCancelEdit]
  );

  return (
    <Card className={cn("p-4 transition-all", isChecked && "ring-2 ring-primary bg-primary/5")}>
      {isEditing ? (
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          {/* Front Edit */}
          <div className="space-y-1">
            <label htmlFor="edit-front" className="text-sm font-medium">
              Przód fiszki
            </label>
            <textarea
              id="edit-front"
              value={editFront}
              onChange={(e) => setEditFront(e.target.value)}
              maxLength={MAX_FRONT_LENGTH}
              className={cn(
                "w-full min-h-[80px] p-2 border rounded-md resize-y text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                frontError && "border-destructive focus:ring-destructive"
              )}
              aria-describedby="front-counter front-error"
              aria-invalid={frontError ? "true" : "false"}
              autoFocus
            />
            <div className="flex justify-between items-center">
              <span
                id="front-counter"
                className={cn(
                  "text-xs",
                  editFront.length > MAX_FRONT_LENGTH ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {editFront.length} / {MAX_FRONT_LENGTH}
              </span>
              {frontError && (
                <span id="front-error" className="text-xs text-destructive">
                  {frontError}
                </span>
              )}
            </div>
          </div>

          {/* Back Edit */}
          <div className="space-y-1">
            <label htmlFor="edit-back" className="text-sm font-medium">
              Tył fiszki
            </label>
            <textarea
              id="edit-back"
              value={editBack}
              onChange={(e) => setEditBack(e.target.value)}
              maxLength={MAX_BACK_LENGTH}
              className={cn(
                "w-full min-h-[100px] p-2 border rounded-md resize-y text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                backError && "border-destructive focus:ring-destructive"
              )}
              aria-describedby="back-counter back-error"
              aria-invalid={backError ? "true" : "false"}
            />
            <div className="flex justify-between items-center">
              <span
                id="back-counter"
                className={cn(
                  "text-xs",
                  editBack.length > MAX_BACK_LENGTH ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {editBack.length} / {MAX_BACK_LENGTH}
              </span>
              {backError && (
                <span id="back-error" className="text-xs text-destructive">
                  {backError}
                </span>
              )}
            </div>
          </div>

          {/* Edit Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
              Anuluj
            </Button>
            <Button type="button" size="sm" onClick={handleSaveEdit}>
              Zapisz
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onCheck(e.target.checked)}
              className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
              aria-label="Zaznacz fiszkę do zapisania"
            />

            <div className="flex-1 space-y-2 min-w-0">
              {/* Front Text */}
              <div className="font-bold text-sm break-words">{suggestion.front}</div>

              {/* Back Text */}
              <div className="text-sm break-words text-muted-foreground">{suggestion.back}</div>

              {/* Edited Badge */}
              {suggestion.source === "ai-edited" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Edytowane
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="Edytuj fiszkę"
            >
              <Pencil className="size-4" />
              Edytuj
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onReject} aria-label="Odrzuć fiszkę">
              <X className="size-4" />
              Odrzuć
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
