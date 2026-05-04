import { test, expect } from '../fixtures';
import { RegisterPage } from '../pages/RegisterPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';

test.describe('@ShoppingCartTests @SmokeTests', () => {
  test('Add a product to the cart - updates the cart count', async ({ authenticatedPage }) => {
    // Given
    const productsPage = new ProductsPage(authenticatedPage);
    await productsPage.goto();
    const originalCart = await productsPage.getCartCount();

    // When
    await productsPage.addProductToCart("NZ Grass-Fed Beef Mince");

    // Then
    const cartCount = await productsPage.getCartCount();
    expect(cartCount).toBeGreaterThan(originalCart);
    expect(cartCount).toBe(1);
  });


  test('Cart page shows the added item and displays totals', async ({ authenticatedPage, authedUser }) => {
    // Given - add a product to the cart via the API
    await authenticatedPage.request.post('http://localhost:4000/cart/items', {
      data: { productId: "p-001", quantity: 1 },
      headers: { Authorization: `Bearer ${authedUser.token}` },
    });

    // When
    const cartPage = new CartPage(authenticatedPage);
    await cartPage.goto();

    // Then - the cart should show the item, subtotal, and total
    await expect(cartPage.cartItems.first()).toBeVisible();
    await expect(cartPage.subtotalText).toBeVisible();
    await expect(cartPage.totalText).toBeVisible();
  });

  test('Updating the quantity of a product recalculates the displayed total', async ({ authenticatedPage, authedUser }) => {

    // Given - add a product to the cart via the API
    const response = await authenticatedPage.request.post('http://localhost:4000/cart/items', {
      data: { productId: "p-002", quantity: 1 },
      headers: { Authorization: `Bearer ${authedUser.token}` },
    });
    const quantityToUpdate = 2;

    // 1 item in cart
    const initialCart = await response.json();
    const initialTotal: number = initialCart.total;

    // When - update the quantity of the item in the cart
    const cartPage = new CartPage(authenticatedPage);
    await cartPage.goto();
    await cartPage.updateProductQuantity("Free-Range Chicken Breast", quantityToUpdate);

    // Then - the total should update accordingly
    const expectedTotal = `$${(initialTotal * quantityToUpdate).toFixed(2)}`;
    await expect(cartPage.totalText).toHaveText(/\$[\d,]+\.\d{2}/);
    await expect(cartPage.totalText).toHaveText(expectedTotal);
  });


  test('Removing the only item shows the empty-cart message', async ({ authenticatedPage, authedUser }) => {
    await authenticatedPage.request.post('http://localhost:4000/cart/items', {
      data: { productId: "p-004", quantity: 2 },
      headers: { Authorization: `Bearer ${authedUser.token}` },
    });

    const cartPage = new CartPage(authenticatedPage);
    await cartPage.goto();

    await expect(cartPage.cartItems.first()).toBeVisible();

    await cartPage.deleteProductFromCart("Wild NZ King Salmon Fillet");
    await expect(cartPage.emptyCartMessage).toBeVisible({ timeout: 5_000 });
  });


  test('Add Multiple products to Cart', async ({ authenticatedPage }) => {
    // Given - add multiple products to the cart via the API
    const productsPage = new ProductsPage(authenticatedPage);
    await productsPage.goto();
    const originalCart = await productsPage.getCartCount();

    // When - add multiple products to the cart via ui
    await productsPage.addProductToCart("NZ Grass-Fed Beef Mince");
    await productsPage.addProductToCart("Vogel's Mixed Grain Bread");
    const cartPage = new CartPage(authenticatedPage);
    await cartPage.goto();

    // Then - the cart should show the items, subtotal, and total
    await expect(cartPage.cartItems).toHaveCount(2);
    await expect(cartPage.totalText).toBeVisible();
    await expect(cartPage.totalText).toHaveText('$23.05');
    await expect(cartPage.subtotalText).toHaveText('$20.49');
  });


  test('Delete 1 product from a cart with multiple products', async ({ authenticatedPage, authedUser }) => {
    // Given - add multiple products to the cart via the API
    await authenticatedPage.request.post('http://localhost:4000/cart/items', {
      data: { productId: "p-001", quantity: 2 },
      headers: { Authorization: `Bearer ${authedUser.token}` },
    });

    await authenticatedPage.request.post('http://localhost:4000/cart/items', {
      data: { productId: "p-009", quantity: 1 },
      headers: { Authorization: `Bearer ${authedUser.token}` },
    });

    // When
    const cartPage = new CartPage(authenticatedPage);
    await cartPage.goto();
    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.deleteProductFromCart("NZ Grass-Fed Beef Mince");

    // Then - the cart should show the items, subtotal, and total
    await expect(cartPage.getItemName('Mainland Tasty Cheese Block')).toBeVisible();
    await expect(cartPage.cartItems).toHaveCount(1);
  });
});
