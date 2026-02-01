# Page Object Model (POM) Structure

## Overview

This directory contains Page Object Model classes for E2E testing with Playwright. The POM pattern provides a maintainable, reusable, and scalable test architecture.

## Directory Structure

```
e2e/
├── pages/
│   ├── components/          # Reusable component classes
│   │   ├── BaseComponent.ts
│   │   ├── GenerationFormComponent.ts
│   │   ├── LoadingStateComponent.ts
│   │   ├── SuggestionCardComponent.ts
│   │   ├── SuggestionsListComponent.ts
│   │   ├── BulkActionsComponent.ts
│   │   └── index.ts
│   ├── BasePage.ts          # Base page class
│   ├── HomePage.ts          # Home page POM
│   ├── GenerationPage.ts    # Generation page POM
│   └── index.ts
├── generation.spec.ts       # Generation view tests
└── example.spec.ts
```

## Class Hierarchy

```
BasePage
  └── HomePage
  └── GenerationPage
      ├── GenerationFormComponent
      ├── LoadingStateComponent
      ├── SuggestionsListComponent
      │   └── SuggestionCardComponent (multiple instances)
      └── BulkActionsComponent

BaseComponent
  └── All component classes
```

## Core Classes

### BasePage

Base class for all page objects. Provides common page-level functionality:

- Navigation (`goto()`)
- Page title access
- Wait for page load
- Screenshot capture

### BaseComponent

Base class for all component objects. Provides common component-level functionality:

- Visibility checks
- Wait for visible/hidden
- Root locator access

## Page Objects

### GenerationPage

Main page for AI-powered flashcard generation.

**Components:**

- `form: GenerationFormComponent` - Form for text input and model selection
- `loading: LoadingStateComponent` - Loading state display
- `suggestions: SuggestionsListComponent` - List of flashcard suggestions
- `bulkActions: BulkActionsComponent` - Bulk operation controls

**Example Usage:**

```typescript
const generationPage = new GenerationPage(page);
await generationPage.navigate();
await generationPage.form.fillSourceText(text);
await generationPage.form.clickGenerate();
await generationPage.loading.waitForLoadingComplete();
await generationPage.suggestions.getFirstCard().check();
await generationPage.bulkActions.clickSaveSelected();
```

## Component Objects

### GenerationFormComponent

Handles the flashcard generation form.

**Key Methods:**

- `selectModel(modelValue: string)` - Select AI model
- `fillSourceText(text: string)` - Fill source text
- `clickGenerate()` - Submit form
- `submitWithKeyboard()` - Submit with Ctrl+Enter
- `verifyCharCount(count: number)` - Verify character counter
- `fillAndSubmit(text, model?)` - Helper for complete flow

**Example:**

```typescript
await generationPage.form.fillSourceText(validText);
await generationPage.form.verifyValidationMessage("Długość tekstu OK");
await generationPage.form.clickGenerate();
```

### LoadingStateComponent

Manages loading state interactions.

**Key Methods:**

- `waitForLoading()` - Wait for loading to appear
- `waitForLoadingComplete()` - Wait for loading to finish
- `verifyLoadingVisible()` - Assert loading is visible
- `clickCancel()` - Cancel operation (if available)

**Example:**

```typescript
await generationPage.loading.waitForLoading();
await generationPage.loading.verifyLoadingMessage("Generowanie fiszek w toku...");
await generationPage.loading.waitForLoadingComplete();
```

### SuggestionsListComponent

Manages the list of flashcard suggestions.

**Key Methods:**

- `getCard(index: number)` - Get specific card
- `getFirstCard()` - Get first card
- `getCardCount()` - Get total number of cards
- `checkCards(indices: number[])` - Check multiple cards
- `checkAllCards()` - Check all cards
- `rejectCard(index: number)` - Reject specific card
- `editCard(index, front, back)` - Edit specific card

**Example:**

```typescript
const cardCount = await generationPage.suggestions.getCardCount();
await generationPage.suggestions.checkCards([0, 1, 2]);
await generationPage.suggestions.verifyCardCount(cardCount);
```

### SuggestionCardComponent

Represents a single flashcard suggestion.

**Key Methods:**

- `check()` / `uncheck()` - Toggle checkbox
- `isChecked()` - Get checked state
- `getFrontText()` / `getBackText()` - Get card content
- `clickEdit()` - Enter edit mode
- `editFlashcard(front, back)` - Edit and save
- `cancelEdit()` - Cancel edit operation
- `clickReject()` - Reject the card
- `verifyContent(front, back)` - Assert card content

**Example:**

```typescript
const firstCard = generationPage.suggestions.getFirstCard();
await firstCard.check();
await firstCard.verifyChecked();
await firstCard.editFlashcard("New Question", "New Answer");
await firstCard.verifyEditedBadge();
```

### BulkActionsComponent

Handles bulk operations on flashcards.

**Key Methods:**

- `clickSaveAll()` - Save all flashcards
- `clickSaveSelected()` - Save selected flashcards
- `getSelectedCount()` - Get number of selected cards
- `verifySelectionCount(count)` - Verify selection counter
- `isSaveSelectedDisabled()` - Check if save selected is disabled

**Example:**

```typescript
await generationPage.bulkActions.verifySelectionCount(3);
await generationPage.bulkActions.clickSaveSelected();
await generationPage.bulkActions.verifyAcceptingState();
```

## Helper Methods

Each page object includes helper methods for common workflows:

**GenerationPage:**

- `completeGenerationFlow(text, model?)` - Complete form submission and generation
- `completeSaveSelectedFlow(indices)` - Check and save specific cards
- `completeSaveAllFlow()` - Save all cards

**Example:**

```typescript
// Complete generation in one step
await generationPage.completeGenerationFlow(validText);

// Complete save selected in one step
await generationPage.completeSaveSelectedFlow([0, 1, 2]);
```

## Test Organization

### Test Structure

```typescript
test.describe("Feature Area", () => {
  let generationPage: GenerationPage;

  test.beforeEach(async ({ page }) => {
    generationPage = new GenerationPage(page);
    await generationPage.navigate();
  });

  test("should do something", async () => {
    // Test implementation
  });
});
```

### Assertions

Use built-in `verify*` methods when available:

```typescript
// Preferred - built-in verification
await generationPage.form.verifyCharCount(1500);

// Also valid - direct assertion
await expect(generationPage.form.getCharCounterText()).resolves.toContain("1500");
```

## Data Test IDs

All components use `data-testid` attributes for reliable element selection:

| Component      | Test ID                | Description          |
| -------------- | ---------------------- | -------------------- |
| GenerationForm | `model-select`         | Model dropdown       |
| GenerationForm | `source-text-input`    | Text input           |
| GenerationForm | `generate-button`      | Submit button        |
| LoadingState   | `loading-state`        | Loading container    |
| SuggestionCard | `suggestion-card`      | Card container       |
| SuggestionCard | `flashcard-checkbox`   | Selection checkbox   |
| BulkActions    | `save-all-button`      | Save all button      |
| BulkActions    | `save-selected-button` | Save selected button |

See component files for complete list of test IDs.

## Best Practices

1. **Use POM methods instead of direct locators**

   ```typescript
   // Good
   await generationPage.form.clickGenerate();

   // Avoid
   await page.getByTestId("generate-button").click();
   ```

2. **Chain component interactions**

   ```typescript
   const card = generationPage.suggestions.getCard(0);
   await card.check();
   await card.editFlashcard("Front", "Back");
   await card.verifyEditedBadge();
   ```

3. **Use helper methods for common flows**

   ```typescript
   // Good - single method call
   await generationPage.completeGenerationFlow(text);

   // Avoid - multiple manual steps
   await generationPage.form.fillSourceText(text);
   await generationPage.form.clickGenerate();
   await generationPage.loading.waitForLoadingComplete();
   ```

4. **Leverage built-in verification methods**

   ```typescript
   // Good - clear intent
   await generationPage.verifySuccessMessage("zapisane pomyślnie");

   // Less clear
   await expect(page.getByTestId("success-message")).toContainText("zapisane");
   ```

5. **Keep tests readable**

   ```typescript
   test("should save selected flashcards", async () => {
     // Arrange
     await generationPage.completeGenerationFlow(validText);

     // Act
     await generationPage.suggestions.checkCards([0, 1, 2]);
     await generationPage.bulkActions.clickSaveSelected();

     // Assert
     await generationPage.verifySuccessMessage("3 fiszki zostały zapisane");
   });
   ```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/generation.spec.ts

# Run in UI mode
npx playwright test --ui

# Run with debug mode
npx playwright test --debug

# Generate test code
npx playwright codegen http://localhost:4321/generate
```

## Debugging

1. **Use trace viewer for failed tests**

   ```bash
   npx playwright show-trace trace.zip
   ```

2. **Use debug mode**

   ```typescript
   await page.pause(); // Pauses execution
   ```

3. **Take screenshots**
   ```typescript
   await generationPage.takeScreenshot("debug-state");
   ```

## Adding New Pages/Components

1. Create new class extending `BasePage` or `BaseComponent`
2. Define locators using `data-testid`
3. Implement interaction methods
4. Add verification methods
5. Export from `index.ts`
6. Document in this README

Example:

```typescript
import { BasePage } from "./BasePage";

export class NewPage extends BasePage {
  private readonly element = this.page.getByTestId("element");

  async interact() {
    await this.element.click();
  }

  async verifyState() {
    await expect(this.element).toBeVisible();
  }
}
```
