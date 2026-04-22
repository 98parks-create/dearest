import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Plus, 
  X, 
  Loader2, 
  ChevronUp, 
  ChevronDown, 
  Mic, 
  Square, 
  Play, 
  Trash2, 
  Save, 
  Share2,
  Film,
  ArrowUp,
  ArrowDown,
  Volume2,
  Check,
  AlertCircle,
  Download
} from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import './TimelineMovie.css';

gsap.registerPlugin(ScrollTrigger);

function TimelineMovie() {
  const containerRef = useRef(null);
  const itemsRef = useRef([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videos, setVideos] = useState([]);
  const [recordingVideoId, setRecordingVideoId] = useState(null);
  const [movieTitle, setMovieTitle] = useState('');
  const [totalDuration, setTotalDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
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
  }, [videos.length]);

  // 녹음 중에는 메모리 절약을 위해 모든 미리보기 영상 일시정지
  useEffect(() => {
    const allVideos = document.querySelectorAll('.video-thumb');
    if (recordingVideoId) {
      allVideos.forEach(v => v.pause());
    } else {
      allVideos.forEach(v => {
        try { v.play().catch(() => {}); } catch(e) {}
      });
    }
  }, [recordingVideoId]);

  const startRecording = async (videoId) => {
    if (!profile?.is_subscribed) {
      alert('목소리 녹음 기능은 프리미엄 전용입니다. 멤버십을 업그레이드 해주세요!');
      return;
    }

    try {
      // 1. 기존 스트림 정리 (가장 확실한 방법)
      if (window._currentStream) {
        window._currentStream.getTracks().forEach(t => t.stop());
        window._currentStream = null;
      }

      // 2. 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      window._currentStream = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        try {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setVideos(prev => prev.map(v => v.id === videoId ? { ...v, audioBlob: blob, audioUrl: url } : v));
        } catch (e) {
          console.error("Recording save failed:", e);
        } finally {
          setRecordingVideoId(null);
          // 스트림 종료
          stream.getTracks().forEach(t => t.stop());
        }
      };

      // 3. 상태 업데이트 및 시작
      setRecordingVideoId(videoId);
      mediaRecorder.start();
    } catch (err) {
      console.error('Recording start failed:', err);
      alert('녹음 시작에 실패했습니다: ' + err.message);
      setRecordingVideoId(null);
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error('Stop recording failed:', err);
      setRecordingVideoId(null);
    }
  };

  const removeAudio = (videoId) => {
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        if (v.audioUrl) URL.revokeObjectURL(v.audioUrl);
        return { ...v, audioBlob: null, audioUrl: null };
      }
      return v;
    }));
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setTimeout(async () => {
      setIsUploading(true);
      await new Promise(resolve => setTimeout(resolve, 200));

      const limitDuration = profile?.is_subscribed ? 600 : 15;
      try {
        let currentVideos = [...videos];
        let currentTotalDuration = totalDuration;

        for (const file of files) {
          const duration = await getVideoDuration(file);
          await new Promise(resolve => setTimeout(resolve, 50));

          if (currentTotalDuration + duration > limitDuration) {
            alert(`제한 시간(${limitDuration}초)을 초과한 영상(${file.name})은 제외되었습니다.`);
            continue;
          }

          currentVideos.push({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            duration,
            comment: '',
            audioBlob: null,
            audioUrl: null
          });
          currentTotalDuration += duration;
        }

        setVideos(currentVideos);
        setTotalDuration(currentTotalDuration);
      } catch (error) {
        console.error('Upload error:', error);
        alert('영상을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }, 500);
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const removeVideo = (id) => {
    const videoToRemove = videos.find(v => v.id === id);
    if (videoToRemove) {
      setTotalDuration(prev => prev - videoToRemove.duration);
      setVideos(prev => prev.filter(v => v.id !== id));
      if (videoToRemove.preview) URL.revokeObjectURL(videoToRemove.preview);
      if (videoToRemove.audioUrl) URL.revokeObjectURL(videoToRemove.audioUrl);
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
    setStatus('엔진 초기화 중...');

    try {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => console.log(message));
      ffmpeg.on('progress', ({ progress: p }) => {
        const totalSegments = videos.length + 1;
        const base = (currentIdx / totalSegments) * 100;
        const current = (p / totalSegments) * 100;
        setProgress(Math.min(Math.round(base + current), 99));
      });

      setStatus('엔진 데이터 로딩 중...');
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      // 폰트 준비
      try {
        const fontData = await fetchFile('/font.ttf');
        await ffmpeg.writeFile('font.ttf', fontData);
      } catch (e) { console.warn("Font failed:", e); }

      let currentIdx = 0;
      for (let i = 0; i < videos.length; i++) {
        currentIdx = i;
        const video = videos[i];
        const comment = video.comment || '';
        const escapedComment = comment.replace(/'/g, "").replace(/:/g, "\\:");
        
        setStatus(`${i + 1}번째 영상 가공 중...`);
        await ffmpeg.writeFile('in.mp4', await fetchFile(video.file));
        
        let filter = `[0:v]scale=480:854:force_original_aspect_ratio=decrease,pad=480:854:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=PTS-STARTPTS,fps=30${comment ? `,drawtext=fontfile=font.ttf:text='${escapedComment}':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=h-150:box=1:boxcolor=black@0.4:boxborderw=10` : ''}[v];`;
        const args = ['-i', 'in.mp4' ];
        
        if (video.audioBlob) {
          await ffmpeg.writeFile('au.webm', await fetchFile(video.audioBlob));
          args.push('-i', 'au.webm');
          filter += `[1:a]aresample=44100,asetpts=PTS-STARTPTS[a]`;
        } else {
          args.push('-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo:d=${video.duration}`);
          filter += `[1:a]aresample=44100,asetpts=PTS-STARTPTS[a]`;
        }

        await ffmpeg.exec([...args, '-filter_complex', filter, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', '-r', '30', '-vsync', 'cfr', '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-pix_fmt', 'yuv420p', 'seg.ts']);
        await ffmpeg.deleteFile('in.mp4');
        try { await ffmpeg.deleteFile('au.webm'); } catch(e) {}

        const files = await ffmpeg.listDir('/');
        if (files.some(f => f.name === 'main.ts')) {
          setStatus(`${i + 1}번째 조각 이어붙이는 중...`);
          await ffmpeg.writeFile('list.txt', "file 'main.ts'\nfile 'seg.ts'");
          await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'combined.ts']);
          await ffmpeg.deleteFile('main.ts'); await ffmpeg.deleteFile('seg.ts'); await ffmpeg.deleteFile('list.txt');
          await ffmpeg.rename('combined.ts', 'main.ts');
        } else {
          await ffmpeg.rename('seg.ts', 'main.ts');
        }
      }

      currentIdx = videos.length; 
      setStatus('최종 파일 생성 중...');
      await ffmpeg.exec(['-i', 'main.ts', '-c', 'copy', '-movflags', '+faststart', 'output.mp4']);
      await ffmpeg.deleteFile('main.ts');

      const data = await ffmpeg.readFile('output.mp4');
      const outBlob = new Blob([data.buffer], { type: 'video/mp4' });
      const storagePath = `${user.id}/movie_${Date.now()}.mp4`;
      
      setStatus('서버에 저장 중...');
      const { error: uploadError } = await supabase.storage.from('dearest_media').upload(`movies/${storagePath}`, outBlob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('dearest_media').getPublicUrl(`movies/${storagePath}`);
      await supabase.from('movies').insert({ user_id: user.id, video_url: publicUrl, title: movieTitle || '성장 기록 영상' });

      setProgress(100);
      alert('성장 영상이 제작되어 마이페이지에 저장되었습니다!');
      window.location.href = '/mypage';
    } catch (error) {
      console.error('Merge failed:', error);
      alert(`제작 실패: ${error.message}`);
    } finally {
      setIsExtracting(false); setProgress(0); setStatus('');
    }
  };

  return (
    <div className="timeline-container" ref={containerRef}>
      <input type="file" id="video-upload" multiple accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />

      {isUploading && (
        <div className="processing-overlay">
          <div className="processing-content">
            <Loader2 className="spinner" size={48} />
            <h2>영상을 불러오는 중입니다...</h2>
            <p>잠시만 기다려 주세요.</p>
          </div>
        </div>
      )}

      {isExtracting && (
        <div className="processing-overlay">
          <div className="processing-content">
            <Loader2 className="spinner" size={48} />
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: '15px 0' }}>{progress}% 완료</p>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary-peach)', marginBottom: '0.8rem' }}>영상을 제작하고 있습니다</h2>
            <p className="status-text" style={{ fontSize: '0.9rem', color: '#666' }}>{status}</p>
          </div>
        </div>
      )}

      <div className="timeline-header">
        <h1>성장 타임라인</h1>
        <p>아이의 소중한 순간들을 하나의 영화로 만들어보세요.</p>

        <div className="limit-info-section">
          <div className="limit-badge">
            현재 길이: <span className={totalDuration > (profile?.is_subscribed ? 600 : 15) ? 'over-limit' : ''}>
              {totalDuration.toFixed(1)}s
            </span> / {profile?.is_subscribed ? '600s' : '15s'}
          </div>
        </div>
      </div>

      <div className="video-upload-section glass-panel">
        <div className="timeline-line"></div>
        <label htmlFor="video-upload" className="upload-btn-wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="upload-icon-wrapper">
            <Plus size={48} color="var(--color-primary-peach)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.3rem' }}>여기를 클릭하여 영상 추가하기</p>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>영상을 추가하면 제목과 자막을 넣을 수 있습니다.</p>
          </div>
        </label>

        <div className="upload-warning-text" style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginTop: '1rem', padding: '0 1rem' }}>
          ⚠️ 여러 영상을 한꺼번에 업로드 시 영상 길이에 따라 소요시간이 걸릴 수 있습니다.<br/>
          💡 1분 이상의 긴 영상은 안정적인 환경(PC 등)에서 제작하시는 것을 추천합니다.
        </div>

        <div className="video-list">
          {videos.map((video, index) => (
            <div key={video.id} className="video-item" ref={el => itemsRef.current[index] = el}>
              <div className="video-index">{index + 1}</div>
              <div className="video-preview-box">
                <video 
                  src={video.preview} 
                  className="video-thumb" 
                  playsInline 
                  muted 
                  autoPlay
                  loop
                  preload="auto"
                />
                <div className="duration-tag">{video.duration.toFixed(1)}s</div>
                <div className="video-move-controls">
                  <div role="button" className={`icon-btn ${index === 0 ? 'disabled' : ''}`} style={{ pointerEvents: index === 0 ? 'none' : 'auto' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveVideo(index, -1); }}><ChevronUp size={14} /></div>
                  <div role="button" className={`icon-btn ${index === videos.length - 1 ? 'disabled' : ''}`} style={{ pointerEvents: index === videos.length - 1 ? 'none' : 'auto' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveVideo(index, 1); }}><ChevronDown size={14} /></div>
                </div>
              </div>
              <div className="video-info">
                <div className="video-name">{video.file.name}</div>
                <div className="comment-group" onClick={(e) => e.stopPropagation()}>
                  <label onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>💌 영상 자막</label>
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="자막 입력..."
                    value={video.comment}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    onChange={(e) => handleCommentChange(video.id, e.target.value)}
                  />
                </div>

                <div className="item-voice-control">
                  {recordingVideoId === video.id ? (
                    <div role="button" className="voice-btn recording" onClick={(e) => { e.preventDefault(); e.stopPropagation(); stopRecording(); }}>
                      <Square size={14} /> 녹음 중단
                    </div>
                  ) : video.audioUrl ? (
                    <div className="voice-added-group">
                      <audio src={video.audioUrl} controls className="mini-audio-item" />
                      <div role="button" className="voice-del-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeAudio(video.id); }}>삭제</div>
                    </div>
                  ) : (
                    <div role="button" className="voice-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); startRecording(video.id); }}>
                      <Mic size={14} /> 목소리 입히기
                    </div>
                  )}
                </div>
              </div>
              <div role="button" className="remove-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeVideo(video.id); }}><X size={20} /></div>
            </div>
          ))}
        </div>

        {videos.length > 0 && (
          <div className="merge-action-area glass-panel">
            <div className="title-input-section">
              <label>🎬 영화 제목</label>
              <input type="text" className="movie-title-input" placeholder="제목 입력..." value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)} />
            </div>
            <div
              role="button"
              className={`btn btn-primary extract-btn ${isExtracting ? 'disabled' : ''}`}
              style={{ pointerEvents: isExtracting ? 'none' : 'auto', cursor: isExtracting ? 'default' : 'pointer' }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isExtracting) extractVideo(); }}
            >
              {isExtracting ? (
                <div className="progress-status" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Loader2 className="spinner" size={24} />
                  <div className="progress-info">
                    <span className="progress-label">영화 제작 중... {progress}%</span>
                  </div>
                </div>
              ) : (
                <><Film size={18} /> 영화 만들기 & 다운로드</>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineMovie;
