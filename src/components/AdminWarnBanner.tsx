interface AdminWarnBannerProps {
  message: string;
}

export function AdminWarnBanner({ message }: AdminWarnBannerProps) {
  return (
    <div className="admin-warn" role="alert">
      <span aria-hidden>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
