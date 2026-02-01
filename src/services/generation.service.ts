import crypto from "crypto";
import type { SupabaseClient } from "../db/supabase.client";
import { ServiceUnavailableError, DatabaseError, NotFoundError } from "../lib/errors";
import type {
  GenerateFlashcardsResponseDTO,
  FlashcardSuggestionDTO,
  AcceptFlashcardInput,
  AcceptGeneratedFlashcardsResponseDTO,
  PaginatedGenerationsDTO,
  GenerationDTO,
} from "../types";

/**
 * Service layer for AI flashcard generation operations
 * Handles generation, acceptance, and retrieval of AI-generated flashcards
 */
export class GenerationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate flashcard suggestions from source text using AI
   * In development mode, uses mock AI service
   *
   * @param userId - Authenticated user ID from JWT token
   * @param sourceText - Source text for flashcard generation (1000-10000 chars)
   * @param model - AI model to use for generation
   * @param count - Number of flashcards to generate
   * @param temperature - Temperature parameter for AI generation
   * @returns Generation metadata and flashcard suggestions
   */
  async generateFlashcards(
    userId: string,
    sourceText: string,
    model: string,
    count: number,
    temperature: number
  ): Promise<GenerateFlashcardsResponseDTO> {
    // Calculate MD5 hash for deduplication tracking
    const hash = crypto.createHash("md5").update(sourceText).digest("hex");

    // Track generation time
    const startTime = Date.now();

    try {
      // Call AI service (mock in development)
      const suggestions = await this.callAIService(sourceText, model, count, temperature);

      const duration = Date.now() - startTime;

      // Store generation metadata in database
      const { data: generation, error } = await this.supabase
        .from("generations")
        .insert({
          user_id: userId,
          model: model,
          generated_count: suggestions.length,
          source_text_hash: hash,
          source_text_length: sourceText.trim().length,
          generation_duration: duration,
        })
        .select()
        .single();

      if (error || !generation) {
        throw new DatabaseError("Failed to save generation record");
      }

      return {
        generation_id: generation.id,
        model: generation.model,
        generated_count: suggestions.length,
        generation_duration: duration,
        source_text_hash: hash,
        flashcardSuggestions: suggestions,
      };
    } catch (error) {
      // Log error to generation_error_logs table
      await this.logGenerationError(userId, model, sourceText, error as Error);

      // Re-throw appropriate error
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new ServiceUnavailableError(error instanceof Error ? error.message : "AI service unavailable");
    }
  }

  /**
   * Mock AI service for development
   * Generates sample flashcard suggestions based on source text
   *
   * @param sourceText - Source text for flashcard generation
   * @param model - AI model to use
   * @param count - Number of flashcards to generate
   * @param temperature - Temperature parameter
   * @returns Array of flashcard suggestions
   */
  private async callAIService(
    sourceText: string,
    model: string,
    count: number,
    temperature: number
  ): Promise<FlashcardSuggestionDTO[]> {
    // Check if we should use real AI (production) or mock (development)
    const useRealAI = import.meta.env.OPENROUTER_API_KEY;

    if (useRealAI) {
      return this.callOpenRouter(sourceText, model, count, temperature);
    }

    // Mock AI service for development
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock flashcards based on count parameter
    const mockCards: FlashcardSuggestionDTO[] = [];
    for (let i = 0; i < count; i++) {
      mockCards.push({
        front: `Question ${i + 1} from the source text`,
        back: `Answer ${i + 1} based on the content provided`,
      });
    }

    return mockCards;
  }

  /**
   * Call OpenRouter AI API for real flashcard generation
   * Used in production environment. Uses OpenRouterService with structured outputs.
   *
   * @param sourceText - Source text for flashcard generation
   * @param model - AI model to use
   * @param count - Number of flashcards to generate
   * @param temperature - Temperature parameter for AI generation
   * @returns Array of flashcard suggestions
   */
  private async callOpenRouter(
    sourceText: string,
    model: string,
    count: number,
    temperature: number
  ): Promise<FlashcardSuggestionDTO[]> {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableError("OpenRouter API key not configured");
    }

    // Import OpenRouterService dynamically
    const { OpenRouterService } = await import("./openrouter.service");
    const openRouterService = new OpenRouterService(apiKey);

    // Define JSON Schema for flashcard generation
    const flashcardSchema = {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string", maxLength: 200 },
              back: { type: "string", maxLength: 500 },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    };

    // Call OpenRouter with structured output
    const completion = await openRouterService.complete({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful flashcard generator. Create high-quality flashcards from the provided content. Each flashcard should have a concise question on the front and a clear answer on the back.",
        },
        {
          role: "user",
          content: `Generate exactly ${count} flashcards from the following content:\n\n${sourceText}`,
        },
      ],
      temperature,
      max_tokens: 2000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "flashcard_generation",
          strict: true,
          schema: flashcardSchema,
        },
      },
    });

    // Parse structured response
    const generatedContent = JSON.parse(completion.choices[0].message.content);
    return generatedContent.flashcards;
  }

  /**
   * Log generation error to database for analytics
   *
   * @param userId - User ID
   * @param model - AI model name
   * @param sourceText - Source text that caused the error
   * @param error - Error object
   */
  async logGenerationError(userId: string, model: string, sourceText: string, error: Error): Promise<void> {
    const hash = crypto.createHash("md5").update(sourceText).digest("hex");

    try {
      await this.supabase.from("generation_error_logs").insert({
        user_id: userId,
        model,
        source_text_hash: hash,
        source_text_length: sourceText.trim().length,
        error_code: error.name || "UNKNOWN_ERROR",
        error_message: error.message,
      });
    } catch (logError) {
      // Silent fail - don't throw error if logging fails
      // eslint-disable-next-line no-console
      console.error("Failed to log generation error:", logError);
    }
  }

  /**
   * Accept generated flashcard suggestions and save them to user's collection
   * CRITICAL: Verifies generation ownership before accepting
   *
   * @param userId - Authenticated user ID from JWT token
   * @param generationId - Generation ID to accept flashcards from
   * @param flashcards - Array of flashcards with edit status
   * @returns Acceptance confirmation with created flashcard records
   */
  async acceptGeneration(
    userId: string,
    generationId: number,
    flashcards: AcceptFlashcardInput[]
  ): Promise<AcceptGeneratedFlashcardsResponseDTO> {
    // CRITICAL: Verify generation ownership (RLS is disabled)
    const { data: generation, error: verifyError } = await this.supabase
      .from("generations")
      .select("id")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (verifyError || !generation) {
      throw new NotFoundError("Generation not found or access denied");
    }

    // Count edited vs unedited flashcards
    const unedited = flashcards.filter((f) => !f.edited).length;
    const edited = flashcards.filter((f) => f.edited).length;

    // Prepare flashcard inserts with proper source attribution
    const flashcardInserts = flashcards.map((f) => ({
      front: f.front,
      back: f.back,
      source: f.edited ? ("ai-edited" as const) : ("ai-full" as const),
      generation_id: generationId,
      user_id: userId,
    }));

    // Batch insert flashcards
    const { data: created, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardInserts)
      .select();

    if (insertError || !created) {
      throw new DatabaseError("Failed to create flashcards");
    }

    // Update generation statistics
    const { error: updateError } = await this.supabase
      .from("generations")
      .update({
        accepted_unedited_count: unedited,
        accepted_edited_count: edited,
      })
      .eq("id", generationId)
      .eq("user_id", userId);

    if (updateError) {
      // Log but don't fail - flashcards were already created
      // eslint-disable-next-line no-console
      console.error("Failed to update generation statistics:", updateError);
    }

    return {
      message: "Flashcards successfully saved",
      accepted_count: flashcards.length,
      accepted_unedited_count: unedited,
      accepted_edited_count: edited,
      flashcards: created.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        source: card.source,
        generation_id: card.generation_id,
        created_at: card.created_at,
        updated_at: card.updated_at,
      })),
    };
  }

  /**
   * Retrieve paginated list of user's generation history
   * CRITICAL: Filters by user_id (RLS is disabled)
   *
   * @param userId - Authenticated user ID from JWT token
   * @param params - Pagination parameters (page, limit, sort, order)
   * @returns Paginated generations with metadata
   */
  async getGenerations(
    userId: string,
    params: { page: number; limit: number; sort: string; order: "asc" | "desc" }
  ): Promise<PaginatedGenerationsDTO> {
    const offset = (params.page - 1) * params.limit;

    // Fetch generations with count for pagination
    const { data, count, error } = await this.supabase
      .from("generations")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order(params.sort, { ascending: params.order === "asc" })
      .range(offset, offset + params.limit - 1);

    if (error) {
      throw new DatabaseError("Failed to retrieve generations");
    }

    // Map to DTOs (omit user_id for security)
    const generationDTOs: GenerationDTO[] = (data || []).map((gen) => ({
      id: gen.id,
      model: gen.model,
      generated_count: gen.generated_count,
      generation_duration: gen.generation_duration,
      source_text_hash: gen.source_text_hash,
      source_text_length: gen.source_text_length,
      accepted_unedited_count: gen.accepted_unedited_count,
      accepted_edited_count: gen.accepted_edited_count,
      created_at: gen.created_at,
      updated_at: gen.updated_at,
    }));

    return {
      data: generationDTOs,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / params.limit),
      },
    };
  }
}
