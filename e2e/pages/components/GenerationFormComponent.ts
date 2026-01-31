import { expect, type Locator, type Page } from "@playwright/test";
import { BaseComponent } from "./BaseComponent";

/**
 * Page Object Model for Generation Form Component
 * Handles all interactions with the flashcard generation form
 */
export class GenerationFormComponent extends BaseComponent {
  // Locators
  private readonly modelSelect: Locator;
  private readonly sourceTextInput: Locator;
  private readonly charCounter: Locator;
  private readonly validationMessage: Locator;
  private readonly formError: Locator;
  private readonly generateButton: Locator;
  private readonly clearButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modelSelect = page.getByTestId("model-select");
    this.sourceTextInput = page.getByTestId("source-text-input");
    this.charCounter = page.getByTestId("char-counter");
    this.validationMessage = page.getByTestId("validation-message");
    this.formError = page.getByTestId("form-error");
    this.generateButton = page.getByTestId("generate-button");
    this.clearButton = page.getByTestId("clear-button");
  }

  /**
   * Select AI model from dropdown
   */
  async selectModel(modelValue: string) {
    await this.modelSelect.selectOption(modelValue);
  }

  /**
   * Fill source text input (reliable but slower for long texts)
   */
  async fillSourceText(text: string) {
    // Ensure the input is ready and visible
    await this.sourceTextInput.waitFor({ state: "visible" });

    // Clear any existing value first
    await this.sourceTextInput.clear();

    // Wait for counter to show 0 after clear
    await expect(this.charCounter).toContainText("0 /", { timeout: 2000 });

    const expectedCount = text.length;

    // Use pressSequentially which is faster than type() but still triggers React events properly
    // delay: 0 makes it as fast as possible while still firing events correctly
    await this.sourceTextInput.pressSequentially(text, { delay: 0 });

    // Wait for React to update the counter
    await expect(this.charCounter).toContainText(`${expectedCount} /`, { timeout: 5000 });
  }

  /**
   * Fill source text input fast (for validation tests with very long text)
   * Uses fill() which is instant but may not work in all scenarios
   */
  async fillSourceTextFast(text: string) {
    // Ensure the input is ready and visible
    await this.sourceTextInput.waitFor({ state: "visible" });

    // Clear any existing value first
    await this.sourceTextInput.clear();

    // Use fill() for instant input (works for most React components)
    await this.sourceTextInput.fill(text);

    // Wait a bit for React to process
    await this.page.waitForTimeout(200);

    // Verify counter updated (with longer timeout for large texts)
    const expectedCount = text.length;
    await expect(this.charCounter).toContainText(`${expectedCount} /`, { timeout: 5000 });
  }

  /**
   * Clear source text input
   */
  async clearSourceText() {
    await this.sourceTextInput.clear();
  }

  /**
   * Click clear button
   */
  async clickClear() {
    await this.clearButton.click();
  }

  /**
   * Click generate button
   */
  async clickGenerate() {
    await this.generateButton.click();
  }

  /**
   * Submit form using Ctrl+Enter shortcut
   */
  async submitWithKeyboard() {
    await this.sourceTextInput.press("Control+Enter");
  }

  /**
   * Get character counter text
   */
  async getCharCounterText() {
    return this.charCounter.textContent();
  }

  /**
   * Get validation message text
   */
  async getValidationMessageText() {
    return this.validationMessage.textContent();
  }

  /**
   * Get form error text
   */
  async getFormErrorText() {
    return this.formError.textContent();
  }

  /**
   * Check if generate button is disabled
   */
  async isGenerateButtonDisabled() {
    return this.generateButton.isDisabled();
  }

  /**
   * Verify generate button is disabled
   */
  async verifyGenerateButtonDisabled() {
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Verify generate button is enabled
   */
  async verifyGenerateButtonEnabled() {
    await expect(this.generateButton).toBeEnabled();
  }

  /**
   * Check if form is in generating state
   */
  async isGenerating() {
    const buttonText = await this.generateButton.textContent();
    return buttonText?.includes("Generowanie...");
  }

  /**
   * Verify character counter shows correct count
   */
  async verifyCharCount(expectedCount: number, maxCount = 10000) {
    await expect(this.charCounter).toContainText(`${expectedCount} / ${maxCount}`);
  }

  /**
   * Verify validation message is displayed
   */
  async verifyValidationMessage(expectedMessage: string) {
    await expect(this.validationMessage).toContainText(expectedMessage);
  }

  /**
   * Verify form error is displayed
   */
  async verifyFormError(expectedError: string) {
    await expect(this.formError).toContainText(expectedError);
  }

  /**
   * Verify character counter color indicates valid/invalid state
   */
  async verifyCharCounterColor(isValid: boolean) {
    if (isValid) {
      await expect(this.charCounter).toHaveClass(/text-green/);
    } else {
      await expect(this.charCounter).toHaveClass(/text-destructive/);
    }
  }

  /**
   * Fill form and submit (helper method)
   */
  async fillAndSubmit(text: string, model?: string) {
    if (model) {
      await this.selectModel(model);
    }
    await this.fillSourceText(text);
    await this.clickGenerate();
  }
}
