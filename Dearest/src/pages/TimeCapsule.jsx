import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Gift, Lock, Unlock, Image as ImageIcon, Loader2, PlusCircle, Mic, Square, PlayCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './TimeCapsule.css';

function TimeCapsule() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [unlockDate, setUnlockDate] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [letter, setLetter] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbCapsule, setDbCapsule] = useState(null);
  const [capsuleCount, setCapsuleCount] = useState(0);

  const boxRef = useRef(null);
  const timerRef = useRef(null);
  const contentRef = useRef(null);

  // 1. Initial Load: Check capsule count
  useEffect(() => {
    const fetchCapsuleCount = async () => {
      if (!user) return;
      try {
        const { count, error } = await supabase
          .from('timecapsules')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (error) throw error;
        setCapsuleCount(count || 0);
      } catch (error) {
        console.error('Error fetching capsule count:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchCapsuleCount();

    gsap.fromTo('.timecapsule-container', 
      { opacity: 0, scale: 0.95 }, 
      { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
    );
  }, [user]);

  const isSubscribed = profile?.is_subscribed;
  const capsuleLimit = isSubscribed ? Infinity : 1;
  const canCreate = isSubscribed || capsuleCount < 1;

  // 2. Timer Logic (마이페이지용으로 이동 예정이지만 여기서는 생성 폼만 유지)
  useEffect(() => {
    if (isLocked && unlockDate) {
      const targetTime = new Date(unlockDate).getTime();

      timerRef.current = setInterval(async () => {
        const now = new Date().getTime();
        const difference = targetTime - now;

        if (difference <= 0) {
          clearInterval(timerRef.current);
          setIsLocked(false);
          setIsUnlocked(true);
          setMessage("타임캡슐이 열렸습니다!");
          
          // Re-fetch to get actual data (since RLS might have blocked it before)
          if (user) {
             const { data } = await supabase
              .from('timecapsules')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
             if (data) {
               setPhotoUrl(data.photo_url);
               setLetter(data.letter_text);
               setAudioUrl(data.audio_url);
             }
          }

          gsap.to(boxRef.current, { scale: 1.2, rotation: 360, duration: 1, ease: "bounce.out" });
          
          setTimeout(() => {
            if (contentRef.current) {
              gsap.fromTo(contentRef.current,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 1, ease: "back.out(1.7)" }
              );
            }
          }, 500);
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft({ days, hours, minutes, seconds });
        }
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isLocked, unlockDate, user]);

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setPhotoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const startRecording = async () => {
    if (!profile?.is_subscribed) {
      alert("음성 녹음 기능은 프리미엄 구독자 전용입니다. 구독 후 미래의 아이에게 목소리를 남겨보세요!");
      navigate('/subscription');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleLock = async () => {
    if (!isSubscribed && capsuleCount >= 1) {
      alert(`무료 타임캡슐 생성 한도(1개)를 초과했습니다. 계속 이용하시려면 구독이 필요합니다.`);
      navigate('/subscription');
      return;
    }
    
    if (!unlockDate) {
      alert('열릴 날짜를 선택해주세요.');
      return;
    }
    if (!photoFile && !letter && !audioBlob) {
      alert('사진, 편지, 목소리 녹음 중 최소 1개를 작성해주세요.');
      return;
    }
    const targetTime = new Date(unlockDate).getTime();
    if (targetTime <= new Date().getTime()) {
      alert('미래의 시간을 선택해주세요.');
      return;
    }
    
    setIsLoading(true);

    try {
      let uploadedPhotoUrl = null;
      let uploadedAudioUrl = null;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('dearest_media')
          .upload(`timecapsules/${fileName}`, photoFile);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('dearest_media')
          .getPublicUrl(`timecapsules/${fileName}`);
          
        uploadedPhotoUrl = publicUrl;
      }

      if (audioBlob) {
        const audioName = `${user.id}/audio_${Math.random()}.mp3`;
        const { error: audioErr } = await supabase.storage
          .from('dearest_media')
          .upload(`timecapsules/${audioName}`, audioBlob);
        
        if (audioErr) throw audioErr;

        const { data: { publicUrl } } = supabase.storage
          .from('dearest_media')
          .getPublicUrl(`timecapsules/${audioName}`);
          
        uploadedAudioUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('timecapsules')
        .insert({
          user_id: user.id,
          unlock_date: new Date(unlockDate).toISOString(),
          letter_text: letter,
          photo_url: uploadedPhotoUrl,
          audio_url: uploadedAudioUrl
        });

      if (insertError) throw insertError;

      alert('타임캡슐이 성공적으로 봉인되었습니다! 마이페이지로 이동합니다.');
      navigate('/mypage');
      
    } catch (error) {
      console.error('Error locking capsule:', error);
      alert('타임캡슐 봉인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return <div className="timecapsule-container"><Loader2 className="spinner" size={48} color="var(--color-primary-peach)" /></div>;
  }

  return (
    <div className="timecapsule-container">
      <div className="tc-header">
        <h2>타임캡슐 봉인하기</h2>
        <p>미래의 아이에게 전하고 싶은 소중한 마음을 담아보세요.</p>
        <div className="limit-badge">
          현재 보유 캡슐: {capsuleCount} / {isSubscribed ? '무제한' : '1'}
        </div>
      </div>

      <div className="tc-content glass-panel">
        {canCreate ? (
          <div className="setup-area">
            <div className="tc-input-section">
              <label>📸 사진 첨부</label>
              <div className="tc-image-upload" onClick={() => document.getElementById('tc-photo-upload').click()}>
                <input 
                  type="file" 
                  id="tc-photo-upload" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handlePhotoUpload} 
                />
                {photoUrl ? (
                  <img src={photoUrl} alt="Uploaded" className="tc-preview-image" />
                ) : (
                  <div className="tc-upload-placeholder">
                    <ImageIcon size={32} />
                    <p>미래에 보여줄 사진을 선택하세요</p>
                  </div>
                )}
              </div>
            </div>

            <div className="tc-input-section">
              <label>🎤 목소리 녹음 (선택)</label>
              <div className="tc-audio-controls">
                {!isRecording ? (
                  <button className="btn btn-secondary" onClick={startRecording}>
                    <Mic size={18} /> 음성 녹음 시작
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{background: '#e74c3c', borderColor: '#e74c3c'}} onClick={stopRecording}>
                    <Square size={18} /> 녹음 완료
                  </button>
                )}
                {audioBlob && <span style={{marginLeft: '1rem', color: '#4ade80', fontWeight: 'bold'}}>녹음 완료됨 ✓</span>}
              </div>
            </div>

            <div className="tc-input-section">
              <label>💌 미래의 아이에게 보내는 편지</label>
              <textarea 
                className="input-field tc-textarea" 
                placeholder="사랑하는 아이야, 지금 엄마/아빠는 이런 마음이란다..."
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
              />
            </div>

            <div className="tc-input-section">
              <label>🔓 언제 열어볼까요? (열릴 날짜와 시간)</label>
              <input 
                type="datetime-local" 
                className="input-field date-input"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
              />
            </div>

            <button className="btn btn-primary tc-btn" onClick={handleLock} disabled={isLoading}>
              {isLoading ? <><Loader2 className="spinner" size={18} /> 봉인 중...</> : <><Lock size={18} /> 소중하게 담아 봉인하기</>}
            </button>
          </div>
        ) : (
          <div className="limit-reached-area" style={{textAlign: 'center', padding: '3rem 1rem'}}>
            <Lock size={64} color="var(--color-primary-peach)" style={{marginBottom: '1rem'}} />
            <h3>타임캡슐 생성 한도에 도달했습니다.</h3>
            <p style={{margin: '1rem 0', color: '#666'}}>
              이미 타임캡슐을 봉인하셨습니다.<br/>
              기존 캡슐을 확인하거나 관리하려면 마이페이지로 이동해 주세요.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/mypage')}>
              마이페이지에서 확인하기
            </button>
            {!isSubscribed && (
              <p style={{marginTop: '1.5rem', fontSize: '0.9rem'}}>
                구독(프리미엄) 시 <b>제한 없이 무제한</b>으로 생성 가능합니다! 
                <span style={{color: 'var(--color-primary-peach)', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px'}} onClick={() => navigate('/subscription')}>
                  구독하러 가기 👉
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeCapsule;
