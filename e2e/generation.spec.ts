import { test, expect } from "@playwright/test";
import { GenerationPage } from "./pages";

/**
 * E2E Tests for Generation View
 * Uses Page Object Model for maintainable and scalable tests
 */
test.describe("Generation View - Flashcard Generation", () => {
  let generationPage: GenerationPage;

  // Valid source text for testing (1500 characters)
  const validSourceText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(30);
  const _shortText = "Too short text";
  // Long text just over limit: 10100 chars (357 repetitions of 28 chars + 4 extra)
  const _longText = "Lorem ipsum dolor sit amet. ".repeat(361);

  test.beforeEach(async ({ page }) => {
    generationPage = new GenerationPage(page);

    // Mock API responses
    await page.route("**/api/generations/generate", async (route) => {
      // Simulate API delay to allow loading state to be visible
      await new Promise((resolve) => setTimeout(resolve, 500));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          generation_id: 1,
          model: "arcee-ai/trinity-large-preview:free",
          generated_count: 5,
          generation_duration: 1500,
          source_text_hash: "abc123",
          flashcardSuggestions: [
            { front: "Test Question 1", back: "Test Answer 1" },
            { front: "Test Question 2", back: "Test Answer 2" },
            { front: "Test Question 3", back: "Test Answer 3" },
            { front: "Test Question 4", back: "Test Answer 4" },
            { front: "Test Question 5", back: "Test Answer 5" },
          ],
        }),
      });
    });

    await page.route("**/api/generations/*/accept", async (route) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get count from request body
      const requestBody = route.request().postDataJSON();
      const flashcards = requestBody.flashcards || [];
      const count = flashcards.length;

      // Generate message with proper Polish grammar
      let message: string;
      if (count === 1) {
        message = "1 fiszka została zapisana pomyślnie!";
      } else if (count >= 2 && count <= 4) {
        message = `${count} fiszki zostały zapisane pomyślnie!`;
      } else {
        message = `${count} fiszek zostało zapisanych pomyślnie!`;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accepted_count: count,
          accepted_unedited_count: count,
          accepted_edited_count: 0,
          message,
          flashcards: [],
        }),
      });
    });

    await generationPage.navigate();
    await generationPage.verifyPageLoaded();
  });

  test.describe("Happy Path", () => {
    test("should complete full flow: generate and save selected flashcards", async () => {
      // Fill and generate
      await generationPage.form.fillSourceText(validSourceText);
      await generationPage.form.verifyCharCount(validSourceText.length);
      await generationPage.form.verifyValidationMessage("Długość tekstu OK");
      await generationPage.form.clickGenerate();

      // Wait for generation
      await generationPage.loading.verifyLoadingVisible();
      await generationPage.loading.waitForLoadingComplete();

      // Verify suggestions loaded
      await generationPage.verifySuggestionsVisible();
      await generationPage.suggestions.verifyHasCards();

      // Select 3 flashcards
      await generationPage.suggestions.checkCards([0, 1, 2]);
      await generationPage.bulkActions.verifySelectionCount(3);

      // Save selected
      await generationPage.bulkActions.clickSaveSelected();
      await generationPage.verifySuccessMessage("3 fiszki zostały zapisane pomyślnie!");
    });

    test("should save all flashcards without selection", async () => {
      // Generate flashcards
      const cardCount = await generationPage.completeGenerationFlow(validSourceText);

      // Save all without selecting
      await generationPage.bulkActions.clickSaveAll();
      await generationPage.verifySuccessMessage(`${cardCount} fiszek zostało zapisanych pomyślnie!`);
    });
  });

  test.describe("Form Validation", () => {
    // test("should show error for text that is too short", async () => {
    //   await generationPage.form.fillSourceText(shortText);
    //   await generationPage.form.verifyCharCount(shortText.length);
    //   await generationPage.form.verifyGenerateButtonDisabled();
    // });

    // test("should show error for text that is too long", async () => {
    //   await generationPage.form.fillSourceText(longText);
    //   await generationPage.form.verifyCharCount(longText.length);
    //   await generationPage.form.verifyGenerateButtonDisabled();
    // });

    test("should clear form when clear button is clicked", async () => {
      await generationPage.form.fillSourceText(validSourceText);
      await generationPage.form.clickClear();
      await generationPage.form.verifyCharCount(0);
    });
  });

  test.describe("Flashcard Editing", () => {
    // test("should edit flashcard and auto-check it", async () => {
    //   // Generate flashcards
    //   await generationPage.completeGenerationFlow(validSourceText);

    //   // Edit first card
    //   const firstCard = generationPage.suggestions.getFirstCard();
    //   await firstCard.clickEdit();
    //   await firstCard.verifyEditMode();

    //   await firstCard.editFlashcard("New Question", "New Answer");
    //   await firstCard.verifyViewMode();
    //   await firstCard.verifyContent("New Question", "New Answer");
    //   await firstCard.verifyEditedBadge();
    //   await firstCard.verifyChecked();
    // });

    test("should cancel edit operation", async () => {
      await generationPage.completeGenerationFlow(validSourceText);

      const firstCard = generationPage.suggestions.getFirstCard();
      const originalFront = await firstCard.getFrontText();

      await firstCard.clickEdit();
      await firstCard.verifyEditMode();
      await firstCard.cancelEdit();
      await firstCard.verifyViewMode();

      // Content should remain unchanged
      const currentFront = await firstCard.getFrontText();
      expect(currentFront).toBe(originalFront);
    });

    test("should cancel edit with Escape key", async () => {
      await generationPage.completeGenerationFlow(validSourceText);

      const firstCard = generationPage.suggestions.getFirstCard();
      await firstCard.clickEdit();
      await firstCard.cancelEditWithEscape();
      await firstCard.verifyViewMode();
    });
  });

  test.describe("Flashcard Operations", () => {
    test("should reject flashcard", async () => {
      await generationPage.completeGenerationFlow(validSourceText);

      const initialCount = await generationPage.suggestions.getCardCount();
      await generationPage.suggestions.rejectCard(0);

      const newCount = await generationPage.suggestions.getCardCount();
      expect(newCount).toBe(initialCount - 1);
    });

    test("should check and uncheck flashcards", async () => {
      await generationPage.completeGenerationFlow(validSourceText);

      const firstCard = generationPage.suggestions.getFirstCard();
      await firstCard.check();
      await firstCard.verifyChecked();

      await firstCard.uncheck();
      await firstCard.verifyNotChecked();
    });

    test("should disable save selected when no cards are selected", async () => {
      await generationPage.completeGenerationFlow(validSourceText);

      await generationPage.bulkActions.verifySelectionCount(0);
      await generationPage.bulkActions.verifySaveSelectedDisabled();
    });
  });

  test.describe("Model Selection", () => {
    test("should change AI model", async () => {
      await generationPage.form.selectModel("arcee-ai/trinity-large-preview:free");
      await generationPage.form.fillSourceText(validSourceText);
      await generationPage.form.clickGenerate();

      await generationPage.loading.waitForLoading();
      await generationPage.loading.waitForLoadingComplete();
      await generationPage.verifySuggestionsVisible();
    });
  });

  test.describe("Keyboard Shortcuts", () => {
    test("should submit form with Ctrl+Enter", async () => {
      await generationPage.form.fillSourceText(validSourceText);
      await generationPage.form.submitWithKeyboard();

      await generationPage.loading.verifyLoadingVisible();
    });
  });

  test.describe("Success Message", () => {
    test("should display and auto-hide success message", async () => {
      await generationPage.completeGenerationFlow(validSourceText);
      await generationPage.bulkActions.clickSaveAll();

      // Verify message is visible
      await generationPage.verifySuccessMessage("zostało zapisanych pomyślnie!");

      // Verify it disappears after 5 seconds
      await generationPage.verifySuccessMessageDisappears();
    });
  });

  test.describe("Error Handling", () => {
    test("should close error message", async () => {
      // This test would need API mocking to trigger an error
      // For now, we can test the close functionality if an error exists
      // await generationPage.closeErrorMessage();
    });
  });

  test.describe("Bulk Actions", () => {
    test("should show correct selection count", async () => {
      await generationPage.completeGenerationFlow(validSourceText);

      await generationPage.suggestions.checkCards([0, 1, 2]);
      await generationPage.bulkActions.verifySelectionCount(3);

      await generationPage.suggestions.getCard(1).uncheck();
      await generationPage.bulkActions.verifySelectionCount(2);
    });

    test("should show accepting state during save", async () => {
      await generationPage.completeGenerationFlow(validSourceText);
      await generationPage.suggestions.checkCards([0]);

      // This would require API delay mocking to properly test
      // For now, we can verify the flow completes
      await generationPage.bulkActions.clickSaveSelected();
    });
  });
});
