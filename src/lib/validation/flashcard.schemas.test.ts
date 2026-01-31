import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { FlashcardSource } from "@/types";
import {
  CreateFlashcardSchema,
  CreateMultipleFlashcardsSchema,
  UpdateFlashcardSchema,
  GetFlashcardsSchema,
  FlashcardIdSchema,
} from "./flashcard.schemas";

describe("CreateFlashcardSchema", () => {
  describe("front field validation", () => {
    it("validates front text min length (1 character)", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "A",
        back: "Valid back text",
      });
      expect(result.success).toBe(true);
    });

    it("validates front text max length (200 characters)", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "a".repeat(200),
        back: "Valid back text",
      });
      expect(result.success).toBe(true);
    });

    it("rejects front text exceeding 200 characters", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "a".repeat(201),
        back: "Valid back text",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Front text must be at most 200 characters");
      }
    });

    it("trims whitespace from front", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "  Trimmed  ",
        back: "Valid back text",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("Trimmed");
      }
    });

    it("requires front field", () => {
      const result = CreateFlashcardSchema.safeParse({
        back: "Valid back text",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Required");
      }
    });

    it("rejects empty front text after trim", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "   ",
        back: "Valid back text",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Front text is required");
      }
    });
  });

  describe("back field validation", () => {
    it("validates back text min length (1 character)", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "A",
      });
      expect(result.success).toBe(true);
    });

    it("validates back text max length (500 characters)", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it("rejects back text exceeding 500 characters", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "a".repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Back text must be at most 500 characters");
      }
    });

    it("trims whitespace from back", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "  Trimmed  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.back).toBe("Trimmed");
      }
    });

    it("requires back field", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Required");
      }
    });

    it("rejects empty back text after trim", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "   ",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Back text is required");
      }
    });
  });

  describe("source field validation", () => {
    it("sets default source to 'manual' when not provided", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe(FlashcardSource.Manual);
      }
    });

    it("accepts valid source value 'manual'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.Manual,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe(FlashcardSource.Manual);
      }
    });

    it("accepts valid source value 'ai-full'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.AiFull,
        generation_id: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe(FlashcardSource.AiFull);
      }
    });

    it("accepts valid source value 'ai-edited'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.AiEdited,
        generation_id: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe(FlashcardSource.AiEdited);
      }
    });

    it("rejects invalid source value", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: "invalid-source",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("generation_id refinement rules", () => {
    it("requires generation_id when source is 'ai-full'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.AiFull,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "generation_id is required when source is ai-full or ai-edited"
        );
        expect(result.error.errors[0].path).toContain("generation_id");
      }
    });

    it("requires generation_id when source is 'ai-edited'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.AiEdited,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "generation_id is required when source is ai-full or ai-edited"
        );
        expect(result.error.errors[0].path).toContain("generation_id");
      }
    });

    it("allows null generation_id when source is 'manual'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.Manual,
        generation_id: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generation_id).toBe(null);
      }
    });

    it("accepts generation_id when source is 'ai-full'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.AiFull,
        generation_id: 123,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generation_id).toBe(123);
      }
    });

    it("accepts generation_id when source is 'ai-edited'", () => {
      const result = CreateFlashcardSchema.safeParse({
        front: "Valid front text",
        back: "Valid back text",
        source: FlashcardSource.AiEdited,
        generation_id: 456,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generation_id).toBe(456);
      }
    });
  });
});

describe("CreateMultipleFlashcardsSchema", () => {
  it("requires at least 1 flashcard in array", () => {
    const result = CreateMultipleFlashcardsSchema.safeParse({
      flashcards: [
        {
          front: "Front 1",
          back: "Back 1",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = CreateMultipleFlashcardsSchema.safeParse({
      flashcards: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("At least one flashcard is required");
    }
  });

  it("rejects more than 100 flashcards at once", () => {
    const flashcards = Array.from({ length: 101 }, (_, i) => ({
      front: `Front ${i}`,
      back: `Back ${i}`,
    }));
    const result = CreateMultipleFlashcardsSchema.safeParse({
      flashcards,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Maximum 100 flashcards can be created at once");
    }
  });

  it("validates each flashcard in array using CreateFlashcardSchema", () => {
    const result = CreateMultipleFlashcardsSchema.safeParse({
      flashcards: [
        {
          front: "Valid front 1",
          back: "Valid back 1",
        },
        {
          front: "a".repeat(201), // Invalid: exceeds max length
          back: "Valid back 2",
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Front text must be at most 200 characters");
    }
  });

  it("accepts exactly 100 flashcards", () => {
    const flashcards = Array.from({ length: 100 }, (_, i) => ({
      front: `Front ${i}`,
      back: `Back ${i}`,
    }));
    const result = CreateMultipleFlashcardsSchema.safeParse({
      flashcards,
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateFlashcardSchema", () => {
  describe("front field validation", () => {
    it("validates front max length (200 characters)", () => {
      const result = UpdateFlashcardSchema.safeParse({
        front: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });

    it("rejects front exceeding max length", () => {
      const result = UpdateFlashcardSchema.safeParse({
        front: "a".repeat(201),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Front text must be at most 200 characters");
      }
    });

    it("trims whitespace from front", () => {
      const result = UpdateFlashcardSchema.safeParse({
        front: "  Trimmed  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("Trimmed");
      }
    });
  });

  describe("back field validation", () => {
    it("validates back max length (500 characters)", () => {
      const result = UpdateFlashcardSchema.safeParse({
        back: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it("rejects back exceeding max length", () => {
      const result = UpdateFlashcardSchema.safeParse({
        back: "a".repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Back text must be at most 500 characters");
      }
    });

    it("trims whitespace from back", () => {
      const result = UpdateFlashcardSchema.safeParse({
        back: "  Trimmed  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.back).toBe("Trimmed");
      }
    });
  });

  describe("refinement rules", () => {
    it("requires at least one field (front or back) to be provided", () => {
      const result = UpdateFlashcardSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("At least one field (front or back) must be provided");
      }
    });

    it("rejects update with neither front nor back", () => {
      const result = UpdateFlashcardSchema.safeParse({
        other_field: "value",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("At least one field (front or back) must be provided");
      }
    });

    it("accepts update with only front", () => {
      const result = UpdateFlashcardSchema.safeParse({
        front: "Updated front",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("Updated front");
        expect(result.data.back).toBeUndefined();
      }
    });

    it("accepts update with only back", () => {
      const result = UpdateFlashcardSchema.safeParse({
        back: "Updated back",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.back).toBe("Updated back");
        expect(result.data.front).toBeUndefined();
      }
    });

    it("accepts update with both front and back", () => {
      const result = UpdateFlashcardSchema.safeParse({
        front: "Updated front",
        back: "Updated back",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("Updated front");
        expect(result.data.back).toBe("Updated back");
      }
    });
  });
});

describe("GetFlashcardsSchema", () => {
  describe("page parameter", () => {
    it("transforms string page to number with default 1", () => {
      const result = GetFlashcardsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("transforms null to default 1", () => {
      const result = GetFlashcardsSchema.safeParse({ page: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("validates page is positive integer", () => {
      const result = GetFlashcardsSchema.safeParse({ page: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });

    it("rejects negative page value", () => {
      const result = GetFlashcardsSchema.safeParse({ page: "-1" });
      expect(result.success).toBe(false);
    });

    it("rejects zero page value", () => {
      const result = GetFlashcardsSchema.safeParse({ page: "0" });
      expect(result.success).toBe(false);
    });
  });

  describe("limit parameter", () => {
    it("transforms string limit to number with default 20", () => {
      const result = GetFlashcardsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("transforms null to default 20", () => {
      const result = GetFlashcardsSchema.safeParse({ limit: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("validates limit is positive integer", () => {
      const result = GetFlashcardsSchema.safeParse({ limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("enforces max limit of 100", () => {
      const result = GetFlashcardsSchema.safeParse({ limit: "101" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Limit cannot exceed 100");
      }
    });

    it("accepts limit of exactly 100", () => {
      const result = GetFlashcardsSchema.safeParse({ limit: "100" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it("rejects negative limit value", () => {
      const result = GetFlashcardsSchema.safeParse({ limit: "-1" });
      expect(result.success).toBe(false);
    });

    it("rejects zero limit value", () => {
      const result = GetFlashcardsSchema.safeParse({ limit: "0" });
      expect(result.success).toBe(false);
    });
  });

  describe("sort parameter", () => {
    it("sets default sort to 'created_at'", () => {
      const result = GetFlashcardsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("transforms null to 'created_at'", () => {
      const result = GetFlashcardsSchema.safeParse({ sort: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("accepts valid sort value 'created_at'", () => {
      const result = GetFlashcardsSchema.safeParse({ sort: "created_at" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("accepts valid sort value 'updated_at'", () => {
      const result = GetFlashcardsSchema.safeParse({ sort: "updated_at" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("updated_at");
      }
    });

    it("accepts valid sort value 'front'", () => {
      const result = GetFlashcardsSchema.safeParse({ sort: "front" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("front");
      }
    });

    it("rejects invalid sort value", () => {
      const result = GetFlashcardsSchema.safeParse({ sort: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("order parameter", () => {
    it("sets default order to 'desc'", () => {
      const result = GetFlashcardsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("transforms null to 'desc'", () => {
      const result = GetFlashcardsSchema.safeParse({ order: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("accepts valid order value 'asc'", () => {
      const result = GetFlashcardsSchema.safeParse({ order: "asc" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("asc");
      }
    });

    it("accepts valid order value 'desc'", () => {
      const result = GetFlashcardsSchema.safeParse({ order: "desc" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("rejects invalid order value", () => {
      const result = GetFlashcardsSchema.safeParse({ order: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("source parameter", () => {
    it("transforms null to undefined", () => {
      const result = GetFlashcardsSchema.safeParse({ source: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBeUndefined();
      }
    });

    it("filters source by valid FlashcardSource enum value 'manual'", () => {
      const result = GetFlashcardsSchema.safeParse({ source: FlashcardSource.Manual });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe(FlashcardSource.Manual);
      }
    });

    it("filters source by valid FlashcardSource enum value 'ai-full'", () => {
      const result = GetFlashcardsSchema.safeParse({ source: FlashcardSource.AiFull });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe(FlashcardSource.AiFull);
      }
    });

    it("filters source by valid FlashcardSource enum value 'ai-edited'", () => {
      const result = GetFlashcardsSchema.safeParse({ source: FlashcardSource.AiEdited });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe(FlashcardSource.AiEdited);
      }
    });

    it("rejects invalid source value", () => {
      const result = GetFlashcardsSchema.safeParse({ source: "invalid" });
      expect(result.success).toBe(false);
    });
  });
});

describe("FlashcardIdSchema", () => {
  it("transforms string ID to number", () => {
    const result = FlashcardIdSchema.safeParse({ id: "123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(123);
    }
  });

  it("validates ID is positive integer", () => {
    const result = FlashcardIdSchema.safeParse({ id: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(42);
    }
  });

  it("rejects negative ID", () => {
    const result = FlashcardIdSchema.safeParse({ id: "-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid flashcard ID");
    }
  });

  it("rejects zero ID", () => {
    const result = FlashcardIdSchema.safeParse({ id: "0" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid flashcard ID");
    }
  });

  it("rejects non-numeric strings", () => {
    const result = FlashcardIdSchema.safeParse({ id: "not-a-number" });
    expect(result.success).toBe(false);
  });

  it("parses float strings as integers", () => {
    const result = FlashcardIdSchema.safeParse({ id: "12.5" });
    expect(result.success).toBe(true);
    if (result.success) {
      // parseInt converts "12.5" to 12
      expect(result.data.id).toBe(12);
    }
  });
});
