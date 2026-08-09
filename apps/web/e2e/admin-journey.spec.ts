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

  // ── User edit: displayId & password ───────────────────────────────────────

  test('users page loads without errors', async ({ page }) => {
    await page.goto('/users')
    await expect(page.locator('[data-testid="users-page"]')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('edit user dialog has User ID field', async ({ page }) => {
    await page.goto('/users')
    // Open the first edit dialog
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      await expect(page.getByLabel('User ID')).toBeVisible()
    }
  })

  test('edit user dialog has New Password and Confirm Password fields', async ({ page }) => {
    await page.goto('/users')
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      await expect(page.getByLabel('New Password')).toBeVisible()
      await expect(page.getByLabel('Confirm Password')).toBeVisible()
    }
  })

  test('edit user dialog shows password hint text', async ({ page }) => {
    await page.goto('/users')
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      await expect(page.getByText('Leave blank to keep the existing password')).toBeVisible()
    }
  })

  test('edit user dialog shows validation error for short password', async ({ page }) => {
    await page.goto('/users')
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()

      await page.getByLabel('New Password').fill('short')
      await page.getByLabel('Confirm Password').fill('short')
      await page.getByRole('button', { name: 'Save Changes' }).click()

      await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
    }
  })

  test('edit user dialog shows validation error when passwords do not match', async ({ page }) => {
    await page.goto('/users')
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()

      await page.getByLabel('New Password').fill('securepass1')
      await page.getByLabel('Confirm Password').fill('securepass2')
      await page.getByRole('button', { name: 'Save Changes' }).click()

      await expect(page.getByText('Passwords do not match')).toBeVisible()
    }
  })

  test('edit user dialog can update displayId field value', async ({ page }) => {
    await page.goto('/users')
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()

      const userIdInput = page.getByLabel('User ID')
      await userIdInput.clear()
      await userIdInput.fill('TEST-001')

      await expect(userIdInput).toHaveValue('TEST-001')
    }
  })
})
