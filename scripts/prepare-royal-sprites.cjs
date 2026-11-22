// Slice the single generated sheet and align all poses; requires ImageMagick.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),source=path.join(root,'docs/royal-classic/source-atlas.png');
const out=path.join(root,'icons/skins/royal-classic'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'royal-sprites-'));
const run=args=>execFileSync('magick',args,{encoding:'utf8'}).trim();
// Generated sheets need measured gutters rather than assuming exact grid alignment.
const xs=[0,239,441,637,837,1038,1254],ys=[0,219,435,642,850,1053,1254];
const heights=[212,190,166,190,188,152],reference=[];
fs.mkdirSync(out,{recursive:true});
try{
 for(let row=0;row<6;row++)for(let col=0;col<6;col++){
  const crop=`${xs[col+1]-xs[col]}x${ys[row+1]-ys[row]}+${xs[col]}+${ys[row]}`;
  const cell=path.join(tmp,`cell-${row}-${col}.png`);
  run([source,'-crop',crop,'+repage',cell]);
  const bounds=run([cell,'-alpha','extract','-threshold','10%','-format','%@','info:']);
  const match=bounds.match(/(\d+)x(\d+)\+(\d+)\+(\d+)/);
  if(!match)throw Error(`Missing sprite ${row},${col}`);
  const [,w,h,x,y]=match.map(Number);
  if(row<2)reference[row*6+col]=h;
  const scale=heights[col]/reference[(row%2)*6+col];
  // Pad the measured opaque bounds to retain antialiased edges.
  const left=Math.max(0,x-2),top=Math.max(0,y-2);
  const width=Math.min(xs[col+1]-xs[col]-left,w+4),height=Math.min(ys[row+1]-ys[row]-top,h+4);
  run([cell,'-crop',`${width}x${height}+${left}+${top}`,'+repage','-resize',`${Math.round(width*scale)}x${Math.round(height*scale)}!`,
   '-background','none','-gravity','south','-splice','0x16','-extent','256x256',path.join(tmp,`sprite-${row}-${col}.png`)]);
 }
 const rows=Array.from({length:6},(_,row)=>{
  const file=path.join(tmp,`row-${row}.png`);
  run([...Array.from({length:6},(_,col)=>path.join(tmp,`sprite-${row}-${col}.png`)),'+append',file]);return file;
 });
 run([...rows,'-append',path.join(tmp,'atlas.png')]);
 run([path.join(tmp,'atlas.png'),'-quality','90',path.join(out,'atlas.webp')]);
 // A separate, readable contact sheet for reviewing all 36 sprites.
 run([path.join(tmp,'atlas.png'),'-background','#e6dfd0','-alpha','remove',path.join(root,'docs/royal-classic/contact-sheet.jpg')]);
 console.log(`Prepared 36 sprites in ${path.relative(root,out)}/atlas.webp`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
