import { test as base, expect, Page, type APIRequestContext } from '@playwright/test';
import { AuthedUser, TestUser } from './types';

/** Returns a unique email address to prevent conflicts across test runs. */
export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}+${Date.now()}@bidshop-test.example`;
}

/** Default valid password that satisfies the ≥ 6 character rule. */
export const DEFAULT_PASSWORD = 'testpassword123';
const BASE_API_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

type BidshopFixtures = {
  apiURL: string;
  apiClient: APIRequestContext;
  testUser: TestUser;
  authedUser: AuthedUser;
  authedRequest: APIRequestContext;
  authenticatedPage: Page;
};

export const test = base.extend<BidshopFixtures>({
  // The base API URL – useful when tests need to build URLs dynamically.
  apiURL: async ({ }, use) => {
    await use(BASE_API_URL);
  },

  // A bare request context with no auth headerz
  apiClient: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE_API_URL });
    await use(ctx);
    await ctx.dispose();
  },

  // Generates unique credentials but does NOT register the user
  // Use in registration tests where you want to control the full flow.
  testUser: async ({ }, use) => {
    await use({
      email: uniqueEmail(),
      password: DEFAULT_PASSWORD,
      name: 'Test User',
    });
  },

  // Registers a brand-new user via the API and returns their credentials + token.
  // Each test gets a completely fresh user, ensuring full test isolation.
  authedUser: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE_API_URL });

    const user: TestUser = {
      email: uniqueEmail('authed'),
      password: DEFAULT_PASSWORD,
      name: 'Authed User',
    };

    const res = await ctx.post('/auth/register', { data: user });
    if (!res.ok()) {
      throw new Error(
        `authedUser fixture: registration failed (${res.status()}): ${await res.text()}`,
      );
    }

    const body = await res.json();
    await ctx.dispose();

    await use({ ...user, token: body.token, id: body.user.id });
  },

  // A browser page that is already authenticated via localStorage token injection.
  // Use this in UI tests instead of manually logging in via the UI.
  authenticatedPage: async ({ page, authedUser }, use) => {
    await page.goto('/');
    await page.evaluate((token) => {
      window.localStorage.setItem('bidshop.token', token);
    }, authedUser.token);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  // A request context with the Authorization header pre-set.
  // Use this for any test that needs to call a protected endpoint.
  authedRequest: async ({ playwright, authedUser }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: BASE_API_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${authedUser.token}`,
      },
    });
    await use(ctx);
    await ctx.dispose();
  },
});



export { expect };
