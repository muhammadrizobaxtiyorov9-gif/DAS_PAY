import 'server-only';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

/** 15 MB hard cap per file */
export const MAX_BYTES = 15 * 1024 * 1024;

export interface SavedFile {
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

function extFor(mime: string, fallback = 'bin'): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'application/pdf':
      return 'pdf';
    default:
      return fallback;
  }
}

/**
 * Persist a single uploaded File to /public/uploads/<bucket>/<yyyymm>/<random>.<ext>
 * Returns a public URL safe to store in DB.
 */
export async function saveUploadedFile(file: File, bucket: string): Promise<SavedFile> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large: ${file.size} bytes (max ${MAX_BYTES})`);
  }

  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const safeBucket = bucket.replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'misc';

  const dir = path.join(UPLOAD_ROOT, safeBucket, yyyymm);
  await mkdir(dir, { recursive: true });

  const id = randomBytes(8).toString('hex');
  const ext = extFor(file.type);
  const fileName = `${id}.${ext}`;
  const fullPath = path.join(dir, fileName);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);

  return {
    url: `/uploads/${safeBucket}/${yyyymm}/${fileName}`,
    size: buf.length,
    mimeType: file.type,
    originalName: file.name || fileName,
  };
}
