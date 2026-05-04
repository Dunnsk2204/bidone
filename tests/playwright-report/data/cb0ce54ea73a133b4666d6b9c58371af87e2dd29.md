# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\cartAPITests.spec.ts >> @CartTests @SmokeAPITests @SmokeTests >> POST - Adding a product returns correct cart shape and pricing
- Location: api\cartAPITests.spec.ts:22:7

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 2.175
Received: 1.81

Expected precision:    2
Expected difference: < 0.005
Received difference:   0.36499999999999977
```

# Test source

```ts
  1   | import { test, expect } from '../fixtures';
  2   | import type { Cart, CartItem, Product } from '../fixtures/types';
  3   | 
  4   | const PRODUCT_ID = 'p-001';
  5   | const PRODUCT_ID_2 = 'p-002';
  6   | 
  7   | test.describe('@CartTests @SmokeAPITests @SmokeTests', () => {
  8   | 
  9   |   test('GET /cart without a token returns 401', async ({ apiClient }) => {
  10  |     const res = await apiClient.get('/cart');
  11  |     expect(res.status()).toBe(401);
  12  |   });
  13  | 
  14  |   test('POST /cart/items without a token returns 401', async ({ apiClient }) => {
  15  |     const res = await apiClient.post('/cart/items', {
  16  |       data: { productId: PRODUCT_ID, quantity: 1 },
  17  |     });
  18  |     expect(res.status()).toBe(401);
  19  |   });
  20  | 
  21  | 
  22  |   test('POST - Adding a product returns correct cart shape and pricing', async ({ authedRequest, apiClient }) => {
  23  |     // Fetch real price from API so maths doesn't rely on hardcoded values
  24  |     const productRes = await apiClient.get(`/products/${PRODUCT_ID}`);
  25  |     const product: Product = await productRes.json();
  26  |     const quantity = 1;
  27  | 
  28  |     // Add product to cart
  29  |     const res = await authedRequest.post('/cart/items', {
  30  |       data: { productId: PRODUCT_ID, quantity },
  31  |     });
  32  | 
  33  |     // Assert Response and Cart Shape
  34  |     expect(res.status()).toBe(201);
  35  |     const cart: Cart = await res.json();
  36  | 
  37  |     // Data shapes
  38  |     expect(cart).toMatchObject({
  39  |       userId: expect.any(String),
  40  |       subtotal: expect.any(Number),
  41  |       gst: expect.any(Number),
  42  |       total: expect.any(Number),
  43  |       updatedAt: expect.any(String),
  44  |     });
  45  | 
  46  |     expect(cart.items).toHaveLength(1);
  47  | 
  48  |     const item: CartItem = cart.items[0];
  49  |     expect(item).toMatchObject({
  50  |       productId: PRODUCT_ID,
  51  |       quantity,
  52  |       name: product.name,
  53  |       unitPrice: product.price,
  54  |       lineTotal: product.price * quantity,
  55  |     });
  56  | 
  57  |     // BUG: The servers GST calculation is incorrect
  58  |     // Expected: $14.50 × 15% = $2.175 → total $16.68
  59  |     // Actual: GST = $1.81, total = $16.31 (approx 12.48% not 15%)
  60  |     expect(cart.subtotal).toBe(product.price * quantity);
> 61  |     expect(cart.gst).toBeCloseTo(cart.subtotal * 0.15, 2);
      |                      ^ Error: expect(received).toBeCloseTo(expected, precision)
  62  |     expect(cart.total).toBeCloseTo(cart.subtotal + cart.gst, 2);
  63  |     expect(new Date(cart.updatedAt).toString()).not.toBe('Invalid Date');
  64  |   });
  65  | 
  66  | 
  67  |   test('PATCH updates quantity and recalculates totals', async ({ authedRequest, apiClient, }) => {
  68  |     // Given
  69  |     await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });
  70  | 
  71  |     // When - Updating the cart item quantity to 3
  72  |     const res = await authedRequest.patch(`/cart/items/${PRODUCT_ID}`, { data: { quantity: 3 } });
  73  |     const cart: Cart = await res.json();
  74  |     expect(res.status()).toBe(200);
  75  | 
  76  |     //Then - Cart should reflect updated quantity and totals
  77  |     const item = cart.items.find((i: CartItem) => i.productId === PRODUCT_ID);
  78  |     expect(item?.quantity).toBe(3);
  79  |     const productResponse = await apiClient.get(`/products/${PRODUCT_ID}`);
  80  |     const product: Product = await productResponse.json();
  81  |     expect(cart.subtotal).toBeCloseTo(product.price * 3, 2);
  82  |   });
  83  | 
  84  | 
  85  |   test('DELETE removes the item from the cart', async ({ authedRequest }) => {
  86  |     // Given - Two items in the cart
  87  |     await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });
  88  |     await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID_2, quantity: 1 } });
  89  | 
  90  |     // When - Deleting one item
  91  |     const response = await authedRequest.delete(`/cart/items/${PRODUCT_ID}`);
  92  |     const cart: Cart = await response.json();
  93  | 
  94  |     // Then - The deleted item should no longer be in the cart, but the other remains
  95  |     expect(response.status()).toBe(200);
  96  |     expect(cart.items.find((i: CartItem) => i.productId === PRODUCT_ID)).toBeUndefined();
  97  |     expect(cart.items.find((i: CartItem) => i.productId === PRODUCT_ID_2)).not.toBeUndefined();
  98  |     expect(cart.items).toHaveLength(1);
  99  |   });
  100 | 
  101 |   test('DELETE all cart items', async ({ authedRequest }) => {
  102 |     // Given - Two items in the cart
  103 |     await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID, quantity: 1 } });
  104 |     await authedRequest.post('/cart/items', { data: { productId: PRODUCT_ID_2, quantity: 1 } });
  105 | 
  106 |     // When - Deleting one item
  107 |     const response = await authedRequest.delete(`/cart`);
  108 |     const cart: Cart = await response.json();
  109 | 
  110 |     // Then - cart should contain no items and totals should be zero
  111 |     expect(cart.items).toHaveLength(0);
  112 |     expect(cart.subtotal).toBe(0);
  113 |     expect(cart.gst).toBe(0);
  114 |     expect(cart.total).toBe(0);
  115 |     expect(response.status()).toBe(200);
  116 |     expect(cart.items).toHaveLength(0);
  117 |   });
  118 | 
  119 | 
  120 |   test('GET /cart - Returns cart items for authenticated user', async ({ authedRequest, apiClient }) => {
  121 |     const productId = PRODUCT_ID;
  122 |     const quantity = 2;
  123 | 
  124 |     // Get real product data (source of truth)
  125 |     const productResponse = await apiClient.get(`/products/${productId}`);
  126 |     expect(productResponse.status()).toBe(200);
  127 |     const product: Product = await productResponse.json();
  128 | 
  129 |     // Given
  130 |     const seedResponse = await authedRequest.post('/cart/items', {
  131 |       data: { productId, quantity },
  132 |     });
  133 |     expect(seedResponse.status()).toBe(201);
  134 | 
  135 |     // When
  136 |     const response = await authedRequest.get('/cart');
  137 |     expect(response.status()).toBe(200);
  138 |     const cart: Cart = await response.json();
  139 | 
  140 |     // Then
  141 |     expect(cart.items).toHaveLength(1);
  142 |     const item: CartItem = cart.items[0];
  143 |     expect(item.lineTotal).toBe(product.price * quantity);
  144 |   });
  145 | 
  146 |   test('returns empty cart for authenticated user with no items', async ({ authedRequest }) => {
  147 |     const response = await authedRequest.get('/cart');
  148 |     const cart = await response.json();
  149 | 
  150 |     expect(response.status()).toBe(200);
  151 | 
  152 |     expect(cart).toMatchObject({
  153 |       userId: expect.any(String),
  154 |       items: [],
  155 |       subtotal: 0,
  156 |       gst: 0,
  157 |       total: 0,
  158 |       updatedAt: expect.any(String),
  159 |     });
  160 | 
  161 |     expect(new Date(cart.updatedAt).toString()).not.toBe('Invalid Date');
```