import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const root = process.cwd();
const chars = JSON.parse(await readFile(path.join(root, 'data/kanji/index.json'), 'utf8'));
const scratch = path.join(root, 'media', 'frames');
await mkdir(path.join(root, 'assets/anim'), { recursive: true });
await mkdir(scratch, { recursive: true });
const manimCli = path.join(root, '.venv-manim/bin/manim');
const hasManim = existsSync(manimCli);

function drawing(item) {
  const description = item.animation.manim.picture.toLowerCase();
  if (description.includes('sun')) return '<circle cx="360" cy="335" r="112"/><path d="M280 335h160"/>';
  if (description.includes('crescent moon')) return '<path d="M390 220a140 140 0 1 0 0 230a110 110 0 0 1 0-230z"/>';
  if (description.includes('mountain peaks')) return '<path d="M180 470V350l75 95l75-220l78 220l75-120v145"/>';
  if (description.includes('water lines')) return '<path d="M210 245q35 45 0 90t0 90t0 90M360 230q-35 45 0 90t0 90t0 90M510 245q35 45 0 90t0 90t0 90"/>';
  if (description.includes('trunk') || description.includes('tree with')) return '<path d="M360 220v300M205 340h310M360 340L245 250M360 340l115-90M360 440l-95 95M360 440l95 95M235 455h250"/>';
  if (description.includes('standing human')) return '<circle cx="360" cy="240" r="38"/><path d="M360 280l-45 115m45-115l60 95m-105 20l-85 100m85-100l85 100"/>';
  if (description.includes('flames')) return '<path d="M280 480q-85-105 15-220q-5 85 60 110q60-100 50-170q125 120 75 250q-30 80-120 80t-115-50z"/>';
  if (description.includes('flowing water')) return '<path d="M225 230q55 55 0 110t0 110t0 80M360 220v320M495 230q-55 55 0 110t0 110t0 80"/>';
  if (description.includes('above')) return '<path d="M190 460h340M360 460V245m-55 90h110"/>';
  if (description.includes('below')) return '<path d="M190 285h340M360 285v215m-55-60h110"/>';
  if (description.includes('one horizontal')) return '<path d="M220 360h280"/>';
  if (description.includes('two horizontal')) return '<path d="M230 300h260M210 420h300"/>';
  if (description.includes('three horizontal')) return '<path d="M240 270h240M210 360h300M240 450h240"/>';
  if (description.includes('seated')) return '<circle cx="360" cy="255" r="38"/><path d="M280 340q80 55 160 0M360 300v165m0-115l-100 45m100-45l95 70m-95 45l-110 95m110-95l100 90"/>';
  if (description.includes('baby')) return '<circle cx="360" cy="265" r="52"/><path d="M270 360q90 65 180 0m-90-40v160m-75-30h150m-110 30l-55 70m110-70l55 70"/>';
  if (description.includes('cart')) return '<rect x="250" y="250" width="220" height="240" rx="12"/><path d="M360 250v240M250 330h220M250 410h220"/><circle cx="235" cy="300" r="25"/><circle cx="485" cy="300" r="25"/><circle cx="235" cy="440" r="25"/><circle cx="485" cy="440" r="25"/>';
  if (description.includes('cloud')) return '<path d="M270 290q10-95 105-85q85-10 95 85q75 15 40 80H270q-80-10 0-80zM310 405v55m50-55v55m50-55v55m50-55v55"/>';
  if (description.includes('bent elbow')) return '<path d="M280 245v170q0 95 110 65l65-25M275 360h180"/>';
  throw new Error(`No scene drawing mapped for ${item.char}: ${description}`);
}

function frameSvg(item, frame) {
  const t = frame / 71;
  const drawingOpacity = 1 - Math.max(0, Math.min(1, (t - .25) / .24));
  const glyphOpacity = Math.max(0, Math.min(1, (t - .25) / .24));
  const body = drawing(item);
  const glyph = item.char;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720"><rect width="720" height="720" fill="#f6f3eb"/><g fill="none" stroke="#31564a" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="${drawingOpacity}">${body}</g><text x="360" y="465" text-anchor="middle" font-family="Noto Serif CJK JP, Noto Sans CJK JP, sans-serif" font-size="310" font-weight="600" fill="#1e2927" opacity="${glyphOpacity}">${glyph}</text><text x="360" y="620" text-anchor="middle" font-family="sans-serif" font-size="32" letter-spacing="4" fill="#62716b">${item.meanings[0].toUpperCase()}</text></svg>`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
  });
}

async function findVideo(directory, basename) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const found = await findVideo(fullPath, basename);
      if (found) return found;
    } else if (entry.name === basename) return fullPath;
  }
  return null;
}

for (const char of chars) {
  const item = JSON.parse(await readFile(path.join(root, 'data/kanji', `${char}.json`), 'utf8'));
  const slug = char.codePointAt(0).toString(16);
  const out = path.join(root, 'assets/anim');
  let encodedSource;
  if (hasManim) {
    const manimMedia = path.join(root, 'media', 'manim');
    await run(manimCli, ['-ql', '-r', '720,720', '--fps', '24', '--format', 'mp4', '--media_dir', manimMedia, '-o', `${slug}.mp4`, path.join(root, 'manim/origins.py'), `Origin${char.codePointAt(0).toString(16).toUpperCase()}`]);
    encodedSource = await findVideo(manimMedia, `${slug}.mp4`);
    if (!encodedSource) throw new Error(`Manim did not write ${slug}.mp4.`);
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', encodedSource, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, `${slug}.mp4`)]);
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '2.8', '-i', encodedSource, '-frames:v', '1', '-vf', 'scale=720:720', path.join(out, `${slug}.png`)]);
  } else {
    const frames = path.join(scratch, slug);
    await rm(frames, { recursive: true, force: true });
    await mkdir(frames, { recursive: true });
    for (let index = 0; index < 72; index += 1) {
      await sharp(Buffer.from(frameSvg(item, index))).png().toFile(path.join(frames, `frame-${String(index).padStart(3, '0')}.png`));
    }
    encodedSource = path.join(frames, 'frame-%03d.png');
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '24', '-i', encodedSource, '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, `${slug}.mp4`)]);
    await writeFile(path.join(out, `${slug}.png`), await sharp(Buffer.from(frameSvg(item, 71))).png().toBuffer());
  }
  const { size } = await stat(path.join(out, `${slug}.mp4`));
  if (size >= 300_000) throw new Error(`${char} animation exceeds 300 KB (${size} bytes).`);
  console.log(`${char} ${slug}.mp4 ${size} bytes`);
}
console.log(`Rendered ${chars.length} source-driven origin animations at 24 fps${hasManim ? ' with Manim' : ' with SVG and ffmpeg (Manim unavailable)'}.`);
