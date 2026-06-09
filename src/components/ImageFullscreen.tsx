import { useEffect, useState } from 'react';
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
  const [landscapeHint, setLandscapeHint] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);

    const mq = window.matchMedia('(max-width: 860px) and (orientation: portrait)');
    const updateHint = () => setLandscapeHint(mq.matches);
    updateHint();
    mq.addEventListener('change', updateHint);

    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', updateHint);
      try {
        screen.orientation?.unlock();
      } catch { /* ignore */ }
    };
  }, [onClose, onPrev, onNext]);

  const tryLandscape = async () => {
    try {
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape');
    } catch { /* ignore */ }
  };

  return (
    <div className="img-fs-backdrop" onClick={onClose}>
      <button type="button" className="img-fs-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="닫기">✕</button>
      <button type="button" className="lb-nav lb-prev img-fs-nav" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="이전">‹</button>
      <button type="button" className="lb-nav lb-next img-fs-nav" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="다음">›</button>

      <div className="img-fs-stage" onClick={(e) => e.stopPropagation()}>
        <div className="img-fs-counter">작품 {index + 1} / {total}</div>
        <div className="img-fs-media" style={{ '--ph-h': cand.tint } as React.CSSProperties}>
          <Placeholder cand={cand} ratio="auto" round="0" emojiSize={120} fit="contain" className="img-fs-ph" />
        </div>
        <div className="img-fs-caption">
          <strong>{cand.name}</strong>
          {cand.team && <span> · {cand.team}</span>}
        </div>
        {landscapeHint && (
          <div className="img-fs-orient">
            <span>📱 가로로 돌리면 원본을 더 크게 볼 수 있어요</span>
            <button type="button" className="btn btn-ghost img-fs-land-btn" onClick={tryLandscape}>가로 화면 고정</button>
          </div>
        )}
      </div>
    </div>
  );
}
