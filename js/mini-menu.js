function goMiniMenu(){leaveActivity();showScreen('mini');renderMiniMenu();}
function renderMiniMenu(){
  state.miniOrigin='mini';
  const groups=[
    ['새로운 도전', [['solo',getPieceSVG('wR',34),'잡아서 하나 남기기','잡는 순서를 찾아 한 말만 남겨요 · 12판','mini-purple'],['challenge','✏️','내가 만든 도전장','나이트 경로를 만들고 가족에게 건네봐요','mini-blue']]],
    ['탐험과 발견',[
      ['knight',getPieceSVG('wN',34),'기사의 여행','나이트 투어 · 산책부터 전체 투어 · 규칙 문제 10판','mini-green'],
      ['puzzle','💡','한 수 발견','말 잡기 · 왕 구하기 · 메이트','mini-purple']]],
    ['길찾기',[['collector','⭐','별 모으기','기본 · 이동 제한 없이 별까지 가요','mini-orange'],['bomb','🎯','이동 수 도전','선택 도전 · 각 목표의 남은 수를 보고 순서를 계획해요','mini-orange']]],
    ['잡기와 안전',[['defense','🏰','성 지키기','화살표 발자국을 보고 연습 말을 잡아요','mini-blue'],['survival','🛡','왕 지키기','다음 공격을 피해 깃발을 모아요','mini-red']]],
  ];
  document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="showScreen('home');renderHome()">← 홈</button><h2>놀이터</h2></div>${groups.map(([title,games])=>`<section class="activity-group"><h3>${title}</h3><div class="menu-grid">${games.map(([kind,icon,name,desc,color])=>{const saved=activitySaved(kind);return `<div class="activity-menu-item"><button class="menu-btn menu-row ${color}" onclick="enterActivity('${kind}')"><span class="menu-icon" aria-hidden="true">${icon}</span><span class="menu-label"><span class="menu-title">${name}</span><span class="menu-sub">${saved?'<b class="menu-saved">▶ 이어하기</b> ':''}${desc}</span></span><span class="menu-arrow" aria-hidden="true">›</span></button>${saved?`<button class="text-button" onclick="pickNewActivity('${kind}')">새 판 고르기</button>`:''}</div>`;}).join('')}</div></section>`).join('')}${playContentMenuHTML()}</div>`;
}
