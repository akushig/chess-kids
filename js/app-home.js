// Home keeps three destinations; detailed choices live in their own collections.
function renderHome() {
  if(state.activeKind)leaveActivity();
  state.miniOrigin='home';
  const saved=getSavedSession(),profile=profileInfo();
  const resume=saved&&!saved.complete&&SESSION_KEYS[saved.kind];
  const recommendation=recommendedActivity(),showCard=resume||!recommendation.fallback;
  const nextSkin=readData('pending_skin',null),stars=getAllStars(),name=profileText(profile.name),title=workshopTitle(),fresh=readData('workshop_new',null);
  const play=homeEntryDetail('play'),knight=homeEntryDetail('knight'),learn=homeEntryDetail('mission');
  document.getElementById('screen-home').innerHTML=`<main class="home-wrap">
    ${window.chessUpdateReady?'<button class="new-skin-card" onclick="applyAppUpdate()">새 버전이 있어요 · 저장하고 업데이트</button>':''}
    <header class="home-topbar"><div class="brand-lockup"><span class="brand-mark">${uiIcon('flag',25)}</span><span>${t('appName')}<small>작은 한 수, 큰 세상</small></span></div><div class="home-top-actions"><button class="home-chip home-stars" onclick="goReward()" aria-label="내 별 ${stars}개와 완료 기록">${uiIcon('star',20)} <b>${stars}</b></button><button class="profile-button home-profile" onclick="openFamilySettings()" aria-label="프로필 · 설정 · ${name}"><span class="home-avatar" aria-hidden="true">${profile.icon}</span><span class="home-profile-name">${name}</span>${uiIcon('settings',18)}</button></div></header>
    ${browseNav('home')}
    <section class="home-hero" aria-labelledby="home-hero-title"><div class="hero-copy"><p class="eyebrow">어서 와요, 작은 체스 기사님</p><h1 id="home-hero-title">한 수씩,<br>더 멋진 생각.</h1><p class="hero-description">배우고, 도전하고, 함께 즐기는<br>나만의 체스 시간</p><button class="hero-play" onclick="goPlay()">${uiIcon('play',21)} 체스 대전${play.saved?' 이어하기':''}</button>${play.saved?`<small class="hero-save-detail">${play.desc}</small>`:''}</div><div class="hero-art" aria-hidden="true"><div class="hero-orbit"></div><div class="hero-checker"></div><span class="hero-piece hero-piece-rook">${getPieceSVGForSkin('royal','bR',115)}</span><span class="hero-piece hero-piece-knight">${getPieceSVGForSkin('royal','wN',190)}</span><span class="hero-art-star">✦</span></div></section>
    ${showCard?`<button class="resume-card" onclick="${resume?'resumeActivity()':recommendation.action}"><span class="resume-icon" aria-hidden="true">${uiIcon(resume?'play':'flag')}</span><span class="resume-text"><strong>${resume?'이어서 놀기':recommendation.title}</strong><small>${resume?ACTIVITY_NAMES[saved.kind]+' · 하던 판이 기다리고 있어요.':recommendation.description}</small></span><span class="card-verb">계속</span></button>`:''}
    ${ongoingActivities().length?'<button class="text-button home-saved-all" onclick="openSavedActivities()">하던 놀이 모두 보기</button>':''}
    ${netHomeCardHTML()}
    <section class="home-primary" aria-labelledby="home-primary-title"><div class="section-heading"><h2 id="home-primary-title">오늘은 무엇을 해볼까요?</h2><span>마음 가는 곳부터 시작해요</span></div><div class="home-destinations">
      <button class="destination-card destination-study" onclick="goStudy()"><span class="feature-icon">${uiIcon('book',28)}</span><strong>차근차근 배우기</strong><span>첫걸음부터 체스 수업, 승급까지</span><small>${learn.saved?learn.desc:'체스가 처음이어도 괜찮아요'}</small></button>
      <button class="destination-card destination-games" onclick="goMiniMenu()"><span class="feature-icon">${uiIcon('game',28)}</span><strong>마음껏 놀기</strong><span>탐험과 퍼즐이 가득한 놀이터</span><small>생각하는 재미를 발견해요</small></button>
    </div></section>
    <section class="home-secondary"><button class="knight-spotlight" onclick="enterActivity('knight')"><span class="spotlight-art" aria-hidden="true">${getPieceSVGForSkin('royal','wN',64)}</span><span><small>오늘의 탐험 · 나이트 투어</small><strong>기사의 여행</strong><span>${knight.saved?'<b class="menu-saved">▶ 이어하기</b> ':''}${knight.desc}</span></span><span class="card-verb">${knight.saved?'계속':'탐험'}</span></button></section>
    <section class="home-personal" aria-label="나의 체스"><button onclick="goWorkshop()">${uiIcon('palette')}<span><strong>나의 체스 공방</strong><small>말과 체스판 꾸미기</small></span></button><button onclick="goReward()">${uiIcon('medal')}<span><strong>내가 모은 기록</strong><small>별 ${stars}개 · 배움의 발자국</small></span></button></section>
    <button class="home-title-chip" onclick="goWorkshop('title')" aria-label="내 칭호 ${title.name} · 공방에서 바꾸기">${uiIcon('sprout',16)} ${title.name}</button>
    ${nextSkin?`<button class="new-skin-card" onclick="safeStore.removeItem('pending_skin');openSkinDetail('${nextSkin}')">새로운 꾸미기를 얻었어요! 지금 입혀보기</button>`:''}${Array.isArray(fresh)&&fresh.length?`<button class="new-skin-card" onclick="goWorkshop()">공방에 새 꾸미기: ${fresh.map(profileText).join(', ')}</button>`:''}
    <footer class="app-version">어린이체스 · 나만의 속도로, 즐겁게 <span>v${APP_VERSION}</span></footer></main>`;
}
// Each primary entry says what one tap will do: continue its own saved board or begin.
function homeEntryDetail(kind){
  const saved=activitySaved(kind),open=saved&&!saved.complete,v=open?saved.snapshot.values:null;
  if(kind==='play')return {saved:open,desc:open?playSavedDetail(v.play):'컴퓨터 10단계 · 가족과 함께 두기'};
  if(kind==='knight')return {saved:open,desc:open?knightSavedDetail(v.kt):'나이트 투어 · 모든 칸을 한 번씩'};
  const next=MISSIONS.R.findIndex((m,i)=>!m.optional&&!isMissionCleared('R',i));
  return {saved:open,desc:open?`${t(PIECE_NAMES[v.missionPiece])} ${v.missionIdx+1}단계 · 모험`:next>=0?'룩부터 말 움직임을 한 걸음씩':'배우고 싶은 말을 골라요'};
}
// ===== 스킨 컬렉션 모달 =====
function openSkinSelector() {
  const allStars = getAllStars();
  const cards = SKIN_ORDER.filter(name => typeof workshopSkinVisible !== 'function' || workshopSkinVisible(name)).map(name => {
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

  showActivityDialog(t('skinSelectTitle'),`<p>모든 말 스킨을 무료로 선택할 수 있어요.</p>${nextHint}<div class="skin-grid">${cards}</div>`,[{label:'꾸미기 마치기',action:()=>{}}],'skin-overlay');
}

// ===== 스킨 상세보기 모달 =====
function openSkinDetail(name, fromWorkshop = false) {
  if (!workshopSkinVisible(name)) return;
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

  showActivityDialog(t(meta.nameKey),`${SPRITE_SKINS[name]?'<p>백·흑 킹·퀸·룩·비숍·나이트·폰 12종을 모두 살펴보세요.</p>':''}<div class="detail-grid">${grid}</div><div class="detail-action">${actionBtn}</div>`,[fromWorkshop?{label:'공방으로 돌아가기',action:()=>{}}:{label:'다른 꾸미기 보기',action:openSkinSelector}],'skin-detail-overlay');
}

function closeSkinDetail(){closeActivityDialog();openSkinSelector();}

function selectSkin(name) {
  setSkin(name);
  closeSkinDetail();
  closeSkinSelector();
  renderHome();
}

function closeSkinSelector(){closeActivityDialog();}
