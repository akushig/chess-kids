// Keep old definitions for saved boards; new starts use the edited curriculum.
const LEGACY_MISSIONS=JSON.parse(JSON.stringify(MISSIONS));
const CURRICULUM_VERSION=2;
// [objective, start, goals, targets, blocks, enemies, prompt, skill, new rule]
const LESSON_EDITS={
 P:[
 ['reach',[3,1],[[2,1]],[],[],[],'폰을 앞으로 한 칸, 깃발로 보내요.','앞으로 이동','앞으로 한 칸'],
 ['reach',[2,1],[[0,1]],[],[],[],'처음 자리의 폰은 두 칸도 갈 수 있어요.','첫 두 칸 이동','처음 자리에서 두 칸'],
 ['capture',[3,1],[],[[2,2]],[],[],'폰은 비스듬한 앞 칸의 말을 잡아요.','대각선 잡기','이동과 잡는 방향이 달라요'],
 ['capture',[3,1],[],[[2,2],[1,1]],[],[],'비스듬히 하나씩, 두 말을 잡아요.','연속 잡기','잡을 순서'],
 ['reach',[3,1],[[1,2]],[[2,2]],[[2,1]],[],'앞이 막혔어요. 옆의 말을 잡고 깃발로 가요.','막힌 길 돌아가기','앞의 상자는 통과할 수 없어요'],
 ['reach',[3,2],[[0,2]],[],[],[],'앞으로 가서 끝줄 깃발을 찾아요.','끝줄 도착','끝줄에 닿으면 퀸으로 바뀌어요'],
 ['capture',[4,1],[],[[3,2],[2,3],[1,2]],[],[],'더 넓은 판에서 비스듬히 말을 잡아요.','잡기 응용','넓은 판'],
 ['reach',[4,1],[[0,3]],[[3,2],[2,3]],[[3,1]],[],'잡고 앞으로 가며 끝줄까지 계획해요.','경로 계획','선택 도전'],
 ],
 B:[
 ['reach',[3,0],[[0,3]],[],[],[],'비숍을 비스듬히, 깃발로 보내요.','대각선 이동','비스듬한 줄'],
 ['reach',[3,3],[[0,0]],[],[],[],'반대 방향으로도 비스듬히 가요.','반대 대각선','반대 방향'],
 ['capture',[3,0],[],[[1,2]],[],[],'같은 대각선의 깃발 말을 잡아요.','대각선 잡기','목표 말 잡기'],
 ['capture',[3,0],[],[[2,1],[0,3]],[],[],'가까운 말부터 하나씩 잡아요.','연속 잡기','다른 말은 뛰어넘지 않아요'],
 ['reach',[3,1],[[0,2]],[],[[2,2]],[],'상자가 없는 다른 대각선을 찾아요.','막힌 길 돌아가기','상자를 통과할 수 없어요'],
 ['reach',[3,0],[[1,0]],[],[],[],'한 번 꺾어 같은 색의 깃발로 가요.','방향 바꾸기','같은 색 칸으로 이어져요'],
 ['capture',[4,0],[],[[2,2],[0,4]],[],[],'넓은 판에서도 대각선으로 잡아요.','대각선 응용','넓은 판'],
 ['capture',[4,0],[],[[2,2],[0,4],[1,1]],[[3,3]],[],'어떤 순서로 잡으면 모두 만날까요?','경로 계획','선택 도전'],
 ],
 Q:[
 ['reach',[3,0],[[3,3]],[],[],[],'퀸을 같은 줄의 깃발로 보내요.','직선 이동','가로와 세로'],
 ['reach',[3,0],[[0,3]],[],[],[],'퀸은 비스듬한 줄로도 가요.','대각선 이동','대각선도 가능해요'],
 ['capture',[3,0],[],[[1,2]],[],[],'비스듬한 줄의 깃발 말을 잡아요.','말 잡기','목표 말 잡기'],
 ['capture',[3,0],[],[[3,3],[0,3]],[],[],'두 말을 차례로 잡아요.','연속 잡기','잡을 순서'],
 ['reach',[3,0],[[0,3]],[],[[2,1]],[],'직선과 대각선을 이어 상자를 돌아가요.','막힌 길 돌아가기','상자를 통과할 수 없어요'],
 ['reach',[3,0],[[0,2]],[],[],[],'방향을 바꾸어 깃발에 도착해요.','방향 바꾸기','두 움직임 연결'],
 ['capture',[4,0],[],[[4,4],[0,4],[0,0]],[],[],'넓은 판의 세 말을 잡아요.','이동 응용','넓은 판'],
 ['capture',[4,0],[],[[4,4],[0,4],[0,0],[2,3]],[[2,2]],[],'막힌 줄을 살피며 잡을 순서를 찾아요.','경로 계획','선택 도전'],
 ],
 N:[
 ['reach',[3,0],[[1,1]],[],[],[],'나이트를 두 칸, 옆으로 한 칸 뛰게 해요.','나이트 점프','ㄴ 모양 점프'],
 ['reach',[3,3],[[1,2]],[],[],[],'반대쪽으로도 두 칸, 옆으로 한 칸 뛰어요.','반대 점프','반대 방향'],
 ['capture',[3,0],[],[[1,1]],[],[],'점프해서 깃발 말을 잡아요.','점프 잡기','도착한 칸의 말 잡기'],
 ['reach',[3,0],[[1,1]],[],[[2,0],[2,1]],[],'나이트는 상자 위를 뛰어넘어요.','장애물 점프','사이의 상자는 넘어갈 수 있어요'],
 ['capture',[3,0],[],[[1,1],[3,2]],[],[],'두 번 점프해 두 말을 잡아요.','연속 점프','두 움직임 연결'],
 ['reach',[3,0],[[0,3]],[],[],[],'깃발까지 점프할 칸을 이어봐요.','경로 찾기','한 수 앞을 생각해요'],
 ['reach',[4,0],[[0,2]],[],[],[],'넓은 판에서 깃발을 찾아요.','점프 응용','넓은 판'],
 ['capture',[4,0],[],[[2,1],[0,2],[2,3]],[[1,1]],[],'세 말을 잡을 점프 순서를 찾아요.','경로 계획','선택 도전'],
 ],
 K:[
 ['reach',[3,1],[[2,1]],[],[],[],'왕을 앞으로 딱 한 칸 움직여요.','한 칸 이동','어느 방향이든 한 칸'],
 ['reach',[3,0],[[2,1]],[],[],[],'왕은 비스듬히도 한 칸 갈 수 있어요.','대각선 한 칸','대각선 방향'],
 ['capture',[3,0],[],[[2,1]],[],[],'옆에 있는 깃발 말을 잡아요.','안전한 잡기','공격받지 않는 말 잡기'],
 ['escape',[3,1],[[3,3]],[],[],[[0,1,'bR']],'빨간 줄은 위험해요. 안전한 깃발로 피해요.','왕 안전','공격받는 칸은 피해야 해요'],
 ['escape',[3,0],[[1,2]],[],[[2,1]],[[0,3,'bR']],'상자와 위험한 줄을 피해 깃발로 가요.','안전한 경로','막힘과 위험 함께 살피기'],
 ['capture',[3,0],[],[[2,0],[1,0]],[],[],'안전한 말부터 하나씩 잡아요.','연속 잡기','다음 공격도 살펴요'],
 ['escape',[4,0],[[2,2]],[],[],[[0,4,'bR']],'넓은 판에서 안전하게 깃발로 가요.','안전 응용','넓은 판'],
 ['capture',[4,0],[],[[3,1],[2,2]],[],[[0,4,'bR']],'위험한 줄을 피해 두 말을 잡아요.','안전한 계획','선택 도전'],
 ]
};
for(const [piece,lessons] of Object.entries(LESSON_EDITS)){
 MISSIONS[piece]=lessons.map((row,i)=>{
  const [type,start,goals,targets,blocks,enemies,prompt,skill,newRule]=row,old=LEGACY_MISSIONS[piece][i];
  return {...old,type,piece:'w'+piece,size:i<6?4:5,start,goals,targets:targets.map(([r,c])=>[r,c,'bP']),blocks,enemies,minMoves:1,optional:i===7,version:2,hint:null,
   desc:{ko:prompt,en:prompt},learning:{skill,prerequisites:i?[lessons[i-1][7]]:[],newRule,planning:i<3?1:i<6?2:3,success:skill+'을 해냈어요.',recovery:'↶ 되돌려 다른 길을 찾아요.'}};
 });
}
for(const [piece,lessons] of Object.entries(MISSIONS))lessons.forEach((m,i)=>{
 m.learning ||= {skill:i<2?'룩 직선 이동':m.type==='capture'?'룩으로 잡기':'룩 경로 찾기',prerequisites:i?['룩 직선 이동']:[],newRule:m.optional?'선택 도전':i===5?'상자 돌아가기':'가로·세로 움직임',planning:Math.min(3,m.minMoves),success:m.type==='capture'?'같은 줄의 말을 잡았어요.':'가로·세로 길을 찾았어요.',recovery:'↶ 되돌려 다른 길을 찾아요.'};
});
// Authored pars are verified by the content solver test, never estimated from prose.
const CURRICULUM_PARS={P:[1,1,1,2,2,3,3,4],B:[1,1,1,2,2,2,2,4],Q:[1,1,1,2,2,2,3,5],N:[1,1,1,1,2,2,2,3],K:[1,1,1,2,3,2,2,4]};
for(const [piece,pars]of Object.entries(CURRICULUM_PARS))MISSIONS[piece].forEach((m,i)=>m.minMoves=pars[i]);

// Three original scenes + three explicitly labelled mirrored practice scenes per skill.
// Horizontal reflection preserves these king/rook/queen/bishop/knight-only positions.
for(const p of [...PUZZLES]){
 const placement=p.fen.split(' ')[0].split('/').map(row=>{
  const cells=[...row].flatMap(ch=>/\d/.test(ch)?Array(Number(ch)).fill(null):[ch]).reverse();let out='',empty=0;
  for(const ch of cells){if(!ch)empty++;else{if(empty)out+=empty;empty=0;out+=ch;}}return out+(empty||'');
 }).join('/');
 const fen=placement+' w - - 0 1';
 PUZZLES.push({...p,id:p.id+'-mirror',fen,board:boardFromFEN(fen),target:p.target?[p.target[0],7-p.target[1]]:undefined,variation:true});
}
for(const p of PUZZLES)p.learning={skill:({capture:'말 잡기',escape:'왕 안전',fork:'동시 공격',checkmate:'체크메이트',checkmate2:'두 수 계획'})[p.type],prerequisites:p.level===2?['기물 이동']:['기물 이동','말 잡기'],newRule:p.desc.ko,planning:p.type==='checkmate2'?2:1,recovery:'되돌리거나 한 수 도움으로 다시 살펴요.'};
