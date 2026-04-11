// ===== hellocarbot 스킨 — 로봇/메카 테마 =====
// 백(나): 블루 계열 — 주색 #4FC3F7, 진한 #0277BD, 밝은 #E1F5FE
// 흑(적): 레드 계열 — 주색 #EF5350, 진한 #B71C1C, 밝은 #FFCDD2
SKINS.hellocarbot = {
  // 백 킹 — 커맨더 로봇: 넓은 어깨, V자 안테나, 가슴 엠블럼
  wK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="28" ry="6" fill="#0277BD" opacity="0.25"/>
      <rect x="30" y="58" width="40" height="30" rx="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="30" y="58" width="40" height="14" rx="4" fill="#E1F5FE" opacity="0.5"/>
      <rect x="22" y="60" width="10" height="18" rx="3" fill="#4FC3F7" stroke="#0277BD" stroke-width="2"/>
      <rect x="68" y="60" width="10" height="18" rx="3" fill="#4FC3F7" stroke="#0277BD" stroke-width="2"/>
      <rect x="36" y="70" width="28" height="10" rx="2" fill="#0277BD" opacity="0.3"/>
      <polygon points="50,68 44,76 56,76" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="34" y="38" width="32" height="22" rx="6" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="34" y="38" width="32" height="10" rx="6" fill="#E1F5FE" opacity="0.4"/>
      <rect x="38" y="46" width="24" height="8" rx="3" fill="#0D47A1"/>
      <rect x="40" y="48" width="8" height="4" rx="1" fill="#4FC3F7"/>
      <rect x="52" y="48" width="8" height="4" rx="1" fill="#4FC3F7"/>
      <path d="M38 38 L32 28 L36 28 L40 36 Z" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <path d="M62 38 L68 28 L64 28 L60 36 Z" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <circle cx="32" cy="26" r="3" fill="#FFD93D"/>
      <circle cx="68" cy="26" r="3" fill="#FFD93D"/>
      <rect x="48" y="56" width="4" height="4" rx="1" fill="#0277BD"/>
    </svg>`;
  },
  // 백 퀸 — 날개 로봇: 슬림 바디, 날개형 어깨, 이마 보석
  wQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="26" ry="6" fill="#0277BD" opacity="0.25"/>
      <rect x="34" y="56" width="32" height="30" rx="5" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="14" rx="5" fill="#E1F5FE" opacity="0.5"/>
      <path d="M34 62 L18 54 L20 68 L34 72 Z" fill="#4FC3F7" stroke="#0277BD" stroke-width="2"/>
      <path d="M66 62 L82 54 L80 68 L66 72 Z" fill="#4FC3F7" stroke="#0277BD" stroke-width="2"/>
      <path d="M34 62 L18 54 L20 60 L34 66 Z" fill="#E1F5FE" opacity="0.4"/>
      <path d="M66 62 L82 54 L80 60 L66 66 Z" fill="#E1F5FE" opacity="0.4"/>
      <rect x="36" y="38" width="28" height="20" rx="6" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="36" y="38" width="28" height="9" rx="6" fill="#E1F5FE" opacity="0.4"/>
      <rect x="40" y="46" width="20" height="7" rx="3" fill="#0D47A1"/>
      <rect x="42" y="48" width="6" height="3" rx="1" fill="#4FC3F7"/>
      <rect x="52" y="48" width="6" height="3" rx="1" fill="#4FC3F7"/>
      <circle cx="50" cy="36" r="4" fill="#E040FB" stroke="#0277BD" stroke-width="1.5"/>
      <circle cx="50" cy="36" r="2" fill="#F8BBD0"/>
      <rect x="48" y="56" width="4" height="3" rx="1" fill="#0277BD"/>
    </svg>`;
  },
  // 백 룩 — 탱크봇: 박스형 바디, 포탑, 캐터필러
  wR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="30" ry="6" fill="#0277BD" opacity="0.25"/>
      <rect x="22" y="72" width="56" height="14" rx="4" fill="#0277BD" stroke="#01579B" stroke-width="2"/>
      <circle cx="30" cy="80" r="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <circle cx="42" cy="80" r="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <circle cx="58" cy="80" r="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <circle cx="70" cy="80" r="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <rect x="26" y="44" width="48" height="30" rx="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="26" y="44" width="48" height="14" rx="4" fill="#E1F5FE" opacity="0.5"/>
      <rect x="32" y="54" width="36" height="10" rx="3" fill="#0D47A1"/>
      <rect x="35" y="56" width="12" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="53" y="56" width="12" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="40" y="28" width="20" height="18" rx="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="2"/>
      <rect x="40" y="28" width="20" height="8" rx="4" fill="#E1F5FE" opacity="0.4"/>
      <rect x="55" y="34" width="20" height="5" rx="2" fill="#0277BD" stroke="#01579B" stroke-width="1.5"/>
      <circle cx="75" cy="36" r="3" fill="#FFD93D"/>
    </svg>`;
  },
  // 백 비숍 — 스카우트봇: 뾰족 헬멧, 슬림, 단안 바이저
  wB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="24" ry="6" fill="#0277BD" opacity="0.25"/>
      <rect x="34" y="56" width="32" height="30" rx="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="14" rx="4" fill="#E1F5FE" opacity="0.5"/>
      <rect x="38" y="70" width="24" height="8" rx="2" fill="#0277BD" opacity="0.3"/>
      <rect x="36" y="40" width="28" height="18" rx="5" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="36" y="40" width="28" height="8" rx="5" fill="#E1F5FE" opacity="0.4"/>
      <rect x="38" y="46" width="24" height="7" rx="3" fill="#0D47A1"/>
      <rect x="42" y="48" width="16" height="3" rx="1" fill="#00E676"/>
      <path d="M50 40 L44 24 L50 12 L56 24 Z" fill="#4FC3F7" stroke="#0277BD" stroke-width="2"/>
      <path d="M50 40 L47 30 L50 20 L53 30 Z" fill="#E1F5FE" opacity="0.5"/>
      <circle cx="50" cy="12" r="3" fill="#00E676"/>
      <rect x="48" y="56" width="4" height="3" rx="1" fill="#0277BD"/>
    </svg>`;
  },
  // 백 나이트 — 말 메카: 각진 말 머리, 기계 관절, 귀 안테나
  wN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="26" ry="6" fill="#0277BD" opacity="0.25"/>
      <rect x="30" y="58" width="40" height="28" rx="4" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="30" y="58" width="40" height="12" rx="4" fill="#E1F5FE" opacity="0.5"/>
      <rect x="36" y="72" width="28" height="8" rx="2" fill="#0277BD" opacity="0.3"/>
      <path d="M30 58 L30 42 Q30 36 36 34 L36 26 Q34 16 40 12 L52 10 Q60 12 62 20 L64 28 Q68 32 68 38 L68 58 Z" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <path d="M30 58 L30 42 Q30 36 36 34 L36 26 Q34 16 40 12 L52 10 Q60 12 62 20 L64 28 Q68 32 68 38 L68 46 Q50 40 30 46 Z" fill="#E1F5FE" opacity="0.4"/>
      <rect x="48" y="28" width="14" height="6" rx="2" fill="#0D47A1"/>
      <rect x="50" y="30" width="10" height="2" rx="1" fill="#4FC3F7"/>
      <path d="M36 26 L28 14 L32 12 L38 22 Z" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <circle cx="28" cy="12" r="3" fill="#FFD93D"/>
      <rect x="36" y="38" width="10" height="4" rx="1" fill="#0D47A1"/>
      <path d="M36 44 Q42 48 50 44" stroke="#0277BD" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="44" cy="52" r="3" fill="#0D47A1"/>
      <circle cx="56" cy="52" r="3" fill="#0D47A1"/>
    </svg>`;
  },
  // 백 폰 — 미니봇: 둥근 머리, 단일 안테나, 컴팩트 바디
  wP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="22" ry="6" fill="#0277BD" opacity="0.25"/>
      <rect x="34" y="58" width="32" height="28" rx="5" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <rect x="34" y="58" width="32" height="12" rx="5" fill="#E1F5FE" opacity="0.5"/>
      <rect x="38" y="72" width="24" height="8" rx="2" fill="#0277BD" opacity="0.3"/>
      <circle cx="50" cy="40" r="18" fill="#4FC3F7" stroke="#0277BD" stroke-width="2.5"/>
      <circle cx="50" cy="38" r="13" fill="#E1F5FE" opacity="0.4"/>
      <rect x="38" y="38" width="24" height="8" rx="3" fill="#0D47A1"/>
      <rect x="40" y="40" width="8" height="4" rx="1" fill="#4FC3F7"/>
      <rect x="52" y="40" width="8" height="4" rx="1" fill="#4FC3F7"/>
      <rect x="48" y="18" width="4" height="10" rx="2" fill="#4FC3F7" stroke="#0277BD" stroke-width="1.5"/>
      <circle cx="50" cy="16" r="3.5" fill="#FFD93D" stroke="#0277BD" stroke-width="1"/>
      <rect x="48" y="56" width="4" height="4" rx="1" fill="#0277BD"/>
    </svg>`;
  },
  // 흑 킹 — 커맨더 로봇 (레드)
  bK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="28" ry="6" fill="#B71C1C" opacity="0.25"/>
      <rect x="30" y="58" width="40" height="30" rx="4" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="30" y="58" width="40" height="14" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <rect x="22" y="60" width="10" height="18" rx="3" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <rect x="68" y="60" width="10" height="18" rx="3" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <rect x="36" y="70" width="28" height="10" rx="2" fill="#B71C1C" opacity="0.3"/>
      <polygon points="50,68 44,76 56,76" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="34" y="38" width="32" height="22" rx="6" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="34" y="38" width="32" height="10" rx="6" fill="#FFCDD2" opacity="0.4"/>
      <rect x="38" y="46" width="24" height="8" rx="3" fill="#7F0000"/>
      <rect x="40" y="48" width="8" height="4" rx="1" fill="#EF5350"/>
      <rect x="52" y="48" width="8" height="4" rx="1" fill="#EF5350"/>
      <path d="M38 38 L32 28 L36 28 L40 36 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <path d="M62 38 L68 28 L64 28 L60 36 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="32" cy="26" r="3" fill="#FFD93D"/>
      <circle cx="68" cy="26" r="3" fill="#FFD93D"/>
      <rect x="48" y="56" width="4" height="4" rx="1" fill="#B71C1C"/>
    </svg>`;
  },
  // 흑 퀸 — 날개 로봇 (레드)
  bQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="26" ry="6" fill="#B71C1C" opacity="0.25"/>
      <rect x="34" y="56" width="32" height="30" rx="5" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="14" rx="5" fill="#FFCDD2" opacity="0.5"/>
      <path d="M34 62 L18 54 L20 68 L34 72 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <path d="M66 62 L82 54 L80 68 L66 72 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <path d="M34 62 L18 54 L20 60 L34 66 Z" fill="#FFCDD2" opacity="0.4"/>
      <path d="M66 62 L82 54 L80 60 L66 66 Z" fill="#FFCDD2" opacity="0.4"/>
      <rect x="36" y="38" width="28" height="20" rx="6" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="36" y="38" width="28" height="9" rx="6" fill="#FFCDD2" opacity="0.4"/>
      <rect x="40" y="46" width="20" height="7" rx="3" fill="#7F0000"/>
      <rect x="42" y="48" width="6" height="3" rx="1" fill="#EF5350"/>
      <rect x="52" y="48" width="6" height="3" rx="1" fill="#EF5350"/>
      <circle cx="50" cy="36" r="4" fill="#E040FB" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="50" cy="36" r="2" fill="#F8BBD0"/>
      <rect x="48" y="56" width="4" height="3" rx="1" fill="#B71C1C"/>
    </svg>`;
  },
  // 흑 룩 — 탱크봇 (레드)
  bR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="30" ry="6" fill="#B71C1C" opacity="0.25"/>
      <rect x="22" y="72" width="56" height="14" rx="4" fill="#B71C1C" stroke="#7F0000" stroke-width="2"/>
      <circle cx="30" cy="80" r="4" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="42" cy="80" r="4" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="58" cy="80" r="4" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="70" cy="80" r="4" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <rect x="26" y="44" width="48" height="30" rx="4" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="26" y="44" width="48" height="14" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <rect x="32" y="54" width="36" height="10" rx="3" fill="#7F0000"/>
      <rect x="35" y="56" width="12" height="6" rx="2" fill="#EF5350"/>
      <rect x="53" y="56" width="12" height="6" rx="2" fill="#EF5350"/>
      <rect x="40" y="28" width="20" height="18" rx="4" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <rect x="40" y="28" width="20" height="8" rx="4" fill="#FFCDD2" opacity="0.4"/>
      <rect x="55" y="34" width="20" height="5" rx="2" fill="#B71C1C" stroke="#7F0000" stroke-width="1.5"/>
      <circle cx="75" cy="36" r="3" fill="#FFD93D"/>
    </svg>`;
  },
  // 흑 비숍 — 스카우트봇 (레드)
  bB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="24" ry="6" fill="#B71C1C" opacity="0.25"/>
      <rect x="34" y="56" width="32" height="30" rx="4" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="14" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <rect x="38" y="70" width="24" height="8" rx="2" fill="#B71C1C" opacity="0.3"/>
      <rect x="36" y="40" width="28" height="18" rx="5" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="36" y="40" width="28" height="8" rx="5" fill="#FFCDD2" opacity="0.4"/>
      <rect x="38" y="46" width="24" height="7" rx="3" fill="#7F0000"/>
      <rect x="42" y="48" width="16" height="3" rx="1" fill="#FFD93D"/>
      <path d="M50 40 L44 24 L50 12 L56 24 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <path d="M50 40 L47 30 L50 20 L53 30 Z" fill="#FFCDD2" opacity="0.5"/>
      <circle cx="50" cy="12" r="3" fill="#FFD93D"/>
      <rect x="48" y="56" width="4" height="3" rx="1" fill="#B71C1C"/>
    </svg>`;
  },
  // 흑 나이트 — 말 메카 (레드)
  bN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="26" ry="6" fill="#B71C1C" opacity="0.25"/>
      <rect x="30" y="58" width="40" height="28" rx="4" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="30" y="58" width="40" height="12" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <rect x="36" y="72" width="28" height="8" rx="2" fill="#B71C1C" opacity="0.3"/>
      <path d="M30 58 L30 42 Q30 36 36 34 L36 26 Q34 16 40 12 L52 10 Q60 12 62 20 L64 28 Q68 32 68 38 L68 58 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M30 58 L30 42 Q30 36 36 34 L36 26 Q34 16 40 12 L52 10 Q60 12 62 20 L64 28 Q68 32 68 38 L68 46 Q50 40 30 46 Z" fill="#FFCDD2" opacity="0.4"/>
      <rect x="48" y="28" width="14" height="6" rx="2" fill="#7F0000"/>
      <rect x="50" y="30" width="10" height="2" rx="1" fill="#EF5350"/>
      <path d="M36 26 L28 14 L32 12 L38 22 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="28" cy="12" r="3" fill="#FFD93D"/>
      <rect x="36" y="38" width="10" height="4" rx="1" fill="#7F0000"/>
      <path d="M36 44 Q42 48 50 44" stroke="#B71C1C" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="44" cy="52" r="3" fill="#7F0000"/>
      <circle cx="56" cy="52" r="3" fill="#7F0000"/>
    </svg>`;
  },
  // 흑 폰 — 미니봇 (레드)
  bP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="86" rx="22" ry="6" fill="#B71C1C" opacity="0.25"/>
      <rect x="34" y="58" width="32" height="28" rx="5" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="34" y="58" width="32" height="12" rx="5" fill="#FFCDD2" opacity="0.5"/>
      <rect x="38" y="72" width="24" height="8" rx="2" fill="#B71C1C" opacity="0.3"/>
      <circle cx="50" cy="40" r="18" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <circle cx="50" cy="38" r="13" fill="#FFCDD2" opacity="0.4"/>
      <rect x="38" y="38" width="24" height="8" rx="3" fill="#7F0000"/>
      <rect x="40" y="40" width="8" height="4" rx="1" fill="#EF5350"/>
      <rect x="52" y="40" width="8" height="4" rx="1" fill="#EF5350"/>
      <rect x="48" y="18" width="4" height="10" rx="2" fill="#EF5350" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="50" cy="16" r="3.5" fill="#FFD93D" stroke="#B71C1C" stroke-width="1"/>
      <rect x="48" y="56" width="4" height="4" rx="1" fill="#B71C1C"/>
    </svg>`;
  }
};
