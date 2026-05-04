/**
 * api/orders.spec.ts
 *
 * Risk-based coverage for the Orders endpoints.
 *
 * Scenarios (5):
 *  1. POST /orders → 201, status is CONFIRMED, cart is emptied
 *  2. Stock is decremented on the ordered product
 *  3. POST /orders with an empty cart → 400
 *  4. GET /orders/:id → returns the correct order
 *  5. GET /orders/:id with unknown id → 404
 *
 * Order placement has two critical side-effects: emptying the cart and
 * decrementing stock. Either failing silently = overselling or phantom
 * cart items — the highest-risk data-integrity bugs in the app.
 */

import { Order, OrderItem, OrdersResponse, Product } from 'Fixtures/types';
import { test, expect } from '../Fixtures';

const PRODUCT_ID = 'p-003'; // Separate from cart tests to avoid stock conflicts

const CUSTOMER = {
  name: 'Orders Test User',
  email: 'orders@bidshop-test.example',
  address: '42 Shortland Street',
  city: 'Auckland',
  postcode: '1010',
};

test.describe('@OrderTests @SmokeAPITests', () => {
  test('Placing an order returns CONFIRMED status and clears the cart', async ({ authedRequest }) => {
    // Given - a cart with one item
    const cartItems = await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });
    expect(cartItems.status()).toBe(201);

    // When - placing an order
    const orderRes = await authedRequest.post('/orders', { data: { customer: CUSTOMER } });
    expect(orderRes.status()).toBe(201);
    const order: Order = await orderRes.json();
    expect(order.status).toBe('CONFIRMED');

    // The order must contain the line item we added
    const lineItem = order.items.find((i: OrderItem) => i.productId === PRODUCT_ID);
    expect(lineItem!.productId).toBe(PRODUCT_ID);
    expect(lineItem!.quantity).toBe(1);

    // Then - the cart should be empty
    const cartRes = await authedRequest.get('/cart');
    const cart = await cartRes.json();
    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });

  test('Stock is decremented on the ordered product', async ({ authedRequest, apiClient }) => {
    // Given - a cart with one item
    const productResponse = await apiClient.get(`/products/${PRODUCT_ID}`);
    expect(productResponse.status()).toBe(200);
    const productBefore: Product = await productResponse.json();
    await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });

    // When - placing an order
    const orderRes = await authedRequest.post('/orders', {
      data: { customer: CUSTOMER },
    });
    expect(orderRes.status()).toBe(201);


    // Then - the product stock should be decremented by 1
    const afterOrder = await apiClient.get(`/products/${PRODUCT_ID}`);
    expect(afterOrder.status()).toBe(200);
    const productAfter: Product = await afterOrder.json();
    expect(productAfter.stock).toBe(productBefore.stock - 1);
  });

  test('Ordering with an empty cart returns a HTTP 400', async ({ authedRequest }) => {
    // Fresh authedUser fixture always starts with an empty cart
    const res = await authedRequest.post('/orders', { data: { customer: CUSTOMER } });
    expect(res.status()).toBe(400);
  });

  test('Returns the correct order for the authenticated user', async ({ authedRequest }) => {
    // Given - an existing order
    await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });
    const orderResponse = await authedRequest.post('/orders', { data: { customer: CUSTOMER } });
    const created: Order = await orderResponse.json();

    // When - fetching the order by id
    const getOrder = await authedRequest.get(`/orders/${created.id}`);
    const order: Order = await getOrder.json();

    // Then - the correct order is returned
    expect(getOrder.status()).toBe(200);
    expect(order.id).toBe(created.id);
    expect(order.status).toBe('CONFIRMED');
  });


  test('returns 404 for an unknown order id', async ({ authedRequest }) => {
    const res = await authedRequest.get('/orders/nonexistent-order-id');
    expect(res.status()).toBe(404);
  });


  test('GET /orders returns the authenticated user order history', async ({ authedRequest }) => {
    // Given - an existing order
    await authedRequest.post('/cart/items', {
      data: { productId: PRODUCT_ID, quantity: 1 },
    });

    const createResponse = await authedRequest.post('/orders', {
      data: { customer: CUSTOMER },
    });

    expect(createResponse.status()).toBe(201);
    const createdOrder: Order = await createResponse.json();

    // When - fetching order history
    const response = await authedRequest.get('/orders');
    expect(response.status()).toBe(200);

    const orderResponse: OrdersResponse = await response.json();
    const order = orderResponse.items[0];

    // Then
    expect(order).toMatchObject({
      id: createdOrder.id,
      userId: expect.any(String),
      status: 'CONFIRMED',
      customer: CUSTOMER,
    });

    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      productId: PRODUCT_ID,
      quantity: 1,
    });
  });
});
