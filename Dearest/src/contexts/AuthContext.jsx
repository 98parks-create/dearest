import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 로그인된 유저 세션 가져오기
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } catch (error) {
        console.error('Supabase Session Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (!data && !error) {
        // Profile not found, let's create it silently
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: newProfile } = await supabase.from('profiles').upsert({
            id: userId,
            email: currentUser.email,
            is_admin: false,
            is_approved: true,
            is_subscribed: false
          }).select().maybeSingle();
          
          if (newProfile) {
            setProfile(newProfile);
          }
        }
        return;
      }
      
      if (error) {
        console.warn('Profile fetch note:', error.message);
        return;
      }
      
      if (data) {
        let profileData = data;
        
        // 구독 만료 여부 확인
        if (data.is_subscribed && data.subscribed_until) {
          const now = new Date();
          const expiry = new Date(data.subscribed_until);
          
          if (now > expiry) {
            // 만료됨 -> DB 업데이트 및 로컬 데이터 수정
            await supabase
              .from('profiles')
              .update({ is_subscribed: false, subscribed_until: null })
              .eq('id', userId);
            
            profileData = { ...data, is_subscribed: false, subscribed_until: null };
            console.log('Subscription expired for user:', userId);
          }
        }
        
        setProfile(profileData);
      }
    } catch (err) {
      console.warn('Error fetching profile:', err.message);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await fetchProfile(data.user.id);
    return { data, error: null };
  };

  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Note: trigger will create profile in DB, fetch it
    if (data.user) {
       // Wait a moment for trigger to complete, then fetch
       setTimeout(() => fetchProfile(data.user.id), 1000);
    }
    return { data, error: null };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase Logout Error:', error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfileState = (newFields) => {
    setProfile(prev => ({ ...prev, ...newFields }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout, loading, updateProfileState }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
