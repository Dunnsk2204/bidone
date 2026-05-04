/**
 * pages/ProductCard.ts
 *
 * Component object representing a single product card.
 * Used by ProductsPage rather than directly in tests.
 */

import { type Locator } from '@playwright/test';

export class ProductCard {
  readonly card: Locator;

  constructor(card: Locator) {
    this.card = card;
  }

  get name(): Locator {
    return this.card.locator('[data-testid^="product-name-"]');
  }

  get category(): Locator {
    return this.card.locator('[data-testid^="product-category-"]');
  }

  get price(): Locator {
    return this.card.locator('[data-testid^="product-price-"]');
  }

  get stock(): Locator {
    return this.card.locator('[data-testid^="product-stock-"]');
  }

  get addToCartButton(): Locator {
    return this.card.getByRole('button', { name: /add to cart/i });
  }

  get loginToAddButton(): Locator {
    return this.card.locator('[data-testid^="product-login-"]');
  }
}