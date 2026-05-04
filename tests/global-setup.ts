/**
 * global-setup.ts
 *
 * Runs once before the entire test suite. Confirms that both the backend
 * API and the frontend dev server are reachable, giving a clear, actionable
 * error message instead of a cascade of connection-refused failures.
 */

import { request } from '@playwright/test';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const UI_URL  = process.env.UI_BASE_URL  ?? 'http://localhost:5173';

async function globalSetup(): Promise<void> {
  await assertServiceReachable(`${API_URL}/health`, 'Backend API');
  await assertServiceReachable(UI_URL, 'Frontend (Vite)');
}

async function assertServiceReachable(url: string, label: string): Promise<void> {
  const ctx = await request.newContext();
  try {
    const res = await ctx.get(url, { timeout: 5_000 });
    if (!res.ok() && res.status() !== 404) {
      throw new Error(`${label} responded with HTTP ${res.status()}`);
    }
    console.log(`  ✔ ${label} is up (${url})`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `\n❌  ${label} is NOT reachable at ${url}\n` +
      `   → ${message}\n\n` +
      `   Make sure both services are running before executing tests:\n` +
      `     cd backend  && npm run dev   # port 4000\n` +
      `     cd frontend && npm run dev   # port 5173\n`,
    );
  } finally {
    await ctx.dispose();
  }
}

export default globalSetup;
