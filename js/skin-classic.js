// ===== classic 스킨 — 전통 체스 기물 실루엣 =====
SKINS.classic = {
  // 백 킹 — 십자가 + 테이퍼 몸체 + 넓은 받침
  wK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="7" fill="#8B7355" opacity="0.25"/>
      <rect x="22" y="78" width="56" height="7" rx="2" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M26 78 L32 68 L68 68 L74 78 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <rect x="32" y="62" width="36" height="6" rx="2" fill="#FFFDF5" stroke="#8B7355" stroke-width="2"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 62 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 50 Q50 44 36 50 Z" fill="#FFFDF5" opacity="0.5"/>
      <ellipse cx="50" cy="32" rx="14" ry="4" fill="#FFFDF5" stroke="#8B7355" stroke-width="2"/>
      <rect x="47" y="12" width="6" height="20" rx="3" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <rect x="40" y="16" width="20" height="6" rx="3" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
    </svg>`;
  },
  // 백 퀸 — 5개 뾰족 왕관 + 테이퍼 몸체
  wQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="7" fill="#8B7355" opacity="0.25"/>
      <rect x="22" y="78" width="56" height="7" rx="2" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M26 78 L32 68 L68 68 L74 78 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <rect x="32" y="62" width="36" height="6" rx="2" fill="#FFFDF5" stroke="#8B7355" stroke-width="2"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 62 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 50 Q50 44 36 50 Z" fill="#FFFDF5" opacity="0.5"/>
      <path d="M34 36 L20 14 L34 28 L42 10 L48 28 L50 10 L52 28 L58 10 L66 28 L80 14 L66 36 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <circle cx="20" cy="13" r="3.5" fill="#FFFDF5" stroke="#8B7355" stroke-width="1.5"/>
      <circle cx="42" cy="9" r="3.5" fill="#FFFDF5" stroke="#8B7355" stroke-width="1.5"/>
      <circle cx="50" cy="9" r="3.5" fill="#FFFDF5" stroke="#8B7355" stroke-width="1.5"/>
      <circle cx="58" cy="9" r="3.5" fill="#FFFDF5" stroke="#8B7355" stroke-width="1.5"/>
      <circle cx="80" cy="13" r="3.5" fill="#FFFDF5" stroke="#8B7355" stroke-width="1.5"/>
    </svg>`;
  },
  // 백 룩 — 3개 흉벽 + 직사각 몸체
  wR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="7" fill="#8B7355" opacity="0.25"/>
      <rect x="24" y="78" width="52" height="7" rx="2" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M28 78 L32 68 L68 68 L72 78 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <rect x="32" y="38" width="36" height="30" rx="1" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
      <path d="M32 38 L68 38 L68 52 Q50 45 32 52 Z" fill="#FFFDF5" opacity="0.5"/>
      <rect x="30" y="36" width="40" height="6" rx="2" fill="#FFFDF5" stroke="#8B7355" stroke-width="2"/>
      <path d="M26 36 L26 18 L36 18 L36 26 L44 26 L44 18 L56 18 L56 26 L64 26 L64 18 L74 18 L74 36 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
    </svg>`;
  },
  // 백 비숍 — 주교관 + 대각선 슬릿
  wB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="26" ry="7" fill="#8B7355" opacity="0.25"/>
      <rect x="26" y="78" width="48" height="7" rx="2" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M30 78 L36 68 L64 68 L70 78 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <rect x="36" y="62" width="28" height="6" rx="2" fill="#FFFDF5" stroke="#8B7355" stroke-width="2"/>
      <path d="M40 62 L42 42 Q42 34 50 30 Q58 34 58 42 L60 62 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
      <path d="M40 62 L42 42 Q42 34 50 30 Q58 34 58 42 L60 50 Q50 44 40 50 Z" fill="#FFFDF5" opacity="0.5"/>
      <path d="M50 30 Q44 22 46 14 Q48 8 50 10 Q52 8 54 14 Q56 22 50 30 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <circle cx="50" cy="10" r="4" fill="#FFFDF5" stroke="#8B7355" stroke-width="2"/>
      <line x1="46" y1="38" x2="54" y2="28" stroke="#8B7355" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  },
  // 백 나이트 — 말 머리 프로필
  wN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="7" fill="#8B7355" opacity="0.25"/>
      <rect x="24" y="78" width="52" height="7" rx="2" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M28 78 L32 68 L68 68 L72 78 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M32 68 L32 50 Q32 42 38 38 L38 28 Q36 18 42 12 Q46 8 50 10 L56 14 Q65 20 68 30 L68 38 Q72 42 72 50 L72 68 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
      <path d="M32 68 L32 50 Q32 42 38 38 L38 28 Q36 18 42 12 Q46 8 50 10 L56 14 Q65 20 68 30 L68 38 Q72 42 72 50 L72 55 Q52 48 32 55 Z" fill="#FFFDF5" opacity="0.5"/>
      <path d="M38 28 L30 18 Q28 15 32 14 L40 16 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M38 34 L28 38 Q26 39 28 40 L38 38 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="1.5"/>
      <circle cx="44" cy="24" r="3" fill="#8B7355"/>
    </svg>`;
  },
  // 백 폰 — 둥근 머리 + 벨 몸체
  wP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="24" ry="7" fill="#8B7355" opacity="0.25"/>
      <rect x="28" y="78" width="44" height="7" rx="2" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M32 78 L38 68 L62 68 L68 78 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2"/>
      <path d="M38 68 L42 48 Q42 42 50 42 Q58 42 58 48 L62 68 Z" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
      <path d="M38 68 L42 48 Q42 42 50 42 Q58 42 58 48 L62 56 Q50 50 38 56 Z" fill="#FFFDF5" opacity="0.5"/>
      <circle cx="50" cy="30" r="14" fill="#F5F0E1" stroke="#8B7355" stroke-width="2.5"/>
      <circle cx="50" cy="28" r="9" fill="#FFFDF5" opacity="0.5"/>
    </svg>`;
  },
  // 흑 킹 — 십자가 + 테이퍼 몸체 + 넓은 받침
  bK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="7" fill="#111111" opacity="0.3"/>
      <rect x="22" y="78" width="56" height="7" rx="2" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M26 78 L32 68 L68 68 L74 78 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <rect x="32" y="62" width="36" height="6" rx="2" fill="#4A4A4A" stroke="#111111" stroke-width="2"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 62 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 50 Q50 44 36 50 Z" fill="#4A4A4A" opacity="0.5"/>
      <ellipse cx="50" cy="32" rx="14" ry="4" fill="#4A4A4A" stroke="#111111" stroke-width="2"/>
      <rect x="47" y="12" width="6" height="20" rx="3" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <rect x="40" y="16" width="20" height="6" rx="3" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
    </svg>`;
  },
  // 흑 퀸 — 5개 뾰족 왕관 + 테이퍼 몸체
  bQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="7" fill="#111111" opacity="0.3"/>
      <rect x="22" y="78" width="56" height="7" rx="2" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M26 78 L32 68 L68 68 L74 78 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <rect x="32" y="62" width="36" height="6" rx="2" fill="#4A4A4A" stroke="#111111" stroke-width="2"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 62 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
      <path d="M36 62 L38 38 Q38 32 50 32 Q62 32 62 38 L64 50 Q50 44 36 50 Z" fill="#4A4A4A" opacity="0.5"/>
      <path d="M34 36 L20 14 L34 28 L42 10 L48 28 L50 10 L52 28 L58 10 L66 28 L80 14 L66 36 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <circle cx="20" cy="13" r="3.5" fill="#4A4A4A" stroke="#111111" stroke-width="1.5"/>
      <circle cx="42" cy="9" r="3.5" fill="#4A4A4A" stroke="#111111" stroke-width="1.5"/>
      <circle cx="50" cy="9" r="3.5" fill="#4A4A4A" stroke="#111111" stroke-width="1.5"/>
      <circle cx="58" cy="9" r="3.5" fill="#4A4A4A" stroke="#111111" stroke-width="1.5"/>
      <circle cx="80" cy="13" r="3.5" fill="#4A4A4A" stroke="#111111" stroke-width="1.5"/>
    </svg>`;
  },
  // 흑 룩 — 3개 흉벽 + 직사각 몸체
  bR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="7" fill="#111111" opacity="0.3"/>
      <rect x="24" y="78" width="52" height="7" rx="2" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M28 78 L32 68 L68 68 L72 78 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <rect x="32" y="38" width="36" height="30" rx="1" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
      <path d="M32 38 L68 38 L68 52 Q50 45 32 52 Z" fill="#4A4A4A" opacity="0.5"/>
      <rect x="30" y="36" width="40" height="6" rx="2" fill="#4A4A4A" stroke="#111111" stroke-width="2"/>
      <path d="M26 36 L26 18 L36 18 L36 26 L44 26 L44 18 L56 18 L56 26 L64 26 L64 18 L74 18 L74 36 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
    </svg>`;
  },
  // 흑 비숍 — 주교관 + 대각선 슬릿
  bB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="26" ry="7" fill="#111111" opacity="0.3"/>
      <rect x="26" y="78" width="48" height="7" rx="2" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M30 78 L36 68 L64 68 L70 78 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <rect x="36" y="62" width="28" height="6" rx="2" fill="#4A4A4A" stroke="#111111" stroke-width="2"/>
      <path d="M40 62 L42 42 Q42 34 50 30 Q58 34 58 42 L60 62 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
      <path d="M40 62 L42 42 Q42 34 50 30 Q58 34 58 42 L60 50 Q50 44 40 50 Z" fill="#4A4A4A" opacity="0.5"/>
      <path d="M50 30 Q44 22 46 14 Q48 8 50 10 Q52 8 54 14 Q56 22 50 30 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <circle cx="50" cy="10" r="4" fill="#4A4A4A" stroke="#111111" stroke-width="2"/>
      <line x1="46" y1="38" x2="54" y2="28" stroke="#111111" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  },
  // 흑 나이트 — 말 머리 프로필
  bN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="7" fill="#111111" opacity="0.3"/>
      <rect x="24" y="78" width="52" height="7" rx="2" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M28 78 L32 68 L68 68 L72 78 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M32 68 L32 50 Q32 42 38 38 L38 28 Q36 18 42 12 Q46 8 50 10 L56 14 Q65 20 68 30 L68 38 Q72 42 72 50 L72 68 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
      <path d="M32 68 L32 50 Q32 42 38 38 L38 28 Q36 18 42 12 Q46 8 50 10 L56 14 Q65 20 68 30 L68 38 Q72 42 72 50 L72 55 Q52 48 32 55 Z" fill="#4A4A4A" opacity="0.5"/>
      <path d="M38 28 L30 18 Q28 15 32 14 L40 16 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M38 34 L28 38 Q26 39 28 40 L38 38 Z" fill="#2D2D2D" stroke="#111111" stroke-width="1.5"/>
      <circle cx="44" cy="24" r="3" fill="#111111"/>
    </svg>`;
  },
  // 흑 폰 — 둥근 머리 + 벨 몸체
  bP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="24" ry="7" fill="#111111" opacity="0.3"/>
      <rect x="28" y="78" width="44" height="7" rx="2" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M32 78 L38 68 L62 68 L68 78 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2"/>
      <path d="M38 68 L42 48 Q42 42 50 42 Q58 42 58 48 L62 68 Z" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
      <path d="M38 68 L42 48 Q42 42 50 42 Q58 42 58 48 L62 56 Q50 50 38 56 Z" fill="#4A4A4A" opacity="0.5"/>
      <circle cx="50" cy="30" r="14" fill="#2D2D2D" stroke="#111111" stroke-width="2.5"/>
      <circle cx="50" cy="28" r="9" fill="#4A4A4A" opacity="0.5"/>
    </svg>`;
  }
};
