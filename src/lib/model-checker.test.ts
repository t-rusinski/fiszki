import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchAvailableModels, isModelAvailable, getFreeModels, checkMultipleModels } from "./model-checker";

// Mock ModelInfo type for testing
interface ModelInfo {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  top_provider?: {
    is_moderated: boolean;
    max_completion_tokens?: number;
  };
}

describe("fetchAvailableModels", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("fetches models from OpenRouter API with correct URL", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct",
        pricing: { prompt: "0", completion: "0" },
        context_length: 8192,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    await fetchAvailableModels("test-api-key");

    expect(fetchMock).toHaveBeenCalledWith("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: "Bearer test-api-key",
      },
    });
  });

  it("sends Authorization header with Bearer token", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    await fetchAvailableModels("my-secret-key");

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      headers: {
        Authorization: "Bearer my-secret-key",
      },
    });
  });

  it("returns array of ModelInfo objects on success", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct",
        pricing: { prompt: "0", completion: "0" },
        context_length: 8192,
      },
      {
        id: "openai/gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        pricing: { prompt: "0.001", completion: "0.002" },
        context_length: 4096,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await fetchAvailableModels("test-api-key");

    expect(result).toEqual(mockModels);
    expect(result).toHaveLength(2);
  });

  it("returns empty array on fetch failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchAvailableModels("test-api-key");

    expect(result).toEqual([]);
  });

  it("returns empty array on non-200 response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    const result = await fetchAvailableModels("invalid-key");

    expect(result).toEqual([]);
  });

  it("handles network errors gracefully", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await fetchAvailableModels("test-api-key");

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("logs errors to console", async () => {
    const error = new Error("API Error");
    fetchMock.mockRejectedValueOnce(error);

    await fetchAvailableModels("test-api-key");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching models:", error);
  });

  it("handles JSON parse errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const result = await fetchAvailableModels("test-api-key");

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("handles server errors (500)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });

    const result = await fetchAvailableModels("test-api-key");

    expect(result).toEqual([]);
  });
});

describe("isModelAvailable", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when model exists in fetched list", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct",
        pricing: { prompt: "0", completion: "0" },
        context_length: 8192,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await isModelAvailable("test-api-key", "mistralai/mistral-7b-instruct:free");

    expect(result).toBe(true);
  });

  it("returns false when model does not exist in list", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct",
        pricing: { prompt: "0", completion: "0" },
        context_length: 8192,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await isModelAvailable("test-api-key", "non-existent-model");

    expect(result).toBe(false);
  });

  it("handles empty model list", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const result = await isModelAvailable("test-api-key", "any-model");

    expect(result).toBe(false);
  });

  it("performs exact ID matching", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct",
        pricing: { prompt: "0", completion: "0" },
        context_length: 8192,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await isModelAvailable("test-api-key", "mistralai/mistral-7b-instruct");

    expect(result).toBe(false); // Should not match partial ID
  });
});

describe("getFreeModels", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("filters models ending with ':free'", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct",
        pricing: { prompt: "0", completion: "0" },
        context_length: 8192,
      },
      {
        id: "openai/gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        pricing: { prompt: "0.001", completion: "0.002" },
        context_length: 4096,
      },
      {
        id: "meta-llama/llama-3.1-8b-instruct:free",
        name: "Llama 3.1 8B",
        pricing: { prompt: "0", completion: "0" },
        context_length: 8192,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await getFreeModels("test-api-key");

    expect(result).toHaveLength(2);
    expect(result.every((model) => model.id.endsWith(":free"))).toBe(true);
  });

  it("returns empty array when no free models available", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "openai/gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        pricing: { prompt: "0.001", completion: "0.002" },
        context_length: 4096,
      },
      {
        id: "openai/gpt-4",
        name: "GPT-4",
        pricing: { prompt: "0.03", completion: "0.06" },
        context_length: 8192,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await getFreeModels("test-api-key");

    expect(result).toEqual([]);
  });

  it("returns all free models when multiple exist", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "model-1:free",
        name: "Model 1",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
      {
        id: "model-2:free",
        name: "Model 2",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
      {
        id: "model-3:free",
        name: "Model 3",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await getFreeModels("test-api-key");

    expect(result).toHaveLength(3);
  });

  it("does not include paid models", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "model-1:free",
        name: "Model 1",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
      {
        id: "model-2:paid",
        name: "Model 2",
        pricing: { prompt: "0.01", completion: "0.02" },
        context_length: 4096,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await getFreeModels("test-api-key");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("model-1:free");
  });
});

describe("checkMultipleModels", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns correct availability map for multiple models", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "model-1",
        name: "Model 1",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
      {
        id: "model-2",
        name: "Model 2",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await checkMultipleModels("test-api-key", ["model-1", "model-2", "model-3"]);

    expect(result).toEqual({
      "model-1": true,
      "model-2": true,
      "model-3": false,
    });
  });

  it("returns true for available models", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "available-model",
        name: "Available Model",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await checkMultipleModels("test-api-key", ["available-model"]);

    expect(result["available-model"]).toBe(true);
  });

  it("returns false for unavailable models", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const result = await checkMultipleModels("test-api-key", ["unavailable-model"]);

    expect(result["unavailable-model"]).toBe(false);
  });

  it("handles mixed availability (some true, some false)", async () => {
    const mockModels: ModelInfo[] = [
      {
        id: "model-a",
        name: "Model A",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
      {
        id: "model-c",
        name: "Model C",
        pricing: { prompt: "0", completion: "0" },
        context_length: 4096,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockModels }),
    });

    const result = await checkMultipleModels("test-api-key", ["model-a", "model-b", "model-c"]);

    expect(result).toEqual({
      "model-a": true,
      "model-b": false,
      "model-c": true,
    });
  });

  it("handles empty input array", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const result = await checkMultipleModels("test-api-key", []);

    expect(result).toEqual({});
  });

  it("returns all false when no models available", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const result = await checkMultipleModels("test-api-key", ["model-1", "model-2"]);

    expect(result).toEqual({
      "model-1": false,
      "model-2": false,
    });
  });

  it("handles fetch error gracefully", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await checkMultipleModels("test-api-key", ["model-1", "model-2"]);

    expect(result).toEqual({
      "model-1": false,
      "model-2": false,
    });
  });
});
