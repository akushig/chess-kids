// ===== hellocarbot 스킨 — 로봇 테마 (cute 구조 + 색상 변경) =====
// 백: 스카이블루 #4FC3F7 / 스트로크 #0288D1 / 하이라이트 #E1F5FE
// 흑: 레드 #EF5350 / 스트로크 #B71C1C / 하이라이트 #FFCDD2
SKINS.hellocarbot = {
  wK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="8" fill="#0288D1" opacity="0.3"/>
      <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 85 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 65 Q50 58 25 65 Z" fill="#E1F5FE"/>
      <rect x="47" y="10" width="6" height="18" rx="3" fill="#4FC3F7" stroke="#0288D1" stroke-width="2"/>
      <rect x="40" y="14" width="20" height="6" rx="3" fill="#4FC3F7" stroke="#0288D1" stroke-width="2"/>
      <circle cx="50" cy="10" r="4" fill="#FFD93D"/>
      <circle cx="40" cy="58" r="4.5" fill="#333"/>
      <circle cx="60" cy="58" r="4.5" fill="#333"/>
      <circle cx="41.5" cy="56.5" r="1.8" fill="#fff"/>
      <circle cx="61.5" cy="56.5" r="1.8" fill="#fff"/>
      <path d="M44 68 Q50 73 56 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="36" cy="64" rx="4" ry="2.5" fill="#81D4FA" opacity="0.4"/>
      <ellipse cx="64" cy="64" rx="4" ry="2.5" fill="#81D4FA" opacity="0.4"/>
    </svg>`;
  },
  wQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="8" fill="#0288D1" opacity="0.3"/>
      <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 85 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 62 Q50 55 22 62 Z" fill="#E1F5FE"/>
      <path d="M22 40 L15 18 L30 32 L40 12 L50 30 L60 12 L70 32 L85 18 L78 40 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2"/>
      <circle cx="15" cy="16" r="4" fill="#FFD93D" stroke="#0288D1" stroke-width="1.5"/>
      <circle cx="40" cy="10" r="4" fill="#FF6B6B" stroke="#0288D1" stroke-width="1.5"/>
      <circle cx="60" cy="10" r="4" fill="#81D4FA" stroke="#0288D1" stroke-width="1.5"/>
      <circle cx="85" cy="16" r="4" fill="#FFD93D" stroke="#0288D1" stroke-width="1.5"/>
      <circle cx="50" cy="28" r="4" fill="#FFD93D" stroke="#0288D1" stroke-width="1.5"/>
      <circle cx="40" cy="58" r="4.5" fill="#333"/>
      <circle cx="60" cy="58" r="4.5" fill="#333"/>
      <circle cx="41.5" cy="56.5" r="1.8" fill="#fff"/>
      <circle cx="61.5" cy="56.5" r="1.8" fill="#fff"/>
      <path d="M44 68 Q50 73 56 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="36" cy="64" rx="4" ry="2.5" fill="#81D4FA" opacity="0.4"/>
      <ellipse cx="64" cy="64" rx="4" ry="2.5" fill="#81D4FA" opacity="0.4"/>
    </svg>`;
  },
  wR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="8" fill="#0288D1" opacity="0.3"/>
      <path d="M28 85 L28 40 L72 40 L72 85 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <path d="M28 85 L28 40 L72 40 L72 60 Q50 52 28 60 Z" fill="#E1F5FE"/>
      <path d="M24 40 L24 22 L34 22 L34 30 L42 30 L42 22 L58 22 L58 30 L66 30 L66 22 L76 22 L76 40 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <rect x="24" y="38" width="52" height="6" rx="2" fill="#0288D1" opacity="0.3"/>
      <circle cx="42" cy="58" r="4.5" fill="#333"/>
      <circle cx="58" cy="58" r="4.5" fill="#333"/>
      <circle cx="43.5" cy="56.5" r="1.8" fill="#fff"/>
      <circle cx="59.5" cy="56.5" r="1.8" fill="#fff"/>
      <path d="M46 68 Q50 72 54 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  wB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="26" ry="8" fill="#0288D1" opacity="0.3"/>
      <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 85 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 65 Q50 58 28 65 Z" fill="#E1F5FE"/>
      <path d="M50 40 Q42 28 44 18 Q46 8 50 5 Q54 8 56 18 Q58 28 50 40 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2"/>
      <circle cx="50" cy="5" r="4" fill="#FFD93D" stroke="#0288D1" stroke-width="1.5"/>
      <line x1="47" y1="22" x2="53" y2="22" stroke="#0288D1" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="50" y1="18" x2="50" y2="28" stroke="#0288D1" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="42" cy="58" r="4.5" fill="#333"/>
      <circle cx="58" cy="58" r="4.5" fill="#333"/>
      <circle cx="43.5" cy="56.5" r="1.8" fill="#fff"/>
      <circle cx="59.5" cy="56.5" r="1.8" fill="#fff"/>
      <path d="M45 68 Q50 72 55 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  wN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="8" fill="#0288D1" opacity="0.3"/>
      <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 85 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 62 Q50 55 28 62 Z" fill="#E1F5FE"/>
      <ellipse cx="38" cy="14" rx="5" ry="8" fill="#4FC3F7" stroke="#0288D1" stroke-width="2" transform="rotate(-20 38 14)"/>
      <ellipse cx="38" cy="12" rx="3" ry="5" fill="#81D4FA" transform="rotate(-20 38 12)"/>
      <circle cx="55" cy="30" r="5" fill="#333"/>
      <circle cx="56.5" cy="28.5" r="2" fill="#fff"/>
      <ellipse cx="42" cy="38" rx="3" ry="2" fill="#333"/>
      <path d="M38 42 Q42 46 48 42" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <circle cx="42" cy="62" r="4" fill="#333"/>
      <circle cx="58" cy="62" r="4" fill="#333"/>
      <circle cx="43.5" cy="60.5" r="1.5" fill="#fff"/>
      <circle cx="59.5" cy="60.5" r="1.5" fill="#fff"/>
      <path d="M46 72 Q50 76 54 72" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  wP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="24" ry="7" fill="#0288D1" opacity="0.3"/>
      <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 85 Z" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 65 Q50 58 30 65 Z" fill="#E1F5FE"/>
      <circle cx="50" cy="30" r="16" fill="#4FC3F7" stroke="#0288D1" stroke-width="2.5"/>
      <circle cx="50" cy="28" r="12" fill="#E1F5FE"/>
      <circle cx="44" cy="27" r="3.5" fill="#333"/>
      <circle cx="56" cy="27" r="3.5" fill="#333"/>
      <circle cx="45.2" cy="25.8" r="1.3" fill="#fff"/>
      <circle cx="57.2" cy="25.8" r="1.3" fill="#fff"/>
      <path d="M46 34 Q50 37 54 34" stroke="#333" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="35" rx="4" ry="2" fill="#81D4FA" opacity="0.35"/>
    </svg>`;
  },
  bK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="8" fill="#B71C1C" opacity="0.3"/>
      <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 85 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 65 Q50 58 25 65 Z" fill="#FFCDD2"/>
      <rect x="47" y="10" width="6" height="18" rx="3" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <rect x="40" y="14" width="20" height="6" rx="3" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <circle cx="50" cy="10" r="4" fill="#FFD93D"/>
      <circle cx="40" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="60" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="41.5" cy="56.5" r="1.8" fill="#333"/>
      <circle cx="61.5" cy="56.5" r="1.8" fill="#333"/>
      <path d="M44 68 Q50 73 56 68" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  bQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="30" ry="8" fill="#B71C1C" opacity="0.3"/>
      <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 85 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 62 Q50 55 22 62 Z" fill="#FFCDD2"/>
      <path d="M22 40 L15 18 L30 32 L40 12 L50 30 L60 12 L70 32 L85 18 L78 40 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <circle cx="15" cy="16" r="4" fill="#FFD93D" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="40" cy="10" r="4" fill="#FFCDD2" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="60" cy="10" r="4" fill="#FFD93D" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="85" cy="16" r="4" fill="#FFCDD2" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="50" cy="28" r="4" fill="#FFD93D" stroke="#B71C1C" stroke-width="1.5"/>
      <circle cx="40" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="60" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="41.5" cy="56.5" r="1.8" fill="#333"/>
      <circle cx="61.5" cy="56.5" r="1.8" fill="#333"/>
      <path d="M44 68 Q50 73 56 68" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  bR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="8" fill="#B71C1C" opacity="0.3"/>
      <path d="M28 85 L28 40 L72 40 L72 85 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M28 85 L28 40 L72 40 L72 60 Q50 52 28 60 Z" fill="#FFCDD2"/>
      <path d="M24 40 L24 22 L34 22 L34 30 L42 30 L42 22 L58 22 L58 30 L66 30 L66 22 L76 22 L76 40 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <rect x="24" y="38" width="52" height="6" rx="2" fill="#B71C1C" opacity="0.3"/>
      <circle cx="42" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="58" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="43.5" cy="56.5" r="1.8" fill="#333"/>
      <circle cx="59.5" cy="56.5" r="1.8" fill="#333"/>
      <path d="M46 68 Q50 72 54 68" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  bB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="26" ry="8" fill="#B71C1C" opacity="0.3"/>
      <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 85 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 65 Q50 58 28 65 Z" fill="#FFCDD2"/>
      <path d="M50 40 Q42 28 44 18 Q46 8 50 5 Q54 8 56 18 Q58 28 50 40 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>
      <circle cx="50" cy="5" r="4" fill="#FFD93D" stroke="#B71C1C" stroke-width="1.5"/>
      <line x1="47" y1="22" x2="53" y2="22" stroke="#B71C1C" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="50" y1="18" x2="50" y2="28" stroke="#B71C1C" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="42" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="58" cy="58" r="4.5" fill="#FFD93D"/>
      <circle cx="43.5" cy="56.5" r="1.8" fill="#333"/>
      <circle cx="59.5" cy="56.5" r="1.8" fill="#333"/>
      <path d="M45 68 Q50 72 55 68" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  bN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="28" ry="8" fill="#B71C1C" opacity="0.3"/>
      <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 85 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 62 Q50 55 28 62 Z" fill="#FFCDD2"/>
      <ellipse cx="38" cy="14" rx="5" ry="8" fill="#EF5350" stroke="#B71C1C" stroke-width="2" transform="rotate(-20 38 14)"/>
      <ellipse cx="38" cy="12" rx="3" ry="5" fill="#FFCDD2" transform="rotate(-20 38 12)"/>
      <circle cx="55" cy="30" r="5" fill="#FFEAA7"/>
      <circle cx="56.5" cy="28.5" r="2" fill="#333"/>
      <ellipse cx="42" cy="38" rx="3" ry="2" fill="#FFEAA7"/>
      <path d="M38 42 Q42 46 48 42" stroke="#FFEAA7" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <circle cx="42" cy="62" r="4" fill="#FFEAA7"/>
      <circle cx="58" cy="62" r="4" fill="#FFEAA7"/>
      <circle cx="43.5" cy="60.5" r="1.5" fill="#333"/>
      <circle cx="59.5" cy="60.5" r="1.5" fill="#333"/>
      <path d="M46 72 Q50 76 54 72" stroke="#FFEAA7" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  bP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="82" rx="24" ry="7" fill="#B71C1C" opacity="0.3"/>
      <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 85 Z" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 65 Q50 58 30 65 Z" fill="#FFCDD2"/>
      <circle cx="50" cy="30" r="16" fill="#EF5350" stroke="#B71C1C" stroke-width="2.5"/>
      <circle cx="50" cy="28" r="12" fill="#FFCDD2"/>
      <circle cx="44" cy="27" r="3.5" fill="#FFD93D"/>
      <circle cx="56" cy="27" r="3.5" fill="#FFD93D"/>
      <circle cx="45.2" cy="25.8" r="1.3" fill="#333"/>
      <circle cx="57.2" cy="25.8" r="1.3" fill="#333"/>
      <path d="M46 34 Q50 37 54 34" stroke="#FFD93D" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    </svg>`;
  }
};
