import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function accessible(page: import('@playwright/test').Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    })),
  ).toEqual([]);
}
test('dashboard to real disease candidates, directory and model catalogue', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A clearer view of symptoms.' }),
  ).toBeVisible();
  await expect(page.locator('.metric').first()).toContainText('49');
  await accessible(page);
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page).toHaveURL(/#\/assessment/);
  await accessible(page);
  await page.getByRole('button', { name: 'View disease candidates' }).click();
  await expect(page).toHaveURL(/#\/results/);
  await expect(
    page.getByRole('heading', { name: 'Influenza', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Victoria Hospital', exact: true }),
  ).toBeVisible();
  await accessible(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download research report' }).click();
  expect((await download).suggestedFilename()).toBe(
    'arovia-research-result.json',
  );
  await page.getByRole('link', { name: /Hospital directory/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Explore listed hospitals.' }),
  ).toBeVisible();
  await page.getByLabel('Search directory').fill('Victoria');
  await expect(page.locator('.hospital-card')).toHaveCount(1);
  await accessible(page);
  await page.getByRole('link', { name: /Model & sources/ }).click();
  await page.getByLabel('Search disease names').fill('Influenza');
  await page.getByRole('button', { name: /Influenza/ }).click();
  await expect(
    page.getByText(/Binary symptoms listed in the source catalogue/),
  ).toBeVisible();
  await accessible(page);
  await page.getByRole('link', { name: /Symptom assessment/ }).click();
  await page.getByLabel('Include Bengaluru hospitals').uncheck();
  await page.getByRole('button', { name: 'View disease candidates' }).click();
  await expect(
    page.getByRole('heading', { name: 'Hospital ranking is off' }),
  ).toBeVisible();
});
test('API failure is visible and can be retried', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(
    page.getByRole('button', { name: 'View disease candidates' }),
  ).toBeEnabled();
  await page.route('**/api/v1/predictions', (r) =>
    r.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Temporarily unavailable.' } }),
    }),
  );
  await page.getByRole('button', { name: 'View disease candidates' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Temporarily unavailable.',
  );
  await page.getByRole('button', { name: 'Return to assessment' }).click();
  await expect(
    page.getByRole('button', { name: 'View disease candidates' }),
  ).toBeEnabled();
});
