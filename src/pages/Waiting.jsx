import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function Waiting() {
  const { user, profile } = useAuth();

  if (!user) return <Navigate to="/auth" />;
  if (profile?.is_approved) return <Navigate to="/" />;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', height: '60vh', textAlign: 'center', gap: '1.5rem'
    }}>
      <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.7)', borderRadius: '16px', boxShadow: 'var(--glass-shadow)' }}>
        <ShieldAlert size={64} color="var(--color-primary-peach)" style={{marginBottom: '1rem'}} />
        <h2>관리자 승인 대기 중입니다</h2>
        <p style={{ color: 'var(--color-text-light)', marginTop: '1rem', lineHeight: '1.6' }}>
          소중한 아이의 데이터를 안전하게 보호하기 위해<br/>
          Dearest는 가입 후 <strong>관리자의 승인</strong>이 완료되어야 이용할 수 있습니다.<br/>
          조금만 기다려 주시면 확인 후 승인해 드리겠습니다.
        </p>
      </div>
    </div>
  );
}

export default Waiting;
