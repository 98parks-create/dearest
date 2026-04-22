import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Gift, Film, Loader2, PlayCircle, Image as ImageIcon, Share2 } from 'lucide-react';
import './MyPage.css';

function MyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('storybook');
  const [stories, setStories] = useState([]);
  const [timecapsules, setTimecapsules] = useState([]);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch Stories
        const { data: storiesData } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (storiesData) setStories(storiesData);

        // Fetch Timecapsules
        const { data: capsuleData } = await supabase
          .from('timecapsules')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (capsuleData) setTimecapsules(capsuleData);

        // Fetch Movies
        const { data: moviesData } = await supabase
          .from('movies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (moviesData) setMovies(moviesData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleShare = async (videoUrl, title) => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const fileName = `${title || 'baby_movie'}.mp4`;
      const file = new File([blob], fileName, { type: 'video/mp4' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || '성장 기록 영상',
          text: 'Dearest에서 제작한 우리 아이 성장 영상입니다.',
        });
      } else {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = fileName;
        a.click();
      }
    } catch (error) {
      console.error("Share failed:", error);
      alert("공유하기를 실행할 수 없습니다. (브라우저 설정을 확인해주세요)");
    } finally {
      setIsSharing(false);
    }
  };

  const renderStorybooks = () => {
    // ... 기존 renderStorybooks ...
  };

  const renderTimecapsules = () => {
    // ... 기존 renderTimecapsules ...
  };

  const renderVideos = () => {
    if (movies.length === 0) {
      return (
        <div className="empty-state video-info">
          <Film size={48} style={{ color: 'var(--color-primary-peach)', marginBottom: '1rem' }} />
          <h3>성장 영상 병합 보관소</h3>
          <p>아직 저장된 성장 영상이 없습니다.</p>
          <p>영상 병합 기능을 사용하여 우리 아이의 소중한 순간들을 하나의 영화로 만들어보세요!</p>
        </div>
      );
    }

    return (
      <div className="grid-container">
        {movies.map((movie) => (
          <div key={movie.id} className="memory-card movie-card glass-panel">
            <div className="card-header">
              <span className="date-badge">{new Date(movie.created_at).toLocaleDateString()}</span>
            </div>
            <div className="card-media movie-media">
              <video 
                src={movie.video_url} 
                className="card-video" 
                controls 
                crossOrigin="anonymous"
              />
            </div>
            <div className="card-content">
              <p className="card-text" style={{fontWeight: 'bold', marginBottom: '1rem'}}>{movie.title || '성장 기록 영상'}</p>
              <div className="movie-actions" style={{display: 'flex', gap: '8px'}}>
                <div 
                  role="button" 
                  className="btn btn-primary share-btn" 
                  style={{flex: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}
                  onClick={() => handleShare(movie.video_url, movie.title)}
                >
                  {isSharing ? <Loader2 className="spinner" size={16} /> : <><Share2 size={16} /> 공유/저장</>}
                </div>
                <a 
                  href={movie.video_url} 
                  download 
                  className="btn btn-secondary" 
                  style={{flex: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}
                >
                  다운로드
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="mypage-container"><div className="loading-wrapper"><Loader2 className="spinner" size={48} color="var(--color-primary-peach)" /></div></div>;
  }

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h2>마이 아카이브 📚</h2>
        <p>지금까지 차곡차곡 모아온 우리 아이와의 소중한 기록들입니다.</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'storybook' ? 'active' : ''}`}
          onClick={() => setActiveTab('storybook')}
        >
          <BookOpen size={18} /> 보이스북
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timecapsule' ? 'active' : ''}`}
          onClick={() => setActiveTab('timecapsule')}
        >
          <Gift size={18} /> 타임캡슐
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Film size={18} /> 성장 영상
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'storybook' && renderStorybooks()}
        {activeTab === 'timecapsule' && renderTimecapsules()}
        {activeTab === 'timeline' && renderVideos()}
      </div>
    </div>
  );
}

export default MyPage;
