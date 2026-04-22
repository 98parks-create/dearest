import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, CheckCircle, XCircle, Shield, ShieldAlert, Video, Mail, Calendar, CreditCard } from 'lucide-react';

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
      
      const premium = data?.filter(u => u.is_subscribed).length || 0;
      setStats({ totalUsers: data?.length || 0, premiumUsers: premium });
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId, field, currentStatus) => {
    try {
      let updateData = { [field]: !currentStatus };
      
      // 프리미엄 전환 시 1개월 뒤 만료일 설정
      if (field === 'is_subscribed' && !currentStatus) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updateData.subscribed_until = nextMonth.toISOString();
      } else if (field === 'is_subscribed' && currentStatus) {
        // 프리미엄 해제 시 만료일 제거
        updateData.subscribed_until = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, ...updateData } : u));
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner"></div>
      <p>데이터를 불러오는 중입니다...</p>
    </div>
  );

  return (
    <div className="admin-container fade-in">
      <div className="admin-header">
        <div className="header-title">
          <Shield size={32} color="var(--color-primary-peach)" />
          <h2>Dearest 통합 관리 시스템</h2>
        </div>
        <div className="admin-stats">
          <div className="stat-item">
            <span className="stat-label">전체 유저</span>
            <span className="stat-value">{stats.totalUsers}명</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">프리미엄</span>
            <span className="stat-value">{stats.premiumUsers}명</span>
          </div>
        </div>
      </div>

      <div className="admin-content-grid">
        <div className="user-table-wrapper glass-panel">
          <h3><Users size={18} /> 사용자 권한 및 구독 관리</h3>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>사용자 정보</th>
                  <th>가입일</th>
                  <th>구독 상태</th>
                  <th>관리자 권한</th>
                  <th>승인</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-info-cell">
                        <Mail size={14} />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-info-cell">
                        <Calendar size={14} />
                        <span>{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className={`status-btn ${u.is_subscribed ? 'premium' : 'free'}`}
                        onClick={() => toggleStatus(u.id, 'is_subscribed', u.is_subscribed)}
                      >
                        <CreditCard size={14} />
                        {u.is_subscribed ? '프리미엄' : '일반'}
                      </button>
                      {u.is_subscribed && u.subscribed_until && (
                        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px', textAlign: 'center' }}>
                          ~{new Date(u.subscribed_until).toLocaleDateString()} 까지
                        </div>
                      )}
                    </td>
                    <td>
                      <button 
                        className={`status-btn ${u.is_admin ? 'admin' : 'user'}`}
                        onClick={() => toggleStatus(u.id, 'is_admin', u.is_admin)}
                      >
                        {u.is_admin ? <ShieldAlert size={14} /> : <Shield size={14} />}
                        {u.is_admin ? '관리자' : '일반'}
                      </button>
                    </td>
                    <td>
                      <button 
                        className={`approval-btn ${u.is_approved ? 'approved' : 'pending'}`}
                        onClick={() => toggleStatus(u.id, 'is_approved', u.is_approved)}
                      >
                        {u.is_approved ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
        .header-title { display: flex; align-items: center; gap: 1rem; }
        .admin-stats { display: flex; gap: 1.5rem; }
        .stat-item { background: white; padding: 0.8rem 1.5rem; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; }
        .stat-label { font-size: 0.8rem; color: #888; }
        .stat-value { font-weight: 800; font-size: 1.2rem; color: var(--color-primary-peach); }
        
        .user-table-wrapper { padding: 1.5rem; }
        .user-table-wrapper h3 { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 1.1rem; }
        
        .table-responsive { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .admin-table th { text-align: left; padding: 1rem; border-bottom: 2px solid var(--color-secondary-beige); color: #888; font-size: 0.85rem; }
        .admin-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(230,222,214,0.3); }
        
        .user-info-cell { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
        
        .status-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; border-radius: 20px; border: 1px solid transparent; cursor: pointer; font-size: 0.8rem; font-weight: 700; transition: all 0.2s; }
        .status-btn.premium { background: #fff9db; border-color: #fab005; color: #f08c00; }
        .status-btn.free { background: #f8f9fa; border-color: #dee2e6; color: #adb5bd; }
        .status-btn.admin { background: #fff5f5; border-color: #ffc9c9; color: #fa5252; }
        .status-btn.user { background: #f8f9fa; border-color: #dee2e6; color: #adb5bd; }
        
        .approval-btn { background: none; border: none; cursor: pointer; transition: transform 0.2s; }
        .approval-btn:hover { transform: scale(1.1); }
        .approval-btn.approved { color: #4ade80; }
        .approval-btn.pending { color: #fa5252; }
        
        .admin-loading { display: flex; flex-direction: column; align-items: center; padding: 5rem; gap: 1rem; }
        .spinner { width: 40px; height: 40px; border: 4px solid var(--color-secondary-beige); border-top-color: var(--color-primary-peach); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default Admin;
