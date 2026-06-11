import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPollPublic, getPublicResults } from '../api/polls';
import { ResultsRevealSection } from '../components/ResultsRevealSection';
import { ApiError } from '../api/client';
import { pollIntroText } from '../lib/pollIntro';
import { usePollEvents } from '../lib/usePollEvents';
import type { PollPublic, ResultsOut } from '../types/api';

const revealKey = (pollId: number) => `public_results_revealed_${pollId}`;

export function PublicResultsPage() {
  const { pollId } = useParams();
  const id = Number(pollId);
  const [poll, setPoll] = useState<PollPublic | null>(null);
  const [results, setResults] = useState<ResultsOut | null>(null);
  const [revealed, setRevealed] = useState(() => sessionStorage.getItem(revealKey(id)) === '1');
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  const loadPoll = useCallback(async () => {
    setPoll(await getPollPublic(id));
  }, [id]);

  const loadResults = useCallback(async (force = false) => {
    if (results && !force) return;
    setLoadingResults(true);
    try {
      setResults(await getPublicResults(id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '결과를 불러올 수 없습니다.');
      throw e;
    } finally {
      setLoadingResults(false);
    }
  }, [id, results]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const p = await getPollPublic(id);
        if (cancelled) return;
        setPoll(p);
        if (p.status === 'closed' && sessionStorage.getItem(revealKey(id)) === '1') {
          setResults(await getPublicResults(id));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : '투표 정보를 불러올 수 없습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  usePollEvents(id, {
    poll_updated: () => { void loadPoll(); },
    results_updated: () => {
      if (revealed) void loadResults(true);
    },
  });

  if (loading) return <div className="public-results-page">불러오는 중…</div>;
  if (error && !poll) {
    return (
      <div className="public-results-page" style={{ padding: 48, textAlign: 'center' }}>
        {error}
      </div>
    );
  }
  if (!poll) {
    return (
      <div className="public-results-page" style={{ padding: 48, textAlign: 'center' }}>
        투표를 찾을 수 없습니다.
      </div>
    );
  }

  const intro = pollIntroText(poll);
  const closed = poll.status === 'closed';
  const active = poll.status === 'active';
  const participation = results
    ? Math.round(results.participation_rate * 100)
    : null;

  return (
    <div className="public-results-page">
      <header className="public-results-hero">
        <Link to="/" className="vote-back-link">← 투표 목록</Link>
        <span className="eyebrow">Vote Results · Poll #{poll.id}</span>
        <h1 className="public-results-title">{poll.title}</h1>
        {intro && <p className="public-results-intro">{intro}</p>}
        <div className="public-results-meta">
          <span className={`pill ${active ? 'pill-live' : closed ? 'pill-closed' : ''}`}>
            {active && <span className="dot" />}
            {active ? '투표 진행중' : closed ? '투표 종료' : '준비중'}
          </span>
          {poll.closes_at && (
            <span className="public-results-closes">
              마감 {new Date(poll.closes_at).toLocaleString('ko-KR')}
            </span>
          )}
        </div>
        {active && (
          <Link to={`/polls/${id}`} className="public-results-vote-link">
            투표하러 가기 →
          </Link>
        )}
      </header>

      {error && <p className="public-results-error">{error}</p>}

      {results && revealed && (
        <div className="admin-stats admin-stats--public">
          <div className="stat-card">
            <div className="stat-card-label">
              <span className="stat-k">총 투표 수</span>
              <span className="stat-sub">유효 표</span>
            </div>
            <div className="stat-v">{results.total_ballots.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">
              <span className="stat-k">참여율</span>
              <span className="stat-sub">{results.total_ballots} / {results.eligible_count}명</span>
            </div>
            <div className="stat-v">{participation}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">
              <span className="stat-k">후보 수</span>
              <span className="stat-sub">공모 후보</span>
            </div>
            <div className="stat-v">{poll.candidates.length}</div>
          </div>
        </div>
      )}

      <ResultsRevealSection
        pollId={id}
        poll={poll}
        results={results}
        canReveal={closed}
        loadingResults={loadingResults}
        onRevealRequest={loadResults}
        onRevealed={() => setRevealed(true)}
        storageKey={revealKey(id)}
      />
    </div>
  );
}
