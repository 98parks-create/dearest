import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, Lock, Film, Heart, Clock, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PWAInstallGuide from '../components/PWAInstallGuide';
import './Home.css';

gsap.registerPlugin(ScrollTrigger);

function Home() {
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const heroRef = useRef(null);
  const featureSectionRef = useRef(null);
  const cardsRef = useRef([]);
  const textRefs = useRef([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/storybook');
    } else {
      navigate('/auth');
    }
  };

  useEffect(() => {
    // Hero Animation
    gsap.fromTo(heroRef.current, 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
    );

    // Feature Cards ScrollTrigger
    cardsRef.current.forEach((el, index) => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Text Content ScrollTrigger
    textRefs.current.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <h1>소중한 아이의 순간을, <br/>영원한 기억으로</h1>
        <p>Dearest는 부모님의 목소리와 함께 아이의 성장을 기록하는 특별한 공간입니다.</p>
        <div className="hero-btns">
          <button onClick={handleStart} className="btn btn-primary start-btn">지금 시작하기</button>
          <button onClick={() => setIsPwaModalOpen(true)} className="btn btn-outline pwa-btn">
            <Download size={18} /> 앱 설치 가이드
          </button>
        </div>
      </section>

      <PWAInstallGuide isOpen={isPwaModalOpen} onClose={() => setIsPwaModalOpen(false)} />

      {/* Why Dearest Section */}
      <section className="info-section">
        <div className="info-text" ref={el => textRefs.current[0] = el}>
          <div className="info-badge"><Heart size={16} /> 왜 Dearest인가요?</div>
          <h2>시간이 흘러도 변치 않는 목소리의 힘</h2>
          <p>
            우리는 수천 장의 사진을 찍지만, 정작 아이에게 사랑한다고 말해주던 그 순간의 
            '목소리'는 잊혀지기 쉽습니다. Dearest는 시각적인 기록을 넘어, 
            아이를 향한 부모의 따뜻한 감정을 청각적으로 영원히 보존합니다.
          </p>
          <p>
            나중에 아이가 자라서 글을 읽을 수 있게 되었을 때, 
            그 시절 엄마 아빠의 다정한 목소리를 직접 들려준다면 얼마나 큰 선물이 될까요?
          </p>
        </div>
        <div className="info-visual glass-panel" ref={el => textRefs.current[1] = el}>
          <div className="mock-audio-wave">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <p className="mock-caption">"우리아가, 첫 걸음마 축하해 사랑해!"</p>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="features-detail-section" ref={featureSectionRef}>
        <div className="section-title">
          <h2>Dearest만의 특별한 기능</h2>
          <p>아이의 성장을 기록하는 가장 아름다운 방법</p>
        </div>

        <div className="features-grid">
          <Link to="/storybook" className="feature-card glass-panel" ref={el => cardsRef.current[0] = el}>
            <div className="icon-wrapper"><BookOpen size={32} /></div>
            <h3>인터랙티브 보이스북</h3>
            <p>사진과 편지를 올리고, 그 자리에서 엄마·아빠의 목소리를 녹음하세요. 재생할 때 목소리 파형에 맞춰 사진이 미세하게 움직이고 글자가 타이핑되듯 나타납니다.</p>
          </Link>
          
          <Link to="/timecapsule" className="feature-card glass-panel" ref={el => cardsRef.current[1] = el}>
            <div className="icon-wrapper"><Lock size={32} /></div>
            <h3>타임캡슐 잠금</h3>
            <p>"아이의 10번째 생일에 열리는 편지". 사진과 진심을 담은 편지를 미래의 특정 날짜로 봉인하세요. 시간이 지나기 전까지는 완벽히 잠긴 상자와 카운트다운만 표시됩니다.</p>
          </Link>

          <Link to="/timeline" className="feature-card glass-panel" ref={el => cardsRef.current[2] = el}>
            <div className="icon-wrapper"><Film size={32} /></div>
            <h3>성장 기록 영상 병합</h3>
            <p>스마트폰에 파편화되어 있는 짧은 동영상들을 한 번에 업로드하세요. 브라우저 내부에서 단숨에 하나의 긴 성장 영상으로 합쳐서 간직할 수 있습니다.</p>
          </Link>
        </div>
      </section>

      {/* Example / Call to Action */}
      <section className="cta-section glass-panel" ref={el => textRefs.current[2] = el}>
        <Clock size={48} className="cta-icon" />
        <h2>지금, 가장 예쁜 이 순간을 놓치지 마세요.</h2>
        <p>오늘의 평범한 일상이, 내일은 아이가 가장 열어보고 싶은 보물이 됩니다.</p>
        <button onClick={handleStart} className="btn btn-primary cta-btn">무료로 내 아이 기록 시작하기</button>
      </section>
    </div>
  );
}

export default Home;
