import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

const jobs = [
  {
    src: 'logo.png',
    out: 'logo.png',
    size: 512,
    format: 'png',
    opts: { compressionLevel: 9, palette: true, quality: 90 },
  },
  {
    src: 'apple-icon.png',
    out: 'apple-icon.png',
    size: 180,
    format: 'png',
    opts: { compressionLevel: 9, palette: true, quality: 90 },
  },
  {
    src: 'og-image.jpg',
    out: 'og-image.jpg',
    width: 1200,
    height: 630,
    format: 'jpeg',
    opts: { quality: 82, mozjpeg: true, progressive: true },
  },
];

const fmt = (b) => (b / 1024).toFixed(1) + ' KB';

for (const job of jobs) {
  const inPath = path.join(PUBLIC, job.src);
  const outPath = path.join(PUBLIC, job.out);
  const tmpPath = outPath + '.tmp';

  const before = (await fs.stat(inPath)).size;

  let pipeline = sharp(inPath);

  if (job.size) {
    pipeline = pipeline.resize(job.size, job.size, { fit: 'cover' });
  } else if (job.width && job.height) {
    pipeline = pipeline.resize(job.width, job.height, { fit: 'cover' });
  }

  if (job.format === 'png') pipeline = pipeline.png(job.opts);
  if (job.format === 'jpeg') pipeline = pipeline.jpeg(job.opts);

  await pipeline.toFile(tmpPath);
  await fs.rename(tmpPath, outPath);

  const after = (await fs.stat(outPath)).size;
  const saved = ((1 - after / before) * 100).toFixed(0);
  console.log(`✅ ${job.out.padEnd(18)} ${fmt(before).padStart(10)} → ${fmt(after).padStart(10)}  (-${saved}%)`);
}

console.log('\n🎉 Optimization complete.');
