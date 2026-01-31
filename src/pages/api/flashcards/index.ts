import type { APIRoute } from "astro";
import { FlashcardService } from "@/services/flashcard.service";
import {
  GetFlashcardsSchema,
  CreateFlashcardSchema,
  CreateMultipleFlashcardsSchema,
} from "@/lib/validation/flashcard.schemas";
import { handleError } from "@/lib/error-handler";

export const prerender = false;

/**
 * GET /api/flashcards
 * Retrieve paginated list of user's flashcards
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

    // 2. Validate query parameters
    const params = GetFlashcardsSchema.parse({
      page: context.url.searchParams.get("page"),
      limit: context.url.searchParams.get("limit"),
      source: context.url.searchParams.get("source"),
      sort: context.url.searchParams.get("sort"),
      order: context.url.searchParams.get("order"),
    });

    // 3. Call service
    const service = new FlashcardService(context.locals.supabase);
    const result = await service.getFlashcards(userId, params);

    // 4. Return response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};

/**
 * POST /api/flashcards
 * Create one or multiple flashcards
 */
export const POST: APIRoute = async (context) => {
  try {
    // 1. Get authenticated user
    const userId = context.locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const body = await context.request.json();

    // 3. Detect single vs. multiple creation
    const isMultiple = "flashcards" in body;

    // 4. Validate and call appropriate service method
    const service = new FlashcardService(context.locals.supabase);
    let result;

    if (isMultiple) {
      const validated = CreateMultipleFlashcardsSchema.parse(body);
      result = await service.createFlashcards(userId, validated.flashcards);
    } else {
      const validated = CreateFlashcardSchema.parse(body);
      result = await service.createFlashcard(userId, validated);
    }

    // 5. Return response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
