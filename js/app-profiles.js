// Profiles are names for independent local saves. Every profile has the same features.
function profileText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function profileInfo(id=activeProfile){return allProfiles().find(p=>p.id===id)||{id:activeProfile,name:'플레이어',icon:PROFILE_ICONS[0]};}
function refreshProfileView(){currentSkin=safeStore.getItem('skin')||'cute';applyPreferences();state.game=null;state.play=null;closeActivityDialog(false);showScreen('home');renderHome();}
function switchProfile(id){
 if(!allProfiles().some(p=>p.id===id))return;
 leaveActivity();activeProfile=id;try{localStorage.setItem('chess_active_profile',id);}catch{storageUnavailable=true;}
 refreshProfileView();
}
function openFamilySettings(){
 const prefs=readData('preferences',{}),current=profileInfo();
 showActivityDialog('프로필 · 설정',`<p>이름별로 하던 판과 설정, 꾸미기를 따로 보관해요. 모든 프로필에서 같은 게임을 할 수 있어요. 혼자 쓴다면 하나면 충분해요.</p>
 <div class="profile-list">${allProfiles().map(p=>`<div class="profile-row"><button class="profile-button ${p.id===activeProfile?'active':''}" aria-pressed="${p.id===activeProfile}" onclick="switchProfile('${p.id}')">${p.icon} ${profileText(p.name)} ${p.id===activeProfile?'✓':''}</button><button class="profile-edit" aria-label="${profileText(p.name)} 수정" onclick="openProfileEditor('${p.id}')">수정</button></div>`).join('')}</div>
 <button class="action-btn secondary profile-add" onclick="openProfileEditor()">＋ 프로필 추가</button>
 <section class="profile-transfer"><h3>휴대폰을 바꿀 때</h3><p>파일로 저장한 뒤 새 휴대폰에서 불러오세요. 자동으로 동기화되지는 않아요.</p><button class="action-btn secondary" onclick="downloadProfile()">${profileText(current.name)} 내보내기</button><button class="action-btn secondary" onclick="document.getElementById('profile-import-file').click()">프로필 파일 불러오기</button><input id="profile-import-file" type="file" accept=".json,application/json" hidden onchange="readProfileFile(this.files[0]);this.value=''" /></section>
 <details class="profile-preferences"><summary>소리 · 화면 · 시작 추천</summary><div class="experience-options"><p>시작 추천</p>${[['beginner','처음 해요'],['familiar','조금 알아요'],['challenge','도전하고 싶어요']].map(([v,label])=>`<button class="play-chip" aria-pressed="${readData('experience','beginner')===v}" onclick="setProfileExperience('${v}')">${label}</button>`).join('')}</div><div class="play-options"><button class="play-chip" onclick="setPreference('voice',${!prefs.voice})">🔊 자동 안내 읽기 ${prefs.voice?'켜짐':'꺼짐'}</button><button class="play-chip" onclick="setPreference('motion',${prefs.motion===false})">움직임 ${prefs.motion===false?'적게':'보통'}</button><button class="play-chip" onclick="setPreference('badges',${prefs.badges===false})">말 이름 ${prefs.badges===false?'숨김':'보임'}</button></div><p class="section-note">대전 난이도와 도움은 대전 화면에서 바꿀 수 있어요.</p></details>
 <button class="text-button" onclick="openProfileRecords()">놀이 기록 보기</button><button class="text-button profile-delete" ${allProfiles().length===1?'disabled':''} onclick="requestProfileDelete()">${profileText(current.name)} 삭제</button>${allProfiles().length===1?'<p class="section-note">프로필은 하나 이상 필요해요. 이름은 수정할 수 있어요.</p>':''}`,[{label:'설정 마치기',action:()=>{}}],'family-overlay');
}
function setPreference(key,value){const p=readData('preferences',{});p[key]=value;writeData('preferences',p);applyPreferences();openFamilySettings();}
function setProfileExperience(value){writeData('experience',value);openFamilySettings();document.querySelector('.profile-preferences')?.setAttribute('open','');}
function applyPreferences(){document.documentElement?.classList.toggle('reduced-motion',readData('preferences',{}).motion===false);}
function openProfileRecords(){showActivityDialog('놀이 기록',learningSummaryHTML(),[{label:'프로필 · 설정으로',action:openFamilySettings}]);}
let profileEditorDone=null;
function openProfileEditor(id=null,onDone=null){
 const existing=id?allProfiles().find(p=>p.id===id):null;if(id&&!existing)return;
 profileEditorDone=onDone;
 showActivityDialog(existing?'프로필 수정':'프로필 추가',`<form id="profile-editor" onsubmit="event.preventDefault();saveProfileEditor()"><label for="profile-name">이름</label><input id="profile-name" name="profile-name" type="text" maxlength="24" autocomplete="off" required aria-describedby="profile-editor-error" /><fieldset><legend>아이콘</legend><div class="profile-icons">${PROFILE_ICONS.map(icon=>`<button type="button" aria-label="${icon}" aria-pressed="${icon===(existing?.icon||PROFILE_ICONS[0])}" onclick="selectProfileIcon(this)">${icon}</button>`).join('')}</div></fieldset><p id="profile-editor-error" role="alert"></p><button class="action-btn green" type="submit">${existing?'수정 저장':'프로필 만들기'}</button><button class="text-button" type="button" onclick="openFamilySettings()">취소</button>${existing&&allProfiles().length>1?`<button class="text-button profile-delete" type="button" onclick="requestProfileDelete('${existing.id}')">이 프로필 삭제</button>`:''}</form>`,[],'profile-editor-overlay');
 const input=document.getElementById('profile-name');input.value=existing?.name||'';input.dataset.profileId=id||'';input.focus({preventScroll:true});
}
function selectProfileIcon(button){document.querySelectorAll('.profile-icons button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
function saveProfileEditor(){
 const input=document.getElementById('profile-name'),icon=document.querySelector('.profile-icons [aria-pressed="true"]')?.textContent,id=input.dataset.profileId;
 try{
  let p;if(id){updateProfile(id,input.value,icon);p=profileInfo(id);}else p=createProfile(input.value,icon);
  const done=profileEditorDone;profileEditorDone=null;
  if(done){closeActivityDialog();done(p);return;}
  if(!id)switchProfile(p.id);else{closeActivityDialog();renderHome();}
  openFamilySettings();
 }catch(error){document.getElementById('profile-editor-error').textContent=error.message;input.focus({preventScroll:true});}
}
function requestProfileDelete(id=activeProfile){
 const p=profileInfo(id);showActivityDialog('프로필 삭제',`<p><strong>${profileText(p.name)}</strong>의 하던 판, 설정, 별과 꾸미기 기록을 이 기기에서 삭제해요.</p><p>다시 필요할 수 있다면 먼저 파일로 내보내세요. 삭제한 기록은 앱에서 되돌릴 수 없어요.</p>`,[
  {label:'파일로 먼저 내보내기',action:()=>{downloadProfile(p.id);openFamilySettings();}},
  {label:'취소',action:openFamilySettings},
  {label:'이 프로필 삭제',action:()=>{try{leaveActivity();deleteProfile(p.id);refreshProfileView();openFamilySettings();}catch(e){profileMessage('삭제하지 못했어요',e.message);}}},
 ]);
}
function profileMessage(title,message){showActivityDialog(title,`<p>${profileText(message)}</p>`,[{label:'프로필 · 설정으로',action:openFamilySettings}]);}
const PROFILE_BACKUP_LIMIT=10*1024*1024;
function createProfileBackup(id=activeProfile){
 const p=allProfiles().find(p=>p.id===id);if(!p)throw Error('프로필을 찾지 못했어요.');
 if(id===activeProfile)saveActiveSession();
 const data=profileData(id);
 return {format:'chess-kids-profile',version:profileBackupVersion(data),exportedAt:new Date().toISOString(),profile:{name:p.name,icon:p.icon},data};
}
function downloadProfile(id=activeProfile){
 try{
  const backup=createProfileBackup(id),blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='chess-profile-'+backup.profile.name.replace(/[^\p{L}\p{N}_-]/gu,'_')+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(e){profileMessage('내보내지 못했어요',e.message);}
}
// New activities/authored knight data require version 3, built-in knight rule sessions version 2.
// Older apps refuse unsupported files rather than opening them under the wrong rules.
// Version 5: chess lessons and lesson-board games.
const PROFILE_BACKUP_VERSIONS=[1,2,3,4,5];
function profileBackupVersion(data){
 const records=[];
 try{records.push(...Object.values(JSON.parse(data.sessions||'{}')||{}));}catch{}
 try{records.push(...Object.values(JSON.parse(data.play_content_saves||'{}')));records.push(JSON.parse(data.last_session||'null'));}catch{}
 if(data.lesson_sessions_v1||data.lesson_progress_v1||records.some(s=>s?.version===5))return 5;
 if(data.challenge_design||JSON.parse(data.knight_challenges||'[]').some(p=>p.version===2)||records.some(s=>s?.version===4))return 4;
 if(data.knight_challenges||data.challenge_draft)return 3;
 return records.some(s=>s?.version===3)?3:records.some(s=>s?.version===2)?2:1;
}
function profilePlainObject(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
function checkBackupJSON(v,depth=0,counter={n:0}){
 if(depth>60||++counter.n>300000)throw Error('파일 내용이 너무 복잡해요.');
 if(typeof v==='number'&&!Number.isFinite(v))throw Error('잘못된 숫자 기록이에요.');
 if(typeof v==='string'&&v.includes('<'))throw Error('안전하지 않은 내용이 포함된 파일이에요.');
 if(v&&typeof v==='object')for(const [key,value]of Object.entries(v)){
  if(['__proto__','prototype','constructor'].includes(key))throw Error('잘못된 파일 내용이에요.');checkBackupJSON(value,depth+1,counter);
 }
}
function backupSnapshotValid(kind,v){
 const coord=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isInteger(n)&&n>=0&&n<8),coords=ps=>Array.isArray(ps)&&ps.every(coord),piece=p=>/^[wb][KQRBNP]$/.test(p),board=(b,n,knight=false)=>Array.isArray(b)&&b.length===n&&b.every(row=>Array.isArray(row)&&row.length===n&&row.every(p=>knight?typeof p==='boolean':p===null||typeof p==='string'&&piece(p)));
 const gameValid=g=>g&&board(g.board,8)&&['w','b'].includes(g.turn)&&['playing','check','checkmate','draw'].includes(g.status)&&profilePlainObject(g.castling)&&Object.values(g.castling).every(x=>typeof x==='boolean')&&g.captured&&['w','b'].every(c=>Array.isArray(g.captured[c])&&g.captured[c].every(piece))&&(!g.selected||coord(g.selected))&&(!g.enPassant||coord(g.enPassant))&&(!g.validMoves||coords(g.validMoves))&&(!g.lastMove||Array.isArray(g.lastMove)&&g.lastMove.length>=4&&g.lastMove.slice(0,4).every(n=>Number.isInteger(n)&&n>=0&&n<8));
 if(!profilePlainObject(v))return false;
 if(kind==='mission'){
  if(!PIECE_ORDER.includes(v.missionPiece)||!coord(v.missionPlayerPos))return false;
  if(v.missionSpec){const spec=v.missionSpec,trusted=[...MISSIONS[v.missionPiece],...LEGACY_MISSIONS[v.missionPiece]].find(m=>m.id===spec.id&&m.version===spec.version&&(m.size||6)===(spec.size||6));if(!trusted)return false;v.missionSpec=copyData(trusted);}
  return board(v.missionBoard,v.missionSpec?.size||6);
 }
 if(kind==='lesson')return !!lessonRebuild(v.lesson);
 if(kind==='challenge')return challengeStateValid(v.ch);
 if(kind==='solo')return soloValid(v.solo);
 if(kind==='puzzle')return gameValid(v.puzzleGame);
 if(kind==='play'){
  const p=v.play;return gameValid(v.game)&&p&&(p.content==null||p.mode==='ai'&&playContentValid(p.content))&&['ai','friend'].includes(p.mode)&&(p.preset==null||Object.hasOwn(PLAY_PRESETS,p.preset)&&p.mode==='ai')&&Number.isInteger(p.level)&&p.level>=0&&p.level<10&&[0,15,30,60].includes(p.timer)&&[null,undefined,'castle','promotion'].includes(p.moveEvent?.special)&&(!p.moveEvent?.special||p.moveEvent.special==='promotion'||[p.moveEvent.kingFrom,p.moveEvent.kingTo,p.moveEvent.rookFrom,p.moveEvent.rookTo].every(coord));
 }
 const key={knight:'kt',collector:'cl',bomb:'bm',defense:'df',survival:'sv'}[kind],g=v[key];if(!g||!Number.isInteger(g.size)||g.size<3||g.size>8||!coord(g.pos||g.kingPos))return false;
 if(kind==='knight')return (g.mode==='puzzle'?ktPuzzleStateValid(g):['walk','explore','tour'].includes(g.mode))&&board(g.board,g.size,true)&&Number.isInteger(g.moveCount)&&Number.isInteger(g.visited)&&Number.isInteger(g.visitGoal)&&(!g.goal||coord(g.goal))&&(!g.hint||['next','path'].includes(g.hint.style)&&coords(g.hint.path));
 if(['collector','bomb'].includes(kind)&&typeof g.challenge!=='boolean')return false;
 if(kind==='collector')return piece(g.piece)&&coords(g.stars)&&Number.isInteger(g.starsLeft)&&Number.isInteger(g.turnsLeft)&&Array.isArray(g.enemies)&&g.enemies.every(e=>coord(e.pos)&&piece(e.piece)&&coords(e.path)&&Number.isInteger(e.pathIdx));
 if(kind==='bomb')return piece(g.piece)&&coords(g.blocks)&&Array.isArray(g.bombs)&&g.bombs.every(b=>coord(b.pos)&&Number.isInteger(b.timer)&&typeof b.defused==='boolean');
 if(kind==='survival')return board(g.board,g.size)&&coords(g.goalsLeft)&&Number.isInteger(g.turn)&&Number.isInteger(g.goal);
 return piece(g.piece)&&Number.isInteger(g.waveIdx)&&Number.isInteger(g.breached)&&Number.isInteger(g.maxBreach)&&Array.isArray(g.enemies)&&g.enemies.every(e=>coord(e.pos)&&piece(e.p))&&Array.isArray(g.waves)&&g.waves.every(w=>Array.isArray(w)&&w.every(e=>coord(e.pos)&&piece(e.p)));
}
function validateBackupSession(saved){
 if(!saved||!PROFILE_BACKUP_VERSIONS.includes(saved.version)||!SESSION_KEYS[saved.kind]||!profilePlainObject(saved.snapshot)||!Array.isArray(saved.history)||saved.history.length>120)return false;
 try{
  const restrict=snap=>{if(profilePlainObject(snap?.values))snap.values=Object.fromEntries(Object.entries(snap.values).filter(([key])=>SESSION_KEYS[saved.kind].includes(key)));};
  restrict(saved.snapshot);saved.history.forEach(restrict);
  if(!backupSnapshotValid(saved.kind,saved.snapshot.values)||!getSavedSession(saved))return false;
  return saved.history.every(s=>profilePlainObject(s)&&backupSnapshotValid(saved.kind,s.values));
 }catch{return false;}
}
function parseProfileBackup(text){
 if(typeof text!=='string'||text.length>PROFILE_BACKUP_LIMIT)throw Error('10MB 이하의 프로필 파일을 골라 주세요.');
 let file;try{file=JSON.parse(text);}catch{throw Error('올바른 JSON 파일이 아니에요. 체스 앱에서 내보낸 파일을 골라 주세요.');}
 if(file?.format!=='chess-kids-profile')throw Error('체스 앱에서 내보낸 프로필 파일이 아니에요.');
 if(!PROFILE_BACKUP_VERSIONS.includes(file.version))throw Error('이 버전의 파일은 불러올 수 없어요. 앱을 업데이트하고 다시 시도해 주세요.');
 if(!profileNameValid(file.profile?.name)||!PROFILE_ICONS.includes(file.profile?.icon)||!profilePlainObject(file.data)||Object.keys(file.data).length>500)throw Error('프로필 정보가 올바르지 않아요.');
 const data=Object.create(null);
 for(const [key,rawValue]of Object.entries(file.data)){
  let value=rawValue;
  if(!/^[a-zA-Z0-9_.-]{1,120}$/.test(key)||['__proto__','prototype','constructor','migrated'].includes(key)||typeof value!=='string')throw Error('프로필 기록 형식이 올바르지 않아요.');
  if(key==='skin'){if(!SKIN_ORDER.includes(value))throw Error('알 수 없는 꾸미기 정보예요.');}
  else{
   let parsed;try{parsed=JSON.parse(value);}catch{throw Error('프로필 기록을 읽지 못했어요.');}checkBackupJSON(parsed);
   // 예전(v1) 체스 수업 자료는 교재가 바뀌어 이어할 수 없으므로 오류 대신 버린다. 다른 모르는 수업 ID는 아래에서 거절한다.
   if(key==='last_session'&&lessonRecordRetired(parsed))continue;
   if(key==='sessions'&&profilePlainObject(parsed))for(const [k,s]of Object.entries(parsed))if(lessonRecordRetired(s))delete parsed[k];
   if(key==='play_content_saves'&&profilePlainObject(parsed)&&lessonRecordRetired(parsed.lessonPractice))delete parsed.lessonPractice;
   if((key==='lesson_sessions_v1'||key==='lesson_progress_v1')&&profilePlainObject(parsed))for(const id of Object.keys(parsed))if(lessonRetired(id))delete parsed[id];
   if(key==='sessions'&&(!profilePlainObject(parsed)||!Object.values(parsed).every(validateBackupSession))||key==='last_session'&&!validateBackupSession(parsed))throw Error('진행 중인 판을 읽지 못했어요. 원래 기기에서 다시 내보내 주세요.');
   if(key==='knight_challenges'&&(!Array.isArray(parsed)||parsed.length>100||!parsed.every(challengeSpecValid)||new Set(parsed.map(p=>p.id)).size!==parsed.length)||key==='challenge_draft'&&(!Array.isArray(parsed)||parsed.length>0&&!challengePathValid(parsed)))throw Error('도전장 경로를 읽지 못했어요.');
   if(['solo_done','scene_done'].includes(key)&&(!Array.isArray(parsed)||!parsed.every(id=>typeof id==='string')))throw Error('완료 기록을 읽지 못했어요.');
   if(key==='play_content_saves'&&(!profilePlainObject(parsed)||!Object.entries(parsed).every(([k,s])=>['standard','expedition','team','scene','lessonPractice'].includes(k)&&s.kind==='play'&&validateBackupSession(s))))throw Error('대전 저장을 읽지 못했어요.');
   if(key==='lesson_sessions_v1'&&(!profilePlainObject(parsed)||Object.keys(parsed).length>LESSONS.length||!Object.entries(parsed).every(([id,s])=>!!lessonById(id)&&s?.kind==='lesson'&&validateBackupSession(s)&&s.snapshot.values.lesson.lessonId===id)))throw Error('체스 수업 저장을 읽지 못했어요. 원래 기기에서 다시 내보내 주세요.');
   if(key==='lesson_progress_v1'&&!lessonProgressValid(parsed))throw Error('체스 수업 기록을 읽지 못했어요.');
   if(key==='challenge_design'&&(!parsed||![5,6,7].includes(parsed.size)||!Array.isArray(parsed.blocked)||!Array.isArray(parsed.start)||![parsed.start,...parsed.blocked].every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isInteger(n)&&n>=0&&n<parsed.size))||!['block','start'].includes(parsed.tool)))throw Error('판 설계를 읽지 못했어요.');
   if(key==='progress_v3'&&(!profilePlainObject(parsed)||parsed.version!==3||!['missions','puzzles','mini'].every(k=>profilePlainObject(parsed[k])&&Object.values(parsed[k]).every(n=>Number.isInteger(n)&&n>=0&&n<=3))))throw Error('놀이 기록이 올바르지 않아요.');
   if(['preferences','play_settings','knight_tour_settings','mission_progress_v2','puzzle_stars','minigame_stars'].includes(key)&&!profilePlainObject(parsed))throw Error('설정이나 기록 형식이 올바르지 않아요.');
   if(key==='play_settings'&&(![undefined,'ai','friend'].includes(parsed.mode)||parsed.level!==undefined&&(!Number.isInteger(parsed.level)||parsed.level<0||parsed.level>9)||parsed.timer!==undefined&&![0,15,30,60].includes(parsed.timer)))throw Error('대전 설정이 올바르지 않아요.');
   if(key==='pending_skin'&&parsed!==null&&!SKIN_ORDER.includes(parsed))throw Error('알 수 없는 꾸미기 정보예요.');
   if(key==='knight_last_mode'&&!['walk','explore','tour'].includes(parsed))throw Error('나이트 설정이 올바르지 않아요.');
   if(key==='experience'&&!['beginner','familiar','challenge'].includes(parsed))throw Error('시작 설정이 올바르지 않아요.');
   value=JSON.stringify(parsed);
  }
  data[key]=value;
 }
 return {name:file.profile.name.trim(),icon:file.profile.icon,data};
}
function uniqueImportedName(name){let result=name,n=2;while(allProfiles().some(p=>p.name===result)){const suffix=' ('+(n++)+')';result=name.slice(0,24-suffix.length)+suffix;}return result;}
function importProfileBackup(parsed){return createProfile(uniqueImportedName(parsed.name),parsed.icon,parsed.data);}
let pendingProfileImport=null;
async function readProfileFile(file){
 if(!file)return;try{
  if(file.size>PROFILE_BACKUP_LIMIT)throw Error('10MB 이하의 프로필 파일을 골라 주세요.');
  const parsed=parseProfileBackup(await file.text());pendingProfileImport=parsed;
  const name=uniqueImportedName(parsed.name);
  showActivityDialog('프로필 불러오기',`<p>${parsed.icon} <strong>${profileText(name)}</strong></p><p>하던 판, 설정과 꾸미기를 새 프로필로 추가해요. 이 기기에 있는 프로필은 그대로 두어요.</p>`,[{label:'새 프로필로 불러오기',action:confirmProfileImport},{label:'취소',action:()=>{pendingProfileImport=null;openFamilySettings();}}],'profile-import-overlay',()=>{pendingProfileImport=null;});
 }catch(e){pendingProfileImport=null;profileMessage('파일을 불러오지 못했어요',e.message);}
}
function confirmProfileImport(){
 if(!pendingProfileImport)return;try{const p=importProfileBackup(pendingProfileImport);pendingProfileImport=null;switchProfile(p.id);openFamilySettings();}catch(e){pendingProfileImport=null;profileMessage('불러오지 못했어요',e.message);}
}
