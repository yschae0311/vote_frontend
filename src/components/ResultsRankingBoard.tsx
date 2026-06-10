import { Medal } from './Medal';
import { Placeholder } from './Placeholder';
import { rankNumbers } from '../lib/rankSlots';
import type { Candidate, ResultRow } from '../types/api';

const LEGEND_COLORS = ['var(--gold)', 'var(--silver)', 'var(--bronze)', 'oklch(0.72 0.12 280)', 'oklch(0.68 0.1 220)'];

function rankCounts(row: ResultRow, maxSel: number): number[] {
  return [row.r1, row.r2, row.r3, row.r4 ?? 0, row.r5 ?? 0].slice(0, maxSel);
}

type Props = {
  poll: { candidates: Candidate[] };
  rows: ResultRow[];
  maxSel: number;
  maxScore: number;
  animate?: boolean;
};

export function ResultsRankingBoard({ poll, rows, maxSel, maxScore, animate = false }: Props) {
  return (
    <div className="admin-board">
      <div className="board-head">
        <h3>후보별 가중 점수 랭킹</h3>
        <div className="board-legend">
          {rankNumbers(maxSel).map((rank) => (
            <span key={rank}>
              <i style={{ background: LEGEND_COLORS[rank - 1] }} />
              {rank}순위×{maxSel - rank + 1}
            </span>
          ))}
        </div>
      </div>
      <div className="board-rows">
        {rows.map((r, idx) => {
          const cand = poll.candidates.find((c) => c.id === r.candidate_id);
          const tint = cand?.tint ?? 256;
          return (
            <div
              className={`board-row${idx < 3 ? ' top' : ''}${animate ? ' results-row-in' : ''}`}
              key={r.candidate_id}
              style={{
                '--ph-h': tint,
                '--row-delay': `${idx * 55}ms`,
              } as React.CSSProperties}
            >
              <div className="br-rank">
                {idx < 3 ? <Medal rank={idx + 1} size={34} /> : <span className="br-num">{idx + 1}</span>}
              </div>
              <div className="br-thumb">
                {cand && <Placeholder cand={cand} ratio="1 / 1" round="10px" />}
              </div>
              <div className="br-id">
                <div className="br-name">{r.name}</div>
                {r.team && <div className="br-team">{r.team}</div>}
              </div>
              <div className="br-bar">
                <div className="bar-track">
                  {rankNumbers(maxSel).map((rank) => {
                    const counts = rankCounts(r, maxSel);
                    const weight = maxSel - rank + 1;
                    const count = counts[rank - 1] ?? 0;
                    return (
                      <div
                        key={rank}
                        className={`seg seg${rank}`}
                        style={{ width: `${(count * weight / maxScore) * 100}%` }}
                      />
                    );
                  })}
                </div>
                <div className="br-breakdown">
                  {rankNumbers(maxSel).map((rank) => (
                    <span key={rank}>{rank}위 {rankCounts(r, maxSel)[rank - 1]}</span>
                  ))}
                </div>
              </div>
              <div className="br-score"><b>{r.score}</b><span>점</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
