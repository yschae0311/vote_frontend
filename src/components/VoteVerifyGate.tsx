import { useState } from 'react';
import type { FormEvent } from 'react';
import { verifyVoter } from '../api/polls';
import { ApiError } from '../api/client';
import type { VerifyField } from '../lib/verifyFields';
import { verifyFieldsLabel } from '../lib/verifyFields';

const FIELD_LABEL: Record<VerifyField, string> = {
  name: '이름',
  email: '이메일',
  phone: '전화번호',
};

interface VoteVerifyGateProps {
  pollId: number;
  verifyFields: VerifyField[];
  onVerified: (token: string, name: string) => void;
}

export function VoteVerifyGate({ pollId, verifyFields, onVerified }: VoteVerifyGateProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await verifyVoter(pollId, {
        name: verifyFields.includes('name') ? name.trim() : undefined,
        email: verifyFields.includes('email') ? email.trim() : undefined,
        phone: verifyFields.includes('phone') ? phone.trim() : undefined,
      });
      onVerified(res.voter_token, res.voter_name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '본인 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="vote-verify" aria-label="투표 대상자 확인">
      <div className="vote-verify-card">
        <div className="vote-verify-head">
          <div className="vote-verify-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="vote-verify-head-copy">
            <span className="vote-verify-step">STEP 1</span>
            <h2 className="vote-verify-title">본인 확인</h2>
          </div>
        </div>

        <p className="vote-verify-desc">
          등록된 <strong>{verifyFieldsLabel(verifyFields)}</strong>가 맞는지 확인해주세요.
        </p>

        <div className="vote-verify-tags" aria-hidden>
          {verifyFields.map((field) => (
            <span key={field} className="vote-verify-tag">{FIELD_LABEL[field]}</span>
          ))}
        </div>

        <form className="vote-verify-form" onSubmit={submit}>
          {verifyFields.includes('name') && (
            <label className="vote-verify-field">
              <span className="vote-verify-label">이름</span>
              <input
                className="vote-verify-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="등록된 이름 입력"
                autoComplete="name"
              />
            </label>
          )}
          {verifyFields.includes('email') && (
            <label className="vote-verify-field">
              <span className="vote-verify-label">이메일</span>
              <input
                className="vote-verify-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                inputMode="email"
              />
            </label>
          )}
          {verifyFields.includes('phone') && (
            <label className="vote-verify-field">
              <span className="vote-verify-label">전화번호</span>
              <input
                className="vote-verify-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                autoComplete="tel"
                inputMode="tel"
              />
            </label>
          )}
          {error && (
            <p className="vote-verify-error" role="alert">
              <span className="vote-verify-error-icon" aria-hidden>!</span>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary vote-verify-btn" disabled={loading}>
            {loading ? '확인 중…' : '확인하고 투표하기'}
          </button>
        </form>
      </div>
    </section>
  );
}
