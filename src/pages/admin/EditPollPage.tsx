import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addCandidate, deleteCandidate, getPollAdmin, updateCandidate, updatePoll, uploadImage } from '../../api/admin';
import { ArtworkLightbox } from '../../components/ArtworkLightbox';
import { Placeholder } from '../../components/Placeholder';
import { PtBtn } from '../../components/PtBtn';
import { getToken } from '../../lib/auth';
import type { Candidate, Poll } from '../../types/api';
import { ApiError } from '../../api/client';

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
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const load = async () => {
    const p = await getPollAdmin(token, id);
    setPoll(p);
    setTitle(p.title);
    setSubtitle(p.subtitle || '');
    setDescription(p.description || '');
  };

  useEffect(() => { load(); }, [id, token]);

  const saveMeta = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updatePoll(token, id, { title, subtitle, description });
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
    if (poll?.status === 'active' && !window.confirm('진행 중인 투표에서 후보를 삭제합니다. 계속할까요?')) return;
    await deleteCandidate(token, id, c.id);
    await load();
  };

  const onImage = async (c: Candidate, file: File) => {
    setUploadingId(c.id);
    setMsg('');
    try {
      const { url } = await uploadImage(token, file);
      await updateCandidate(token, id, c.id, { image_url: url });
      setMsg('이미지가 등록되었습니다.');
      await load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingId(null);
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
            <span className="edit-toolbar-meta">Poll #{poll.id} · 후보 {poll.candidates.length}명</span>
          </div>
          <div className="edit-toolbar-actions">
            {msg && <span className="edit-msg">{msg}</span>}
            <button type="submit" form="edit-meta-form" className="btn btn-primary edit-save-btn" disabled={saving}>
              {saving ? '저장 중…' : '저장하기'}
            </button>
            <PtBtn variant="ghost" icon="📊" label="결과" to={`/admin/polls/${id}/results`} />
          </div>
        </div>
      </header>

      <section className="edit-card">
        <h2 className="edit-card-title">기본 정보</h2>
        <form id="edit-meta-form" className="edit-form" onSubmit={saveMeta}>
          <label className="cp-field">
            <span className="cp-label">제목</span>
            <input className="cp-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="cp-field">
            <span className="cp-label">부제</span>
            <input className="cp-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="선택" />
          </label>
          <label className="cp-field">
            <span className="cp-label">설명</span>
            <textarea className="cp-input cp-area" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="투표 안내 문구" />
          </label>
        </form>
      </section>

      <section className="edit-card">
        <div className="edit-card-head">
          <h2 className="edit-card-title">후보 목록</h2>
          <span className="edit-count">{poll.candidates.length}명</span>
        </div>
        <p className="edit-art-hint">작품 이미지를 탭하면 전체 화면으로 볼 수 있어요. 모바일에서는 가로로 돌려 보세요.</p>

        <div className="edit-cand-grid">
          {poll.candidates.map((c, i) => (
            <article className="edit-cand-card" key={c.id} style={{ '--ph-h': c.tint } as React.CSSProperties}>
              <button type="button" className="edit-artwork-tap" onClick={() => openViewer(i)} aria-label={`${c.name} 작품 크게보기`}>
                <Placeholder cand={c} ratio="4 / 3" round="12px" emojiSize={56} />
                <span className="edit-zoom-hint">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
                  크게보기
                </span>
              </button>
              <div className="edit-cand-body">
                <div className="edit-cand-head">
                  <span className="edit-cnum">{i + 1}</span>
                  <div className="edit-cand-info">
                    <div className="edit-cand-name">{c.name}</div>
                    {c.team && <div className="edit-cand-team">{c.team}</div>}
                    {c.tagline && <div className="edit-cand-tag">{c.tagline}</div>}
                  </div>
                </div>
                <div className="edit-cand-actions">
                  <label className={`edit-upload-btn${uploadingId === c.id ? ' is-busy' : ''}`}>
                    <span className="pt-btn-icon" aria-hidden>🖼</span>
                    <span className="pt-btn-label">{uploadingId === c.id ? '업로드중' : '업로드'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="edit-file-input"
                      disabled={uploadingId !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void onImage(c, file);
                      }}
                    />
                  </label>
                  <button type="button" className="edit-del-btn" onClick={() => removeCand(c)} title="후보 삭제">
                    <span className="pt-btn-icon" aria-hidden>✕</span>
                    <span className="pt-btn-label">삭제</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="edit-add-block">
          <span className="cp-label">후보 추가</span>
          <div className="edit-add-row">
            <input className="cp-input" placeholder="후보/작품 이름" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="cp-input" placeholder="팀·제출자 (선택)" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} />
            <button type="button" className="btn btn-primary edit-add-btn" onClick={addCand} disabled={!newName.trim()}>
              추가
            </button>
          </div>
        </div>
      </section>

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
