// ===== 홈 화면: 마스코트 + 말풍선 + 3D 메뉴 버튼 =====
function renderHome() {
  const totalStars = getTotalStars();
  document.getElementById('screen-home').innerHTML = `
    <div class="home-wrap">
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
