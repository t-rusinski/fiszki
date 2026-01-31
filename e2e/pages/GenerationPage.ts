import { expect, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { GenerationFormComponent } from "./components/GenerationFormComponent";
import { LoadingStateComponent } from "./components/LoadingStateComponent";
import { SuggestionsListComponent } from "./components/SuggestionsListComponent";
import { BulkActionsComponent } from "./components/BulkActionsComponent";

/**
 * Page Object Model for Generation Page
 * Main page for AI-powered flashcard generation
 */
export class GenerationPage extends BasePage {
  // Components
  readonly form: GenerationFormComponent;
  readonly loading: LoadingStateComponent;
  readonly suggestions: SuggestionsListComponent;
  readonly bulkActions: BulkActionsComponent;

  // Page-level locators
  private readonly successMessage = this.page.getByTestId("success-message");
  private readonly errorMessage = this.page.getByTestId("error-message");
  private readonly errorMessageText = this.page.getByTestId("error-message-text");
  private readonly errorCloseButton = this.page.getByTestId("error-message-close");
  private readonly suggestionsContainer = this.page.getByTestId("suggestions-container");

  constructor(page: Page) {
    super(page);
    this.form = new GenerationFormComponent(page);
    this.loading = new LoadingStateComponent(page);
    this.suggestions = new SuggestionsListComponent(page);
    this.bulkActions = new BulkActionsComponent(page);
  }

  /**
   * Navigate to generation page
   */
  async navigate() {
    await this.goto("/generate");
  }

  /**
   * Get success message text
   */
  async getSuccessMessage() {
    return this.successMessage.textContent();
  }

  /**
   * Get error message text
   */
  async getErrorMessage() {
    return this.errorMessageText.textContent();
  }

  /**
   * Close error message
   */
  async closeErrorMessage() {
    await this.errorCloseButton.click();
  }

  /**
   * Check if success message is visible
   */
  async isSuccessMessageVisible() {
    return this.successMessage.isVisible();
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible() {
    return this.errorMessage.isVisible();
  }

  /**
   * Check if suggestions are visible
   */
  async areSuggestionsVisible() {
    return this.suggestionsContainer.isVisible();
  }

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded() {
    // Verify generation form is visible
    await expect(this.page.getByTestId("source-text-input")).toBeVisible();
    await expect(this.page.getByTestId("generate-button")).toBeVisible();
  }

  /**
   * Verify success message is displayed
   */
  async verifySuccessMessage(expectedMessage: string) {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toContainText(expectedMessage);
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorMessage(expectedMessage: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessageText).toContainText(expectedMessage);
  }

  /**
   * Verify success message disappears after timeout
   */
  async verifySuccessMessageDisappears(timeout = 6000) {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).not.toBeVisible({ timeout });
  }

  /**
   * Verify suggestions container is visible
   */
  async verifySuggestionsVisible() {
    await expect(this.suggestionsContainer).toBeVisible();
  }

  /**
   * Complete full generation flow (helper method)
   * Fills form, submits, waits for generation, returns suggestion count
   */
  async completeGenerationFlow(sourceText: string, model?: string): Promise<number> {
    await this.form.fillAndSubmit(sourceText, model);
    await this.loading.waitForLoading();
    await this.loading.waitForLoadingComplete();
    await this.verifySuggestionsVisible();
    await this.suggestions.waitForCards();
    return this.suggestions.getCardCount();
  }

  /**
   * Complete full save flow (helper method)
   * Checks specified cards and saves them
   */
  async completeSaveSelectedFlow(cardIndices: number[]) {
    await this.suggestions.checkCards(cardIndices);
    await this.bulkActions.verifySelectionCount(cardIndices.length);
    await this.bulkActions.clickSaveSelected();
    await this.verifySuccessMessage("zostały zapisane");
  }

  /**
   * Complete save all flow (helper method)
   */
  async completeSaveAllFlow() {
    const cardCount = await this.suggestions.getCardCount();
    await this.bulkActions.clickSaveAll();
    await this.verifySuccessMessage("zostało zapisanych");
    return cardCount;
  }
}
