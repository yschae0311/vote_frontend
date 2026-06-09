import { useEffect, useState } from 'react';
import type { Candidate } from '../types/api';
import { ImageFullscreen } from './ImageFullscreen';
import { Medal } from './Medal';
import { Placeholder } from './Placeholder';

interface LightboxProps {
  cand: Candidate;
  rank: number;
  total: number;
  index: number;
  voted: boolean;
  full: boolean;
  onClose: () => void;
  onToggle: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({
  cand, rank, total, index, voted, full, onClose, onToggle, onPrev, onNext,
}: LightboxProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detailOpen) return;
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
  }, [onClose, onPrev, onNext, detailOpen]);

  const selected = rank > 0;
  const blocked = !selected && full;

  return (
    <div className="lb-backdrop" onClick={onClose}>
      <button type="button" className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="이전 작품">‹</button>
      <button type="button" className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="다음 작품">›</button>
      <div className="lb-card" style={{ '--ph-h': cand.tint } as React.CSSProperties} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lb-close" onClick={onClose} aria-label="닫기">✕</button>
        <button
          type="button"
          className="lb-media lb-media-tap"
          onClick={() => setDetailOpen(true)}
          aria-label="원본 이미지 전체 화면으로 보기"
        >
          <Placeholder cand={cand} ratio="auto" round="0" emojiSize={120} />
          {selected && (
            <div className="lb-medal"><Medal rank={rank as 1 | 2 | 3} size={52} /></div>
          )}
          <span className="lb-detail-hint">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            원본 자세히
          </span>
        </button>
        <div className="lb-info">
          <div className="lb-count">작품 {index + 1} / {total}</div>
          <h2 className="lb-name">{cand.name}</h2>
          {cand.tagline && <p className="lb-tag">{cand.tagline}</p>}
          {cand.team && <div className="lb-team">{cand.team}</div>}
          <div className="lb-actions">
            {voted ? (
              <div className="lb-locked">🔒 이미 투표를 완료해 선택을 변경할 수 없어요.</div>
            ) : blocked ? (
              <div className="lb-locked">순위가 가득 찼어요 · 최대 3명까지 선택할 수 있어요. 먼저 한 명을 빼주세요.</div>
            ) : (
              <button
                type="button"
                className={`btn lb-pick${selected ? ' is-on' : ' btn-primary'}`}
                onClick={() => onToggle(cand.id)}
              >
                {selected ? `${rank}순위에서 빼기` : '이 작품 순위에 담기'}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setDetailOpen(true)}>
              원본 전체 화면으로 보기
            </button>
            <button type="button" className="btn btn-ghost" onClick={onNext}>다음 작품 보기 →</button>
          </div>
        </div>
      </div>

      {detailOpen && (
        <ImageFullscreen
          cand={cand}
          index={index}
          total={total}
          onClose={() => setDetailOpen(false)}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </div>
  );
}
