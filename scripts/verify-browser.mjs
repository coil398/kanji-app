import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.KANJI_BASE_URL ?? 'http://127.0.0.1:8000/kanji-app/';
const errors = [];
await mkdir('research/screens', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 1100 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByText('Japanese, one shape at a time.').waitFor();
  await page.screenshot({ path: path.resolve('research/screens/home.png'), fullPage: true });

  await page.goto(new URL('kanji/%E6%97%A5/', base).toString(), { waitUntil: 'networkidle' });
  await page.getByText('Pictogram of the sun.').waitFor();
  const source = page.getByRole('link', { name: "Wiktionary, '日' — Glyph origin" });
  assert.equal(await source.getAttribute('href'), 'https://en.wiktionary.org/wiki/%E6%97%A5');
  const video = page.locator('video');
  await video.waitFor({ state: 'attached' });
  await page.waitForFunction(() => {
    const element = document.querySelector('video');
    return Boolean(element && element.readyState >= 2 && !element.paused);
  });
  await page.screenshot({ path: path.resolve('research/screens/kanji-日.png'), fullPage: true });
  await page.getByRole('button', { name: 'Got it → Quiz' }).click();
  await page.getByRole('button').first().click();
  await page.getByText(/That’s right|The answer is/).waitFor();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: '日', exact: true }).click();
  await page.getByRole('button', { name: 'Finish quiz' }).click();
  await page.getByText('日 is learned.').waitFor();
  await page.getByRole('button', { name: 'Back to my kanji' }).click();
  await page.getByText('1/18 learned').waitFor();
  await page.locator('#waitlist-email').fill('learner@example.com');
  await page.getByRole('button', { name: 'Notify me when the iOS app launches' }).click();
  await page.getByText('Thanks — saved.').waitFor();
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`);
  console.log(`Home, /kanji/日/, quiz completion, on-device progress, and local waitlist save verified. Screenshots saved in research/screens/.`);
} finally {
  await browser.close();
}
