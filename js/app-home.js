// ===== 홈 화면: 마스코트 + 말풍선 + 3D 메뉴 버튼 =====
function renderHome() {
  const totalStars = getTotalStars();
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

// ===== 스킨 선택 모달 =====
function openSkinSelector() {
  const cards = SKIN_ORDER.map(name => {
    const meta = SKIN_META[name];
    const isActive = currentSkin === name;
    const preview = ['wK','wQ','bK','bQ'].map(p => getPieceSVGForSkin(name, p, 30)).join('');
    return `
      <button class="skin-card ${isActive ? 'active' : ''}" onclick="selectSkin('${name}')">
        <div class="skin-preview">${preview}</div>
        <div class="skin-name">${t(meta.nameKey)}</div>
        ${isActive ? `<div class="skin-current">${t('skinCurrent')}</div>` : ''}
      </button>
    `;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'skin-overlay';
  overlay.id = 'skin-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeSkinSelector(); };
  overlay.innerHTML = `
    <div class="skin-popup">
      <div class="skin-title">${t('skinSelectTitle')}</div>
      <div class="skin-grid">${cards}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function selectSkin(name) {
  setSkin(name);
  closeSkinSelector();
  renderHome();
}

function closeSkinSelector() {
  const el = document.getElementById('skin-overlay');
  if (el) el.remove();
}
