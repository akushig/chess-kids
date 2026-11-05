// Standard-chess content uses the same board, AI and event lifecycle as ordinary play.
function playContentValid(c){
 if(!c||c.version!==1)return false;
 if(c.type==='expedition')return Number.isInteger(c.stage)&&c.stage>=0&&c.stage<=2&&(c.stage===0?c.recruit===null:['B','N'].includes(c.recruit))&&(c.stage<2?c.route===null:['diagonal','jump'].includes(c.route));
 return false;
}
function playContentConfig(c){return playContentValid(c)?copyData(c):null;}
function playContentTitle(c){return c?.type==='expedition'?`체스 원정대 · ${c.stage+1}/3전`:'';}
function playContentGame(c){
 if(c.type==='expedition'){
  const g=ChessGame.fromFEN(PLAY_SMALL_FEN);
  if(c.stage>0){g.board[7][1]='w'+c.recruit;g.board[0][1]='b'+(c.stage===1?c.recruit:c.route==='diagonal'?'B':'N');}
  if(c.stage===2){g.board[6][5]='wP';g.board[1][5]='bP';g.board[0][3]=null;g.board[0][c.route==='diagonal'?5:2]='bR';}
  g.positionCounts={};g.recordPosition();g.updateStatus();return g;
 }
 return null;
}
function playContentKeepsSession(){const c=state.play?.content;return c?.type==='expedition'&&!(c.stage===2&&state.game.status==='checkmate'&&state.game.turn==='b');}
function playContentIntro(c){return c?.type==='expedition'?'표준 체스로 3번의 전투에 도전해요. 이기면 다음 팀과 길을 고를 수 있어요.':'';}
function contentLevelPicker(){return `<label>컴퓨터 난이도<select id="content-level">${AI_LEVELS.map((_,i)=>`<option value="${i}" ${getPlaySettings().level===i?'selected':''}>${playLevelLabel(i)}</option>`).join('')}</select></label>`;}
function contentChosenLevel(){const level=Number(document.getElementById('content-level')?.value);return Number.isInteger(level)&&level>=0&&level<10?level:getPlaySettings().level;}
function goExpedition(){leaveActivity();showScreen('mini');
 document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 전체 놀이</button><h2>체스 원정대</h2></div><p class="section-note">왕·폰·룩으로 출발해요. 이기면 동료를 고르고, 다음에는 상대 배치를 보고 길을 골라요. 잡힌 말은 다음 전투에서 돌아와요.</p>${savedActivityCard('play')}<div class="content-cards"><div class="content-card"><strong>1 · 출발</strong><span>룩 앞의 길을 열어요.</span></div><div class="content-card"><strong>2 · 동료 영입</strong><span>비숍과 나이트 중 누구와 갈까요?</span></div><div class="content-card"><strong>3 · 마지막 갈림길</strong><span>상대 배치를 보고 길을 골라요.</span></div></div><div class="content-form">${contentLevelPicker()}</div><button class="action-btn green" onclick="startExpeditionRequest()">새 원정 출발</button><p class="section-note">한 번에 끝내지 않아도 돼요. 저장하고 나중에 이어갈 수 있어요. 패배·무승부는 같은 전투를 다시 해요.</p></div>`;
}
function startExpeditionRequest(){const level=contentChosenLevel();requestNewActivity('play',()=>playStart({...getPlaySettings(),mode:'ai',small:false,preset:null,level,content:{version:1,type:'expedition',stage:0,recruit:null,route:null}}));}
function expeditionWon(){return state.game.status==='checkmate'&&state.game.turn==='b';}
function expeditionAdvance(choice){const c=state.play?.content;if(c?.type!=='expedition'||!expeditionWon())return;
 if(c.stage===0&&['B','N'].includes(choice))playStart({...state.play,content:{...c,stage:1,recruit:choice}});
 else if(c.stage===1&&['diagonal','jump'].includes(choice))playStart({...state.play,content:{...c,stage:2,route:choice}});
}
function expeditionChoices(){const c=state.play?.content;if(c?.type!=='expedition'||!expeditionWon()||c.stage===2)return;
 const options=c.stage===0?[['B','비숍 영입','대각선으로 멀리 움직이는 동료'],['N','나이트 영입','말을 뛰어넘어 들어가는 동료']]:[['diagonal','비숍의 길','상대: 왕·폰·비숍·f줄 룩'],['jump','나이트의 길','상대: 왕·폰·나이트·c줄 룩']];
 showActivityDialog(c.stage===0?'함께 갈 동료를 골라요':'마지막 상대를 골라요',`<p>다음 전투에서는 잡힌 말도 모두 돌아와요. 컴퓨터 난이도는 그대로예요.</p><div class="content-cards">${options.map(([key,title,desc])=>{const next={...c,stage:c.stage+1,...(c.stage===0?{recruit:key}:{route:key})};const g=playContentGame(next);return `<div class="content-card"><strong>${title}</strong><span>${desc}</span>${contentBoardPreview(g)}</div>`;}).join('')}</div>`,options.map(([key,title])=>({label:title,action:()=>expeditionAdvance(key)})).concat([{label:'나중에 고르기',action:()=>{}}]));
}
function contentBoardPreview(g){return `<div class="practice-board" style="grid-template-columns:repeat(8,1fr)" role="img" aria-label="다음 전투 시작 배치">${g.board.flatMap((row,r)=>row.map((p,c)=>`<span style="background:${(r+c)%2?'#c29b62':'#f2dfb8'}">${p?getPieceSVG(p,22):''}</span>`)).join('')}</div>`;}
function playContentResultActions(){const c=state.play?.content;if(c?.type!=='expedition')return null;
 const actions=[];if(expeditionWon()&&c.stage<2)actions.push({label:c.stage===0?'동료 고르기':'다음 길 고르기',tone:'green',action:expeditionChoices});
 actions.push({label:expeditionWon()?'이 전투 다시 두기':'같은 전투 재도전',action:playRematch});
 actions.push({label:'원정 입구',secondary:true,action:goExpedition});return actions;
}
function playContentPanel(){const c=state.play?.content;if(c?.type!=='expedition')return '';
 return `<div class="content-context"><strong>${playContentTitle(c)}</strong><span>${c.recruit?t(PIECE_NAMES[c.recruit])+'와 함께':'왕·폰·룩으로 출발'}${c.route?' · '+(c.route==='diagonal'?'비숍의 길':'나이트의 길'):''}</span>${playIsOver()?`<p>${expeditionWon()?(c.stage===2?'🏆 세 전투를 모두 마쳤어요! 다른 동료와 길도 골라봐요.':'승리! 다음 선택이 기다려요.'):'이번 전투부터 다시 도전할 수 있어요.'}</p>`:''}</div>`;
}
function playContentMenuHTML(){return `<section class="activity-group"><h3>새로운 대전</h3><div class="content-cards"><button class="content-card" onclick="goExpedition()"><strong>🏕 체스 원정대</strong><span>동료와 길을 고르는 3전 원정</span></button></div></section>`;}
