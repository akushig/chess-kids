// ===== 기물 스킨 시스템 =====
let currentSkin = localStorage.getItem('skin') || 'cute';

function setSkin(name) {
  if (SKINS[name]) {
    currentSkin = name;
    localStorage.setItem('skin', name);
  }
}

function getPieceSVG(piece, size) {
  size = size || 40;
  const skin = SKINS[currentSkin] || SKINS['cute'];
  const fn = skin[piece];
  return fn ? fn(size) : '';
}

function getPieceSVGForSkin(skinName, piece, size) {
  size = size || 40;
  const skin = SKINS[skinName];
  if (!skin) return '';
  const fn = skin[piece];
  return fn ? fn(size) : '';
}

const SKIN_META = {
  cute:        { nameKey: 'skinCute' },
  classic:     { nameKey: 'skinClassic' },
  hellocarbot: { nameKey: 'skinHellocarbot' },
  dino:        { nameKey: 'skinDino' },
};

const SKIN_ORDER = ['cute', 'classic', 'hellocarbot', 'dino'];

// ===== cute 스킨 — 체스 기물 실루엣 + 귀여운 얼굴 =====
const SKINS = {
  cute: {
    // 백 킹 — 십자가 왕관
    wK(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="30" ry="8" fill="#E8A317" opacity="0.3"/>
        <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 85 Z" fill="#FFD93D" stroke="#E8A317" stroke-width="2.5"/>
        <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 65 Q50 58 25 65 Z" fill="#FFF3B0"/>
        <rect x="47" y="10" width="6" height="18" rx="3" fill="#FFD93D" stroke="#E8A317" stroke-width="2"/>
        <rect x="40" y="14" width="20" height="6" rx="3" fill="#FFD93D" stroke="#E8A317" stroke-width="2"/>
        <circle cx="50" cy="10" r="4" fill="#FF6B6B"/>
        <circle cx="40" cy="58" r="4.5" fill="#333"/>
        <circle cx="60" cy="58" r="4.5" fill="#333"/>
        <circle cx="41.5" cy="56.5" r="1.8" fill="#fff"/>
        <circle cx="61.5" cy="56.5" r="1.8" fill="#fff"/>
        <path d="M44 68 Q50 73 56 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="36" cy="64" rx="4" ry="2.5" fill="#FF9AA2" opacity="0.4"/>
        <ellipse cx="64" cy="64" rx="4" ry="2.5" fill="#FF9AA2" opacity="0.4"/>
      </svg>`;
    },
    // 백 퀸 — 뾰족 왕관 + 보석
    wQ(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="30" ry="8" fill="#C44DFF" opacity="0.3"/>
        <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 85 Z" fill="#FF9FF3" stroke="#C44DFF" stroke-width="2.5"/>
        <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 62 Q50 55 22 62 Z" fill="#FFD6F7"/>
        <path d="M22 40 L15 18 L30 32 L40 12 L50 30 L60 12 L70 32 L85 18 L78 40 Z" fill="#FF9FF3" stroke="#C44DFF" stroke-width="2"/>
        <circle cx="15" cy="16" r="4" fill="#FFD93D" stroke="#C44DFF" stroke-width="1.5"/>
        <circle cx="40" cy="10" r="4" fill="#FF6B6B" stroke="#C44DFF" stroke-width="1.5"/>
        <circle cx="60" cy="10" r="4" fill="#55EFC4" stroke="#C44DFF" stroke-width="1.5"/>
        <circle cx="85" cy="16" r="4" fill="#74B9FF" stroke="#C44DFF" stroke-width="1.5"/>
        <circle cx="50" cy="28" r="4" fill="#FFD93D" stroke="#C44DFF" stroke-width="1.5"/>
        <circle cx="40" cy="58" r="4.5" fill="#333"/>
        <circle cx="60" cy="58" r="4.5" fill="#333"/>
        <circle cx="41.5" cy="56.5" r="1.8" fill="#fff"/>
        <circle cx="61.5" cy="56.5" r="1.8" fill="#fff"/>
        <path d="M44 68 Q50 73 56 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="36" cy="64" rx="4" ry="2.5" fill="#FF9AA2" opacity="0.4"/>
        <ellipse cx="64" cy="64" rx="4" ry="2.5" fill="#FF9AA2" opacity="0.4"/>
      </svg>`;
    },
    // 백 룩 — 성벽 탑
    wR(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="28" ry="8" fill="#0984E3" opacity="0.3"/>
        <path d="M28 85 L28 40 L72 40 L72 85 Z" fill="#74B9FF" stroke="#0984E3" stroke-width="2.5"/>
        <path d="M28 85 L28 40 L72 40 L72 60 Q50 52 28 60 Z" fill="#A3D8FF"/>
        <path d="M24 40 L24 22 L34 22 L34 30 L42 30 L42 22 L58 22 L58 30 L66 30 L66 22 L76 22 L76 40 Z" fill="#74B9FF" stroke="#0984E3" stroke-width="2.5"/>
        <rect x="24" y="38" width="52" height="6" rx="2" fill="#0984E3" opacity="0.3"/>
        <circle cx="42" cy="58" r="4.5" fill="#333"/>
        <circle cx="58" cy="58" r="4.5" fill="#333"/>
        <circle cx="43.5" cy="56.5" r="1.8" fill="#fff"/>
        <circle cx="59.5" cy="56.5" r="1.8" fill="#fff"/>
        <path d="M46 68 Q50 72 54 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`;
    },
    // 백 비숍 — 뾰족 모자 + 십자
    wB(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="26" ry="8" fill="#00B894" opacity="0.3"/>
        <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 85 Z" fill="#55EFC4" stroke="#00B894" stroke-width="2.5"/>
        <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 65 Q50 58 28 65 Z" fill="#A3FFE0"/>
        <path d="M50 40 Q42 28 44 18 Q46 8 50 5 Q54 8 56 18 Q58 28 50 40 Z" fill="#55EFC4" stroke="#00B894" stroke-width="2"/>
        <circle cx="50" cy="5" r="4" fill="#FFD93D" stroke="#00B894" stroke-width="1.5"/>
        <line x1="47" y1="22" x2="53" y2="22" stroke="#00B894" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="50" y1="18" x2="50" y2="28" stroke="#00B894" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="42" cy="58" r="4.5" fill="#333"/>
        <circle cx="58" cy="58" r="4.5" fill="#333"/>
        <circle cx="43.5" cy="56.5" r="1.8" fill="#fff"/>
        <circle cx="59.5" cy="56.5" r="1.8" fill="#fff"/>
        <path d="M45 68 Q50 72 55 68" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`;
    },
    // 백 나이트 — 말 머리 실루엣
    wN(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="28" ry="8" fill="#FDCB6E" opacity="0.3"/>
        <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 85 Z" fill="#FFEAA7" stroke="#FDCB6E" stroke-width="2.5"/>
        <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 62 Q50 55 28 62 Z" fill="#FFF5CC"/>
        <ellipse cx="38" cy="14" rx="5" ry="8" fill="#FFEAA7" stroke="#FDCB6E" stroke-width="2" transform="rotate(-20 38 14)"/>
        <ellipse cx="38" cy="12" rx="3" ry="5" fill="#FFD6E0" transform="rotate(-20 38 12)"/>
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
    // 백 폰 — 둥근 병사 헬멧
    wP(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="24" ry="7" fill="#B2BEC3" opacity="0.3"/>
        <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 85 Z" fill="#DFE6E9" stroke="#B2BEC3" stroke-width="2.5"/>
        <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 65 Q50 58 30 65 Z" fill="#F0F3F5"/>
        <circle cx="50" cy="30" r="16" fill="#DFE6E9" stroke="#B2BEC3" stroke-width="2.5"/>
        <circle cx="50" cy="28" r="12" fill="#F0F3F5"/>
        <circle cx="44" cy="27" r="3.5" fill="#333"/>
        <circle cx="56" cy="27" r="3.5" fill="#333"/>
        <circle cx="45.2" cy="25.8" r="1.3" fill="#fff"/>
        <circle cx="57.2" cy="25.8" r="1.3" fill="#fff"/>
        <path d="M46 34 Q50 37 54 34" stroke="#333" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy="35" rx="4" ry="2" fill="#FF9AA2" opacity="0.35"/>
      </svg>`;
    },
    // 흑 킹
    bK(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="30" ry="8" fill="#2D3436" opacity="0.3"/>
        <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 85 Z" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <path d="M25 85 L25 55 Q25 45 35 42 L40 40 L40 35 Q40 28 50 28 Q60 28 60 35 L60 40 L65 42 Q75 45 75 55 L75 65 Q50 58 25 65 Z" fill="#808E93"/>
        <rect x="47" y="10" width="6" height="18" rx="3" fill="#636E72" stroke="#2D3436" stroke-width="2"/>
        <rect x="40" y="14" width="20" height="6" rx="3" fill="#636E72" stroke="#2D3436" stroke-width="2"/>
        <circle cx="50" cy="10" r="4" fill="#FF6B6B"/>
        <circle cx="40" cy="58" r="4.5" fill="#FFD93D"/>
        <circle cx="60" cy="58" r="4.5" fill="#FFD93D"/>
        <circle cx="41.5" cy="56.5" r="1.8" fill="#333"/>
        <circle cx="61.5" cy="56.5" r="1.8" fill="#333"/>
        <path d="M44 68 Q50 73 56 68" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`;
    },
    // 흑 퀸
    bQ(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="30" ry="8" fill="#6C5CE7" opacity="0.3"/>
        <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 85 Z" fill="#A29BFE" stroke="#6C5CE7" stroke-width="2.5"/>
        <path d="M22 85 L22 50 Q22 42 32 40 L68 40 Q78 42 78 50 L78 62 Q50 55 22 62 Z" fill="#C8C3FF"/>
        <path d="M22 40 L15 18 L30 32 L40 12 L50 30 L60 12 L70 32 L85 18 L78 40 Z" fill="#A29BFE" stroke="#6C5CE7" stroke-width="2"/>
        <circle cx="15" cy="16" r="4" fill="#FFD93D" stroke="#6C5CE7" stroke-width="1.5"/>
        <circle cx="40" cy="10" r="4" fill="#FF6B6B" stroke="#6C5CE7" stroke-width="1.5"/>
        <circle cx="60" cy="10" r="4" fill="#55EFC4" stroke="#6C5CE7" stroke-width="1.5"/>
        <circle cx="85" cy="16" r="4" fill="#74B9FF" stroke="#6C5CE7" stroke-width="1.5"/>
        <circle cx="50" cy="28" r="4" fill="#FFD93D" stroke="#6C5CE7" stroke-width="1.5"/>
        <circle cx="40" cy="58" r="4.5" fill="#FFD93D"/>
        <circle cx="60" cy="58" r="4.5" fill="#FFD93D"/>
        <circle cx="41.5" cy="56.5" r="1.8" fill="#333"/>
        <circle cx="61.5" cy="56.5" r="1.8" fill="#333"/>
        <path d="M44 68 Q50 73 56 68" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`;
    },
    // 흑 룩
    bR(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="28" ry="8" fill="#2D3436" opacity="0.3"/>
        <path d="M28 85 L28 40 L72 40 L72 85 Z" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <path d="M28 85 L28 40 L72 40 L72 60 Q50 52 28 60 Z" fill="#808E93"/>
        <path d="M24 40 L24 22 L34 22 L34 30 L42 30 L42 22 L58 22 L58 30 L66 30 L66 22 L76 22 L76 40 Z" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <rect x="24" y="38" width="52" height="6" rx="2" fill="#2D3436" opacity="0.3"/>
        <circle cx="42" cy="58" r="4.5" fill="#FFD93D"/>
        <circle cx="58" cy="58" r="4.5" fill="#FFD93D"/>
        <circle cx="43.5" cy="56.5" r="1.8" fill="#333"/>
        <circle cx="59.5" cy="56.5" r="1.8" fill="#333"/>
        <path d="M46 68 Q50 72 54 68" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`;
    },
    // 흑 비숍
    bB(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="26" ry="8" fill="#2D3436" opacity="0.3"/>
        <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 85 Z" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <path d="M28 85 L32 48 Q32 40 50 40 Q68 40 68 48 L72 65 Q50 58 28 65 Z" fill="#808E93"/>
        <path d="M50 40 Q42 28 44 18 Q46 8 50 5 Q54 8 56 18 Q58 28 50 40 Z" fill="#636E72" stroke="#2D3436" stroke-width="2"/>
        <circle cx="50" cy="5" r="4" fill="#55EFC4" stroke="#2D3436" stroke-width="1.5"/>
        <line x1="47" y1="22" x2="53" y2="22" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="50" y1="18" x2="50" y2="28" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="42" cy="58" r="4.5" fill="#55EFC4"/>
        <circle cx="58" cy="58" r="4.5" fill="#55EFC4"/>
        <circle cx="43.5" cy="56.5" r="1.8" fill="#333"/>
        <circle cx="59.5" cy="56.5" r="1.8" fill="#333"/>
        <path d="M45 68 Q50 72 55 68" stroke="#55EFC4" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`;
    },
    // 흑 나이트
    bN(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="28" ry="8" fill="#2D3436" opacity="0.3"/>
        <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 85 Z" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <path d="M28 85 L28 55 Q28 45 38 42 L38 35 Q35 20 42 12 Q48 5 55 8 L62 12 Q72 18 72 30 L72 42 Q78 45 78 55 L78 62 Q50 55 28 62 Z" fill="#808E93"/>
        <ellipse cx="38" cy="14" rx="5" ry="8" fill="#636E72" stroke="#2D3436" stroke-width="2" transform="rotate(-20 38 14)"/>
        <ellipse cx="38" cy="12" rx="3" ry="5" fill="#A29BFE" transform="rotate(-20 38 12)"/>
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
    // 흑 폰
    bP(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="82" rx="24" ry="7" fill="#2D3436" opacity="0.3"/>
        <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 85 Z" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <path d="M30 85 L34 50 Q34 42 50 42 Q66 42 66 50 L70 65 Q50 58 30 65 Z" fill="#808E93"/>
        <circle cx="50" cy="30" r="16" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <circle cx="50" cy="28" r="12" fill="#808E93"/>
        <circle cx="44" cy="27" r="3.5" fill="#DFE6E9"/>
        <circle cx="56" cy="27" r="3.5" fill="#DFE6E9"/>
        <circle cx="45.2" cy="25.8" r="1.3" fill="#333"/>
        <circle cx="57.2" cy="25.8" r="1.3" fill="#333"/>
        <path d="M46 34 Q50 37 54 34" stroke="#DFE6E9" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      </svg>`;
    }
  }
};
