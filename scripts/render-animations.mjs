import { mkdir, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const root = process.cwd();
const chars = JSON.parse(await readFile(path.join(root, 'data/kanji/index.json'), 'utf8'));
await mkdir(path.join(root, 'assets/anim'), { recursive: true });
const manimCli = path.join(root, '.venv-manim/bin/manim');
if (!existsSync(manimCli)) throw new Error(`Manim is required; install it into ${manimCli} before rendering.`);

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
  const manimMedia = path.join(root, 'media', 'manim');
  await run(manimCli, ['-ql', '-r', '720,720', '--fps', '24', '--format', 'mp4', '--media_dir', manimMedia, '-o', `${slug}.mp4`, path.join(root, 'manim/origins.py'), `Origin${char.codePointAt(0).toString(16).toUpperCase()}`]);
  const encodedSource = await findVideo(manimMedia, `${slug}.mp4`);
  if (!encodedSource) throw new Error(`Manim did not write ${slug}.mp4.`);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', encodedSource, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, `${slug}.mp4`)]);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '2.8', '-i', encodedSource, '-frames:v', '1', '-vf', 'scale=720:720', path.join(out, `${slug}.png`)]);
  const { size } = await stat(path.join(out, `${slug}.mp4`));
  if (size >= 300_000) throw new Error(`${char} animation exceeds 300 KB (${size} bytes).`);
  console.log(`${char} ${slug}.mp4 ${size} bytes`);
}
console.log(`Rendered ${chars.length} source-driven origin animations with Manim at 24 fps.`);
