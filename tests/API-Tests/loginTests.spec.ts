import { test, expect, uniqueEmail, DEFAULT_PASSWORD } from '../Fixtures';
import type { AuthResponse, ErrorResponse } from '../Fixtures/types';

test.describe('@LoginAPITests @SmokeAPITests', () => {
  test('wrong password returns 401', async ({ apiClient }) => {
    const email = uniqueEmail('login-fail');

    const register = await apiClient.post('/auth/register', {
      data: { email, password: DEFAULT_PASSWORD, name: 'Login Fail' },
    });
    expect(register.status()).toBe(201);

    const response            = await apiClient.post('/auth/login', {
      data: { email, password: 'wrongpassword!' },
    });
    const body: ErrorResponse = await response.json();

    expect(response.status()).toBe(401);
    expect(body.error).toContain('Invalid email or password');
  });

  test('valid credentials return 200 with a token', async ({ apiClient }) => {
    const email = uniqueEmail('login-ok');

    const register = await apiClient.post('/auth/register', {
      data: { email, password: DEFAULT_PASSWORD, name: 'Login OK' },
    });
    expect(register.status()).toBe(201);

    const response           = await apiClient.post('/auth/login', {
      data: { email, password: DEFAULT_PASSWORD },
    });
    const body: AuthResponse = await response.json();

    expect(response.status()).toBe(200);
    expect(body.token).toEqual(expect.any(String));
    expect(body.token.split('.')).toHaveLength(3);
  });

  test('GET /auth/me returns the authenticated user identity', async ({ authedRequest, authedUser }) => {
    const response = await authedRequest.get('/auth/me');
    const body     = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toMatchObject({
      id:    authedUser.id,
      email: authedUser.email,
      name:  authedUser.name,
    });
  });

  test('GET /auth/me returns 401 when unauthenticated', async ({ apiClient }) => {
    const response            = await apiClient.get('/auth/me');
    const body: ErrorResponse = await response.json();

    expect(response.status()).toBe(401);
    expect(body.error).toBeTruthy();
    expect(body.error).toContain('Missing or invalid Authorization header');
  });
});