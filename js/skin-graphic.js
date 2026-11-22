// Graphic media rather than sculpted sets or soft toy characters.
const GRAPHIC_SPRITE_THEMES = [
  {
    "id": "pixel",
    "name": "레트로 픽셀",
    "en": "Retro Pixels",
    "effect": [
      "#ffc761",
      "#65e9ff",
      "✦"
    ],
    "motion": "pixel",
    "styleLabel": "또렷한 픽셀 게임 · 무료"
  },
  {
    "id": "neon",
    "name": "네온 회로",
    "en": "Neon Circuits",
    "effect": [
      "#29e6ff",
      "#ff64cc",
      "✧"
    ],
    "motion": "neon",
    "styleLabel": "빛나는 회로 선화 · 무료"
  },
  {
    "id": "ink",
    "name": "수묵 붓그림",
    "en": "Inkbrush Chess",
    "effect": [
      "#c76943",
      "#6c88ba",
      "〰"
    ],
    "motion": "ink",
    "styleLabel": "여백이 있는 먹선 · 무료"
  },
  {
    "id": "tangram",
    "name": "탱그램 공작소",
    "en": "Tangram Workshop",
    "effect": [
      "#f9b94c",
      "#5ecdc2",
      "◇"
    ],
    "motion": "tangram",
    "styleLabel": "도형 조각 맞추기 · 무료"
  },
  {
    "id": "comic",
    "name": "팝아트 히어로",
    "en": "Pop Art Heroes",
    "effect": [
      "#ffb942",
      "#d89cff",
      "✷"
    ],
    "motion": "comic",
    "styleLabel": "강렬한 만화 인쇄 · 무료"
  }
];
registerSpriteThemes(GRAPHIC_SPRITE_THEMES);
FREE_SPRITE_THEMES.unshift(...GRAPHIC_SPRITE_THEMES);
