const MEDAL: Record<number, { label: string; bg: string; deep: string }> = {
  1: { label: '1순위', bg: 'var(--gold)', deep: 'var(--gold-deep)' },
  2: { label: '2순위', bg: 'var(--silver)', deep: 'var(--silver-deep)' },
  3: { label: '3순위', bg: 'var(--bronze)', deep: 'var(--bronze-deep)' },
  4: { label: '4순위', bg: 'oklch(0.72 0.12 280)', deep: 'oklch(0.55 0.14 280)' },
  5: { label: '5순위', bg: 'oklch(0.68 0.1 220)', deep: 'oklch(0.52 0.12 220)' },
};

interface MedalProps {
  rank: number;
  size?: number;
  showLabel?: boolean;
}

export function Medal({ rank, size = 34, showLabel = false }: MedalProps) {
  const m = MEDAL[rank] ?? MEDAL[3];
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
