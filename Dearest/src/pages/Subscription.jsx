import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Check, Star, Loader2, ChevronRight, ShieldCheck, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import './Subscription.css';

const TOSS_CLIENT_KEY = 'test_ck_ORzdMaqN3wo7pLmzYE1q35AkYXQG';

function Subscription() {
  const { user, profile, updateProfileState } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState('plan'); // plan -> method -> processing -> success
  const [isProcessing, setIsProcessing] = useState(false);

  // 결제 성공/실패 파라미터 확인
  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (paymentKey && orderId && amount) {
      handleFinalizeSubscription();
    }
  }, [searchParams]);

  const handleFinalizeSubscription = () => {
    // 이제 자동 업데이트가 아닌, 신청 완료 화면만 보여줍니다.
    setStep('success');
  };

  const requestPayment = async (method) => {
    setIsProcessing(true);
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const orderId = `order_${Date.now()}`;

      await tossPayments.requestPayment(method === 'card' ? '카드' : '가상계좌', {
        amount: 2900,
        orderId: orderId,
        orderName: 'Dearest 프리미엄 구독 (1개월)',
        customerName: user.email?.split('@')[0] || '사용자',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err) {
      console.error('Payment request error:', err);
      if (err.code !== 'USER_CANCEL') {
        alert('결제창을 띄우는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (profile?.is_subscribed && step !== 'success') {
    return (
      <div className="sub-success-view">
        <Star size={64} className="star-icon" />
        <h2>이미 프리미엄을 구독 중이십니다!</h2>
        <p>Dearest의 모든 기능을 무제한으로 사용하실 수 있습니다.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="sub-wrapper">
      {/* 1단계: 플랜 선택 */}
      {step === 'plan' && (
        <div className="sub-container fade-in">
          <div className="sub-header">
            <div className="premium-badge">PREMIUM</div>
            <h2>가장 소중한 기록, 무제한으로</h2>
            <p style={{ color: 'var(--color-primary-peach)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>"커피 한 잔으로 아이에게 추억을 선물하세요"</p>
            <p>15초의 한계를 넘어 아이의 성장 과정을 한 편의 영화로 남기세요.</p>
          </div>

          <div className="plan-card glass-panel highlight">
            <div className="plan-title">
              <Star size={24} fill="var(--color-primary-peach)" color="var(--color-primary-peach)" />
              <span>Dearest 프리미엄</span>
            </div>
            <div className="plan-price">
              <span className="amount">₩2,900</span>
              <span className="period">/ 월</span>
            </div>
            <ul className="plan-benefits">
              <li><Check size={18} /> <span>타임라인 영상 병합 <strong>무제한 (최대 10분)</strong></span></li>
              <li><Check size={18} /> <span>타임캡슐 & 보이스북 <strong>무제한 생성</strong></span></li>
              <li><Check size={18} /> <span>고화질(HD) 원본 보관 및 다운로드</span></li>
              <li><Check size={18} /> <span>프리미엄 전용 테마 우선 업데이트</span></li>
            </ul>
            <button className="btn btn-primary" onClick={() => setStep('payment')}>
              지금 업그레이드 하기
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="payment-section fade-in">
          <div className="glass-panel payment-card">
            <h2>무통장 입금 안내</h2>
            <p className="payment-desc">아래 계좌로 입금해 주시면 확인 후 1시간 이내로 프리미엄 권한이 승인됩니다.</p>
            
            <div className="bank-info-box">
              <div className="bank-row">
                <span className="label">입금하실 금액</span>
                <span className="value highlight">2,900원</span>
              </div>
              <div className="bank-row">
                <span className="label">은행명</span>
                <span className="value">우리은행</span>
              </div>
              <div className="bank-row">
                <span className="label">계좌번호</span>
                <span className="value copyable">1002-056-783054</span>
              </div>
              <div className="bank-row">
                <span className="label">예금주</span>
                <span className="value">박*서</span>
              </div>
            </div>

            <ul className="features">
              <li>🎬 영상 길이 최대 10분 (600초)</li>
              <li>💎 제작 영상 HD 고화질 원본 보관</li>
              <li>📚 타임캡슐 & 보이스북 무제한 생성</li>
            </ul>

            <div className="payment-guide">
              <p>📍 <strong>주의사항</strong></p>
              <ul>
                <li>입금자명과 회원 이메일 성함이 같아야 빠른 확인이 가능합니다.</li>
                <li>입금 확인 후 마이페이지에서 프리미엄 배지를 확인하실 수 있습니다.</li>
              </ul>
            </div>

            <button className="btn btn-primary full-width" onClick={handleFinalizeSubscription}>
              입금을 완료했습니다
            </button>
            <button className="btn btn-outline full-width" onClick={() => setStep('plan')} style={{marginTop: '0.8rem'}}>
              뒤로 가기
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="processing-container">
          <Loader2 className="spinner-large" size={60} />
          <h3>결제 정보를 확인 중입니다...</h3>
          <p>잠시만 기다려주세요. 페이지를 새로고침하지 마세요.</p>
        </div>
      )}

      {/* 4단계: 성공 */}
      {step === 'success' && (
        <div className="success-section fade-in">
          <div className="success-card glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div className="success-icon-wrapper" style={{ 
              background: '#fff4f0', 
              margin: '0 auto 2rem',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={48} color="var(--color-primary-peach)" />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>입금 확인 신청 완료!</h2>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              소중한 입금 감사드립니다.<br/>
              <strong>박*서</strong> 대표님이 입금을 확인한 후<br/>
              최대한 빨리 프리미엄 멤버십을 승인해 드릴게요!
            </p>
            <div className="status-badge">입금 확인 대기 중</div>
            <div style={{ marginTop: '3.5rem' }}>
              <button className="btn btn-primary full-width" onClick={() => navigate('/')}>
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscription;
