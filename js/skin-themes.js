// All new raster themes are free. The original IDs remain available for backup migration.
const FREE_SPRITE_THEMES = [
  {
    "id": "cosmic",
    "name": "우주 탐사대",
    "en": "Space Explorers",
    "effect": [
      "#6be6ff",
      "#ba93ff",
      "✦"
    ],
    "motion": "jet"
  },
  {
    "id": "dragon",
    "name": "드래곤 왕국",
    "en": "Dragon Kingdom",
    "effect": [
      "#5be3bc",
      "#ffb477",
      "✧"
    ],
    "motion": "wing"
  },
  {
    "id": "ocean",
    "name": "심해 왕국",
    "en": "Ocean Kingdom",
    "effect": [
      "#81edee",
      "#6caaff",
      "◌"
    ],
    "motion": "wave"
  },
  {
    "id": "forest",
    "name": "마법의 숲",
    "en": "Enchanted Forest",
    "effect": [
      "#8cdd93",
      "#ecc571",
      "❋"
    ],
    "motion": "leaf"
  },
  {
    "id": "animals",
    "name": "동물 기사단",
    "en": "Animal Knights",
    "effect": [
      "#ffd088",
      "#a4baff",
      "✦"
    ],
    "motion": "pounce"
  },
  {
    "id": "sweets",
    "name": "과자 왕국",
    "en": "Candy Kingdom",
    "effect": [
      "#ffacc8",
      "#d8b0ff",
      "✧"
    ],
    "motion": "bounce"
  },
  {
    "id": "elements",
    "name": "얼음과 불꽃",
    "en": "Ice and Ember",
    "effect": [
      "#a6efff",
      "#ff9e64",
      "✦"
    ],
    "motion": "element"
  },
  {
    "id": "egypt",
    "name": "고대 이집트",
    "en": "Ancient Egypt",
    "effect": [
      "#f6d16e",
      "#67cce7",
      "✧"
    ],
    "motion": "sand"
  },
  {
    "id": "ghosts",
    "name": "유령의 성",
    "en": "Friendly Ghost Castle",
    "effect": [
      "#b8ffd9",
      "#c5a8ff",
      "✧"
    ],
    "motion": "float"
  },
  {
    "id": "origami",
    "name": "종이접기 왕국",
    "en": "Origami Kingdom",
    "effect": [
      "#ffd8a0",
      "#96c4ff",
      "◇"
    ],
    "motion": "fold"
  }
];
for (const theme of FREE_SPRITE_THEMES) {
  SPRITE_SKINS[theme.id]={atlas:'icons/skins/'+theme.id+'/atlas.webp',effect:theme.effect,motion:theme.motion};
  SKIN_META[theme.id]={nameKey:'skin_'+theme.id};
  I18N.ko['skin_'+theme.id]=theme.name;I18N.en['skin_'+theme.id]=theme.en;
  SKIN_UNLOCK[theme.id]=0;
  SKINS[theme.id]=Object.fromEntries(['w','b'].flatMap(side=>ROYAL_COLUMNS.map(type=>[side+type,size=>royalPieceSVG(side+type,size,'idle',theme.id)])));
}
SKIN_ORDER.splice(1,0,...FREE_SPRITE_THEMES.map(t=>t.id));
