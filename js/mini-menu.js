// ===== 미니게임 메뉴 =====
function goMiniMenu() {
  showScreen('mini');
  renderMiniMenu();
}

function renderMiniMenu() {
  const games = [
    { name: t('knightTourTitle'), desc: t('knightTourDesc'), icon: getPieceSVG('wN', 42), onclick: 'goKnightTour(0)', color: 'mini-green' },
    { name: t('survivalTitle'), desc: t('survivalDesc'), icon: getPieceSVG('wK', 42), onclick: 'goSurvival(0)', color: 'mini-red' },
  ];

  const cards = games.map(g => `
    <button class="menu-btn ${g.color}" onclick="${g.onclick}">
      <span class="menu-icon">${g.icon}</span>
      <div class="menu-label">
        <div>${g.name}</div>
        <div class="menu-sub">${g.desc}</div>
      </div>
      <span class="menu-arrow">›</span>
    </button>
  `).join('');

  document.getElementById('screen-mini').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('miniTitle')}</h2>
      </div>
      <div class="menu-grid">${cards}</div>
    </div>
  `;
}
