/**
 * Pomocnicze funkcje do sprawdzania dostępności modeli OpenRouter
 */

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

/**
 * Pobiera listę dostępnych modeli z OpenRouter API
 * @param apiKey - Klucz API OpenRouter
 * @returns Lista dostępnych modeli
 */
export async function fetchAvailableModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return data.data as ModelInfo[];
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
}

/**
 * Sprawdza, czy konkretny model jest dostępny
 * @param apiKey - Klucz API OpenRouter
 * @param modelId - ID modelu do sprawdzenia (np. "mistralai/mistral-7b-instruct:free")
 * @returns True jeśli model jest dostępny
 */
export async function isModelAvailable(apiKey: string, modelId: string): Promise<boolean> {
  const models = await fetchAvailableModels(apiKey);
  return models.some((model) => model.id === modelId);
}

/**
 * Pobiera informacje o darmowych modelach
 * @param apiKey - Klucz API OpenRouter
 * @returns Lista darmowych modeli
 */
export async function getFreeModels(apiKey: string): Promise<ModelInfo[]> {
  const models = await fetchAvailableModels(apiKey);
  return models.filter((model) => model.id.endsWith(":free"));
}

/**
 * Sprawdza status wielu modeli jednocześnie
 * @param apiKey - Klucz API OpenRouter
 * @param modelIds - Lista ID modeli do sprawdzenia
 * @returns Mapa modelId → dostępność (true/false)
 */
export async function checkMultipleModels(
  apiKey: string,
  modelIds: string[]
): Promise<Record<string, boolean>> {
  const models = await fetchAvailableModels(apiKey);
  const availableIds = new Set(models.map((m) => m.id));

  const result: Record<string, boolean> = {};
  for (const modelId of modelIds) {
    result[modelId] = availableIds.has(modelId);
  }
  return result;
}
