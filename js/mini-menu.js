// ===== 미니게임 메뉴 =====
function goMiniMenu() {
  showScreen('mini');
  renderMiniMenu();
}

function renderMiniMenu() {
  const games = [
    { name: t('knightTourTitle'), desc: t('knightTourDesc'), icon: getPieceSVG('wN', 42), onclick: 'goKnightTour(0)', color: 'mini-green' },
    { name: t('survivalTitle'), desc: t('survivalDesc'), icon: getPieceSVG('wK', 42), onclick: 'goSurvival(0)', color: 'mini-red' },
    { name: t('collectorTitle'), desc: t('collectorDesc'), icon: getPieceSVG('wQ', 42), onclick: 'goCollector(0)', color: 'mini-purple' },
    { name: t('bombTitle'), desc: t('bombDesc'), icon: getPieceSVG('wR', 42), onclick: 'goBomb(0)', color: 'mini-orange' },
    { name: t('defenseTitle'), desc: t('defenseDesc'), icon: getPieceSVG('wB', 42), onclick: 'goDefense(0)', color: 'mini-blue' },
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
