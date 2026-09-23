import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('complete prediction flow, responsive layout and automated accessibility', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Run demonstration' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Use example' }).click();
  await page.getByRole('button', { name: 'Run demonstration' }).click();
  await expect(page.getByText('Fictional Demo Hospital A')).toBeVisible();
  await expect(page.getByText('1.55', { exact: false })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  const analysis = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(analysis.violations).toEqual([]);
  await page.getByLabel('Include fictional facilities').uncheck();
  await page.getByRole('button', { name: 'Run demonstration' }).click();
  await expect(
    page.getByRole('heading', { name: 'Hospital ranking is off' }),
  ).toBeVisible();
});
test('handles a failed API call and allows retry', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Run demonstration' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Use example' }).click();
  await page.route('**/api/v1/predictions', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Temporarily unavailable.' } }),
    }),
  );
  await page.getByRole('button', { name: 'Run demonstration' }).click();
  await expect(page.getByRole('alert')).toHaveText('Temporarily unavailable.');
  await expect(
    page.getByRole('button', { name: 'Run demonstration' }),
  ).toBeEnabled();
});
