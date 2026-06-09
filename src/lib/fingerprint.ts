import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cached: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (cached) return cached;
  const fp = await FingerprintJS.load();
  const { visitorId } = await fp.get();
  cached = visitorId;
  return visitorId;
}
