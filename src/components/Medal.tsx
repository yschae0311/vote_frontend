const MEDAL = {
  1: { label: '1순위', bg: 'var(--gold)', deep: 'var(--gold-deep)' },
  2: { label: '2순위', bg: 'var(--silver)', deep: 'var(--silver-deep)' },
  3: { label: '3순위', bg: 'var(--bronze)', deep: 'var(--bronze-deep)' },
} as const;

interface MedalProps {
  rank: 1 | 2 | 3;
  size?: number;
  showLabel?: boolean;
}

export function Medal({ rank, size = 34, showLabel = false }: MedalProps) {
  const m = MEDAL[rank];
  return (
    <span className="medal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: `linear-gradient(150deg, ${m.bg}, ${m.deep})`,
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.42,
          border: '2px solid oklch(1 0 0 / 0.6)',
        }}
      >
        {rank}
      </span>
      {showLabel && (
        <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>{m.label}</span>
      )}
    </span>
  );
}
