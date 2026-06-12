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

type Step = 'identity' | 'pin';

export function VoteVerifyGate({ pollId, verifyFields, onVerified }: VoteVerifyGateProps) {
  const [step, setStep] = useState<Step>('identity');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [pinSetup, setPinSetup] = useState(false);
  const [matchedName, setMatchedName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const identityPayload = {
    name: verifyFields.includes('name') ? name.trim() : undefined,
    email: verifyFields.includes('email') ? email.trim() : undefined,
    phone: verifyFields.includes('phone') ? phone.trim() : undefined,
  };

  const finishVerify = (res: Awaited<ReturnType<typeof verifyVoter>>) => {
    if (!res.verified || !res.voter_token) {
      setError('인증에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    onVerified(res.voter_token, res.voter_name);
  };

  const submitIdentity = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await verifyVoter(pollId, identityPayload);
      if (res.pin_required) {
        setMatchedName(res.voter_name);
        setPinSetup(res.pin_setup);
        setPin('');
        setStep('pin');
        return;
      }
      finishVerify(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '본인 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const submitPin = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError('4자리 숫자 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await verifyVoter(pollId, { ...identityPayload, pin });
      finishVerify(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '비밀번호 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const backToIdentity = () => {
    setStep('identity');
    setPin('');
    setError('');
  };

  if (step === 'pin') {
    return (
      <section className="vote-verify" aria-label="투표 비밀번호 확인">
        <div className="vote-verify-card">
          <div className="vote-verify-head">
            <div className="vote-verify-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="vote-verify-head-copy">
              <span className="vote-verify-step">STEP 2</span>
              <h2 className="vote-verify-title">{pinSetup ? '비밀번호 설정' : '비밀번호 확인'}</h2>
            </div>
          </div>

          <p className="vote-verify-desc">
            <strong>{matchedName}</strong>님, {pinSetup
              ? '재방문 시 사용할 4자리 숫자 비밀번호를 설정해주세요.'
              : '등록된 4자리 숫자 비밀번호를 입력해주세요.'}
          </p>

          <form className="vote-verify-form" onSubmit={submitPin}>
            <label className="vote-verify-field">
              <span className="vote-verify-label">{pinSetup ? '새 비밀번호 (4자리)' : '비밀번호 (4자리)'}</span>
              <input
                className="vote-verify-input vote-verify-pin"
                type="password"
                inputMode="numeric"
                autoComplete={pinSetup ? 'new-password' : 'current-password'}
                maxLength={4}
                pattern="\d{4}"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                autoFocus
              />
            </label>
            {error && (
              <p className="vote-verify-error" role="alert">
                <span className="vote-verify-error-icon" aria-hidden>!</span>
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary vote-verify-btn" disabled={loading || pin.length !== 4}>
              {loading ? '확인 중…' : pinSetup ? '설정하고 투표하기' : '확인하기'}
            </button>
            <button type="button" className="btn btn-ghost vote-verify-back" onClick={backToIdentity}>
              ← 정보 다시 입력
            </button>
          </form>
        </div>
      </section>
    );
  }

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
          확인 후 4자리 비밀번호를 설정하거나 입력합니다.
        </p>

        <div className="vote-verify-tags" aria-hidden>
          {verifyFields.map((field) => (
            <span key={field} className="vote-verify-tag">{FIELD_LABEL[field]}</span>
          ))}
        </div>

        <form className="vote-verify-form" onSubmit={submitIdentity}>
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
            {loading ? '확인 중…' : '다음 (비밀번호)'}
          </button>
        </form>
      </div>
    </section>
  );
}
