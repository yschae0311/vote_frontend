import { useEffect, useState } from 'react';
import type { Candidate } from '../types/api';
import { hasFigmaPrototype } from '../lib/imageUrl';
import type { Rank, RankSlots } from '../lib/rankSlots';
import { rankOf } from '../lib/rankSlots';
import { RankPicker } from './RankPicker';
import { FigmaFullscreen } from './FigmaFullscreen';
import { ImageFullscreen } from './ImageFullscreen';
import { Medal } from './Medal';
import { Placeholder } from './Placeholder';

interface LightboxProps {
  cand: Candidate;
  rankSlots: RankSlots;
  maxSelections: number;
  candidates: Candidate[];
  total: number;
  index: number;
  voted: boolean;
  onClose: () => void;
  onPickRank: (rank: Rank) => void;
  onPrev: () => void;
  onNext: () => void;
}

const FIGMA_ICON = (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
    <path d="M8 24a4 4 0 0 1-4-4v-4h4a4 4 0 0 1 0 8Zm8-12a4 4 0 0 0 0-8H8v8h8Zm0 0a4 4 0 1 1 0 8h-4v4a4 4 0 1 0 8-8Zm0-8a4 4 0 0 0-4-4H8v8h4a4 4 0 0 0 4-4Z" />
  </svg>
);

const EXPAND_ICON = (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

export function Lightbox({
  cand, rankSlots, maxSelections, candidates, total, index, voted, onClose, onPickRank, onPrev, onNext,
}: LightboxProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [figmaOpen, setFigmaOpen] = useState(false);
  const hasFigma = hasFigmaPrototype(cand);

  const currentRank = rankOf(rankSlots, cand.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detailOpen || figmaOpen) return;
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
  }, [onClose, onPrev, onNext, detailOpen, figmaOpen]);

  return (
    <div className="lb-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${cand.name} 후보 보기`}>
      <div className="lb-shell" style={{ '--ph-h': cand.tint } as React.CSSProperties} onClick={(e) => e.stopPropagation()}>
        <div className="lb-canvas">
          <div className="lb-canvas-bar">
            <span className="lb-index">{index + 1} / {total}</span>
            <button type="button" className="lb-dismiss" onClick={onClose} aria-label="닫기">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <button type="button" className="lb-viewport" onClick={() => setDetailOpen(true)} aria-label="이미지 확대">
            <Placeholder cand={cand} ratio="auto" round="8px" emojiSize={96} fit="contain" className="lb-viewport-img" />
          </button>

          <button type="button" className="lb-nav lb-prev" onClick={onPrev} aria-label="이전 후보">‹</button>
          <button type="button" className="lb-nav lb-next" onClick={onNext} aria-label="다음 후보">›</button>
        </div>

        <div className="lb-sheet">
          <div className="lb-sheet-head">
            <div className="lb-meta">
              <h2 className="lb-name">{cand.name}</h2>
              {(cand.tagline || cand.team) && (
                <p className="lb-desc">
                  {cand.tagline}
                  {cand.tagline && cand.team && ' · '}
                  {cand.team}
                </p>
              )}
            </div>
            {currentRank > 0 && (
              <span className="lb-rank-chip">
                <Medal rank={currentRank} size={20} />
                {currentRank}순위
              </span>
            )}
          </div>

          <div className="lb-view-actions">
            <button type="button" className="lb-view-btn" onClick={() => setDetailOpen(true)}>
              {EXPAND_ICON}
              <span>이미지 확대</span>
            </button>
            {hasFigma && (
              <button type="button" className="lb-view-btn lb-view-btn-figma" onClick={() => setFigmaOpen(true)}>
                {FIGMA_ICON}
                <span>Figma 프로토타입</span>
              </button>
            )}
          </div>

          {voted ? (
            <p className="lb-voted-note">투표를 완료했어요. 순위는 변경할 수 없습니다.</p>
          ) : (
            <RankPicker
              candidateId={cand.id}
              rankSlots={rankSlots}
              maxSelections={maxSelections}
              candidates={candidates}
              onPickRank={onPickRank}
            />
          )}
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

      {figmaOpen && (
        <FigmaFullscreen
          cand={cand}
          index={index}
          total={total}
          onClose={() => setFigmaOpen(false)}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </div>
  );
}
