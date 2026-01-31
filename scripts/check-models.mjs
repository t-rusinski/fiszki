#!/usr/bin/env node

/**
 * Script do sprawdzania dostępności modeli OpenRouter
 *
 * Użycie:
 *   node scripts/check-models.mjs
 */

import { config } from 'dotenv';

// Load .env file
config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODELS_TO_CHECK = [
  "mistralai/mistral-7b-instruct:free",
  "google/gemini-flash-1.5:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "qwen/qwen-2-7b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "openai/gpt-oss-20b:free",
];

async function fetchAvailableModels() {
  if (!OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not found in .env");
    process.exit(1);
  }

  console.log("🔍 Sprawdzanie dostępności modeli...\n");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const availableModels = new Set(data.data.map((m) => m.id));

    console.log("Wyniki sprawdzenia:\n");
    console.log("Status | Model");
    console.log("-------|------");

    for (const modelId of MODELS_TO_CHECK) {
      const isAvailable = availableModels.has(modelId);
      const status = isAvailable ? "✅ OK " : "❌ BRAK";
      console.log(`${status} | ${modelId}`);
    }

    console.log("\n📊 Podsumowanie:");
    const available = MODELS_TO_CHECK.filter((id) => availableModels.has(id));
    const unavailable = MODELS_TO_CHECK.filter((id) => !availableModels.has(id));

    console.log(`Dostępne: ${available.length}/${MODELS_TO_CHECK.length}`);

    if (unavailable.length > 0) {
      console.log("\n⚠️  Niedostępne modele:");
      unavailable.forEach((id) => console.log(`   - ${id}`));
    }

    console.log("\n💡 Sprawdź więcej na: https://openrouter.ai/models");
  } catch (error) {
    console.error("❌ Błąd:", error.message);
    process.exit(1);
  }
}

fetchAvailableModels();
