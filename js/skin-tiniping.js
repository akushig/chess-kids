// ===== tiniping 스킨 — 캐치! 티니핑 테마 =====
// 백(나): 핑크/파스텔 계열 — 주색 #F48FB1, 진한 #C2185B, 밝은 #FCE4EC
// 흑(적): 보라/다크 계열 — 주색 #B39DDB, 진한 #4527A0, 밝은 #EDE7F6
SKINS.tiniping = {
  // 백 킹 — 로열핑: 하트 왕관, 둥근 몸, 날개
  wK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#C2185B" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="22" ry="20" fill="#F48FB1" stroke="#C2185B" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="18" ry="14" fill="#FCE4EC" opacity="0.5"/>
      <path d="M28 66 Q20 58 24 52 Q28 56 32 62" fill="#F48FB1" stroke="#C2185B" stroke-width="2"/>
      <path d="M72 66 Q80 58 76 52 Q72 56 68 62" fill="#F48FB1" stroke="#C2185B" stroke-width="2"/>
      <circle cx="42" cy="64" r="4" fill="#C2185B"/>
      <circle cx="58" cy="64" r="4" fill="#C2185B"/>
      <circle cx="43" cy="63" r="1.5" fill="#fff"/>
      <circle cx="59" cy="63" r="1.5" fill="#fff"/>
      <path d="M46 74 Q50 78 54 74" stroke="#C2185B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="72" rx="4" ry="2" fill="#FF8A80" opacity="0.4"/>
      <ellipse cx="62" cy="72" rx="4" ry="2" fill="#FF8A80" opacity="0.4"/>
      <path d="M50 48 Q44 36 38 38 Q32 40 38 48 Q42 54 50 46 Q58 54 62 48 Q68 40 62 38 Q56 36 50 48 Z" fill="#FF4081" stroke="#C2185B" stroke-width="1.5"/>
      <path d="M50 48 Q44 36 38 38 Q35 39 38 44" fill="#FCE4EC" opacity="0.4" stroke="none"/>
      <circle cx="50" cy="36" r="3" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
    </svg>`;
  },
  // 백 퀸 — 하츄핑: 별 머리띠, 큰 눈, 리본
  wQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#C2185B" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="22" ry="20" fill="#F48FB1" stroke="#C2185B" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="18" ry="14" fill="#FCE4EC" opacity="0.5"/>
      <circle cx="42" cy="62" r="5" fill="#C2185B"/>
      <circle cx="58" cy="62" r="5" fill="#C2185B"/>
      <circle cx="43.2" cy="60.8" r="2" fill="#fff"/>
      <circle cx="59.2" cy="60.8" r="2" fill="#fff"/>
      <path d="M46 74 Q50 78 54 74" stroke="#C2185B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="70" rx="4" ry="2" fill="#FF8A80" opacity="0.4"/>
      <ellipse cx="62" cy="70" rx="4" ry="2" fill="#FF8A80" opacity="0.4"/>
      <polygon points="50,38 52,44 58,44 53,48 55,54 50,50 45,54 47,48 42,44 48,44" fill="#FFD93D" stroke="#F9A825" stroke-width="1.5"/>
      <path d="M34 52 Q28 46 22 48 Q26 52 30 54" fill="#FF80AB" stroke="#C2185B" stroke-width="1.5"/>
      <path d="M66 52 Q72 46 78 48 Q74 52 70 54" fill="#FF80AB" stroke="#C2185B" stroke-width="1.5"/>
    </svg>`;
  },
  // 백 룩 — 방패핑: 둥근 방패 모양, 하트 문양
  wR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="#C2185B" opacity="0.2"/>
      <ellipse cx="50" cy="64" rx="26" ry="24" fill="#F48FB1" stroke="#C2185B" stroke-width="2.5"/>
      <ellipse cx="50" cy="60" rx="22" ry="18" fill="#FCE4EC" opacity="0.5"/>
      <circle cx="42" cy="60" r="4" fill="#C2185B"/>
      <circle cx="58" cy="60" r="4" fill="#C2185B"/>
      <circle cx="43" cy="59" r="1.5" fill="#fff"/>
      <circle cx="59" cy="59" r="1.5" fill="#fff"/>
      <path d="M46 70 Q50 73 54 70" stroke="#C2185B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M50 48 Q46 42 43 43 Q40 44 43 48 Q45 51 50 47 Q55 51 57 48 Q60 44 57 43 Q54 42 50 48 Z" fill="#FF4081" stroke="#C2185B" stroke-width="1"/>
      <rect x="24" y="38" width="52" height="4" rx="2" fill="#F48FB1" stroke="#C2185B" stroke-width="1.5"/>
      <rect x="28" y="32" width="8" height="8" rx="2" fill="#F48FB1" stroke="#C2185B" stroke-width="1.5"/>
      <rect x="44" y="30" width="12" height="10" rx="2" fill="#F48FB1" stroke="#C2185B" stroke-width="1.5"/>
      <rect x="64" y="32" width="8" height="8" rx="2" fill="#F48FB1" stroke="#C2185B" stroke-width="1.5"/>
    </svg>`;
  },
  // 백 비숍 — 마법핑: 마법 지팡이, 별 장식
  wB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#C2185B" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#F48FB1" stroke="#C2185B" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#FCE4EC" opacity="0.5"/>
      <circle cx="44" cy="64" r="3.5" fill="#C2185B"/>
      <circle cx="56" cy="64" r="3.5" fill="#C2185B"/>
      <circle cx="44.8" cy="63.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="63.2" r="1.3" fill="#fff"/>
      <path d="M47 74 Q50 77 53 74" stroke="#C2185B" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="70" rx="3" ry="1.5" fill="#FF8A80" opacity="0.4"/>
      <ellipse cx="60" cy="70" rx="3" ry="1.5" fill="#FF8A80" opacity="0.4"/>
      <path d="M50 48 Q46 38 50 28 Q54 38 50 48 Z" fill="#F48FB1" stroke="#C2185B" stroke-width="2"/>
      <path d="M50 48 Q47 40 50 32" fill="#FCE4EC" opacity="0.4" stroke="none"/>
      <polygon points="50,18 52,24 58,24 53,27 55,33 50,30 45,33 47,27 42,24 48,24" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <circle cx="42" cy="20" r="2" fill="#FF80AB" opacity="0.6"/>
      <circle cx="58" cy="22" r="1.5" fill="#FF80AB" opacity="0.5"/>
    </svg>`;
  },
  // 백 나이트 — 날개핑: 큰 날개, 날렵한 몸
  wN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#C2185B" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#F48FB1" stroke="#C2185B" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#FCE4EC" opacity="0.5"/>
      <circle cx="44" cy="62" r="4" fill="#C2185B"/>
      <circle cx="56" cy="62" r="4" fill="#C2185B"/>
      <circle cx="44.8" cy="61.2" r="1.5" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.5" fill="#fff"/>
      <path d="M46 74 Q50 77 54 74" stroke="#C2185B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="70" rx="3.5" ry="1.8" fill="#FF8A80" opacity="0.4"/>
      <ellipse cx="60" cy="70" rx="3.5" ry="1.8" fill="#FF8A80" opacity="0.4"/>
      <path d="M30 64 Q16 48 20 36 Q24 28 30 34 Q34 40 32 52 L30 64 Z" fill="#FF80AB" stroke="#C2185B" stroke-width="2"/>
      <path d="M30 64 Q16 48 20 36 Q22 30 26 32" fill="#FCE4EC" opacity="0.4" stroke="none"/>
      <path d="M70 64 Q84 48 80 36 Q76 28 70 34 Q66 40 68 52 L70 64 Z" fill="#FF80AB" stroke="#C2185B" stroke-width="2"/>
      <path d="M70 64 Q84 48 80 36 Q78 30 74 32" fill="#FCE4EC" opacity="0.4" stroke="none"/>
      <ellipse cx="50" cy="50" rx="4" ry="3" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
    </svg>`;
  },
  // 백 폰 — 꼬마핑: 작고 둥근 몸, 작은 하트
  wP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="20" ry="5" fill="#C2185B" opacity="0.2"/>
      <ellipse cx="50" cy="66" rx="18" ry="22" fill="#F48FB1" stroke="#C2185B" stroke-width="2.5"/>
      <ellipse cx="50" cy="62" rx="14" ry="16" fill="#FCE4EC" opacity="0.5"/>
      <circle cx="44" cy="62" r="3.5" fill="#C2185B"/>
      <circle cx="56" cy="62" r="3.5" fill="#C2185B"/>
      <circle cx="44.8" cy="61.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.3" fill="#fff"/>
      <path d="M47 72 Q50 75 53 72" stroke="#C2185B" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="68" rx="3" ry="1.5" fill="#FF8A80" opacity="0.4"/>
      <ellipse cx="60" cy="68" rx="3" ry="1.5" fill="#FF8A80" opacity="0.4"/>
      <path d="M50 44 Q47 40 45 41 Q43 42 45 44 Q46 46 50 43 Q54 46 55 44 Q57 42 55 41 Q53 40 50 44 Z" fill="#FF4081" stroke="#C2185B" stroke-width="1"/>
    </svg>`;
  },
  // 흑 킹 — 다크핑: 다크 왕관, 보라 몸, 날개
  bK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#4527A0" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="22" ry="20" fill="#B39DDB" stroke="#4527A0" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="18" ry="14" fill="#EDE7F6" opacity="0.5"/>
      <path d="M28 66 Q20 58 24 52 Q28 56 32 62" fill="#B39DDB" stroke="#4527A0" stroke-width="2"/>
      <path d="M72 66 Q80 58 76 52 Q72 56 68 62" fill="#B39DDB" stroke="#4527A0" stroke-width="2"/>
      <circle cx="42" cy="64" r="4" fill="#4527A0"/>
      <circle cx="58" cy="64" r="4" fill="#4527A0"/>
      <circle cx="43" cy="63" r="1.5" fill="#fff"/>
      <circle cx="59" cy="63" r="1.5" fill="#fff"/>
      <path d="M44 74 Q50 70 56 74" stroke="#4527A0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M50 48 Q44 36 38 38 Q32 40 38 48 Q42 54 50 46 Q58 54 62 48 Q68 40 62 38 Q56 36 50 48 Z" fill="#7C4DFF" stroke="#4527A0" stroke-width="1.5"/>
      <path d="M50 48 Q44 36 38 38 Q35 39 38 44" fill="#EDE7F6" opacity="0.3" stroke="none"/>
      <polygon points="50,30 52,36 56,36 53,38 54,42 50,40 46,42 47,38 44,36 48,36" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
    </svg>`;
  },
  // 흑 퀸 — 그림자핑: 별 머리띠, 날카로운 눈
  bQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#4527A0" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="22" ry="20" fill="#B39DDB" stroke="#4527A0" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="18" ry="14" fill="#EDE7F6" opacity="0.5"/>
      <circle cx="42" cy="62" r="5" fill="#4527A0"/>
      <circle cx="58" cy="62" r="5" fill="#4527A0"/>
      <circle cx="43.2" cy="60.8" r="2" fill="#fff"/>
      <circle cx="59.2" cy="60.8" r="2" fill="#fff"/>
      <path d="M44 74 Q50 70 56 74" stroke="#4527A0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <polygon points="50,38 52,44 58,44 53,48 55,54 50,50 45,54 47,48 42,44 48,44" fill="#7C4DFF" stroke="#4527A0" stroke-width="1.5"/>
      <path d="M34 52 Q28 46 22 48 Q26 52 30 54" fill="#9575CD" stroke="#4527A0" stroke-width="1.5"/>
      <path d="M66 52 Q72 46 78 48 Q74 52 70 54" fill="#9575CD" stroke="#4527A0" stroke-width="1.5"/>
    </svg>`;
  },
  // 흑 룩 — 가시핑: 가시 달린 둥근 몸
  bR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="26" ry="5" fill="#4527A0" opacity="0.2"/>
      <ellipse cx="50" cy="64" rx="26" ry="24" fill="#B39DDB" stroke="#4527A0" stroke-width="2.5"/>
      <ellipse cx="50" cy="60" rx="22" ry="18" fill="#EDE7F6" opacity="0.5"/>
      <circle cx="42" cy="60" r="4" fill="#4527A0"/>
      <circle cx="58" cy="60" r="4" fill="#4527A0"/>
      <circle cx="43" cy="59" r="1.5" fill="#fff"/>
      <circle cx="59" cy="59" r="1.5" fill="#fff"/>
      <path d="M44 72 Q50 68 56 72" stroke="#4527A0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M50 48 Q46 42 43 43 Q40 44 43 48 Q45 51 50 47 Q55 51 57 48 Q60 44 57 43 Q54 42 50 48 Z" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
      <polygon points="30,50 24,44 28,42 32,48" fill="#B39DDB" stroke="#4527A0" stroke-width="1.5"/>
      <polygon points="50,40 50,32 52,32 52,40" fill="#B39DDB" stroke="#4527A0" stroke-width="1.5"/>
      <polygon points="70,50 76,44 72,42 68,48" fill="#B39DDB" stroke="#4527A0" stroke-width="1.5"/>
      <polygon points="36,42 32,34 36,34 38,40" fill="#B39DDB" stroke="#4527A0" stroke-width="1.5"/>
      <polygon points="64,42 68,34 64,34 62,40" fill="#B39DDB" stroke="#4527A0" stroke-width="1.5"/>
    </svg>`;
  },
  // 흑 비숍 — 마법다크핑: 어둠 지팡이, 달 장식
  bB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#4527A0" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#B39DDB" stroke="#4527A0" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#EDE7F6" opacity="0.5"/>
      <circle cx="44" cy="64" r="3.5" fill="#4527A0"/>
      <circle cx="56" cy="64" r="3.5" fill="#4527A0"/>
      <circle cx="44.8" cy="63.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="63.2" r="1.3" fill="#fff"/>
      <path d="M46 74 Q50 70 54 74" stroke="#4527A0" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M50 48 Q46 38 50 28 Q54 38 50 48 Z" fill="#B39DDB" stroke="#4527A0" stroke-width="2"/>
      <path d="M50 48 Q47 40 50 32" fill="#EDE7F6" opacity="0.4" stroke="none"/>
      <path d="M50 20 Q44 16 46 10 Q50 6 54 10 Q56 16 50 20 Z" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <circle cx="50" cy="14" r="4" fill="#FFD93D"/>
      <circle cx="52" cy="12" r="3" fill="#F9A825"/>
      <circle cx="58" cy="20" r="1.5" fill="#7C4DFF" opacity="0.6"/>
      <circle cx="42" cy="22" r="1" fill="#7C4DFF" opacity="0.5"/>
    </svg>`;
  },
  // 흑 나이트 — 다크날개핑: 박쥐 날개, 날렵한 몸
  bN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#4527A0" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#B39DDB" stroke="#4527A0" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#EDE7F6" opacity="0.5"/>
      <circle cx="44" cy="62" r="4" fill="#4527A0"/>
      <circle cx="56" cy="62" r="4" fill="#4527A0"/>
      <circle cx="44.8" cy="61.2" r="1.5" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.5" fill="#fff"/>
      <path d="M44 74 Q50 70 56 74" stroke="#4527A0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M30 64 Q14 44 18 32 Q20 26 26 30 Q30 34 30 44 L28 52 Q24 46 20 44" fill="#9575CD" stroke="#4527A0" stroke-width="2"/>
      <path d="M30 64 Q14 44 18 32 Q19 28 22 28" fill="#EDE7F6" opacity="0.3" stroke="none"/>
      <path d="M70 64 Q86 44 82 32 Q80 26 74 30 Q70 34 70 44 L72 52 Q76 46 80 44" fill="#9575CD" stroke="#4527A0" stroke-width="2"/>
      <path d="M70 64 Q86 44 82 32 Q81 28 78 28" fill="#EDE7F6" opacity="0.3" stroke="none"/>
      <ellipse cx="50" cy="50" rx="4" ry="3" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
    </svg>`;
  },
  // 흑 폰 — 다크꼬마핑: 작고 둥근 몸, 작은 다크하트
  bP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="20" ry="5" fill="#4527A0" opacity="0.2"/>
      <ellipse cx="50" cy="66" rx="18" ry="22" fill="#B39DDB" stroke="#4527A0" stroke-width="2.5"/>
      <ellipse cx="50" cy="62" rx="14" ry="16" fill="#EDE7F6" opacity="0.5"/>
      <circle cx="44" cy="62" r="3.5" fill="#4527A0"/>
      <circle cx="56" cy="62" r="3.5" fill="#4527A0"/>
      <circle cx="44.8" cy="61.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.3" fill="#fff"/>
      <path d="M46 72 Q50 68 54 72" stroke="#4527A0" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M50 44 Q47 40 45 41 Q43 42 45 44 Q46 46 50 43 Q54 46 55 44 Q57 42 55 41 Q53 40 50 44 Z" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
    </svg>`;
  }
};
