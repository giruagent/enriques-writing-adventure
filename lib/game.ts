export type Point = {x:number;y:number};
export type Stroke = Point[];
export type Difficulty = 'easy'|'normal'|'challenge';
export const letters = ['E','n','r','i','q','u','e'] as const;
// Hand-authored pen paths in a 100 × 100 writing cell. Baseline: 78; x-height: 42.
export const paths: Record<string, Stroke[]> = {
 E:[[{x:68,y:18},{x:30,y:18},{x:30,y:78},{x:70,y:78}],[{x:30,y:48},{x:61,y:48}]],
 n:[[{x:30,y:78},{x:30,y:42},{x:30,y:53},{x:38,y:43},{x:48,y:41},{x:59,y:45},{x:64,y:54},{x:64,y:78}]],
 r:[[{x:33,y:78},{x:33,y:42},{x:33,y:53},{x:41,y:44},{x:51,y:42},{x:59,y:45}]],
 i:[[{x:49,y:42},{x:49,y:78}],[{x:49,y:27},{x:49,y:30}]],
 q:[[{x:65,y:48},{x:57,y:42},{x:46,y:42},{x:35,y:48},{x:31,y:59},{x:35,y:72},{x:46,y:78},{x:57,y:76},{x:65,y:67},{x:65,y:42},{x:65,y:94}]],
 u:[[{x:30,y:42},{x:30,y:65},{x:34,y:74},{x:43,y:78},{x:54,y:76},{x:64,y:66},{x:64,y:42},{x:64,y:78}]],
 e:[[{x:32,y:60},{x:65,y:60},{x:63,y:50},{x:56,y:43},{x:46,y:42},{x:36,y:47},{x:31,y:58},{x:34,y:70},{x:44,y:77},{x:55,y:78},{x:64,y:73}]]
};
export function sample(strokes:Stroke[], step=2):Point[]{const out:Point[]=[]; for(const s of strokes){if(s.length) out.push(s[0]); for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i], n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/step); for(let j=1;j<=n;j++) out.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});}} return out;}
const near=(p:Point, points:Point[], tolerance:number)=>points.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<=tolerance);
// Compare each pen-down trajectory with its corresponding guide in order. Dynamic
// time warping allows uneven drawing speed and small wobbles without allowing
// a collection of disconnected fragments to stand in for one stroke.
function followsStroke(stroke:Stroke, guide:Stroke, tolerance:number):boolean {
 const a=sample([stroke],3), b=sample([guide],3);
 if(a.length<2 || b.length<2) return false;
 const distance=(p:Point,q:Point)=>Math.hypot(p.x-q.x,p.y-q.y);
 if(distance(a[0],b[0])>tolerance*1.5 || distance(a[a.length-1],b[b.length-1])>tolerance*1.5) return false;
 let previous=Array<number>(b.length+1).fill(Infinity); previous[0]=0;
 for(const p of a){const current=Array<number>(b.length+1).fill(Infinity); for(let j=1;j<=b.length;j++) current[j]=distance(p,b[j-1])+Math.min(previous[j],current[j-1],previous[j-1]); previous=current;}
 return previous[b.length]/Math.max(a.length,b.length)<=tolerance;
}
export function evaluate(strokes:Stroke[], letter:string, difficulty:Difficulty='normal', sensitivity=1){const guides=paths[letter]||[], ref=sample(guides), user=sample(strokes); const length=strokes.reduce((sum,s)=>sum+s.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-s[i].x,p.y-s[i].y),0),0); const tolerance=({easy:15,normal:11,challenge:8}[difficulty])*sensitivity; const coverage=ref.length?ref.filter(p=>near(p,user,tolerance)).length/ref.length:0; const proximity=user.length?user.filter(p=>near(p,ref,tolerance)).length/user.length:0; const continuous=strokes.length===guides.length && guides.length>0 && guides.every((guide,i)=>followsStroke(strokes[i],guide,tolerance)); return {coverage,proximity,length,continuous,passed:continuous&&length>25&&coverage>=({easy:.62,normal:.72,challenge:.8}[difficulty])&&proximity>=({easy:.55,normal:.65,challenge:.75}[difficulty])};}
export type Settings={language:'en'|'es';difficulty:Difficulty;sensitivity:number;thickness:number;mute:boolean;speech:boolean;manualValidation:boolean};
export type RecordEntry={world:number;exercise:string;method:'guided'|'adult';date:string};
export type Progress={unlocked:number;completed:number[];history:RecordEntry[];settings:Settings;sessions:number};
export const initial=():Progress=>({unlocked:1,completed:[],history:[],sessions:0,settings:{language:'en',difficulty:'normal',sensitivity:1,thickness:5,mute:false,speech:false,manualValidation:true}});
export function load(storage:Pick<Storage,'getItem'>):Progress {try {const raw=storage.getItem('enrique-adventure-v1'); if(!raw)return initial(); const p=JSON.parse(raw); if(!p||!Array.isArray(p.completed)||!Array.isArray(p.history)||!Number.isInteger(p.unlocked)||p.unlocked<1||p.unlocked>5) return initial(); const d=initial(); const s=p.settings||{}; return {...d,...p,settings:{...d.settings,...s,difficulty:['easy','normal','challenge'].includes(s.difficulty)?s.difficulty:'normal',language:s.language==='es'?'es':'en',sensitivity:typeof s.sensitivity==='number'&&s.sensitivity>=.7&&s.sensitivity<=1.3?s.sensitivity:1,thickness:typeof s.thickness==='number'&&s.thickness>=2&&s.thickness<=10?s.thickness:5}};} catch{return initial();}}
export function save(storage:Pick<Storage,'setItem'>,p:Progress){storage.setItem('enrique-adventure-v1',JSON.stringify(p));}
export function complete(p:Progress,world:number,exercise:string,method:'guided'|'adult',final:boolean):Progress {return {...p,history:[...p.history,{world,exercise,method,date:new Date().toISOString()}],completed:final&& !p.completed.includes(world)?[...p.completed,world]:p.completed,unlocked:final?Math.max(p.unlocked,Math.min(5,world+1)):p.unlocked};}
