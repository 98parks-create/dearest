import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Plus, Play, Save, Loader2, Check, AlertCircle, 
  Trash2, ArrowUp, ArrowDown, Mic, Square, Volume2,
  ChevronUp, ChevronDown, Film, X, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './TimelineMovie.css';

gsap.registerPlugin(ScrollTrigger);

function TimelineMovie() {
  const containerRef = useRef(null);
  const itemsRef = useRef([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videos, setVideos] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(-1);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    if (!profile?.is_subscribed) {
      alert('목소리 녹음 기능은 프리미엄 전용입니다. 멤버십을 업그레이드 해주세요!');
      return;
    }
    
    if (videos.length === 0) {
      alert('녹음 전 먼저 영상을 추가해 주세요!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setCurrentPreviewIndex(-1); // 미리보기 종료
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setCurrentPreviewIndex(0); // 첫 번째 영상부터 재생 시작
    } catch (err) {
      console.error('Recording start failed:', err);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      setCurrentPreviewIndex(-1);
    }
  };

  // 녹음 중 다음 영상으로 자동 전환하는 핸들러
  const handlePreviewEnd = () => {
    if (recording) {
      if (currentPreviewIndex < videos.length - 1) {
        setCurrentPreviewIndex(prev => prev + 1);
      } else {
        stopRecording(); // 마지막 영상이면 녹음 종료
      }
    }
  };
  const [movieTitle, setMovieTitle] = useState('');
  const [totalDuration, setTotalDuration] = useState(0);
  const ffmpegRef = useRef(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    itemsRef.current.forEach((el) => {
      if (el) {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.6,
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" }
          }
        );
      }
    });
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, [videos]);

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const limitCount = profile?.is_subscribed ? 30 : 5;
    const limitDuration = profile?.is_subscribed ? 600 : 15;

    if (videos.length + files.length > limitCount) {
      alert(`현재 플랜으로는 최대 ${limitCount}개까지만 추가할 수 있습니다.`);
      return;
    }

    const newVideos = [...videos];
    let newTotalDuration = totalDuration;

    for (const file of files) {
      const duration = await getVideoDuration(file);
      
      // 추가될 영상의 총 길이가 제한을 넘는지 확인
      if (newTotalDuration + duration > limitDuration) {
        alert(`제한 시간(${limitDuration}초)을 초과하여 더 이상 영상을 추가할 수 없습니다. ${!profile?.is_subscribed ? '\n더 긴 영상을 만들고 싶다면 프리미엄으로 업그레이드 해주세요!' : ''}`);
        break; // 넘는 시점에서 중단
      }

      newVideos.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        duration,
        comment: ''
      });
      newTotalDuration += duration;
    }

    setVideos(newVideos);
    setTotalDuration(newTotalDuration);
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const removeVideo = (id) => {
    const videoToRemove = videos.find(v => v.id === id);
    if (videoToRemove) {
      setTotalDuration(prev => prev - videoToRemove.duration);
      setVideos(prev => prev.filter(v => v.id !== id));
      URL.revokeObjectURL(videoToRemove.preview);
    }
  };

  const moveVideo = (index, direction) => {
    const newVideos = [...videos];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= videos.length) return;
    
    [newVideos[index], newVideos[targetIndex]] = [newVideos[targetIndex], newVideos[index]];
    setVideos(newVideos);
  };

  const handleCommentChange = (id, comment) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, comment } : v));
  };

  const extractVideo = async () => {
    if (videos.length === 0) {
      alert("병합할 영상을 추가해주세요.");
      return;
    }

    setIsExtracting(true);
    setProgress(0);
    
    try {
      // 2시간 전 성공했던 그 엔진 로직 (0.11.0)
      if (!ffmpegRef.current) {
        const { createFFmpeg } = window.FFmpeg;
        ffmpegRef.current = createFFmpeg({ 
          log: true,
          corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
        });
      }
      
      const ffmpeg = ffmpegRef.current;
      const { fetchFile } = window.FFmpeg;

      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }

      ffmpeg.setProgress(({ ratio }) => {
        const p = Math.min(Math.round(ratio * 95), 95);
        setProgress(p);
      });

      for (let i = 0; i < videos.length; i++) {
        await ffmpeg.FS('writeFile', `input_${i}.mp4`, await fetchFile(videos[i].file));
      }

      if (audioBlob) {
        await ffmpeg.FS('writeFile', 'voice.webm', await fetchFile(audioBlob));
      }

      try {
        const fontResponse = await fetch('/font.ttf');
        if (!fontResponse.ok) throw new Error('폰트 파일을 찾을 수 없습니다.');
        const fontBuffer = await fontResponse.arrayBuffer();
        await ffmpeg.FS('writeFile', 'font.ttf', new Uint8Array(fontBuffer));
      } catch (fontErr) {
        console.error('Font load failed:', fontErr);
      }

      // 2. 병합 실행 (720p 고화질 + 자막 + 음성 처리)
      let videoFilter = '';
      for (let i = 0; i < videos.length; i++) {
        const comment = videos[i].comment || '';
        const escapedComment = comment.replace(/'/g, "").replace(/:/g, "\\:");
        videoFilter += `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1${comment ? `,drawtext=fontfile=font.ttf:text='${escapedComment}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-120:box=1:boxcolor=black@0.4:boxborderw=10` : ''}[v${i}];`;
      }
      
      const args = [];
      for (let i = 0; i < videos.length; i++) args.push('-i', `input_${i}.mp4`);

      // [핵심] 영상만 먼저 concat (소리 유무와 상관없이 100% 성공하는 방식)
      let concatV = '';
      for (let i = 0; i < videos.length; i++) concatV += `[v${i}]`;
      concatV += `concat=n=${videos.length}:v=1:a=0[v_orig]`;

      if (audioBlob) {
        // [음성 녹음 있음] 녹음된 음성을 입혀서 병합
        args.push('-i', 'voice.webm');
        args.push('-filter_complex', `${videoFilter}${concatV}`, '-map', '[v_orig]', '-map', `${videos.length}:a`, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-r', '30', '-pix_fmt', 'yuv420p', 'output.mp4');
      } else {
        // [음성 녹음 없음] 무음 영상 에러 방지를 위해 영상만 깔끔하게 병합
        // (이 방식은 소리 없는 영상이 섞여 있어도 절대 에러가 나지 않습니다.)
        args.push('-filter_complex', `${videoFilter}${concatV}`, '-map', '[v_orig]', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-r', '30', '-pix_fmt', 'yuv420p', 'output.mp4');
      }

      await ffmpeg.run(...args);

      // 마무리 단계 (95 -> 99%)
      setProgress(98);

      const data = ffmpeg.FS('readFile', 'output.mp4');
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const fileName = `${user.id}/movie_${Date.now()}.mp4`;
      const { error: uploadError } = await supabase.storage.from('dearest_media').upload(`movies/${fileName}`, videoBlob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('dearest_media').getPublicUrl(`movies/${fileName}`);

      await supabase.from('movies').insert({
        user_id: user.id, video_url: publicUrl, title: movieTitle || '성장 기록 영상'
      });

      // [완료] 정말 모든 작업이 끝난 시점에 100%
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${movieTitle || 'baby_movie'}.mp4`;
      a.click();

      // [메모리 정리] 입력 및 임시 파일 삭제
      for (let i = 0; i < videos.length; i++) {
        try { await ffmpeg.FS('unlink', `input_${i}.mp4`); } catch(e) {}
      }
      try { await ffmpeg.FS('unlink', 'font.ttf'); } catch(e) {}
      try { await ffmpeg.FS('unlink', 'output.mp4'); } catch(e) {}

      alert('영상이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('Merge failed:', error);
      alert('영상 병합 중 오류가 발생했습니다.');
    } finally {
      // 100%인 상태를 잠시 유지하기 위해 딜레이 후 종료
      setTimeout(() => {
        setIsExtracting(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div className="timeline-container" ref={containerRef}>
      <div className="timeline-header">
        <h1>성장 타임라인</h1>
        <p>아이의 소중한 순간들을 하나의 영화로 만들어보세요.</p>
        
        <div className="limit-info-section">
          <div className="limit-badge">
            현재 길이: <span className={totalDuration > (profile?.is_subscribed ? 600 : 15) ? 'over-limit' : ''}>
              {totalDuration.toFixed(1)}s
            </span> / {profile?.is_subscribed ? '600s' : '15s'}
          </div>
          
          {/* [프리미엄 전용] 음성 녹음 섹션 */}
          <div className="voice-record-dashboard glass-panel">
            <div className="voice-header">
              <Volume2 size={18} />
              <span>배경 음성 녹음 {profile?.is_subscribed ? '' : '(Premium)'}</span>
            </div>
            
            {/* 실시간 녹음 모니터 (싱크 맞추기용) */}
            {recording && currentPreviewIndex >= 0 && (
              <div className="recording-monitor fade-in">
                <div className="monitor-badge">REC 모니터링 중</div>
                <video 
                  src={videos[currentPreviewIndex].preview} 
                  autoPlay 
                  muted 
                  onEnded={handlePreviewEnd}
                  className="monitor-video"
                />
                <div className="monitor-info">
                  영상 {currentPreviewIndex + 1} / {videos.length}
                </div>
              </div>
            )}
            
            <div className="voice-controls">
              {!recording ? (
                <button 
                  className={`mic-btn ${recording ? 'recording' : ''}`} 
                  onClick={startRecording}
                  disabled={isExtracting}
                >
                  <Mic size={20} />
                  {audioUrl ? '다시 녹음' : '목소리 입히기'}
                </button>
              ) : (
                <button className="mic-btn recording" onClick={stopRecording}>
                  <Square size={20} />
                  녹음 중단
                </button>
              )}

              {audioUrl && !recording && (
                <div className="audio-preview fade-in">
                  <audio src={audioUrl} controls className="mini-audio" />
                  <button className="delete-audio-btn" onClick={() => { setAudioBlob(null); setAudioUrl(null); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {videos.length >= 10 && (
            <div className="memory-warning fade-in" style={{
              background: 'rgba(255, 179, 142, 0.1)', padding: '0.8rem', borderRadius: '12px',
              marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: 'var(--color-primary-peach)', fontSize: '0.85rem', fontWeight: 'bold',
              border: '1px dashed var(--color-primary-peach)'
            }}>
              <AlertCircle size={16} />
              <span>영상이 많아지면 모바일 기기의 메모리가 부족할 수 있습니다. (PC 권장)</span>
            </div>
          )}
        </div>
      </div>

      <div className="video-upload-section glass-panel">
        <div className="timeline-line"></div>
        
        <div className="upload-btn-wrapper" onClick={() => document.getElementById('video-upload').click()}>
          <input type="file" id="video-upload" multiple accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />
          <div className="upload-icon-wrapper">
            <Plus size={48} color="var(--color-primary-peach)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.3rem' }}>여기를 클릭하여 영상 추가하기</p>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>영상을 추가하면 제목과 자막을 넣을 수 있습니다.</p>
          </div>
        </div>

        <div className="video-list">
          {videos.map((video, index) => (
            <div key={video.id} className="video-item" ref={el => itemsRef.current[index] = el}>
              <div className="video-index">{index + 1}</div>
              <div className="video-preview-box">
                <video src={video.preview} className="video-thumb" />
                <div className="duration-tag">{video.duration.toFixed(1)}s</div>
                
                <div className="video-move-controls">
                  <button onClick={() => moveVideo(index, -1)} disabled={index === 0} title="위로">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveVideo(index, 1)} disabled={index === videos.length - 1} title="아래로">
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
              <div className="video-info">
                <div className="video-name">{video.file.name}</div>
                <div className="comment-group">
                  <label>💌 영상 자막</label>
                  <input 
                    type="text" 
                    className="comment-input" 
                    placeholder="이 영상에 담고 싶은 자막을 입력하세요..." 
                    value={video.comment}
                    onChange={(e) => handleCommentChange(video.id, e.target.value)}
                  />
                </div>
              </div>
              <button className="remove-btn" onClick={() => removeVideo(video.id)}><X size={20} /></button>
            </div>
          ))}
        </div>

        {videos.length > 0 && (
          <div className="merge-action-area glass-panel">
            <div className="title-input-section">
              <label>🎬 영화 제목</label>
              <input 
                type="text" 
                className="movie-title-input" 
                placeholder="예: 우리 아이의 첫 걸음마" 
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
              />
            </div>
            <button className="btn btn-primary extract-btn" onClick={extractVideo} disabled={isExtracting}>
              {isExtracting ? (
                <div className="progress-status">
                  <Loader2 className="spinner" size={24} />
                  <div className="progress-info">
                    <div className="progress-label">영화 제작 중... {progress}%</div>
                    <div className="progress-bar-container" style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', marginTop: '5px' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary-peach)', borderRadius: '4px', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <><Film size={18} /> 하나의 영화로 만들기 & 다운로드</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineMovie;
