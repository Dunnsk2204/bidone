import { type Page, type Locator } from '@playwright/test';
import { NavBar } from './NavBar';

export class RegisterPage {
  
  readonly page: Page;

  // Shared inputs
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly registerSubmitButton: Locator;
  readonly navBar: NavBar; 
  readonly errorMessage: Locator;


  constructor(page: Page) {
    this.page = page;

    this.emailInput    = page.getByTestId('register-email');
    this.passwordInput = page.getByTestId('register-password');
    this.fullNameInput  = page.getByTestId('register-name');
    this.registerSubmitButton = page.getByTestId('register-submit');
    this.navBar = new NavBar(page);
    this.errorMessage = page.getByTestId('login-error');
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto('/register');
  }

  async getEmailValidationMessage(): Promise<string> {
      return await this.emailInput.evaluate(
          el => (el as HTMLInputElement).validationMessage
      );
  }

  async getFullNameValidationMessage(): Promise<string> {
      return await this.fullNameInput.evaluate(
          el => (el as HTMLInputElement).validationMessage
      );
  }

  async getPasswordValidationMessage(): Promise<string> {
      return await this.passwordInput.evaluate(
          el => (el as HTMLInputElement).validationMessage
      );
  }

  async isEmailValid(): Promise<boolean> {
      return await this.emailInput.evaluate(
          el => (el as HTMLInputElement).checkValidity()
      );
  }

  /** Fill in and submit the registration form. */
  async register(name: string, email: string, password: string): Promise<void> {
    await this.gotoRegister();
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.registerSubmitButton.click();

    // Wait until the logged in state is reflected in the UI (e.g. nav bar updates)
    await this.navBar.isLoggedIn();
  }
}
