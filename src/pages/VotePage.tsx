import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { checkVote, getPoll, submitVote } from '../api/polls';
import { CandidateCard } from '../components/CandidateCard';
import { CountdownPill } from '../components/CountdownPill';
import { Lightbox } from '../components/Lightbox';
import { Medal } from '../components/Medal';
import { Placeholder } from '../components/Placeholder';
import { getFingerprint } from '../lib/fingerprint';
import type { Poll, VoteEntry } from '../types/api';
import { ApiError } from '../api/client';

export function VotePage() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const id = Number(pollId);
  const fpRef = useRef<string>('');

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selections, setSelections] = useState<number[]>([]);
  const [voted, setVoted] = useState(false);
  const [maxHit, setMaxHit] = useState(false);
  const [zoomId, setZoomId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        fpRef.current = fp;
        const [pollData, check] = await Promise.all([getPoll(id), checkVote(id, fp)]);
        if (cancelled) return;
        setPoll(pollData);
        if (check.voted && check.votes) {
          setVoted(true);
          const ordered = [...check.votes].sort((a, b) => a.rank - b.rank).map((v) => v.candidate_id);
          setSelections(ordered);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : '투표를 불러올 수 없습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const toggle = useCallback((cid: number) => {
    setSelections((prev) => {
      const i = prev.indexOf(cid);
      if (i !== -1) return prev.filter((x) => x !== cid);
      if (prev.length >= 3) {
        setMaxHit(true);
        setTimeout(() => setMaxHit(false), 420);
        return prev;
      }
      return [...prev, cid];
    });
  }, []);

  const submit = async () => {
    if (!poll || selections.length === 0 || voted) return;
    setSubmitting(true);
    try {
      const votes: VoteEntry[] = selections.map((cid, i) => ({ rank: i + 1, candidate_id: cid }));
      await submitVote(id, fpRef.current, votes);
      const snapshot = selections.map((cid) => poll.candidates.find((c) => c.id === cid)!).filter(Boolean);
      sessionStorage.setItem(`vote_complete_${id}`, JSON.stringify(snapshot));
      navigate(`/polls/${id}/complete`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="vote-page" style={{ padding: 48, textAlign: 'center' }}>불러오는 중…</div>;
  if (error || !poll) return <div className="vote-page" style={{ padding: 48, textAlign: 'center' }}>{error || '투표를 찾을 수 없습니다.'}</div>;

  const rankOf = (cid: number) => { const i = selections.indexOf(cid); return i === -1 ? 0 : i + 1; };
  const chosen = selections.map((cid) => poll.candidates.find((c) => c.id === cid)!).filter(Boolean);
  const remaining = 3 - selections.length;
  const zoomIndex = zoomId == null ? -1 : poll.candidates.findIndex((c) => c.id === zoomId);
  const zoomCand = zoomIndex === -1 ? null : poll.candidates[zoomIndex];

  return (
    <div className="vote-page">
      <header className="vote-hero">
        <div className="vote-hero-top">
          <span className="eyebrow">Internal Vote · Poll #{poll.id}</span>
          <div className="vote-status">
            {poll.status === 'active' ? (
              <span className="pill pill-live"><span className="dot" />투표 진행중</span>
            ) : (
              <span className="pill pill-closed">투표 종료</span>
            )}
            {poll.closes_at && <CountdownPill closesAt={poll.closes_at} />}
          </div>
        </div>
        <h1 className="vote-title">{poll.title}</h1>
        {poll.subtitle && <p className="vote-sub">{poll.subtitle}</p>}
      </header>

      {voted ? (
        <div className="voted-banner">
          <div className="voted-icon">✓</div>
          <div className="voted-text">
            <strong>이미 투표를 완료했어요</strong>
            <span>이 브라우저에서는 한 번만 투표할 수 있습니다. 결과는 운영팀이 집계 후 공개해요.</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/polls/${id}/complete`)}>내 투표 보기</button>
        </div>
      ) : (
        <div className="how-banner">
          <span className="how-badge">탭하면 크게보기</span>
          <span className="how-line">
            후보 카드를 <b>탭</b>하면 작품을 <b>크게</b> 볼 수 있어요. 큰 화면에서 마음에 들면{' '}
            <Medal rank={1} size={20} /> <Medal rank={2} size={20} /> <Medal rank={3} size={20} /> 순서로 순위에 담깁니다.
          </span>
        </div>
      )}

      <div className={`vote-layout${voted ? ' is-locked' : ''}`}>
        <main className="cand-grid" aria-label="후보 목록">
          {poll.candidates.map((c) => (
            <CandidateCard key={c.id} cand={c} rank={rankOf(c.id)} onOpen={setZoomId} />
          ))}
        </main>
        <aside className={`ballot${maxHit ? ' shake' : ''}`}>
          <div className="ballot-head">
            <span className="eyebrow">My Ballot</span>
            <h3>내 순위 선택</h3>
          </div>
          <div className="ballot-slots">
            {[1, 2, 3].map((r) => {
              const c = chosen[r - 1];
              return (
                <div key={r} className={`slot${c ? ' filled' : ''}`}>
                  <Medal rank={r as 1 | 2 | 3} size={30} />
                  {c ? (
                    <>
                      <div className="slot-thumb"><Placeholder cand={c} ratio="1 / 1" round="9px" /></div>
                      <div className="slot-info">
                        <div className="slot-name">{c.name}</div>
                        {c.team && <div className="slot-team">{c.team}</div>}
                      </div>
                      {!voted && (
                        <button type="button" className="slot-x" onClick={() => toggle(c.id)} aria-label="제거">✕</button>
                      )}
                    </>
                  ) : (
                    <div className="slot-empty">{r}순위를 골라주세요</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="ballot-foot">
            <div className="ballot-hint">
              {selections.length === 0 && '최소 1명 이상 선택하면 제출할 수 있어요.'}
              {selections.length > 0 && remaining > 0 && `${remaining}명 더 고를 수 있어요 (1~3순위).`}
              {selections.length === 3 && '세 명 모두 선택했어요. 제출만 하면 끝!'}
            </div>
            <div className="ballot-actions">
              <button type="button" className="btn btn-ghost" disabled={selections.length === 0 || voted} onClick={() => setSelections([])}>비우기</button>
              <button type="button" className="btn btn-primary" disabled={selections.length === 0 || voted || submitting} onClick={submit}>
                {submitting ? '제출 중…' : '투표 제출하기'}
              </button>
            </div>
            <div className="ballot-note">
              <span aria-hidden>🔒</span> 브라우저 지문으로 중복 투표를 방지합니다. 제출 후에는 수정할 수 없어요.
            </div>
          </div>
        </aside>
      </div>

      {zoomCand && (
        <Lightbox
          cand={zoomCand}
          rank={rankOf(zoomCand.id)}
          total={poll.candidates.length}
          index={zoomIndex}
          voted={voted}
          full={selections.length >= 3}
          onClose={() => setZoomId(null)}
          onToggle={toggle}
          onPrev={() => {
            const n = poll.candidates.length;
            setZoomId(poll.candidates[(zoomIndex - 1 + n) % n].id);
          }}
          onNext={() => {
            const n = poll.candidates.length;
            setZoomId(poll.candidates[(zoomIndex + 1) % n].id);
          }}
        />
      )}
    </div>
  );
}
