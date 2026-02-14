import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers';

test.beforeEach(async () => {
  await resetDatabase();
});

test('page loads and shows dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Tasks', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Claude Code' })).toBeVisible();
  await expect(page.getByText('Projects')).toBeVisible();
});

test('tab navigation between Tasks and Claude Code works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('All Tasks')).toBeVisible();

  await page.getByRole('button', { name: 'Claude Code' }).click();
  await expect(page.getByText('Global Settings')).toBeVisible();
  await expect(page.getByText('All Tasks')).not.toBeVisible();

  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(page.getByText('All Tasks')).toBeVisible();
});

test('quick capture input is visible and auto-focused', async ({ page }) => {
  await page.goto('/');
  const input = page.getByPlaceholder('Quick add a task...');
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
});
