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

  // ── Order status timeline ──────────────────────────────────────────────────

  test('PM bookings page loads without API errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/bookings/point-manager')
    await page.waitForLoadState('networkidle')

    // Should not see the previous "Point Manager profile not found" error
    const pmError = errors.find((e) => e.includes('Point Manager profile not found'))
    expect(pmError).toBeUndefined()
  })

  test('PM page does not show alert for missing profile', async ({ page }) => {
    // Intercept dialogs (alert/confirm) – none should fire on a normal page load
    let alertFired = false
    page.on('dialog', async (dialog) => {
      alertFired = true
      await dialog.dismiss()
    })

    await page.goto('/bookings/point-manager')
    await page.waitForLoadState('networkidle')

    expect(alertFired).toBe(false)
  })

  test('order status "Order Status" heading is visible on booking cards when bookings exist', async ({ page }) => {
    await page.goto('/bookings/point-manager')
    await page.waitForLoadState('networkidle')

    const statusHeadings = page.getByText('Order Status')
    const count = await statusHeadings.count()
    if (count > 0) {
      await expect(statusHeadings.first()).toBeVisible()
    }
  })

  test('dashboard chart data loads without errors for PM', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should not see "Point manager has no shop location assigned" error
    const chartError = errors.find((e) => e.includes('Point manager has no shop location'))
    expect(chartError).toBeUndefined()
  })
})
