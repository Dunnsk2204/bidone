import { test, expect, uniqueEmail, DEFAULT_PASSWORD } from '../Fixtures';
import type { AuthResponse, ErrorResponse } from '../Fixtures/types';

test.describe('@RegisterAPITests @SmokeTests', () => {
  test('valid registration returns 201 with a token and user object', async ({ apiClient }) => {
    const payload = {
      email: uniqueEmail('register'),
      password: DEFAULT_PASSWORD,
      name: 'Robert Smithington',
    };

    const response = await apiClient.post('/auth/register', { data: payload });
    const body: AuthResponse = await response.json();

    expect(response.status()).toBe(201);
    expect(body.token).toEqual(expect.any(String));
    expect(body.token.split('.')).toHaveLength(3);
    expect(body.user).toMatchObject({ email: payload.email, name: payload.name });
    expect(body.user.id).toEqual(expect.any(String));
    expect(body.user.password).toBeUndefined();
  });

  test('Duplicate email returns 409', async ({ apiClient }) => {
    const payload = { email: uniqueEmail('duplicate'), password: DEFAULT_PASSWORD, name: 'First User' };

    const first = await apiClient.post('/auth/register', { data: payload });
    expect(first.status()).toBe(201);

    const duplicate = await apiClient.post('/auth/register', { data: payload });
    const body: ErrorResponse = await duplicate.json();

    expect(duplicate.status()).toBe(409);
    expect(body.error).toContain('A user with that email already exists');
  });

  test('Invalid email format returns 400', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/register', {
      data: { email: 'not-an-email', password: DEFAULT_PASSWORD, name: 'Bad Email' },
    });
    const body: ErrorResponse = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error).toBeTruthy();
  });

  test('missing email returns 400', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/register', {
      data: { password: DEFAULT_PASSWORD, name: 'Missing Email' },
    });
    const body: ErrorResponse = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error).toBeTruthy();
  });

  test('missing password returns 400', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/register', {
      data: { email: uniqueEmail('missing-password'), name: 'Missing Password' },
    });
    const body: ErrorResponse = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error).toBeTruthy();
  });

  test('missing name returns 400', async ({ apiClient }) => {
    const response = await apiClient.post('/auth/register', {
      data: { email: uniqueEmail('missing-name'), password: DEFAULT_PASSWORD },
    });
    const body: ErrorResponse = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error).toBeTruthy();
  });
});