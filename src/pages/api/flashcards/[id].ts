import type { APIRoute } from "astro";
import type { DeleteFlashcardResponseDTO } from "@/types";
import { FlashcardService } from "@/services/flashcard.service";
import { FlashcardIdSchema, UpdateFlashcardSchema } from "@/lib/validation/flashcard.schemas";
import { handleError } from "@/lib/error-handler";

export const prerender = false;

/**
 * GET /api/flashcards/:id
 * Retrieve a specific flashcard by ID
 */
export const GET: APIRoute = async (context) => {
  try {
    // 1. Get authenticated user
    const userId = context.locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate path parameter
    const { id } = FlashcardIdSchema.parse({
      id: context.params.id,
    });

    // 3. Call service
    const service = new FlashcardService(context.locals.supabase);
    const flashcard = await service.getFlashcardById(userId, id);

    // 4. Return response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * PUT /api/flashcards/:id
 * Update an existing flashcard
 */
export const PUT: APIRoute = async (context) => {
  try {
    // 1. Get authenticated user
    const userId = context.locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate path parameter
    const { id } = FlashcardIdSchema.parse({
      id: context.params.id,
    });

    // 3. Parse and validate request body
    const body = await context.request.json();
    const validated = UpdateFlashcardSchema.parse(body);

    // 4. Call service
    const service = new FlashcardService(context.locals.supabase);
    const result = await service.updateFlashcard(userId, id, validated);

    // 5. Return response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * DELETE /api/flashcards/:id
 * Delete a flashcard permanently
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // 1. Get authenticated user
    const userId = context.locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate path parameter
    const { id } = FlashcardIdSchema.parse({
      id: context.params.id,
    });

    // 3. Call service
    const service = new FlashcardService(context.locals.supabase);
    await service.deleteFlashcard(userId, id);

    // 4. Return response
    const response: DeleteFlashcardResponseDTO = {
      message: "Flashcard successfully deleted",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
