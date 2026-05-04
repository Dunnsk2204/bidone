/**
 * ui/homepage.spec.ts
 *
 * Verifies the product catalogue is visible to an unauthenticated visitor.
 * This is the first thing every customer sees – if it breaks, revenue stops.
 *
 * Scenarios (2):
 *  1. Catalogue loads and displays products without authentication
 *  2. Search input filters the visible product list
 */

import { ProductCard } from 'PageObjects/ProductCard';
import { test, expect } from '../Fixtures';
import { ProductsPage } from '../PageObjects/ProductsPage';

test.describe('@ProductSmokeTests @SmokeTests', () => {
  test('Displays the product catalogue without authentication', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();

    // At least one product card must be visible
    await expect(productsPage.productCards.first()).toBeVisible();
    const count = await productsPage.productCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('User cannot add to cart when unauthenticated', async ({ page }) => {
    // Given - an unauthenticated visitor on the products page
    const productsPage = new ProductsPage(page);
    await productsPage.goto();

    // When - they view the product cards
    const button = productsPage.getProductCardLink('NZ Grass-Fed Beef Mince', 'Log in to buy');
    await expect(button).toBeVisible();
  });

  test('Search filters the visible product list', async ({ page }) => {
    // Given
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    const totalBefore = await productsPage.productCards.count();

    // When - Searching for "Chicken"
    await productsPage.searchProduct('Chicken');

    // Then
    const totalAfter = await productsPage.productCards.count();
    expect(totalAfter).toBeLessThan(totalBefore);
    expect(totalAfter).toBeGreaterThan(0);
  });

  test('Category dropdown filters results', async ({ page }) => {
    // Given
    const productsPage = new ProductsPage(page);
    await productsPage.goto();


    // When - Searching for "Bevaerages"
    await productsPage.selectCategory('Beverages');

    // Then
    const totalAfter = await productsPage.productCards.count();
    expect(totalAfter).toBe(2);

    // Assert every visible card belongs to the Beverages category
    for (let i = 0; i < totalAfter; i++) {
      const card = new ProductCard(productsPage.productCards.nth(i));
      await expect(card.category).toHaveText('Beverages');
    }
  });

  test('User can add to cart when authenticated', async ({ authenticatedPage }) => {
    // Given - an authenticated visitor on the products page
    const productsPage = new ProductsPage(authenticatedPage);
    await productsPage.goto();

    // Then - The buttons on the product cards should prompt the user to log in
    const button = productsPage.getProductCardButton('NZ Grass-Fed Beef Mince', 'Add to cart');

    await expect(button).toBeVisible();
  });
});
