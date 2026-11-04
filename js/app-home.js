// Home emphasizes a real saved game and three purposes: learn, play, compete.
function renderHome() {
  if(state.activeKind)leaveActivity();
  const saved=getSavedSession(),profile=profileInfo();
  const titles={mission:'모험',puzzle:'한 수 발견',play:'체스 대전',knight:'나이트 탐험',collector:'별 모으기',bomb:'이동 수 도전',defense:'성 지키기',survival:'왕 지키기'};
  const resume=saved&&!saved.complete&&SESSION_KEYS[saved.kind];
  const experience=readData('experience',null);
  const nextR=MISSIONS.R.findIndex((m,i)=>!isMissionCleared('R',i));
  const recommendation=recommendedActivity(),recommend=recommendation.action;
  const nextSkin=readData('pending_skin',null);
  document.getElementById('screen-home').innerHTML=`<div class="home-wrap">
    ${window.chessUpdateReady?'<button class="new-skin-card" onclick="applyAppUpdate()">새 버전이 있어요 · 저장하고 업데이트</button>':''}<div class="home-topbar"><button class="profile-button" onclick="openFamilySettings()">${profile.icon} ${profile.name}</button><button class="profile-button" onclick="openSkinSelector()">🎨 내 꾸미기</button></div>
    <div class="app-title">${t('appName')}</div><div class="home-greeting">움직이고, 발견하고, 함께 두어요.</div>
    ${!experience&&!resume?`<section class="experience-picker" aria-label="어디서 시작할까요"><h2>어디서 시작할까요?</h2><button class="action-btn green" onclick="chooseExperience('beginner',true)">🚩 처음 해요 · 룩과 시작</button><button class="action-btn secondary" onclick="chooseExperience('familiar',true)">♟ 조금 알아요 · 놀이 고르기</button><button class="text-button" onclick="chooseExperience('challenge',true)">🏆 도전하고 싶어요</button></section>`:''}
    <button class="resume-card" onclick="${resume?'resumeActivity()':recommend}"><span class="resume-icon">${resume?'▶':'🚩'}</span><span><strong>${resume?'이어서 놀기':recommendation.title}</strong><small>${resume?titles[saved.kind]+' · 하던 판이 기다리고 있어요.':recommendation.description}</small></span><span>›</span></button>
    ${ongoingActivities().length?'<button class="text-button" onclick="openSavedActivities()">📚 하던 놀이 모두 보기</button>':''}<div class="menu-grid">${[
      ['goAdventure()','🗺','모험','말의 움직임부터 왕 구하기까지','menu-adventure'],
      ['goMiniMenu()','🎲','놀이터','나이트 탐험 · 성 지키기 · 한 수 발견','menu-mini'],
      ['goPlay()','♟','대전','도움을 받으며, 컴퓨터와, 가족과','menu-play'],
    ].map(([action,icon,title,desc,color])=>`<button class="menu-btn ${color}" onclick="${action}"><span class="menu-icon">${icon}</span><span class="menu-label">${title}<span class="menu-sub">${desc}</span></span><span class="menu-arrow">›</span></button>`).join('')}</div>
    ${nextSkin?`<button class="new-skin-card" onclick="safeStore.removeItem('pending_skin');openSkinDetail('${nextSkin}')">🎁 새로운 꾸미기를 얻었어요! 지금 입혀보기</button>`:''}
    <button class="star-bar" onclick="goReward()" aria-label="내 별과 완료 기록">⭐ ${getAllStars()} <small>내가 모은 별</small></button>
    <button class="text-button" onclick="openFamilySettings()">👪 가족 · 소리 · 도움 설정</button><div class="app-version">v${APP_VERSION}</div></div>`;
}
function chooseExperience(value,start=false){
  if(!['beginner','familiar','challenge'].includes(value))return;
  writeData('experience',value);
  if(!start)return renderHome();
  if(value==='beginner')enterActivity('mission');else if(value==='challenge')goPlay();else goMiniMenu();
}
function profileInfo(id=activeProfile){return ({child:{icon:'🧒',name:'내 모험'},sibling:{icon:'🐱',name:'다른 가족'},adult:{icon:'🧑',name:'어른의 도전'}})[id]||{icon:'🧒',name:'내 모험'};}
function switchProfile(id){
  if(!['child','sibling','adult'].includes(id))return;
  leaveActivity();activeProfile=id;try{localStorage.setItem('chess_active_profile',id);}catch{}
  if(id==='adult'&&!readData('experience',null))writeData('experience','challenge');
  currentSkin=safeStore.getItem('skin')||(id==='adult'?'classic':'cute');applyPreferences();state.game=null;state.play=null;
  closeActivityDialog();showScreen('home');renderHome();
}
function openFamilySettings(){
  const prefs=readData('preferences',{}),p=progressLedger(),done=Object.keys(p.completions||{}).length;
  showActivityDialog('함께 쓰는 체스',`<p>각자 하던 판과 별을 따로 간직해요.</p><div class="profile-list">${['child','sibling','adult'].map(id=>`<button class="profile-button ${id===activeProfile?'active':''}" onclick="switchProfile('${id}')">${profileInfo(id).icon} ${profileInfo(id).name} ${id===activeProfile?'✓':''}</button>`).join('')}</div>${learningSummaryHTML()}<div class="experience-options"><p>추천 난이도 (활동을 잠그지 않아요)</p>${[['beginner','처음 해요'],['familiar','조금 알아요'],['challenge','도전하고 싶어요']].map(([v,label])=>`<button class="play-chip" aria-pressed="${readData('experience','beginner')===v}" onclick="writeData('experience','${v}');openFamilySettings()">${label}</button>`).join('')}</div><p class="section-note">${done}개 활동 완료 · 예전에 모은 별과 꾸미기도 보관해요.</p><div class="play-options"><button class="play-chip" onclick="setPreference('voice',${!prefs.voice})">🔊 자동 안내 읽기 ${prefs.voice?'켜짐':'꺼짐'}</button><button class="play-chip" onclick="setPreference('motion',${prefs.motion===false})">움직임 ${prefs.motion===false?'적게':'보통'}</button><button class="play-chip" onclick="setPreference('badges',${prefs.badges===false})">말 이름 ${prefs.badges===false?'숨김':'보임'}</button></div><p class="section-note">도움은 대전 설정에서 조절할 수 있어요. 부모가 먼저 시범을 보여주거나 나이트를 번갈아 해보세요.</p>`,[{label:'설정 마치기',action:()=>{}}],'family-overlay');
}
function setPreference(key,value){const p=readData('preferences',{});p[key]=value;writeData('preferences',p);applyPreferences();openFamilySettings();}
function applyPreferences(){document.documentElement?.classList.toggle('reduced-motion',readData('preferences',{}).motion===false);}

// ===== 스킨 컬렉션 모달 =====
function openSkinSelector() {
  const allStars = getAllStars();
  const cards = SKIN_ORDER.map(name => {
    const meta = SKIN_META[name];
    const isActive = currentSkin === name;
    const unlocked = isSkinUnlocked(name);
    const required = SKIN_UNLOCK[name] || 0;
    const preview = ['wK','wQ','wR','bK','bQ','bR'].map(p =>
      `<div class="skin-piece-cell">${getPieceSVGForSkin(name, p, 28)}</div>`
    ).join('');

    let badge = '';
    if (isActive) badge = `<div class="skin-badge skin-badge-active">${t('skinCurrent')}</div>`;
    else if (!unlocked) badge = `<div class="skin-badge skin-badge-locked">${t('skinLocked')}</div>`;

    let progress = '';
    if (!unlocked) {
      const pct = Math.min(100, Math.round(allStars / required * 100));
      progress = `<div class="skin-progress-wrap">
        <div class="skin-progress-bar"><div class="skin-progress-fill" style="width:${pct}%"></div></div>
        <div class="skin-progress-text">⭐ ${allStars}/${required}</div>
      </div>`;
    }

    return `
      <button class="skin-card ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}"
        onclick="openSkinDetail('${name}')">
        <div class="skin-preview">${preview}</div>
        <div class="skin-name">${t(meta.nameKey)}</div>
        ${badge}
        ${progress}
      </button>
    `;
  }).join('');

  const next = getNextLockedSkin();
  const nextHint = next ? `<div class="skin-next-hint">⭐ ${next.remaining}${t('rewardStarsNeeded')} → ${t(SKIN_META[next.name].nameKey)}</div>` : '';

  showActivityDialog(t('skinSelectTitle'),`<p>⭐ ${allStars} · 놀이로 모은 별로 꾸며요.</p>${nextHint}<div class="skin-grid">${cards}</div>`,[{label:'꾸미기 마치기',action:()=>{}}],'skin-overlay');
}

// ===== 스킨 상세보기 모달 =====
function openSkinDetail(name) {
  closeSkinSelector();
  const meta = SKIN_META[name];
  const isActive = currentSkin === name;
  const unlocked = isSkinUnlocked(name);
  const required = SKIN_UNLOCK[name] || 0;
  const allStars = getAllStars();
  const pieces = ['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'];
  const pieceNames = {wK:t('pieceKing'),wQ:t('pieceQueen'),wR:t('pieceRook'),wB:t('pieceBishop'),wN:t('pieceKnight'),wP:t('piecePawn'),
    bK:t('pieceKing'),bQ:t('pieceQueen'),bR:t('pieceRook'),bB:t('pieceBishop'),bN:t('pieceKnight'),bP:t('piecePawn')};

  const grid = pieces.map(p => `
    <div class="detail-piece">
      <div class="detail-piece-svg">${getPieceSVGForSkin(name, p, 52)}</div>
      <div class="detail-piece-label">${p[0]==='w'?'⬜':'⬛'} ${pieceNames[p]}</div>
    </div>
  `).join('');

  let actionBtn;
  if (!unlocked) {
    const pct = Math.min(100, Math.round(allStars / required * 100));
    actionBtn = `<div class="detail-lock-info">
      <div class="detail-lock-icon">🔒</div>
      <div class="detail-lock-text">${t('skinUnlockAt').replace('{n}', required)}</div>
      <div class="skin-progress-wrap" style="width:80%;margin:6px auto 0">
        <div class="skin-progress-bar" style="height:6px"><div class="skin-progress-fill" style="width:${pct}%"></div></div>
        <div class="skin-progress-text" style="font-size:0.72rem">⭐ ${allStars} / ${required}</div>
      </div>
    </div>`;
  } else if (isActive) {
    actionBtn = `<div class="skin-badge skin-badge-active" style="font-size:16px;padding:8px 20px">${t('skinCurrent')}</div>`;
  } else {
    actionBtn = `<button class="detail-equip-btn" onclick="selectSkin('${name}')">${t('skinEquip')}</button>`;
  }

  showActivityDialog(t(meta.nameKey),`<div class="detail-grid">${grid}</div><div class="detail-action">${actionBtn}</div>`,[{label:'다른 꾸미기 보기',action:openSkinSelector}],'skin-detail-overlay');
}

function closeSkinDetail(){closeActivityDialog();openSkinSelector();}

function selectSkin(name) {
  setSkin(name);
  closeSkinDetail();
  closeSkinSelector();
  renderHome();
}

function closeSkinSelector(){closeActivityDialog();}
