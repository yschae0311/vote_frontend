import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CloseButton } from './CloseButton';

interface QrCodeModalProps {
  pollId: number;
  title: string;
  onClose: () => void;
}

export function QrCodeModal({ pollId, title, onClose }: QrCodeModalProps) {
  const url = `${window.location.origin}/polls/${pollId}`;
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1e2230', light: '#ffffff' },
    }).then(setDataUrl);
  }, [url]);

  const copyUrl = () => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `poll-${pollId}-qr.png`;
    a.click();
  };

  return (
    <div className="qr-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <CloseButton variant="surface" onClick={onClose} />
        <span className="eyebrow">QR Code · Poll #{pollId}</span>
        <h2 className="qr-title">{title}</h2>
        <p className="qr-sub">스마트폰으로 스캔하면 투표 페이지로 바로 이동해요.</p>

        <div className="qr-frame">
          {dataUrl ? (
            <img src={dataUrl} alt={`투표 QR 코드 — ${title}`} className="qr-image" width={480} height={480} />
          ) : (
            <div className="qr-loading">QR 생성 중…</div>
          )}
        </div>

        <div className="qr-url">{url}</div>

        <div className="qr-actions">
          <button type="button" className="btn btn-primary" onClick={downloadPng} disabled={!dataUrl}>
            PNG 저장
          </button>
          <button type="button" className="btn btn-ghost" onClick={copyUrl}>
            {copied ? '✓ URL 복사됨' : 'URL 복사'}
          </button>
        </div>
      </div>
    </div>
  );
}
