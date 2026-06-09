import { useEffect, useState } from 'react';

const CATEGORIES = ['브랜딩', '행사', '복지', '시상', '공간', '기타'];

interface CandDraft { name: string; team: string }

interface CreatePollModalProps {
  onClose: () => void;
  onCreate: (draft: {
    title: string;
    category: string;
    desc: string;
    closes_at: string;
    candidates: { name: string; team?: string }[];
  }) => void;
}

export function CreatePollModal({ onClose, onCreate }: CreatePollModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('브랜딩');
  const [desc, setDesc] = useState('');
  const [closes, setCloses] = useState('');
  const [cands, setCands] = useState<CandDraft[]>([{ name: '', team: '' }, { name: '', team: '' }]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const setCand = (i: number, k: keyof CandDraft, v: string) =>
    setCands((prev) => prev.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  const addCand = () => setCands((prev) => [...prev, { name: '', team: '' }]);
  const removeCand = (i: number) => setCands((prev) => prev.filter((_, j) => j !== i));

  const filled = cands.filter((c) => c.name.trim());
  const valid = title.trim() && filled.length >= 2;

  const submit = () => {
    if (!valid) return;
    onCreate({
      title: title.trim(),
      category,
      desc: desc.trim(),
      closes_at: closes,
      candidates: filled.map((c) => ({ name: c.name.trim(), team: c.team.trim() || undefined })),
    });
  };

  return (
    <div className="cp-backdrop" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-head">
          <div>
            <span className="eyebrow">New poll</span>
            <h2>새 투표 만들기</h2>
          </div>
          <button type="button" className="lb-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="cp-body">
          <label className="cp-field">
            <span className="cp-label">투표 제목 <i>*</i></span>
            <input className="cp-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 2026 사내 동아리 이름 공모" autoFocus />
          </label>
          <div className="cp-row2">
            <label className="cp-field">
              <span className="cp-label">분류</span>
              <select className="cp-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="cp-field">
              <span className="cp-label">마감일</span>
              <input className="cp-input" type="date" value={closes} onChange={(e) => setCloses(e.target.value)} />
            </label>
          </div>
          <label className="cp-field">
            <span className="cp-label">설명</span>
            <textarea className="cp-input cp-area" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="투표 안내 문구를 적어주세요. (선택)" rows={2} />
          </label>
          <div className="cp-field">
            <span className="cp-label">후보 <i>*</i> <em>최소 2명</em></span>
            <div className="cp-cands">
              {cands.map((c, i) => (
                <div className="cp-cand" key={i}>
                  <span className="cp-cnum">{i + 1}</span>
                  <input className="cp-input" value={c.name} onChange={(e) => setCand(i, 'name', e.target.value)} placeholder="후보/작품 이름" />
                  <input className="cp-input cp-team" value={c.team} onChange={(e) => setCand(i, 'team', e.target.value)} placeholder="팀·제출자 (선택)" />
                  <button type="button" className="cp-remove" onClick={() => removeCand(i)} disabled={cands.length <= 2} aria-label="삭제">✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="cp-add" onClick={addCand}>＋ 후보 추가</button>
          </div>
          <div className="cp-note">
            <span aria-hidden>ℹ️</span> 만들면 <b>준비중</b> 상태로 생성돼요. 목록에서 <b>시작</b>을 누르면 QR 링크로 투표가 열립니다.
          </div>
        </div>
        <div className="cp-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="button" className="btn btn-primary" disabled={!valid} onClick={submit}>
            투표 만들기{filled.length ? ` · 후보 ${filled.length}명` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
