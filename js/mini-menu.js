function goMiniMenu(){leaveActivity();showScreen('mini');renderMiniMenu();}
function renderMiniMenu(){
  const games=[
    ['goKnightSetup()','♞','나이트 투어','갈림길을 살피고 모든 칸을 방문해요','mini-green'],
    ['goDefense(0)','🏰','성 지키기','다음 발자국을 보고 상대 말을 잡아요','mini-blue'],
    ['goPuzzleLevelSelect()','💡','한 수 발견','말 잡기 · 왕 구하기 · 메이트','mini-purple'],
    ['goCollector(0)','⭐','별 모으기','느긋하게 길을 찾고, 원하면 이동 수 도전','mini-orange'],
    ['goSurvival(0)','🛡','왕 지키기','상대의 다음 움직임을 보고 안전하게','mini-red'],
    ['goBomb(0)','💣','이동 수 도전','움직일 순서를 계획하는 선택 도전','mini-orange'],
  ];
  document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="showScreen('home');renderHome()">← 홈</button><h2>놀이터</h2></div><div class="menu-grid">${games.map(([action,icon,name,desc,color])=>`<button class="menu-btn ${color}" onclick="${action}"><span class="menu-icon">${icon}</span><span class="menu-label">${name}<span class="menu-sub">${desc}</span></span><span>›</span></button>`).join('')}</div></div>`;
}
