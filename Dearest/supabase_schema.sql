-- Dearest Application - Supabase Schema Guide

-- 1. Profiles Table (Extends Supabase Auth Auth.Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  is_subscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 자동 프로필 생성 트리거 (사용자 가입 시 자동 삽입)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin, is_approved, is_subscribed)
  VALUES (new.id, new.email, false, false, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 만약 이미 트리거가 있다면 삭제하고 다시 생성 (에러 방지)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. TimeCapsules Table
CREATE TABLE public.timecapsules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
  letter_text TEXT,
  photo_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Row Level Security) Policies for TimeCapsules
ALTER TABLE public.timecapsules ENABLE ROW LEVEL SECURITY;

-- 1) 사용자 본인만 자신의 타임캡슐을 조회할 수 있으며, 
-- 2) unlock_date가 현재 시간(now)보다 과거일 때만 데이터를 볼 수 있도록 강제하는 완벽한 보안 정책
CREATE POLICY "Users can view their unlocked timecapsules" 
ON public.timecapsules FOR SELECT 
USING (
  auth.uid() = user_id AND 
  now() >= unlock_date
);

-- 3) 타임캡슐 생성(Insert)은 본인만 가능
CREATE POLICY "Users can insert their own timecapsules" 
ON public.timecapsules FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Stories Table (보이스북)
CREATE TABLE public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text_content TEXT,
  photo_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for Stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stories" 
ON public.stories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories" 
ON public.stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Movies Table (병합된 영상 기록)
CREATE TABLE public.movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for Movies
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own movies" 
ON public.movies FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies" 
ON public.movies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Storage Bucket: 'dearest_media'
-- 오디오, 사진, 영상 등을 저장하는 버킷입니다.
-- (Supabase 대시보드 Storage 탭에서 생성 후 아래 정책 적용)

-- RLS for Storage (대시보드에서 설정 가능)
-- SELECT: 인증된 유저만 접근 가능
-- INSERT: 인증된 유저만 업로드 가능
