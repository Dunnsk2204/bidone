/**
 * pages/CartPage.ts
 *
 * Page Object for the shopping cart and checkout flow.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { ProductsPage } from './ProductsPage';

export class CheckoutPage {
    readonly page: Page;
    readonly productsPage: ProductsPage;

    // Checkout items
    readonly fullName: Locator;
    readonly email: Locator;
    readonly streetAddress: Locator;
    readonly city: Locator;
    readonly postcode: Locator;
    readonly placeOrderButton: Locator;
    readonly checkoutForm: Locator;

    // Post checkout elements.
    readonly orderConfirmation: Locator;
    readonly continueShoppingButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.productsPage = new ProductsPage(page);

        this.fullName = page.getByTestId('checkout-name');
        this.email = page.getByTestId('checkout-email');
        this.streetAddress = page.getByTestId('checkout-address');
        this.city = page.getByTestId('checkout-city');
        this.postcode = page.getByTestId('checkout-postcode');
        this.placeOrderButton = page.getByTestId('checkout-submit');
        this.checkoutForm = page.getByTestId('checkout-form');

        //post checkout elements
        this.orderConfirmation = page.getByTestId('order-confirmation');
        this.continueShoppingButton = page.getByRole('link', { name: 'Continue shopping' })
    }

    async goto(): Promise<void> {
        await this.page.goto('/checkout');
    }

    /**
     * Clicks the checkout button on the cart page and waits 
     * for navigation to the checkout page to complete
     */
    async clickPlaceOrderButton(): Promise<void> {
        await this.placeOrderButton.click();
        await expect(this.orderConfirmation).toBeVisible({ timeout: 5000 });
    }

    /**
   * Clicks the checkout button on the cart page and waits 
   * for navigation to the checkout page to complete
   */
    async clickContinueShoppingButton(): Promise<void> {
        await this.continueShoppingButton.click();

        // products page should be visible after clicking continue shopping
        await expect(this.productsPage.productCards.first()).toBeVisible();
        await expect(this.page).toHaveURL(/\/$/);
    }

    async isCheckoutConfirmed(): Promise<boolean> {
        await expect(this.orderConfirmation).toBeVisible();
        await expect(this.continueShoppingButton).toBeVisible();
        return true;
    }

    /** Fill in and submit the checkout form. */
    async checkout(details: { name: string; email: string; address: string; city: string; postcode: string }): Promise<void> {
        await this.fullName.fill(details.name);
        await this.email.fill(details.email);
        await this.streetAddress.fill(details.address);
        await this.city.fill(details.city);
        await this.postcode.fill(details.postcode);
        await this.placeOrderButton.click();
    }

    /**
     * 
     * @param field 
     * 
     * Checks the invalidity of the textfield by the locator
     */
    async expectFieldInvalid(
        field: Locator,
        rule?: keyof ValidityState
    ): Promise<void> {
        const isInvalid = await field.evaluate(
            el => !(el as HTMLInputElement).checkValidity()
        );

        expect(isInvalid).toBe(true);

        if (rule) {
            const ruleFailed = await field.evaluate(
                (el, ruleName) => {
                    const input = el as HTMLInputElement;
                    return input.validity[ruleName as keyof ValidityState] === true;
                },
                rule
            );

            expect(ruleFailed).toBe(true);
        }

        const validationMessage = await field.evaluate(
            el => (el as HTMLInputElement).validationMessage
        );

        expect(validationMessage).toBeTruthy();
    }
}
