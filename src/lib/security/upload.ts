import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env';
import { SECURITY_LIMITS } from '../../config/constants';

export interface ValidatedFile {
  originalName: string;
  storedFilename: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  buffer: Buffer;
}




export function detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 8) return null;

  
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}




export async function validateAndSaveFile(file: File): Promise<ValidatedFile> {
  
  if (file.size > SECURITY_LIMITS.MAX_UPLOAD_SIZE) {
    throw new Error(`檔案大小超出限制（上限 5MB，目前為 ${(file.size / 1024 / 1024).toFixed(2)}MB）`);
  }

  if (file.size === 0) {
    throw new Error('不可上傳空檔案');
  }

  
  const ext = path.extname(file.name).toLowerCase();
  if (!SECURITY_LIMITS.ALLOWED_EXTENSIONS.includes(ext as any)) {
    throw new Error('僅支援 JPG、PNG 或 PDF 格式檔案');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  
  const detectedMime = detectMimeTypeFromMagicBytes(buffer);
  if (!detectedMime || !SECURITY_LIMITS.ALLOWED_MIME_TYPES.includes(detectedMime as any)) {
    throw new Error('檔案內容格式不合規範或特徵碼異常（禁止偽裝副檔名）');
  }

  
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  
  const storedFilename = `${crypto.randomUUID()}${ext}`;
  const targetPath = path.join(env.resolvedUploadDir, storedFilename);

  
  if (!targetPath.startsWith(env.resolvedUploadDir)) {
    throw new Error('路徑存取非法');
  }

  
  await fs.promises.writeFile(targetPath, buffer);

  return {
    originalName: path.basename(file.name),
    storedFilename,
    fileSize: file.size,
    mimeType: detectedMime,
    hash,
    buffer
  };
}




export function getAttachmentFilePath(storedFilename: string): string | null {
  const safeFilename = path.basename(storedFilename);
  const targetPath = path.join(env.resolvedUploadDir, safeFilename);

  if (!targetPath.startsWith(env.resolvedUploadDir) || !fs.existsSync(targetPath)) {
    return null;
  }
  return targetPath;
}
