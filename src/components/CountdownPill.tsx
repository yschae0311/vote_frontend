import { useEffect, useState } from 'react';

export function CountdownPill({ closesAt }: { closesAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, new Date(closesAt).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <span className="pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
      <span aria-hidden>⏳</span>
      <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
        마감까지 {d}일 {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </span>
  );
}
