import { test, expect } from '@playwright/test'

test.describe('Admin Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    // Click password login button
    await page.click('[data-testid="password-login-button"]')
    await page.fill('[data-testid="email-input"]', 'admin@villageexpress.in')
    await page.fill('[data-testid="password-input"]', '12345678')
    await page.click('[data-testid="submit-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should view dashboard', async ({ page }) => {
    // Verify dashboard is visible
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('should view users page', async ({ page }) => {
    await page.click('text=Users')
    await page.waitForURL('/users')

    // Verify users page is visible
    await expect(page.locator('[data-testid="users-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="page-title"]')).toBeVisible()
  })

  test('should view commissions page', async ({ page }) => {
    await page.click('text=Commissions')
    await page.waitForURL('/commissions')

    // Verify commissions page is visible
    await expect(page.locator('[data-testid="commissions-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="summary-cards"]')).toBeVisible()
  })

  test('should view COD remittances page', async ({ page }) => {
    await page.click('text=COD Remittances')
    await page.waitForURL('/cod-remittances')

    // Verify COD remittances page is visible
    await expect(page.locator('[data-testid="cod-remittances-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="page-title"]')).toBeVisible()
  })

  test('should view payment settings page', async ({ page }) => {
    await page.click('text=Payment Settings')
    await page.waitForURL('/settings/payment')

    // Verify payment settings page is visible
    await expect(page.locator('[data-testid="payment-settings-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="bank-details-card"]')).toBeVisible()
  })

  test('should view approvals page', async ({ page }) => {
    await page.click('text=Approvals')
    await page.waitForURL('/approvals')

    // Verify approvals page is visible
    await expect(page.locator('[data-testid="approvals-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="page-title"]')).toBeVisible()
  })
})
