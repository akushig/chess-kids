// Storage failure must never interrupt a move or a celebration.
let storageUnavailable=false;
const volatileStore=new Map();
const PROFILE_ICONS=['🙂','🐱','🐻','🐰','🦊','🐼','🚀','⭐'];
const PROFILE_REGISTRY_KEY='chess_profiles_v1';
const LEGACY_PROFILE_KEYS=['mission_progress_v2','puzzle_stars','minigame_stars','skin','play_settings','knight_tour_settings',...Array.from({length:4},(_,i)=>'survival_record_'+i)];
function storageKeys(){const keys=[];try{for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));}catch{}return keys.filter(Boolean);}
function storedValue(key){if(volatileStore.has(key))return volatileStore.get(key);try{return localStorage.getItem(key);}catch{return null;}}
function profileIdValid(id){return typeof id==='string'&&/^(child|sibling|adult|p_[a-z0-9_-]{6,80})$/.test(id);}
function profileNameValid(name){return typeof name==='string'&&name.trim().length>0&&name.trim().length<=24&&!/[\u0000-\u001f\u007f]/.test(name);}
// The one-time global marker prevents deleted legacy slots from being recreated.
try{
 if(!localStorage.getItem('chess_profiles_legacy_copied')){
  if(!localStorage.getItem('chess.child.migrated')){
   for(const key of LEGACY_PROFILE_KEYS){const value=localStorage.getItem(key);if(value!==null&&localStorage.getItem('chess.child.'+key)===null)localStorage.setItem('chess.child.'+key,value);}
   localStorage.setItem('chess.child.migrated','1');
  }
  localStorage.setItem('chess_profiles_legacy_copied','1');
 }
}catch{}
let activeProfile=storedValue('chess_active_profile')||'child';
let profileRegistry;
try{profileRegistry=JSON.parse(storedValue(PROFILE_REGISTRY_KEY));}catch{}
if(!profileRegistry||profileRegistry.version!==1||!Array.isArray(profileRegistry.profiles)||!profileRegistry.profiles.length||profileRegistry.profiles.some(p=>!p||!profileIdValid(p.id)||!profileNameValid(p.name)||!PROFILE_ICONS.includes(p.icon))||new Set(profileRegistry.profiles.map(p=>p.id)).size!==profileRegistry.profiles.length){
 const keys=storageKeys();
 const ids=['child','sibling','adult'].filter(id=>id==='child'||id===activeProfile||keys.some(k=>k.startsWith('chess.'+id+'.')&&!k.endsWith('.migrated')));
 profileRegistry={version:1,profiles:ids.map((id,i)=>({id,name:'플레이어 '+(i+1),icon:PROFILE_ICONS[i]}))};
 try{localStorage.setItem(PROFILE_REGISTRY_KEY,JSON.stringify(profileRegistry));}catch{storageUnavailable=true;}
}
if(!profileRegistry.profiles.some(p=>p.id===activeProfile))activeProfile=profileRegistry.profiles[0].id;
try{localStorage.setItem('chess_active_profile',activeProfile);}catch{}
const safeStore={
 getItem(key){return storedValue('chess.'+activeProfile+'.'+key);},
 setItem(key,value){const full='chess.'+activeProfile+'.'+key;volatileStore.set(full,String(value));try{localStorage.setItem(full,String(value));return true;}catch{storageUnavailable=true;return false;}},
 removeItem(key){const full='chess.'+activeProfile+'.'+key;volatileStore.set(full,null);try{localStorage.removeItem(full);}catch{}},
};
function readData(key,fallback){try{return JSON.parse(safeStore.getItem(key))??fallback;}catch{return fallback;}}
function writeData(key,value){return safeStore.setItem(key,JSON.stringify(value));}
function allProfiles(){return profileRegistry.profiles.map(p=>({...p}));}
function profileData(id){
 const prefix='chess.'+id+'.',data=Object.create(null);
 for(const full of new Set([...storageKeys(),...volatileStore.keys()]))if(full.startsWith(prefix)){
  const value=storedValue(full);if(value!==null&&full!==prefix+'migrated')data[full.slice(prefix.length)]=value;
 }
 return data;
}
// Stage values and roll back a partial write before changing the in-memory registry.
function profileStorageTransaction(changes){
 const before=new Map();try{
  for(const [key,value]of changes){before.set(key,localStorage.getItem(key));if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
 }catch{
  for(const [key,value]of [...before].reverse())try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}
  throw Error('저장 공간이 부족하거나 저장이 차단되어 있어요. 기존 프로필은 그대로 두었어요.');
 }
 for(const [key]of changes)volatileStore.delete(key);
}
function checkedProfileDetails(name,icon,exceptId=null){
 name=typeof name==='string'?name.trim():'';
 if(!profileNameValid(name))throw Error('이름을 1~24자로 입력해 주세요.');
 if(!PROFILE_ICONS.includes(icon))throw Error('아이콘을 골라 주세요.');
 if(profileRegistry.profiles.some(p=>p.id!==exceptId&&p.name===name))throw Error('이미 있는 이름이에요. 구별할 수 있는 다른 이름을 입력해 주세요.');
 return {name,icon};
}
function createProfile(name,icon=PROFILE_ICONS[0],data={}){
 const details=checkedProfileDetails(name,icon);
 let id;do{id='p_'+(window.crypto?.randomUUID?.()||Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)).toLowerCase();}while(profileRegistry.profiles.some(p=>p.id===id));
 const profile={id,...details},next={version:1,profiles:[...profileRegistry.profiles,profile]};
 profileStorageTransaction([...Object.entries(data).map(([key,value])=>['chess.'+id+'.'+key,value]),[PROFILE_REGISTRY_KEY,JSON.stringify(next)]]);profileRegistry=next;return {...profile};
}
function updateProfile(id,name,icon){
 if(!profileRegistry.profiles.some(p=>p.id===id))throw Error('프로필을 찾지 못했어요.');
 const details=checkedProfileDetails(name,icon,id),next={version:1,profiles:profileRegistry.profiles.map(p=>p.id===id?{id,...details}:p)};
 profileStorageTransaction([[PROFILE_REGISTRY_KEY,JSON.stringify(next)]]);profileRegistry=next;
}
function deleteProfile(id){
 if(profileRegistry.profiles.length===1)throw Error('프로필은 하나 이상 필요해요. 이름을 바꾸거나 다른 프로필을 먼저 추가해 주세요.');
 if(!profileRegistry.profiles.some(p=>p.id===id))throw Error('프로필을 찾지 못했어요.');
 const next={version:1,profiles:profileRegistry.profiles.filter(p=>p.id!==id)},target=activeProfile===id?next.profiles[0].id:activeProfile,prefix='chess.'+id+'.';
 const keys=new Set([...storageKeys(),...volatileStore.keys()].filter(k=>k.startsWith(prefix)));
 if(id==='child')for(const key of LEGACY_PROFILE_KEYS)if(storedValue(key)!==null)keys.add(key);
 profileStorageTransaction([...keys].map(k=>[k,null]).concat([[PROFILE_REGISTRY_KEY,JSON.stringify(next)],['chess_active_profile',target]]));profileRegistry=next;activeProfile=target;
}
