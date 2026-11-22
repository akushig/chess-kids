// Normalize generated 6×6 sheets. No API calls; requires ImageMagick.
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
const playful=['plush','jelly','crayon','motors','clouds'];
const previewBackgrounds={plush:'#fff4ef',jelly:'#fff8d6',crayon:'#fffef6',motors:'#e9f9ff',clouds:'#f6f0ff'};
const ids=['cosmic','dragon','ocean','forest','animals','sweets','elements','egypt','ghosts','origami',...playful];
const run=args=>execFileSync('magick',args,{encoding:'utf8'}).trim();
function seams(source,length,vertical){
 const values=execFileSync('magick',[source,'-alpha','extract','-threshold','15%','-scale',vertical?`1x${length}!`:`${length}x1!`,'-depth','8','gray:-']);
 const result=[0],step=length/6;
 for(let i=1;i<6;i++){
  let best=Math.round(step*i),score=Infinity;
  const from=Math.floor(step*(i-.35)),to=Math.ceil(step*(i+.35));
  // Use the middle of an empty gutter, not the first transparent edge pixel.
  const gaps=[];let start=null;
  for(let p=from;p<=to+1;p++){
   if(p<=to&&values[p]===0){if(start===null)start=p;}
   else if(start!==null){if(p-start>=2)gaps.push((start+p-1)/2);start=null;}
  }
  if(gaps.length){result.push(Math.round(gaps.sort((a,b)=>Math.abs(a-step*i)-Math.abs(b-step*i))[0]));continue;}
  for(let p=from;p<=to;p++){
   const value=values[p]+Math.abs(p-step*i)*.025;
   if(value<score){score=value;best=p;}
  }
  result.push(best);
 }
 return [...result,length];
}
for(const id of process.argv.slice(2).length?process.argv.slice(2):ids){
 if(!ids.includes(id))throw Error('Unknown theme '+id);
 const source=path.join(root,`docs/theme-skins/${id}/source-atlas.png`),out=path.join(root,`icons/skins/${id}`),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chess-theme-'));
 fs.mkdirSync(out,{recursive:true});
 try{
  const [width,height]=run(['identify','-format','%w %h',source]).split(' ').map(Number);
  const xs=seams(source,width,false),ys=seams(source,height,true),reference=[],measurements=[],rowXs=[];
  for(let row=0;row<6;row++){
   const strip=path.join(tmp,`strip-${row}.png`);
   run([source,'-crop',`${width}x${ys[row+1]-ys[row]}+0+${ys[row]}`,'+repage',strip]);
   rowXs.push(seams(strip,width,false));
  }
  const heights=playful.includes(id)?[220,208,190,206,206,174]:[212,190,166,190,188,152];
  for(let row=0;row<6;row++)for(let col=0;col<6;col++){
   const columns=rowXs[row],cw=columns[col+1]-columns[col],ch=ys[row+1]-ys[row],cell=path.join(tmp,`cell-${row}-${col}.png`);
   run([source,'-crop',`${cw}x${ch}+${columns[col]}+${ys[row]}`,'+repage',cell]);
   const bounds=run([cell,'-alpha','extract','-threshold','15%','-format','%@','info:']).match(/(\d+)x(\d+)\+(\d+)\+(\d+)/);
   if(!bounds)throw Error(`Missing ${id} ${row},${col}`);
   const [,w,h,x,y]=bounds.map(Number);
   if(w<20||h<40)throw Error(`Incomplete ${id} ${row},${col}`);
   if(row<2)reference[row*6+col]=h;
   const scale=Math.min(heights[col]/reference[(row%2)*6+col],222/w,224/h);
   const left=Math.max(0,x-2),top=Math.max(0,y-2),sw=Math.min(cw-left,w+4),sh=Math.min(ch-top,h+4);
   run([cell,'-crop',`${sw}x${sh}+${left}+${top}`,'+repage','-resize',`${Math.round(sw*scale)}x${Math.round(sh*scale)}!`,'-background','none','-gravity','south','-splice','0x16','-extent','256x256',path.join(tmp,`sprite-${row}-${col}.png`)]);
   measurements.push({row,col,width:w,height:h});
  }
  const rows=Array.from({length:6},(_,row)=>{
   const file=path.join(tmp,`row-${row}.png`);run([...Array.from({length:6},(_,col)=>path.join(tmp,`sprite-${row}-${col}.png`)),'+append',file]);return file;
  });
  const atlas=path.join(tmp,'atlas.png');run([...rows,'-append',atlas]);
  run([atlas,'-quality','87',path.join(out,'atlas.webp')]);
  run([atlas,'-crop','1536x512+0+0','+repage','-background',previewBackgrounds[id]||'#e9e3d7','-alpha','remove','-resize','900x300',path.join(root,`docs/theme-skins/${id}/preview.jpg`)]);
  fs.writeFileSync(path.join(root,`docs/theme-skins/${id}/atlas-layout.json`),JSON.stringify({source:{width,height},xs,ys,rowXs,measurements},null,2)+'\n');
  console.log(`${id}: 36 sprites, ${Math.round(fs.statSync(path.join(out,'atlas.webp')).size/1024)} KiB`);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
