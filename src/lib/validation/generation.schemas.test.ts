import { describe, expect, it } from "vitest";
import {
  GenerateFlashcardsSchema,
  AcceptFlashcardSchema,
  AcceptGeneratedFlashcardsSchema,
  GetGenerationsSchema,
  ALLOWED_MODELS,
} from "./generation.schemas";

describe("GenerateFlashcardsSchema", () => {
  describe("source_text validation", () => {
    it("validates source_text min length (1000 characters)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    it("rejects source_text below 1000 characters", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(999),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Source text must be at least 1000 characters");
      }
    });

    it("validates source_text max length (10000 characters)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(10000),
      });
      expect(result.success).toBe(true);
    });

    it("rejects source_text exceeding 10000 characters", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(10001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Source text must not exceed 10000 characters");
      }
    });

    it("trims whitespace from source_text", () => {
      const text = "a".repeat(1000);
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: `  ${text}  `,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source_text).toBe(text);
      }
    });
  });

  describe("model validation", () => {
    it("sets default model to 'arcee-ai/trinity-large-preview:free'", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("arcee-ai/trinity-large-preview:free");
      }
    });

    it("validates model against ALLOWED_MODELS enum", () => {
      const validModel = ALLOWED_MODELS[0];
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        model: validModel,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe(validModel);
      }
    });

    it("rejects invalid model names", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        model: "invalid-model-name",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid model selected");
      }
    });

    it("accepts all models from ALLOWED_MODELS", () => {
      ALLOWED_MODELS.forEach((model) => {
        const result = GenerateFlashcardsSchema.safeParse({
          source_text: "a".repeat(1000),
          model,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.model).toBe(model);
        }
      });
    });
  });

  describe("count validation", () => {
    it("sets default count to 5", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(5);
      }
    });

    it("validates count is integer between 1-20", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        count: 10,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(10);
      }
    });

    it("accepts count of 1 (minimum)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        count: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(1);
      }
    });

    it("accepts count of 20 (maximum)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        count: 20,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(20);
      }
    });

    it("rejects count below 1", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        count: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Must generate at least 1 flashcard");
      }
    });

    it("rejects count above 20", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        count: 21,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Cannot generate more than 20 flashcards at once");
      }
    });

    it("rejects non-integer count", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        count: 5.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Count must be an integer");
      }
    });
  });

  describe("temperature validation", () => {
    it("sets default temperature to 0.7", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.7);
      }
    });

    it("validates temperature range (0-2)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        temperature: 1.5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(1.5);
      }
    });

    it("accepts temperature of 0 (minimum)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        temperature: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0);
      }
    });

    it("accepts temperature of 2 (maximum)", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        temperature: 2,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(2);
      }
    });

    it("rejects temperature below 0", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        temperature: -0.1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Temperature must be at least 0");
      }
    });

    it("rejects temperature above 2", () => {
      const result = GenerateFlashcardsSchema.safeParse({
        source_text: "a".repeat(1000),
        temperature: 2.1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Temperature must not exceed 2");
      }
    });
  });
});

describe("AcceptFlashcardSchema", () => {
  describe("front field validation", () => {
    it("validates front text required", () => {
      const result = AcceptFlashcardSchema.safeParse({
        back: "Valid back",
        edited: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Required");
      }
    });

    it("validates front text max 200 chars", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "a".repeat(200),
        back: "Valid back",
        edited: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects front text exceeding 200 chars", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "a".repeat(201),
        back: "Valid back",
        edited: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Front text exceeds 200 characters");
      }
    });

    it("trims whitespace from front", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "  Trimmed  ",
        back: "Valid back",
        edited: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("Trimmed");
      }
    });
  });

  describe("back field validation", () => {
    it("validates back text required", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "Valid front",
        edited: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Required");
      }
    });

    it("validates back text max 500 chars", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "Valid front",
        back: "a".repeat(500),
        edited: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects back text exceeding 500 chars", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "Valid front",
        back: "a".repeat(501),
        edited: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Back text exceeds 500 characters");
      }
    });

    it("trims whitespace from back", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "Valid front",
        back: "  Trimmed  ",
        edited: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.back).toBe("Trimmed");
      }
    });
  });

  describe("edited field validation", () => {
    it("requires edited boolean field", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "Valid front",
        back: "Valid back",
      });
      expect(result.success).toBe(false);
    });

    it("accepts edited as true", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "Valid front",
        back: "Valid back",
        edited: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.edited).toBe(true);
      }
    });

    it("accepts edited as false", () => {
      const result = AcceptFlashcardSchema.safeParse({
        front: "Valid front",
        back: "Valid back",
        edited: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.edited).toBe(false);
      }
    });
  });
});

describe("AcceptGeneratedFlashcardsSchema", () => {
  it("requires at least 1 flashcard", () => {
    const result = AcceptGeneratedFlashcardsSchema.safeParse({
      flashcards: [
        {
          front: "Valid front",
          back: "Valid back",
          edited: false,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = AcceptGeneratedFlashcardsSchema.safeParse({
      flashcards: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("At least one flashcard must be provided");
    }
  });

  it("rejects more than 100 flashcards", () => {
    const flashcards = Array.from({ length: 101 }, (_, i) => ({
      front: `Front ${i}`,
      back: `Back ${i}`,
      edited: false,
    }));
    const result = AcceptGeneratedFlashcardsSchema.safeParse({
      flashcards,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Cannot accept more than 100 flashcards at once");
    }
  });

  it("accepts exactly 100 flashcards", () => {
    const flashcards = Array.from({ length: 100 }, (_, i) => ({
      front: `Front ${i}`,
      back: `Back ${i}`,
      edited: false,
    }));
    const result = AcceptGeneratedFlashcardsSchema.safeParse({
      flashcards,
    });
    expect(result.success).toBe(true);
  });

  it("validates each flashcard using AcceptFlashcardSchema", () => {
    const result = AcceptGeneratedFlashcardsSchema.safeParse({
      flashcards: [
        {
          front: "Valid front 1",
          back: "Valid back 1",
          edited: false,
        },
        {
          front: "a".repeat(201), // Invalid: exceeds max length
          back: "Valid back 2",
          edited: false,
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Front text exceeds 200 characters");
    }
  });
});

describe("GetGenerationsSchema", () => {
  describe("page parameter", () => {
    it("coerces page to number with default 1", () => {
      const result = GetGenerationsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("coerces string to number", () => {
      const result = GetGenerationsSchema.safeParse({ page: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });

    it("validates min value 1", () => {
      const result = GetGenerationsSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("accepts positive integers", () => {
      const result = GetGenerationsSchema.safeParse({ page: 10 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(10);
      }
    });
  });

  describe("limit parameter", () => {
    it("coerces limit to number with default 20", () => {
      const result = GetGenerationsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("coerces string to number", () => {
      const result = GetGenerationsSchema.safeParse({ limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("validates min value 1", () => {
      const result = GetGenerationsSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it("validates max value 100", () => {
      const result = GetGenerationsSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it("accepts limit of exactly 100", () => {
      const result = GetGenerationsSchema.safeParse({ limit: 100 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });
  });

  describe("sort parameter", () => {
    it("sets default sort to 'created_at'", () => {
      const result = GetGenerationsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("accepts 'created_at' value", () => {
      const result = GetGenerationsSchema.safeParse({ sort: "created_at" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("rejects invalid sort values", () => {
      const result = GetGenerationsSchema.safeParse({ sort: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("order parameter", () => {
    it("sets default order to 'desc'", () => {
      const result = GetGenerationsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("accepts 'asc' value", () => {
      const result = GetGenerationsSchema.safeParse({ order: "asc" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("asc");
      }
    });

    it("accepts 'desc' value", () => {
      const result = GetGenerationsSchema.safeParse({ order: "desc" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("rejects invalid order values", () => {
      const result = GetGenerationsSchema.safeParse({ order: "invalid" });
      expect(result.success).toBe(false);
    });
  });
});
