import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublicPolls } from '../api/polls';
import { ApiError } from '../api/client';
import type { PollPublicListItem } from '../types/api';

const POLL_TYPE_LABEL: Record<string, string> = {
  open: '불특정',
  restricted: '특정 대상',
};

function formatCloses(closesAt?: string | null) {
  if (!closesAt) return '마감 미정';
  return new Date(closesAt).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PollCard({ poll }: { poll: PollPublicListItem }) {
  const active = poll.status === 'active';
  const href = active ? `/polls/${poll.id}` : `/polls/${poll.id}/results`;

  return (
    <Link to={href} className={`home-poll-card${active ? ' is-active' : ''}`}>
      <div className="home-poll-card-top">
        <span className="home-poll-cat" data-cat={poll.category}>{poll.category}</span>
        <span className={`pill${active ? ' pill-live' : ' pill-closed'}`}>
          {active && <span className="dot" />}
          {active ? '진행중' : '종료'}
        </span>
      </div>
      <h2 className="home-poll-title">{poll.title}</h2>
      {poll.desc && <p className="home-poll-desc">{poll.desc}</p>}
      <dl className="home-poll-meta">
        <div>
          <dt>후보</dt>
          <dd>{poll.candidates}명</dd>
        </div>
        <div>
          <dt>선택</dt>
          <dd>{poll.max_selections}순위</dd>
        </div>
        <div>
          <dt>참여</dt>
          <dd>{poll.ballots.toLocaleString()}표</dd>
        </div>
        <div>
          <dt>대상</dt>
          <dd>{POLL_TYPE_LABEL[poll.poll_type] ?? '불특정'}</dd>
        </div>
      </dl>
      <div className="home-poll-foot">
        <span className="home-poll-closes">{formatCloses(poll.closes_at)}</span>
        <span className="home-poll-cta">{active ? '투표하기 →' : '결과 보기 →'}</span>
      </div>
    </Link>
  );
}

export function HomePage() {
  const [polls, setPolls] = useState<PollPublicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listPublicPolls();
        if (!cancelled) setPolls(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : '투표 목록을 불러올 수 없습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activePolls = polls.filter((p) => p.status === 'active');
  const closedPolls = polls.filter((p) => p.status === 'closed');

  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="home-hero-main">
          <span className="eyebrow">Vote</span>
          <h1 className="home-title">참여 가능한 투표</h1>
          <p className="home-sub">
            진행 중인 투표에 바로 참여하거나, 종료된 투표의 결과를 확인할 수 있어요.
            별도 로그인 없이 각 투표 페이지에서 본인 확인·기기 제한이 적용됩니다.
          </p>
        </div>
        <Link to="/admin/login" className="btn btn-ghost btn-sm home-admin-link">관리자</Link>
      </header>

      {loading && <p className="home-status">불러오는 중…</p>}
      {error && <p className="home-error">{error}</p>}

      {!loading && !error && polls.length === 0 && (
        <div className="home-empty admin-board">
          <p className="home-empty-title">지금 참여할 수 있는 투표가 없어요</p>
          <p className="home-empty-desc">새 투표가 시작되면 이곳에 표시됩니다.</p>
        </div>
      )}

      {!loading && activePolls.length > 0 && (
        <section className="home-section">
          <div className="home-section-head">
            <h2>진행 중</h2>
            <span className="home-section-count">{activePolls.length}</span>
          </div>
          <div className="home-poll-grid">
            {activePolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </section>
      )}

      {!loading && closedPolls.length > 0 && (
        <section className="home-section home-section--closed">
          <div className="home-section-head">
            <h2>종료됨</h2>
            <span className="home-section-count">{closedPolls.length}</span>
          </div>
          <div className="home-poll-grid">
            {closedPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
