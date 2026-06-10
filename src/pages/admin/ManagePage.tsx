import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPoll, deletePoll, listPolls, updatePoll } from '../../api/admin';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ResultsModeDialog } from '../../components/ResultsModeDialog';
import { CreatePollModal } from '../../components/CreatePollModal';
import { QrCodeModal } from '../../components/QrCodeModal';
import { PtBtn } from '../../components/PtBtn';
import { QrOpenButton } from '../../components/QrOpenButton';
import { getToken, clearToken } from '../../lib/auth';
import type { PollListItem } from '../../types/api';
import { ApiError } from '../../api/client';
import { hasSelectionMismatch, selectionMismatchMessage } from '../../lib/pollWarnings';

const POLL_TYPE_LABEL: Record<string, string> = {
  open: '불특정',
  restricted: '특정',
};

const STATUS_META: Record<string, { label: string; cls: string; dot: boolean }> = {
  active: { label: '진행중', cls: 'st-active', dot: true },
  draft: { label: '준비중', cls: 'st-draft', dot: false },
  closed: { label: '종료', cls: 'st-closed', dot: false },
};

function nextStatus(s: string) {
  if (s === 'draft') return 'active';
  if (s === 'active') return 'closed';
  return 'active';
}

function statusAction(s: string): { label: string; variant: 'start' | 'stop' | 'reopen'; icon: string } {
  if (s === 'draft') return { label: '시작', variant: 'start', icon: '▶' };
  if (s === 'active') return { label: '종료', variant: 'stop', icon: '■' };
  return { label: '재개', variant: 'reopen', icon: '↻' };
}

export function ManagePage() {
  const navigate = useNavigate();
  const token = getToken()!;
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [qrPoll, setQrPoll] = useState<{ id: number; title: string } | null>(null);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PollListItem | null>(null);
  const [resultsPick, setResultsPick] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setPolls(await listPolls(token));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearToken();
        navigate('/admin/login');
      } else {
        setError('목록을 불러올 수 없습니다.');
      }
    }
  }, [token, navigate]);

  useEffect(() => { load(); }, [load]);

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePoll(token, deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      setError('투표 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const cycle = async (id: number, current: string) => {
    try {
      await updatePoll(token, id, { status: nextStatus(current) });
      await load();
    } catch {
      setError('상태 변경에 실패했습니다.');
    }
  };

  const activeCount = polls.filter((p) => p.status === 'active').length;
  const totalBallots = polls.reduce((s, p) => s + p.ballots, 0);

  return (
    <div className="manage-page">
      <header className="manage-hero">
        <div>
          <span className="eyebrow">Admin · Poll Manager</span>
          <h1 className="manage-title">투표 관리</h1>
          <p className="manage-sub">새 투표를 만들고, 시작·종료를 제어하고, 결과를 확인합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={() => { clearToken(); navigate('/admin/login'); }}>로그아웃</button>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>＋ 새 투표 만들기</button>
        </div>
      </header>

      {error && <p style={{ color: 'oklch(0.5 0.15 25)', marginBottom: 16 }}>{error}</p>}

      <div className="manage-stats">
        <div className="mstat"><div className="mstat-v">{polls.length}</div><div className="mstat-k">전체 투표</div></div>
        <div className="mstat"><div className="mstat-v">{activeCount}</div><div className="mstat-k">진행중</div></div>
        <div className="mstat"><div className="mstat-v">{totalBallots.toLocaleString()}</div><div className="mstat-k">누적 참여 표</div></div>
        <div className="mstat"><div className="mstat-v">{polls.filter((p) => p.status === 'draft').length}</div><div className="mstat-k">준비중</div></div>
      </div>

      <div className="poll-table-wrap">
        <table className="poll-table">
          <colgroup>
            <col className="pt-col pt-col--poll" />
            <col className="pt-col pt-col--type" />
            <col className="pt-col pt-col--status" />
            <col className="pt-col pt-col--cand" />
            <col className="pt-col pt-col--part" />
            <col className="pt-col pt-col--qr" />
            <col className="pt-col pt-col--actions" />
          </colgroup>
          <thead>
            <tr>
          <th>투표</th>
          <th>타입</th>
          <th>상태</th>
              <th>후보</th>
              <th>참여</th>
              <th>QR</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {polls.map((p) => {
              const sm = STATUS_META[p.status] ?? STATUS_META.draft;
              const rate = p.ballots ? Math.round((p.ballots / p.eligible) * 100) : 0;
              const created = new Date(p.created_at).toLocaleDateString('ko-KR');
              const closes = p.closes_at ? new Date(p.closes_at).toLocaleDateString('ko-KR') : '미정';
              const maxSel = p.max_selections ?? 3;
              const selectionWarn = hasSelectionMismatch(p.candidates, maxSel);
              return (
                <tr key={p.id} className={p.status === 'closed' ? 'is-closed' : undefined}>
                  <td data-label="투표">
                    <div className="pt-poll-inner">
                      <div className="pt-cat" data-cat={p.category}>{p.category}</div>
                      <div className="pt-titles">
                        <Link to={`/polls/${p.id}/results`} className="pt-title pt-title-link">
                          {p.title}
                        </Link>
                        <div className="pt-meta">#{p.id} · 생성 {created} · 마감 {closes}</div>
                        {selectionWarn && (
                          <div className="pt-warn" title={selectionMismatchMessage(p.candidates, maxSel)}>
                            ⚠ 선택 {maxSel}명 · 후보 {p.candidates}명
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="타입">
                    <span className={`pill pt-type-pill pt-type--${p.poll_type || 'open'}`}>
                      {POLL_TYPE_LABEL[p.poll_type] ?? '불특정'}
                    </span>
                  </td>
                  <td data-label="상태">
                    <span className={`pill st-pill ${sm.cls}`}>{sm.dot && <span className="dot" />}{sm.label}</span>
                  </td>
                  <td data-label="후보"><b>{p.candidates}</b><span>명</span></td>
                  <td data-label="참여">
                    <div className="pt-part-inner">
                      <div><b>{p.ballots.toLocaleString()}</b><span>표 · {rate}%</span></div>
                      <div className="pt-bar"><i style={{ width: `${rate}%` }} /></div>
                    </div>
                  </td>
                  <td data-label="QR">
                    <QrOpenButton onClick={() => setQrPoll({ id: p.id, title: p.title })} />
                  </td>
                  <td data-label="관리">
                    <div className="pt-actions-inner">
                      {(() => {
                        const a = statusAction(p.status);
                        return (
                          <PtBtn
                            variant={a.variant}
                            icon={a.icon}
                            label={a.label}
                            onClick={() => cycle(p.id, p.status)}
                          />
                        );
                      })()}
                      <PtBtn
                        variant="ghost"
                        icon="📊"
                        label="결과"
                        onClick={() => setResultsPick({ id: p.id, title: p.title })}
                      />
                      <PtBtn variant="ghost" icon="✎" label="수정" to={`/admin/polls/${p.id}/edit`} />
                      <PtBtn
                        variant="delete"
                        icon="🗑"
                        label="삭제"
                        title="투표 삭제"
                        disabled={deleting}
                        onClick={() => setDeleteTarget(p)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="투표를 삭제할까요?"
          message={`${deleteTarget.status === 'active' ? '진행 중인 투표입니다. ' : ''}「${deleteTarget.title}」과 후보 ${deleteTarget.candidates}명, 표 ${deleteTarget.ballots.toLocaleString()}건이 모두 삭제됩니다. 이 작업은 되돌릴 수 없어요.`}
          confirmLabel="예, 삭제"
          cancelLabel="아니오"
          danger
          onConfirm={doDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {resultsPick && (
        <ResultsModeDialog
          pollId={resultsPick.id}
          pollTitle={resultsPick.title}
          onClose={() => setResultsPick(null)}
        />
      )}

      {qrPoll && (
        <QrCodeModal
          pollId={qrPoll.id}
          title={qrPoll.title}
          onClose={() => setQrPoll(null)}
        />
      )}

      {creating && (
        <CreatePollModal
          onClose={() => setCreating(false)}
          onCreate={async (draft) => {
            try {
              await createPoll(token, {
                title: draft.title,
                category: draft.category,
                description: draft.desc || undefined,
                closes_at: draft.closes_at ? `${draft.closes_at}T18:00:00` : undefined,
                max_selections: draft.max_selections,
                poll_type: draft.poll_type,
                verify_fields: draft.poll_type === 'restricted' ? draft.verify_fields : undefined,
                candidates: draft.candidates,
              });
              setCreating(false);
              await load();
            } catch {
              setError('투표 생성에 실패했습니다.');
            }
          }}
        />
      )}
    </div>
  );
}
