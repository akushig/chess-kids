const PLAY_SCENES = [
 {id:'race-1-v1',title:'마지막 한 걸음',goal:'promotion',fen:'7k/P7/8/4K3/8/8/7p/8 w - - 0 1',note:'흰 폰을 끝줄까지 보내 새로운 말로 바꿔요.',witness:[[1,0,0,0,'Q']]},
 {id:'race-2-v1',title:'서로 달리는 폰',goal:'promotion',fen:'7k/8/1P6/4K3/8/6p1/8/8 w - - 0 1',note:'상대 폰도 달려요. 내 폰의 승격을 먼저 만들어봐요.',witness:[[2,1,1,1],[5,6,6,6],[1,1,0,1,'Q']]},
 {id:'defend-1-v1',title:'직선 공격에서 구출',goal:'rescue',fen:'4r1k1/8/8/8/8/8/3R4/4K3 w - - 0 1',note:'지금 우리 왕이 체크예요. 안전한 곳으로 가거나 공격을 막아요.',witness:[[6,3,6,4]]},
 {id:'defend-2-v1',title:'대각선 공격에서 구출',goal:'rescue',fen:'7k/8/8/8/1b6/8/R7/4K3 w - - 0 1',note:'비숍의 공격선을 살펴보고 왕을 구해요.',witness:[[6,0,6,3]]},
 {id:'finish-1-v1',title:'퀸과 왕의 마무리',goal:'mate',fen:'7k/8/5KQ1/8/8/8/8/8 w - - 0 1',note:'퀸과 왕이 힘을 합쳐 체크메이트로 끝내요.',witness:[[2,6,1,6]]},
 {id:'finish-2-v1',title:'룩과 왕의 마무리',goal:'mate',fen:'7k/R7/6K1/8/8/8/8/8 w - - 0 1',note:'룩으로 길을 막고 왕으로 도망갈 칸을 지켜요.',witness:[[1,0,0,0]]},
];
// Standard-chess content uses the same board, AI and event lifecycle as ordinary play.
function playContentValid(c){
 if(!c||c.version!==1)return false;
 if(c.type==='scene')return PLAY_SCENES.some(p=>p.id===c.id)&&typeof c.achieved==='boolean';
 if(c.type==='team')return ['full','small','R','B','N'].includes(c.board)&&Array.isArray(c.names)&&c.names.length===2&&c.names.every(n=>typeof n==='string'&&n.trim().length>0&&n.length<=16&&!/[<>\u0000-\u001f]/.test(n))&&Number.isInteger(c.turns)&&c.turns>=0&&c.turns<100000;
 if(c.type==='lessonPractice')return lessonPracticeValid(c);
 if(c.type==='expedition')return Number.isInteger(c.stage)&&c.stage>=0&&c.stage<=2&&(c.stage===0?c.recruit===null:['B','N'].includes(c.recruit))&&(c.stage<2?c.route===null:['diagonal','jump'].includes(c.route));
 return false;
}
function playContentConfig(c){return playContentValid(c)?copyData(c):null;}
function playContentTitle(c){if(c?.type==='lessonPractice')return '수업 배치로 대전';if(c?.type==='scene')return PLAY_SCENES.find(p=>p.id===c.id)?.title||'승부의 한 장면';if(c?.type==='team')return '우리 팀 체스';return c?.type==='expedition'?`체스 원정대 · ${c.stage+1}/3전`:'';}
function playContentGame(c){
 if(c.type==='lessonPractice')return lessonPracticeGame(c);
 if(c.type==='scene')return ChessGame.fromFEN(PLAY_SCENES.find(p=>p.id===c.id).fen);
 if(c.type==='team')return c.board==='full'?new ChessGame():ChessGame.fromFEN(c.board==='small'?PLAY_SMALL_FEN:PLAY_PRESETS[c.board].fen);
 if(c.type==='expedition'){
  const g=ChessGame.fromFEN(PLAY_SMALL_FEN);
  if(c.stage>0){g.board[7][1]='w'+c.recruit;g.board[0][1]='b'+(c.stage===1?c.recruit:c.route==='diagonal'?'B':'N');}
  if(c.stage===2){g.board[6][5]='wP';g.board[1][5]='bP';g.board[0][3]=null;g.board[0][c.route==='diagonal'?5:2]='bR';}
  g.positionCounts={};g.recordPosition();g.updateStatus();return g;
 }
 return null;
}
function playContentKeepsSession(){const c=state.play?.content;return c?.type==='expedition'&&!(c.stage===2&&state.game.status==='checkmate'&&state.game.turn==='b');}
function playContentIntro(c){if(c?.type==='lessonPractice')return '수업에서 본 배치예요. 이제 표준 체스로 끝까지 두어요.';if(c?.type==='scene')return PLAY_SCENES.find(p=>p.id===c.id).note;if(c?.type==='team')return '둘이 같은 흰색 팀이에요. 컴퓨터가 두고 나면 다음 팀원 차례예요.';return c?.type==='expedition'?'표준 체스로 3번의 전투에 도전해요. 이기면 다음 팀과 길을 고를 수 있어요.':'';}
function contentLevelPicker(){return `<label>컴퓨터 난이도<select id="content-level">${AI_LEVELS.map((_,i)=>`<option value="${i}" ${getPlaySettings().level===i?'selected':''}>${playLevelLabel(i)}</option>`).join('')}</select></label>`;}
function contentChosenLevel(){const level=Number(document.getElementById('content-level')?.value);return Number.isInteger(level)&&level>=0&&level<10?level:getPlaySettings().level;}
function goExpedition(){leaveActivity();showScreen('mini');
 document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 전체 놀이</button><h2>체스 원정대</h2></div><p class="section-note">왕·폰·룩으로 출발해요. 이기면 동료를 고르고, 다음에는 상대 배치를 보고 길을 골라요. 잡힌 말은 다음 전투에서 돌아와요.</p>${contentSavedCard('expedition')}<div class="content-cards"><div class="content-card"><strong>1 · 출발</strong><span>룩 앞의 길을 열어요.</span></div><div class="content-card"><strong>2 · 동료 영입</strong><span>비숍과 나이트 중 누구와 갈까요?</span></div><div class="content-card"><strong>3 · 마지막 갈림길</strong><span>상대 배치를 보고 길을 골라요.</span></div></div><div class="content-form">${contentLevelPicker()}</div><button class="action-btn green" onclick="startExpeditionRequest()">새 원정 출발</button><p class="section-note">한 번에 끝내지 않아도 돼요. 저장하고 나중에 이어갈 수 있어요. 패배·무승부는 같은 전투를 다시 해요.</p></div>`;
}
function startExpeditionRequest(){const level=contentChosenLevel();requestContentActivity('expedition',()=>playStart({...getPlaySettings(),mode:'ai',small:false,preset:null,level,content:{version:1,type:'expedition',stage:0,recruit:null,route:null}}));}
function expeditionWon(){return state.game.status==='checkmate'&&state.game.turn==='b';}
function expeditionAdvance(choice){const c=state.play?.content;if(c?.type!=='expedition'||!expeditionWon())return;
 if(c.stage===0&&['B','N'].includes(choice))playStart({...state.play,content:{...c,stage:1,recruit:choice}});
 else if(c.stage===1&&['diagonal','jump'].includes(choice))playStart({...state.play,content:{...c,stage:2,route:choice}});
}
function expeditionChoices(){const c=state.play?.content;if(c?.type!=='expedition'||!expeditionWon()||c.stage===2)return;
 const options=c.stage===0?[['B','비숍 영입','대각선으로 멀리 움직이는 동료'],['N','나이트 영입','말을 뛰어넘어 들어가는 동료']]:[['diagonal','비숍의 길','상대: 왕·폰·비숍·f줄 룩'],['jump','나이트의 길','상대: 왕·폰·나이트·c줄 룩']];
 showActivityDialog(c.stage===0?'함께 갈 동료를 골라요':'마지막 상대를 골라요',`<p>다음 전투에서는 잡힌 말도 모두 돌아와요. 컴퓨터 난이도는 그대로예요.</p><div class="content-cards">${options.map(([key,title,desc])=>{const next={...c,stage:c.stage+1,...(c.stage===0?{recruit:key}:{route:key})};const g=playContentGame(next);return `<div class="content-card"><strong>${title}</strong><span>${desc}</span>${contentBoardPreview(g)}</div>`;}).join('')}</div>`,options.map(([key,title])=>({label:title,action:()=>expeditionAdvance(key)})).concat([{label:'나중에 고르기',action:()=>{}}]));
}
function contentBoardPreview(g){return `<div class="practice-board content-board-preview" style="grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr)" role="img" aria-label="다음 전투 시작 배치">${g.board.flatMap((row,r)=>row.map((p,c)=>`<span style="background:${(r+c)%2?'#c29b62':'#f2dfb8'}">${p?getPieceSVG(p,22):''}</span>`)).join('')}</div>`;}
function playContentResultActions(){const c=state.play?.content;if(c?.type!=='expedition')return null;
 const actions=[];if(expeditionWon()&&c.stage<2)actions.push({label:c.stage===0?'동료 고르기':'다음 길 고르기',tone:'green',action:expeditionChoices});
 actions.push({label:expeditionWon()?'이 전투 다시 두기':'같은 전투 재도전',action:playRematch});
 actions.push({label:'원정 입구',secondary:true,action:goExpedition});return actions;
}
function playContentPanel(){const c=state.play?.content;if(c?.type==='lessonPractice')return lessonPracticePanel();if(c?.type==='scene')return scenePanel();if(c?.type==='team')return teamPanel();if(c?.type!=='expedition')return '';
 return `<div class="content-context"><strong>${playContentTitle(c)}</strong><span>${c.recruit?t(PIECE_NAMES[c.recruit])+'와 함께':'왕·폰·룩으로 출발'}${c.route?' · '+(c.route==='diagonal'?'비숍의 길':'나이트의 길'):''}</span>${playIsOver()?`<p>${expeditionWon()?(c.stage===2?'🏆 세 전투를 모두 마쳤어요! 다른 동료와 길도 골라봐요.':'승리! 다음 선택이 기다려요.'):'이번 전투부터 다시 도전할 수 있어요.'}</p>`:''}</div>`;
}
function playContentMenuHTML(){return `<section class="activity-group"><h3>새로운 대전</h3><div class="content-cards"><button class="content-card" onclick="goExpedition()"><strong>🏕 체스 원정대</strong><span>동료와 길을 고르는 3전 원정</span></button><button class="content-card" onclick="goTeamChess()"><strong>🤝 우리 팀 체스</strong><span>둘이 한 팀으로 컴퓨터에 도전</span></button><button class="content-card" onclick="goPlayScenes()"><strong>🎯 승부의 한 장면</strong><span>승격·왕 구하기·체크메이트 6장면</span></button></div></section>`;}

function playContentInitial(c){const next=copyData(c);if(next.type==='team')next.turns=0;if(next.type==='scene')next.achieved=false;return next;}
function playContentAfterMove(mover,piece,tr){const c=state.play.content;if(c?.type==='scene'&&mover==='w'){const goal=PLAY_SCENES.find(p=>p.id===c.id).goal;if(goal==='rescue'||goal==='promotion'&&piece==='wP'&&tr===0||goal==='mate'&&expeditionWon()){c.achieved=true;writeData('scene_done',[...new Set([...readData('scene_done',[]),c.id])]);}}if(c?.type==='team'&&mover==='w')c.turns++;state.play.teamPlan=false;state.play.teamProposal=null;}
function teamStatus(){const p=state.play,c=p.content;if(c?.type!=='team'||playIsOver())return null;
 const name=profileText(c.names[c.turns%2]);return {tone:state.game.status==='check'?'warn':state.game.turn==='b'?'dim':'',icon:state.game.status==='check'?'⚠️':'🤝',title:state.game.turn==='w'?name+' 차례':'컴퓨터가 생각해요',detail:state.game.status==='check'?state.game.turn==='w'?'우리 왕이 체크! 왕을 안전하게 지켜요.':'상대 왕이 체크예요. 컴퓨터의 응수를 기다려요.':state.game.turn==='w'?'같은 흰색 팀이에요. 한 수를 골라요.':'다음은 '+name+' 차례예요.'};
}
function goTeamChess(){leaveActivity();showScreen('mini');document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 전체 놀이</button><h2>우리 팀 체스</h2></div><p class="section-note">한 기기에서 둘이 같은 흰색 팀으로 컴퓨터를 상대해요. 첫 번째 사람 → 컴퓨터 → 두 번째 사람 → 컴퓨터 순서예요.</p>${contentSavedCard('team')}<div class="content-form"><label>첫 번째 팀원<input id="team-first" maxlength="16" value="나" /></label><label>두 번째 팀원<input id="team-second" maxlength="16" value="가족" /></label>${contentLevelPicker()}<label>시작 배치<select id="team-board"><option value="small">말이 적은 짧은 판</option><option value="R">룩과 함께</option><option value="B">비숍과 함께</option><option value="N">나이트와 함께</option><option value="full">모든 말로 한 판</option></select></label></div><button class="action-btn green" onclick="startTeamRequest()">우리 팀 출발</button><p id="team-error" role="alert"></p></div>`;}
function startTeamRequest(){const c={version:1,type:'team',names:['team-first','team-second'].map(id=>document.getElementById(id).value.trim()),board:document.getElementById('team-board').value,turns:0};if(!playContentValid(c)||c.names[0]===c.names[1]){document.getElementById('team-error').textContent='구별되는 이름을 1~16자로 입력해 주세요. 꺾쇠 기호는 사용할 수 없어요.';return;}const level=contentChosenLevel();requestContentActivity('team',()=>playStart({...getPlaySettings(),mode:'ai',preset:null,small:false,level,content:c}));}
function teamPanel(){const p=state.play,c=p.content;return `<div class="content-context"><strong>🤝 ${c.names.map(profileText).join(' + ')} · 같은 흰색 팀</strong><span>${playIsOver()?(expeditionWon()?'우리 팀이 이겼어요!':'함께 끝까지 두었어요.'):'서로의 수를 이어서 함께 두어요.'}</span>${!playIsOver()?`<button class="play-chip" onclick="teamThinking()" ${state.game.turn!=='w'?'disabled':''}>${p.teamPlan?'후보 표시 취소':'함께 생각하기 · 후보 표시'}</button><span>${p.teamPlan?'말을 고른 뒤 도착할 칸을 눌러요. 실제로 움직이지는 않아요.':p.teamProposal?'테두리는 함께 생각한 후보예요. 실제로 두려면 말을 다시 골라요.':'각자 자기 차례에 움직여요.'}</span>`:''}</div>`;}
function teamThinking(){if(state.game.turn!=='w'||playIsOver()||state.play.content?.type!=='team')return;state.play.teamPlan=!state.play.teamPlan;state.play.teamProposal=null;state.game.selected=null;state.game.validMoves=[];renderPlay();}
function teamRecordProposal(fr,fc,tr,tc){if(!state.play.teamPlan)return false;state.play.teamProposal=[fr,fc,tr,tc];state.play.teamPlan=false;state.game.selected=null;state.game.validMoves=[];renderPlay();return true;}

function goPlayScenes(){leaveActivity();showScreen('mini');const done=readData('scene_done',[]);document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 전체 놀이</button><h2>승부의 한 장면</h2></div><p class="section-note">결정적인 장면부터 직접 두어요. 한 가지 정답 수만 따라갈 필요는 없어요. 목표를 이룬 뒤에도 대국을 계속할 수 있어요.</p>${contentSavedCard('scene')}<div class="content-form">${contentLevelPicker()}</div><div class="content-cards">${PLAY_SCENES.map((p,i)=>`<button class="content-card" onclick="openPlayScene(${i})"><strong>${p.title}${done.includes(p.id)?' ✓':''}</strong><span>${p.note}</span>${contentBoardPreview(ChessGame.fromFEN(p.fen))}</button>`).join('')}</div></div>`;}
function openPlayScene(index){const p=PLAY_SCENES[index];if(!p)return;const level=contentChosenLevel();requestContentActivity('scene',()=>playStart({...getPlaySettings(),mode:'ai',level,small:false,preset:null,content:{version:1,type:'scene',id:p.id,achieved:false}}));}
function scenePanel(){const c=state.play.content,p=PLAY_SCENES.find(p=>p.id===c.id);return `<div class="content-context"><strong>${c.achieved?'✓ 장면 목표 달성':'🎯 장면 목표'}</strong><span>${c.achieved?(p.goal==='mate'?'체크메이트로 대국도 이겼어요.':playIsOver()?'장면 목표는 달성했어요. 대국 결과는 위의 승패 안내에서 확인해요.':'목표를 해냈어요. 대국 승패는 아직 별개예요. 계속 두거나 다른 장면을 골라도 좋아요.'):p.note}</span><button class="play-chip" onclick="goPlayScenes()">다른 장면 고르기</button></div>`;}

function contentSaved(type){const archived=getSavedSession(readData('play_content_saves',{})[type]??null),legacy=activitySaved('play');return archived||(legacy?.snapshot.values.play.content?.type===type?legacy:null);}
function resumeContent(type){saveActiveSession();const s=contentSaved(type);if(!s)return;const sessions=readData('sessions',{});sessions.play=s;writeData('sessions',sessions);resumeActivity('play');}
function contentSavedCard(type){const s=contentSaved(type);return s&&!s.complete?`<button class="action-btn secondary" onclick="resumeContent('${type}')">▶ ${playContentTitle(s.snapshot.values.play.content)} 이어하기</button>`:'';}
function requestContentActivity(type,start){saveActiveSession();const current=activitySaved('play');if(current){const archive=readData('play_content_saves',{});archive[current.snapshot.values.play.content?.type||'standard']=current;writeData('play_content_saves',archive);}const s=contentSaved(type);if(!s||s.complete)return start();showChoice('이 콘텐츠의 하던 판을 바꾸고 새로 시작할까요?',[{label:'하던 판 이어하기',action:()=>resumeContent(type)},{label:'새 판 시작',action:start},{label:'취소',action:()=>{}}]);}
