import { test, expect } from '../fixtures';
import type { Product } from '../fixtures/types';

const KNOWN_PRODUCT_ID = 'p-001';
const UNKNOWN_PRODUCT_ID = 'does-not-exist-xyz';

type ProductsResponse = {
  count: number;
  items: Product[];
};

type CategoriesResponse = {
  categories: string[];
};

test.describe('@ProductSmokeTests @SmokeAPITests', () => {
  test('Returns the product page for user who is un-authenticated', async ({ apiClient }) => {
    // Given
    const res = await apiClient.get('/products');
    expect(res.status()).toBe(200);
    const body: ProductsResponse = await res.json();
    expect(body.count).toBeGreaterThan(0);
    expect(body.items).toHaveLength(body.count);

    // When
    for (const product of body.items) {
      expect(product).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        price: expect.any(Number),
        category: expect.any(String),
        unit: expect.any(String),
        stock: expect.any(Number),
        imageUrl: expect.any(String),
      });

      // Then - the product data should be valid
      expect(product.price).toBeGreaterThan(0);
      expect(product.stock).toBeGreaterThanOrEqual(0);
    }
  });

  test('search is case-insensitive and matches name or description', async ({ apiClient }) => {
    // Given
    const searchTerm = 'OyStERS';
    const res = await apiClient.get(`/products?search=${searchTerm}`);
    expect(res.status()).toBe(200);

    // When - searching for a term that appears in the name and description of some products with different casing
    const body: ProductsResponse = await res.json();

    // Then - the results should include all products that match the term in either name or description, regardless of case
    expect(body.count).toBeGreaterThan(0);
    expect(body.items).toHaveLength(body.count);

    for (const product of body.items) {
      const searchableText = `${product.name} ${product.description}`.toLowerCase();
      expect(searchableText).toContain(searchTerm.toLowerCase());
    }
  });


  test('inStock=true filter returns only products that have stock', async ({ apiClient }) => {
    // Given
    const res = await apiClient.get('/products?inStock=true');
    expect(res.status()).toBe(200);
    const body: ProductsResponse = await res.json();

    expect(body.items).toHaveLength(body.count);

    for (const product of body.items) {
      expect(product.stock).toBeGreaterThan(0);
    }
  });

  test('Category filter returns only products in that category', async ({ apiClient }) => {
    // Given
    const category = 'Seafood';
    const res = await apiClient.get(`/products?category=${encodeURIComponent(category)}`);
    expect(res.status()).toBe(200);

    // When
    const body: ProductsResponse = await res.json();

    // Then
    expect(body.count).toBeGreaterThan(0);
    expect(body.items).toHaveLength(body.count);

    for (const product of body.items) {
      expect(product.category).toBe(category);
    }
  });

  test('combined filters return only products matching all criteria', async ({ apiClient }) => {
    // Given
    const search = 'chicken';
    const category = 'Meat & Poultry';
    const minPrice = 10;
    const maxPrice = 25;

    // When - search term, category and price range filters are applied together
    const res = await apiClient.get(`/products?search=${search}&category=${encodeURIComponent(category)}&minPrice=${minPrice}&maxPrice=${maxPrice}&inStock=true`);
    expect(res.status()).toBe(200);
    const body: ProductsResponse = await res.json();

    // Then - only products matching all criteria are returned
    expect(body.count).toBeGreaterThan(0);
    expect(body.items).toHaveLength(body.count);

    for (const product of body.items) {
      const text = `${product.name} ${product.description}`.toLowerCase();

      expect(text).toContain(search);
      expect(product.category).toBe(category);
      expect(product.price).toBeGreaterThanOrEqual(minPrice);
      expect(product.price).toBeLessThanOrEqual(maxPrice);
      expect(product.stock).toBeGreaterThan(0);
    }
  });

  test('returns the list of unique categories', async ({ apiClient }) => {
    const res = await apiClient.get('/products/categories');
    expect(res.status()).toBe(200);

    const body: CategoriesResponse = await res.json();

    expect(body.categories.length).toBeGreaterThan(0);

    const uniqueCategories = new Set(body.categories);

    expect(uniqueCategories.size).toBe(body.categories.length);

    for (const category of body.categories) {
      expect(category).toEqual(expect.any(String));
      expect(category.trim().length).toBeGreaterThan(0);
    }
  });


  test('Returns a single product for a known id', async ({ apiClient }) => {
    // Given
    const res = await apiClient.get(`/products/${KNOWN_PRODUCT_ID}`);
    expect(res.status()).toBe(200);
    
    // When
    const product: Product = await res.json();

    // Then
    expect(product).toMatchObject({
      id: KNOWN_PRODUCT_ID,
      name: expect.any(String),
      description: expect.any(String),
      price: expect.any(Number),
      category: expect.any(String),
      unit: expect.any(String),
      stock: expect.any(Number),
      imageUrl: expect.any(String),
    });

    expect(product.price).toBeGreaterThan(0);
    expect(product.stock).toBeGreaterThanOrEqual(0);
  });

  test('returns 404 for an unknown product id', async ({ apiClient }) => {
    const res = await apiClient.get(`/products/${UNKNOWN_PRODUCT_ID}`);

    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});