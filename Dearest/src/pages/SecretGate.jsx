import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

function SecretGate() {
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, updateProfileState } = useAuth();
  const navigate = useNavigate();

  const handlePromote = async (e) => {
    e.preventDefault();
    
    // 설정하신 비밀 암호 확인
    if (password !== 'qkrdkdls99..!!') {
      alert('비밀 암호가 일치하지 않습니다.');
      return;
    }

    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);

      if (error) throw error;

      updateProfileState({ is_admin: true });
      alert('관리자 권한이 성공적으로 부여되었습니다. 마스터님, 환영합니다!');
      navigate('/admin');
    } catch (err) {
      console.error('Promotion error:', err);
      alert('권한 부여 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: 'var(--color-background)', padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '400px', padding: '3rem 2rem', textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <ShieldCheck size={64} color="var(--color-primary-peach)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>Dearest Secret Gate</h2>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2.5rem' }}>관리자 권한 획득을 위해 암호를 입력하세요.</p>

        <form onSubmit={handlePromote}>
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
            <input 
              type="password" 
              placeholder="비밀 암호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px',
                border: '2px solid var(--color-secondary-beige)', outline: 'none', fontSize: '1rem'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontWeight: 700 }}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="spinner" size={20} /> : '권한 획득하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SecretGate;
