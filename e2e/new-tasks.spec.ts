import { test, expect, type Page } from '@playwright/test';

const TRPC = 'http://localhost:3001/trpc';

/** Authenticate via devLogin and set session cookie */
async function login(page: Page) {
  // Call devLogin via tRPC to get a session cookie
  const res = await page.request.post(`${TRPC}/auth.devLogin`, {
    data: { json: { username: 'e2e-test-user' } },
    headers: { 'content-type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();
}

/** Clean up tasks via tRPC */
async function clearTasks(page: Page) {
  const res = await page.request.get(`${TRPC}/tasks.list?input=${encodeURIComponent(JSON.stringify({ json: { view: 'all' } }))}`);
  if (res.ok()) {
    const body = await res.json();
    const tasks = body?.result?.data?.json ?? [];
    for (const task of tasks) {
      await page.request.post(`${TRPC}/tasks.delete`, {
        data: { json: { id: task.id } },
        headers: { 'content-type': 'application/json' },
      });
    }
  }
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await clearTasks(page);
});

test.describe('Task Management', () => {
  test('can create a task via quick add', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByPlaceholder('Add a task...').fill('My new task');
    await page.keyboard.press('Enter');
    await expect(page.getByText('My new task')).toBeVisible();
  });

  test('can complete a task', async ({ page }) => {
    await page.goto('/tasks');

    // Create a task
    await page.getByPlaceholder('Add a task...').fill('Task to complete');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Task to complete')).toBeVisible();

    // Click the checkbox (first button in the task row)
    const taskRow = page.getByText('Task to complete').locator('xpath=ancestor::div[contains(@class,"group")]');
    await taskRow.locator('button').first().click();

    // Task should appear in completed section
    await expect(page.getByText(/Completed \(1\)/)).toBeVisible();
  });

  test('can switch between smart views', async ({ page }) => {
    await page.goto('/tasks');

    // Default view is Inbox
    await expect(page.getByRole('button', { name: 'Inbox' })).toBeVisible();

    // Switch to Today
    await page.getByRole('button', { name: 'Today' }).click();
    // Should show empty state or tasks
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible();

    // Switch to All
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible();
  });

  test('can open task detail panel by clicking a task', async ({ page }) => {
    await page.goto('/tasks');

    // Create a task
    await page.getByPlaceholder('Add a task...').fill('Detailed task');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Detailed task')).toBeVisible();

    // Click the task row (not the checkbox)
    await page.getByText('Detailed task').click();

    // Detail panel should appear with "Task Detail" header
    await expect(page.getByText('Task Detail')).toBeVisible();
  });

  test('can edit task title in detail panel', async ({ page }) => {
    await page.goto('/tasks');

    // Create a task
    await page.getByPlaceholder('Add a task...').fill('Original title');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Original title')).toBeVisible();

    // Open detail
    await page.getByText('Original title').click();
    await expect(page.getByText('Task Detail')).toBeVisible();

    // Edit the title input in the detail panel
    const titleInput = page.locator('input[class*="heading"]');
    await titleInput.fill('Updated title');
    await titleInput.press('Enter');

    // Updated title should appear in the list
    await expect(page.getByText('Updated title')).toBeVisible();
  });

  test('can close task detail panel', async ({ page }) => {
    await page.goto('/tasks');

    await page.getByPlaceholder('Add a task...').fill('Closeable task');
    await page.keyboard.press('Enter');
    await page.getByText('Closeable task').click();
    await expect(page.getByText('Task Detail')).toBeVisible();

    // Click the X button to close
    await page.locator('button:has(svg)').filter({ has: page.locator('svg.lucide-x') }).click();
    await expect(page.getByText('Task Detail')).not.toBeVisible();
  });

  test('can create an area', async ({ page }) => {
    await page.goto('/tasks');

    // Click the + button next to "Areas" heading
    const areasSection = page.getByText('Areas').locator('..');
    await areasSection.locator('button').click();

    // Type area name and submit
    await page.getByPlaceholder('Area name...').fill('Health');
    await page.keyboard.press('Enter');

    // Area should appear in sidebar
    await expect(page.getByText('Health')).toBeVisible();
  });

  test('shows empty state for inbox when no tasks', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByText('Inbox is empty')).toBeVisible();
    await expect(page.getByText('Tasks without a list or area show up here')).toBeVisible();
  });

  test('multiple tasks can be created and all appear in list', async ({ page }) => {
    await page.goto('/tasks');

    await page.getByPlaceholder('Add a task...').fill('First task');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('Add a task...').fill('Second task');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('Add a task...').fill('Third task');
    await page.keyboard.press('Enter');

    await expect(page.getByText('First task')).toBeVisible();
    await expect(page.getByText('Second task')).toBeVisible();
    await expect(page.getByText('Third task')).toBeVisible();
  });
});
