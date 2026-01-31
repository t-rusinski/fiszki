import type { APIRoute } from "astro";
import { GenerationService } from "../../../services/generation.service";
import { GenerateFlashcardsSchema } from "../../../lib/validation/generation.schemas";
import { handleApiError } from "../../../lib/error-handler";
import { DEFAULT_USR_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/generations/generate
 * Generate flashcard suggestions from source text using AI
 *
 * Request body:
 * {
 *   "source_text": string (1000-10000 chars),
 *   "model": string (optional, default: "openai/gpt-3.5-turbo"),
 *   "count": number (optional, default: 5, range: 1-20),
 *   "temperature": number (optional, default: 0.7, range: 0-2)
 * }
 *
 * Response (200 OK):
 * {
 *   "generation_id": number,
 *   "model": string,
 *   "generated_count": number,
 *   "generation_duration": number,
 *   "source_text_hash": string,
 *   "flashcardSuggestions": [{ "front": string, "back": string }]
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get authenticated user
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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
    const validated = GenerateFlashcardsSchema.parse(body);

    // Initialize service and generate flashcards
    const service = new GenerationService(locals.supabase);
    const result = await service.generateFlashcards(
      userId,
      validated.source_text,
      validated.model,
      validated.count,
      validated.temperature
    );

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Centralized error handling
    return handleApiError(error);
  }
};
