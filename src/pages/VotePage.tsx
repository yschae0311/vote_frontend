import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { checkVote, getPoll, submitVote } from '../api/polls';
import { CandidateCard } from '../components/CandidateCard';
import { CountdownPill } from '../components/CountdownPill';
import { Lightbox } from '../components/Lightbox';
import { VoteVerifyGate } from '../components/VoteVerifyGate';
import { Medal } from '../components/Medal';
import { Placeholder } from '../components/Placeholder';
import { getFingerprint } from '../lib/fingerprint';
import { pollIntroText } from '../lib/pollIntro';
import { getVoterName, getVoterToken, setVoterSession } from '../lib/voterToken';
import { parseVerifyFields } from '../lib/verifyFields';
import {
  assignToRank,
  candidateAt,
  clearCandidate,
  clearRank,
  emptyRankSlots,
  filledCount,
  rankNumbers,
  rankOf,
  rankRangeLabel,
  slotsFromVotes,
  slotsToVotes,
  type Rank,
  type RankSlots,
} from '../lib/rankSlots';
import type { Poll } from '../types/api';
import { ApiError } from '../api/client';

export function VotePage() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const id = Number(pollId);
  const fpRef = useRef<string>('');

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rankSlots, setRankSlots] = useState<RankSlots>(emptyRankSlots());
  const [voted, setVoted] = useState(false);
  const [zoomId, setZoomId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voterToken, setVoterToken] = useState<string | null>(null);
  const [voterName, setVoterName] = useState('');
  const [verified, setVerified] = useState(false);
  const [ballotSheetOpen, setBallotSheetOpen] = useState(false);
  const [rankPickerId, setRankPickerId] = useState<number | null>(null);
  const [selectionCompleteToast, setSelectionCompleteToast] = useState(false);
  const prevChosenCount = useRef(0);
  const sheetTouchY = useRef(0);
  const sheetDragging = useRef(false);

  const isRestricted = (poll?.poll_type ?? 'open') === 'restricted';
  const ballotEditable = isRestricted && poll?.status === 'active' && voted;
  const ballotLocked = voted && !ballotEditable;

  const applyCheck = useCallback((check: Awaited<ReturnType<typeof checkVote>>, maxSel: number) => {
    if (check.voted && check.votes) {
      setVoted(true);
      setRankSlots(slotsFromVotes(check.votes, maxSel));
    } else {
      setVoted(false);
      setRankSlots(emptyRankSlots(maxSel));
    }
  }, []);

  useEffect(() => {
    if (rankPickerId == null) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cand-rank-anchor')) setRankPickerId(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [rankPickerId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        fpRef.current = fp;
        const pollData = await getPoll(id);
        if (cancelled) return;
        setPoll(pollData);
        const maxSel = pollData.max_selections ?? 3;
        const isRestricted = (pollData.poll_type ?? 'open') === 'restricted';
        const token = isRestricted ? getVoterToken(id) : null;
        if (isRestricted && token) {
          setVoterToken(token);
          setVoterName(getVoterName(id) || '');
          setVerified(true);
        }
        if (!isRestricted || token) {
          const check = await checkVote(id, fp, token);
          if (cancelled) return;
          applyCheck(check, maxSel);
        } else {
          setRankSlots(emptyRankSlots(maxSel));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : '투표를 불러올 수 없습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, applyCheck]);

  const onVerified = async (token: string, name: string) => {
    setVoterSession(id, token, name);
    setVoterToken(token);
    setVoterName(name);
    setVerified(true);
    if (!poll) return;
    const maxSel = poll.max_selections ?? 3;
    const check = await checkVote(id, fpRef.current, token);
    applyCheck(check, maxSel);
  };

  const pickRank = useCallback((candidateId: number, rank: Rank) => {
    setRankSlots((prev) => {
      if (rankOf(prev, candidateId) === rank) return clearCandidate(prev, candidateId);
      return assignToRank(prev, rank, candidateId);
    });
  }, []);

  useEffect(() => {
    if (!poll || ballotLocked) {
      prevChosenCount.current = filledCount(rankSlots);
      return;
    }
    const maxSel = poll.max_selections ?? 3;
    const count = filledCount(rankSlots);
    if (count === maxSel && prevChosenCount.current < maxSel) {
      setSelectionCompleteToast(true);
      const t = window.setTimeout(() => setSelectionCompleteToast(false), 4500);
      prevChosenCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevChosenCount.current = count;
  }, [rankSlots, poll, ballotLocked]);

  const onSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchY.current = e.touches[0].clientY;
    sheetDragging.current = true;
  };

  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (!sheetDragging.current) return;
    const dy = e.touches[0].clientY - sheetTouchY.current;
    if (!ballotSheetOpen && dy < -28) {
      setBallotSheetOpen(true);
      sheetDragging.current = false;
    } else if (ballotSheetOpen && dy > 28) {
      setBallotSheetOpen(false);
      sheetDragging.current = false;
    }
  };

  const onSheetTouchEnd = () => {
    sheetDragging.current = false;
  };

  const submit = async () => {
    if (!poll || filledCount(rankSlots) === 0 || ballotLocked) return;
    setSubmitting(true);
    try {
      const votes = slotsToVotes(rankSlots);
      await submitVote(id, fpRef.current, votes, (poll.poll_type ?? 'open') === 'restricted' ? voterToken : null);
      const snapshot = votes
        .sort((a, b) => a.rank - b.rank)
        .map((v) => poll.candidates.find((c) => c.id === v.candidate_id)!)
        .filter(Boolean);
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

  const maxSel = poll.max_selections ?? 3;
  const intro = pollIntroText(poll);
  const ranks = rankNumbers(maxSel);
  const chosenCount = filledCount(rankSlots);
  const remaining = maxSel - chosenCount;
  const zoomIndex = zoomId == null ? -1 : poll.candidates.findIndex((c) => c.id === zoomId);
  const zoomCand = zoomIndex === -1 ? null : poll.candidates[zoomIndex];
  const verifyFields = parseVerifyFields(poll.verify_fields);
  const canVote = !isRestricted || verified;

  const ballotPeekLabel = chosenCount === 0
    ? '후보를 고른 뒤 순위를 확인하세요'
    : remaining > 0
      ? `${chosenCount}명 선택 · ${remaining}순위 비어 있음`
      : `${chosenCount}명 선택 완료`;

  return (
    <div className={`vote-page${canVote && !ballotLocked && ballotSheetOpen ? ' ballot-sheet-open' : ''}`}>
      {selectionCompleteToast && !ballotLocked && (
        <div className="vote-selection-toast" role="status" aria-live="polite">
          <span className="vote-selection-toast-icon" aria-hidden>✓</span>
          <span>{rankRangeLabel(maxSel)} 모두 선택 완료! 발표를 확인하고 제출하세요.</span>
        </div>
      )}

      <header className="vote-hero">
        <div className="vote-hero-top">
          <div className="vote-hero-nav">
            <Link to="/" className="vote-back-link">← 투표 목록</Link>
            <span className="eyebrow">Internal Vote · Poll #{poll.id}</span>
          </div>
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
        {intro && (
          <div className="vote-intro">
            <p className="vote-intro-text">{intro}</p>
          </div>
        )}
      </header>

      {isRestricted && !canVote && (
        <VoteVerifyGate pollId={id} verifyFields={verifyFields} onVerified={onVerified} />
      )}

      {isRestricted && verified && voterName && !ballotLocked && (
        <div className="vote-verified-banner">
          <span className="vote-verified-icon" aria-hidden>✓</span>
          <span><strong>{voterName}</strong>님으로 확인되었습니다. 아래에서 투표해주세요.</span>
        </div>
      )}

      {canVote && ballotEditable && (
        <div className="voted-banner voted-banner--editable">
          <div className="voted-icon">✎</div>
          <div className="voted-text">
            <strong>이미 투표하셨어요</strong>
            <span>투표 진행 중에는 순위를 수정할 수 있습니다. 변경 후 다시 제출해주세요.</span>
          </div>
        </div>
      )}

      {canVote && ballotLocked ? (
        <div className="voted-banner">
          <div className="voted-icon">✓</div>
          <div className="voted-text">
            <strong>이미 투표를 완료했어요</strong>
            <span>한 번 제출한 표는 수정할 수 없어요. 내 선택이나 결과는 아래에서 확인할 수 있습니다.</span>
          </div>
          <div className="voted-banner-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(`/polls/${id}/complete`)}>내 투표 보기</button>
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/polls/${id}/results`)}>투표 결과 보기</button>
          </div>
        </div>
      ) : canVote ? (
        <nav className="vote-guide" aria-label="투표 방법">
          <p className="vote-guide-heading">투표 진행 순서</p>
          <div className="vote-guide-track">
            <div className="vote-guide-step">
              <span className="vote-guide-num">1</span>
              <div className="vote-guide-copy">
                <span className="vote-guide-text">후보 보기</span>
                <span className="vote-guide-detail">크게보기</span>
                <p className="vote-guide-desc">후보 사진·이름을 누르면 크게 봅니다. 이미지 확대와 Figma 프로토타입도 확인할 수 있어요.</p>
              </div>
            </div>
            <span className="vote-guide-sep" aria-hidden />
            <div className="vote-guide-step">
              <span className="vote-guide-num">2</span>
              <div className="vote-guide-copy">
                <span className="vote-guide-text">순위 선택</span>
                <span className="vote-guide-detail">{rankRangeLabel(maxSel)}</span>
                <p className="vote-guide-desc">
                  카드 아래 <strong>순위 선택</strong>을 눌러 바로 넣을 수 있어요. {rankRangeLabel(maxSel)}, {maxSel === 1 ? '1명' : `1~${maxSel - 1}명`}만 골라도 괜찮습니다.
                </p>
              </div>
            </div>
            <span className="vote-guide-sep" aria-hidden />
            <div className="vote-guide-step">
              <span className="vote-guide-num">3</span>
              <div className="vote-guide-copy">
                <span className="vote-guide-text">제출</span>
                <span className="vote-guide-detail">투표 완료</span>
                <p className="vote-guide-desc">오른쪽 발표에 담긴 순위를 확인한 뒤 제출하세요. 제출 후에는 수정할 수 없습니다.</p>
              </div>
            </div>
          </div>
        </nav>
      ) : null}

      {canVote && (
      <div className={`vote-layout${ballotLocked ? ' is-locked' : ''}`}>
        <main className="cand-grid" aria-label="후보 목록">
          {poll.candidates.map((c) => (
            <CandidateCard
              key={c.id}
              cand={c}
              rank={rankOf(rankSlots, c.id)}
              rankSlots={rankSlots}
              maxSelections={maxSel}
              candidates={poll.candidates}
              voted={ballotLocked}
              rankPickerOpen={rankPickerId === c.id}
              onOpen={(cid) => {
                setRankPickerId(null);
                setZoomId(cid);
              }}
              onRankPickerToggle={() => setRankPickerId((cur) => (cur === c.id ? null : c.id))}
              onPickRank={(rank) => {
                pickRank(c.id, rank);
                setRankPickerId(null);
              }}
            />
          ))}
        </main>
        <aside className={`ballot${ballotSheetOpen ? ' is-open' : ' is-peek'}`}>
          <div
            className="ballot-mobile-bar"
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
            onTouchCancel={onSheetTouchEnd}
          >
            <button
              type="button"
              className="ballot-sheet-toggle"
              onClick={() => setBallotSheetOpen((v) => !v)}
              aria-expanded={ballotSheetOpen}
              aria-controls="ballot-sheet-body"
            >
              <span className="ballot-sheet-grab" aria-hidden />
              <span className="ballot-sheet-copy">
                <span className="ballot-sheet-title">내 순위 선택</span>
                <span className="ballot-sheet-meta">{ballotPeekLabel}</span>
              </span>
              <span className="ballot-sheet-chevron" aria-hidden />
            </button>
            {!ballotSheetOpen && ballotLocked && (
              <button
                type="button"
                className="btn btn-primary ballot-sheet-quick"
                onClick={() => navigate(`/polls/${id}/results`)}
              >
                결과 보기
              </button>
            )}
            {!ballotSheetOpen && !ballotLocked && chosenCount > 0 && (
              <button
                type="button"
                className="btn btn-primary ballot-sheet-quick"
                disabled={submitting}
                onClick={() => void submit()}
              >
                {submitting ? '…' : ballotEditable ? '수정' : '제출'}
              </button>
            )}
          </div>
          <div id="ballot-sheet-body" className="ballot-sheet-body">
          <div className="ballot-head">
            <span className="eyebrow">My Ballot</span>
            <h3>내 순위 선택</h3>
            <span className="ballot-limit">최대 {maxSel}명</span>
          </div>
          <div className={`ballot-slots slots-${maxSel}`}>
            {ranks.map((r) => {
              const cid = candidateAt(rankSlots, r);
              const c = cid == null ? null : poll.candidates.find((x) => x.id === cid);
              return (
                <div key={r} className={`slot${c ? ' filled' : ''}`}>
                  <Medal rank={r} size={30} />
                  {c ? (
                    <>
                      <div className="slot-thumb"><Placeholder cand={c} ratio="1 / 1" round="9px" /></div>
                      <div className="slot-info">
                        <div className="slot-name">{c.name}</div>
                        {c.team && <div className="slot-team">{c.team}</div>}
                      </div>
                      {!ballotLocked && (
                        <button type="button" className="slot-x" onClick={() => setRankSlots((s) => clearRank(s, r))} aria-label={`${r}순위 비우기`}>✕</button>
                      )}
                    </>
                  ) : (
                    <div className="slot-empty">{r}순위 비어 있음</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="ballot-foot">
            <div className="ballot-hint">
              {ballotLocked && '투표가 완료되었습니다. 결과 페이지에서 확인할 수 있어요.'}
              {ballotEditable && '순위를 바꾼 뒤 아래에서 다시 제출해주세요.'}
              {!ballotLocked && !ballotEditable && chosenCount === 0 && '최소 1명 이상 선택하면 제출할 수 있어요.'}
              {!ballotLocked && chosenCount > 0 && remaining > 0 && `${remaining}개 순위가 비어 있어요 (채우지 않아도 제출 가능).`}
              {!ballotLocked && chosenCount === maxSel && `선택 가능한 ${maxSel}명을 모두 채웠어요. 제출만 하면 끝!`}
            </div>
            <div className="ballot-actions">
              {!ballotLocked && (
                <button type="button" className="btn btn-ghost" disabled={chosenCount === 0} onClick={() => setRankSlots(emptyRankSlots(maxSel))}>비우기</button>
              )}
              {ballotLocked ? (
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/polls/${id}/results`)}>
                  투표 결과 보기
                </button>
              ) : (
                <button type="button" className="btn btn-primary" disabled={chosenCount === 0 || submitting} onClick={submit}>
                  {submitting ? '제출 중…' : ballotEditable ? '투표 수정하기' : '투표 제출하기'}
                </button>
              )}
            </div>
            <div className="ballot-note">
              <span aria-hidden>🔒</span>
              {isRestricted
                ? ballotEditable
                  ? '등록된 대상자 1인 1표입니다. 투표 진행 중에는 순위를 수정할 수 있어요.'
                  : '등록된 대상자 1인 1표입니다. 제출 후에는 수정할 수 없어요.'
                : '브라우저 지문으로 중복 투표를 방지합니다. 제출 후에는 수정할 수 없어요.'}
            </div>
          </div>
          </div>
        </aside>
      </div>
      )}

      {canVote && zoomCand && zoomIndex >= 0 && (
        <Lightbox
          candidates={poll.candidates}
          index={zoomIndex}
          rankSlots={rankSlots}
          maxSelections={maxSel}
          total={poll.candidates.length}
          voted={ballotLocked}
          onClose={() => setZoomId(null)}
          onPickRank={(rank) => pickRank(poll.candidates[zoomIndex].id, rank)}
          onIndexChange={(i) => setZoomId(poll.candidates[i].id)}
        />
      )}
    </div>
  );
}
