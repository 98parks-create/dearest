import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart } from 'lucide-react';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) throw error;
      } else {
        const { error } = await signup(email, password);
        if (error) throw error;
      }
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <Heart size={36} className="auth-logo" fill="currentColor" />
          <h2>{isLogin ? 'Dearest 로그인' : 'Dearest 회원가입'}</h2>
          <p>아이의 소중한 순간을 영원히 간직하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errorMsg && <div className="error-message">{errorMsg}</div>}
          
          <div className="input-group">
            <label>이메일</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="hello@dearest.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label>비밀번호</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button className="text-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? '회원가입 하기' : '로그인 하기'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
