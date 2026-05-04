/**
 * pages/ProductsPage.ts
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { NavBar } from './NavBar';
import { ProductCard } from './ProductCard';

export class ProductsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly productCards: Locator;
  readonly navBar: NavBar;

  constructor(page: Page) {
    this.page         = page;
    this.navBar       = new NavBar(page);
    this.searchInput  = page.getByTestId('filter-search')
      .or(page.getByPlaceholder(/search/i))
      .or(page.getByRole('searchbox'));
    this.productCards = page.locator('[data-testid^="product-card-"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByTestId('product-grid')).toBeVisible();
    await expect(this.productCards.first()).toBeVisible();
  }

  async searchProduct(term: string): Promise<void> {
    const beforeCount = await this.productCards.count();
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
    await expect.poll(() => this.productCards.count()).not.toBe(beforeCount);
  }

  /**
   * 
   * @param category 
   * Selects a category from the dropdown menu to filter the products
   * and waits for the DOM to update.
   */
  async selectCategory(category: string): Promise<void> {
    const beforeCount = await this.productCards.count();
    await this.page.getByTestId('filter-category').selectOption({ label: category });
    await expect.poll(() => this.productCards.count()).not.toBe(beforeCount);  
  }

  /**
   * Returns a ProductCard component object for the named product.
   * Use this to assert on individual card elements.
   */
  getProductCard(productName: string): ProductCard {
    return new ProductCard(
      this.productCards.filter({ hasText: productName }).first(),
    );
  }

  /**
   * Returns the button on a product card by button name.
   * Useful for asserting button state without interacting.
   */
  getProductCardButton(productName: string, buttonName: string | RegExp): Locator {
    return this.getProductCard(productName).card.getByRole('button', { name: buttonName });
  }

  /**
   * 
   * @param productName 
   * @param linkName 
   * @returns 
   * Gets an unauthenticated button
   */
  getProductCardLink(productName: string, linkName: string | RegExp): Locator {
    return this.getProductCard(productName).card.getByRole('link', { name: linkName });
  }

  async addProductToCart(productName: string): Promise<void> {
    const before = await this.navBar.getCartCount();
    await this.getProductCard(productName).addToCartButton.click();
    await expect.poll(() => this.navBar.getCartCount()).toBe(before + 1);
  }

  /** Delegates to NavBar — kept for backwards compatibility with existing tests. */
  async getCartCount(): Promise<number> {
    return this.navBar.getCartCount();
  }
}