// Renderiza index.html quadro a quadro no Chromium headless e codifica com ffmpeg.
//   node render.mjs                  → out/duas-flechas.mp4 (1080x1920, 30fps)
//   node render.mjs --fps 60
//   node render.mjs --still 5,28.7   → PNGs avulsos em out/ (pré-visualização)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const FPS = Number(opt('fps', 30));
const OUT = opt('out', path.join(root, 'out', 'duas-flechas.mp4'));
const STILL = opt('still', null);

const executablePath = process.env.CHROME_PATH ||
  ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);

mkdirSync(path.join(root, 'out'), { recursive: true });

const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.goto(pathToFileURL(path.join(root, 'index.html')).href + '?render');
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const duration = await page.evaluate(() => window.DURATION);

const shot = async (t) => {
  await page.evaluate((t) => window.seek(t), t);
  return page.screenshot({ type: 'png', animations: 'disabled', caret: 'initial' });
};

if (STILL) {
  for (const t of STILL.split(',').map(Number)) {
    const file = path.join(root, 'out', `frame-${t.toFixed(2)}.png`);
    await page.evaluate((t) => window.seek(t), t);
    await page.screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
  process.exit(0);
}

const total = Math.round(duration * FPS);
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg saiu com ${c}`)))));

const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const buf = await shot(f / FPS);
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % FPS === 0) process.stdout.write(`\r${f}/${total} frames · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await ffDone;
await browser.close();
console.log(`\n✔ ${OUT}`);
