import { test, expect } from '@playwright/test';

test.describe('RoomBae Location Search & Property Discovery E2E Specs', () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

  test('Complete Location Search & Filter Discovery Flow', async ({ page }) => {
    await page.goto(baseURL);

    // 1. Locate SearchPill on Landing Page
    const searchInput = page.locator('input[role="combobox"]').first();
    await expect(searchInput).toBeVisible();

    // 2. Click location search input and verify popular suggestions appear
    await searchInput.click();
    const dropdown = page.locator('#location-autocomplete-list');
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    // 3. Select Koramangala from dropdown
    const koramangalaOption = page.locator('#location-autocomplete-list').getByText(/Koramangala/i).first();
    await koramangalaOption.click();

    // 4. Submit Search
    const searchButton = page.locator('button[aria-label="Search PGs"]').first();
    await searchButton.click();

    // 5. Verify transition to PGListing page
    await expect(page.getByText(/PGs & Co-Living in|verified stays/i).first()).toBeVisible({ timeout: 5000 });

    // 6. Open Filters Drawer and adjust radius
    const filtersBtn = page.getByRole('button', { name: /filters/i }).first();
    if (await filtersBtn.isVisible()) {
      await filtersBtn.click();
      const radiusSlider = page.locator('input[aria-label="Search radius in kilometers"]');
      if (await radiusSlider.isVisible()) {
        await radiusSlider.fill('10');
      }
    }
  });
});
