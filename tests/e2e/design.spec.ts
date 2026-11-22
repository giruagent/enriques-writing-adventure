import {test, expect} from '@playwright/test';

const noOverflow = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('phone header keeps the grown-up gear visible and tappable', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('./');
  const parent = page.getByRole('button', {name: /Grown-ups|Adultos/});
  await expect(parent.locator('[aria-hidden="true"]')).toBeVisible();
  const box = await parent.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(await noOverflow(page)).toBe(true);
});

test('opening an exercise resets the scroll position and focuses its heading', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('./');
  await page.evaluate(() => window.scrollTo(0, 600));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole('button', {name: /Letter Meadow|Pradera de letras/}).click();
  await expect(page.getByRole('application')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeLessThanOrEqual(1);
  await expect(page.locator('.exercise-copy h1')).toBeFocused();
});

test('tablet play keeps the writing pad inside the first viewport', async ({page}) => {
  await page.setViewportSize({width: 768, height: 1024});
  await page.goto('./');
  await page.getByRole('button', {name: /Letter Meadow|Pradera de letras/}).click();
  const pad = page.getByRole('application');
  await expect(pad).toBeVisible();
  const box = await pad.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThan(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(1024);
});

for (const language of ['en', 'es'] as const) {
  test(`trophy book uses a singular label for one level in each adventure (${language})`, async ({page}) => {
    await page.addInitScript(lang => localStorage.setItem('enrique-adventure-v1', JSON.stringify({
      unlocked: 1, completed: [], history: [],
      levels: {name: [1], alphabet: [1], numbers: [1]},
      settings: {language: lang, music: false, speech: false},
    })), language);
    await page.goto('./');
    await page.getByRole('button', {name: language === 'en' ? 'Trophy book' : 'Libro de logros'}).click();
    await expect(page.getByText(language === 'en' ? '1 level in each adventure' : '1 nivel en cada aventura', {exact: true})).toBeVisible();
    await expect(page.getByText(language === 'en' ? '1 levels in each adventure' : '1 niveles en cada aventura')).toHaveCount(0);
  });
}

test('map, play and the grown-up corner avoid horizontal overflow at 320 and 1024', async ({page}) => {
  for (const width of [320, 1024]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('./');
    expect(await noOverflow(page), `map at ${width}`).toBe(true);
    await page.getByRole('button', {name: /Grown-ups|Adultos/}).click();
    await page.getByRole('dialog').getByRole('button', {name: '7'}).click();
    await expect(page.getByRole('heading', {name: /Grown-up corner|Rincón de adultos/})).toBeVisible();
    expect(await noOverflow(page), `settings at ${width}`).toBe(true);
    await page.getByRole('button', {name: /Close|Cerrar/}).click();
    await page.getByRole('button', {name: /Letter Meadow|Pradera de letras/}).click();
    await expect(page.getByRole('application')).toBeVisible();
    expect(await noOverflow(page), `play at ${width}`).toBe(true);
  }
});

test('iPad landscape keeps the pad and its tools inside the first viewport', async ({page}) => {
  await page.setViewportSize({width: 1024, height: 768});
  await page.goto('./');
  await page.getByRole('button', {name: /Letter Meadow|Pradera de letras/}).click();
  const pad = page.getByRole('application');
  await expect(pad).toBeVisible();
  const padBox = await pad.boundingBox();
  expect(padBox).not.toBeNull();
  expect(padBox!.y + padBox!.height).toBeLessThanOrEqual(768);
  const check = page.getByRole('button', {name: /Check my writing|Revisar mi escritura/});
  await expect(check).toBeVisible();
  const checkBox = await check.boundingBox();
  expect(checkBox).not.toBeNull();
  expect(checkBox!.y + checkBox!.height).toBeLessThanOrEqual(768);
});
