import type { Candidate } from '../types/api';
import { resolveImageUrl } from '../lib/imageUrl';

const EMOJI: Record<string, string> = {
  '별빛 여우': '🦊', '코드 곰': '🐻', '클라우드 펭귄': '🐧', '새싹 토끼': '🐰',
  '불꽃 다람쥐': '🐿️', '물결 수달': '🦦', '번개 치타': '🐆', '달빛 고양이': '🐱',
  '방패 거북': '🐢', '무지개 앵무': '🦜', '별똥 고래': '🐳', '솜사탕 양': '🐑',
  '탐험 미어캣': '🦝', '숲지기 사슴': '🦌', '파도 돌고래': '🐬', "꼬마 로봇 '핀'": '🤖',
};

interface PlaceholderProps {
  cand: Pick<Candidate, 'name' | 'tint' | 'image_url'>;
  ratio?: string;
  round?: string;
  emojiSize?: number;
  fit?: 'cover' | 'contain';
  className?: string;
}

export function Placeholder({
  cand,
  ratio = '4 / 3',
  round = 'var(--radius-sm)',
  emojiSize = 40,
  fit = 'cover',
  className,
}: PlaceholderProps) {
  const src = resolveImageUrl(cand.image_url);
  if (src) {
    return (
      <img
        src={src}
        alt={cand.name}
        className={className}
        style={{
          aspectRatio: ratio === 'auto' ? undefined : ratio,
          borderRadius: round,
          width: '100%',
          height: ratio === 'auto' ? '100%' : undefined,
          objectFit: fit,
        }}
      />
    );
  }
  return (
    <div
      className={`ph${className ? ` ${className}` : ''}`}
      style={{ '--ph-h': cand.tint, aspectRatio: ratio === 'auto' ? undefined : ratio, borderRadius: round, height: ratio === 'auto' ? '100%' : undefined } as React.CSSProperties}
    >
      <span className="ph-emoji" style={{ fontSize: emojiSize }}>{EMOJI[cand.name] || '✨'}</span>
      <span className="ph-label" style={{ position: 'absolute', bottom: 8, right: 8 }}>작품 이미지</span>
    </div>
  );
}
