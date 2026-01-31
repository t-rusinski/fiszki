import type { APIRoute } from "astro";
import { GenerationService } from "../../../../services/generation.service";
import { AcceptGeneratedFlashcardsSchema } from "../../../../lib/validation/generation.schemas.ts";
import { handleApiError } from "../../../../lib/error-handler";
import { DEFAULT_USR_ID } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/generations/:id/accept
 * Accept generated flashcard suggestions and save them to user's collection
 *
 * Path params:
 *   id: number - Generation ID
 *
 * Request body:
 * {
 *   "flashcards": [
 *     {
 *       "front": string (max 200 chars),
 *       "back": string (max 500 chars),
 *       "edited": boolean
 *     }
 *   ]
 * }
 *
 * Response (201 Created):
 * {
 *   "message": "Flashcards successfully saved",
 *   "accepted_count": number,
 *   "accepted_unedited_count": number,
 *   "accepted_edited_count": number,
 *   "flashcards": FlashcardDTO[]
 * }
 */
export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    // Get authenticated user
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract and validate generation ID from path params
    const generationId = parseInt(params.id || "", 10);
    if (isNaN(generationId)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid generation ID",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNPROCESSABLE_ENTITY",
            message: "Invalid JSON format",
          },
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body with Zod
    const validated = AcceptGeneratedFlashcardsSchema.parse(body);

    // Initialize service and accept generation
    const service = new GenerationService(locals.supabase);
    const result = await service.acceptGeneration(userId, generationId, validated.flashcards);

    // Return successful response with 201 Created
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Centralized error handling
    return handleApiError(error);
  }
};
