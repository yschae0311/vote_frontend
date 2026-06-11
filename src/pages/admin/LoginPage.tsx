import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/admin';
import { setToken } from '../../lib/auth';
import { ApiError } from '../../api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token } = await login(username, password);
      setToken(access_token);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <span className="eyebrow">Admin</span>
        <h1>관리자 로그인</h1>
        <p className="login-sub">투표 생성·집계는 관리자만 접근할 수 있어요.</p>
        <label className="cp-field">
          <span className="cp-label">아이디</span>
          <input className="cp-input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label className="cp-field">
          <span className="cp-label">비밀번호</span>
          <input className="cp-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? '로그인 중…' : '로그인'}
        </button>
        <Link to="/" className="login-home-link">← 투표 목록으로</Link>
      </form>
    </div>
  );
}
