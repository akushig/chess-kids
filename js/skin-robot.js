// ===== robot 스킨 — 로봇 테마 =====
// 백(나): 실버/블루 계열 — 주색 #90A4AE, 진한 #37474F, 밝은 #ECEFF1
// 흑(적): 다크/레드 계열 — 주색 #E53935, 진한 #B71C1C, 밝은 #FFCDD2
SKINS.robot = {
  // 백 킹 — 커맨더봇: 안테나 왕관, 넓은 어깨, 가슴 코어
  wK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="#37474F" opacity="0.25"/>
      <rect x="30" y="60" width="40" height="26" rx="4" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="30" y="60" width="40" height="12" rx="4" fill="#ECEFF1" opacity="0.5"/>
      <rect x="24" y="64" width="8" height="14" rx="3" fill="#90A4AE" stroke="#37474F" stroke-width="2"/>
      <rect x="68" y="64" width="8" height="14" rx="3" fill="#90A4AE" stroke="#37474F" stroke-width="2"/>
      <circle cx="50" cy="72" r="6" fill="#4FC3F7" stroke="#0288D1" stroke-width="1.5"/>
      <circle cx="50" cy="72" r="3" fill="#E1F5FE"/>
      <rect x="36" y="38" width="28" height="22" rx="6" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="36" y="38" width="28" height="10" rx="6" fill="#ECEFF1" opacity="0.5"/>
      <rect x="40" y="46" width="8" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="52" y="46" width="8" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="46" y="54" width="8" height="3" rx="1" fill="#37474F" opacity="0.4"/>
      <rect x="48" y="30" width="4" height="10" rx="2" fill="#90A4AE" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="50" cy="28" r="4" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <rect x="42" y="24" width="4" height="8" rx="2" fill="#90A4AE" stroke="#37474F" stroke-width="1"/>
      <circle cx="44" cy="22" r="2.5" fill="#4FC3F7"/>
      <rect x="54" y="24" width="4" height="8" rx="2" fill="#90A4AE" stroke="#37474F" stroke-width="1"/>
      <circle cx="56" cy="22" r="2.5" fill="#4FC3F7"/>
    </svg>`;
  },
  // 백 퀸 — 테크퀸: 레이더 안테나, 슬림 바디, 센서 아이
  wQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#37474F" opacity="0.25"/>
      <rect x="34" y="58" width="32" height="28" rx="5" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="34" y="58" width="32" height="12" rx="5" fill="#ECEFF1" opacity="0.5"/>
      <path d="M34 64 L22 56 L24 66 L34 70 Z" fill="#90A4AE" stroke="#37474F" stroke-width="2"/>
      <path d="M66 64 L78 56 L76 66 L66 70 Z" fill="#90A4AE" stroke="#37474F" stroke-width="2"/>
      <circle cx="50" cy="72" r="5" fill="#4FC3F7" stroke="#0288D1" stroke-width="1.5"/>
      <circle cx="50" cy="72" r="2.5" fill="#E1F5FE"/>
      <rect x="38" y="38" width="24" height="20" rx="6" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="38" y="38" width="24" height="9" rx="6" fill="#ECEFF1" opacity="0.5"/>
      <rect x="42" y="46" width="6" height="5" rx="2" fill="#4FC3F7"/>
      <rect x="52" y="46" width="6" height="5" rx="2" fill="#4FC3F7"/>
      <circle cx="50" cy="34" r="6" fill="#90A4AE" stroke="#37474F" stroke-width="2"/>
      <circle cx="50" cy="34" r="3" fill="#4FC3F7"/>
      <path d="M44 34 L36 26 L38 24 L44 30" fill="none" stroke="#37474F" stroke-width="1.5"/>
      <path d="M56 34 L64 26 L62 24 L56 30" fill="none" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="36" cy="25" r="2" fill="#FFD93D"/>
      <circle cx="64" cy="25" r="2" fill="#FFD93D"/>
    </svg>`;
  },
  // 백 룩 — 탱크봇: 캐터필러, 포탑, 박스 바디
  wR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="30" ry="5" fill="#37474F" opacity="0.25"/>
      <rect x="22" y="74" width="56" height="12" rx="4" fill="#37474F" stroke="#263238" stroke-width="2"/>
      <circle cx="30" cy="80" r="4" fill="#90A4AE" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="42" cy="80" r="4" fill="#90A4AE" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="58" cy="80" r="4" fill="#90A4AE" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="70" cy="80" r="4" fill="#90A4AE" stroke="#37474F" stroke-width="1.5"/>
      <rect x="28" y="46" width="44" height="30" rx="4" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="28" y="46" width="44" height="14" rx="4" fill="#ECEFF1" opacity="0.5"/>
      <rect x="34" y="56" width="12" height="8" rx="2" fill="#4FC3F7"/>
      <rect x="54" y="56" width="12" height="8" rx="2" fill="#4FC3F7"/>
      <rect x="42" y="30" width="16" height="18" rx="4" fill="#90A4AE" stroke="#37474F" stroke-width="2"/>
      <rect x="42" y="30" width="16" height="8" rx="4" fill="#ECEFF1" opacity="0.4"/>
      <rect x="54" y="36" width="18" height="4" rx="2" fill="#37474F" stroke="#263238" stroke-width="1.5"/>
      <circle cx="72" cy="38" r="3" fill="#E53935"/>
    </svg>`;
  },
  // 백 비숍 — 스카우트봇: 단안 바이저, 뾰족 헬멧
  wB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#37474F" opacity="0.25"/>
      <rect x="34" y="58" width="32" height="28" rx="4" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="34" y="58" width="32" height="12" rx="4" fill="#ECEFF1" opacity="0.5"/>
      <circle cx="50" cy="72" r="4" fill="#4FC3F7" stroke="#0288D1" stroke-width="1"/>
      <rect x="38" y="40" width="24" height="18" rx="5" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="38" y="40" width="24" height="8" rx="5" fill="#ECEFF1" opacity="0.5"/>
      <rect x="40" y="46" width="20" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="42" y="48" width="16" height="2" rx="1" fill="#E1F5FE"/>
      <path d="M50 40 L44 26 L50 14 L56 26 Z" fill="#90A4AE" stroke="#37474F" stroke-width="2"/>
      <path d="M50 40 L47 30 L50 20 L53 30 Z" fill="#ECEFF1" opacity="0.5"/>
      <circle cx="50" cy="14" r="3" fill="#4FC3F7" stroke="#0288D1" stroke-width="1"/>
    </svg>`;
  },
  // 백 나이트 — 기마봇: 기계 말 머리, 관절, 안테나
  wN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="#37474F" opacity="0.25"/>
      <rect x="30" y="60" width="40" height="26" rx="4" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="30" y="60" width="40" height="10" rx="4" fill="#ECEFF1" opacity="0.5"/>
      <path d="M32 60 L32 44 Q32 38 38 36 L38 28 Q36 18 42 14 L54 12 Q62 14 64 22 L66 30 Q70 34 70 40 L70 60 Z" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <path d="M32 60 L32 44 Q32 38 38 36 L38 28 Q36 18 42 14 L54 12 Q62 14 64 22 L66 30 Q70 34 70 40 L70 48 Q50 42 32 48 Z" fill="#ECEFF1" opacity="0.4"/>
      <rect x="50" y="28" width="12" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="52" y="30" width="8" height="2" rx="1" fill="#E1F5FE"/>
      <path d="M38 28 L30 16 L34 14 L40 24 Z" fill="#90A4AE" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="30" cy="14" r="3" fill="#FFD93D"/>
      <circle cx="44" cy="52" r="3" fill="#37474F"/>
      <circle cx="56" cy="52" r="3" fill="#37474F"/>
      <rect x="38" y="38" width="8" height="3" rx="1" fill="#37474F" opacity="0.4"/>
    </svg>`;
  },
  // 백 폰 — 미니봇: 둥근 머리, 안테나, 컴팩트 바디
  wP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="20" ry="5" fill="#37474F" opacity="0.25"/>
      <rect x="36" y="60" width="28" height="26" rx="5" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <rect x="36" y="60" width="28" height="10" rx="5" fill="#ECEFF1" opacity="0.5"/>
      <circle cx="50" cy="72" r="3.5" fill="#4FC3F7" stroke="#0288D1" stroke-width="1"/>
      <circle cx="50" cy="42" r="16" fill="#90A4AE" stroke="#37474F" stroke-width="2.5"/>
      <circle cx="50" cy="40" r="11" fill="#ECEFF1" opacity="0.4"/>
      <rect x="40" y="40" width="8" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="52" y="40" width="8" height="6" rx="2" fill="#4FC3F7"/>
      <rect x="48" y="20" width="4" height="8" rx="2" fill="#90A4AE" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="50" cy="18" r="3" fill="#FFD93D" stroke="#37474F" stroke-width="1"/>
    </svg>`;
  },
  // 흑 킹 — 다크커맨더: 안테나 왕관, 넓은 어깨, 레드 코어
  bK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="#B71C1C" opacity="0.25"/>
      <rect x="30" y="60" width="40" height="26" rx="4" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="30" y="60" width="40" height="12" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <rect x="24" y="64" width="8" height="14" rx="3" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
      <rect x="68" y="64" width="8" height="14" rx="3" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
      <circle cx="50" cy="72" r="6" fill="#7C4DFF" stroke="#4527A0" stroke-width="1.5"/>
      <circle cx="50" cy="72" r="3" fill="#EDE7F6"/>
      <rect x="36" y="38" width="28" height="22" rx="6" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="36" y="38" width="28" height="10" rx="6" fill="#FFCDD2" opacity="0.5"/>
      <rect x="40" y="46" width="8" height="6" rx="2" fill="#FF8A80"/>
      <rect x="52" y="46" width="8" height="6" rx="2" fill="#FF8A80"/>
      <rect x="46" y="54" width="8" height="3" rx="1" fill="#B71C1C" opacity="0.4"/>
      <rect x="48" y="30" width="4" height="10" rx="2" fill="#E53935" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="50" cy="28" r="4" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <rect x="42" y="24" width="4" height="8" rx="2" fill="#E53935" stroke="#B71C1C" stroke-width="1"/>
      <circle cx="44" cy="22" r="2.5" fill="#FF8A80"/>
      <rect x="54" y="24" width="4" height="8" rx="2" fill="#E53935" stroke="#B71C1C" stroke-width="1"/>
      <circle cx="56" cy="22" r="2.5" fill="#FF8A80"/>
    </svg>`;
  },
  // 흑 퀸 — 다크테크퀸: 레이더, 슬림, 레드 센서
  bQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#B71C1C" opacity="0.25"/>
      <rect x="34" y="58" width="32" height="28" rx="5" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="34" y="58" width="32" height="12" rx="5" fill="#FFCDD2" opacity="0.5"/>
      <path d="M34 64 L22 56 L24 66 L34 70 Z" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
      <path d="M66 64 L78 56 L76 66 L66 70 Z" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
      <circle cx="50" cy="72" r="5" fill="#7C4DFF" stroke="#4527A0" stroke-width="1.5"/>
      <circle cx="50" cy="72" r="2.5" fill="#EDE7F6"/>
      <rect x="38" y="38" width="24" height="20" rx="6" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="38" y="38" width="24" height="9" rx="6" fill="#FFCDD2" opacity="0.5"/>
      <rect x="42" y="46" width="6" height="5" rx="2" fill="#FF8A80"/>
      <rect x="52" y="46" width="6" height="5" rx="2" fill="#FF8A80"/>
      <circle cx="50" cy="34" r="6" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
      <circle cx="50" cy="34" r="3" fill="#FF8A80"/>
      <path d="M44 34 L36 26 L38 24 L44 30" fill="none" stroke="#B71C1C" stroke-width="1.5"/>
      <path d="M56 34 L64 26 L62 24 L56 30" fill="none" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="36" cy="25" r="2" fill="#FFD93D"/>
      <circle cx="64" cy="25" r="2" fill="#FFD93D"/>
    </svg>`;
  },
  // 흑 룩 — 다크탱크: 캐터필러, 포탑, 레드 바디
  bR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="30" ry="5" fill="#B71C1C" opacity="0.25"/>
      <rect x="22" y="74" width="56" height="12" rx="4" fill="#B71C1C" stroke="#7F0000" stroke-width="2"/>
      <circle cx="30" cy="80" r="4" fill="#E53935" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="42" cy="80" r="4" fill="#E53935" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="58" cy="80" r="4" fill="#E53935" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="70" cy="80" r="4" fill="#E53935" stroke="#B71C1C" stroke-width="1.5"/>
      <rect x="28" y="46" width="44" height="30" rx="4" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="28" y="46" width="44" height="14" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <rect x="34" y="56" width="12" height="8" rx="2" fill="#FF8A80"/>
      <rect x="54" y="56" width="12" height="8" rx="2" fill="#FF8A80"/>
      <rect x="42" y="30" width="16" height="18" rx="4" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
      <rect x="42" y="30" width="16" height="8" rx="4" fill="#FFCDD2" opacity="0.4"/>
      <rect x="54" y="36" width="18" height="4" rx="2" fill="#B71C1C" stroke="#7F0000" stroke-width="1.5"/>
      <circle cx="72" cy="38" r="3" fill="#FFD93D"/>
    </svg>`;
  },
  // 흑 비숍 — 다크스카우트: 단안 바이저, 뾰족 헬멧
  bB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#B71C1C" opacity="0.25"/>
      <rect x="34" y="58" width="32" height="28" rx="4" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="34" y="58" width="32" height="12" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <circle cx="50" cy="72" r="4" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
      <rect x="38" y="40" width="24" height="18" rx="5" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="38" y="40" width="24" height="8" rx="5" fill="#FFCDD2" opacity="0.5"/>
      <rect x="40" y="46" width="20" height="6" rx="2" fill="#FF8A80"/>
      <rect x="42" y="48" width="16" height="2" rx="1" fill="#FFCDD2"/>
      <path d="M50 40 L44 26 L50 14 L56 26 Z" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
      <path d="M50 40 L47 30 L50 20 L53 30 Z" fill="#FFCDD2" opacity="0.5"/>
      <circle cx="50" cy="14" r="3" fill="#FF8A80" stroke="#B71C1C" stroke-width="1"/>
    </svg>`;
  },
  // 흑 나이트 — 다크기마봇: 기계 말 머리, 레드
  bN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="#B71C1C" opacity="0.25"/>
      <rect x="30" y="60" width="40" height="26" rx="4" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="30" y="60" width="40" height="10" rx="4" fill="#FFCDD2" opacity="0.5"/>
      <path d="M32 60 L32 44 Q32 38 38 36 L38 28 Q36 18 42 14 L54 12 Q62 14 64 22 L66 30 Q70 34 70 40 L70 60 Z" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M32 60 L32 44 Q32 38 38 36 L38 28 Q36 18 42 14 L54 12 Q62 14 64 22 L66 30 Q70 34 70 40 L70 48 Q50 42 32 48 Z" fill="#FFCDD2" opacity="0.4"/>
      <rect x="50" y="28" width="12" height="6" rx="2" fill="#FF8A80"/>
      <rect x="52" y="30" width="8" height="2" rx="1" fill="#FFCDD2"/>
      <path d="M38 28 L30 16 L34 14 L40 24 Z" fill="#E53935" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="30" cy="14" r="3" fill="#FFD93D"/>
      <circle cx="44" cy="52" r="3" fill="#B71C1C"/>
      <circle cx="56" cy="52" r="3" fill="#B71C1C"/>
      <rect x="38" y="38" width="8" height="3" rx="1" fill="#B71C1C" opacity="0.4"/>
    </svg>`;
  },
  // 흑 폰 — 다크미니봇: 둥근 머리, 안테나, 레드 바디
  bP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="20" ry="5" fill="#B71C1C" opacity="0.25"/>
      <rect x="36" y="60" width="28" height="26" rx="5" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="36" y="60" width="28" height="10" rx="5" fill="#FFCDD2" opacity="0.5"/>
      <circle cx="50" cy="72" r="3.5" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
      <circle cx="50" cy="42" r="16" fill="#E53935" stroke="#B71C1C" stroke-width="2.5"/>
      <circle cx="50" cy="40" r="11" fill="#FFCDD2" opacity="0.4"/>
      <rect x="40" y="40" width="8" height="6" rx="2" fill="#FF8A80"/>
      <rect x="52" y="40" width="8" height="6" rx="2" fill="#FF8A80"/>
      <rect x="48" y="20" width="4" height="8" rx="2" fill="#E53935" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="50" cy="18" r="3" fill="#FFD93D" stroke="#B71C1C" stroke-width="1"/>
    </svg>`;
  }
};
