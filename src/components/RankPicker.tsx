import type { Candidate } from '../types/api';
import type { Rank, RankSlots } from '../lib/rankSlots';
import { candidateAt, rankNumbers } from '../lib/rankSlots';
import { Medal } from './Medal';

interface RankPickerProps {
  candidateId: number;
  rankSlots: RankSlots;
  maxSelections: number;
  candidates: Candidate[];
  onPickRank: (rank: Rank) => void;
  showLabel?: boolean;
  variant?: 'full' | 'icons';
}

export function RankPicker({
  candidateId,
  rankSlots,
  maxSelections,
  candidates,
  onPickRank,
  showLabel = true,
  variant = 'full',
}: RankPickerProps) {
  const iconOnly = variant === 'icons';
  const occupantName = (rank: Rank) => {
    const id = candidateAt(rankSlots, rank);
    if (id == null) return null;
    return candidates.find((c) => c.id === id)?.name ?? null;
  };

  return (
    <div className={`lb-rank-pick${iconOnly ? ' lb-rank-pick--icons' : ''}`}>
      {showLabel && !iconOnly && <span className="lb-rank-label">순위 선택</span>}
      <div className={`lb-rank-btns lb-rank-cols-${maxSelections}${iconOnly ? ' lb-rank-btns--icons' : ''}`}>
        {rankNumbers(maxSelections).map((rank) => {
          const occupantId = candidateAt(rankSlots, rank);
          const isSelf = occupantId === candidateId;
          const isTaken = occupantId != null && !isSelf;
          const name = occupantName(rank);
          return (
            <button
              key={rank}
              type="button"
              data-rank={rank}
              className={`lb-rank-btn${iconOnly ? ' lb-rank-btn--icon' : ''}${isSelf ? ' is-self' : ''}${isTaken ? ' is-taken' : ''}${!occupantId ? ' is-empty' : ''}`}
              onClick={() => onPickRank(rank)}
              aria-pressed={isSelf}
              aria-label={
                isSelf
                  ? `${rank}순위 선택 해제`
                  : isTaken
                    ? `${rank}순위로 넣기 (${name} 대체)`
                    : `${rank}순위로 넣기`
              }
            >
              <Medal rank={rank} size={iconOnly ? 32 : 24} />
              {!iconOnly && <span className="lb-rank-btn-label">{rank}순위</span>}
              {!iconOnly && isTaken && name && <span className="lb-rank-occupant">{name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
