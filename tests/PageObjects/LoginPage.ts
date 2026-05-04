import { type Page, type Locator } from '@playwright/test';

export class LoginPage {

    readonly page: Page;

    // Shared inputs
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly errorMessage: Locator;

    // Login form
    readonly loginSubmitButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByLabel(/email/i);
        this.passwordInput = page.getByLabel(/password/i);
        this.errorMessage = page.getByTestId('login-error');
        this.loginSubmitButton = page.getByRole('button', { name: /log.?in|sign.?in/i });
    }

    async gotoLogin(): Promise<void> {
        await this.page.goto('/login');
    }

    /** Fill in and submit the login form. */
    async login(email: string, password: string): Promise<void> {
        await this.gotoLogin();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginSubmitButton.click();
    }

    async getEmailValidationMessage(): Promise<string> {
        return await this.emailInput.evaluate(
            el => (el as HTMLInputElement).validationMessage
        );
    }

    async isEmailValid(): Promise<boolean> {
        return await this.emailInput.evaluate(
            el => (el as HTMLInputElement).checkValidity()
        );
    }

    /**
     * Inject an existing JWT into localStorage so UI tests can skip the
     * login flow entirely. Call this after the page has loaded (localStorage
     * is origin-scoped so the app must be open first).
     *
     * Check which key the React app uses in DevTools → Application →
     * Local Storage, and pass it as `storageKey` (default: 'token').
     */
    async injectAuthToken(token: string, storageKey = 'token'): Promise<void> {
        await this.page.goto('/');
        await this.page.evaluate(
            ([key, value]) => localStorage.setItem(key, value),
            [storageKey, token],
        );
        await this.page.reload();
    }
}
