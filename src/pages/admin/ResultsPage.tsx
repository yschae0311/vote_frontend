import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPollAdmin, getResults, getResultsCsvUrl, resetPollVotes, updatePoll } from '../../api/admin';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Medal } from '../../components/Medal';
import { Placeholder } from '../../components/Placeholder';
import { QrCodeModal } from '../../components/QrCodeModal';
import { QrOpenButton } from '../../components/QrOpenButton';
import { getToken } from '../../lib/auth';
import type { Poll, ResultsOut } from '../../types/api';

export function ResultsPage() {
  const { pollId } = useParams();
  const id = Number(pollId);
  const token = getToken()!;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<ResultsOut | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([getPollAdmin(token, id), getResults(token, id)]);
    setPoll(p);
    setResults(r);
  }, [token, id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (!poll || !results) return <div className="admin-page">불러오는 중…</div>;

  const rows = results.rows;
  const maxScore = rows[0]?.score || 1;
  const participation = Math.round(results.participation_rate * 100);
  const active = poll.status === 'active';

  const stats = [
    { k: '총 투표 수', v: results.total_ballots.toLocaleString(), sub: '유효 표' },
    { k: '참여율', v: `${participation}%`, sub: `${results.total_ballots} / ${results.eligible_count}명` },
    { k: '후보 수', v: poll.candidates.length, sub: '공모 작품' },
    { k: '1위 작품', v: rows[0]?.name ?? '-', sub: rows[0] ? `${rows[0].score}점` : '', wide: true },
  ];

  const toggleActive = async () => {
    const next = active ? 'closed' : 'active';
    await updatePoll(token, id, { status: next });
    await load();
  };

  const doReset = async () => {
    setResetting(true);
    try {
      await resetPollVotes(token, id);
      setShowReset(false);
      await load();
    } finally {
      setResetting(false);
    }
  };

  const downloadCsv = async () => {
    const res = await fetch(getResultsCsvUrl(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `poll-${id}-results.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="admin-page">
      <header className="admin-hero">
        <Link to="/admin" className="eyebrow" style={{ textDecoration: 'none' }}>← 투표 관리</Link>
        <div className="admin-toolbar">
          <div className="admin-toolbar-title">
            <QrOpenButton onClick={() => setShowQr(true)} />
            <h1 className="admin-title">{poll.title}</h1>
          </div>
          <div className="admin-toolbar-actions">
            <span className={`pill ${active ? 'pill-live' : 'pill-closed'}`}>
              {active && <span className="dot" />}{active ? '진행중' : '종료'}
            </span>
            <button type="button" className={`toggle-btn${active ? ' on' : ''}`} onClick={toggleActive} role="switch" aria-checked={active}>
              <span className="toggle-track"><span className="toggle-knob" /></span>
              <span className="toggle-label">{active ? '투표 종료' : '투표 시작'}</span>
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={downloadCsv}>CSV</button>
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              disabled={results.total_ballots === 0 || resetting}
              onClick={() => setShowReset(true)}
            >
              리셋
            </button>
          </div>
        </div>
        <p className="admin-sub">가중 점수 = 1순위 ×3 + 2순위 ×2 + 3순위 ×1 · Poll #{poll.id}</p>
      </header>

      {showReset && (
        <ConfirmDialog
          title="투표를 리셋할까요?"
          message={`「${poll.title}」의 표 ${results.total_ballots.toLocaleString()}건이 모두 삭제됩니다. 같은 브라우저에서 다시 투표할 수 있게 됩니다. 이 작업은 되돌릴 수 없어요.`}
          confirmLabel="예, 리셋"
          cancelLabel="아니오"
          danger
          onConfirm={doReset}
          onCancel={() => setShowReset(false)}
        />
      )}

      {showQr && (
        <QrCodeModal pollId={poll.id} title={poll.title} onClose={() => setShowQr(false)} />
      )}

      <div className="admin-stats">
        {stats.map((s) => (
          <div key={s.k} className={`stat-card${s.wide ? ' wide' : ''}`}>
            <div className="stat-k">{s.k}</div>
            <div className="stat-v">{s.v}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="admin-board">
        <div className="board-head">
          <h3>후보별 가중 점수 랭킹</h3>
          <div className="board-legend">
            <span><i style={{ background: 'var(--gold)' }} />1순위×3</span>
            <span><i style={{ background: 'var(--silver)' }} />2순위×2</span>
            <span><i style={{ background: 'var(--bronze)' }} />3순위×1</span>
          </div>
        </div>
        <div className="board-rows">
          {rows.map((r, idx) => {
            const cand = poll.candidates.find((c) => c.id === r.candidate_id);
            const tint = cand?.tint ?? 256;
            return (
              <div className={`board-row${idx < 3 ? ' top' : ''}`} key={r.candidate_id} style={{ '--ph-h': tint } as React.CSSProperties}>
                <div className="br-rank">
                  {idx < 3 ? <Medal rank={(idx + 1) as 1 | 2 | 3} size={34} /> : <span className="br-num">{idx + 1}</span>}
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
                    <div className="seg seg1" style={{ width: `${(r.r1 * 3 / maxScore) * 100}%` }} />
                    <div className="seg seg2" style={{ width: `${(r.r2 * 2 / maxScore) * 100}%` }} />
                    <div className="seg seg3" style={{ width: `${(r.r3 * 1 / maxScore) * 100}%` }} />
                  </div>
                  <div className="br-breakdown">
                    <span>1위 {r.r1}</span><span>2위 {r.r2}</span><span>3위 {r.r3}</span>
                  </div>
                </div>
                <div className="br-score"><b>{r.score}</b><span>점</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
