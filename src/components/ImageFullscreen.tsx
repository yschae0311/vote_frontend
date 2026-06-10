import { useEffect } from 'react';
import type { Candidate } from '../types/api';
import { Placeholder } from './Placeholder';

interface ImageFullscreenProps {
  cand: Candidate;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ImageFullscreen({ cand, index, total, onClose, onPrev, onNext }: ImageFullscreenProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="img-fs-backdrop" onClick={onClose}>
      <button type="button" className="img-fs-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="닫기">✕</button>
      <button type="button" className="img-fs-nav img-fs-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="이전">‹</button>
      <button type="button" className="img-fs-nav img-fs-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="다음">›</button>

      <div className="img-fs-stage" onClick={(e) => e.stopPropagation()}>
        <div className="img-fs-counter">후보 {index + 1} / {total}</div>
        <div className="img-fs-media" style={{ '--ph-h': cand.tint } as React.CSSProperties}>
          <Placeholder cand={cand} ratio="auto" round="0" emojiSize={120} fit="contain" className="img-fs-ph" />
        </div>
        <div className="img-fs-caption">
          <strong>{cand.name}</strong>
          {cand.team && <span> · {cand.team}</span>}
        </div>
      </div>
    </div>
  );
}
