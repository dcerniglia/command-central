import { test, expect } from '@playwright/test';
import { resetDatabase, createProjectViaApi, unique } from './helpers';

test.beforeEach(async () => {
  await resetDatabase();
});

test('can create a task via quick capture', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Quick add a task...').fill('My new task');
  await page.locator('form').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('My new task')).toBeVisible();
});

test('can create a task assigned to a project', async ({ page }) => {
  const projName = unique('DevProj');
  await createProjectViaApi(projName);

  await page.goto('/');
  await page.getByPlaceholder('Quick add a task...').fill('Project task');
  await page.locator('form select').selectOption({ label: projName });
  await page.locator('form').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Project task')).toBeVisible();
});

test('can mark a task as complete', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Quick add a task...').fill('Task to complete');
  await page.locator('form').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Task to complete')).toBeVisible();

  const taskText = page.getByText('Task to complete', { exact: true });
  const taskRow = taskText.locator('xpath=ancestor::div[contains(@class,"group")]');
  await taskRow.locator('button').first().click();

  await expect(page.getByText(/Done \(1\)/)).toBeVisible();
});

test('completed tasks appear in Done section', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('Quick add a task...').fill('First task');
  await page.locator('form').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('First task')).toBeVisible();

  await page.getByPlaceholder('Quick add a task...').fill('Second task');
  await page.locator('form').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Second task')).toBeVisible();

  // Complete first task
  const taskText = page.getByText('First task', { exact: true });
  const taskRow = taskText.locator('xpath=ancestor::div[contains(@class,"group")]');
  await taskRow.locator('button').first().click();

  await expect(page.getByText(/Done \(1\)/)).toBeVisible();
  // The remaining task should still be visible in the task list
  await expect(page.getByText('Second task')).toBeVisible();
});
