// ===== 대전 화면 + 리워드 화면 =====
// 대전: 컴퓨터(난이도 10단계) 또는 친구(위·아래 마주 보기 + 한 수 제한 시간)

const PLAY_TIMER_OPTIONS = [0, 15, 30, 60];
const PLAY_SMALL_FEN = '3rk3/2ppp3/8/8/8/8/2PPP3/3RK3 w - - 0 1';
// 배운 말로 첫 대전 (docs/STARTER_BATTLES.md): 왕·폰에 한 종류의 말만 더한 대칭 배치. 시작할 때 서로 잡을 말이 없다.
const PLAY_PRESETS = {
  R: { id: 'starter-rook-v1', fen: 'r3k2r/pp4pp/8/8/8/8/PP4PP/R3K2R w - - 0 1', desc: '룩 두 개 · 폰 4개', note: '룩 두 개가 폰 뒤에서 기다려요. 폰을 밀어 줄을 열면 룩이 멀리 갈 수 있어요.' },
  B: { id: 'starter-bishop-v1', fen: '2b1kb2/1p1pp1p1/8/8/8/8/1P1PP1P1/2B1KB2 w - - 0 1', desc: '비숍 두 개 · 폰 4개', note: '비숍 앞 대각선이 폰으로 막혀 있어요. 폰을 한 칸 밀어 대각선을 열어봐요.' },
  N: { id: 'starter-knight-v1', fen: '1n2k1n1/2pppp2/8/8/8/8/2PPPP2/1N2K1N1 w - - 0 1', desc: '나이트 두 개 · 폰 4개', note: '나이트는 폰을 뛰어넘을 수 있어요. 첫 수부터 바로 나가봐요.' },
  Q: { id: 'starter-queen-v1', fen: '3qk3/2pppp2/8/8/8/8/2PPPP2/3QK3 w - - 0 1', desc: '퀸 하나 · 폰 4개', note: '퀸은 가로·세로·대각선으로 멀리 가요. 하나뿐인 퀸을 잃지 않게 지켜요.' },
};
function playPresetTitle(key) { return t(PIECE_NAMES[key]) + ' 첫 대전'; }
// 모험·대전 입구 어디서 불러도 하던 대전은 확인한 뒤에만 바뀐다.
function playStarterBattle(key) {
  if (!PLAY_PRESETS[key]) return goPlay();
  requestNewActivity('play', () => playStart({...getPlaySettings(), mode: 'ai', small: false, preset: key}));
}
const PLAY_LEVEL_ICONS = ['🐣', '🐤', '🐥', '🐱', '🦊', '🐻', '🦁', '🐲', '🐉', '👑'];
const PLAY_AI_MIN_DELAY = 400;  // 컴퓨터가 너무 빨리 두면 아이가 수를 못 따라감
const PLAY_TIMEOUT_LEVEL = AI_ASSIST_LEVEL;
const PLAY_DRAW_KEYS = {
  stalemate: 'playDrawStalemate',
  kings: 'playDrawKings',
  material: 'playDrawMaterial',
  repetition: 'playDrawRepetition',
  fifty: 'playDrawFifty',
};

let playToken = 0;          // 새 대국·화면 이탈마다 증가해서 늦게 도착한 콜백을 버림
let playTimerHandle = null;
let playAiWorker = null;    // null: 아직 안 만듦, false: 워커를 못 씀
let playAiSeq = 0;
const playAiPending = {};
let playDialogState = null;

function getPlaySettings() {
  let s = {};
  try { s = JSON.parse(safeStore.getItem('play_settings')) || {}; } catch { s = {}; }
  return {
    mode: s.mode === 'friend' ? 'friend' : 'ai',
    level: aiLevelIndex(s.level,s.levelVersion??1,0),
    levelVersion: AI_DIFFICULTY_VERSION,
    timer: PLAY_TIMER_OPTIONS.includes(s.timer) ? s.timer : 0,
    help:s.help !== false, autoMove:!!s.autoMove, small:!!s.small, face:s.face !== false,
    view:s.view==='net'?'net':null, netMethod:s.netMethod==='remote'?'remote':'room', netColor:['w','b','random'].includes(s.netColor)?s.netColor:'w',
  };
}
function savePlaySettings(s) {
  try { safeStore.setItem('play_settings', JSON.stringify({...s,level:aiLevelIndex(s.level),levelVersion:AI_DIFFICULTY_VERSION})); } catch {}
}

function playUpgradeDifficulty(play) {
  return {...play,level:aiLevelIndex(play.level,play.levelVersion??1),levelVersion:AI_DIFFICULTY_VERSION};
}
function playLevelLabel(level) {
  return t('playLevelLabel').replace('{n}',level+1)+' · '+t('playLevel'+level);
}

function playCloseDialog(resume=true) {
  const dialog=playDialogState;if(!dialog)return;
  playDialogState=null;dialog.element.remove();
  document.getElementById('app').inert=false;
  document.removeEventListener('keydown',dialog.onKey);
  if(resume){
    if(dialog.previous?.isConnected)dialog.previous.focus({preventScroll:true});
    dialog.onDismiss?.();
  }
}
function playShowDialog(kind,title,html,actions,onDismiss) {
  if(playDialogState?.kind===kind)return;
  closeActivityDialog();playCloseDialog(false);hideGameToast();gameToastKey='';
  const overlay=document.createElement('div');if(!overlay.setAttribute)return;
  overlay.id='play-dialog';overlay.className='clear-overlay play-dialog-overlay';overlay.dataset.kind=kind;
  overlay.innerHTML=`<section class="play-dialog play-dialog--${kind}" role="dialog" aria-modal="true" aria-labelledby="play-dialog-title"><header><h2 id="play-dialog-title">${title}</h2><div class="dialog-tools">${kind==='event'?'<button class="dialog-read" aria-label="설명 듣기">🔊</button>':''}<button class="play-dialog-close" aria-label="${t('playDialogClose')}">✕</button></div></header><div class="play-dialog-body">${html}</div><footer></footer></section>`;
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();playCloseDialog();}};
  playDialogState={kind,element:overlay,previous:document.activeElement,onDismiss,onKey};
  overlay.querySelector('.play-dialog-close').onclick=()=>playCloseDialog();
  if(kind==='event')overlay.querySelector('.dialog-read').onclick=()=>speakGuide(title+' '+overlay.querySelector('.play-dialog-body').textContent);
  for(const action of actions){const button=document.createElement('button');button.className='action-btn '+(action.secondary?'secondary':action.tone||'');button.textContent=action.label;button.onclick=()=>{playCloseDialog(!action.action);action.action?.();};overlay.querySelector('footer').appendChild(button);}
  document.body.appendChild(overlay);document.getElementById('app').inert=true;
  document.addEventListener('keydown',onKey);overlay.querySelector('footer button').focus({preventScroll:true});
  if(readData('preferences',{}).voice&&kind==='event')speakGuide(title+' '+overlay.querySelector('.play-dialog-body').textContent);
}
function playShowDifficultyHelp() {
  const rows=AI_LEVELS.map((level,i)=>`<tr><th scope="row">${i+1}</th><td>${t('playLevel'+i)}</td><td>${t('playLevelDetails'+i)}</td><td>${level.random?t('playNoSearch'):t('playSeconds').replace('{n}',level.timeMs/1000)}</td></tr>`).join('');
  playShowDialog('difficulty',t('playLevelHelpTitle'),`<table class="play-difficulty-table"><thead><tr><th>${t('playLevelNumber')}</th><th>${t('playLevelName')}</th><th>${t('playLevelDifference')}</th><th>${t('playThinkBudget')}</th></tr></thead><tbody>${rows}</tbody></table><p class="play-dialog-note">${t('playLevelHelpNote')}</p>`,[{label:t('playUnderstood')}]);
}

// --- 설정 화면 ---
function goPlay() {
  leaveActivity();
  playStop();
  showScreen('play');
  renderPlaySetup();
}

function renderPlaySetup() {
  const s = getPlaySettings();
  // 상대 고르기: 두 카드가 같은 구조(아이콘 + 제목 + 한 줄 설명)라 글 길이와 상관없이 높이가 같다.
  const netView = s.view === 'net', picked = netView ? 'net' : s.mode;
  const modes = [['ai', '🤖', t('playModeAi'), '10단계 중에서 골라요', t('playModeAi')], ['friend', '👫', '함께 두기', '같은 기기에서 번갈아', t('playModeFriend')], ['net', '📱', '두 기기로', '같은 방은 QR · 멀리 있으면 초대장', '두 기기로 대전']].map(([mode, icon, title, sub, label]) => `
    <button class="play-mode ${mode === 'net' ? 'play-mode-net ' : ''}${picked === mode ? 'active' : ''}" aria-pressed="${picked === mode}" aria-label="${label}" onclick="playSetOption('mode', '${mode}')">
      <span class="play-mode-icon" aria-hidden="true">${icon}</span><span class="play-mode-text"><strong>${title}</strong><small>${sub}</small></span>
    </button>
  `).join('');

  let options;
  if (netView) options = netSetupHTML(s);
  else if (s.mode === 'ai') {
    const levels = AI_LEVELS.map((_, i) => `
      <button class="play-level ${s.level === i ? 'active' : ''}" aria-label="${playLevelLabel(i)}" aria-pressed="${s.level===i}" onclick="playSetOption('level', ${i})">
        <span class="play-level-number">${i+1}</span>
        <span class="play-level-icon">${PLAY_LEVEL_ICONS[i]}</span>
        <span class="play-level-name">${t('playLevel' + i)}</span>
      </button>
    `).join('');
    options = `<div class="play-section-title play-difficulty-heading"><span>${t('playDifficulty')}</span><button class="play-info-button" aria-label="${t('playLevelHelpTitle')}" title="${t('playLevelHelpTitle')}" aria-haspopup="dialog" onclick="playShowDifficultyHelp()"><span aria-hidden="true">?</span></button></div><div class="play-levels play-level-picker" role="group" aria-label="${t('playDifficulty')}">${levels}</div><div class="play-level-summary" role="status"><strong>${playLevelLabel(s.level)}</strong><p>${t('playLevelDesc'+s.level)}</p></div>`;
  } else {
    const timers = PLAY_TIMER_OPTIONS.map(sec => `
      <button class="play-chip ${s.timer === sec ? 'active' : ''}" aria-pressed="${s.timer === sec}" onclick="playSetOption('timer', ${sec})">${playTimerLabel(sec)}</button>
    `).join('');
    options = `
      <div class="play-section-title">${t('playTimer')}</div>
      <div class="play-timers">${timers}</div>
      <div class="play-note">${t('playFriendNote')}${s.timer ? '<br>' + t('playTimerNote') : ''}</div>
    `;
  }
  const recommend = !safeStore.getItem('play_settings')&&readData('experience','beginner')==='beginner';

  document.getElementById('screen-play').innerHTML = `
    <div class="screen-wrap play-setup-screen">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('menuPlay')}</h2>
      </div>
      ${savedActivityCard('play')}${netSavedCardHTML()}<div class="play-setup">
        <div class="play-section-title">상대</div>
        <div class="play-modes">${modes}</div>
        ${options}
        <div class="play-section-title">판 설정</div>
        <div class="play-options">
          <button class="play-chip ${s.help?'active':''}" aria-pressed="${!!s.help}" onclick="playSetOption('help',${!s.help})">🛟 왕 구하기 도움 ${s.help?'켜짐':'꺼짐'}</button>
          <button class="play-chip ${s.small?'active':''}" aria-pressed="${!!s.small}" onclick="playSetOption('small',${!s.small})">♟ ${s.small?'말이 적은 짧은 판':'모든 말로 한 판'}</button>
          ${!netView&&s.mode==='friend'?`<button class="play-chip ${s.face?'active':''}" aria-pressed="${!!s.face}" onclick="playSetOption('face',${!s.face})">${s.face?'마주 보고 두기':'나란히 두기'}</button><button class="play-chip ${s.autoMove?'active':''}" aria-pressed="${!!s.autoMove}" onclick="playSetOption('autoMove',${!s.autoMove})">시간이 끝나면 ${s.autoMove?'도우미가 두기':'천천히 계속하기'}</button>`:''}
        </div>
        <p class="play-note play-board-note">${s.small?'이 짧은 판은 왕과 룩의 시작 배치가 달라 캐슬링을 하지 않아요.':'캐슬링은 왕을 고른 뒤 ‘캐슬링’ 표시 칸을 눌러요. 왕과 룩을 차례로 눌러도 돼요.'}</p>
        ${netView?netSetupCtaHTML(s):`<div class="play-cta">
          <button class="action-btn play-start" onclick="requestNewActivity('play',playStart)">${t(s.mode==='ai'?'playStartAi':'playStartFriend')}</button>
          ${recommend?'<button class="action-btn secondary play-recommend" onclick="const s=getPlaySettings();savePlaySettings({...s,small:true,help:true});requestNewActivity(\'play\',playStart)">🌱 처음엔 말이 적은 짧은 판 추천</button>':''}
          <p class="play-entry-note">${t('playEntryNote')}</p>
        </div>`}
      </div>
      <section class="play-starters" aria-labelledby="play-starters-title"><h3 id="play-starters-title">배운 말로 첫 대전</h3><p class="play-note">왕과 폰에 한 종류의 말만 더한 판이에요. 상대: 컴퓨터 ${playLevelLabel(s.level)}</p><div class="play-starter-list">${Object.entries(PLAY_PRESETS).map(([key,p])=>`<button class="play-starter choice-card" onclick="playStarterBattle('${key}')"><span class="choice-icon" aria-hidden="true">${getPieceSVG('w'+key,34)}</span><span class="choice-text"><strong>${playPresetTitle(key)}</strong><small>${p.desc}${progressLedger().achievements?.[p.id]?' · ✓ 해봤어요':''}</small></span><span class="choice-arrow" aria-hidden="true">›</span></button>`).join('')}</div></section>
      ${playContentMenuHTML(`<button class="content-card choice-card play-coach-card" onclick="goCoach()"><span class="choice-icon" aria-hidden="true">🔍</span><span class="choice-text"><strong>내 대국 코치</strong><span>${coachRecords().length?'지난 대국에서 살펴볼 장면 찾기':'컴퓨터와 한 판을 끝까지 두면 열려요'}</span></span><span class="choice-arrow" aria-hidden="true">›</span></button><button class="content-card choice-card play-lesson-link" onclick="goLessons('play')"><span class="choice-icon" aria-hidden="true">📘</span><span class="choice-text"><strong>체스 수업</strong><span>${LESSONS.length}개 주제와 무한 연습</span></span><span class="choice-arrow" aria-hidden="true">›</span></button><button class="content-card choice-card play-course-link" onclick="goCourse('play')"><span class="choice-icon" aria-hidden="true">🏅</span><span class="choice-text"><strong>승급 과정</strong><span>두 수 메이트·끝내기·초반 원칙</span></span><span class="choice-arrow" aria-hidden="true">›</span></button>`)}
    </div>
  `;
}

function playTimerLabel(sec) {
  return sec ? t('playSeconds').replace('{n}', sec) : t('playTimerOff');
}

function playSetOption(key, value) {
  const s = getPlaySettings();
  if (key === 'mode' && value === 'net') s.view = 'net';
  else { s[key] = value; if (key === 'mode') s.view = null; }
  savePlaySettings(s);
  renderPlaySetup();
  if(key==='level')document.querySelector('.play-level[aria-pressed="true"]')?.focus?.({preventScroll:true});
}

// --- 대국 시작/종료 ---
// 한 판의 실제 설정. 저장판을 복원한 뒤에도 전역 설정이 아니라 이 판을 기준으로 다시 둔다.
function playConfigOf(play) {
  const friend = play?.mode === 'friend';
  return {
    mode: friend ? 'friend' : 'ai',
    level: aiLevelIndex(play?.level, play?.levelVersion ?? 1, 0),
    levelVersion: AI_DIFFICULTY_VERSION,
    timer: friend && PLAY_TIMER_OPTIONS.includes(play.timer) ? play.timer : 0,
    help: play?.help !== false, autoMove: !!play?.autoMove, small: !friend && PLAY_PRESETS[play?.preset] ? false : !!play?.small, face: play?.face !== false,
    preset: !friend && PLAY_PRESETS[play?.preset] ? play.preset : null,
    ...(!friend && playContentValid(play?.content)?{content:playContentConfig(play.content)}:{}),
  };
}
// 마지막으로 둔 설정을 설정 화면에도 반영한다. 다른 모드의 선택(예: 함께 두기 시간)은 지우지 않는다.
function playRememberConfig(c) {
  const s = getPlaySettings();
  // 첫 대전은 단계와 도움만 기록한다. 설정 화면의 모드·짧은 판 선택은 그대로 둔다.
  if (c.preset || c.content) return savePlaySettings({...s, level: c.level, help: c.help});
  savePlaySettings(c.mode === 'ai'
    ? {...s, mode: 'ai', view: null, level: c.level, help: c.help, small: c.small}
    : {...s, mode: 'friend', view: null, timer: c.timer, face: c.face, autoMove: c.autoMove, help: c.help, small: c.small});
}
function playSavedDetail(play) {
  const c = playConfigOf(play);
  return (c.content?playContentTitle(c.content)+' · ':'')+(c.mode === 'ai' ? '🤖 컴퓨터 ' + playLevelLabel(c.level) : '👫 ' + t('playModeFriend') + (c.timer ? ' · ⏱ ' + playTimerLabel(c.timer) : '')) + (c.preset ? ' · ' + playPresetTitle(c.preset) : c.small ? ' · 짧은 판' : '');
}
function playConfigSummary(c) {
  const parts = c.mode === 'ai' ? [PLAY_LEVEL_ICONS[c.level] + ' ' + playLevelLabel(c.level)] : [t('playModeFriend'), '⏱ ' + playTimerLabel(c.timer), t(c.face ? 'playFaceOn' : 'playFaceOff')];
  return [...parts, c.content?playContentTitle(c.content):c.preset ? playPresetTitle(c.preset) : t(c.small ? 'playSmallBoard' : 'playFullBoard'), t(c.help ? 'playHelpOn' : 'playHelpOff')].join(' · ');
}
// 다음 단계는 컴퓨터에게 사람이 이겼고 더 높은 단계가 있을 때만, 누를 때만 적용한다.
function playNextLevelIndex() {
  const g = state.game, p = state.play;
  if (!p || p.content || p.mode !== 'ai' || g?.status !== 'checkmate' || g.turn !== 'b') return null;
  const level = playConfigOf(p).level;
  return level < AI_LEVELS.length - 1 ? level + 1 : null;
}
// 끝난 판에서 설정을 바꿀 때는 그 판의 설정에서 출발한다(복원한 판도 같음).
function playChangeSettings() {
  if (state.play) playRememberConfig(playConfigOf(state.play));
  goPlay();
}
function playRematch() {
  if (!playIsOver()) return playRestartRequest();
  playStart(state.play);
}
function playNextLevel() {
  const next = playNextLevelIndex();
  if (next === null) return;
  playStart({...playConfigOf(state.play), level: next});
}

function playStart(config) {
  // config가 없으면 설정 화면의 전역 설정으로 시작한다.
  const s = config ? playConfigOf(config) : getPlaySettings();
  if (config) playRememberConfig(s);
  beginActivity('play');
  playStop();
  // 짧은 판: 폰이 룩 앞을 막아 첫 수에 서로 잡을 수 있는 말이 없다(예전 배치는 d줄에서 룩이 마주 봤다).
  const preset = PLAY_PRESETS[s.preset] && s.mode === 'ai' ? s.preset : null;
  state.game = s.content ? playContentGame(s.content) : preset ? ChessGame.fromFEN(PLAY_PRESETS[preset].fen) : s.small ? ChessGame.fromFEN(PLAY_SMALL_FEN) : new ChessGame();
  state.play = {
    mode: s.mode,
    ...(s.content?{content:playContentInitial(s.content)}:{}),
    help:s.help, autoMove:s.autoMove,face:s.face,small:preset?false:s.small,preset,notice:s.content?playContentIntro(s.content):preset?PLAY_PRESETS[preset].note:'',
    level: s.level, levelVersion:AI_DIFFICULTY_VERSION,
    timer: s.mode === 'friend' ? s.timer : 0,
    deadline: 0,
    pausedLeft: s.mode==='friend'&&s.timer?s.timer*1000:null,
    buzzed: null,
    timeoutSide: null,  // 시간 초과로 대신 둔 쪽 (그 패널에 안내 표시)
  };
  coachRecordStart();
  showScreen('play');
  renderPlay();
  playTimerStart();
}

function playStop() {
  playCloseDialog(false);
  playToken++;
  if(playAiWorker){playAiWorker.terminate();playAiWorker=null;}
  for(const id of Object.keys(playAiPending))delete playAiPending[id];
  playTimerStop();
  if (state.play) state.play.pausedLeft = null;
}

function playIsOver() {
  return state.game.status === 'checkmate' || state.game.status === 'draw' || (state.play?.mode === 'net' && !!net.record?.end && net.record.gid === state.play.net?.gid);
}
// 지금 이 기기에서 둘 차례인지: 컴퓨터 대전은 흰색, 함께 두기는 언제나, 두 기기 대전은 내 색일 때.
function playMineToMove() {
  const p = state.play, g = state.game;
  return p.mode === 'friend' || (p.mode === 'net' ? g.turn === p.net?.color : g.turn === 'w');
}

function playStateKey() {const g=state.game;return g.positionKey()+'|'+g.status+'|'+g.drawReason;}
function playStatusCopy() {
  const g=state.game,p=state.play,side=t(g.turn==='w'?'playWhite':'playBlack');
  if(p.mode==='net')return netStatusCopy();
  const team=teamStatus();if(team)return team;
  if(g.status==='checkmate'){
    const winner=t(g.turn==='w'?'playBlack':'playWhite');
    return {tone:g.turn==='b'||p.mode==='friend'?'success':'fail',icon:g.turn==='b'||p.mode==='friend'?'🏆':'🏁',title:p.mode==='friend'?t('playSideWins').replace('{side}',winner):t(g.turn==='b'?'playVictory':'playComputerWins'),detail:t('playMateExplained')};
  }
  if(g.status==='draw')return {tone:'draw',icon:'🤝',title:t('playDrawTitle'),detail:g.drawReason==='stalemate'?t('playStalemateExplained'):t(PLAY_DRAW_KEYS[g.drawReason])};
  if(g.status==='check')return {tone:'warn',icon:'⚠️',title:p.mode==='ai'?t(g.turn==='w'?'playMyKingCheck':'playOpponentKingCheck'):t('playSideCheck').replace('{side}',side),detail:t('playCheckRestriction')};
  const title=p.mode==='ai'?t(g.turn==='w'?'playYourTurn':'playAiTurn'):t('playSideTurn').replace('{side}',side);
  return {tone:g.turn==='b'&&p.mode==='ai'?'dim':'',icon:g.turn==='b'&&p.mode==='ai'?'🤖':'♟',title,detail:p.moveEvent?.special==='castle'?t('playCastleComplete'):p.notice||t('playChoosePiece')};
}
function playStatusHTML() {
  const copy=playStatusCopy();
  return `<div class="status-msg play-state ${copy.tone}" role="status"><span class="play-state-icon" aria-hidden="true">${copy.icon}</span><div><strong>${copy.title}</strong><small>${copy.detail}</small></div></div>`;
}
function playSyncEvent() {
  const p=state.play,g=state.game,key=playStateKey();
  if(p.moveEvent&&p.moveEvent.key!==key){p.moveEvent=null;if(playDialogState?.kind==='event')playCloseDialog(false);}
  if(!p.moveEvent&&(playIsOver()||(g.status==='check'&&!p.seenChecks?.[g.turn])))p.moveEvent={kind:playIsOver()?'result':'check',key,acknowledged:false};
}
function playAcknowledgeEvent() {
  const p=state.play;
  if(p.moveEvent){p.moveEvent.acknowledged=true;if(p.moveEvent.special)p.notice='';}
  if(state.game.status==='check'){p.seenChecks||={};p.seenChecks[state.game.turn]=true;}
  saveActiveSession();renderPlay();playNextTurn();
  if(typeof queueMicrotask==='function')queueMicrotask(()=>{
    const cells=document.querySelectorAll('#screen-play .board-cell'),move=state.game.lastMove;
    const target=document.querySelector('#screen-play .checked-king')||(move?cells[move[2]*8+move[3]]:cells[0]);
    if(target){target.tabIndex=0;target.focus({preventScroll:true});}
  });
}
function playPresentEvent(force=false) {
  const p=state.play,g=state.game,event=p.moveEvent;
  if(!event||(!force&&(event.acknowledged||(event.kind==='check'&&p.seenChecks?.[g.turn]))))return;
  const copy=playStatusCopy(),side=t(event.color==='b'?'playBlack':'playWhite');
  let title=copy.title,body=`<p class="play-event-explanation">${copy.detail}</p>`,icon=copy.icon;
  if(event.special==='castle'){
    title=t('playCastleTitle');icon='🏰';
    const square=([r,c])=>'abcdefgh'[c]+(8-r);
    body=`<p class="play-event-explanation">${t('playCastleExplained').replace('{side}',side)}</p><div class="play-event-moves"><div>${getPieceSVG(event.color+'K',36)}<span>${t(PIECE_NAMES.K)} <strong>${square(event.kingFrom)} → ${square(event.kingTo)}</strong></span></div><div>${getPieceSVG(event.color+'R',36)}<span>${t(PIECE_NAMES.R)} <strong>${square(event.rookFrom)} → ${square(event.rookTo)}</strong></span></div></div>`;
  }else if(event.special==='promotion'){
    title=t('playPromotionTitle');icon='✨';body=`<p class="play-event-explanation">${t('playPromotionExplained').replace('{side}',side).replace('{piece}',t(PIECE_NAMES[event.promotion]))}</p>`;
  }
  if(event.kind==='check')body=`<div class="play-event-king">${getPieceSVG(g.turn+'K',64)}</div><p class="play-event-explanation">${t('playCheckExplained')}</p>`;
  else if(g.status==='check')body+=`<p class="play-event-warning"><strong>${copy.title}</strong><br>${t('playCheckRestriction')}</p>`;
  if(playIsOver()){title=copy.title;icon=copy.icon;if(event.special)body+=`<p class="play-event-explanation">${copy.detail}</p>`;}
  const label=playIsOver()?t('playSeeFinalBoard'):g.status==='check'&&playMineToMove()?t('playLookAtKing'):t('playContinue');
  const actions=[{label,secondary:playIsOver()}];
  if(playIsOver()&&p.mode==='net')actions.push(...netResultActions());
  else if(playIsOver()){
    // 첫 초점은 '마지막 판 보기'. 재대결·다음 단계는 사용자가 고를 때만 시작한다.
    const next=playNextLevelIndex();
    const contentActions=playContentResultActions();
    if(contentActions)actions.push(...contentActions);
    else actions.push({label:t('playRematch'),action:playRematch});
    if(next!==null)actions.push({label:t('playNextLevel').replace('{n}',next+1),tone:'green',action:playNextLevel});
    if(!contentActions)actions.push({label:t('playChangeSettings'),secondary:true,action:playChangeSettings});
    const top=!p.content&&p.mode==='ai'&&g.status==='checkmate'&&g.turn==='b'&&next===null;
    body+=`${top?`<p class="play-event-explanation">${t('playTopLevelWin')}</p>`:''}<p class="play-dialog-note play-rematch-summary"><strong>${t('playRematchSummary')}</strong> ${playConfigSummary(playConfigOf(p))}</p>${p.mode==='ai'&&p.record?`<button class="text-button play-coach-link" onclick="playCloseDialog(false);goCoach('${p.record.id}')">🔍 코치와 이 대국 다시 보기</button>`:''}`;
  }
  playTimerPauseForHelp();
  playShowDialog('event',title,`<div class="play-event-icon" aria-hidden="true">${icon}</div>${body}${!playIsOver()?`<p class="play-dialog-note">${t('playReadingPause')}</p>`:''}`,actions,playAcknowledgeEvent);
}

// --- 화면 ---
function renderPlay() {
  playSyncEvent();
  if(state.play.help&&state.game.status==='check')noteHelp(1);
  saveActiveSession();
  if (state.play.mode === 'friend') renderPlayFriend();
  else if (state.play.mode === 'net') renderPlayNet();
  else renderPlayAi();
  const guide = playGuideHTML();
  if (guide&&!playDialogState) showGameToast(guide, 'play|' + state.play.notice + '|' + state.game.status + '|' + state.game.turn, false, state.game.status==='check'||!!state.play.moveEvent?.special);
  else { hideGameToast(); gameToastKey = ''; }
  playPresentEvent();
}

// flipped: 검은색으로 두는 두 기기 대전은 판을 돌려 내 말이 아래에 오게 한다(칸 번호와 클릭 좌표는 그대로).
function playBoardHTML(faceToFace, flipped = false) {
  const game = state.game;
  const selected=game.selected, selectedKing=selected&&game.board[selected[0]][selected[1]]===game.turn+'K';
  const checked=(game.status==='check'||game.status==='checkmate')?game.findKing(game.turn):null;
  const attackers=checked&&state.play.help?game.attackers(game.board,...checked,game.turn==='w'?'b':'w'):[];
  const event=state.play.moveEvent;
  let cells = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const piece = game.board[r][c];
      let cls = 'board-cell ' + (isLight ? 'light' : 'dark');
      if (game.selected && game.selected[0] === r && game.selected[1] === c) cls += ' selected';
      if (game.validMoves && game.validMoves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';
      if (game.lastMove && ((game.lastMove[0]===r&&game.lastMove[1]===c)||(game.lastMove[2]===r&&game.lastMove[3]===c))) cls+=' last-move';
      if(state.play.castleBlocked?.[0]===r&&state.play.castleBlocked?.[1]===c)cls+=' castle-blocked';
      const isCheckedKing=checked&&r===checked[0]&&c===checked[1];
      if(isCheckedKing)cls+=' checked-king';
      if (state.play.help && game.status==='check') {
        if(attackers.some(([ar,ac])=>ar===r&&ac===c))cls+=' attacking-piece';
        if(game.board[r][c]?.[0]===game.turn&&game.legalMoves(r,c).length)cls+=' rescue-piece';
      }
      const proposal=state.play.teamProposal;if(proposal&&((r===proposal[0]&&c===proposal[1])||(r===proposal[2]&&c===proposal[3])))cls+=' team-proposal';
      if (piece) cls += ' pc-' + piece[0];
      const castleTarget=selectedKing&&r===selected[0]&&Math.abs(c-selected[1])===2&&game.validMoves.some(([mr,mc])=>mr===r&&mc===c);
      if(castleTarget)cls+=' castle-target';
      const pieceContent = piece ? getPieceSVG(piece) : '';
      const castlePart=event?.special==='castle'?(r===event.kingTo[0]&&c===event.kingTo[1]?'king':r===event.rookTo[0]&&c===event.rookTo[1]?'rook':null):null;
      if(castlePart)cls+=' castle-completed';
      cells += `<div class="${cls}" onclick="playClick(${r},${c})">${pieceContent}${castleTarget?'<span class="castle-mark" aria-hidden="true">🏰<small>캐슬링</small></span>':''}${isCheckedKing?`<span class="play-cell-alert" aria-hidden="true">${t(game.status==='checkmate'?'playMateTag':'playCheck')}</span>`:castlePart?`<span class="play-cell-special" aria-hidden="true">${t(castlePart==='king'?PIECE_NAMES.K:PIECE_NAMES.R)} ↔</span>`:''}</div>`;
    }
  }
  return `<div class="chess-board${faceToFace ? ' face-to-face' : ''}${flipped ? ' flipped' : ''}${faceToFace&&game.turn==='b'?' castle-for-black':''}">${cells}${playAttackOverlay()}</div>`;
}

function renderPlayAi() {
  const game = state.game;
  const level = state.play.level;

  const statusMsg = playStatusHTML();

  renderGameScreen('screen-play', `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goPlay()">← ${t('btnBack')}</button>
        <h2>${state.play.content ? playContentTitle(state.play.content) : state.play.preset ? playPresetTitle(state.play.preset) : t('playTitle')}</h2>
        <span class="play-badge">${PLAY_LEVEL_ICONS[level]} ${playLevelLabel(level)}</span>
      </div>
      ${statusMsg}
      <div class="captured-pieces" id="captured-top">${game.captured.b.map(p => getPieceSVG(p, 24)).join('')}</div>
      ${playBoardHTML(false)}
      <div class="captured-pieces" id="captured-bottom">${game.captured.w.map(p => getPieceSVG(p, 24)).join('')}</div>
      ${playContentPanel()}${playActionsHTML()}
    </div>
  `);
}

// 친구와 대전: 위쪽(검은색) 패널은 180° 돌려서 마주 앉은 친구가 바로 읽게 함
function renderPlayFriend() {
  const game = state.game, p = state.play;
  const over = playIsOver();

  const panel = side => {
    const active = !over && game.turn === side;
    let msg, cls = active ? 'active' : '';
    if (game.status === 'checkmate') {
      const lost = game.turn === side;
      msg = lost ? t('playLoseShort') : t('playWin');
      cls = lost ? 'lose' : 'win';
    } else if (game.status === 'draw') {
      msg = t('playDraw');
      cls = 'draw';
    } else if (p.timeoutSide === side) {
      msg = t('playTimeout');
    } else if (active) {
      msg = game.status === 'check' ? t('playCheckRestriction') : t('playYourTurn');
    } else {
      msg = t('playFriendTurn');
    }
    if(game.status==='check')cls+=' in-check';
    const time = p.timer && !over ? `<span class="p2-time">${p.timer}</span>` : '';
    const bar = p.timer ? `<div class="p2-bar"><div class="p2-bar-fill"></div></div>` : '';
    const capturedId = side === 'w' ? 'captured-bottom' : 'captured-top';
    return `
      <div class="p2-panel ${side === 'b' ? 'p2-top' : ''} ${cls}" id="p2-panel-${side}">
        <div class="p2-head">
          <span class="p2-king">${getPieceSVG(side + 'K', 32)}</span>
          <div class="p2-text">
            <div class="p2-name">${game.status==='check'?playStatusCopy().title:t(side === 'w' ? 'playWhite' : 'playBlack')}</div>
            <div class="p2-msg">${msg}</div>
          </div>
          ${time}
        </div>
        ${bar}
        <div class="captured-pieces" id="${capturedId}">${game.captured[side].map(pc => getPieceSVG(pc, 24)).join('')}</div>
      </div>
    `;
  };

  renderGameScreen('screen-play', `
    <div class="screen-wrap play-2p">
      <div class="screen-header">
        <button class="back-btn" onclick="goPlay()">← ${t('btnBack')}</button>
        <h2>${t('playFriendTitle')}</h2>
        ${p.timer ? `<span class="play-badge">⏱ ${playTimerLabel(p.timer)}</span>` : ''}
      </div>
      ${panel('b')}
      ${playBoardHTML(p.face !== false)}
      ${panel('w')}
      ${playContentPanel()}${playActionsHTML()}
    </div>
  `);
  if (playTimerHandle) playTimerPaint();
}

// --- 수 두기 ---
function playClick(r, c) {
  const game = state.game, p = state.play;
  if (state.animating || playDialogState) return;
  if(playIsOver()){playPresentEvent(true);return;}
  if (!playMineToMove()) {
    if (p.mode === 'net') { p.notice = '지금은 친구 차례예요. 친구가 두면 내 차례가 돼요.'; gameToastKey = ''; renderPlay(); }
    return;
  }

  if (game.selected) {
    const [fr, fc] = game.selected;
    const king=game.board[fr][fc]===game.turn+'K',home=game.turn==='w'?7:0;
    const rookTap=king&&fr===home&&fc===4&&r===home&&(c===0||c===7)&&game.board[r][c]===game.turn+'R';
    if(king&&r===fr&&(Math.abs(c-fc)===2||rookTap)){
      const side=c<fc?'queen':'king',info=game.castlingStatus(game.turn,side);
      if(!p.small&&info.allowed){if(teamRecordProposal(fr,fc,info.row,info.to))return;p.timeoutSide=null;playCommitMove([fr,fc,info.row,info.to]);}
      else {
        // A blocked king→rook gesture must still let the player select that rook.
        if(rookTap)game.select(r,c);
        p.notice=playCastlingReason(info);p.castleBlocked=info.square;gameToastKey='';renderPlay();
      }
      return;
    }
    if (game.validMoves.some(([mr, mc]) => mr === r && mc === c)) {
      if(teamRecordProposal(fr,fc,r,c))return;
      p.timeoutSide = null;
      if(game.board[fr][fc][1]==='P'&&(r===0||r===7))playChoosePromotion([fr,fc,r,c]);
      else playCommitMove([fr, fc, r, c]);
      return;
    }
  }

  if(game.selected && game.board[r][c]?.[0] !== game.turn) {
    p.notice=explainPlayMove(game,...game.selected,r,c);gameToastKey='';renderPlay();return;
  }
  game.select(r,c);
  p.castleBlocked=null;
  p.notice=game.selected&&!game.validMoves.length?(game.status==='check'?'이 말로는 왕을 구할 수 없어요. 방패 표시가 있는 말을 살펴봐요.':'길이 막혀 있어요. 다른 말을 골라볼까요?'):'';
  if(p.notice)gameToastKey='';
  renderPlay();
}

function playCommitMove([fr, fc, tr, tc,promotion='Q']) {
  const game = state.game;
  const piece = game.board[fr][fc];
  const captured = game.board[tr][tc];
  const mover = game.turn,wasCheck=game.status==='check';
  const boardEl = document.querySelector('#screen-play .chess-board');
  const token = playToken;

  const netGame=state.play.mode==='net';
  if(!netGame)rememberAction();
  state.play.notice='';state.play.castleBlocked=null;state.play.guideMethod=null;state.play.pausedLeft=null;
  playTimerStop();
  state.play.pausedLeft=state.play.timer?state.play.timer*1000:null;
  game.move(fr, fc, tr, tc,promotion);
  if(netGame)netAfterMove(mover,[fr,fc,tr,tc],piece,promotion);
  coachRecordMove(fr,fc,tr,tc,piece,promotion);
  playContentAfterMove(mover,piece,tr);
  const castle=piece[1]==='K'&&Math.abs(tc-fc)===2;
  if(castle)state.play.notice='왕과 룩이 함께 움직였어요. 캐슬링이에요.';
  if(piece[1]==='P'&&(tr===0||tr===7))state.play.notice='폰이 새로운 말로 변했어요!';
  game.lastMove=[fr,fc,tr,tc];
  const special=castle?'castle':piece[1]==='P'&&(tr===0||tr===7)?'promotion':null;
  state.play.moveEvent=special||game.status==='check'||playIsOver()?{kind:playIsOver()?'result':special||'check',special,color:mover,promotion,key:playStateKey(),acknowledged:false,...(castle?{kingFrom:[fr,fc],kingTo:[tr,tc],rookFrom:[fr,tc===6?7:0],rookTo:[fr,tc===6?5:3]}:{})}:null;
  if(wasCheck&&!special&&game.status==='playing')state.play.notice=t('playKingSafe');
  const mine=state.play.mode==='friend'||(netGame?mover===state.play.net.color:mover==='w');
  if(wasCheck&&mine)awardStars('achievements','play-first-rescue',1);
  if(captured&&mine){
    const first=!progressLedger().achievements['play-first-capture'];awardStars('achievements','play-first-capture',1);
    if(first&&!wasCheck&&!special&&game.status==='playing')state.play.notice='⭐ 첫 말 잡기를 해냈어요! 배운 움직임을 대전에서 써봤어요.';
  }
  if(playIsOver())awardStars('achievements','play-first-finish-'+state.play.mode,1);
  if(playIsOver()){coachSaveRecord();workshopUnlockCheck();}
  if(playIsOver()&&state.play.preset)awardStars('achievements',PLAY_PRESETS[state.play.preset].id,1);
  saveActiveSession();
  const finishMove=() => {
    if (token !== playToken) return;
    state.animating=false;
    if (captured) {
      animateCapture(boardEl, tr, tc, captured, mover === (netGame ? state.play.net.color : 'w') ? 'captured-bottom' : 'captured-top');
    }
    renderPlay();
    playNextTurn();
  };
  if(castle){
    let remaining=2;const complete=()=>{if(--remaining===0)finishMove();else state.animating=true;};
    animateMove(boardEl,fr,fc,tr,tc,piece,complete);
    animateMove(boardEl,fr,tc===6?7:0,fr,tc===6?5:3,mover+'R',complete);
  }else animateMove(boardEl,fr,fc,tr,tc,piece,finishMove);
}

function playNextTurn() {
  if(playDialogState)return;
  const game = state.game, p = state.play;
  if (game.status === 'checkmate') {
    if (p.mode === 'friend' || game.turn !== (p.mode === 'net' ? p.net.color : 'w')) spawnParticles();
    return;
  }
  if (game.status === 'draw') return;
  if (p.mode === 'ai' && game.turn === 'b') playAiMove();
  else playTimerStart();
}

function playPosition(game) {
  return {
    board: game.board,
    turn: game.turn,
    enPassant: game.enPassant,
    castling:game.castling,
    halfmove: game.halfmoveClock,
    repeated: Object.keys(game.positionCounts).filter(k => game.positionCounts[k] >= 2),
  };
}

// 엔진이 고른 수가 ChessGame 규칙에서도 합법인지 확인, 아니면 아무 합법 수
function playLegalOrFallback(mv) {
  const game = state.game;
  if (mv) {
    const [fr, fc, tr, tc] = mv;
    if (game.color(game.board[fr][fc]) === game.turn && game.legalMoves(fr, fc).some(([r, c]) => r === tr && c === tc)) return mv;
  }
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (game.color(game.board[r][c]) === game.turn) {
        game.legalMoves(r, c).forEach(([tr, tc]) => moves.push([r, c, tr, tc]));
      }
    }
  }
  return moves.length ? moves[Math.floor(Math.random() * moves.length)] : null;
}

// --- 컴퓨터 ---
function playAiMove() {
  const token = playToken, started = Date.now();
  playRequestAi(playPosition(state.game), state.play.level, mv => {
    if (token !== playToken) return;
    setTimeout(() => {
      if (token !== playToken) return;
      const move = playLegalOrFallback(mv);
      if (move) playCommitMove(move);
    }, Math.max(0, PLAY_AI_MIN_DELAY - (Date.now() - started)));
  });
}

// 생각하는 동안 화면이 멈추지 않도록 Web Worker에서 계산, 못 쓰면 메인 스레드에서
function playRequestAi(position, level, done) {
  if (playAiWorker === null) {
    try {
      playAiWorker = new Worker('js/chess-ai.js');
      const worker=playAiWorker;
      playAiWorker.onmessage = e => {
        const job = playAiPending[e.data.id];
        delete playAiPending[e.data.id];
        if (job) job.done(e.data.move);
      };
      playAiWorker.onerror = () => {
        if(playAiWorker!==worker)return;
        worker.terminate();
        playAiWorker = false;
        for (const id of Object.keys(playAiPending)) {
          const job = playAiPending[id];
          delete playAiPending[id];
          job.done(aiChooseMove(job.position, job.level,{timeLimitMs:250}));
        }
      };
    } catch {
      playAiWorker = false;
    }
  }
  if (playAiWorker) {
    const id = ++playAiSeq;
    playAiPending[id] = { position, level, done };
    playAiWorker.postMessage({ id, position, level });
  } else {
    setTimeout(() => done(aiChooseMove(position, level,{timeLimitMs:250})), 0);
  }
}

// --- 한 수 타이머 (친구와 대전) ---
function playTimerStart() {
  playTimerStop();
  const p = state.play;
  if (!p || playDialogState || p.mode !== 'friend' || !p.timer || playIsOver()) return;
  p.deadline = Date.now() + (p.pausedLeft ?? p.timer * 1000);
  p.pausedLeft = null;
  p.buzzed = null;
  playTimerResume();
}

function playTimerResume() {
  playTimerHandle = setInterval(playTimerTick, 200);
  playTimerTick();
}

function playTimerStop() {
  if (playTimerHandle) clearInterval(playTimerHandle);
  playTimerHandle = null;
}

function playTimerTick() {
  if(playDialogState)return;
  if(playIsOver()){playTimerStop();return;}
  if (state.screen !== 'play') { playTimerStop(); return; }
  playTimerPaint();
  if (Date.now() >= state.play.deadline) {
    playTimerStop();
    if(state.play.autoMove)playTimeoutMove();
    else { state.play.notice='천천히 생각해도 괜찮아요. 💡 도움을 눌러볼까요?'; state.play.pausedLeft=null;renderPlay(); }
  }
}

// 남은 시간이 줄수록 패널·보드를 주황 → 빨강으로 강조, 마지막 3초는 진동
function playTimerPaint() {
  if(playIsOver())return;
  const p = state.play;
  const panel = document.getElementById('p2-panel-' + state.game.turn);
  if (!panel) return;
  const time=panel.querySelector('.p2-time'),bar=panel.querySelector('.p2-bar-fill');
  if(!time||!bar)return;
  const left = Math.max(0, p.deadline - Date.now());
  const secs = Math.ceil(left / 1000);
  const stage = secs <= 5 ? 'danger' : secs <= Math.min(10, Math.ceil(p.timer / 2)) ? 'warn' : '';
  time.textContent = secs;
  bar.style.width = (left / (p.timer * 1000) * 100) + '%';
  panel.classList.toggle('warn', stage === 'warn');
  panel.classList.toggle('danger', stage === 'danger');
  const boardEl = document.querySelector('#screen-play .chess-board');
  if (boardEl) boardEl.classList.toggle('p2-danger', stage === 'danger');
  if (secs > 0 && secs <= 3 && p.buzzed !== secs) {
    p.buzzed = secs;
    try { if (navigator.vibrate) navigator.vibrate(60); } catch {}
  }
}

function playTimeoutMove() {
  const game = state.game;
  if (state.animating || playDialogState || playIsOver()) return;
  const move = playLegalOrFallback(aiChooseMove(playPosition(game), PLAY_TIMEOUT_LEVEL));
  if (!move) return;
  state.play.timeoutSide = game.turn;
  game.selected = null;
  game.validMoves = [];
  playCommitMove(move);
}

// 앱을 잠깐 내렸다 오면 그동안은 시간이 흐르지 않게 멈춤
document.addEventListener('visibilitychange', () => {
  const p = state.play;
  if (!p) return;
  if (document.hidden && playTimerHandle) {
    p.pausedLeft = p.deadline - Date.now();
    playTimerStop();
  } else if (!document.hidden && p.pausedLeft !== null && state.screen === 'play' && state.activeKind==='play' && !playDialogState && !activityDialog && !playIsOver()) {
    p.deadline = Date.now() + p.pausedLeft;
    p.pausedLeft = null;
    playTimerResume();
  }
});

// --- 리워드 ---
function goReward() {
  leaveActivity();
  showScreen('reward');
  const adventureStars = getTotalStars();
  const puzzleStars = getTotalPuzzleStars();
  const miniStars = getTotalMiniGameStars();
  const allStars = getAllStars();

  const playStars=Object.values(progressLedger().achievements||{}).reduce((a,b)=>a+b,0);
  // 별 출처별 카드
  const sourceCards = `
    <div class="reward-sources"><div class="reward-source"><span class="reward-source-icon">♟</span><span>대전</span><span class="reward-source-val">⭐ ${playStars}</span></div>
      <div class="reward-source"><span class="reward-source-icon">🗺️</span><span>${t('rewardAdventure')}</span><span class="reward-source-val">⭐ ${adventureStars}</span></div>
      <div class="reward-source"><span class="reward-source-icon">🧩</span><span>${t('rewardPuzzle')}</span><span class="reward-source-val">⭐ ${puzzleStars}</span></div>
      <div class="reward-source"><span class="reward-source-icon">🎮</span><span>${t('rewardMiniGame')}</span><span class="reward-source-val">⭐ ${miniStars}</span></div>
    </div>
  `;

  // 스킨 보상 로드맵
  const sortedSkins = Object.entries(SKIN_UNLOCK).sort((a,b) => a[1] - b[1]);
  const roadmap = sortedSkins.map(([name, req]) => {
    const unlocked = allStars >= req;
    const isActive = currentSkin === name;
    const meta = SKIN_META[name];
    const pct = req === 0 ? 100 : Math.min(100, Math.round(allStars / req * 100));
    const preview = ['wK','bK'].map(p => getPieceSVGForSkin(name, p, 24)).join('');

    return `
      <div class="roadmap-item ${unlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}">
        <div class="roadmap-star-req">${req === 0 ? '🎁' : '⭐ ' + req}</div>
        <div class="roadmap-connector"><div class="roadmap-line"></div><div class="roadmap-dot ${unlocked ? 'dot-unlocked' : ''}"></div></div>
        <div class="roadmap-card ${unlocked ? '' : 'roadmap-card-locked'}">
          <div class="roadmap-preview ${unlocked ? '' : 'skin-blur'}">${preview}</div>
          <div class="roadmap-info">
            <div class="roadmap-name">${t(meta.nameKey)}</div>
            ${unlocked
              ? `<div class="roadmap-status unlocked">${isActive ? t('skinCurrent') : t('rewardUnlocked')}</div>`
              : `<div class="roadmap-progress-bar"><div class="roadmap-progress-fill" style="width:${pct}%"></div></div>
                 <div class="roadmap-status locked">⭐ ${allStars}/${req}</div>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('screen-reward').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('rewardTitle')}</h2>
      </div>
      <div class="reward-wrap">
        <div class="reward-hero"><span class="reward-hero-star" aria-hidden="true">⭐</span><div class="reward-hero-text"><div class="reward-big">${allStars}</div><div class="reward-label">내가 모은 별</div></div><button class="action-btn secondary" onclick="goWorkshop('skin','reward')">🎨 꾸미기</button></div>
        ${sourceCards}${learningSummaryHTML()}
        <div class="roadmap-title">${t('rewardRoadmap')}</div>
        <div class="roadmap-list">${roadmap}</div>
      </div>
    </div>
  `;
}

function playRescues(game=state.game) {
  if(game.status!=='check')return [];
  const king=game.findKing(game.turn),attackers=game.attackers(game.board,...king,game.turn==='w'?'b':'w');
  return game.allMoves().map(move=>({move,method:(attackers.some(([r,c])=>r===move[2]&&c===move[3])||(game.board[move[0]][move[1]][1]==='P'&&move[1]!==move[3]&&!game.board[move[2]][move[3]]&&attackers.some(([r,c])=>r===move[0]&&c===move[3])))?'capture':game.board[move[0]][move[1]][1]==='K'?'escape':'block'}));
}
function playAttackOverlay() {
  const g=state.game;if(!state.play.help||g.status!=='check')return '';
  const king=g.findKing(g.turn),attackers=g.attackers(g.board,...king,g.turn==='w'?'b':'w');
  return `<svg class="attack-overlay" viewBox="0 0 800 800" aria-hidden="true">${attackers.map(([r,c])=>`<line x1="${c*100+50}" y1="${r*100+50}" x2="${king[1]*100+50}" y2="${king[0]*100+50}" stroke="#c83c46" stroke-width="9" stroke-dasharray="12 8" opacity=".7"/>`).join('')}</svg>`;
}
function playGuideHTML() {
  const g=state.game,p=state.play;
  if(playIsOver())return '';
  if(g.status!=='check')return p.notice?`<div class="guide-card" role="status">${p.notice}</div>`:'';
  if(!playMineToMove())return `<div class="guide-card">상대 왕을 공격했어요. ${p.mode==='net'?'친구가':'컴퓨터가'} 어떻게 피하는지 살펴봐요.</div>`;
  const rescues=playRescues(),labels={escape:'👑 왕 피하기',capture:'🎯 공격자 잡기',block:'🛡 길 막기'};
  return `<div class="guide-card play-check-guide" role="status"><strong>⚠️ ${t('playCheck')} ${t('playCheckRestriction')}</strong>${p.notice?`<p>${p.notice}</p>`:''}${p.help?`<div class="guide-methods">${Object.keys(labels).filter(k=>rescues.some(r=>r.method===k)).map(k=>`<button class="play-chip" onclick="playShowRescue('${k}')">${labels[k]}</button>`).join('')}</div><small>방패 테두리가 있는 말로 왕을 지킬 수 있어요.</small>`:`<p>${t('playCheckExplained')}</p>`}</div>`;
}
function playActionsHTML() {
  if(state.play.mode==='net')return netActionsHTML();
  return `${state.play.moveEvent?.special&&state.play.moveEvent.acknowledged?'<button class="play-chip" onclick="playPresentEvent(true)">방금 특수 수 다시 보기</button>':''}${playIsOver()?'<button class="play-chip" onclick="playPresentEvent(true)">🏁 '+t('playReviewResult')+'</button>':''}${!playIsOver()&&state.game.selected&&state.game.board[state.game.selected[0]][state.game.selected[1]]?.[1]==='K'?'<button class="play-chip" onclick="playCastlingHelp()">🏰 캐슬링 안내</button>':''}${playGuideChipHTML()}${state.game.status==='check'?'<button class="play-chip" onclick="showGameToast(playGuideHTML(), \'\', true)">🛡 왕 구하기 안내</button>':''}<div class="mission-actions">${undoButton()}${!playIsOver()?'<button class="icon-btn hint-btn" onclick="playHint()">💡 한 수 보기</button><button class="icon-btn" onclick="playDemo()">▶ 시범 보기</button>':''}</div>${playIsOver()?playFinishActionsHTML():`<div class="finish-actions"><button class="action-btn secondary" onclick="playRestartRequest()">새 판</button><button class="action-btn secondary" onclick="leaveActivity();showScreen('home');renderHome()">저장하고 나가기</button></div>`}`;
}
// 끝난 판 아래: 같은 상대 재대결 · (이긴 경우) 다음 단계 · 설정 바꾸기 · 마치기. 확인 창 없이 바로 시작한다.
function playFinishActionsHTML() {
  if(state.play.content?.type==='expedition')return `<div class="finish-actions">${expeditionWon()&&state.play.content.stage<2?'<button class="action-btn green" onclick="expeditionChoices()">'+(state.play.content.stage===0?'동료 고르기':'다음 길 고르기')+'</button>':''}<button class="action-btn" onclick="playRematch()">같은 전투 재도전</button><button class="action-btn secondary" onclick="goExpedition()">원정 입구</button></div>`;
  const next=playNextLevelIndex();
  return `<div class="finish-actions play-finish-actions"><button class="action-btn" onclick="playRematch()">${t('playRematch')}</button>${next!==null?`<button class="action-btn green" onclick="playNextLevel()">${t('playNextLevel').replace('{n}',next+1)}</button>`:''}<button class="action-btn secondary" onclick="playChangeSettings()">${t('playChangeSettings')}</button><button class="action-btn secondary" onclick="leaveActivity();showScreen('home');renderHome()">여기까지</button></div><p class="play-rematch-summary"><strong>${t('playRematchSummary')}</strong> ${playConfigSummary(playConfigOf(state.play))}</p>${state.play.mode==='ai'&&state.play.record?`<button class="text-button play-coach-link" onclick="goCoach('${state.play.record.id}')">🔍 코치와 이 대국 다시 보기</button>`:''}<button class="text-button play-rescue-practice" onclick="goPuzzleLevel(5);showScreen('puzzle')">🛟 왕 구하기 연습</button>`;
}
// 대국 중 새 판은 교체를 확인하고, 확인하면 이 판과 같은 설정으로 시작한다.
function playRestartRequest() {
  const config=playConfigOf(state.play);
  if(playIsOver()||!state.actionHistory?.length){playStart(config);return;}
  playTimerPauseForHelp();
  showChoice(t('playRestartConfirm'),[{label:'새 판 시작',action:()=>playStart(config)},{label:'이어서 두기',action:()=>playTimerStart()}],()=>playTimerStart());
}
function explainPlayMove(g,fr,fc,tr,tc) {
  const p=g.board[fr][fc];
  if(!p||p[0]!==g.turn)return '지금 움직일 수 있는 우리 편 말을 골라요.';
  if(p[1]==='K'&&fr===tr&&Math.abs(tc-fc)===2)return playCastlingReason(g.castlingStatus(p[0],tc<fc?'queen':'king'));
  if(g.board[tr][tc]?.[0]===g.turn)return '우리 편이 있는 칸이에요.';
  const raw=g.rawMoves(g.board,fr,fc,g.enPassant);
  if(raw.some(([r,c])=>r===tr&&c===tc))return g.status==='check'?'아직 왕이 위험해요. 공격선을 피하거나 막아야 해요.':'이 말을 옮기면 왕이 공격받아요. 지금은 왕을 지키고 있어요.';
  const dr=Math.abs(tr-fr),dc=Math.abs(tc-fc),type=p[1];
  if((type==='R'&&(dr===0||dc===0))||(type==='B'&&dr===dc)||(type==='Q'&&(dr===dc||dr===0||dc===0)))return '다른 말이 길을 막고 있어요. 뛰어넘을 수 없어요.';
  return ({P:'폰은 앞으로 가고, 대각선으로 잡아요.',N:'나이트는 두 칸, 옆으로 한 칸 뛰어요.',B:'비숍은 대각선으로 가요.',R:'룩은 가로와 세로로 가요.',Q:'퀸은 가로·세로·대각선으로 가요.',K:'왕은 안전한 곳으로 한 칸씩 가요.'})[type];
}
function playCastlingReason(info) {
  if(state.play?.content&&!(state.play.content.type==='team'&&state.play.content.board==='full'))return '이 콘텐츠의 배치에서는 캐슬링을 하지 않아요. 모든 말로 한 판에서는 할 수 있어요.';
  if(state.play?.preset)return '첫 대전에서는 캐슬링을 하지 않아요. 모든 말로 한 판에서 할 수 있어요.';
  if(state.play?.small)return '이 짧은 판에서는 캐슬링을 하지 않아요. 모든 말로 한 판에서는 할 수 있어요.';
  const square=info.square?'abcdefgh'[info.square[1]]+(8-info.square[0]):'';
  return ({
    'king-moved':'왕을 이미 움직였어요. 원래 자리로 돌아와도 이번 판에는 캐슬링할 수 없어요.',
    'rook-moved':'이쪽 룩을 이미 움직였어요. 원래 자리로 돌아와도 이 룩으로는 캐슬링할 수 없어요.',
    'rook-missing':'함께 움직일 룩이 시작 칸에 없어요.',
    check:'지금 왕이 체크 상태예요. 먼저 왕을 안전하게 해야 캐슬링할 수 있어요.',
    occupied:`왕과 룩 사이의 ${square} 칸에 말이 있어요. 사이를 모두 비워야 캐슬링할 수 있어요.`,
    'through-attacked':`왕이 지나갈 ${square} 칸이 공격받고 있어요. 왕은 위험한 칸을 지나 캐슬링할 수 없어요.`,
    'destination-attacked':`왕이 도착할 ${square} 칸이 공격받고 있어요. 안전한 칸으로만 캐슬링할 수 있어요.`,
  })[info.reason]||'왕을 고른 뒤 ‘캐슬링’ 표시 칸이나 함께 움직일 룩을 눌러요. 왕과 룩이 함께 움직여요.';
}
// 대전 중 모르는 말이 있으면 그 말의 움직임만 다시 본다. 판 아래 버튼이라 보드 위치는 그대로다.
const PLAY_PIECE_RULES = {P:'폰은 앞으로 한 칸 가요. 처음 움직일 때는 두 칸까지 갈 수 있고, 잡을 때는 대각선 앞으로 가요.',N:'나이트는 두 칸 간 뒤 옆으로 한 칸, ㄴ 모양으로 뛰어요. 다른 말을 뛰어넘을 수 있어요.',B:'비숍은 대각선으로 원하는 만큼 가요. 다른 말을 뛰어넘을 수는 없어요.',R:'룩은 가로와 세로로 원하는 만큼 가요. 다른 말을 뛰어넘을 수는 없어요.',Q:'퀸은 가로·세로·대각선으로 원하는 만큼 가요. 다른 말을 뛰어넘을 수는 없어요.',K:'왕은 모든 방향으로 한 칸씩 가요. 공격받는 칸으로는 갈 수 없어요.'};
function playGuideChipHTML() {
  const g=state.game,sel=g.selected,piece=sel&&g.board[sel[0]][sel[1]];
  if(playIsOver()||!piece||piece[0]!==g.turn||!playMineToMove())return '';
  return `<button class="play-chip play-guide-chip" onclick="playPieceGuide('${piece[1]}')">${getPieceSVG('w'+piece[1],22)} ${t(PIECE_NAMES[piece[1]])} 움직임 보기</button>`;
}
// 5×5 그림: 가운데 말에서 갈 수 있는 칸(점)과 폰이 잡는 칸(×)
function playPieceGuideBoard(type) {
  const c=2,moves=new Set(),captures=new Set(),add=(r,col,set=moves)=>{if(r>=0&&r<5&&col>=0&&col<5)set.add(r+','+col);};
  const lines={R:[[1,0],[-1,0],[0,1],[0,-1]],B:[[1,1],[1,-1],[-1,1],[-1,-1]]};lines.Q=[...lines.R,...lines.B];
  if(lines[type])for(const [dr,dc] of lines[type])for(let k=1;k<5;k++)add(c+dr*k,c+dc*k);
  if(type==='N')for(const [dr,dc] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]])add(c+dr,c+dc);
  if(type==='K')for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)add(c+dr,c+dc);
  if(type==='P'){add(c-1,c);add(c-2,c);add(c-1,c-1,captures);add(c-1,c+1,captures);}
  let cells='';
  for(let r=0;r<5;r++)for(let col=0;col<5;col++){const key=r+','+col;cells+=`<span class="${(r+col)%2?'dark':'light'}">${r===c&&col===c?getPieceSVG('w'+type,30):moves.has(key)?'<i class="pg-dot"></i>':captures.has(key)?'<i class="pg-capture">×</i>':''}</span>`;}
  return `<div class="piece-guide-board" role="img" aria-label="${t(PIECE_NAMES[type])} · 갈 수 있는 칸 ${moves.size}개${captures.size?' · 잡는 칸 '+captures.size+'개':''}">${cells}</div>`;
}
function playPieceGuide(type) {
  if(!PLAY_PIECE_RULES[type])return;
  playTimerPauseForHelp();noteHelp(1);
  showActivityDialog(t(PIECE_NAMES[type])+' 움직임',`${playPieceGuideBoard(type)}<p>${PLAY_PIECE_RULES[type]}</p><p class="section-note">점은 갈 수 있는 칸${type==='P'?', ×는 상대 말이 있을 때 잡는 칸':''}이에요. 실제 판에서는 다른 말이 길을 막을 수 있어요.</p>`,[
    {label:'계속 두기',action:()=>playTimerStart()},
    {label:'모험에서 연습하기',action:()=>{leaveActivity();showScreen('learn');goStageMap(type);}},
  ],'choice-overlay',()=>playTimerStart());
}
function playCastlingHelp() {
  if(playIsOver())return;
  playTimerPauseForHelp();
  const g=state.game,notes=state.play.small?`<p>${playCastlingReason({})}</p>`:['king','queen'].map(side=>{
    const info=g.castlingStatus(g.turn,side),square='abcdefgh'[info.to]+(8-info.row);
    return `<p><strong>${side==='king'?'킹 쪽':'퀸 쪽'} · ${square}: ${info.allowed?'가능해요':'할 수 없어요'}</strong><br>${playCastlingReason(info)}</p>`;
  }).join('');
  showGameToast(`<strong>🏰 왕과 룩이 함께, 캐슬링</strong><p>왕을 먼저 고르고 표시 칸이나 룩을 눌러요. 왕이 두 칸 가고 룩이 옆으로 와요.</p>${notes}<small>왕과 해당 룩은 처음 움직여야 해요. 사이가 비어 있고, 왕의 현재·통과·도착 칸이 모두 안전해야 해요.</small>`, '', true, true);
}
function playShowRescue(method) {
  if(!playMineToMove())return;
  const rescue=playRescues().find(r=>r.method===method);if(!rescue)return;
  playTimerPauseForHelp();renderPlay();showHintArrow(document.querySelector('#screen-play .chess-board'),...rescue.move,8,'이 한 수를 직접 움직여 봐요.');
}
function playTimerPauseForHelp() {
  if(playTimerHandle){state.play.pausedLeft=Math.max(0,state.play.deadline-Date.now());playTimerStop();}
}
function playHint() {
  if(state.animating||playIsOver()||!playMineToMove())return;
  playTimerPauseForHelp();
  const move=playRescues()[0]?.move||aiChooseMove(playPosition(state.game),AI_HINT_LEVEL);
  if(move){state.play.hintMove=move;renderPlay();showHintArrow(document.querySelector('#screen-play .chess-board'),...move,8,'화살표의 한 수를 직접 움직여 봐요.');}
}
function playDemo() {
  if(state.animating||playIsOver()||!playMineToMove())return;
  playTimerPauseForHelp();
  const m=playRescues()[0]?.move||aiChooseMove(playPosition(state.game),AI_HINT_LEVEL);if(!m)return;
  noteHelp(3);
  animateMove(document.querySelector('#screen-play .chess-board'),...m,state.game.board[m[0]][m[1]],()=>{state.play.notice='이렇게 움직일 수 있어요. 이제 직접 해볼까요?';renderPlay();});
}

function playChoosePromotion(move){
  playTimerPauseForHelp();state.animating=true;
  showChoice('폰이 끝줄에 도착했어요! 어떤 말로 바꿀까요?',[...['Q','R','B','N'].map(type=>({label:t(PIECE_NAMES[type])+(type==='Q'?' · 추천':''),action:()=>{state.animating=false;playCommitMove([...move,type]);}})),{label:'선택 취소',action:()=>{state.animating=false;renderPlay();playTimerStart();}}]);
}
