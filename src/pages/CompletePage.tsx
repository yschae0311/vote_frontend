import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { checkVote, getPoll } from '../api/polls';
import { Medal } from '../components/Medal';
import { Placeholder } from '../components/Placeholder';
import { getFingerprint } from '../lib/fingerprint';
import type { Candidate } from '../types/api';

export function CompletePage() {
  const { pollId } = useParams();
  const id = Number(pollId);
  const [pollTitle, setPollTitle] = useState('');
  const [chosen, setChosen] = useState<Candidate[]>([]);
  const [fingerprint, setFingerprint] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const fp = await getFingerprint();
      setFingerprint(fp);
      const stored = sessionStorage.getItem(`vote_complete_${id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed[0]?.name) {
            setChosen(parsed as Candidate[]);
          }
        } catch { /* ignore */ }
      }
      try {
        const poll = await getPoll(id);
        setPollTitle(poll.title);
        if (!stored) {
          const check = await checkVote(id, fp);
          if (check.votes) {
            const ids = [...check.votes].sort((a, b) => a.rank - b.rank).map((v) => v.candidate_id);
            setChosen(ids.map((cid) => poll.candidates.find((c) => c.id === cid)).filter(Boolean) as Candidate[]);
          }
        }
      } catch {
        const check = await checkVote(id, fp);
        if (check.voted && !stored) setPollTitle(`Poll #${id}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const now = new Date();
  const stamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (loading) return <div className="done-page">불러오는 중…</div>;

  return (
    <div className="done-page">
      <div className="done-card">
        <div className="done-confetti">
          {Array.from({ length: 14 }).map((_, i) => <span key={i} style={{ '--i': i } as React.CSSProperties} />)}
        </div>
        <div className="done-check">✓</div>
        <span className="eyebrow">Vote submitted</span>
        <h1 className="done-title">투표가 접수되었어요!</h1>
        <p className="done-sub">소중한 한 표 고마워요. 아래는 내가 선택한 순위 요약이에요.</p>

        {chosen.length > 0 ? (
          <div className="done-summary">
            {chosen.map((c, i) => (
              <div className="done-row" key={c.id} style={{ '--ph-h': c.tint } as React.CSSProperties}>
                <Medal rank={(i + 1) as 1 | 2 | 3} size={38} showLabel />
                <div className="done-thumb"><Placeholder cand={c} ratio="1 / 1" round="11px" /></div>
                <div className="done-rowinfo">
                  <div className="done-name">{c.name}</div>
                  {c.team && <div className="done-team">{c.team}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="done-summary"><div className="done-row"><span style={{ color: 'var(--ink-3)' }}>선택 내역이 없습니다.</span></div></div>
        )}

        <div className="done-private">
          <span aria-hidden>🔒</span>
          <div>
            <strong>결과는 비공개예요.</strong> 전체 집계 결과는 운영팀이 마감 후 사내 공지로 안내합니다.
            {pollTitle && <> ({pollTitle})</>}
          </div>
        </div>

        <div className="done-receipt">
          <div><span>접수 시각</span><b>{stamp}</b></div>
          <div><span>투표 ID</span><b>#{id}-{fingerprint.slice(0, 8)}</b></div>
          <div><span>상태</span><b style={{ color: 'oklch(0.5 0.13 150)' }}>● 집계 대기</b></div>
        </div>

        <Link to={`/polls/${id}`} className="btn btn-ghost" style={{ marginTop: 4, textDecoration: 'none' }}>투표 화면 다시 보기</Link>
      </div>
    </div>
  );
}
