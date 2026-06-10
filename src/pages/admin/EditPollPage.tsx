import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addCandidate,
  addEligibleVoter,
  addEligibleVotersBulk,
  deleteCandidate,
  getPollAdmin,
  listEligibleVoters,
  updateCandidate,
  updatePoll,
  uploadImage,
} from '../../api/admin';
import { ArtworkLightbox } from '../../components/ArtworkLightbox';
import { Placeholder } from '../../components/Placeholder';
import { PtBtn } from '../../components/PtBtn';
import { ResultsModeDialog } from '../../components/ResultsModeDialog';
import { getToken } from '../../lib/auth';
import { hasFigmaPrototype, normalizeExternalUrl } from '../../lib/imageUrl';
import type { Candidate, EligibleVoter, Poll, VerifyField } from '../../types/api';
import { VerifyFieldPicker } from '../../components/VerifyFieldPicker';
import { bulkImportHint, parseVerifyFields, verifyFieldsLabel } from '../../lib/verifyFields';
import { ApiError } from '../../api/client';
import { AdminWarnBanner } from '../../components/AdminWarnBanner';
import { EligibleVotersPanel } from '../../components/EligibleVotersPanel';
import { hasSelectionMismatch, selectionMismatchMessage } from '../../lib/pollWarnings';

const STATUS_LABEL: Record<string, string> = {
  active: '진행중',
  draft: '준비중',
  closed: '종료',
};

export function EditPollPage() {
  const { pollId } = useParams();
  const id = Number(pollId);
  const token = getToken()!;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [figmaSavingId, setFigmaSavingId] = useState<number | null>(null);
  const [figmaDraft, setFigmaDraft] = useState<Record<number, string>>({});
  const [voters, setVoters] = useState<EligibleVoter[]>([]);
  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [voterBulk, setVoterBulk] = useState('');
  const [voterBusy, setVoterBusy] = useState(false);
  const [voterRefresh, setVoterRefresh] = useState(0);
  const [verifyFields, setVerifyFields] = useState<VerifyField[]>(['email']);
  const [showResultsMode, setShowResultsMode] = useState(false);

  const load = async () => {
    const p = await getPollAdmin(token, id);
    setPoll(p);
    setTitle(p.title);
    setDescription(p.description?.trim() || p.subtitle?.trim() || '');
    setVerifyFields(parseVerifyFields(p.verify_fields));
    if (p.poll_type === 'restricted') {
      setVoters(await listEligibleVoters(token, id));
    } else {
      setVoters([]);
    }
  };

  useEffect(() => { load(); }, [id, token]);

  const saveMeta = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const intro = description.trim();
      const payload: Record<string, unknown> = {
        title,
        description: intro || null,
        subtitle: null,
      };
      if (poll?.poll_type === 'restricted' && poll.status === 'draft') {
        payload.verify_fields = verifyFields;
      }
      await updatePoll(token, id, payload);
      setMsg('저장되었습니다.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const addCand = async () => {
    if (!newName.trim()) return;
    await addCandidate(token, id, { name: newName.trim(), team: newTeam.trim() || undefined });
    setNewName('');
    setNewTeam('');
    await load();
  };

  const removeCand = async (c: Candidate) => {
    if (!poll) return;
    const afterCount = poll.candidates.length - 1;
    const maxSel = poll.max_selections ?? 3;
    const mismatchAfter = hasSelectionMismatch(afterCount, maxSel);
    let confirmMsg = '';
    if (poll.status === 'active') confirmMsg = '진행 중인 투표에서 후보를 삭제합니다. 계속할까요?';
    if (mismatchAfter) {
      const warn = selectionMismatchMessage(afterCount, maxSel);
      confirmMsg = confirmMsg ? `${confirmMsg}\n\n⚠ ${warn}` : `⚠ ${warn}\n\n이 후보를 삭제할까요?`;
    }
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    await deleteCandidate(token, id, c.id);
    await load();
    if (mismatchAfter) setMsg(`후보가 삭제되었습니다. ${selectionMismatchMessage(afterCount, maxSel)}`);
  };

  const onImage = async (c: Candidate, file: File) => {
    setUploadingId(c.id);
    setMsg('');
    try {
      const { url } = await uploadImage(token, file);
      await updateCandidate(token, id, c.id, { image_url: url });
      setMsg('썸네일 사진이 등록되었습니다.');
      await load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingId(null);
    }
  };

  const onFigmaUrl = async (c: Candidate) => {
    setFigmaSavingId(c.id);
    setMsg('');
    try {
      const raw = (figmaDraft[c.id] ?? c.figma_url ?? '').trim();
      const figma_url = raw ? normalizeExternalUrl(raw) : null;
      await updateCandidate(token, id, c.id, { figma_url });
      setMsg(figma_url ? 'Figma URL이 등록되었습니다.' : 'Figma URL이 삭제되었습니다.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Figma URL 등록에 실패했습니다.');
    } finally {
      setFigmaSavingId(null);
    }
  };

  const saveVerifyFields = async (next: VerifyField[]) => {
    if (!poll || poll.status !== 'draft') return;
    setVerifyFields(next);
    try {
      await updatePoll(token, id, { verify_fields: next });
      setMsg('인증 항목이 저장되었습니다.');
      await load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : '인증 항목 저장에 실패했습니다.');
    }
  };

  const addVoter = async () => {
    setVoterBusy(true);
    setMsg('');
    try {
      await addEligibleVoter(token, id, {
        name: verifyFields.includes('name') ? voterName.trim() || undefined : undefined,
        email: verifyFields.includes('email') ? voterEmail.trim() || undefined : undefined,
        phone: verifyFields.includes('phone') ? voterPhone.trim() || undefined : undefined,
      });
      setVoterName('');
      setVoterEmail('');
      setVoterPhone('');
      setMsg('투표 대상자가 추가되었습니다.');
      setVoterRefresh((k) => k + 1);
      await load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : '대상자 추가에 실패했습니다.');
    } finally {
      setVoterBusy(false);
    }
  };

  const addVotersBulk = async () => {
    const rows = voterBulk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        const row: { name?: string; email?: string; phone?: string } = {};
        verifyFields.forEach((field, i) => {
          const val = parts[i];
          if (val) row[field] = val;
        });
        return row;
      })
      .filter((row) => verifyFields.every((f) => row[f]?.trim()));
    if (!rows.length) return;
    setVoterBusy(true);
    setMsg('');
    try {
      await addEligibleVotersBulk(token, id, rows);
      setVoterBulk('');
      setMsg(`투표 대상자 ${rows.length}명이 추가되었습니다.`);
      setVoterRefresh((k) => k + 1);
      await load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : '일괄 등록에 실패했습니다.');
    } finally {
      setVoterBusy(false);
    }
  };

  const openViewer = (i: number) => setViewerIndex(i);
  const stepViewer = (dir: number) => {
    if (!poll || viewerIndex === null) return;
    const n = poll.candidates.length;
    setViewerIndex((viewerIndex + dir + n) % n);
  };

  if (!poll) return <div className="manage-page">불러오는 중…</div>;

  const statusCls = poll.status === 'active' ? 'st-active' : poll.status === 'draft' ? 'st-draft' : 'st-closed';
  const mediaBusy = uploadingId !== null || figmaSavingId !== null;
  const maxSel = poll.max_selections ?? 3;
  const selectionWarn = hasSelectionMismatch(poll.candidates.length, maxSel);

  return (
    <div className="manage-page edit-page">
      <header className="manage-hero edit-hero">
        <Link to="/admin" className="eyebrow" style={{ textDecoration: 'none' }}>← 투표 관리</Link>
        <div className="edit-toolbar">
          <div className="edit-toolbar-title">
            <h1 className="manage-title">투표 수정</h1>
            <span className={`pill st-pill ${statusCls}`}>
              {poll.status === 'active' && <span className="dot" />}
              {STATUS_LABEL[poll.status] ?? poll.status}
            </span>
            <span className="edit-toolbar-meta">
              Poll #{poll.id} · {poll.poll_type === 'restricted' ? '특정' : '불특정'} · 후보 {poll.candidates.length}명
            </span>
          </div>
          <div className="edit-toolbar-actions">
            {msg && <span className="edit-msg">{msg}</span>}
            <button type="submit" form="edit-meta-form" className="btn btn-primary edit-save-btn" disabled={saving}>
              {saving ? '저장 중…' : '저장하기'}
            </button>
            <PtBtn variant="ghost" icon="📊" label="결과" onClick={() => setShowResultsMode(true)} />
          </div>
        </div>
      </header>

      {selectionWarn && (
        <AdminWarnBanner message={selectionMismatchMessage(poll.candidates.length, maxSel)} />
      )}

      <section className="edit-card">
        <h2 className="edit-card-title">기본 정보</h2>
        <form id="edit-meta-form" className="edit-form" onSubmit={saveMeta}>
          <label className="cp-field">
            <span className="cp-label">제목</span>
            <input className="cp-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="cp-field">
            <span className="cp-label">안내 문구</span>
            <textarea
              className="cp-input cp-area"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="투표자에게 보여줄 안내를 적어주세요. (선택)"
            />
          </label>
        </form>
      </section>

      {poll.poll_type === 'restricted' && (
        <section className="edit-card">
          <div className="edit-card-head">
            <h2 className="edit-card-title">투표 대상자</h2>
            <span className="edit-count">{voters.length}명</span>
          </div>
          <VerifyFieldPicker
            value={verifyFields}
            onChange={(next) => void saveVerifyFields(next)}
            disabled={poll.status !== 'draft' || voterBusy}
          />
          <p className="edit-art-hint">
            투표자는 <strong>{verifyFieldsLabel(verifyFields)}</strong>로 본인 확인합니다.
            {poll.status !== 'draft' && ' 진행 중·종료된 투표는 인증 항목을 변경할 수 없습니다.'}
          </p>

          <div className={`ev-add-row ev-add-row--${verifyFields.length}`}>
            {verifyFields.includes('name') && (
              <input className="cp-input" placeholder="이름 *" value={voterName} onChange={(e) => setVoterName(e.target.value)} />
            )}
            {verifyFields.includes('email') && (
              <input className="cp-input" placeholder="이메일 *" value={voterEmail} onChange={(e) => setVoterEmail(e.target.value)} />
            )}
            {verifyFields.includes('phone') && (
              <input className="cp-input" placeholder="전화번호 *" value={voterPhone} onChange={(e) => setVoterPhone(e.target.value)} />
            )}
            <button type="button" className="btn btn-primary" onClick={addVoter} disabled={voterBusy}>
              추가
            </button>
          </div>

          <div className="ev-bulk">
            <span className="cp-label">일괄 등록</span>
            <p className="cp-hint">{bulkImportHint(verifyFields)}</p>
            <textarea
              className="cp-input cp-area ev-bulk-area"
              rows={4}
              placeholder={
                verifyFields.includes('name') && verifyFields.includes('email')
                  ? '홍길동, hong@company.com\n01012345678'
                  : verifyFields.includes('email')
                    ? 'hong@company.com\nkim@company.com'
                    : '01012345678\n01098765432'
              }
              value={voterBulk}
              onChange={(e) => setVoterBulk(e.target.value)}
            />
            <button type="button" className="btn btn-ghost" onClick={addVotersBulk} disabled={voterBusy || !voterBulk.trim()}>
              일괄 추가
            </button>
          </div>

          {voters.length > 0 ? (
            <EligibleVotersPanel
              pollId={id}
              token={token}
              verifyFields={verifyFields}
              refreshKey={voterRefresh}
              collapsible
              title="투표 현황"
              defaultExpanded
              allowDelete
              onMutate={() => {
                setVoterRefresh((k) => k + 1);
                void load();
              }}
            />
          ) : (
            <p className="ev-empty">등록된 대상자가 없습니다. 투표 시작 전에 대상자를 추가해주세요.</p>
          )}
        </section>
      )}

      <section className="edit-card">
        <div className="edit-card-head">
          <h2 className="edit-card-title">후보 목록</h2>
          <span className="edit-count">{poll.candidates.length}명</span>
        </div>
        <p className="edit-art-hint">
          썸네일용 사진과 Figma 프로토타입 URL을 각각 등록할 수 있어요. 투표 화면에서는 사진이 썸네일로 보이고, 크게보기에서 Figma를 열 수 있습니다.
        </p>

        <div className="edit-cand-list">
          {poll.candidates.map((c, i) => {
            const hasPhoto = Boolean(c.image_url);
            const hasFigma = hasFigmaPrototype(c);
            const figmaValue = figmaDraft[c.id] ?? c.figma_url ?? '';
            const figmaDirty = figmaValue.trim() !== (c.figma_url ?? '').trim();
            return (
              <article className="edit-cand-card" key={c.id} style={{ '--ph-h': c.tint } as React.CSSProperties}>
                <div className="edit-cand-layout">
                  <button
                    type="button"
                    className="edit-cand-thumb"
                    onClick={() => openViewer(i)}
                    aria-label={`${c.name} 후보 크게보기`}
                  >
                    <Placeholder cand={c} ratio="16 / 9" round="0" emojiSize={40} />
                    {hasFigma && <span className="edit-thumb-badge edit-thumb-badge--figma">Figma</span>}
                    {!hasPhoto && <span className="edit-thumb-badge edit-thumb-badge--empty">사진 없음</span>}
                    <span className="edit-thumb-zoom" aria-hidden>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
                      </svg>
                    </span>
                  </button>

                  <div className="edit-cand-main">
                    <div className="edit-cand-topbar">
                      <div className="edit-cand-head">
                        <span className="edit-cnum">{i + 1}</span>
                        <div className="edit-cand-info">
                          <div className="edit-cand-name">{c.name}</div>
                          {c.team && <div className="edit-cand-team">{c.team}</div>}
                          {c.tagline && <div className="edit-cand-tag">{c.tagline}</div>}
                        </div>
                      </div>
                      <button type="button" className="edit-cand-del" onClick={() => removeCand(c)}>
                        삭제
                      </button>
                    </div>

                    <div className="edit-cand-fields">
                      <div className="edit-field">
                        <span className="edit-field-label">썸네일</span>
                        <div className="edit-field-body">
                          <span className={`edit-field-chip${hasPhoto ? ' is-on' : ''}`}>
                            {uploadingId === c.id ? '업로드 중…' : hasPhoto ? '사진 등록됨' : '미등록'}
                          </span>
                          <label className={`edit-field-btn${uploadingId === c.id ? ' is-busy' : ''}`}>
                            {uploadingId === c.id ? '업로드 중…' : hasPhoto ? '사진 변경' : '사진 선택'}
                            <input
                              type="file"
                              accept="image/*"
                              className="edit-file-input"
                              disabled={mediaBusy}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (file) void onImage(c, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="edit-field edit-field--wide">
                        <span className="edit-field-label">Figma</span>
                        <div className="edit-field-body edit-field-body--grow">
                          <input
                            className="cp-input edit-field-input"
                            type="url"
                            placeholder="https://www.figma.com/proto/..."
                            value={figmaValue}
                            disabled={mediaBusy}
                            onChange={(e) => setFigmaDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void onFigmaUrl(c);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="edit-field-btn edit-field-btn--primary"
                            disabled={mediaBusy || (!figmaDirty && (Boolean(c.figma_url) || !figmaValue.trim()))}
                            onClick={() => void onFigmaUrl(c)}
                          >
                            {figmaSavingId === c.id ? '저장 중…' : '저장'}
                          </button>
                          {hasFigma && !figmaDirty && (
                            <span className="edit-field-chip is-on">연결됨</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="edit-add-block">
          <span className="cp-label">후보 추가</span>
          <div className="edit-add-row">
            <input className="cp-input" placeholder="후보 이름" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="cp-input" placeholder="팀·제출자 (선택)" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} />
            <button type="button" className="btn btn-primary edit-add-btn" onClick={addCand} disabled={!newName.trim()}>
              추가
            </button>
          </div>
        </div>
      </section>

      {showResultsMode && (
        <ResultsModeDialog
          pollId={id}
          pollTitle={poll.title}
          onClose={() => setShowResultsMode(false)}
        />
      )}

      {viewerIndex !== null && (
        <ArtworkLightbox
          candidates={poll.candidates}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onPrev={() => stepViewer(-1)}
          onNext={() => stepViewer(1)}
        />
      )}
    </div>
  );
}
