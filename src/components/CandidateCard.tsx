import type { Candidate } from '../types/api';
import { hasFigmaPrototype } from '../lib/imageUrl';
import type { Rank, RankSlots } from '../lib/rankSlots';
import { Medal } from './Medal';
import { Placeholder } from './Placeholder';
import { RankPicker } from './RankPicker';

interface CandidateCardProps {
  cand: Candidate;
  rank: number;
  rankSlots: RankSlots;
  maxSelections: number;
  candidates: Candidate[];
  voted: boolean;
  rankPickerOpen: boolean;
  onOpen: (id: number) => void;
  onRankPickerToggle: () => void;
  onPickRank: (rank: Rank) => void;
}

export function CandidateCard({
  cand,
  rank,
  rankSlots,
  maxSelections,
  candidates,
  voted,
  rankPickerOpen,
  onOpen,
  onRankPickerToggle,
  onPickRank,
}: CandidateCardProps) {
  const selected = rank > 0;

  return (
    <article
      className={`cand-card${selected ? ' is-selected' : ''}${rankPickerOpen ? ' is-rank-open' : ''}`}
      style={{ '--card-h': cand.tint } as React.CSSProperties}
    >
      <button
        type="button"
        className="cand-card-view"
        onClick={() => onOpen(cand.id)}
        aria-label={`${cand.name} 크게보기`}
      >
        <div className="cand-media">
          <Placeholder cand={cand} />
          {selected && (
            <div className="cand-medal-overlay">
              <Medal rank={rank} size={40} />
            </div>
          )}
          {hasFigmaPrototype(cand) && <span className="cand-figma-badge">Figma</span>}
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
      </button>

      <div className="cand-rank-anchor">
        <button
          type="button"
          className={`cand-status${selected ? ' on' : ''}${rankPickerOpen ? ' is-open' : ''}`}
          disabled={voted}
          onClick={(e) => {
            e.stopPropagation();
            onRankPickerToggle();
          }}
          aria-expanded={rankPickerOpen}
          aria-haspopup="dialog"
        >
          {selected ? (
            <><Medal rank={rank} size={20} /> <span className="cand-status-change">변경</span></>
          ) : (
            <span className="cand-status-hint">
              <span className="cand-status-short">순위</span>
              <span className="cand-status-long">순위 · 위 카드 탭은 크게보기</span>
            </span>
          )}
        </button>
        {rankPickerOpen && !voted && (
          <div className="cand-rank-pop" role="dialog" aria-label={`${cand.name} 순위 선택`}>
            <RankPicker
              candidateId={cand.id}
              rankSlots={rankSlots}
              maxSelections={maxSelections}
              candidates={candidates}
              onPickRank={onPickRank}
              showLabel={false}
              variant="icons"
            />
          </div>
        )}
      </div>
    </article>
  );
}
