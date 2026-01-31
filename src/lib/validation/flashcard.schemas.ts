import { z } from "zod";
import { FlashcardSource } from "@/types";

// Validation for creating a single flashcard
export const CreateFlashcardSchema = z
  .object({
    front: z.string().trim().min(1, "Front text is required").max(200, "Front text must be at most 200 characters"),
    back: z.string().trim().min(1, "Back text is required").max(500, "Back text must be at most 500 characters"),
    source: z
      .enum([FlashcardSource.Manual, FlashcardSource.AiFull, FlashcardSource.AiEdited])
      .optional()
      .default(FlashcardSource.Manual),
    generation_id: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (data) => {
      // If source is ai-full or ai-edited, generation_id is required
      if (data.source === FlashcardSource.AiFull || data.source === FlashcardSource.AiEdited) {
        return data.generation_id !== null && data.generation_id !== undefined;
      }
      return true;
    },
    {
      message: "generation_id is required when source is ai-full or ai-edited",
      path: ["generation_id"],
    }
  );

export type CreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;

// Validation for creating multiple flashcards
export const CreateMultipleFlashcardsSchema = z.object({
  flashcards: z
    .array(CreateFlashcardSchema)
    .min(1, "At least one flashcard is required")
    .max(100, "Maximum 100 flashcards can be created at once"),
});

export type CreateMultipleFlashcardsInput = z.infer<typeof CreateMultipleFlashcardsSchema>;

// Validation for updating a flashcard
export const UpdateFlashcardSchema = z
  .object({
    front: z.string().trim().max(200, "Front text must be at most 200 characters").optional(),
    back: z.string().trim().max(500, "Back text must be at most 500 characters").optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided
      return data.front !== undefined || data.back !== undefined;
    },
    {
      message: "At least one field (front or back) must be provided",
    }
  );

export type UpdateFlashcardInput = z.infer<typeof UpdateFlashcardSchema>;

// Validation for GET /api/flashcards query parameters
export const GetFlashcardsSchema = z.object({
  page: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? "1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? "20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100, "Limit cannot exceed 100").default(20)),
  source: z
    .enum([FlashcardSource.Manual, FlashcardSource.AiFull, FlashcardSource.AiEdited])
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  sort: z
    .enum(["created_at", "updated_at", "front"])
    .nullable()
    .optional()
    .transform((val) => val ?? "created_at"),
  order: z
    .enum(["asc", "desc"])
    .nullable()
    .optional()
    .transform((val) => val ?? "desc"),
});

export type GetFlashcardsInput = z.infer<typeof GetFlashcardsSchema>;

// Validation for flashcard ID path parameter
export const FlashcardIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("Invalid flashcard ID")),
});

export type FlashcardIdInput = z.infer<typeof FlashcardIdSchema>;
