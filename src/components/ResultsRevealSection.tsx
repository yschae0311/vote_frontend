import { useEffect, useState } from 'react';
import type { Candidate, ResultsOut } from '../types/api';
import { ResultsFireworks } from './ResultsFireworks';
import { ResultsRankingBoard } from './ResultsRankingBoard';

type PollSlice = {
  candidates: Candidate[];
  max_selections?: number;
};

type Props = {
  pollId: number;
  poll: PollSlice;
  results: ResultsOut | null;
  canReveal: boolean;
  loadingResults: boolean;
  onRevealRequest: () => Promise<void>;
  onRevealed?: () => void;
  storageKey?: string;
};

export function ResultsRevealSection({
  pollId,
  poll,
  results,
  canReveal,
  loadingResults,
  onRevealRequest,
  onRevealed,
  storageKey,
}: Props) {
  const revealKey = storageKey ?? `public_results_revealed_${pollId}`;
  const [revealed, setRevealed] = useState(() => sessionStorage.getItem(revealKey) === '1');
  const [coverGone, setCoverGone] = useState(() => sessionStorage.getItem(revealKey) === '1');
  const [fireworks, setFireworks] = useState(false);
  const [revealAnim, setRevealAnim] = useState(false);

  useEffect(() => {
    const was = sessionStorage.getItem(revealKey) === '1';
    setRevealed(was);
    setCoverGone(was);
    setRevealAnim(was);
  }, [revealKey]);

  const maxSel = poll.max_selections ?? 3;
  const rows = results?.rows ?? [];
  const maxScore = rows[0]?.score || 1;
  const winnerStat = {
    v: rows[0]?.name ?? '-',
    sub: rows[0] ? `${rows[0].score}점` : '',
  };

  const handleReveal = async () => {
    if (!canReveal || loadingResults) return;
    try {
      await onRevealRequest();
    } catch {
      return;
    }
    setFireworks(true);
    window.setTimeout(() => {
      setRevealed(true);
      setRevealAnim(true);
      sessionStorage.setItem(revealKey, '1');
      onRevealed?.();
    }, 280);
    window.setTimeout(() => setCoverGone(true), 750);
  };

  if (!canReveal) {
    return (
      <div className="results-waiting admin-board">
        <p className="results-waiting-title">아직 결과를 공개할 수 없어요</p>
        <p className="results-waiting-desc">투표가 종료되면 결과 확인 버튼이 활성화됩니다.</p>
        <button type="button" className="btn btn-primary results-reveal-btn" disabled>
          결과 확인하기
        </button>
      </div>
    );
  }

  if (results && results.total_ballots === 0) {
    return (
      <div className="results-empty-board admin-board">
        <p>투표가 종료되었지만 아직 제출된 표가 없어요.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`results-reveal-zone${revealed ? ' is-revealed' : ''}`}>
        {results && (
          <div className={`results-reveal-inner${revealAnim ? ' is-animating' : ''}`}>
            <div className="stat-card stat-card--champion">
              <div className="stat-card-label">
                <span className="stat-k">우승</span>
                {winnerStat.sub && <span className="stat-sub">{winnerStat.sub}</span>}
              </div>
              <div className="stat-v">{winnerStat.v}</div>
            </div>
            <ResultsRankingBoard
              poll={poll}
              rows={rows}
              maxSel={maxSel}
              maxScore={maxScore}
              animate={revealAnim}
            />
          </div>
        )}

        {!coverGone && (
          <div className={`results-reveal-cover${revealed ? ' is-leaving' : ''}`}>
            <div className="results-mosaic" aria-hidden />
            <div className="results-reveal-cta">
              <p className="results-reveal-eyebrow">투표 종료</p>
              <h2 className="results-reveal-title">결과가 준비됐어요</h2>
              <p className="results-reveal-desc">버튼을 누르면 1위와 전체 랭킹이 공개됩니다.</p>
              <button
                type="button"
                className="btn btn-primary results-reveal-btn"
                disabled={loadingResults}
                onClick={() => void handleReveal()}
              >
                {loadingResults ? '불러오는 중…' : '결과 확인하기'}
              </button>
            </div>
          </div>
        )}
      </div>
      <ResultsFireworks active={fireworks} onDone={() => setFireworks(false)} />
    </>
  );
}
