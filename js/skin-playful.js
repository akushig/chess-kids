// Five character-first styles; these deliberately avoid classical chess pedestals.
const PLAYFUL_SPRITE_THEMES = [
  {
    "id": "plush",
    "name": "봉제인형 친구들",
    "en": "Plush Pals",
    "effect": [
      "#ffadba",
      "#65bac6",
      "♡"
    ],
    "motion": "plush",
    "playful": true,
    "styleLabel": "보송보송 인형 · 무료"
  },
  {
    "id": "jelly",
    "name": "말랑 젤리 놀이터",
    "en": "Jelly Playground",
    "effect": [
      "#ff9f7e",
      "#8dc9ff",
      "○"
    ],
    "motion": "jelly",
    "playful": true,
    "styleLabel": "탱글탱글 젤리 · 무료"
  },
  {
    "id": "crayon",
    "name": "크레용 낙서대장",
    "en": "Crayon Club",
    "effect": [
      "#ffb73f",
      "#60bee6",
      "✳"
    ],
    "motion": "doodle",
    "playful": true,
    "styleLabel": "쓱쓱 크레용 · 무료"
  },
  {
    "id": "motors",
    "name": "부릉부릉 자동차",
    "en": "Little Motor Town",
    "effect": [
      "#ffc04f",
      "#6ccce1",
      "✿"
    ],
    "motion": "motor",
    "playful": true,
    "styleLabel": "알록달록 자동차 · 무료"
  },
  {
    "id": "clouds",
    "name": "몽글몽글 구름나라",
    "en": "Cloud Cuddles",
    "effect": [
      "#ffc8a8",
      "#a4c6ff",
      "☁"
    ],
    "motion": "cloud",
    "playful": true,
    "styleLabel": "포근한 수채화 · 무료"
  }
];
registerSpriteThemes(PLAYFUL_SPRITE_THEMES);
FREE_SPRITE_THEMES.unshift(...PLAYFUL_SPRITE_THEMES);
