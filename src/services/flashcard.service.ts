import type { SupabaseClient } from "@/db/supabase.client";
import type {
  FlashcardDTO,
  PaginatedFlashcardsDTO,
  CreateFlashcardCommand,
  CreateMultipleFlashcardsResponseDTO,
  UpdateFlashcardCommand,
} from "@/types";
import type { GetFlashcardsInput } from "@/lib/validation/flashcard.schemas";
import { NotFoundError, DatabaseError } from "@/lib/errors";

export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieve paginated list of user's flashcards
   */
  async getFlashcards(userId: string, params: GetFlashcardsInput): Promise<PaginatedFlashcardsDTO> {
    const { page, limit, source, sort, order } = params;
    const offset = (page - 1) * limit;

    let query = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply optional source filter
    if (source) {
      query = query.eq("source", source);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new DatabaseError(`Failed to retrieve flashcards: ${error.message}`);
    }

    // Map to DTO (omit user_id)
    const flashcards: FlashcardDTO[] = (data || []).map((row) => ({
      id: row.id,
      front: row.front,
      back: row.back,
      source: row.source,
      generation_id: row.generation_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data: flashcards,
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    };
  }

  /**
   * Retrieve a specific flashcard by ID
   */
  async getFlashcardById(userId: string, id: number): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Flashcard not found");
    }

    // Map to DTO (omit user_id)
    return {
      id: data.id,
      front: data.front,
      back: data.back,
      source: data.source,
      generation_id: data.generation_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Create a single flashcard
   */
  async createFlashcard(userId: string, data: CreateFlashcardCommand): Promise<FlashcardDTO> {
    // Verify generation ownership if generation_id is provided
    if (data.generation_id) {
      await this.verifyGenerationOwnership(userId, data.generation_id);
    }

    const { data: result, error } = await this.supabase
      .from("flashcards")
      .insert({
        front: data.front,
        back: data.back,
        source: data.source || "manual",
        generation_id: data.generation_id || null,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !result) {
      throw new DatabaseError(`Failed to create flashcard: ${error?.message || "Unknown error"}`);
    }

    // Map to DTO (omit user_id)
    return {
      id: result.id,
      front: result.front,
      back: result.back,
      source: result.source,
      generation_id: result.generation_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  /**
   * Create multiple flashcards in bulk
   */
  async createFlashcards(
    userId: string,
    flashcards: CreateFlashcardCommand[]
  ): Promise<CreateMultipleFlashcardsResponseDTO> {
    // Verify generation ownership for all flashcards with generation_id
    const generationIds = [...new Set(flashcards.map((f) => f.generation_id).filter(Boolean))] as number[];
    for (const genId of generationIds) {
      await this.verifyGenerationOwnership(userId, genId);
    }

    // Prepare insert data
    const inserts = flashcards.map((card) => ({
      front: card.front,
      back: card.back,
      source: card.source || "manual",
      generation_id: card.generation_id || null,
      user_id: userId,
    }));

    const { data, error } = await this.supabase.from("flashcards").insert(inserts).select();

    if (error || !data) {
      throw new DatabaseError(`Failed to create flashcards: ${error?.message || "Unknown error"}`);
    }

    // Map to DTOs (omit user_id)
    const createdFlashcards: FlashcardDTO[] = data.map((row) => ({
      id: row.id,
      front: row.front,
      back: row.back,
      source: row.source,
      generation_id: row.generation_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return {
      message: "Flashcards successfully created",
      created_count: createdFlashcards.length,
      flashcards: createdFlashcards,
    };
  }

  /**
   * Update an existing flashcard
   */
  async updateFlashcard(userId: string, id: number, data: UpdateFlashcardCommand): Promise<FlashcardDTO> {
    // First verify flashcard exists and belongs to user
    const { data: existing } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      throw new NotFoundError("Flashcard not found");
    }

    // Perform update
    const updateData: Partial<UpdateFlashcardCommand> = {};
    if (data.front !== undefined) updateData.front = data.front;
    if (data.back !== undefined) updateData.back = data.back;

    const { data: result, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !result) {
      throw new DatabaseError(`Failed to update flashcard: ${error?.message || "Unknown error"}`);
    }

    // Map to DTO (omit user_id)
    return {
      id: result.id,
      front: result.front,
      back: result.back,
      source: result.source,
      generation_id: result.generation_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  /**
   * Delete a flashcard permanently
   */
  async deleteFlashcard(userId: string, id: number): Promise<void> {
    const { error, count } = await this.supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new DatabaseError(`Failed to delete flashcard: ${error.message}`);
    }

    if (count === 0) {
      throw new NotFoundError("Flashcard not found");
    }
  }

  /**
   * Helper method to verify generation ownership
   */
  private async verifyGenerationOwnership(userId: string, generationId: number): Promise<void> {
    const { data, error } = await this.supabase
      .from("generations")
      .select("id")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Generation not found or access denied");
    }
  }
}
