import { test, expect } from '@playwright/test'

test('login page loads', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'wrong-password')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Invalid credentials')).toBeVisible()
})
