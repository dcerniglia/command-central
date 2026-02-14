import { test, expect } from '@playwright/test';

test('insights tab shows iframe or no-report message', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Insights' }).click();

  // Should show either the iframe (report exists) or the no-report message
  const iframe = page.locator('iframe[title="Claude Code Insights"]');
  const noReport = page.getByText('No insights report found');

  await expect(iframe.or(noReport)).toBeVisible();
});

test('insights tab shows refresh button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Insights' }).click();

  await expect(page.getByRole('button', { name: /Refresh Report/ })).toBeVisible();
});
