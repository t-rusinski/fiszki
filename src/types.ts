import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

type FlashcardRow = Database["public"]["Tables"]["flashcards"]["Row"];
type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
type FlashcardUpdate = Database["public"]["Tables"]["flashcards"]["Update"];

type GenerationRow = Database["public"]["Tables"]["generations"]["Row"];
type GenerationInsert = Database["public"]["Tables"]["generations"]["Insert"];

type GenerationErrorLogInsert = Database["public"]["Tables"]["generation_error_logs"]["Insert"];

// ============================================================================
// Reusable DTOs
// ============================================================================

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Flashcard source type
export const FlashcardSource = {
  Manual: "manual",
  AiFull: "ai-full",
  AiEdited: "ai-edited",
} as const;

export type FlashcardSource = (typeof FlashcardSource)[keyof typeof FlashcardSource];

// ============================================================================
// Flashcard DTOs and Command Models
// ============================================================================

// GET /api/flashcards/:id - Single flashcard response
// GET /api/flashcards - List item (omit user_id for security)
export type FlashcardDTO = Pick<
  FlashcardRow,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

// GET /api/flashcards - Paginated list response
export interface PaginatedFlashcardsDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// POST /api/flashcards - Create single flashcard command
// Fields required by user; id, timestamps, user_id are auto-generated
export type CreateFlashcardCommand = Pick<FlashcardInsert, "front" | "back" | "source" | "generation_id">;

// POST /api/flashcards - Create multiple flashcards command
export interface CreateMultipleFlashcardsCommand {
  flashcards: CreateFlashcardCommand[];
}

// POST /api/flashcards - Single flashcard creation response
export type CreateFlashcardResponseDTO = FlashcardDTO;

// POST /api/flashcards - Multiple flashcards creation response
export interface CreateMultipleFlashcardsResponseDTO {
  message: string;
  created_count: number;
  flashcards: FlashcardDTO[];
}

// PUT /api/flashcards/:id - Update flashcard command
// Only front and back can be updated by user
export type UpdateFlashcardCommand = Pick<FlashcardUpdate, "front" | "back">;

// DELETE /api/flashcards/:id - Delete response
export interface DeleteFlashcardResponseDTO {
  message: string;
}

// ============================================================================
// Generation DTOs and Command Models
// ============================================================================

// POST /api/generations/generate - AI generation request command
export interface GenerateFlashcardsCommand {
  source_text: string;
}

// POST /api/generations/generate - Flashcard suggestion (not saved yet)
export interface FlashcardSuggestionDTO {
  front: string;
  back: string;
  source?: FlashcardSource;
}

// POST /api/generations/generate - AI generation response
export interface GenerateFlashcardsResponseDTO {
  generation_id: number;
  model: string;
  generated_count: number;
  generation_duration: number;
  source_text_hash: string;
  flashcardSuggestions: FlashcardSuggestionDTO[];
}

// POST /api/generations/:id/accept - Single flashcard acceptance input
export interface AcceptFlashcardInput {
  front: string;
  back: string;
  edited: boolean;
}

// POST /api/generations/:id/accept - Accept generated flashcards command
export interface AcceptGeneratedFlashcardsCommand {
  flashcards: AcceptFlashcardInput[];
}

// POST /api/generations/:id/accept - Accept generated flashcards response
export interface AcceptGeneratedFlashcardsResponseDTO {
  message: string;
  accepted_count: number;
  accepted_unedited_count: number;
  accepted_edited_count: number;
  flashcards: FlashcardDTO[];
}

// GET /api/generations - Single generation record (omit user_id for security)
export type GenerationDTO = Pick<
  GenerationRow,
  | "id"
  | "model"
  | "generated_count"
  | "generation_duration"
  | "source_text_hash"
  | "source_text_length"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "created_at"
  | "updated_at"
>;

// GET /api/generations - Paginated generations list response
export interface PaginatedGenerationsDTO {
  data: GenerationDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Statistics DTOs
// ============================================================================

// GET /api/statistics/generations - AI generation statistics
export interface GenerationStatisticsDTO {
  total_generations: number;
  total_generated_flashcards: number;
  total_accepted_flashcards: number;
  total_accepted_unedited: number;
  total_accepted_edited: number;
  acceptance_rate: number;
  edit_rate: number;
  average_generation_duration: number;
  models_used: Record<string, number>;
}

// GET /api/statistics/flashcards - Flashcard collection statistics
export interface FlashcardStatisticsDTO {
  total_flashcards: number;
  by_source: Record<FlashcardSource, number>;
  ai_created_percentage: number;
}

// ============================================================================
// Authentication DTOs
// ============================================================================

// DELETE /api/auth/account - Account deletion response
export interface DeleteAccountResponseDTO {
  message: string;
}

// ============================================================================
// Error DTOs
// ============================================================================

// Standard error response structure
export interface ErrorDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// OpenRouter Service Types
// ============================================================================

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

export interface Choice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "content_filter" | null;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Choice[];
  usage: Usage;
}

// ============================================================================
// Internal Types (used by backend for logging)
// ============================================================================

// For logging AI generation errors
export type CreateGenerationErrorLogCommand = Pick<
  GenerationErrorLogInsert,
  "error_code" | "error_message" | "model" | "source_text_hash" | "source_text_length" | "user_id"
>;

// For creating generation records
export type CreateGenerationCommand = Pick<
  GenerationInsert,
  | "model"
  | "generated_count"
  | "generation_duration"
  | "source_text_hash"
  | "source_text_length"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "user_id"
>;
