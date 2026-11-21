import type {Point, Stroke} from './game';

/** Place labels outside the ink where possible; arrows use actual forward segments. */
export function makeGuides(strokes: Stroke[]) {
 const placed: Point[]=[];
 const shortSegments=strokes.flatMap(stroke=>stroke.slice(1).flatMap((p,i)=>{const q=stroke[i],length=Math.hypot(p.x-q.x,p.y-q.y);return length>0&&length<10?[{x:(p.x+q.x)/2,y:(p.y+q.y)/2}]:[]}));
 const labels=strokes.map((stroke,index)=>{
  const start=stroke[0] || {x:50,y:50};
  const candidates: Point[]=[];
  for(const radius of [9,15,22,30,40,55,70]) for(let i=0;i<16;i++) {
   const angle=(i*2*Math.PI/16)-Math.PI/2;
   candidates.push({x:Math.max(5,Math.min(95,start.x+radius*Math.cos(angle))),y:Math.max(5,Math.min(95,start.y+radius*Math.sin(angle)))});
  }
  const marker=candidates.find(p=>placed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=10) && shortSegments.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=8)) || candidates[candidates.length-1];
  placed.push(marker);
  return {order:index+1,start,marker};
 });
 return labels.map((label,index)=>{
  const stroke=strokes[index];
  let arrow: {x:number;y:number;dx:number;dy:number}|null=null, best=-Infinity;
  for(let i=1;i<stroke.length;i++) {
   const a=stroke[i-1],b=stroke[i],length=Math.hypot(b.x-a.x,b.y-a.y);
   if(!Number.isFinite(length)||length===0)continue;
   for(const t of [.65,.35,.8,.2,.5]) {
    const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    const clearance=Math.min(...labels.flatMap(l=>[Math.hypot(x-l.marker.x,y-l.marker.y)-7,Math.hypot(x-l.start.x,y-l.start.y)-4]),x-3,97-x,y-3,97-y);
    const score=Math.min(clearance,12)+Math.min(length,20)*.1;
    if(score>best){best=score;arrow={x,y,dx:(b.x-a.x)/length,dy:(b.y-a.y)/length}}
   }
  }
  return {...label,arrow};
 });
}
