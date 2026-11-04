// Home: the global continue card, then three activities people come for, then every other game.
function renderHome() {
  if(state.activeKind)leaveActivity();
  state.miniOrigin='home';
  const saved=getSavedSession(),profile=profileInfo();
  const resume=saved&&!saved.complete&&SESSION_KEYS[saved.kind];
  // Generic suggestions repeat the entries below; only a next step after a finished activity is shown.
  const recommendation=recommendedActivity(),showCard=resume||!recommendation.fallback;
  const nextSkin=readData('pending_skin',null);
  const entry=(action,icon,title,desc,color,saved)=>`<button class="menu-btn ${color}" onclick="${action}"><span class="menu-icon" aria-hidden="true">${icon}</span><span class="menu-label">${title}<span class="menu-sub">${saved?'<b class="menu-saved">▶ 이어하기</b> ':''}${desc}</span></span><span class="menu-arrow" aria-hidden="true">›</span></button>`;
  const play=homeEntryDetail('play'),knight=homeEntryDetail('knight'),learn=homeEntryDetail('mission');
  document.getElementById('screen-home').innerHTML=`<div class="home-wrap">
    ${window.chessUpdateReady?'<button class="new-skin-card" onclick="applyAppUpdate()">새 버전이 있어요 · 저장하고 업데이트</button>':''}<div class="home-topbar"><button class="profile-button" onclick="openFamilySettings()">${profile.icon} ${profileText(profile.name)}</button><button class="profile-button" onclick="openSkinSelector()">🎨 내 꾸미기</button></div>
    <div class="app-title">${t('appName')}</div><div class="home-greeting">움직이고, 발견하고, 함께 두어요.</div>
    ${showCard?`<button class="resume-card" onclick="${resume?'resumeActivity()':recommendation.action}"><span class="resume-icon">${resume?'▶':'🚩'}</span><span><strong>${resume?'이어서 놀기':recommendation.title}</strong><small>${resume?ACTIVITY_NAMES[saved.kind]+' · 하던 판이 기다리고 있어요.':recommendation.description}</small></span><span>›</span></button>`:''}
    ${ongoingActivities().length?'<button class="text-button" onclick="openSavedActivities()">📚 하던 놀이 모두 보기</button>':''}
    <section class="home-primary" aria-labelledby="home-primary-title"><h2 id="home-primary-title" class="home-section-title">무엇을 할까요?</h2><div class="menu-grid">
      ${entry('goPlay()',getPieceSVG('wK',42),'체스 대전',play.desc,'menu-play',play.saved)}
      ${entry("enterActivity('knight')",getPieceSVG('wN',42),'기사의 여행 · <span class="nowrap">나이트 투어</span>',knight.desc,'menu-knight',knight.saved)}
      ${entry("enterActivity('mission')",'🚩','체스 처음 배우기',learn.desc,'menu-adventure',learn.saved)}
    </div></section>
    <nav class="home-secondary" aria-label="다른 놀이"><button class="home-more" onclick="goMiniMenu()"><span aria-hidden="true">🎲</span><span><strong>놀이터 · 전체 놀이</strong><small>한 수 발견 · 별 모으기 · 성 지키기 · 왕 지키기</small></span></button><button class="home-more" onclick="goAdventure()"><span aria-hidden="true">🗺</span><span><strong>모험 지도</strong><small>여섯 가지 말을 골라 배워요</small></span></button></nav>
    ${nextSkin?`<button class="new-skin-card" onclick="safeStore.removeItem('pending_skin');openSkinDetail('${nextSkin}')">🎁 새로운 꾸미기를 얻었어요! 지금 입혀보기</button>`:''}
    <button class="star-bar" onclick="goReward()" aria-label="내 별과 완료 기록">⭐ ${getAllStars()} <small>내가 모은 별</small></button>
    <button class="text-button" onclick="openFamilySettings()">👤 프로필 · 설정</button><div class="app-version">v${APP_VERSION}</div></div>`;
}
// Each primary entry says what one tap will do: continue its own saved board or begin.
function homeEntryDetail(kind){
  const saved=activitySaved(kind),open=saved&&!saved.complete,v=open?saved.snapshot.values:null;
  if(kind==='play')return {saved:open,desc:open?playSavedDetail(v.play):'컴퓨터와 10단계 · 같은 기기에서 함께 두기'};
  if(kind==='knight')return {saved:open,desc:open?knightSavedDetail(v.kt):'모든 칸을 한 번씩 · 산책부터 전체 투어·규칙 문제까지'};
  const next=MISSIONS.R.findIndex((m,i)=>!m.optional&&!isMissionCleared('R',i));
  return {saved:open,desc:open?`${t(PIECE_NAMES[v.missionPiece])} ${v.missionIdx+1}단계 · 모험`:next>=0?'룩부터 말 움직임을 한 걸음씩':'배우고 싶은 말을 모험 지도에서 골라요'};
}
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
