import { test, expect } from '@playwright/test';
import { resetDatabase, createTaskViaApi, startTimerViaApi, unique } from './helpers';

test.beforeEach(async () => {
  await resetDatabase();
});

test('can start a timer on a task', async ({ page }) => {
  const taskName = unique('TimedTask');
  await createTaskViaApi(taskName);

  await page.goto('/');
  await expect(page.getByText(taskName)).toBeVisible();

  const taskText = page.getByText(taskName, { exact: true });
  const taskRow = taskText.locator('xpath=ancestor::div[contains(@class,"group")]');
  await taskRow.hover();
  await taskRow.getByTitle('Start timer').click();

  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
});

test('active timer shows in the timer bar', async ({ page }) => {
  const taskName = unique('TimerBarTask');
  const task = await createTaskViaApi(taskName);
  await startTimerViaApi(task.id);

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await expect(page.locator('header').getByText(taskName)).toBeVisible();
});

test('can stop a running timer', async ({ page }) => {
  const taskName = unique('StoppableTask');
  const task = await createTaskViaApi(taskName);
  await startTimerViaApi(task.id);

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).not.toBeVisible();
});
