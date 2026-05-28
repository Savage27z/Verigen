import { createHash } from 'crypto';

export function sha256FromBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function sha256FromBase64(base64: string): string {
  const buf = Buffer.from(base64, 'base64');
  return sha256FromBuffer(buf);
}
