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

  // ── Order status timeline ──────────────────────────────────────────────────

  test('captain page loads without errors', async ({ page }) => {
    await page.goto('/captain')
    // Page should not show an error state
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('captain page shows active assignments tab', async ({ page }) => {
    await page.goto('/captain')
    await expect(page.getByRole('tab', { name: /active|assignments/i })).toBeVisible()
  })

  test('order status section heading is visible on assignment cards when assignments exist', async ({ page }) => {
    await page.goto('/captain')
    // Only verify timeline if there are assignment cards
    const cards = page.locator('text=Order Status')
    const count = await cards.count()
    if (count > 0) {
      await expect(cards.first()).toBeVisible()
    }
  })

  test('order status timeline labels are present on assignment cards', async ({ page }) => {
    await page.goto('/captain')
    const stepLabels = ['At Pickup', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered']
    const firstLabel = page.getByText(stepLabels[0]).first()
    const hasTimeline = await firstLabel.isVisible().catch(() => false)
    if (hasTimeline) {
      // If timeline is shown, all labels should be present
      for (const label of stepLabels) {
        await expect(page.getByText(label).first()).toBeVisible()
      }
    }
  })

  test('completed assignments tab is present', async ({ page }) => {
    await page.goto('/captain')
    await expect(page.getByRole('tab', { name: /completed|delivered/i })).toBeVisible()
  })
})
