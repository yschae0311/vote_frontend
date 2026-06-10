import { useEffect, useRef, useState } from 'react';
import type { Candidate } from '../types/api';
import { CloseButton } from './CloseButton';
import { Placeholder } from './Placeholder';

interface ImageFullscreenProps {
  cand: Candidate;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;

type Zoom = { scale: number; x: number; y: number };

function touchDist(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function ImageFullscreen({ cand, index, total, onClose, onPrev, onNext }: ImageFullscreenProps) {
  const [zoom, setZoom] = useState<Zoom>({ scale: 1, x: 0, y: 0 });
  const zoomRef = useRef<Zoom>({ scale: 1, x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({
    mode: null as 'pan' | 'pinch' | null,
    startScale: 1,
    startX: 0,
    startY: 0,
    startDist: 0,
    panOriginX: 0,
    panOriginY: 0,
    touchOriginX: 0,
    touchOriginY: 0,
  });
  const lastTapRef = useRef(0);

  const applyZoom = (next: Zoom) => {
    const clamped = {
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale)),
      x: next.x,
      y: next.y,
    };
    if (clamped.scale <= 1.02) {
      clamped.scale = 1;
      clamped.x = 0;
      clamped.y = 0;
    }
    zoomRef.current = clamped;
    setZoom(clamped);
  };

  useEffect(() => {
    applyZoom({ scale: 1, x: 0, y: 0 });
  }, [cand.id, index]);

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

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const blockScroll = (e: TouchEvent) => {
      if (gestureRef.current.mode) e.preventDefault();
    };
    el.addEventListener('touchmove', blockScroll, { passive: false });
    return () => el.removeEventListener('touchmove', blockScroll);
  }, []);

  const onZoomStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      gestureRef.current = {
        ...gestureRef.current,
        mode: 'pinch',
        startDist: touchDist(e.touches[0], e.touches[1]),
        startScale: zoomRef.current.scale,
        startX: zoomRef.current.x,
        startY: zoomRef.current.y,
      };
      return;
    }
    if (e.touches.length === 1 && zoomRef.current.scale > 1) {
      gestureRef.current = {
        ...gestureRef.current,
        mode: 'pan',
        panOriginX: zoomRef.current.x,
        panOriginY: zoomRef.current.y,
        touchOriginX: e.touches[0].clientX,
        touchOriginY: e.touches[0].clientY,
      };
    }
  };

  const onZoomMove = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (g.mode === 'pinch' && e.touches.length >= 2) {
      const dist = touchDist(e.touches[0], e.touches[1]);
      const ratio = dist / g.startDist;
      applyZoom({
        scale: g.startScale * ratio,
        x: g.startX,
        y: g.startY,
      });
      return;
    }
    if (g.mode === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - g.touchOriginX;
      const dy = e.touches[0].clientY - g.touchOriginY;
      applyZoom({
        scale: zoomRef.current.scale,
        x: g.panOriginX + dx,
        y: g.panOriginY + dy,
      });
    }
  };

  const onZoomEnd = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (g.mode === 'pinch' && e.touches.length === 1) {
      gestureRef.current = {
        ...g,
        mode: 'pan',
        panOriginX: zoomRef.current.x,
        panOriginY: zoomRef.current.y,
        touchOriginX: e.touches[0].clientX,
        touchOriginY: e.touches[0].clientY,
      };
      return;
    }
    if (e.touches.length > 0) return;

    if (g.mode === null) {
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        if (zoomRef.current.scale > 1) {
          applyZoom({ scale: 1, x: 0, y: 0 });
        } else {
          applyZoom({ scale: 2.5, x: 0, y: 0 });
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }

    gestureRef.current.mode = null;
    if (zoomRef.current.scale <= 1.02) applyZoom({ scale: 1, x: 0, y: 0 });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    applyZoom({
      scale: zoomRef.current.scale + delta,
      x: zoomRef.current.x,
      y: zoomRef.current.y,
    });
  };

  const isZoomed = zoom.scale > 1;

  return (
    <div className="img-fs-backdrop" onClick={onClose}>
      <CloseButton fixed onClick={(e) => { e.stopPropagation(); onClose(); }} />
      {!isZoomed && (
        <>
          <button type="button" className="img-fs-nav img-fs-prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="이전">‹</button>
          <button type="button" className="img-fs-nav img-fs-next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="다음">›</button>
        </>
      )}

      <div className="img-fs-stage" onClick={(e) => e.stopPropagation()}>
        <div className="img-fs-counter">후보 {index + 1} / {total}</div>
        <div
          ref={viewportRef}
          className="img-fs-media"
          style={{ '--ph-h': cand.tint } as React.CSSProperties}
          onTouchStart={onZoomStart}
          onTouchMove={onZoomMove}
          onTouchEnd={onZoomEnd}
          onTouchCancel={onZoomEnd}
          onWheel={onWheel}
        >
          <div
            className="img-fs-zoom-layer"
            style={{
              transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
            }}
          >
            <Placeholder cand={cand} ratio="auto" round="0" emojiSize={120} fit="contain" className="img-fs-ph" />
          </div>
        </div>
        <div className="img-fs-caption">
          <strong>{cand.name}</strong>
          {cand.team && <span> · {cand.team}</span>}
        </div>
      </div>
    </div>
  );
}
