// ===== dino 스킨 — 공룡 테마 =====
// 백(나): 초록 계열 초식공룡 — 주색 #66BB6A, 진한 #2E7D32, 밝은 #C8E6C9
// 흑(적): 주황/갈색 계열 육식공룡 — 주색 #FF7043, 진한 #BF360C, 밝은 #FFCCBC
SKINS.dino = {
  // 백 킹 — 브라키오사우루스: 긴 목, 작은 머리, 왕관
  wK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="28" ry="6" fill="#2E7D32" opacity="0.25"/>
      <ellipse cx="50" cy="82" rx="24" ry="8" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <ellipse cx="50" cy="82" rx="24" ry="4" fill="#C8E6C9" opacity="0.4"/>
      <rect x="34" y="60" width="32" height="24" rx="12" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <rect x="34" y="60" width="32" height="10" rx="12" fill="#C8E6C9" opacity="0.4"/>
      <path d="M44 60 Q42 36 38 24 Q36 18 40 16 L46 15 Q48 15 48 18 L46 28" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <path d="M44 60 Q42 36 38 24 Q37 20 39 17" fill="#C8E6C9" opacity="0.3" stroke="none"/>
      <ellipse cx="40" cy="15" rx="8" ry="5" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <ellipse cx="40" cy="14" rx="6" ry="3" fill="#C8E6C9" opacity="0.4"/>
      <circle cx="36" cy="13" r="2" fill="#2E7D32"/>
      <circle cx="36.5" cy="12.5" r="0.8" fill="#fff"/>
      <path d="M44 68 L56 68 Q60 76 56 82 L44 82 Q40 76 44 68 Z" fill="#2E7D32" opacity="0.15"/>
      <rect x="36" y="6" width="3" height="6" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="41" y="4" width="3" height="8" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="46" y="6" width="3" height="6" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
    </svg>`;
  },
  // 백 퀸 — 트리케라톱스: 프릴 + 뿔 3개
  wQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="28" ry="6" fill="#2E7D32" opacity="0.25"/>
      <ellipse cx="50" cy="82" rx="22" ry="7" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <rect x="32" y="56" width="36" height="28" rx="14" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <rect x="32" y="56" width="36" height="12" rx="14" fill="#C8E6C9" opacity="0.4"/>
      <ellipse cx="50" cy="42" rx="18" ry="14" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <ellipse cx="50" cy="40" rx="14" ry="10" fill="#C8E6C9" opacity="0.3"/>
      <path d="M32 42 Q22 30 26 18 Q28 12 34 14 Q38 16 36 24 L34 36" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <path d="M68 42 Q78 30 74 18 Q72 12 66 14 Q62 16 64 24 L66 36" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <circle cx="26" cy="17" r="3" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <circle cx="74" cy="17" r="3" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <path d="M50 42 L48 24 L50 18 L52 24 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <path d="M38 44 L34 32 L38 28 L40 34 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <path d="M62 44 L66 32 L62 28 L60 34 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <circle cx="43" cy="46" r="3" fill="#2E7D32"/>
      <circle cx="57" cy="46" r="3" fill="#2E7D32"/>
      <circle cx="43.8" cy="45.2" r="1.2" fill="#fff"/>
      <circle cx="57.8" cy="45.2" r="1.2" fill="#fff"/>
      <path d="M46 54 Q50 56 54 54" stroke="#2E7D32" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  // 백 룩 — 안킬로사우루스: 갑옷 등판, 꼬리 방망이
  wR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="30" ry="6" fill="#2E7D32" opacity="0.25"/>
      <rect x="24" y="58" width="52" height="28" rx="14" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <rect x="24" y="58" width="52" height="12" rx="14" fill="#C8E6C9" opacity="0.4"/>
      <path d="M30 58 Q32 50 38 48 L62 48 Q68 50 70 58" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <path d="M30 58 Q32 50 38 48 L62 48 Q68 50 70 54" fill="#C8E6C9" opacity="0.3" stroke="none"/>
      <polygon points="36,48 38,40 42,48" fill="#66BB6A" stroke="#2E7D32" stroke-width="1.5"/>
      <polygon points="46,48 48,38 52,48" fill="#66BB6A" stroke="#2E7D32" stroke-width="1.5"/>
      <polygon points="56,48 58,40 62,48" fill="#66BB6A" stroke="#2E7D32" stroke-width="1.5"/>
      <ellipse cx="34" cy="68" rx="6" ry="5" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <circle cx="32" cy="66" r="2.5" fill="#2E7D32"/>
      <circle cx="32.5" cy="65.5" r="1" fill="#fff"/>
      <path d="M70 72 L82 68 L86 72 L82 76 L70 76" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <circle cx="84" cy="72" r="5" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <rect x="38" y="54" width="6" height="6" rx="2" fill="#2E7D32" opacity="0.2"/>
      <rect x="48" y="54" width="6" height="6" rx="2" fill="#2E7D32" opacity="0.2"/>
      <rect x="58" y="54" width="6" height="6" rx="2" fill="#2E7D32" opacity="0.2"/>
    </svg>`;
  },
  // 백 비숍 — 파라사우롤로푸스: 긴 볏
  wB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="6" fill="#2E7D32" opacity="0.25"/>
      <ellipse cx="50" cy="82" rx="20" ry="7" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="28" rx="12" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="12" rx="12" fill="#C8E6C9" opacity="0.4"/>
      <path d="M46 56 Q44 42 42 36 Q40 30 44 28 L50 26 Q54 28 52 34 L48 46" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <ellipse cx="46" cy="28" rx="8" ry="6" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <ellipse cx="46" cy="27" rx="6" ry="4" fill="#C8E6C9" opacity="0.4"/>
      <path d="M50 26 Q58 18 68 12 Q72 10 70 14 Q66 20 56 26" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <path d="M50 26 Q58 18 68 12" fill="#C8E6C9" opacity="0.3" stroke="none"/>
      <circle cx="42" cy="28" r="2.5" fill="#2E7D32"/>
      <circle cx="42.5" cy="27.5" r="1" fill="#fff"/>
      <path d="M44 34 Q47 36 50 34" stroke="#2E7D32" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  // 백 나이트 — 벨로시랩터: 날렵한 몸, 큰 발톱
  wN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="6" fill="#2E7D32" opacity="0.25"/>
      <path d="M36 86 L36 72 Q36 64 42 60 L42 50 Q40 40 44 32 Q48 26 54 28 L60 32 Q66 38 64 48 L62 56 Q66 60 66 68 L66 86 Z" fill="#66BB6A" stroke="#2E7D32" stroke-width="2.5"/>
      <path d="M36 86 L36 72 Q36 64 42 60 L42 50 Q40 40 44 32 Q48 26 54 28 L60 32 Q66 38 64 48 L62 56 Q66 60 66 68 L66 74 Q50 66 36 74 Z" fill="#C8E6C9" opacity="0.4"/>
      <ellipse cx="52" cy="30" rx="10" ry="7" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>
      <ellipse cx="52" cy="29" rx="7" ry="4.5" fill="#C8E6C9" opacity="0.4"/>
      <circle cx="48" cy="28" r="2.5" fill="#2E7D32"/>
      <circle cx="48.5" cy="27.5" r="1" fill="#fff"/>
      <path d="M56 32 L62 34 L60 36" stroke="#2E7D32" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M54 28 L60 22 Q62 20 60 18" fill="none" stroke="#2E7D32" stroke-width="1.5"/>
      <path d="M36 86 L30 82 L28 78 L34 80 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <path d="M66 86 L72 82 L74 78 L68 80 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <path d="M62 86 L56 72 Q54 68 58 66" fill="none" stroke="#2E7D32" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  },
  // 백 폰 — 공룡알: 초록 반점
  wP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#2E7D32" opacity="0.25"/>
      <ellipse cx="50" cy="56" rx="22" ry="32" fill="#F5F0E1" stroke="#2E7D32" stroke-width="2.5"/>
      <ellipse cx="50" cy="48" rx="16" ry="22" fill="#FFFDF5" opacity="0.5"/>
      <ellipse cx="42" cy="46" rx="4" ry="5" fill="#66BB6A" opacity="0.6" transform="rotate(-15 42 46)"/>
      <ellipse cx="56" cy="52" rx="3" ry="4" fill="#66BB6A" opacity="0.5" transform="rotate(10 56 52)"/>
      <ellipse cx="48" cy="62" rx="3.5" ry="4.5" fill="#66BB6A" opacity="0.5" transform="rotate(-5 48 62)"/>
      <ellipse cx="58" cy="40" rx="3" ry="3.5" fill="#66BB6A" opacity="0.4" transform="rotate(20 58 40)"/>
      <ellipse cx="40" cy="36" rx="2.5" ry="3" fill="#66BB6A" opacity="0.4"/>
      <path d="M38 30 Q44 24 50 28 Q56 24 62 30" fill="none" stroke="#2E7D32" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
    </svg>`;
  },
  // 흑 킹 — 티라노사우루스: 큰 머리, 작은 팔, 왕관
  bK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="28" ry="6" fill="#BF360C" opacity="0.25"/>
      <ellipse cx="50" cy="82" rx="24" ry="8" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <ellipse cx="50" cy="82" rx="24" ry="4" fill="#FFCCBC" opacity="0.4"/>
      <rect x="32" y="54" width="36" height="30" rx="14" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <rect x="32" y="54" width="36" height="12" rx="14" fill="#FFCCBC" opacity="0.4"/>
      <path d="M36 60 L32 66 L28 64" stroke="#FF7043" stroke-width="2.5" fill="#FF7043"/>
      <path d="M64 60 L68 66 L72 64" stroke="#FF7043" stroke-width="2.5" fill="#FF7043"/>
      <ellipse cx="50" cy="38" rx="18" ry="14" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <ellipse cx="50" cy="36" rx="14" ry="10" fill="#FFCCBC" opacity="0.3"/>
      <circle cx="42" cy="34" r="3.5" fill="#BF360C"/>
      <circle cx="42.8" cy="33.2" r="1.3" fill="#fff"/>
      <circle cx="58" cy="34" r="3.5" fill="#BF360C"/>
      <circle cx="58.8" cy="33.2" r="1.3" fill="#fff"/>
      <path d="M42 46 L44 48 L46 46 L48 48 L50 46 L52 48 L54 46 L56 48 L58 46" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <rect x="42" y="22" width="3" height="7" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="48" y="20" width="3" height="9" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="54" y="22" width="3" height="7" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
    </svg>`;
  },
  // 흑 퀸 — 스피노사우루스: 등 돛, 긴 주둥이
  bQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="28" ry="6" fill="#BF360C" opacity="0.25"/>
      <ellipse cx="50" cy="82" rx="22" ry="7" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <rect x="30" y="56" width="40" height="28" rx="14" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <rect x="30" y="56" width="40" height="12" rx="14" fill="#FFCCBC" opacity="0.4"/>
      <path d="M36 56 Q38 38 42 30 Q44 26 48 28 L52 30 Q54 32 52 38 L48 50" fill="#FF7043" stroke="#BF360C" stroke-width="2"/>
      <ellipse cx="46" cy="30" rx="10" ry="6" fill="#FF7043" stroke="#BF360C" stroke-width="2"/>
      <ellipse cx="46" cy="29" rx="7" ry="4" fill="#FFCCBC" opacity="0.4"/>
      <circle cx="42" cy="28" r="2.5" fill="#BF360C"/>
      <circle cx="42.5" cy="27.5" r="1" fill="#fff"/>
      <path d="M48 34 L54 36 L52 38" stroke="#BF360C" stroke-width="1.5" fill="none"/>
      <path d="M38 56 Q36 46 38 38" fill="none" stroke="#BF360C" stroke-width="1.5"/>
      <path d="M40 56 L36 36 L40 28 L44 36 L42 44 L48 34 L50 42 L48 50 L54 40 L54 48 L50 56" fill="#FF5722" stroke="#BF360C" stroke-width="1.5"/>
      <path d="M40 56 L36 36 L40 28" fill="#FFCCBC" opacity="0.3" stroke="none"/>
    </svg>`;
  },
  // 흑 룩 — 카르노타우루스: 뿔 2개, 단단한 몸
  bR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="30" ry="6" fill="#BF360C" opacity="0.25"/>
      <rect x="26" y="54" width="48" height="32" rx="14" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <rect x="26" y="54" width="48" height="14" rx="14" fill="#FFCCBC" opacity="0.4"/>
      <ellipse cx="50" cy="40" rx="18" ry="14" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <ellipse cx="50" cy="38" rx="14" ry="10" fill="#FFCCBC" opacity="0.3"/>
      <path d="M36 38 L30 22 L34 20 L38 32" fill="#FF7043" stroke="#BF360C" stroke-width="2"/>
      <path d="M64 38 L70 22 L66 20 L62 32" fill="#FF7043" stroke="#BF360C" stroke-width="2"/>
      <circle cx="43" cy="38" r="3" fill="#BF360C"/>
      <circle cx="43.8" cy="37.2" r="1.2" fill="#fff"/>
      <circle cx="57" cy="38" r="3" fill="#BF360C"/>
      <circle cx="57.8" cy="37.2" r="1.2" fill="#fff"/>
      <path d="M44 48 L46 50 L48 48 L50 50 L52 48 L54 50 L56 48" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <rect x="34" y="60" width="8" height="6" rx="2" fill="#BF360C" opacity="0.2"/>
      <rect x="46" y="60" width="8" height="6" rx="2" fill="#BF360C" opacity="0.2"/>
      <rect x="58" y="60" width="8" height="6" rx="2" fill="#BF360C" opacity="0.2"/>
    </svg>`;
  },
  // 흑 비숍 — 딜로포사우루스: 이중 볏
  bB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="6" fill="#BF360C" opacity="0.25"/>
      <ellipse cx="50" cy="82" rx="20" ry="7" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="28" rx="12" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <rect x="34" y="56" width="32" height="12" rx="12" fill="#FFCCBC" opacity="0.4"/>
      <path d="M46 56 Q44 42 42 36 Q40 30 44 28 L50 26 Q54 28 52 34 L48 46" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <ellipse cx="46" cy="28" rx="8" ry="6" fill="#FF7043" stroke="#BF360C" stroke-width="2"/>
      <ellipse cx="46" cy="27" rx="6" ry="4" fill="#FFCCBC" opacity="0.4"/>
      <path d="M42 26 Q38 16 42 10 Q44 8 46 12 Q44 18 44 24" fill="#FF5722" stroke="#BF360C" stroke-width="1.5"/>
      <path d="M48 24 Q46 14 50 8 Q52 6 54 10 Q52 16 50 22" fill="#FF5722" stroke="#BF360C" stroke-width="1.5"/>
      <circle cx="42" cy="28" r="2.5" fill="#BF360C"/>
      <circle cx="42.5" cy="27.5" r="1" fill="#fff"/>
      <path d="M44 34 Q47 36 50 34" stroke="#BF360C" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  // 흑 나이트 — 유타랩터: 큰 발톱, 날렵한 몸
  bN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="6" fill="#BF360C" opacity="0.25"/>
      <path d="M36 86 L36 72 Q36 64 42 60 L42 50 Q40 40 44 32 Q48 26 54 28 L60 32 Q66 38 64 48 L62 56 Q66 60 66 68 L66 86 Z" fill="#FF7043" stroke="#BF360C" stroke-width="2.5"/>
      <path d="M36 86 L36 72 Q36 64 42 60 L42 50 Q40 40 44 32 Q48 26 54 28 L60 32 Q66 38 64 48 L62 56 Q66 60 66 68 L66 74 Q50 66 36 74 Z" fill="#FFCCBC" opacity="0.4"/>
      <ellipse cx="52" cy="30" rx="10" ry="7" fill="#FF7043" stroke="#BF360C" stroke-width="2"/>
      <ellipse cx="52" cy="29" rx="7" ry="4.5" fill="#FFCCBC" opacity="0.4"/>
      <circle cx="48" cy="28" r="2.5" fill="#BF360C"/>
      <circle cx="48.5" cy="27.5" r="1" fill="#fff"/>
      <path d="M56 32 L62 34 L60 36" stroke="#BF360C" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M54 28 L60 22 Q62 20 60 18" fill="none" stroke="#BF360C" stroke-width="1.5"/>
      <path d="M36 86 L28 80 L24 74 L32 78 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <path d="M66 86 L74 80 L78 74 L70 78 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <path d="M62 86 L56 72 Q54 68 58 66" fill="none" stroke="#BF360C" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  },
  // 흑 폰 — 공룡알: 주황 반점
  bP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#BF360C" opacity="0.25"/>
      <ellipse cx="50" cy="56" rx="22" ry="32" fill="#F5F0E1" stroke="#BF360C" stroke-width="2.5"/>
      <ellipse cx="50" cy="48" rx="16" ry="22" fill="#FFFDF5" opacity="0.5"/>
      <ellipse cx="42" cy="46" rx="4" ry="5" fill="#FF7043" opacity="0.6" transform="rotate(-15 42 46)"/>
      <ellipse cx="56" cy="52" rx="3" ry="4" fill="#FF7043" opacity="0.5" transform="rotate(10 56 52)"/>
      <ellipse cx="48" cy="62" rx="3.5" ry="4.5" fill="#FF7043" opacity="0.5" transform="rotate(-5 48 62)"/>
      <ellipse cx="58" cy="40" rx="3" ry="3.5" fill="#FF7043" opacity="0.4" transform="rotate(20 58 40)"/>
      <ellipse cx="40" cy="36" rx="2.5" ry="3" fill="#FF7043" opacity="0.4"/>
      <path d="M38 30 Q44 24 50 28 Q56 24 62 30" fill="none" stroke="#BF360C" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
    </svg>`;
  }
};
