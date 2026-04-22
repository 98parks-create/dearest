import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Heart, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

import Home from './pages/Home';
import Storybook from './pages/Storybook';
import TimeCapsule from './pages/TimeCapsule';
import TimelineMovie from './pages/TimelineMovie';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Subscription from './pages/Subscription';
import Waiting from './pages/Waiting';
import MyPage from './pages/MyPage';
import SecretGate from './pages/SecretGate';
import Legal from './pages/Legal';
import Footer from './components/Footer';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  if (requireAdmin && (!profile || !profile.is_admin)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <Heart size={24} fill="currentColor" />
        Dearest
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/storybook" className="nav-link">보이스북</Link>
            <Link to="/timecapsule" className="nav-link">타임캡슐</Link>
            <Link to="/timeline" className="nav-link">성장 영상</Link>
            <Link to="/mypage" className="nav-link" style={{fontWeight: 'bold', color: 'var(--color-primary-peach)'}}>마이페이지</Link>
            {profile?.is_admin && (
              <Link to="/admin" className="nav-link" style={{color: '#e74c3c'}}>관리자</Link>
            )}
            <div className="user-menu">
              <span className="user-email">{user.email?.split('@')[0]}님</span>
              {!profile?.is_subscribed && (
                <Link to="/subscription" className="nav-link" style={{fontSize: '0.9rem', color: '#f39c12', fontWeight: 'bold'}}>
                  업그레이드
                </Link>
              )}
              <button onClick={logout} className="logout-btn" title="로그아웃">
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <Link to="/auth" className="nav-link btn btn-primary" style={{color: 'white', padding: '8px 16px'}}>시작하기</Link>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/payment/success" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/payment/fail" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
              <Route path="/secret-gate" element={<SecretGate />} />
              <Route path="/storybook" element={
                <ProtectedRoute>
                  <Storybook />
                </ProtectedRoute>
              } />
              <Route path="/timecapsule" element={
                <ProtectedRoute>
                  <TimeCapsule />
                </ProtectedRoute>
              } />
              <Route path="/timeline" element={
                <ProtectedRoute>
                  <TimelineMovie />
                </ProtectedRoute>
              } />
              <Route path="/legal/:type" element={<Legal />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
