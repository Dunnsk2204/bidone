/**
 * pages/NavBar.ts
 */

import { type Page, type Locator } from '@playwright/test';

export class NavBar {
  readonly page: Page;

  readonly brand: Locator;
  readonly shopLink: Locator;
  readonly cartLink: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly cartCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brand          = page.getByTestId('nav-home');
    this.shopLink       = page.getByTestId('nav-products');
    this.cartLink       = page.getByTestId('nav-cart');
    this.loginButton    = page.getByTestId('nav-login');
    this.registerButton = page.getByTestId('nav-register');
    this.cartCount      = page.getByTestId('nav-cart-count');
  }

  async getCartCount(): Promise<number> {
    if (await this.cartCount.count() === 0) return 0;
    const text = await this.cartCount.textContent();
    return Number((text ?? '0').trim());
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }

  async goToShop(): Promise<void> {
    await this.shopLink.click();
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.loginButton.count() === 0;
  }
}