import { z } from "zod";

/**
 * Dozwolone modele OpenRouter
 */
export const ALLOWED_MODELS = [
  // Darmowe modele (Free tier) - sprawdzony i działający
  "mistralai/mistral-7b-instruct:free", // ✅ Zweryfikowany
  // Niesprawdzone/potencjalnie niestabilne
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "qwen/qwen-2-7b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  // Niestabilne/niedostępne
  "google/gemini-flash-1.5:free", // ⚠️ Często niedostępny
  "openai/gpt-oss-20b:free", // ⚠️ Niestabilny
  // Płatne modele (Paid tier)
  "openai/gpt-4",
  "openai/gpt-3.5-turbo",
  "anthropic/claude-3-opus",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-haiku",
  "google/gemini-pro",
] as const;

/**
 * Schema for POST /api/generations/generate
 * Validates source text for AI flashcard generation
 */
export const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters"),

  model: z
    .enum(ALLOWED_MODELS, {
      errorMap: () => ({ message: "Invalid model selected" }),
    })
    .default("mistralai/mistral-7b-instruct:free"),

  count: z
    .number()
    .int("Count must be an integer")
    .min(1, "Must generate at least 1 flashcard")
    .max(20, "Cannot generate more than 20 flashcards at once")
    .default(5),

  temperature: z
    .number()
    .min(0, "Temperature must be at least 0")
    .max(2, "Temperature must not exceed 2")
    .optional()
    .default(0.7),
});

/**
 * Schema for individual flashcard in acceptance request
 */
export const AcceptFlashcardSchema = z.object({
  front: z.string().trim().min(1, "Front text is required").max(200, "Front text exceeds 200 characters"),
  back: z.string().trim().min(1, "Back text is required").max(500, "Back text exceeds 500 characters"),
  edited: z.boolean(),
});

/**
 * Schema for POST /api/generations/:id/accept
 * Validates flashcards being accepted from a generation
 */
export const AcceptGeneratedFlashcardsSchema = z.object({
  flashcards: z
    .array(AcceptFlashcardSchema)
    .min(1, "At least one flashcard must be provided")
    .max(100, "Cannot accept more than 100 flashcards at once"),
});

/**
 * Schema for GET /api/generations query parameters
 * Validates pagination and sorting parameters
 */
export const GetGenerationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Type exports for TypeScript type inference
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;
export type AcceptFlashcardInput = z.infer<typeof AcceptFlashcardSchema>;
export type AcceptGeneratedFlashcardsInput = z.infer<typeof AcceptGeneratedFlashcardsSchema>;
export type GetGenerationsInput = z.infer<typeof GetGenerationsSchema>;
