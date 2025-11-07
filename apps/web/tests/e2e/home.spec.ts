import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Open Financial Terminal/)
})

test('shows main heading', async ({ page }) => {
  await page.goto('/')
  const heading = page.getByRole('heading', { name: 'Open Financial Terminal' })
  await expect(heading).toBeVisible()
})
