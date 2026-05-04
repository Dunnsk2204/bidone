/**
 * pages/CartPage.ts
 *
 * Page Object for the shopping cart and checkout flow.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  // Cart summary
  readonly cartItems: Locator;
  readonly subtotalText: Locator;
  readonly totalText: Locator;
  readonly emptyCartMessage: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

  this.cartItems = page.locator('[data-testid^="cart-row-"]');
    this.subtotalText = page.getByTestId('cart-subtotal');
    this.totalText = page.getByTestId('cart-total');
    this.emptyCartMessage = page.getByTestId('empty-cart').or(page.getByText(/your cart is empty|no items/i));
    this.checkoutButton = page.getByTestId('cart-checkout');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  /**
   * 
   * @param productName 
   * @param quantity 
   * Updates a specific products quantity
   */
  async updateProductQuantity(productName: string, quantity: number): Promise<void> {
    const beforeTotal = await this.totalText.textContent();

    const qtyInput = this.cartItems.filter({ hasText: productName }).first().locator('input[type="number"]');

    await expect(qtyInput).toBeVisible();
    await qtyInput.fill(String(quantity));
      await expect(qtyInput).toHaveValue(String(quantity));


    await expect(this.totalText).not.toHaveText(beforeTotal ?? '');
    await expect(this.totalText).toHaveText(/\$[\d,]+\.\d{2}/);
  }

  /**
   * 
   * @param productName 
   * 
   * Removes an item from the cart based on the productName param
   */
  async deleteProductFromCart(productName: string): Promise<void> {
    const row = this.cartItems.filter({ hasText: productName }).first();
    await expect(row).toBeVisible();

    const removeButton = row.locator('[data-testid^="cart-remove-"]');
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    // Wait for row to actually be removed from the DOM
    await expect(row).toHaveCount(0);
  }

  /**
   * 
   * @param productName 
   * @returns 
   * 
   * Gets the locator of the item in the cart by productName
   */
  getItemName(productName: string): Locator {
    return this.cartItems
      .filter({ has: this.page.locator('[data-testid^="cart-name-"]').filter({ hasText: productName }) })
      .locator('[data-testid^="cart-name-"]');
  }

  /**
   * Clicks the checkout button on the cart page and waits 
   * for navigation to the checkout page to complete
   */
  async clickContinueToCheckoutButton(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/\/checkout$/);
  }

}
