import { chromium } from 'playwright';

const base = process.env.MANUS_FRONTEND_URL || 'http://localhost:8081';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const title = await page.title();
const bodyText = await page.locator('body').innerText();
if (!title.includes('Tủ đồ')) throw new Error(`Unexpected title: ${title}`);
if (/Thiếu cấu hình Firebase|Đăng nhập để tạo tủ đồ/.test(bodyText)) throw new Error(`Frontend did not enter Manus runtime: ${bodyText.slice(0, 500)}`);
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
console.log(JSON.stringify({ frontend: 'PASS', title, containsRuntimeContent: Boolean(bodyText.trim()), consoleErrors: 0 }, null, 2));
await browser.close();
