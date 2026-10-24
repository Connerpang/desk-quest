import { test, expect } from '@playwright/test';

// Full-stack smoke test: browser → Angular → /api proxy → API → Postgres.
test('loads the app shell and reaches the API', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DeskQuest');
  await expect(page.getByRole('status')).toHaveText('API: online');
});
