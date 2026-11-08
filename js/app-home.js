// Home: the global continue card, then three activities people come for, then every other game.
function renderHome() {
  if(state.activeKind)leaveActivity();
  state.miniOrigin='home';
  const saved=getSavedSession(),profile=profileInfo();
  const resume=saved&&!saved.complete&&SESSION_KEYS[saved.kind];
  // Generic suggestions repeat the entries below; only a next step after a finished activity is shown.
  const recommendation=recommendedActivity(),showCard=resume||!recommendation.fallback;
  const nextSkin=readData('pending_skin',null),stars=getAllStars(),name=profileText(profile.name),title=workshopTitle(),fresh=readData('workshop_new',null);
  // 모든 메뉴는 같은 모양: 아이콘 칸 + 제목 한 줄 + 설명(최대 두 줄, 높이 고정). 글이 길어도 카드 크기가 같다.
  const entry=(action,icon,title,desc,color,saved)=>`<button class="menu-btn ${color}" onclick="${action}"><span class="menu-icon" aria-hidden="true">${icon}</span><span class="menu-label"><span class="menu-title">${title}</span><span class="menu-sub">${saved?'<b class="menu-saved">▶ 이어하기</b> ':''}${desc}</span></span><span class="menu-arrow" aria-hidden="true">›</span></button>`;
  const more=(action,icon,title,desc,extra='')=>`<button class="home-more${extra}" onclick="${action}"><span class="home-more-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><small>${desc}</small></button>`;
  const play=homeEntryDetail('play'),knight=homeEntryDetail('knight'),learn=homeEntryDetail('mission');
  document.getElementById('screen-home').innerHTML=`<div class="home-wrap">
    ${window.chessUpdateReady?'<button class="new-skin-card" onclick="applyAppUpdate()">새 버전이 있어요 · 저장하고 업데이트</button>':''}<div class="home-topbar"><button class="profile-button home-profile" onclick="openFamilySettings()" aria-label="프로필 · 설정 · ${name}"><span class="home-avatar" aria-hidden="true">${profile.icon}</span><span class="home-profile-name">${name}</span><span class="home-gear" aria-hidden="true">⚙</span></button><div class="home-top-actions"><button class="home-chip home-stars" onclick="goReward()" aria-label="내 별 ${stars}개와 완료 기록">⭐ <b>${stars}</b></button><button class="home-chip" onclick="goWorkshop()" aria-label="🎨 나의 체스 공방">🎨<span class="home-chip-text">꾸미기</span></button></div></div>
    <div class="home-hero"><div class="app-title">${t('appName')}</div><button class="home-title-chip" onclick="goWorkshop('title')" aria-label="내 칭호 ${title.name} · 공방에서 바꾸기"><span aria-hidden="true">${title.icon}</span> ${title.name}</button></div>
    ${showCard?`<button class="resume-card" onclick="${resume?'resumeActivity()':recommendation.action}"><span class="resume-icon" aria-hidden="true">${resume?'▶':'🚩'}</span><span class="resume-text"><strong>${resume?'이어서 놀기':recommendation.title}</strong><small>${resume?ACTIVITY_NAMES[saved.kind]+' · 하던 판이 기다리고 있어요.':recommendation.description}</small></span><span class="menu-arrow" aria-hidden="true">›</span></button>`:''}
    ${ongoingActivities().length?'<button class="text-button home-saved-all" onclick="openSavedActivities()">📚 하던 놀이 모두 보기</button>':''}
    ${netHomeCardHTML()}
    <section class="home-primary" aria-labelledby="home-primary-title"><h2 id="home-primary-title" class="home-section-title">무엇을 할까요?</h2><div class="menu-grid">
      ${entry('goPlay()',getPieceSVG('wK',44),'체스 대전',play.desc,'menu-play',play.saved)}
      ${entry("enterActivity('knight')",getPieceSVG('wN',44),'기사의 여행',knight.desc,'menu-knight',knight.saved)}
      ${entry("enterActivity('mission')",getPieceSVG('wR',44),'체스 처음 배우기',learn.desc,'menu-adventure',learn.saved)}
    </div></section>
    <nav class="home-secondary" aria-labelledby="home-secondary-title"><h2 id="home-secondary-title" class="home-section-title">더 배우고 놀기</h2><div class="home-more-grid">${more("goLessons('home')",'📘','체스 수업',`${LESSONS.length}개 주제`,' home-lesson')}${more("goCourse('home')",'🏅','승급 과정','두 수 · 끝내기 · 초반',' home-course')}${more('goMiniMenu()','🎲','놀이터','전체 놀이')}${more('goAdventure()','🗺️','모험 지도','말 골라 배우기')}</div></nav>
    ${nextSkin?`<button class="new-skin-card" onclick="safeStore.removeItem('pending_skin');openSkinDetail('${nextSkin}')">🎁 새로운 꾸미기를 얻었어요! 지금 입혀보기</button>`:''}${Array.isArray(fresh)&&fresh.length?`<button class="new-skin-card" onclick="goWorkshop()">🎁 공방에 새 꾸미기: ${fresh.map(profileText).join(', ')}</button>`:''}
    <div class="app-version">v${APP_VERSION}</div></div>`;
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
