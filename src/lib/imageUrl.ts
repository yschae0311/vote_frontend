import type { Candidate } from '../types/api';

/** DB에 https 없이 저장된 URL 등 보정 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export function normalizeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('URL을 입력하세요.');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

export function isFigmaMediaUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('figma.com')) return false;
    return /\/(proto|design|file|board|slides)\//.test(u.pathname);
  } catch {
    return false;
  }
}

export function toFigmaEmbedUrl(url: string): string {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
}

/** 썸네일·라이트박스용 사진 URL (Figma 링크는 제외) */
export function thumbnailImageUrl(url: string | null | undefined): string | undefined {
  const resolved = resolveImageUrl(url);
  if (!resolved || isFigmaMediaUrl(resolved)) return undefined;
  return resolved;
}

/** Figma 프로토타입 URL (전용 필드 + 예전 image_url 호환) */
export function getFigmaUrl(cand: Pick<Candidate, 'figma_url' | 'image_url'>): string | undefined {
  const fromField = resolveImageUrl(cand.figma_url);
  if (fromField) return fromField;
  const legacy = resolveImageUrl(cand.image_url);
  if (legacy && isFigmaMediaUrl(legacy)) return legacy;
  return undefined;
}

export function hasFigmaPrototype(cand: Pick<Candidate, 'figma_url' | 'image_url'>): boolean {
  return Boolean(getFigmaUrl(cand));
}
