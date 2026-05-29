import { test, expect } from '@playwright/test'

test.describe('Point Manager Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as point manager
    await page.goto('/login')
    // Click password login button
    await page.click('[data-testid="password-login-button"]')
    await page.fill('[data-testid="email-input"]', 'pm.karimnagar@villageexpress.in')
    await page.fill('[data-testid="password-input"]', 'Pm@123')
    await page.click('[data-testid="submit-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should view dashboard', async ({ page }) => {
    // Verify dashboard is visible
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('should view point manager page', async ({ page }) => {
    await page.click('text=My Point Queue')
    await page.waitForURL('/bookings/point-manager')

    // Verify point manager page is visible
    await expect(page.locator('[data-testid="point-manager-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="page-title"]')).toBeVisible()
  })

  test('should view reports page', async ({ page }) => {
    await page.click('text=Reports')
    await page.waitForURL('/reports')

    // Verify reports page is visible
    await expect(page.locator('[data-testid="reports-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="summary-cards"]')).toBeVisible()
  })
})
