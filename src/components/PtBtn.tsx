import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PtBtnVariant = 'qr' | 'start' | 'stop' | 'reopen' | 'ghost' | 'reset' | 'delete';

interface PtBtnBaseProps {
  variant: PtBtnVariant;
  icon: ReactNode;
  label: string;
  title?: string;
  disabled?: boolean;
}

interface PtBtnButtonProps extends PtBtnBaseProps {
  onClick: () => void;
  to?: never;
}

interface PtBtnLinkProps extends PtBtnBaseProps {
  to: string;
  onClick?: never;
}

type PtBtnProps = PtBtnButtonProps | PtBtnLinkProps;

function PtBtnInner({ icon, label }: Pick<PtBtnProps, 'icon' | 'label'>) {
  return (
    <>
      <span className="pt-btn-icon" aria-hidden>{icon}</span>
      <span className="pt-btn-label">{label}</span>
    </>
  );
}

export function PtBtn(props: PtBtnProps) {
  const cls = `pt-btn pt-btn--${props.variant}`;
  if ('to' in props && props.to) {
    return (
      <Link to={props.to} className={cls} title={props.title}>
        <PtBtnInner icon={props.icon} label={props.label} />
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
    >
      <PtBtnInner icon={props.icon} label={props.label} />
    </button>
  );
}
