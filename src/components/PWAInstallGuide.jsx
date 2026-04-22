import React, { useState, useEffect } from 'react';
import { X, Share, MoreVertical, Download, PlusSquare, ExternalLink } from 'lucide-react';
import './PWAInstallGuide.css';

const PWAInstallGuide = ({ isOpen, onClose }) => {
  const [os, setOs] = useState('android');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else {
      setOs('android');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="pwa-modal-overlay" onClick={onClose}>
      <div className="pwa-modal-content" onClick={e => e.stopPropagation()}>
        <button className="pwa-close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="pwa-header">
          <div className="pwa-logo">D</div>
          <h2>Dearest 앱 설치하기</h2>
          <p>홈 화면에 추가하면 앱처럼 간편하게 사용할 수 있어요.</p>
        </div>

        <div className="pwa-steps">
          {os === 'ios' ? (
            <div className="os-guide ios-guide">
              <div className="browser-selector">
                <span className="info-text">사용 중인 브라우저를 선택하세요:</span>
              </div>
              <div className="ios-browser-tabs">
                <div className="step-group">
                  <h4>🌐 Safari(사파리) 이용 시</h4>
                  <div className="step-item">
                    <div className="step-num">1</div>
                    <p>하단 도구 모음의 <strong>공유 버튼</strong>을 누르세요.</p>
                    <div className="icon-preview"><Share size={18} color="#007AFF" /></div>
                  </div>
                </div>
                <div className="step-group">
                  <h4>🌐 Chrome(크롬) 이용 시</h4>
                  <div className="step-item">
                    <div className="step-num">1</div>
                    <p>상단 주소창 옆의 <strong>공유 버튼</strong>을 누르세요.</p>
                    <div className="icon-preview"><Share size={18} /></div>
                  </div>
                </div>
                <div className="step-item common-step">
                  <div className="step-num">2</div>
                  <p>공유 메뉴에서 <strong>'홈 화면에 추가'</strong>를 선택하세요.</p>
                  <div className="icon-preview"><PlusSquare size={18} /></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="os-guide android-guide">
              <div className="step-item">
                <div className="step-num">1</div>
                <p>브라우저 우측 상단 <strong>메뉴 버튼</strong>을 누르세요.</p>
                <div className="icon-preview"><MoreVertical size={20} /></div>
              </div>
              <div className="step-item">
                <div className="step-num">2</div>
                <p><strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong>를 누르세요.</p>
                <div className="icon-preview"><Download size={20} /></div>
              </div>
            </div>
          )}
        </div>

        <div className="pwa-footer">
          <button className="btn btn-primary full-width" onClick={onClose}>확인했습니다</button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallGuide;
