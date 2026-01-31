import { expect, type Locator } from "@playwright/test";
import { BaseComponent } from "./BaseComponent";

/**
 * Page Object Model for Suggestion Card Component
 * Represents a single flashcard suggestion
 */
export class SuggestionCardComponent extends BaseComponent {
  // Locators
  private readonly checkbox: Locator;
  private readonly frontText: Locator;
  private readonly backText: Locator;
  private readonly editButton: Locator;
  private readonly rejectButton: Locator;
  private readonly editedBadge: Locator;
  private readonly viewMode: Locator;
  private readonly editMode: Locator;
  private readonly editFrontInput: Locator;
  private readonly editBackInput: Locator;
  private readonly saveEditButton: Locator;
  private readonly cancelEditButton: Locator;

  constructor(cardLocator: Locator) {
    super(cardLocator.page(), cardLocator);
    this.checkbox = cardLocator.getByTestId("flashcard-checkbox");
    this.frontText = cardLocator.getByTestId("flashcard-front");
    this.backText = cardLocator.getByTestId("flashcard-back");
    this.editButton = cardLocator.getByTestId("edit-flashcard-button");
    this.rejectButton = cardLocator.getByTestId("reject-flashcard-button");
    this.editedBadge = cardLocator.getByTestId("edited-badge");
    this.viewMode = cardLocator.getByTestId("view-mode");
    this.editMode = cardLocator.getByTestId("edit-mode");
    this.editFrontInput = cardLocator.getByTestId("edit-front-input");
    this.editBackInput = cardLocator.getByTestId("edit-back-input");
    this.saveEditButton = cardLocator.getByTestId("save-edit-button");
    this.cancelEditButton = cardLocator.getByTestId("cancel-edit-button");
  }

  /**
   * Check the flashcard checkbox
   */
  async check() {
    await this.checkbox.check();
  }

  /**
   * Uncheck the flashcard checkbox
   */
  async uncheck() {
    await this.checkbox.uncheck();
  }

  /**
   * Get checked state
   */
  async isChecked() {
    return this.checkbox.isChecked();
  }

  /**
   * Get front text content
   */
  async getFrontText() {
    return this.frontText.textContent();
  }

  /**
   * Get back text content
   */
  async getBackText() {
    return this.backText.textContent();
  }

  /**
   * Click edit button
   */
  async clickEdit() {
    await this.editButton.waitFor({ state: "visible", timeout: 10000 });
    await this.editButton.click();
  }

  /**
   * Click reject button
   */
  async clickReject() {
    await this.rejectButton.click();
  }

  /**
   * Enter edit mode and modify flashcard
   */
  async editFlashcard(newFront: string, newBack: string) {
    await this.clickEdit();
    await this.editMode.waitFor({ state: "visible" });
    await this.editFrontInput.fill(newFront);
    await this.editBackInput.fill(newBack);
    await this.saveEditButton.click();
    await this.viewMode.waitFor({ state: "visible" });
  }

  /**
   * Cancel edit operation
   */
  async cancelEdit() {
    await this.cancelEditButton.click();
    await this.viewMode.waitFor({ state: "visible" });
  }

  /**
   * Cancel edit using Escape key
   */
  async cancelEditWithEscape() {
    await this.editFrontInput.press("Escape");
    await this.viewMode.waitFor({ state: "visible" });
  }

  /**
   * Check if card is in edit mode
   */
  async isInEditMode() {
    return this.editMode.isVisible();
  }

  /**
   * Check if card is in view mode
   */
  async isInViewMode() {
    return this.viewMode.isVisible();
  }

  /**
   * Check if edited badge is visible
   */
  async isEdited() {
    return this.editedBadge.isVisible();
  }

  /**
   * Verify flashcard content
   */
  async verifyContent(expectedFront: string, expectedBack: string) {
    await expect(this.frontText).toContainText(expectedFront);
    await expect(this.backText).toContainText(expectedBack);
  }

  /**
   * Verify flashcard is checked
   */
  async verifyChecked() {
    await expect(this.checkbox).toBeChecked();
  }

  /**
   * Verify flashcard is not checked
   */
  async verifyNotChecked() {
    await expect(this.checkbox).not.toBeChecked();
  }

  /**
   * Verify edited badge is visible
   */
  async verifyEditedBadge() {
    await expect(this.editedBadge).toBeVisible();
  }

  /**
   * Verify in edit mode
   */
  async verifyEditMode() {
    await expect(this.editMode).toBeVisible();
    await expect(this.viewMode).not.toBeVisible();
  }

  /**
   * Verify in view mode
   */
  async verifyViewMode() {
    await expect(this.viewMode).toBeVisible();
    await expect(this.editMode).not.toBeVisible();
  }
}
