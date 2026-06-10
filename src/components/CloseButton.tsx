interface CloseButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'overlay' | 'surface';
  fixed?: boolean;
  className?: string;
}

export function CloseButton({ onClick, variant = 'overlay', fixed = false, className }: CloseButtonProps) {
  const iconSize = variant === 'overlay' ? 22 : 18;
  return (
    <button
      type="button"
      className={`ui-close ui-close--${variant}${fixed ? ' ui-close--fixed' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      aria-label="닫기"
    >
      <svg
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
