import { useCallback, useEffect, useState } from 'react';
import { deleteEligibleVoter, listEligibleVoters, revokeVoterVote } from '../api/admin';
import { ApiError } from '../api/client';
import type { EligibleVoter, VerifyField } from '../types/api';
import { verifyFieldsLabel } from '../lib/verifyFields';
import { usePollEvents } from '../lib/usePollEvents';

type Props = {
  pollId: number;
  token: string;
  verifyFields: VerifyField[];
  compact?: boolean;
  refreshKey?: number;
  collapsible?: boolean;
  title?: string;
  hint?: string;
  defaultExpanded?: boolean;
  allowDelete?: boolean;
  onMutate?: () => void;
};

function formatVotedAt(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function EligibleVotersPanel({
  pollId,
  token,
  verifyFields,
  compact = false,
  refreshKey = 0,
  collapsible = false,
  title = '대상자별 투표 현황',
  hint,
  defaultExpanded = true,
  allowDelete = false,
  onMutate,
}: Props) {
  const [voters, setVoters] = useState<EligibleVoter[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [expanded, setExpanded] = useState(defaultExpanded);

  const load = useCallback(async () => {
    setVoters(await listEligibleVoters(token, pollId));
  }, [token, pollId]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  usePollEvents(
    pollId,
    compact
      ? { results_updated: load, voters_updated: load }
      : {},
    compact ? token : null,
  );

  const afterMutate = async (message: string) => {
    setMsg(message);
    await load();
    onMutate?.();
  };

  const revokeVote = async (v: EligibleVoter) => {
    if (!window.confirm(`「${v.name}」님의 투표를 취소할까요?\n다시 본인 확인 후 재투표할 수 있습니다.`)) return;
    setBusyId(v.id);
    setMsg('');
    try {
      await revokeVoterVote(token, pollId, v.id);
      await afterMutate(`${v.name}님의 투표가 취소되었습니다.`);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : '투표 취소에 실패했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  const removeVoter = async (v: EligibleVoter) => {
    const confirmMsg = v.voted
      ? `「${v.name}」님을 대상자 목록에서 삭제할까요?\n투표 내역도 함께 삭제됩니다.`
      : `「${v.name}」님을 대상자 목록에서 삭제할까요?`;
    if (!window.confirm(confirmMsg)) return;
    setBusyId(v.id);
    setMsg('');
    try {
      await deleteEligibleVoter(token, pollId, v.id);
      await afterMutate(`${v.name}님이 대상자 목록에서 삭제되었습니다.`);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : '대상자 삭제에 실패했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  const votedCount = voters.filter((v) => v.voted).length;
  const summary = `투표 완료 ${votedCount} / ${voters.length}명`;

  if (voters.length === 0) {
    return <p className="ev-empty">등록된 대상자가 없습니다.</p>;
  }

  const table = (
    <div className="ev-table-wrap">
        <table className="ev-table">
          <thead>
            <tr>
              {verifyFields.includes('name') && <th>이름</th>}
              {verifyFields.includes('email') && <th>이메일</th>}
              {verifyFields.includes('phone') && <th>전화번호</th>}
              {!verifyFields.includes('name') && <th>표시</th>}
              <th>투표 상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {voters.map((v) => {
              const votedAt = formatVotedAt(v.voted_at);
              return (
                <tr key={v.id}>
                  {verifyFields.includes('name') && <td>{v.name}</td>}
                  {verifyFields.includes('email') && <td>{v.email || '—'}</td>}
                  {verifyFields.includes('phone') && <td>{v.phone || '—'}</td>}
                  {!verifyFields.includes('name') && <td>{v.name}</td>}
                  <td>
                    {v.voted ? (
                      <span className="ev-status ev-status--done">
                        투표 완료{votedAt ? ` · ${votedAt}` : ''}
                      </span>
                    ) : (
                      <span className="ev-status">미투표</span>
                    )}
                  </td>
                  <td>
                    <div className="ev-actions">
                      {v.voted && (
                        <button
                          type="button"
                          className="ev-revoke-btn"
                          onClick={() => revokeVote(v)}
                          disabled={busyId !== null}
                        >
                          {busyId === v.id ? '처리 중…' : '투표 취소'}
                        </button>
                      )}
                      {allowDelete && (
                        <button
                          type="button"
                          className="ev-delete-btn"
                          onClick={() => removeVoter(v)}
                          disabled={busyId !== null}
                        >
                          {busyId === v.id ? '처리 중…' : '삭제'}
                        </button>
                      )}
                      {!v.voted && !allowDelete && <span className="ev-no-action">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
  );

  if (collapsible) {
    const panelId = `ev-panel-${pollId}`;
    return (
      <div className={`ev-panel ev-panel--collapsible${expanded ? ' is-open' : ''}`}>
        <button
          type="button"
          className="ev-panel-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          <span className="ev-panel-toggle-main">
            <span className="ev-panel-toggle-title">{title}</span>
            <span className="ev-panel-toggle-meta">
              {verifyFieldsLabel(verifyFields)} · <strong>{summary}</strong>
            </span>
            {hint && <span className="ev-panel-toggle-hint">{hint}</span>}
          </span>
          <span className="ev-panel-chevron" aria-hidden />
        </button>
        {msg && <p className="ev-panel-msg">{msg}</p>}
        <div id={panelId} className="ev-panel-body" hidden={!expanded}>
          {table}
        </div>
      </div>
    );
  }

  return (
    <div className="ev-panel">
      <div className="ev-panel-head">
        <p className="ev-panel-desc">
          {verifyFieldsLabel(verifyFields)} 기준 · 투표 완료 <strong>{votedCount}</strong> / {voters.length}명
        </p>
        {msg && <p className="ev-panel-msg">{msg}</p>}
      </div>
      {table}
    </div>
  );
}
