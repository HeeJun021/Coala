/coala
├── backend/             # 백엔드 코드 (FastAPI)
│   ├── app/
│   │   ├── api/         # 라우터 및 API 엔드포인트
│   │   ├── core/        # 설정 및 공통 모듈
│   │   ├── models/      # 데이터베이스 모델
│   │   ├── services/    # 비즈니스 로직
│   │   ├── utils/       # 유틸리티 함수
│   │   └── tests/       # 테스트 코드
│   ├── Dockerfile       # 컨테이너 설정 파일
│   └── main.py          # FastAPI 실행 파일
│
├── frontend/            # 웹 프론트엔드 코드 (React.js + TailwindCSS)
│   ├── src/
│   │   ├── components/  # UI 컴포넌트
│   │   ├── pages/       # 각 페이지 컴포넌트
│   │   ├── api/         # API 호출 관련 코드
│   │   ├── hooks/       # 커스텀 훅
│   │   ├── store/       # 상태 관리
│   │   ├── App.js       # 메인 앱 파일
│   │   └── index.js     # 진입점
│   └── tailwind.config.js # TailwindCSS 설정 파일
│
├── ai/                  # AI 모델 및 API 연동 관련 코드 (PyTorch/Hugging Face)
│   ├── model/
│   │   ├── inference.py # 모델 추론 코드
│   │   ├── model.py     # AI 모델 로딩 및 처리
│   ├── data/            # 데이터 관련 파일
│   ├── configs/         # AI 모델 설정
│   └── scripts/         # 모델 학습 스크립트
│
└── README.md            # 프로젝트 설명 파일

모바일 제외한 기본적인 구조임