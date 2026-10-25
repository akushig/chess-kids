// Enrich every rendered board consistently, including arcade and small boards.
let keyboardBoardIndex=0,restoreKeyboardFocus=false,lastSpokenGuide='';
function speakGuide(message){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(message);utterance.lang='ko-KR';utterance.rate=.9;window.speechSynthesis.speak(utterance);
}
function enhanceExperience(){
 const prefs=readData('preferences',{}),screen=document.querySelector('.screen.active');if(!screen)return;
 if(storageUnavailable&&!screen.querySelector('.storage-notice')){const message=document.createElement('p');message.className='storage-notice guide-card';message.textContent='이 기기에서 저장할 수 없어요. 지금 판은 계속할 수 있어요.';screen.appendChild(message);}
 for(const board of screen.querySelectorAll('.chess-board')){
  const cells=Array.from(board.querySelectorAll('.board-cell')),size=Math.round(Math.sqrt(cells.length));
  if(cells.length&&!board.querySelector(':scope > .board-row')){
    const overlay=board.querySelector('.attack-overlay,.hint-arrow,.move-anim');
    for(let r=0;r<size;r++){const row=document.createElement('div');row.className='board-row';row.style.display='contents';row.setAttribute('role','row');row.setAttribute('aria-rowindex',r+1);for(const cell of cells.slice(r*size,(r+1)*size))row.appendChild(cell);board.insertBefore(row,overlay);}
  }
  board.setAttribute('role','grid');board.setAttribute('aria-label','체스판');board.setAttribute('aria-rowcount',size);board.setAttribute('aria-colcount',size);
  let selected=cells.findIndex(cell=>cell.classList.contains('selected'));if(selected<0)selected=0;
  cells.forEach((cell,i)=>{
   const piece=cell.querySelector('[data-piece]')?.getAttribute('data-piece');
   const side=piece?.[0]==='w'?'흰색':'검은색',name=piece?t(PIECE_NAMES[piece[1]]):'빈칸';
   const goal=cell.classList.contains('goal-cell')?' 목표 칸':'';
   cell.setAttribute('role','gridcell');cell.setAttribute('aria-rowindex',Math.floor(i/size)+1);cell.setAttribute('aria-colindex',i%size+1);
   cell.setAttribute('aria-label',`${'abcdefgh'[i%size]}${size-Math.floor(i/size)} ${piece?side+' ':''}${name}${goal}${cell.classList.contains('move-hint')?' 이동 가능':''}${cell.classList.contains('danger-cell')?' 공격받는 칸':''}`);
   cell.setAttribute('aria-selected',cell.classList.contains('selected')?'true':'false');cell.tabIndex=i===(restoreKeyboardFocus?keyboardBoardIndex:selected)?0:-1;
   if(piece&&prefs.badges!==false){cell.dataset.pieceType=name;cell.dataset.side=piece[0];}else{delete cell.dataset.pieceType;delete cell.dataset.side;}
   cell.onkeydown=event=>{
    const steps={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]},delta=steps[event.key];
    if(delta){event.preventDefault();const row=Math.floor(i/size)+delta[0],col=i%size+delta[1];if(row>=0&&row<size&&col>=0&&col<size){keyboardBoardIndex=row*size+col;cells.forEach((c,j)=>c.tabIndex=j===keyboardBoardIndex?0:-1);cells[keyboardBoardIndex].focus();}}
    if(event.key==='Enter'||event.key===' '){event.preventDefault();keyboardBoardIndex=i;restoreKeyboardFocus=true;cell.click();}
   };
  });
  if(restoreKeyboardFocus&&!state.animating){cells[Math.min(keyboardBoardIndex,cells.length-1)]?.focus({preventScroll:true});restoreKeyboardFocus=false;}
 }
 for(const node of screen.querySelectorAll('.status-msg,.mission-speech,.guide-card')){
  node.setAttribute('aria-live','polite');node.setAttribute('role','status');
  if(!prefs.voice||node.querySelector('.read-guide')||!node.textContent.trim())continue;
  const message=node.textContent.trim(),button=document.createElement('button');button.className='read-guide';button.textContent='🔊';button.setAttribute('aria-label','안내 다시 듣기');button.onclick=()=>speakGuide(message);node.appendChild(button);
  if(lastSpokenGuide!==state.activeKind+'|'+message){lastSpokenGuide=state.activeKind+'|'+message;speakGuide(message);}
 }
}
if(typeof MutationObserver!=='undefined'){
 let queued=false;const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;enhanceExperience();});}});
 document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.getElementById('app'),{childList:true,subtree:true});enhanceExperience();});
 document.addEventListener('pointerdown',()=>{restoreKeyboardFocus=false;});
 document.addEventListener('keydown',event=>{
  const dialog=document.querySelector('[aria-modal="true"]');
  if(dialog&&event.key==='Tab'){const buttons=Array.from(dialog.querySelectorAll('button:not(:disabled)'));if(!buttons.length)return;const index=buttons.indexOf(document.activeElement),next=event.shiftKey?(index<=0?buttons.length-1:index-1):(index+1)%buttons.length;event.preventDefault();buttons[next].focus();}
 });
}
