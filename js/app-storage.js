// Storage failure must never interrupt a move or a celebration.
let storageUnavailable=false;
let activeProfile = 'child';
try { activeProfile = localStorage.getItem('chess_active_profile') || 'child'; } catch {}
const volatileStore=new Map();
const safeStore = {
  getItem(key) { const full='chess.'+activeProfile+'.'+key;if(volatileStore.has(full))return volatileStore.get(full);try { return localStorage.getItem(full); } catch { return null; } },
  setItem(key,value) {const full='chess.'+activeProfile+'.'+key;volatileStore.set(full,String(value));try { localStorage.setItem(full,String(value)); return true; } catch { storageUnavailable=true;return false; } },
  removeItem(key) {const full='chess.'+activeProfile+'.'+key;volatileStore.set(full,null);try { localStorage.removeItem(full); } catch {} },
};
// Copy, never remove, the original family's progress. Other profiles start separately.
try {
  if(!localStorage.getItem('chess.child.migrated')) {
    for(const key of ['mission_progress_v2','puzzle_stars','minigame_stars','skin','play_settings','knight_tour_settings',...Array.from({length:4},(_,i)=>'survival_record_'+i)]) {
      const value=localStorage.getItem(key);
      if(value!==null && localStorage.getItem('chess.child.'+key)===null)localStorage.setItem('chess.child.'+key,value);
    }
    localStorage.setItem('chess.child.migrated','1');
  }
} catch {}
function readData(key,fallback) { try { return JSON.parse(safeStore.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeData(key,value) { return safeStore.setItem(key,JSON.stringify(value)); }
