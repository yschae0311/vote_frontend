import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPollAdmin, getResults, getResultsCsvUrl, resetPollVotes, updatePoll } from '../../api/admin';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Medal } from '../../components/Medal';
import { Placeholder } from '../../components/Placeholder';
import { QrCodeModal } from '../../components/QrCodeModal';
import { QrOpenButton } from '../../components/QrOpenButton';
import { getToken } from '../../lib/auth';
import { rankNumbers } from '../../lib/rankSlots';
import type { Poll, ResultRow, ResultsOut } from '../../types/api';
import { AdminWarnBanner } from '../../components/AdminWarnBanner';
import { hasSelectionMismatch, selectionMismatchMessage } from '../../lib/pollWarnings';
import { EligibleVotersPanel } from '../../components/EligibleVotersPanel';
import { parseVerifyFields } from '../../lib/verifyFields';
import { usePollEvents } from '../../lib/usePollEvents';

const LEGEND_COLORS = ['var(--gold)', 'var(--silver)', 'var(--bronze)', 'oklch(0.72 0.12 280)', 'oklch(0.68 0.1 220)'];

function rankCounts(row: ResultRow, maxSel: number): number[] {
  return [row.r1, row.r2, row.r3, row.r4 ?? 0, row.r5 ?? 0].slice(0, maxSel);
}

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

  useEffect(() => { void load(); }, [load]);

  usePollEvents(id, {
    poll_updated: load,
    results_updated: load,
    voters_updated: load,
  }, token);

  if (!poll || !results) return <div className="admin-page">불러오는 중…</div>;

  const rows = results.rows;
  const maxSel = poll.max_selections ?? 3;
  const selectionWarn = hasSelectionMismatch(poll.candidates.length, maxSel);
  const maxScore = rows[0]?.score || 1;
  const participation = Math.round(results.participation_rate * 100);
  const active = poll.status === 'active';

  const stats = [
    { k: '총 투표 수', v: results.total_ballots.toLocaleString(), sub: '유효 표' },
    { k: '참여율', v: `${participation}%`, sub: `${results.total_ballots} / ${results.eligible_count}명` },
    { k: '후보 수', v: poll.candidates.length, sub: '공모 후보' },
    { k: '우승', v: rows[0]?.name ?? '-', sub: rows[0] ? `${rows[0].score}점` : '', champion: true },
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
            <Link to={`/polls/${id}/results`} className="btn btn-ghost btn-sm">공개 결과</Link>
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

      {selectionWarn && (
        <AdminWarnBanner message={selectionMismatchMessage(poll.candidates.length, maxSel)} />
      )}

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

      {poll.poll_type === 'restricted' && (
        <section className="admin-board ev-results-board">
          <EligibleVotersPanel
            pollId={id}
            token={token}
            verifyFields={parseVerifyFields(poll.verify_fields)}
            compact
            collapsible
            defaultExpanded={false}
            hint="실수로 투표한 경우, 해당 인원만 취소할 수 있습니다."
          />
        </section>
      )}

      <div className="admin-stats">
        {stats.map((s) => (
          <div key={s.k} className={`stat-card${s.champion ? ' stat-card--champion' : ''}`}>
            <div className="stat-card-label">
              <span className="stat-k">{s.k}</span>
              {s.sub && <span className="stat-sub">{s.sub}</span>}
            </div>
            <div className="stat-v">{s.v}</div>
          </div>
        ))}
      </div>

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
              <div className={`board-row${idx < 3 ? ' top' : ''}`} key={r.candidate_id} style={{ '--ph-h': tint } as React.CSSProperties}>
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
    </div>
  );
}
