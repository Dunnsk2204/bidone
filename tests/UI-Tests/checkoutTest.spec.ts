import { Page } from '@playwright/test';
import { test, expect } from '../Fixtures';
import { CartPage } from '../PageObjects/CartPage';
import { CheckoutPage } from '../PageObjects/CheckoutPage';
import { NavBar } from '../PageObjects/NavBar';

const CHECKOUT_DETAILS = {
  name: 'End-to-End Tester',
  email: 'e2e@bidshop-test.example',
  address: '1 Queen Street',
  city: 'Auckland',
  postcode: '1010',
};

  test.describe('@CheckoutTests @SmokeTests', () => {

    test.beforeEach(async ({ authenticatedPage, authedUser }) => {
      // Setup tests by adding an item to the cart
      const response = await authenticatedPage.request.post('http://localhost:4000/cart/items', {
        data: { "productId": "p-006", "quantity": 2 },
        headers: { Authorization: `Bearer ${authedUser.token}` },
      });

      expect(response.ok()).toBeTruthy();
    });

    test('Complete cart action and proceed to checkout screen', async ({ authenticatedPage }) => {
      const cartPage = new CartPage(authenticatedPage);
      const checkoutPage = new CheckoutPage(authenticatedPage);

      await cartPage.goto();
      await cartPage.clickContinueToCheckoutButton();

      await expect(checkoutPage.checkoutForm).toBeVisible();
      await expect(authenticatedPage).toHaveURL(/\/checkout$/);
    });

    test('Complete successful checkout process', async ({ authenticatedPage }) => {
      const checkoutPage = new CheckoutPage(authenticatedPage);
      const navBar = new NavBar(authenticatedPage);

      await checkoutPage.goto();
      await checkoutPage.checkout(CHECKOUT_DETAILS);

      await expect(checkoutPage.orderConfirmation).toBeVisible();
      await expect(navBar.cartCount).toBeHidden();
    });

    test('Shows validation when checkout details are invalid', async ({ authenticatedPage }) => {
      const checkoutPage = new CheckoutPage(authenticatedPage);

      await checkoutPage.goto();

      await checkoutPage.checkout({
        ...CHECKOUT_DETAILS,
        email: 'incorrectEmailFormat',
        postcode: '123',
      });

      await checkoutPage.expectFieldInvalid(checkoutPage.email, 'typeMismatch');
      await checkoutPage.expectFieldInvalid(checkoutPage.postcode, 'patternMismatch');
    });
  });