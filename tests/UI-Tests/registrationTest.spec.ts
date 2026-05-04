import { test, expect, uniqueEmail, DEFAULT_PASSWORD  } from '../Fixtures';
import { RegisterPage } from '../PageObjects/RegisterPage';
import { NavBar } from 'PageObjects/NavBar';

test.describe('@RegistrationTests @SmokeTests', () => {
  test('Valid registration logs user in', async ({ page }) => {
    // Given - a visitor on the registration page
    const registerPage = new RegisterPage(page);
    const navBar = new NavBar(page);

    // When - they register with valid credentials
    await registerPage.register('UI Test User2',uniqueEmail('ui-register'), DEFAULT_PASSWORD);

    // Then
    await expect(page).not.toHaveURL(/register/);
    const loggedInIndicator = await navBar.isLoggedIn();
    expect(loggedInIndicator).toBeTruthy();
  });

test('Invalid registration details show browser validation', async ({ page }) => {
    // Given - a visitor on the registration page  
    const registerPage = new RegisterPage(page);

    // Invalid email, empty name, and weak password
    await registerPage.register('', 'nobodyWrongEmail', 'Pass');

    // Then - HTML5 validation messages are shown for each field
    expect(await registerPage.getFullNameValidationMessage()).toBeTruthy();
    expect(await registerPage.isEmailValid()).toBe(false);
    expect(await registerPage.getEmailValidationMessage()).toBeTruthy();
    expect(await registerPage.getPasswordValidationMessage()).toBeTruthy();
  });
});

