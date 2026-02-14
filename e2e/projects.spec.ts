import { test, expect } from '@playwright/test';
import { resetDatabase, createTaskViaApi, createProjectViaApi, unique } from './helpers';

test.beforeEach(async () => {
  await resetDatabase();
});

test('can create a new project via sidebar', async ({ page }) => {
  const name = unique('SidebarProj');
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Project' }).click();
  await page.getByPlaceholder('Project name').fill(name);
  await page.locator('aside').getByRole('button', { name: 'Add' }).click();
  // Verify project appears in the sidebar navigation (not the hidden select option)
  await expect(page.locator('aside nav').getByText(name)).toBeVisible();
});

test('project appears in sidebar with task count', async ({ page }) => {
  const name = unique('CountedProj');
  const project = await createProjectViaApi(name);
  await createTaskViaApi('Task A', project.id);
  await createTaskViaApi('Task B', project.id);

  await page.goto('/');
  const sidebar = page.locator('aside');
  await expect(sidebar.getByText(name)).toBeVisible();
  const projectRow = sidebar.getByRole('button', { name: new RegExp(name) });
  await expect(projectRow.getByText('2')).toBeVisible();
});

test('can click project to filter tasks', async ({ page }) => {
  const name = unique('FilterProj');
  const project = await createProjectViaApi(name);
  await createTaskViaApi('Project Task', project.id);
  await createTaskViaApi('Unassigned Task');

  await page.goto('/');
  await expect(page.getByText('Project Task')).toBeVisible();
  await expect(page.getByText('Unassigned Task')).toBeVisible();

  await page.locator('aside').getByRole('button', { name: new RegExp(name) }).click();
  await expect(page.getByText('Project Task')).toBeVisible();
  await expect(page.getByText('Unassigned Task')).not.toBeVisible();

  await page.getByRole('button', { name: 'All Tasks' }).click();
  await expect(page.getByText('Unassigned Task')).toBeVisible();
});
