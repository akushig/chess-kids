// One visual language for navigation; piece artwork remains exclusive to chess.
function uiIcon(name, size = 24) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z"/>',
    play: '<path d="m10 6 9 6-9 6z"/><path d="M5 5v14"/>',
    game: '<path d="M8 7h8c3 0 4 2 5 8s-3 7-5 2H8c-2 5-6 4-5-2S5 7 8 7Z"/><path d="M8 10v5m-2.5-2.5h5m5-1.5h.01m2 3h.01"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7c-1.3-.8-.6-2.8 1-2.8H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><path d="M7 11h.01M9 7h.01M14 6h.01M17 9h.01"/>',
    flag: '<path d="M5 21V4m0 0c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>',
    medal: '<circle cx="12" cy="9" r="6"/><path d="m7 13-2 8 7-3 7 3-2-8m-5-7v6M9 9h6"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    pencil: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15z"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>',
    computer: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5m-5-10 3-4 3 4 4-5"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--icon-surface,white)"/><circle cx="15" cy="17" r="3" fill="var(--icon-surface,white)"/>',
    sprout: '<path d="M12 21V11M12 15C4 15 3 9 3 5c6 0 9 3 9 10Zm0-4c0-5 4-8 9-8 0 5-3 8-9 8Z"/>',
  };
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.game}</svg>`;
}
function browseNav(active) {
  return `<nav class="browse-nav" aria-label="주 메뉴">${[['home','home','홈',"showScreen('home');renderHome()"],['study','book','배우기','goStudy()'],['mini','game','놀이터','goMiniMenu()']].map(([id,icon,label,action])=>`<button ${id===active?'aria-current="page"':''} onclick="${action}">${uiIcon(icon)}<span>${label}</span></button>`).join('')}</nav>`;
}
function browseHeading(active, title, description) {
  return `<div class="screen-header"><button class="back-btn" onclick="showScreen('home');renderHome()">← 홈</button><h2>${title}</h2></div>${browseNav(active)}<div class="page-intro"><p class="eyebrow">어린이체스 · ${title}</p><h1>${description}</h1></div>`;
}
function goStudy() {
  leaveActivity(); showScreen('study'); renderStudy();
}
function renderStudy() {
  const intro=homeEntryDetail('mission');
  const card=(icon,title,desc,action,tone)=>`<button class="study-card ${tone}" onclick="${action}"><span class="feature-icon">${uiIcon(icon,28)}</span><span><strong>${title}</strong><small>${desc}</small></span><span class="card-verb">열기</span></button>`;
  document.getElementById('screen-study').innerHTML=`<div class="screen-wrap browse-screen">${browseHeading('study','배우기','한 수를 배우면,<br>생각이 자라요.')}<div class="study-path">
    <section class="study-step"><p class="eyebrow">체스가 처음이라면</p>${card('sprout','체스 처음 배우기',`${intro.saved?'이어서 배우기 · ':''}${intro.desc}`,"enterActivity('mission')",'study-mint')}<button class="text-button study-map-link" onclick="goAdventure()">${uiIcon('map',18)} 모험 지도에서 말 골라 배우기</button></section>
    <section class="study-step"><p class="eyebrow">한 수씩 익숙해지기</p>${card('book','체스 수업',`${LESSONS.length}개 주제 · 내 말 지키기부터 체크메이트까지`,"goLessons('study')",'study-gold')}</section>
    <section class="study-step"><p class="eyebrow">조금 더 멀리 내다보기</p>${card('medal','승급 과정','두 수 메이트 · 끝내기 · 초반 원칙',"goCourse('study')",'study-lilac')}</section>
    </div><button class="coach-entry" onclick="goCoach()">${uiIcon('search')}<span><strong>내 대국 코치</strong><small>지난 대국에서 다음 한 수를 배워요</small></span></button><p class="section-note">어디서 시작해도 괜찮아요. 하던 수업과 기록은 그대로 이어져요.</p></div>`;
}
