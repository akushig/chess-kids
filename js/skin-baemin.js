// ===== baemin 스킨 — 배달의민족 캐릭터 테마 =====
// 백(나): 민트/하늘 계열 — 주색 #2AC1BC, 진한 #1A8A86, 밝은 #E0F7F6
// 흑(적): 다크/네이비 계열 — 주색 #3D4B5E, 진한 #1E2A3A, 밝은 #D5DCE6
SKINS.baemin = {
  // 백 킹 — 독고배달이: 둥근 얼굴, 배달 헬멧, 배달통
  wK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#1A8A86" opacity="0.2"/>
      <rect x="34" y="62" width="32" height="24" rx="6" fill="#2AC1BC" stroke="#1A8A86" stroke-width="2.5"/>
      <rect x="34" y="62" width="32" height="10" rx="6" fill="#E0F7F6" opacity="0.5"/>
      <rect x="40" y="72" width="20" height="12" rx="3" fill="#1A8A86" opacity="0.2"/>
      <circle cx="50" cy="44" r="20" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2.5"/>
      <circle cx="50" cy="42" r="15" fill="#FFF3E0" opacity="0.5"/>
      <circle cx="42" cy="44" r="3.5" fill="#333"/>
      <circle cx="58" cy="44" r="3.5" fill="#333"/>
      <circle cx="43" cy="43" r="1.3" fill="#fff"/>
      <circle cx="59" cy="43" r="1.3" fill="#fff"/>
      <path d="M46 52 Q50 55 54 52" stroke="#333" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="50" rx="4" ry="2" fill="#FF8A80" opacity="0.35"/>
      <ellipse cx="62" cy="50" rx="4" ry="2" fill="#FF8A80" opacity="0.35"/>
      <path d="M30 38 Q30 20 50 18 Q70 20 70 38" fill="#2AC1BC" stroke="#1A8A86" stroke-width="2.5"/>
      <path d="M30 38 Q30 24 50 22 Q70 24 70 32" fill="#E0F7F6" opacity="0.4" stroke="none"/>
      <rect x="44" y="14" width="12" height="6" rx="3" fill="#2AC1BC" stroke="#1A8A86" stroke-width="1.5"/>
      <circle cx="50" cy="17" r="2" fill="#FFD93D"/>
    </svg>`;
  },
  // 백 퀸 — 메이배달이: 둥근 얼굴, 리본, 큰 눈
  wQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#1A8A86" opacity="0.2"/>
      <rect x="34" y="62" width="32" height="24" rx="6" fill="#2AC1BC" stroke="#1A8A86" stroke-width="2.5"/>
      <rect x="34" y="62" width="32" height="10" rx="6" fill="#E0F7F6" opacity="0.5"/>
      <circle cx="50" cy="44" r="20" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2.5"/>
      <circle cx="50" cy="42" r="15" fill="#FFF3E0" opacity="0.5"/>
      <circle cx="42" cy="42" r="4.5" fill="#333"/>
      <circle cx="58" cy="42" r="4.5" fill="#333"/>
      <circle cx="43.2" cy="40.8" r="1.8" fill="#fff"/>
      <circle cx="59.2" cy="40.8" r="1.8" fill="#fff"/>
      <path d="M46 52 Q50 56 54 52" stroke="#333" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="50" rx="4" ry="2" fill="#FF8A80" opacity="0.4"/>
      <ellipse cx="62" cy="50" rx="4" ry="2" fill="#FF8A80" opacity="0.4"/>
      <path d="M42 26 Q36 18 30 20 Q28 22 32 26 Q36 30 42 28 Z" fill="#FF4081" stroke="#C2185B" stroke-width="1.5"/>
      <path d="M42 26 Q36 18 30 20 Q29 21 31 23" fill="#FF80AB" opacity="0.5" stroke="none"/>
      <path d="M42 26 Q36 32 30 30 Q28 28 32 24 Q36 20 42 26 Z" fill="#FF4081" stroke="#C2185B" stroke-width="1.5"/>
      <circle cx="42" cy="26" r="2" fill="#FFD93D"/>
    </svg>`;
  },
  // 백 룩 — 엉클배달이: 큰 둥근 몸, 콧수염, 배달통
  wR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="28" ry="5" fill="#1A8A86" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="26" ry="20" fill="#2AC1BC" stroke="#1A8A86" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="22" ry="14" fill="#E0F7F6" opacity="0.5"/>
      <circle cx="50" cy="40" r="18" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2.5"/>
      <circle cx="50" cy="38" r="13" fill="#FFF3E0" opacity="0.5"/>
      <circle cx="43" cy="38" r="3" fill="#333"/>
      <circle cx="57" cy="38" r="3" fill="#333"/>
      <circle cx="43.8" cy="37.2" r="1.2" fill="#fff"/>
      <circle cx="57.8" cy="37.2" r="1.2" fill="#fff"/>
      <path d="M44 46 Q46 44 48 46 Q50 48 52 46 Q54 44 56 46" stroke="#8D6E63" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M46 50 Q50 53 54 50" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <rect x="68" y="56" width="14" height="18" rx="4" fill="#2AC1BC" stroke="#1A8A86" stroke-width="2"/>
      <rect x="70" y="60" width="10" height="4" rx="1" fill="#E0F7F6" opacity="0.5"/>
    </svg>`;
  },
  // 백 비숍 — 왕이배달이: 강아지, 왕관, 둥근 몸
  wB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#1A8A86" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#FFF3E0" stroke="#E6A04C" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#FFFDE7" opacity="0.5"/>
      <circle cx="44" cy="62" r="3.5" fill="#333"/>
      <circle cx="56" cy="62" r="3.5" fill="#333"/>
      <circle cx="44.8" cy="61.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.3" fill="#fff"/>
      <ellipse cx="50" cy="68" rx="4" ry="3" fill="#333"/>
      <ellipse cx="50" cy="67" rx="2.5" ry="1.5" fill="#555"/>
      <path d="M46 74 Q50 77 54 74" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M32 56 Q26 42 30 34 Q34 38 36 48" fill="#FFF3E0" stroke="#E6A04C" stroke-width="2"/>
      <path d="M68 56 Q74 42 70 34 Q66 38 64 48" fill="#FFF3E0" stroke="#E6A04C" stroke-width="2"/>
      <rect x="44" y="42" width="3" height="6" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="49" y="40" width="3" height="8" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
      <rect x="54" y="42" width="3" height="6" rx="1" fill="#FFD93D" stroke="#F9A825" stroke-width="1"/>
    </svg>`;
  },
  // 백 나이트 — 냥이배달이: 고양이 귀, 수염, 둥근 몸
  wN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#1A8A86" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#FFF3E0" opacity="0.5"/>
      <circle cx="44" cy="62" r="3.5" fill="#333"/>
      <circle cx="56" cy="62" r="3.5" fill="#333"/>
      <circle cx="44.8" cy="61.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.3" fill="#fff"/>
      <ellipse cx="50" cy="68" rx="3" ry="2.5" fill="#FF8A80"/>
      <path d="M47 72 Q50 75 53 72" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <line x1="34" y1="64" x2="24" y2="60" stroke="#E6A04C" stroke-width="1.5"/>
      <line x1="34" y1="68" x2="24" y2="68" stroke="#E6A04C" stroke-width="1.5"/>
      <line x1="66" y1="64" x2="76" y2="60" stroke="#E6A04C" stroke-width="1.5"/>
      <line x1="66" y1="68" x2="76" y2="68" stroke="#E6A04C" stroke-width="1.5"/>
      <path d="M34 54 L28 36 L40 48 Z" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2"/>
      <path d="M34 54 L30 40 L36 48 Z" fill="#FF8A80" opacity="0.4"/>
      <path d="M66 54 L72 36 L60 48 Z" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2"/>
      <path d="M66 54 L70 40 L64 48 Z" fill="#FF8A80" opacity="0.4"/>
    </svg>`;
  },
  // 백 폰 — 딜리: 배달 로봇, 둥근 몸, 바퀴
  wP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="20" ry="4" fill="#1A8A86" opacity="0.2"/>
      <circle cx="38" cy="84" r="4" fill="#90A4AE" stroke="#607D8B" stroke-width="1.5"/>
      <circle cx="62" cy="84" r="4" fill="#90A4AE" stroke="#607D8B" stroke-width="1.5"/>
      <rect x="30" y="50" width="40" height="30" rx="8" fill="#2AC1BC" stroke="#1A8A86" stroke-width="2.5"/>
      <rect x="30" y="50" width="40" height="14" rx="8" fill="#E0F7F6" opacity="0.5"/>
      <circle cx="42" cy="62" r="4" fill="#333"/>
      <circle cx="58" cy="62" r="4" fill="#333"/>
      <circle cx="43" cy="61" r="1.5" fill="#4FC3F7"/>
      <circle cx="59" cy="61" r="1.5" fill="#4FC3F7"/>
      <rect x="44" y="68" width="12" height="4" rx="2" fill="#1A8A86" opacity="0.3"/>
      <rect x="42" y="40" width="16" height="12" rx="4" fill="#2AC1BC" stroke="#1A8A86" stroke-width="2"/>
      <rect x="42" y="40" width="16" height="5" rx="4" fill="#E0F7F6" opacity="0.4"/>
      <rect x="48" y="34" width="4" height="8" rx="2" fill="#2AC1BC" stroke="#1A8A86" stroke-width="1.5"/>
      <circle cx="50" cy="32" r="3" fill="#FFD93D" stroke="#1A8A86" stroke-width="1"/>
    </svg>`;
  },
  // 흑 킹 — 독고배달이(다크): 둥근 얼굴, 배달 헬멧, 배달통
  bK(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#1E2A3A" opacity="0.2"/>
      <rect x="34" y="62" width="32" height="24" rx="6" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="2.5"/>
      <rect x="34" y="62" width="32" height="10" rx="6" fill="#D5DCE6" opacity="0.5"/>
      <rect x="40" y="72" width="20" height="12" rx="3" fill="#1E2A3A" opacity="0.2"/>
      <circle cx="50" cy="44" r="20" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2.5"/>
      <circle cx="50" cy="42" r="15" fill="#FFF3E0" opacity="0.5"/>
      <circle cx="42" cy="44" r="3.5" fill="#333"/>
      <circle cx="58" cy="44" r="3.5" fill="#333"/>
      <circle cx="43" cy="43" r="1.3" fill="#fff"/>
      <circle cx="59" cy="43" r="1.3" fill="#fff"/>
      <path d="M44 52 Q50 48 56 52" stroke="#333" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M30 38 Q30 20 50 18 Q70 20 70 38" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="2.5"/>
      <path d="M30 38 Q30 24 50 22 Q70 24 70 32" fill="#D5DCE6" opacity="0.4" stroke="none"/>
      <rect x="44" y="14" width="12" height="6" rx="3" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="1.5"/>
      <circle cx="50" cy="17" r="2" fill="#E53935"/>
    </svg>`;
  },
  // 흑 퀸 — 메이배달이(다크): 둥근 얼굴, 리본, 큰 눈
  bQ(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="24" ry="5" fill="#1E2A3A" opacity="0.2"/>
      <rect x="34" y="62" width="32" height="24" rx="6" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="2.5"/>
      <rect x="34" y="62" width="32" height="10" rx="6" fill="#D5DCE6" opacity="0.5"/>
      <circle cx="50" cy="44" r="20" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2.5"/>
      <circle cx="50" cy="42" r="15" fill="#FFF3E0" opacity="0.5"/>
      <circle cx="42" cy="42" r="4.5" fill="#333"/>
      <circle cx="58" cy="42" r="4.5" fill="#333"/>
      <circle cx="43.2" cy="40.8" r="1.8" fill="#fff"/>
      <circle cx="59.2" cy="40.8" r="1.8" fill="#fff"/>
      <path d="M44 52 Q50 48 56 52" stroke="#333" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M42 26 Q36 18 30 20 Q28 22 32 26 Q36 30 42 28 Z" fill="#7C4DFF" stroke="#4527A0" stroke-width="1.5"/>
      <path d="M42 26 Q36 18 30 20 Q29 21 31 23" fill="#B39DDB" opacity="0.5" stroke="none"/>
      <path d="M42 26 Q36 32 30 30 Q28 28 32 24 Q36 20 42 26 Z" fill="#7C4DFF" stroke="#4527A0" stroke-width="1.5"/>
      <circle cx="42" cy="26" r="2" fill="#FFD93D"/>
    </svg>`;
  },
  // 흑 룩 — 엉클배달이(다크): 큰 둥근 몸, 콧수염
  bR(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="28" ry="5" fill="#1E2A3A" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="26" ry="20" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="22" ry="14" fill="#D5DCE6" opacity="0.5"/>
      <circle cx="50" cy="40" r="18" fill="#FFE0B2" stroke="#E6A04C" stroke-width="2.5"/>
      <circle cx="50" cy="38" r="13" fill="#FFF3E0" opacity="0.5"/>
      <circle cx="43" cy="38" r="3" fill="#333"/>
      <circle cx="57" cy="38" r="3" fill="#333"/>
      <circle cx="43.8" cy="37.2" r="1.2" fill="#fff"/>
      <circle cx="57.8" cy="37.2" r="1.2" fill="#fff"/>
      <path d="M44 46 Q46 44 48 46 Q50 48 52 46 Q54 44 56 46" stroke="#8D6E63" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M46 50 Q50 53 54 50" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <rect x="68" y="56" width="14" height="18" rx="4" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="2"/>
      <rect x="70" y="60" width="10" height="4" rx="1" fill="#D5DCE6" opacity="0.5"/>
    </svg>`;
  },
  // 흑 비숍 — 왕이배달이(다크): 강아지, 왕관
  bB(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#1E2A3A" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#D5DCE6" stroke="#90A4AE" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#ECEFF1" opacity="0.5"/>
      <circle cx="44" cy="62" r="3.5" fill="#333"/>
      <circle cx="56" cy="62" r="3.5" fill="#333"/>
      <circle cx="44.8" cy="61.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.3" fill="#fff"/>
      <ellipse cx="50" cy="68" rx="4" ry="3" fill="#333"/>
      <ellipse cx="50" cy="67" rx="2.5" ry="1.5" fill="#555"/>
      <path d="M46 74 Q50 77 54 74" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M32 56 Q26 42 30 34 Q34 38 36 48" fill="#D5DCE6" stroke="#90A4AE" stroke-width="2"/>
      <path d="M68 56 Q74 42 70 34 Q66 38 64 48" fill="#D5DCE6" stroke="#90A4AE" stroke-width="2"/>
      <rect x="44" y="42" width="3" height="6" rx="1" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
      <rect x="49" y="40" width="3" height="8" rx="1" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
      <rect x="54" y="42" width="3" height="6" rx="1" fill="#7C4DFF" stroke="#4527A0" stroke-width="1"/>
    </svg>`;
  },
  // 흑 나이트 — 냥이배달이(다크): 고양이 귀, 수염
  bN(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="#1E2A3A" opacity="0.2"/>
      <ellipse cx="50" cy="68" rx="20" ry="20" fill="#90A4AE" stroke="#607D8B" stroke-width="2.5"/>
      <ellipse cx="50" cy="64" rx="16" ry="14" fill="#CFD8DC" opacity="0.5"/>
      <circle cx="44" cy="62" r="3.5" fill="#333"/>
      <circle cx="56" cy="62" r="3.5" fill="#333"/>
      <circle cx="44.8" cy="61.2" r="1.3" fill="#fff"/>
      <circle cx="56.8" cy="61.2" r="1.3" fill="#fff"/>
      <ellipse cx="50" cy="68" rx="3" ry="2.5" fill="#FF8A80"/>
      <path d="M47 72 Q50 75 53 72" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <line x1="34" y1="64" x2="24" y2="60" stroke="#607D8B" stroke-width="1.5"/>
      <line x1="34" y1="68" x2="24" y2="68" stroke="#607D8B" stroke-width="1.5"/>
      <line x1="66" y1="64" x2="76" y2="60" stroke="#607D8B" stroke-width="1.5"/>
      <line x1="66" y1="68" x2="76" y2="68" stroke="#607D8B" stroke-width="1.5"/>
      <path d="M34 54 L28 36 L40 48 Z" fill="#90A4AE" stroke="#607D8B" stroke-width="2"/>
      <path d="M34 54 L30 40 L36 48 Z" fill="#FF8A80" opacity="0.4"/>
      <path d="M66 54 L72 36 L60 48 Z" fill="#90A4AE" stroke="#607D8B" stroke-width="2"/>
      <path d="M66 54 L70 40 L64 48 Z" fill="#FF8A80" opacity="0.4"/>
    </svg>`;
  },
  // 흑 폰 — 딜리(다크): 배달 로봇, 둥근 몸, 바퀴
  bP(s) {
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
      <ellipse cx="50" cy="88" rx="20" ry="4" fill="#1E2A3A" opacity="0.2"/>
      <circle cx="38" cy="84" r="4" fill="#607D8B" stroke="#37474F" stroke-width="1.5"/>
      <circle cx="62" cy="84" r="4" fill="#607D8B" stroke="#37474F" stroke-width="1.5"/>
      <rect x="30" y="50" width="40" height="30" rx="8" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="2.5"/>
      <rect x="30" y="50" width="40" height="14" rx="8" fill="#D5DCE6" opacity="0.5"/>
      <circle cx="42" cy="62" r="4" fill="#333"/>
      <circle cx="58" cy="62" r="4" fill="#333"/>
      <circle cx="43" cy="61" r="1.5" fill="#E53935"/>
      <circle cx="59" cy="61" r="1.5" fill="#E53935"/>
      <rect x="44" y="68" width="12" height="4" rx="2" fill="#1E2A3A" opacity="0.3"/>
      <rect x="42" y="40" width="16" height="12" rx="4" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="2"/>
      <rect x="42" y="40" width="16" height="5" rx="4" fill="#D5DCE6" opacity="0.4"/>
      <rect x="48" y="34" width="4" height="8" rx="2" fill="#3D4B5E" stroke="#1E2A3A" stroke-width="1.5"/>
      <circle cx="50" cy="32" r="3" fill="#E53935" stroke="#1E2A3A" stroke-width="1"/>
    </svg>`;
  }
};
