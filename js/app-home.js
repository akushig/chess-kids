// ===== 홈 화면: 마스코트 + 말풍선 + 3D 메뉴 버튼 =====
function renderHome() {
  const totalStars = getAllStars();
  document.getElementById('screen-home').innerHTML = `
    <div class="home-wrap">
      <button class="skin-btn" onclick="openSkinSelector()" aria-label="${t('skinSelectTitle')}">🎨</button>
      <div class="app-title">${t('appName')}</div>
      <div class="mascot-area">
        ${getPieceSVG('wK', 90)}
        <div class="speech-bubble">${t('greeting')}</div>
      </div>
      <div class="star-bar" onclick="goReward()" style="cursor:pointer">⭐ ${totalStars}</div>
      <div class="menu-grid">
        <button class="menu-btn menu-adventure" onclick="goAdventure()">
          <span class="menu-icon">${getPieceSVG('wN', 42)}</span>
          <div class="menu-label">
            <div>${t('menuAdventure')}</div>
            <div class="menu-sub">${t('adventureTitle')}</div>
          </div>
          <span class="menu-arrow">›</span>
        </button>
        <button class="menu-btn menu-puzzle" onclick="goPuzzleLevelSelect()">
          <span class="menu-icon">${getPieceSVG('wQ', 42)}</span>
          <div class="menu-label">
            <div>${t('menuPuzzle')}</div>
            <div class="menu-sub">${t('puzzleTitle')}</div>
          </div>
          <span class="menu-arrow">›</span>
        </button>
        <button class="menu-btn menu-play" onclick="goPlay()">
          <span class="menu-icon">${getPieceSVG('wR', 42)}</span>
          <div class="menu-label">
            <div>${t('menuPlay')}</div>
            <div class="menu-sub">${t('playTitle')}</div>
          </div>
          <span class="menu-arrow">›</span>
        </button>
        <button class="menu-btn menu-mini" onclick="goMiniMenu()">
          <span class="menu-icon">${getPieceSVG('wB', 42)}</span>
          <div class="menu-label">
            <div>${t('menuMini')}</div>
            <div class="menu-sub">${t('miniSub')}</div>
          </div>
          <span class="menu-arrow">›</span>
        </button>
      </div>
      <div class="app-version">v${APP_VERSION}</div>
    </div>
  `;
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
        onclick="${unlocked ? `openSkinDetail('${name}')` : ''}">
        <div class="skin-preview ${!unlocked ? 'skin-blur' : ''}">${preview}</div>
        <div class="skin-name">${t(meta.nameKey)}</div>
        ${badge}
        ${progress}
      </button>
    `;
  }).join('');

  const next = getNextLockedSkin();
  const nextHint = next ? `<div class="skin-next-hint">⭐ ${next.remaining}${t('rewardStarsNeeded')} → ${t(SKIN_META[next.name].nameKey)}</div>` : '';

  const overlay = document.createElement('div');
  overlay.className = 'skin-overlay';
  overlay.id = 'skin-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeSkinSelector(); };
  overlay.innerHTML = `
    <div class="skin-popup">
      <div class="skin-popup-header">
        <div class="skin-title">${t('skinSelectTitle')}</div>
        <div class="skin-star-count">⭐ ${allStars}</div>
      </div>
      ${nextHint}
      <div class="skin-grid">${cards}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ===== 스킨 상세보기 모달 =====
function openSkinDetail(name) {
  closeSkinSelector();
  const meta = SKIN_META[name];
  const isActive = currentSkin === name;
  const pieces = ['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'];
  const pieceNames = {wK:'King',wQ:'Queen',wR:'Rook',wB:'Bishop',wN:'Knight',wP:'Pawn',
    bK:'King',bQ:'Queen',bR:'Rook',bB:'Bishop',bN:'Knight',bP:'Pawn'};

  const grid = pieces.map(p => `
    <div class="detail-piece">
      <div class="detail-piece-svg">${getPieceSVGForSkin(name, p, 52)}</div>
      <div class="detail-piece-label">${p[0]==='w'?'⬜':'⬛'} ${pieceNames[p]}</div>
    </div>
  `).join('');

  const actionBtn = isActive
    ? `<div class="skin-badge skin-badge-active" style="font-size:16px;padding:8px 20px">${t('skinCurrent')}</div>`
    : `<button class="detail-equip-btn" onclick="selectSkin('${name}')">${t('skinEquip')}</button>`;

  const overlay = document.createElement('div');
  overlay.className = 'skin-overlay';
  overlay.id = 'skin-detail-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeSkinDetail(); };
  overlay.innerHTML = `
    <div class="skin-detail-popup">
      <button class="detail-close" onclick="closeSkinDetail()">✕</button>
      <div class="detail-title">${t(meta.nameKey)}</div>
      <div class="detail-grid">${grid}</div>
      <div class="detail-action">${actionBtn}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function closeSkinDetail() {
  const el = document.getElementById('skin-detail-overlay');
  if (el) el.remove();
}

function selectSkin(name) {
  setSkin(name);
  closeSkinDetail();
  closeSkinSelector();
  renderHome();
}

function closeSkinSelector() {
  const el = document.getElementById('skin-overlay');
  if (el) el.remove();
}
