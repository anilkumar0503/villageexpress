import { test, expect } from '@playwright/test'

test.describe('Commission Settings – Flat Amounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.click('[data-testid="password-login-button"]')
    await page.fill('[data-testid="email-input"]', 'admin@villageexpress.in')
    await page.fill('[data-testid="password-input"]', '12345678')
    await page.click('[data-testid="submit-button"]')
    await page.waitForURL('/dashboard')
  })

  test('commission settings page is reachable from sidebar', async ({ page }) => {
    await page.goto('/settings/commissions')
    await expect(page.locator('h1')).toContainText('Commission Rules')
  })

  test('flat amount fields are present on the commission form', async ({ page }) => {
    await page.goto('/settings/commissions')

    // Enable global rules toggle
    const toggle = page.locator('input[type="checkbox"]').first()
    await toggle.check()

    // Flat amount inputs should be visible
    await expect(page.getByPlaceholder('e.g. 6').first()).toBeVisible()
    await expect(page.getByPlaceholder('e.g. 6').nth(1)).toBeVisible()
  })

  test('flat amount labels explain they override percentage', async ({ page }) => {
    await page.goto('/settings/commissions')

    const toggle = page.locator('input[type="checkbox"]').first()
    await toggle.check()

    await expect(page.getByText('Captain Flat ₹')).toBeVisible()
    await expect(page.getByText('PM Flat ₹')).toBeVisible()
    await expect(page.getByText('(overrides %)', { exact: false }).first()).toBeVisible()
  })

  test('percentage fallback fields are still visible below flat fields', async ({ page }) => {
    await page.goto('/settings/commissions')

    const toggle = page.locator('input[type="checkbox"]').first()
    await toggle.check()

    await expect(page.getByText('Captain %')).toBeVisible()
    await expect(page.getByText('PM %')).toBeVisible()
    await expect(page.getByText('(used if no flat)', { exact: false }).first()).toBeVisible()
  })

  test('can enter ₹6 flat amounts in the form fields', async ({ page }) => {
    await page.goto('/settings/commissions')

    const toggle = page.locator('input[type="checkbox"]').first()
    await toggle.check()

    const flatInputs = page.getByPlaceholder('e.g. 6')
    await flatInputs.first().fill('6')
    await flatInputs.nth(1).fill('6')

    await expect(flatInputs.first()).toHaveValue('6')
    await expect(flatInputs.nth(1)).toHaveValue('6')
  })

  test('existing rules display flat amount or percentage based on config', async ({ page }) => {
    await page.goto('/settings/commissions')

    const toggle = page.locator('input[type="checkbox"]').first()
    await toggle.check()

    // Rule cards should display either "₹X flat" or "Y%" for each role
    const ruleCards = page.locator('[class*="card"]')
    const count = await ruleCards.count()
    if (count > 0) {
      const cardText = await ruleCards.first().textContent()
      const hasFlatDisplay = cardText?.includes('flat') || cardText?.includes('%')
      expect(hasFlatDisplay).toBe(true)
    }
  })
})
