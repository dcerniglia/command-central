import { test, expect } from '@playwright/test';

test('can switch to Claude Code tab', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Claude Code' }).click();
  await expect(page.getByText('Global Settings')).toBeVisible();
});

test('config sections are visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Claude Code' }).click();

  await expect(page.getByRole('button', { name: /Global Settings/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /CLAUDE\.md/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Skills/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /MCP Servers/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Keybindings/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Project Configs/ })).toBeVisible();
});

test('can expand and collapse sections', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Claude Code' }).click();

  // Sections start expanded — collapse Global Settings
  const settingsButton = page.getByRole('button', { name: /Global Settings/ });
  await expect(settingsButton.getByText('▲')).toBeVisible();
  await settingsButton.click();
  // After collapsing, indicator should change to ▼
  await expect(settingsButton.getByText('▼')).toBeVisible();

  // Click again to expand
  await settingsButton.click();
  await expect(settingsButton.getByText('▲')).toBeVisible();
});
