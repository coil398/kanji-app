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

  const shortLink = new URL('k/%E6%9C%A8/?utm_source=tiktok', base);
  await page.goto(shortLink.toString(), { waitUntil: 'networkidle' });
  assert.equal(new URL(page.url()).searchParams.get('utm_source'), 'tiktok');
  await page.getByText('The oldest form shows a tree: branches on top, roots below.').waitFor();
  assert.equal(await page.getByText('木', { exact: true }).first().isVisible(), true);
  const source = page.getByRole('link', { name: 'English Wiktionary — Glyph origin' });
  assert.equal(await source.getAttribute('href'), 'https://en.wiktionary.org/wiki/%E6%9C%A8#Glyph_origin');
  const video = page.locator('video');
  await video.waitFor({ state: 'attached' });
  await page.waitForFunction(() => {
    const element = document.querySelector('video');
    return Boolean(element && element.readyState >= 2 && !element.paused);
  });
  await page.screenshot({ path: path.resolve('research/screens/kanji-木.png'), fullPage: true });
  await page.getByRole('button', { name: 'Got it → Quiz' }).click();
  await page.getByText('Choose the right answer.').waitFor();
  await page.screenshot({ path: path.resolve('research/screens/quiz.png'), fullPage: true });
  await page.getByRole('button').first().click();
  await page.getByText(/That’s right|The answer is/).waitFor();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: '木', exact: true }).click();
  await page.getByRole('button', { name: 'Finish quiz' }).click();
  await page.getByText('木 is learned.').waitFor();
  await page.getByRole('button', { name: 'Back to my kanji' }).click();
  await page.getByText('1/13 learned').waitFor();
  await page.goto(new URL('review/', base).toString(), { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.resolve('research/screens/review.png'), fullPage: true });
  await page.getByText(/Review|due/i).first().waitFor();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#waitlist-email').fill('learner@example.com');
  await page.getByRole('button', { name: 'Notify me when the iOS app launches' }).click();
  await page.getByText("Thanks — you're on the list.").waitFor();

  const signupContext = await browser.newContext({ viewport: { width: 1365, height: 1100 }, deviceScaleFactor: 1 });
  const signupPage = await signupContext.newPage();
  signupPage.on('pageerror', (error) => errors.push(error.message));
  signupPage.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  signupPage.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await signupPage.goto(`${base}?utm_source=tiktok&utm_campaign=ios-prereg`, { waitUntil: 'networkidle' });
  await signupPage.locator('#waitlist-email').fill('tiktok@example.com');
  await signupPage.getByRole('radio', { name: 'Yes' }).check();
  await signupPage.screenshot({ path: path.resolve('research/screens/waitlist.png'), fullPage: true });
  await signupPage.getByRole('button', { name: 'Notify me when the iOS app launches' }).click();
  await signupPage.getByText("Thanks — you're on the list.").waitFor();
  const saved = await signupPage.evaluate(() => JSON.parse(localStorage.getItem('@kanji-origins/waitlist') ?? '[]'));
  assert.equal(saved[0].source, 'tiktok');
  assert.equal(saved[0].first_touch_source, 'tiktok');
  assert.equal(saved[0].pay_intent, 'yes');
  assert.equal(saved[0].raw_utm.utm_campaign, 'ios-prereg');
  assert.match(saved[0].landing_path, /utm_source=tiktok/);
  assert.ok(saved[0].timestamp);
  await signupContext.close();
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`);
  console.log('Home, the /k/木 attribution route, quiz, review, local waitlist, pay intent, and TikTok first-touch attribution verified without browser errors. Screenshots saved in research/screens/.');
} finally {
  await browser.close();
}
