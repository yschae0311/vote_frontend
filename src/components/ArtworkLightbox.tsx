import { useEffect, useState } from 'react';
import type { Candidate } from '../types/api';
import { Placeholder } from './Placeholder';

interface ArtworkLightboxProps {
  candidates: Candidate[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ArtworkLightbox({ candidates, index, onClose, onPrev, onNext }: ArtworkLightboxProps) {
  const cand = candidates[index];
  const total = candidates.length;
  const [landscapeHint, setLandscapeHint] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    const mq = window.matchMedia('(max-width: 860px) and (orientation: portrait)');
    const updateHint = () => setLandscapeHint(mq.matches);
    updateHint();
    mq.addEventListener('change', updateHint);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      mq.removeEventListener('change', updateHint);
      try {
        screen.orientation?.unlock();
      } catch { /* ignore */ }
    };
  }, [onClose, onPrev, onNext]);

  const tryLandscape = async () => {
    try {
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape');
    } catch {
      /* not supported or denied */
    }
  };

  if (!cand) return null;

  return (
    <div className="art-lb-backdrop" onClick={onClose}>
      <button type="button" className="lb-nav lb-prev art-lb-nav" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="이전 작품">‹</button>
      <button type="button" className="lb-nav lb-next art-lb-nav" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="다음 작품">›</button>
      <div className="art-lb-card" style={{ '--ph-h': cand.tint } as React.CSSProperties} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lb-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="art-lb-media">
          <Placeholder cand={cand} ratio="auto" round="0" emojiSize={100} fit="contain" className="art-lb-ph" />
        </div>
        <div className="art-lb-info">
          <div className="art-lb-count">작품 {index + 1} / {total}</div>
          <h2 className="art-lb-name">{cand.name}</h2>
          {cand.tagline && <p className="art-lb-tag">{cand.tagline}</p>}
          {cand.team && <div className="art-lb-team">{cand.team}</div>}
          {landscapeHint && (
            <div className="art-lb-orient">
              <span>📱 기기를 가로로 돌리면 작품을 더 크게 볼 수 있어요</span>
              <button type="button" className="btn btn-ghost art-lb-land-btn" onClick={tryLandscape}>
                가로 화면 고정
              </button>
            </div>
          )}
          <button type="button" className="btn btn-ghost" onClick={onNext}>다음 작품 →</button>
        </div>
      </div>
    </div>
  );
}
