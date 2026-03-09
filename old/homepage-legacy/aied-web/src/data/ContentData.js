export const chaptersData = [
  {
    id: "text",
    title: "텍스트 생성 인공지능",
    description: "언어를 이해하고 자유롭게 텍스트를 생성하는 AI 기술의 원리와 활용",
    color: "#ec4899", // pink
    details: {
      principles: ["대규모 언어 모델(LLM)", "RNN, LSTM", "Transformer 아키텍처"],
      tools: ["ChatGPT", "Claude", "Gemini"],
      applications: ["글쓰기 보조", "기획 및 아이디어 발상", "문서 요약 및 번역"],
    },
    excerpt: "텍스트 생성 인공지능은 단순히 다음 단어를 예측하는 것을 넘어, 문맥을 이해하고 인간과 흡사한 수준의 글을 쓸 수 있는 능력을 갖추었습니다."
  },
  {
    id: "image",
    title: "이미지 생성 인공지능",
    description: "상상하는 바를 시각적 예술 작품이나 사진으로 구현하는 기술",
    color: "#8b5cf6", // violet
    details: {
      principles: ["컴퓨터 비전", "CNN, GAN, VAE", "Diffusion Models (확산 모델)"],
      tools: ["DALL-E", "Midjourney", "Stable Diffusion"],
      applications: ["디자인/일러스트 제작", "예술 창작", "패션 및 광고 이미지 생성"],
    },
    excerpt: "프롬프트 몇 줄로 전문가 수준의 그림이나 사진을 만들어낼 수 있는 시대가 도래했으며, 노이즈에서 의미를 찾아내는 확산 모델이 그 핵심입니다."
  },
  {
    id: "audio",
    title: "음성 및 음악 생성 인공지능",
    description: "텍스트를 자연스러운 음성으로, 감정을 담은 음악으로 변환하는 기술",
    color: "#3b82f6", // blue
    details: {
      principles: ["TTS & STT", "WaveNet", "음향 특성 딥러닝 모델링"],
      tools: ["Elevenlabs", "Vrew", "SUNO", "UIDO"],
      applications: ["오디오북/팟캐스트 제작", "영상 더빙", "음악 작곡 및 변주곡 생성"],
    },
    excerpt: "기계적인 목소리를 넘어 감정이 담긴 음성 합성과 텍스트 프롬프트만으로 다채로운 장르의 음악을 작곡할 수 있는 수준에 이르렀습니다."
  },
  {
    id: "video",
    title: "영상 및 멀티미디어 생성 인공지능",
    description: "현실과 디지털 세계를 넘나드는 동적 비주얼 텔링",
    color: "#10b981", // emerald
    details: {
      principles: ["Latent Diffusion", "Diffusion Transformers (DiT)", "Patch System"],
      tools: ["OpenAI Sora", "Runway Gen-2/Gen-3", "Luma Dream Machine"],
      applications: ["텍스트/이미지 기반 비디오 생성", "영화/광고 제작 자동화", "게임 내 AI NPC (스마트 에이전트)"],
    },
    excerpt: "시간적 연속성과 물리적 법칙까지 학습하여 텍스트만으로 뛰어난 품질의 동영상을 생성하거나, 살아 숨쉬는 NPC를 구현해 새로운 미디어 경험을 제공합니다."
  },
  {
    id: "code",
    title: "코드 생성 인공지능",
    description: "인간의 언어를 컴퓨터의 언어로 통역해주는 코딩 파트너",
    color: "#f59e0b", // amber
    details: {
      principles: ["코드 최적화 알고리즘", "방대한 오픈소스 학습 기반 로직 이해"],
      tools: ["GitHub Copilot", "ChatGPT", "Claude Artifacts"],
      applications: ["웹/앱 개발 보조", "코드 리팩토링 및 디버깅", "프로그래밍 논리 학습"],
    },
    excerpt: "프로그래머의 의도를 파악하여 코드를 자동 완성해주거나 오류를 수정해주며, 코딩의 진입 장벽을 대폭 낮추고 개발 생산성을 극대화합니다."
  },
  {
    id: "ethics",
    title: "생성형 AI의 윤리적 이슈",
    description: "인공지능 시대를 살아가기 위해 반드시 고민해야 할 가치들",
    color: "#ef4444", // red
    details: {
      principles: ["할루시네이션(그럴듯한 거짓말) 완화 (RAG)", "설명 가능한 AI (XAI)", "저작권 포이즈닝 (Nightshade)"],
      tools: ["AI 검출기", "딥페이크 방어 기술", "워터마크 시스템"],
      applications: ["윤리적 가이드라인 제정", "딥페이크/페이크 뉴스 방어", "인간-AI 협업 모델 모색"],
    },
    excerpt: "할루시네이션, 저작권 침해, 딥페이크, 직업 대체 등 AI가 가져올 수 있는 부작용을 이해하고, 기술의 안전하고 가치 있는 사용을 제고해야 합니다."
  }
];
