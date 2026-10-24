// Storage failure must never interrupt a move or a celebration.
let activeProfile = 'child';
try { activeProfile = localStorage.getItem('chess_active_profile') || 'child'; } catch {}
const safeStore = {
  getItem(key) { try { return localStorage.getItem('chess.'+activeProfile+'.'+key); } catch { return null; } },
  setItem(key,value) { try { localStorage.setItem('chess.'+activeProfile+'.'+key,String(value)); return true; } catch { return false; } },
  removeItem(key) { try { localStorage.removeItem('chess.'+activeProfile+'.'+key); } catch {} },
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
