import { useCallback, useEffect, useRef, useState } from 'react';
import type { Candidate } from '../types/api';
import { hasFigmaPrototype } from '../lib/imageUrl';
import type { Rank, RankSlots } from '../lib/rankSlots';
import { rankOf } from '../lib/rankSlots';
import { RankPicker } from './RankPicker';
import { FigmaFullscreen } from './FigmaFullscreen';
import { CloseButton } from './CloseButton';
import { ImageFullscreen } from './ImageFullscreen';
import { Medal } from './Medal';
import { Placeholder } from './Placeholder';

interface LightboxProps {
  candidates: Candidate[];
  index: number;
  rankSlots: RankSlots;
  maxSelections: number;
  total: number;
  voted: boolean;
  onClose: () => void;
  onPickRank: (rank: Rank) => void;
  onIndexChange: (index: number) => void;
}

const FIGMA_ICON = (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
    <path d="M8 24a4 4 0 0 1-4-4v-4h4a4 4 0 0 1 0 8Zm8-12a4 4 0 0 0 0-8H8v8h8Zm0 0a4 4 0 1 1 0 8h-4v4a4 4 0 1 0 8-8Zm0-8a4 4 0 0 0-4-4H8v8h4a4 4 0 0 0 4-4Z" />
  </svg>
);

const DISMISS_THRESHOLD = 110;
const CLOSE_MS = 260;

function closeDurationMs() {
  return window.matchMedia('(max-width: 760px)').matches ? CLOSE_MS : 220;
}

export function Lightbox({
  candidates, index, rankSlots, maxSelections, total, voted, onClose, onPickRank, onIndexChange,
}: LightboxProps) {
  const cand = candidates[index];
  const [detailOpen, setDetailOpen] = useState(false);
  const [figmaOpen, setFigmaOpen] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const pagerRef = useRef<HTMLDivElement>(null);
  const scrollSync = useRef(false);
  const pullStartY = useRef(0);
  const pullYRef = useRef(0);
  const pulling = useRef(false);
  const closeTimer = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      onClose();
    }, closeDurationMs());
  }, [isClosing, onClose]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const currentRank = rankOf(rankSlots, cand.id);
  const hasFigma = hasFigmaPrototype(cand);

  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;
    scrollSync.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'auto' });
    const t = window.setTimeout(() => { scrollSync.current = false; }, 50);
    return () => window.clearTimeout(t);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detailOpen || figmaOpen) return;
      if (e.key === 'Escape') requestClose();
      else if (e.key === 'ArrowLeft') onIndexChange((index - 1 + candidates.length) % candidates.length);
      else if (e.key === 'ArrowRight') onIndexChange((index + 1) % candidates.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [requestClose, onIndexChange, index, candidates.length, detailOpen, figmaOpen]);

  const handlePagerScroll = () => {
    if (scrollSync.current) return;
    const el = pagerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next >= 0 && next < candidates.length && next !== index) {
      onIndexChange(next);
    }
  };

  const goPrev = () => onIndexChange((index - 1 + candidates.length) % candidates.length);
  const goNext = () => onIndexChange((index + 1) % candidates.length);

  const onPullStart = (e: React.TouchEvent) => {
    if (detailOpen || figmaOpen) return;
    if (window.matchMedia('(min-width: 761px)').matches) return;
    pullStartY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const onPullMove = (e: React.TouchEvent) => {
    if (!pulling.current || detailOpen || figmaOpen) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0) {
      pullYRef.current = dy;
      setPullY(dy);
    }
  };

  const onPullEnd = () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullYRef.current >= DISMISS_THRESHOLD) {
      requestClose();
      pullYRef.current = 0;
      setPullY(0);
      return;
    }
    pullYRef.current = 0;
    setPullY(0);
  };

  const shellStyle = !isClosing && pullY > 0
    ? { transform: `translateY(${pullY}px)`, transition: pulling.current ? 'none' : 'transform .22s ease' }
    : { '--ph-h': cand.tint } as React.CSSProperties;

  return (
    <div
      className={`lb-backdrop${isClosing ? ' is-closing' : ''}`}
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${cand.name} 후보 보기`}
    >
      <div
        className={`lb-shell${isClosing ? ' is-closing' : ''}`}
        style={shellStyle}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onPullStart}
        onTouchMove={onPullMove}
        onTouchEnd={onPullEnd}
        onTouchCancel={onPullEnd}
      >
        <div className="lb-canvas">
          <div className="lb-canvas-bar">
            <span className="lb-index">{index + 1} / {total}</span>
            <CloseButton onClick={requestClose} />
          </div>

          <div
            ref={pagerRef}
            className="lb-pager"
            onScroll={handlePagerScroll}
            aria-label="후보 넘기기"
          >
            {candidates.map((slide) => (
              <div key={slide.id} className="lb-pager-slide">
                <button
                  type="button"
                  className="lb-viewport"
                  onClick={() => setDetailOpen(true)}
                  aria-label={`${slide.name} 이미지 전체화면`}
                >
                  <Placeholder cand={slide} ratio="auto" round="8px" emojiSize={96} fit="contain" className="lb-viewport-img" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="lb-nav lb-prev" onClick={goPrev} aria-label="이전 후보">‹</button>
          <button type="button" className="lb-nav lb-next" onClick={goNext} aria-label="다음 후보">›</button>
        </div>

        <div className="lb-sheet">
          <div className="lb-sheet-grab-row" aria-hidden>
            <span className="lb-sheet-grab" />
          </div>
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
                <Medal rank={currentRank} size={22} />
                {currentRank}순위
              </span>
            )}
          </div>

          {hasFigma && (
            <div className="lb-view-actions">
              <button type="button" className="lb-view-btn lb-view-btn-figma" onClick={() => setFigmaOpen(true)}>
                {FIGMA_ICON}
                <span>Figma 프로토타입</span>
              </button>
            </div>
          )}

          {voted ? (
            <p className="lb-voted-note">투표를 완료했어요. 순위는 변경할 수 없습니다.</p>
          ) : (
            <RankPicker
              candidateId={cand.id}
              rankSlots={rankSlots}
              maxSelections={maxSelections}
              candidates={candidates}
              onPickRank={onPickRank}
              showLabel
              variant="icons"
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
          onPrev={goPrev}
          onNext={goNext}
        />
      )}

      {figmaOpen && (
        <FigmaFullscreen
          cand={cand}
          index={index}
          total={total}
          onClose={() => setFigmaOpen(false)}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  );
}
