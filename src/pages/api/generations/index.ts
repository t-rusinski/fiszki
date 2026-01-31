import type { APIRoute } from "astro";
import { GenerationService } from "../../../services/generation.service";
import { GetGenerationsSchema } from "../../../lib/validation/generation.schemas";
import { handleApiError } from "../../../lib/error-handler";
import { DEFAULT_USR_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/generations
 * Retrieve paginated list of user's generation history
 *
 * Query parameters:
 *   page: number (default: 1)
 *   limit: number (default: 20, max: 100)
 *   sort: 'created_at' (default: 'created_at')
 *   order: 'asc' | 'desc' (default: 'desc')
 *
 * Response (200 OK):
 * {
 *   "data": GenerationDTO[],
 *   "pagination": {
 *     "page": number,
 *     "limit": number,
 *     "total": number,
 *     "total_pages": number
 *   }
 * }
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Get authenticated user
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract query parameters from URL
    const searchParams = url.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sort: searchParams.get("sort") || "created_at",
      order: searchParams.get("order") || "desc",
    };

    // Validate query parameters with Zod
    // Note: GetGenerationsSchema uses z.coerce to convert strings to numbers
    const validated = GetGenerationsSchema.parse(queryParams);

    // Initialize service and get generations
    const service = new GenerationService(locals.supabase);
    const result = await service.getGenerations(userId, validated);

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
