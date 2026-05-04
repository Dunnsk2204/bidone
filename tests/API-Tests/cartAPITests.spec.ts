import { test, expect } from '../Fixtures/index';
import type { Cart, CartItem, Product } from '../Fixtures/types';

const PRODUCT_ID = 'p-001';
const PRODUCT_ID_2 = 'p-002';

test.describe('@CartTests @SmokeAPITests @SmokeTests', () => {

  test('GET /cart without a token returns 401', async ({ apiClient }) => {
    const res = await apiClient.get('/cart');
    expect(res.status()).toBe(401);
  });

  test('POST /cart/items without a token returns 401', async ({ apiClient }) => {
    const res = await apiClient.post('/cart/items', {
      data: { productId: PRODUCT_ID, quantity: 1 },
    });
    expect(res.status()).toBe(401);
  });


  test('POST - Adding a product returns correct cart shape and pricing', async ({ authedRequest, apiClient }) => {
    // Fetch real price from API so maths doesn't rely on hardcoded values
    const productRes = await apiClient.get(`/products/${PRODUCT_ID}`);
    const product: Product = await productRes.json();
    const quantity = 1;

    // Add product to cart
    const res = await authedRequest.post('/cart/items', {
      data: { productId: PRODUCT_ID, quantity },
    });

    // Assert Response and Cart Shape
    expect(res.status()).toBe(201);
    const cart: Cart = await res.json();

    // Data shapes
    expect(cart).toMatchObject({
      userId: expect.any(String),
      subtotal: expect.any(Number),
      gst: expect.any(Number),
      total: expect.any(Number),
      updatedAt: expect.any(String),
    });

    expect(cart.items).toHaveLength(1);

    const item: CartItem = cart.items[0];
    expect(item).toMatchObject({
      productId: PRODUCT_ID,
      quantity,
      name: product.name,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    });

    // BUG: The servers GST calculation is incorrect
    // Expected: $14.50 × 15% = $2.175 → total $16.68
    // Actual: GST = $1.81, total = $16.31 (approx 12.48% not 15%)
    expect(cart.subtotal).toBe(product.price * quantity);
    expect(cart.gst).toBeCloseTo(cart.subtotal * 0.15, 2);
    expect(cart.total).toBeCloseTo(cart.subtotal + cart.gst, 2);
    expect(new Date(cart.updatedAt).toString()).not.toBe('Invalid Date');
  });


  test('PATCH updates quantity and recalculates totals', async ({ authedRequest, apiClient, }) => {
    // Given
    await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });

    // When - Updating the cart item quantity to 3
    const res = await authedRequest.patch(`/cart/items/${PRODUCT_ID}`, { data: { quantity: 3 } });
    const cart: Cart = await res.json();
    expect(res.status()).toBe(200);

    //Then - Cart should reflect updated quantity and totals
    const item = cart.items.find((i: CartItem) => i.productId === PRODUCT_ID);
    expect(item?.quantity).toBe(3);
    const productResponse = await apiClient.get(`/products/${PRODUCT_ID}`);
    const product: Product = await productResponse.json();
    expect(cart.subtotal).toBeCloseTo(product.price * 3, 2);
  });


  test('DELETE removes the item from the cart', async ({ authedRequest }) => {
    // Given - Two items in the cart
    await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });
    await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID_2, quantity: 1 } });

    // When - Deleting one item
    const response = await authedRequest.delete(`/cart/items/${PRODUCT_ID}`);
    const cart: Cart = await response.json();

    // Then - The deleted item should no longer be in the cart, but the other remains
    expect(response.status()).toBe(200);
    expect(cart.items.find((i: CartItem) => i.productId === PRODUCT_ID)).toBeUndefined();
    expect(cart.items.find((i: CartItem) => i.productId === PRODUCT_ID_2)).not.toBeUndefined();
    expect(cart.items).toHaveLength(1);
  });

  test('DELETE all cart items', async ({ authedRequest }) => {
    // Given - Two items in the cart
    await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });
    await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID_2, quantity: 1 } });

    // When - Deleting one item
    const response = await authedRequest.delete(`/cart`);
    const cart: Cart = await response.json();

    // Then - cart should contain no items and totals should be zero
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotal).toBe(0);
    expect(cart.gst).toBe(0);
    expect(cart.total).toBe(0);
    expect(response.status()).toBe(200);
    expect(cart.items).toHaveLength(0);
  });


  test('GET /cart - Returns cart items for authenticated user', async ({ authedRequest, apiClient }) => {
    const productId = PRODUCT_ID;
    const quantity = 2;

    // Get real product data (source of truth)
    const productResponse = await apiClient.get(`/products/${productId}`);
    expect(productResponse.status()).toBe(200);
    const product: Product = await productResponse.json();

    // Given
    const seedResponse = await authedRequest.post('/cart/items', {
      data: { productId, quantity },
    });
    expect(seedResponse.status()).toBe(201);

    // When
    const response = await authedRequest.get('/cart');
    expect(response.status()).toBe(200);
    const cart: Cart = await response.json();

    // Then
    expect(cart.items).toHaveLength(1);
    const item: CartItem = cart.items[0];
    expect(item.lineTotal).toBe(product.price * quantity);
  });

  test('returns empty cart for authenticated user with no items', async ({ authedRequest }) => {
    const response = await authedRequest.get('/cart');
    const cart = await response.json();

    expect(response.status()).toBe(200);

    expect(cart).toMatchObject({
      userId: expect.any(String),
      items: [],
      subtotal: 0,
      gst: 0,
      total: 0,
      updatedAt: expect.any(String),
    });

    expect(new Date(cart.updatedAt).toString()).not.toBe('Invalid Date');
  });

  test('returns 401 when unauthenticated', async ({ apiClient }) => {
    const response = await apiClient.get('/cart');

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('updating cart item above available stock returns 400', async ({ authedRequest }) => {
    // Given
    const productId = 'p-001'; // Bluff Oysters, stock = 10
    const addResponse = await authedRequest.post('/cart/items', {
      data: { productId, quantity: 40 },
    });

    expect(addResponse.status()).toBe(201);

    // When - Updating quantity to 11, which exceeds stock
    const updateResponse = await authedRequest.patch(`/cart/items/${productId}`, {
      data: { quantity: 41 },
    });

    // Then - Should return 400 with an error message about stock limits
    expect(updateResponse.status()).toBe(400);
    const body = await updateResponse.json();
    expect(body.error).toBeTruthy();
    expect(body.error).toContain('Only 40 unit(s) available');
  });
});

