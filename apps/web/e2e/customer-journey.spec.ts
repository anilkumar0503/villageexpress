import { test, expect } from '@playwright/test'

test.describe('Customer Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login')
    // Click password login button
    await page.click('[data-testid="password-login-button"]')
    await page.fill('[data-testid="email-input"]', 'test.route@villageexpress.in')
    await page.fill('[data-testid="password-input"]', 'Customer@123')
    await page.click('[data-testid="submit-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should view dashboard', async ({ page }) => {
    // Verify dashboard is visible
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('should view my bookings page', async ({ page }) => {
    await page.click('text=My Bookings')
    await page.waitForURL('/bookings/my')

    // Verify my bookings page is visible
    await expect(page.locator('[data-testid="my-bookings-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="page-title"]')).toBeVisible()
  })

  test('should view wallet page', async ({ page }) => {
    await page.click('text=My Wallet')
    await page.waitForURL('/wallet')

    // Verify wallet page is visible
    await expect(page.locator('[data-testid="wallet-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="balance-card"]')).toBeVisible()
  })
})
