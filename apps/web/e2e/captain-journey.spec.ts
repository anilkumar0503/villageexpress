import { test, expect } from '@playwright/test'

test.describe('Captain Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as captain
    await page.goto('/login')
    // Click password login button
    await page.click('[data-testid="password-login-button"]')
    await page.fill('[data-testid="email-input"]', 'captain1@villageexpress.in')
    await page.fill('[data-testid="password-input"]', 'Captain@123')
    await page.click('[data-testid="submit-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should view dashboard', async ({ page }) => {
    // Verify dashboard is visible
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('should view wallet page', async ({ page }) => {
    await page.click('text=My Wallet')
    await page.waitForURL('/wallet')

    // Verify wallet page is visible
    await expect(page.locator('[data-testid="wallet-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="balance-card"]')).toBeVisible()
  })
})
