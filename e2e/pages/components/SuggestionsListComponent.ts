import { expect, type Locator, type Page } from "@playwright/test";
import { BaseComponent } from "./BaseComponent";
import { SuggestionCardComponent } from "./SuggestionCardComponent";

/**
 * Page Object Model for Suggestions List Component
 * Manages the list of flashcard suggestions
 */
export class SuggestionsListComponent extends BaseComponent {
  // Locators
  private readonly suggestionsList: Locator;
  private readonly suggestionsGrid: Locator;

  constructor(page: Page) {
    const rootLocator = page.getByTestId("suggestions-list");
    super(page, rootLocator);
    this.suggestionsList = rootLocator;
    this.suggestionsGrid = page.getByTestId("suggestions-grid");
  }

  /**
   * Get all suggestion cards
   */
  private getAllCards() {
    return this.suggestionsGrid.getByTestId("suggestion-card");
  }

  /**
   * Get suggestion card by index
   */
  getCard(index: number): SuggestionCardComponent {
    const cardLocator = this.getAllCards().nth(index);
    return new SuggestionCardComponent(cardLocator);
  }

  /**
   * Wait for cards to be loaded
   */
  async waitForCards() {
    await this.getAllCards().first().waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Get first suggestion card
   */
  getFirstCard(): SuggestionCardComponent {
    return this.getCard(0);
  }

  /**
   * Get last suggestion card
   */
  getLastCard(): SuggestionCardComponent {
    return new SuggestionCardComponent(this.getAllCards().last());
  }

  /**
   * Get total number of cards
   */
  async getCardCount() {
    return this.getAllCards().count();
  }

  /**
   * Check all cards
   */
  async checkAllCards() {
    const count = await this.getCardCount();
    for (let i = 0; i < count; i++) {
      await this.getCard(i).check();
    }
  }

  /**
   * Check multiple cards by indices
   */
  async checkCards(indices: number[]) {
    for (const index of indices) {
      await this.getCard(index).check();
    }
  }

  /**
   * Uncheck all cards
   */
  async uncheckAllCards() {
    const count = await this.getCardCount();
    for (let i = 0; i < count; i++) {
      await this.getCard(i).uncheck();
    }
  }

  /**
   * Get count of checked cards
   */
  async getCheckedCount() {
    const count = await this.getCardCount();
    let checkedCount = 0;
    for (let i = 0; i < count; i++) {
      if (await this.getCard(i).isChecked()) {
        checkedCount++;
      }
    }
    return checkedCount;
  }

  /**
   * Reject card by index
   */
  async rejectCard(index: number) {
    await this.getCard(index).clickReject();
  }

  /**
   * Edit card by index
   */
  async editCard(index: number, newFront: string, newBack: string) {
    await this.getCard(index).editFlashcard(newFront, newBack);
  }

  /**
   * Verify suggestions list is visible
   */
  async verifySuggestionsVisible() {
    await expect(this.suggestionsList).toBeVisible();
  }

  /**
   * Verify card count
   */
  async verifyCardCount(expectedCount: number) {
    await expect(this.getAllCards()).toHaveCount(expectedCount);
  }

  /**
   * Verify at least one card exists
   */
  async verifyHasCards() {
    const count = await this.getCardCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Wait for suggestions to load
   */
  async waitForSuggestions() {
    await this.suggestionsList.waitFor({ state: "visible" });
    await expect(this.getAllCards().first()).toBeVisible();
  }
}
