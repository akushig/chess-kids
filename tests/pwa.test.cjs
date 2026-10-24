const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('PWA precache includes every entry script and icon, with an explicit update activation',async()=>{
 const events={},deleted=[];let skipped=0,assets=[];
 const c=vm.createContext({CHESS_BUILD:'test',importScripts(){},self:{location:{origin:'http://test'},addEventListener:(n,f)=>events[n]=f,skipWaiting:()=>skipped++,clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async a=>{assets=a;}}),keys:async()=>['chess-kids-old','unrelated-cache','chess-kids-test'],delete:async k=>deleted.push(k)}});
 vm.runInContext(fs.readFileSync('sw.js','utf8'),c);let task;events.install({waitUntil:p=>task=p});await task;assert.equal(skipped,0,'do not interrupt a running game on install');
 for(const [,src]of fs.readFileSync('index.html','utf8').matchAll(/<script src="([^"]+)"/g))assert.ok(assets.includes('./'+src),src);
 assert.ok(assets.includes('./icons/icon-192.png'));assert.ok(assets.includes('./manifest.json'));
 events.activate({waitUntil:p=>task=p});await task;assert.deepEqual(deleted,['chess-kids-old']);events.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(skipped,1);
});
