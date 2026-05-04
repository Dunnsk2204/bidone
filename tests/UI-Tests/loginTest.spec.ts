import { test, expect } from '../Fixtures';
import { LoginPage } from '../PageObjects/LoginPage';
import { NavBar } from '../PageObjects/NavBar';
import { assert } from 'console';

test.describe('@LoginTests @SmokeTests', () => {
    test('Invalid email format shows HTML5 validation', async ({ page }) => {
      // Given
      const loginPage = new LoginPage(page);

      // When
      await loginPage.login('invalidemail', 'Password');

      // Then
      expect(await loginPage.isEmailValid()).toBe(false);
      expect(await loginPage.getEmailValidationMessage()).toBeTruthy();
    });

    test('Incorrect password displays a server side error message', async ({ page }) => {
      // Given
      const loginPage = new LoginPage(page);

      // When
      await loginPage.login('validemail@gmail.com', 'pass');

      // Then
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toHaveText('Invalid email or password');
    });

    test('Valid login lands the user on products page', async ({ page, authedUser }) => {
      // Given
      const loginPage = new LoginPage(page);
      const navBar = new NavBar(page);

      // When
      await loginPage.login(authedUser.email, authedUser.password);

      // Then
      await expect(page).not.toHaveURL(/login/);
      assert(await navBar.isLoggedIn());
    });
  });
