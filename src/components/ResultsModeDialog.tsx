import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ResultsModeDialogProps {
  pollId: number;
  pollTitle: string;
  onClose: () => void;
}

export function ResultsModeDialog({ pollId, pollTitle, onClose }: ResultsModeDialogProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const openDisplay = () => {
    const url = `${window.location.origin}/polls/${pollId}/results`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const openAdmin = () => {
    navigate(`/admin/polls/${pollId}/results`);
    onClose();
  };

  return (
    <div className="confirm-backdrop" onClick={onClose}>
      <div
        className="confirm-dialog results-mode-dialog"
        role="dialog"
        aria-labelledby="results-mode-title"
        aria-describedby="results-mode-msg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="results-mode-title" className="confirm-title">결과 화면으로 이동</h2>
        <p id="results-mode-msg" className="confirm-msg">
          <strong>「{pollTitle}」</strong> 결과가 바로 표시됩니다.
          발표·전광판용과 관리용 중에서 선택해 주세요.
        </p>
        <div className="results-mode-actions">
          <button type="button" className="results-mode-btn" onClick={openDisplay}>
            <span className="results-mode-btn-label">보여주기용</span>
            <span className="results-mode-btn-desc">공개 결과 화면 · 새 탭에서 열림 · 발표·전광판에 적합</span>
          </button>
          <button type="button" className="results-mode-btn" onClick={openAdmin}>
            <span className="results-mode-btn-label">관리자용</span>
            <span className="results-mode-btn-desc">상세 통계 · 참여자 · CSV · 리셋 등</span>
          </button>
          <button type="button" className="btn btn-ghost results-mode-cancel" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
