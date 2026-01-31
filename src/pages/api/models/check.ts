import type { APIRoute } from "astro";
import { checkMultipleModels } from "@/lib/model-checker";
import { handleApiError } from "@/lib/error-handler";
import { ServiceUnavailableError } from "@/lib/errors";
import { ALLOWED_MODELS } from "@/lib/validation/generation.schemas";

export const prerender = false;

/**
 * GET /api/models/check
 * Sprawdza dostępność wszystkich dozwolonych modeli
 *
 * Response (200 OK):
 * {
 *   "models": {
 *     "mistralai/mistral-7b-instruct:free": true,
 *     "openai/gpt-oss-20b:free": false,
 *     ...
 *   }
 * }
 */
export const GET: APIRoute = async () => {
  try {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableError("OpenRouter API key not configured");
    }

    // Sprawdź wszystkie dozwolone modele
    const modelStatus = await checkMultipleModels(apiKey, [...ALLOWED_MODELS]);

    return new Response(
      JSON.stringify({
        models: modelStatus,
        checked_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
