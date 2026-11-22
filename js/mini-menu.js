let miniMenuCategory='explore';
function goMiniMenu(){leaveActivity();showScreen('mini');renderMiniMenu(miniMenuCategory);}
function renderMiniMenu(category=miniMenuCategory){
  const restoreFocus=!!document.activeElement?.closest?.('.collection-tabs');
  state.miniOrigin='mini';
  const groups=[
    ['새로운 도전', [['solo',uiIcon('target',28),'잡아서 하나 남기기','잡는 순서를 찾아 한 말만 남겨요 · 12판','mini-purple'],['challenge',uiIcon('pencil',28),'내가 만든 도전장','나이트 경로를 만들고 가족에게 건네봐요','mini-blue']]],
    ['탐험과 발견',[
      ['knight',uiIcon('flag',28),'기사의 여행','나이트 투어 · 산책부터 전체 투어 · 규칙 문제 10판','mini-green'],
      ['puzzle',uiIcon('search',28),'한 수 발견','말 잡기 · 왕 구하기 · 메이트','mini-purple']]],
    ['길찾기',[['collector',uiIcon('star',28),'별 모으기','기본 · 이동 제한 없이 별까지 가요','mini-orange'],['bomb',uiIcon('target',28),'이동 수 도전','선택 도전 · 각 목표의 남은 수를 보고 순서를 계획해요','mini-orange']]],
    ['잡기와 안전',[['defense',uiIcon('shield',28),'성 지키기','화살표 발자국을 보고 연습 말을 잡아요','mini-blue'],['survival',uiIcon('shield',28),'왕 지키기','다음 공격을 피해 깃발을 모아요','mini-red']]],
  ];
  const categories=[['explore','탐험과 발견'],['challenge','새로운 도전'],['path','길찾기'],['safety','잡기와 안전'],['match','대전 놀이']];
  if(!categories.some(([id])=>id===category))category='explore';
  miniMenuCategory=category;
  const order=['challenge','explore','path','safety'];
  document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap browse-screen">${browseHeading('mini','놀이터','놀다 보면,<br>생각이 반짝.')}<div class="collection-tabs" role="group" aria-label="놀이 종류">${categories.map(([id,label])=>`<button aria-pressed="${id===category}" onclick="renderMiniMenu('${id}')">${label}</button>`).join('')}</div>${groups.map(([title,games],i)=>`<section class="activity-group" ${order[i]===category?'':'hidden'}><h3>${title}</h3><div class="menu-grid">${games.map(([kind,icon,name,desc,color])=>{const saved=activitySaved(kind);return `<div class="activity-menu-item"><button class="menu-btn menu-row ${color}" onclick="enterActivity('${kind}')"><span class="menu-icon" aria-hidden="true">${icon}</span><span class="menu-label"><span class="menu-title">${name}</span><span class="menu-sub">${saved?'<b class="menu-saved">▶ 이어하기</b> ':''}${desc}</span></span></button>${saved?`<button class="text-button" onclick="pickNewActivity('${kind}')">새 판 고르기</button>`:''}</div>`;}).join('')}</div></section>`).join('')}<div class="mini-match-collection" ${category==='match'?'':'hidden'}>${playContentMenuHTML()}</div></div>`;
  if(restoreFocus)document.querySelector('#screen-mini .collection-tabs [aria-pressed="true"]')?.focus?.({preventScroll:true});
}
