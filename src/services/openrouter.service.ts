import type { ChatCompletionRequest, ChatCompletionResponse } from "@/types";
import { ValidationError, UnauthorizedError, RateLimitError, ServiceUnavailableError } from "@/lib/errors";

export class OpenRouterService {
  private readonly baseURL = "https://openrouter.ai/api/v1";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new ValidationError("OpenRouter API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Wysyła request do OpenRouter API w celu wygenerowania completion
   * @param request - Parametry chat completion
   * @returns Promise z odpowiedzią zawierającą wygenerowany tekst
   * @throws {ValidationError} Gdy parametry requestu są nieprawidłowe
   * @throws {UnauthorizedError} Gdy klucz API jest nieprawidłowy
   * @throws {RateLimitError} Gdy przekroczono limit requestów
   * @throws {ServiceUnavailableError} Gdy OpenRouter jest niedostępny
   */
  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Walidacja input
    this.validateRequest(request);

    try {
      const response = await this.makeRequest("/chat/completions", request);

      if (!response.ok) {
        await this.handleErrorResponse(response, request.model);
      }

      const data = await response.json();
      return data as ChatCompletionResponse;
    } catch (error) {
      // Re-throw custom errors
      if (
        error instanceof ValidationError ||
        error instanceof UnauthorizedError ||
        error instanceof RateLimitError ||
        error instanceof ServiceUnavailableError
      ) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableError(
          `Request timeout: Model '${request.model}' did not respond. Try a different model.`
        );
      }

      throw new ServiceUnavailableError(
        `Unexpected error with model '${request.model}': ${error instanceof Error ? error.message : "Unknown error"}. Try a different model.`
      );
    }
  }

  /**
   * Wykonuje HTTP request do OpenRouter API
   */
  private async makeRequest(endpoint: string, body: unknown): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10xdevs.pl",
          "X-Title": "Fiszki App",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Waliduje parametry requestu przed wysłaniem
   */
  private validateRequest(request: ChatCompletionRequest): void {
    if (!request.model || request.model.trim() === "") {
      throw new ValidationError("Model name is required");
    }

    if (!request.messages || request.messages.length === 0) {
      throw new ValidationError("At least one message is required");
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new ValidationError("Temperature must be between 0 and 2");
      }
    }

    if (request.max_tokens !== undefined && request.max_tokens <= 0) {
      throw new ValidationError("max_tokens must be positive");
    }

    // Walidacja response_format
    if (request.response_format?.json_schema) {
      const { name, schema, strict } = request.response_format.json_schema;

      if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
        throw new ValidationError("Schema name must be snake_case (lowercase, underscores, no spaces)");
      }

      if (!schema || typeof schema !== "object") {
        throw new ValidationError("Schema must be a valid JSON Schema object");
      }

      if (strict !== true) {
        throw new ValidationError("Schema strict mode must be enabled (strict: true)");
      }
    }
  }

  /**
   * Obsługuje błędne odpowiedzi z OpenRouter API
   */
  private async handleErrorResponse(response: Response, model: string): Promise<never> {
    const status = response.status;
    let errorMessage = `OpenRouter API error (${status})`;

    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = (await response.text()) || errorMessage;
    }

    // Lista sprawdzonych, działających modeli (nie sugeruj modelu, który się nie udał)
    const workingModels = ["mistralai/mistral-7b-instruct:free"];
    const suggestions = workingModels.filter((m) => m !== model);

    // Dodaj nazwę modelu do komunikatu błędu
    const modelInfo = `Model '${model}' jest niedostępny. ${errorMessage}`;
    const suggestion =
      suggestions.length > 0
        ? ` Spróbuj modelu: ${suggestions.join(" lub ")}.`
        : " Sprawdź dostępność modeli w dokumentacji OpenRouter.";

    // Mapowanie statusów HTTP na typy błędów
    switch (status) {
      case 400:
        throw new ValidationError(modelInfo);
      case 401:
        throw new UnauthorizedError(errorMessage);
      case 404:
        throw new ServiceUnavailableError(modelInfo + suggestion);
      case 429:
        throw new RateLimitError(modelInfo + suggestion);
      case 503:
        throw new ServiceUnavailableError(modelInfo + suggestion);
      default:
        throw new ServiceUnavailableError(`${modelInfo} (HTTP ${status})` + suggestion);
    }
  }
}
