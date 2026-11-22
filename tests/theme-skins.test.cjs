const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),load=require('./harness.cjs');
const visible=['royal','pixel','neon','ink','tangram','comic','plush','jelly','crayon','motors','clouds','cosmic','dragon','ocean','forest','animals','sweets','elements','egypt','ghosts','origami'];
test('Workshop preview shows all six piece kinds on both sides for every visible skin',()=>{
 const h=load(),expected=['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'].sort();
 for(const id of visible){
  h.run(`setSkin('${id}')`);
  const html=h.run('workshopPreviewHTML()');
  const pieces=[...html.matchAll(/data-piece="([wb][KQRBNP])"/g)].map(m=>m[1]);
  assert.deepEqual(pieces.sort(),expected,id+' must preview all 12 pieces');
 }
});
test('Royal is the default and all 21 visible raster skins are free in web and native mode',()=>{
 const h=load();assert.equal(h.run('currentSkin'),'royal');assert.equal(h.run('getAllStars()'),0);
 for(const native of [false,true]){
  if(native)h.run('window.ChessKidsStore={purchase(){}}');
  assert.deepEqual(JSON.parse(h.run('JSON.stringify(SKIN_ORDER.filter(workshopSkinVisible))')),visible);
  assert.deepEqual(JSON.parse(h.run('JSON.stringify(getUnlockedSkins())')),visible);
  for(const id of visible){
   assert.equal(h.run(`isSkinUnlocked('${id}')`),true);h.run(`setSkin('${id}')`);assert.equal(h.run('currentSkin'),id);
   assert.equal(h.run(`Object.keys(SKINS.${id}).length`),12);
   assert.match(h.run("getPieceSVG('wN')"),/data-sprite-skin=/);
  }
 }
 assert.equal(h.run('getNextLockedSkin()'),null);
});
test('Every legacy SVG selection migrates on load, profile switch and backup import; hidden skins never surface as rewards',()=>{
 for(const id of ['cute','classic','hellocarbot','dino','tiniping','robot','baemin']){
  const h=load({'chess.child.skin':id,'chess.child.pending_skin':JSON.stringify(id)});
  assert.equal(h.run('currentSkin'),'royal');h.run('applyWorkshop()');assert.equal(h.run("readData('pending_skin',null)"),null);
  h.run(`setSkin('${id}')`);assert.equal(h.run('currentSkin'),'royal');
  h.run(`safeStore.setItem('skin','${id}');globalThis.oldBackup=JSON.stringify(createProfileBackup())`);
  h.run('switchProfile(importProfileBackup(parseProfileBackup(oldBackup)).id)');assert.equal(h.run('currentSkin'),'royal');
  h.run('goWorkshop()');assert.ok(!h.elements.get('screen-workshop').innerHTML.includes(`workshopPick('skin','${id}')`));
  h.run("awardStars('achievements','large-award',110)");assert.equal(h.run("readData('pending_skin',null)"),null);
 }
});
test('Every visible skin texture is included in offline precaching and all generated source prompts are preserved',()=>{
 const sw=fs.readFileSync('sw.js','utf8');
 for(const id of visible){
  const dir=id==='royal'?'royal-classic':id,file=`icons/skins/${dir}/atlas.webp`;
  assert.ok(fs.statSync(file).size>1000);assert.ok(sw.includes('./'+file));
  if(id!=='royal')assert.ok(fs.existsSync(`docs/theme-skins/${id}/image-prompt.txt`));
 }
});
