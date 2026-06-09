import type { Candidate } from '../types/api';
import { Medal } from './Medal';
import { Placeholder } from './Placeholder';

interface CandidateCardProps {
  cand: Candidate;
  rank: number;
  onOpen: (id: number) => void;
}

export function CandidateCard({ cand, rank, onOpen }: CandidateCardProps) {
  const selected = rank > 0;
  return (
    <button
      type="button"
      className={`cand-card${selected ? ' is-selected' : ''}`}
      style={{ '--card-h': cand.tint } as React.CSSProperties}
      onClick={() => onOpen(cand.id)}
      aria-pressed={selected}
    >
      <div className="cand-media">
        <Placeholder cand={cand} />
        {selected && (
          <div className="cand-medal-overlay">
            <Medal rank={rank as 1 | 2 | 3} size={40} />
          </div>
        )}
        <span className="cand-zoomhint" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          크게보기
        </span>
      </div>
      <div className="cand-body">
        <div className="cand-name">{cand.name}</div>
        {cand.tagline && <div className="cand-tag">{cand.tagline}</div>}
        {cand.team && <div className="cand-team">{cand.team}</div>}
      </div>
      <div className={`cand-status${selected ? ' on' : ''}`}>
        {selected ? (
          <><Medal rank={rank as 1 | 2 | 3} size={18} /> <b>{rank}순위</b>로 선택됨</>
        ) : (
          <>탭하여 크게보기 · 순위 담기</>
        )}
      </div>
    </button>
  );
}
