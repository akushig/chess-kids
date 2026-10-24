const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
module.exports=function load(){
 const elements=new Map(),storage=new Map(),timers=[];
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',classList:{add(){},remove(){},toggle(){}},querySelector(){return null;},querySelectorAll(){return []},remove(){},appendChild(){}});return elements.get(id);};
 const c=vm.createContext({console,Date,setTimeout:cb=>{timers.push(cb);return timers.length},clearTimeout(){},setInterval:()=>1,clearInterval(){},navigator:{},window:{},document:{addEventListener(){},querySelectorAll:()=>[],getElementById:el,querySelector:()=>null,body:{appendChild(){}},createElement:()=>el(Math.random())},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}});
 const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
 for(const p of scripts)vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),c,{filename:p});
 vm.runInContext('animateMove=(el,fr,fc,tr,tc,p,done)=>done();spawnParticles=()=>{};',c);
 return {run:(s)=>vm.runInContext(s,c,{timeout:60000}),storage,elements,timers,context:c};
};
