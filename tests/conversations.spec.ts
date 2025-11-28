import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

test.describe('Admin Conversations UI', () => {
  test('visual and a11y checks', async ({ page }) => {
    await page.goto('/admin/conversations')
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveScreenshot('conversations-page.png', { fullPage: false })

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
