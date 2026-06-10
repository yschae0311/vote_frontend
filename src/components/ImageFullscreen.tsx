import { useEffect, useRef, useState } from 'react';
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

const DISMISS_THRESHOLD = 100;

export function ImageFullscreen({ cand, index, total, onClose, onPrev, onNext }: ImageFullscreenProps) {
  const [pullY, setPullY] = useState(0);
  const pullStartY = useRef(0);
  const pullYRef = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  const onPullStart = (e: React.TouchEvent) => {
    pullStartY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const onPullMove = (e: React.TouchEvent) => {
    if (!pulling.current) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0) {
      pullYRef.current = dy;
      setPullY(dy);
    }
  };

  const onPullEnd = () => {
    if (pullYRef.current >= DISMISS_THRESHOLD) onClose();
    pullYRef.current = 0;
    setPullY(0);
    pulling.current = false;
  };

  const stageStyle = pullY > 0
    ? {
        transform: `translateY(${pullY}px)`,
        opacity: Math.max(0.45, 1 - pullY / 280),
        transition: pulling.current ? 'none' : 'transform .22s ease, opacity .22s ease',
      }
    : undefined;

  return (
    <div className="img-fs-backdrop" onClick={onClose}>
      <button type="button" className="img-fs-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="닫기">✕</button>
      <button type="button" className="img-fs-nav img-fs-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="이전">‹</button>
      <button type="button" className="img-fs-nav img-fs-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="다음">›</button>

      <div
        className="img-fs-stage"
        style={stageStyle}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onPullStart}
        onTouchMove={onPullMove}
        onTouchEnd={onPullEnd}
        onTouchCancel={onPullEnd}
      >
        <div className="img-fs-pull-hint" aria-hidden>
          <span className="img-fs-pull-bar" />
          <span className="img-fs-pull-text">아래로 내려 닫기</span>
        </div>
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
