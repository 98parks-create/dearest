# Dearest - 커플 다이어리 PWA

연인과 함께하는 소중한 순간을 기록하고 공유하는 커플 전용 메모리 앱입니다.
사진, 텍스트, 음성을 조합한 스토리북과 타임캡슐, 타임라인 영상 기능을 제공합니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| **Storybook** | 사진 + 텍스트 + 음성 녹음을 조합한 공동 다이어리 |
| **Time Capsule** | 미래의 우리에게 보내는 타임캡슐 메시지 |
| **Timeline Movie** | 추억 사진들을 엮은 자동 슬라이드쇼 영상 |
| **My Page** | 프로필 관리 및 기념일/D-Day 확인 |
| **Secret Gate** | 초대 코드 기반 커플 연결 |
| **Subscription** | 프리미엄 구독 관리 |

## 기술 스택

- **Frontend**: React (Vite), JavaScript
- **Animation**: GSAP + ScrollTrigger
- **Backend/DB**: Supabase (PostgreSQL + Storage)
- **PWA**: Service Worker 지원, 홈 화면 설치 가능
- **배포**: Vercel

## 설치 및 실행

`ash
cd Dearest
npm install
npm run dev
`ash

환경 변수 설정 (.env):

`	ext
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
`	ext
