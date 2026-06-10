import { useEffect } from 'react';
import type { Candidate } from '../types/api';
import { getFigmaUrl, toFigmaEmbedUrl } from '../lib/imageUrl';
import { CloseButton } from './CloseButton';

interface FigmaFullscreenProps {
  cand: Candidate;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function FigmaFullscreen({ cand, index, total, onClose, onPrev, onNext }: FigmaFullscreenProps) {
  const figmaUrl = getFigmaUrl(cand);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  if (!figmaUrl) return null;

  return (
    <div className="figma-fs-backdrop" onClick={onClose}>
      <CloseButton fixed onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <button type="button" className="figma-fs-nav figma-fs-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="이전">‹</button>
      <button type="button" className="figma-fs-nav figma-fs-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="다음">›</button>

      <div className="figma-fs-stage" onClick={(e) => e.stopPropagation()}>
        <div className="figma-fs-counter">프로토타입 · 후보 {index + 1} / {total}</div>
        <iframe
          className="figma-fs-frame"
          src={toFigmaEmbedUrl(figmaUrl)}
          title={`${cand.name} Figma 프로토타입`}
          allowFullScreen
        />
        <div className="figma-fs-caption">
          <strong>{cand.name}</strong>
          {cand.team && <span> · {cand.team}</span>}
        </div>
      </div>
    </div>
  );
}
