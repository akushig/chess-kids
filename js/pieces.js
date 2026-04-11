// ===== 기물 스킨 시스템 =====
// 추후 스킨 추가 시 SKINS 객체에 새 키만 추가하면 됨

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

// ===== cute 스킨 (기본) =====
const SKINS = {
  cute: {
    // 백 킹
    wK(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="58" r="32" fill="#FFD93D" stroke="#E8A317" stroke-width="3"/>
        <circle cx="50" cy="52" r="26" fill="#FFF3B0"/>
        <circle cx="40" cy="48" r="5" fill="#333"/>
        <circle cx="60" cy="48" r="5" fill="#333"/>
        <circle cx="41.5" cy="46.5" r="1.8" fill="#fff"/>
        <circle cx="61.5" cy="46.5" r="1.8" fill="#fff"/>
        <ellipse cx="50" cy="58" rx="6" ry="3" fill="#FF9AA2" opacity="0.5"/>
        <path d="M44 62 Q50 67 56 62" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <polygon points="50,18 46,30 54,30" fill="#FFD93D" stroke="#E8A317" stroke-width="2"/>
        <circle cx="50" cy="16" r="4" fill="#FF6B6B" stroke="#E8A317" stroke-width="1.5"/>
        <line x1="38" y1="28" x2="34" y2="22" stroke="#E8A317" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="62" y1="28" x2="66" y2="22" stroke="#E8A317" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    },
    // 백 퀸
    wQ(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="58" r="32" fill="#FF9FF3" stroke="#C44DFF" stroke-width="3"/>
        <circle cx="50" cy="52" r="26" fill="#FFD6F7"/>
        <circle cx="40" cy="48" r="5" fill="#333"/>
        <circle cx="60" cy="48" r="5" fill="#333"/>
        <circle cx="41.5" cy="46.5" r="1.8" fill="#fff"/>
        <circle cx="61.5" cy="46.5" r="1.8" fill="#fff"/>
        <ellipse cx="50" cy="58" rx="6" ry="3" fill="#FF9AA2" opacity="0.5"/>
        <path d="M44 62 Q50 67 56 62" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M30 30 L38 38 L42 24 L50 36 L58 24 L62 38 L70 30 L65 42 L35 42 Z" fill="#FF9FF3" stroke="#C44DFF" stroke-width="2"/>
        <circle cx="30" cy="28" r="3.5" fill="#FFD93D" stroke="#C44DFF" stroke-width="1.5"/>
        <circle cx="50" cy="22" r="3.5" fill="#FFD93D" stroke="#C44DFF" stroke-width="1.5"/>
        <circle cx="70" cy="28" r="3.5" fill="#FFD93D" stroke="#C44DFF" stroke-width="1.5"/>
      </svg>`;
    },
    // 백 룩
    wR(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <rect x="28" y="40" width="44" height="40" rx="8" fill="#74B9FF" stroke="#0984E3" stroke-width="3"/>
        <rect x="28" y="40" width="44" height="20" rx="8" fill="#A3D8FF"/>
        <circle cx="42" cy="52" r="5" fill="#333"/>
        <circle cx="58" cy="52" r="5" fill="#333"/>
        <circle cx="43.5" cy="50.5" r="1.8" fill="#fff"/>
        <circle cx="59.5" cy="50.5" r="1.8" fill="#fff"/>
        <path d="M46 64 Q50 68 54 64" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M28 40 L28 28 L38 28 L38 34 L44 34 L44 28 L56 28 L56 34 L62 34 L62 28 L72 28 L72 40" fill="#74B9FF" stroke="#0984E3" stroke-width="2.5"/>
      </svg>`;
    },
    // 백 비숍
    wB(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="58" r="30" fill="#55EFC4" stroke="#00B894" stroke-width="3"/>
        <circle cx="50" cy="52" r="24" fill="#A3FFE0"/>
        <circle cx="42" cy="50" r="5" fill="#333"/>
        <circle cx="58" cy="50" r="5" fill="#333"/>
        <circle cx="43.5" cy="48.5" r="1.8" fill="#fff"/>
        <circle cx="59.5" cy="48.5" r="1.8" fill="#fff"/>
        <path d="M45 62 Q50 66 55 62" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy="30" rx="10" ry="14" fill="#55EFC4" stroke="#00B894" stroke-width="2.5"/>
        <circle cx="50" cy="20" r="4" fill="#FFD93D" stroke="#00B894" stroke-width="1.5"/>
        <line x1="50" y1="26" x2="50" y2="38" stroke="#00B894" stroke-width="2"/>
      </svg>`;
    },
    // 백 나이트
    wN(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="62" rx="28" ry="24" fill="#FFEAA7" stroke="#FDCB6E" stroke-width="3"/>
        <ellipse cx="50" cy="56" rx="22" ry="20" fill="#FFF5CC"/>
        <circle cx="42" cy="50" r="5" fill="#333"/>
        <circle cx="56" cy="50" r="5" fill="#333"/>
        <circle cx="43.5" cy="48.5" r="1.8" fill="#fff"/>
        <circle cx="57.5" cy="48.5" r="1.8" fill="#fff"/>
        <path d="M46 62 Q50 66 54 62" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="44" cy="32" rx="6" ry="14" fill="#FFEAA7" stroke="#FDCB6E" stroke-width="2" transform="rotate(-15 44 32)"/>
        <ellipse cx="56" cy="32" rx="6" ry="14" fill="#FFEAA7" stroke="#FDCB6E" stroke-width="2" transform="rotate(15 56 32)"/>
        <ellipse cx="44" cy="28" rx="4" ry="8" fill="#FFD6E0" transform="rotate(-15 44 28)"/>
        <ellipse cx="56" cy="28" rx="4" ry="8" fill="#FFD6E0" transform="rotate(15 56 28)"/>
      </svg>`;
    },
    // 백 폰
    wP(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="56" r="26" fill="#DFE6E9" stroke="#B2BEC3" stroke-width="3"/>
        <circle cx="50" cy="50" r="20" fill="#F0F3F5"/>
        <circle cx="43" cy="48" r="4" fill="#333"/>
        <circle cx="57" cy="48" r="4" fill="#333"/>
        <circle cx="44.2" cy="46.5" r="1.5" fill="#fff"/>
        <circle cx="58.2" cy="46.5" r="1.5" fill="#fff"/>
        <path d="M45 57 Q50 61 55 57" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy="58" rx="5" ry="2.5" fill="#FF9AA2" opacity="0.4"/>
        <circle cx="50" cy="30" r="8" fill="#DFE6E9" stroke="#B2BEC3" stroke-width="2.5"/>
      </svg>`;
    },
    // 흑 킹
    bK(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="58" r="32" fill="#636E72" stroke="#2D3436" stroke-width="3"/>
        <circle cx="50" cy="52" r="26" fill="#808E93"/>
        <circle cx="40" cy="48" r="5" fill="#FFD93D"/>
        <circle cx="60" cy="48" r="5" fill="#FFD93D"/>
        <circle cx="41.5" cy="46.5" r="1.8" fill="#333"/>
        <circle cx="61.5" cy="46.5" r="1.8" fill="#333"/>
        <path d="M44 62 Q50 67 56 62" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
        <polygon points="50,18 46,30 54,30" fill="#636E72" stroke="#2D3436" stroke-width="2"/>
        <circle cx="50" cy="16" r="4" fill="#FF6B6B" stroke="#2D3436" stroke-width="1.5"/>
        <line x1="38" y1="28" x2="34" y2="22" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="62" y1="28" x2="66" y2="22" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    },
    // 흑 퀸
    bQ(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="58" r="32" fill="#A29BFE" stroke="#6C5CE7" stroke-width="3"/>
        <circle cx="50" cy="52" r="26" fill="#C8C3FF"/>
        <circle cx="40" cy="48" r="5" fill="#FFD93D"/>
        <circle cx="60" cy="48" r="5" fill="#FFD93D"/>
        <circle cx="41.5" cy="46.5" r="1.8" fill="#333"/>
        <circle cx="61.5" cy="46.5" r="1.8" fill="#333"/>
        <path d="M44 62 Q50 67 56 62" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M30 30 L38 38 L42 24 L50 36 L58 24 L62 38 L70 30 L65 42 L35 42 Z" fill="#A29BFE" stroke="#6C5CE7" stroke-width="2"/>
        <circle cx="30" cy="28" r="3.5" fill="#FFD93D" stroke="#6C5CE7" stroke-width="1.5"/>
        <circle cx="50" cy="22" r="3.5" fill="#FFD93D" stroke="#6C5CE7" stroke-width="1.5"/>
        <circle cx="70" cy="28" r="3.5" fill="#FFD93D" stroke="#6C5CE7" stroke-width="1.5"/>
      </svg>`;
    },
    // 흑 룩
    bR(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <rect x="28" y="40" width="44" height="40" rx="8" fill="#636E72" stroke="#2D3436" stroke-width="3"/>
        <rect x="28" y="40" width="44" height="20" rx="8" fill="#808E93"/>
        <circle cx="42" cy="52" r="5" fill="#FFD93D"/>
        <circle cx="58" cy="52" r="5" fill="#FFD93D"/>
        <circle cx="43.5" cy="50.5" r="1.8" fill="#333"/>
        <circle cx="59.5" cy="50.5" r="1.8" fill="#333"/>
        <path d="M46 64 Q50 68 54 64" stroke="#FFD93D" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M28 40 L28 28 L38 28 L38 34 L44 34 L44 28 L56 28 L56 34 L62 34 L62 28 L72 28 L72 40" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
      </svg>`;
    },
    // 흑 비숍
    bB(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="58" r="30" fill="#636E72" stroke="#2D3436" stroke-width="3"/>
        <circle cx="50" cy="52" r="24" fill="#808E93"/>
        <circle cx="42" cy="50" r="5" fill="#55EFC4"/>
        <circle cx="58" cy="50" r="5" fill="#55EFC4"/>
        <circle cx="43.5" cy="48.5" r="1.8" fill="#333"/>
        <circle cx="59.5" cy="48.5" r="1.8" fill="#333"/>
        <path d="M45 62 Q50 66 55 62" stroke="#55EFC4" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy="30" rx="10" ry="14" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
        <circle cx="50" cy="20" r="4" fill="#55EFC4" stroke="#2D3436" stroke-width="1.5"/>
        <line x1="50" y1="26" x2="50" y2="38" stroke="#2D3436" stroke-width="2"/>
      </svg>`;
    },
    // 흑 나이트
    bN(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <ellipse cx="50" cy="62" rx="28" ry="24" fill="#636E72" stroke="#2D3436" stroke-width="3"/>
        <ellipse cx="50" cy="56" rx="22" ry="20" fill="#808E93"/>
        <circle cx="42" cy="50" r="5" fill="#FFEAA7"/>
        <circle cx="56" cy="50" r="5" fill="#FFEAA7"/>
        <circle cx="43.5" cy="48.5" r="1.8" fill="#333"/>
        <circle cx="57.5" cy="48.5" r="1.8" fill="#333"/>
        <path d="M46 62 Q50 66 54 62" stroke="#FFEAA7" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="44" cy="32" rx="6" ry="14" fill="#636E72" stroke="#2D3436" stroke-width="2" transform="rotate(-15 44 32)"/>
        <ellipse cx="56" cy="32" rx="6" ry="14" fill="#636E72" stroke="#2D3436" stroke-width="2" transform="rotate(15 56 32)"/>
        <ellipse cx="44" cy="28" rx="4" ry="8" fill="#A29BFE" transform="rotate(-15 44 28)"/>
        <ellipse cx="56" cy="28" rx="4" ry="8" fill="#A29BFE" transform="rotate(15 56 28)"/>
      </svg>`;
    },
    // 흑 폰
    bP(s) {
      return `<svg viewBox="0 0 100 100" width="${s}" height="${s}">
        <circle cx="50" cy="56" r="26" fill="#636E72" stroke="#2D3436" stroke-width="3"/>
        <circle cx="50" cy="50" r="20" fill="#808E93"/>
        <circle cx="43" cy="48" r="4" fill="#DFE6E9"/>
        <circle cx="57" cy="48" r="4" fill="#DFE6E9"/>
        <circle cx="44.2" cy="46.5" r="1.5" fill="#333"/>
        <circle cx="58.2" cy="46.5" r="1.5" fill="#333"/>
        <path d="M45 57 Q50 61 55 57" stroke="#DFE6E9" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="30" r="8" fill="#636E72" stroke="#2D3436" stroke-width="2.5"/>
      </svg>`;
    }
  }
};
