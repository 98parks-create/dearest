import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Mic, Square, Play, Image as ImageIcon, Save, Loader2, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { getSafeImageUrl } from '../utils/imageLoader';
import './Storybook.css';

function Storybook() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [photoFile, setPhotoFile] = useState(null);
  const [photo, setPhoto] = useState(null); // URL
  const [text, setText] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStories, setSavedStories] = useState([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestAnimationFrameRef = useRef(null);
  const audioRef = useRef(null);

  const textRef = useRef(null);
  const imageRef = useRef(null);
  const waveCanvasRef = useRef(null);

  useEffect(() => {
    gsap.fromTo('.storybook-container', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8 }
    );
    fetchStories();
  }, [user]);

  const fetchStories = async () => {
    if (!user) {
      setIsLoadingStories(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setSavedStories(data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setIsLoadingStories(false);
    }
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setPhoto(URL.createObjectURL(e.target.files[0]));
    }
  };

  const startRecording = async () => {
    if (!profile?.is_subscribed) {
      alert("음성 녹음 기능은 프리미엄 구독자 전용입니다. 구독 후 아이에게 따뜻한 목소리를 들려주세요!");
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

  const playAudio = (urlToPlay = audioUrl, textToSync = text, imgTarget = imageRef.current) => {
    if (!urlToPlay || isPlaying) return;
    
    setIsPlaying(true);
    // Remove previous audio if exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    audioRef.current = new Audio(urlToPlay);
    audioRef.current.crossOrigin = "anonymous";
    
    audioRef.current.onended = () => {
      setIsPlaying(false);
      cancelAnimationFrame(requestAnimationFrameRef.current);
      if (imgTarget) gsap.to(imgTarget, { scale: 1, duration: 0.5 });
    };
    
    // Web Audio API for visualizer & sync
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Connect analyzer only if not already connected to avoid errors
    try {
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (e) {
      console.log('Audio node already connected or cors issue, proceeding anyway.');
    }

    audioRef.current.play().catch(e => {
      console.error('Play error', e);
      setIsPlaying(false);
    });
    
    visualize(imgTarget);

    // GSAP text animation (lip-sync feel)
    if (textRef.current) {
      const chars = textToSync.split('');
      textRef.current.innerHTML = '';
      chars.forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.opacity = '0';
        textRef.current.appendChild(span);
      });

      const audioDuration = audioRef.current.duration && isFinite(audioRef.current.duration) ? audioRef.current.duration : 3;
      gsap.to(textRef.current.children, {
        opacity: 1,
        stagger: audioDuration / (chars.length || 1),
        ease: "none"
      });
    }
  };

  const visualize = (imgTarget) => {
    const canvas = waveCanvasRef.current;
    if (!canvas || !analyserRef.current) return;
    
    const canvasCtx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      let sum = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        sum += barHeight;

        canvasCtx.fillStyle = `rgb(255, ${170 - (barHeight / 2)}, ${145 - (barHeight / 2)})`;
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }

      if (imgTarget) {
        const avgVolume = sum / bufferLength;
        const scale = 1 + (avgVolume / 1000);
        gsap.to(imgTarget, { scale, duration: 0.1, overwrite: "auto" });
      }
    };

    draw();
  };

  const saveStory = async () => {
    if (!profile?.is_subscribed && savedStories.length >= 3) {
      alert('무료 보이스북 생성 횟수(3회)를 모두 사용하셨습니다. 계속 이용하시려면 구독이 필요합니다.');
      navigate('/subscription');
      return;
    }

    if (!photoFile && !audioBlob && !text) {
      alert('사진, 편지, 목소리 녹음 중 최소 1개 이상을 작성해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      let photoPublicUrl = null;
      let audioPublicUrl = null;

      // 1. Upload Photo (if exists)
      if (photoFile) {
        const photoExt = photoFile.name.split('.').pop();
        const photoName = `${user.id}/photo_${Math.random()}.${photoExt}`;
        const { error: photoErr } = await supabase.storage.from('dearest_media').upload(`stories/${photoName}`, photoFile);
        if (photoErr) throw photoErr;
        const { data: { publicUrl } } = supabase.storage.from('dearest_media').getPublicUrl(`stories/${photoName}`);
        photoPublicUrl = publicUrl;
      }

      // 2. Upload Audio (if exists)
      if (audioBlob) {
        const audioName = `${user.id}/audio_${Math.random()}.mp3`;
        const { error: audioErr } = await supabase.storage.from('dearest_media').upload(`stories/${audioName}`, audioBlob);
        if (audioErr) throw audioErr;
        const { data: { publicUrl } } = supabase.storage.from('dearest_media').getPublicUrl(`stories/${audioName}`);
        audioPublicUrl = publicUrl;
      }

      // 3. Insert into DB
      const { error: dbErr } = await supabase.from('stories').insert({
        user_id: user.id,
        text_content: text,
        photo_url: photoPublicUrl,
        audio_url: audioPublicUrl
      });
      if (dbErr) throw dbErr;

      alert('보이스북이 영구적으로 보관되었습니다!');
      
      // Reset Form
      setPhotoFile(null);
      setPhoto(null);
      setText('');
      setAudioBlob(null);
      setAudioUrl(null);
      
      // Refresh list
      fetchStories();

    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다. (테이블/버킷 설정을 확인해주세요.)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="storybook-container">
      <div className="storybook-header">
        <h2>인터랙티브 보이스북</h2>
        <p>사진과 편지를 올리고, 부모님의 따뜻한 목소리를 입혀보세요.</p>
      </div>

      <div className="storybook-content">
        <div className="left-panel glass-panel">
          <h3>새로운 이야기 만들기</h3>
          <div className="image-upload-area" onClick={() => document.getElementById('photo-upload').click()}>
            <input 
              type="file" 
              id="photo-upload" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handlePhotoUpload} 
            />
            {photo ? (
              <img src={photo} alt="Uploaded preview" className="preview-image" ref={imageRef} />
            ) : (
              <div className="upload-placeholder">
                <ImageIcon size={48} />
                <p>사진을 터치하여 업로드하세요</p>
              </div>
            )}
          </div>

          <textarea 
            className="input-field message-input" 
            placeholder="아이야, 오늘 너는..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="controls">
            {!isRecording ? (
              <button className="btn btn-primary" onClick={startRecording}>
                <Mic size={18} /> 음성 녹음 시작
              </button>
            ) : (
              <button className="btn btn-secondary" style={{borderColor: '#e74c3c', color: '#e74c3c'}} onClick={stopRecording}>
                <Square size={18} /> 녹음 완료
              </button>
            )}
          </div>

          <div style={{ marginTop: '1rem', width: '100%' }}>
            <button 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                background: (photo || audioUrl || text) ? '#4ade80' : 'var(--color-secondary-beige)', 
                borderColor: (photo || audioUrl || text) ? '#4ade80' : 'var(--color-secondary-beige)', 
                color: (photo || audioUrl || text) ? 'white' : 'var(--color-text-light)' 
              }} 
              onClick={saveStory} 
              disabled={isSaving || (!photo && !audioUrl && !text)}
            >
              {isSaving ? <><Loader2 className="spinner" size={18} /> 저장 중...</> : 
               (!photo && !audioUrl && !text) ? <><Save size={18} /> 최소 1개의 기록을 남겨주세요</> :
               <><Save size={18} /> 이대로 영구 보관하기</>}
            </button>
          </div>
        </div>

        <div className="right-panel glass-panel">
          <h3>미리보기 및 보관함</h3>
          
          <div className="preview-area">
             {photo ? <img src={photo} alt="preview" className="mini-preview" crossOrigin="anonymous" /> : <div className="mini-preview" style={{background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><ImageIcon size={32} color="#aaa" /></div>}
             <div className="text-display" ref={textRef}>
               {text || '작성하신 편지가 이곳에 립싱크처럼 표시됩니다.'}
             </div>
             
             {audioUrl && (
               <div className="audio-player-section">
                 <button className="btn btn-primary play-btn" onClick={() => playAudio(audioUrl, text, imageRef.current)} disabled={isPlaying}>
                    <Play size={18} /> {isPlaying ? '재생 중...' : '동화책 읽기'}
                 </button>
                 <canvas ref={waveCanvasRef} width="300" height="60" className="wave-canvas"></canvas>
               </div>
             )}
          </div>
          
          <div className="saved-stories-list">
             <h4>나의 보이스북 보관함</h4>
             {isLoadingStories ? (
               <p style={{textAlign: 'center', marginTop: '1rem'}}><Loader2 className="spinner" size={24} color="var(--color-primary-peach)" /></p>
             ) : savedStories.length === 0 ? (
               <p style={{textAlign: 'center', color: 'var(--color-text-light)', marginTop: '1rem'}}>아직 보관된 동화책이 없습니다.</p>
             ) : (
               <div className="story-items">
                 {savedStories.map((story, idx) => (
                   <div key={story.id} className="story-item" onClick={() => {
                     setPhoto(story.photo_url);
                     setText(story.text_content || '');
                     setAudioUrl(story.audio_url);
                   }}>
                     {story.photo_url ? (
                       <img src={story.photo_url} alt="thumbnail" crossOrigin="anonymous" />
                     ) : (
                       <div style={{width: '50px', height: '50px', background: '#ddd', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                         <ImageIcon size={20} color="#aaa" />
                       </div>
                     )}
                     <div className="story-info">
                       <span>{new Date(story.created_at).toLocaleDateString()}의 기록</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Storybook;
