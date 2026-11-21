export type Point = {x:number;y:number};
export type Stroke = Point[];
export type Difficulty = 'easy'|'normal'|'challenge';
export const letters = ['E','n','r','i','q','u','e'] as const;
// Hand-authored pen paths in a 100 × 100 writing cell. Baseline: 78; x-height: 42.
export const paths: Record<string, Stroke[]> = {
 E:[[{x:30,y:18},{x:30,y:78}],[{x:30,y:18},{x:68,y:18}],[{x:30,y:48},{x:61,y:48}],[{x:30,y:78},{x:70,y:78}]],
 n:[[{x:30,y:42},{x:30,y:78}],[{x:30,y:53},{x:38,y:43},{x:48,y:41},{x:59,y:45},{x:64,y:54},{x:64,y:78}]],
 r:[[{x:33,y:78},{x:33,y:42},{x:33,y:53},{x:41,y:44},{x:51,y:42},{x:59,y:45}]],
 i:[[{x:49,y:42},{x:49,y:78}],[{x:49,y:27},{x:49,y:30}]],
 q:[[{x:65,y:48},{x:57,y:42},{x:46,y:42},{x:35,y:48},{x:31,y:59},{x:35,y:72},{x:46,y:78},{x:57,y:76},{x:65,y:67},{x:65,y:42},{x:65,y:94}]],
 u:[[{x:30,y:42},{x:30,y:65},{x:34,y:74},{x:43,y:78},{x:54,y:76},{x:64,y:66},{x:64,y:42},{x:64,y:78}]],
 e:[[{x:32,y:60},{x:65,y:60},{x:63,y:50},{x:56,y:43},{x:46,y:42},{x:36,y:47},{x:31,y:58},{x:34,y:70},{x:44,y:77},{x:55,y:78},{x:64,y:73}]]
};
// Each list is an ordered pen-down centerline in the writing cell.
const authored: Record<string, number[][][]> = {
 Ñ:[[[25,78],[25,22],[75,78],[75,22]],[[35,12],[41,8],[48,8],[55,12],[62,12],[68,8]]], ñ:[[[30,78],[30,42],[30,53],[38,43],[48,41],[59,45],[64,54],[64,78]],[[34,30],[40,26],[47,26],[54,30],[61,30],[67,26]]],
 A:[[[25,78],[50,18],[75,78]],[[35,55],[65,55]]], B:[[[28,18],[28,78]],[[28,18],[55,18],[66,24],[67,34],[60,45],[28,48]],[[28,48],[58,48],[70,55],[70,67],[60,78],[28,78]]], C:[[[70,25],[60,18],[42,18],[30,27],[25,45],[28,65],[40,77],[58,78],[70,70]]], D:[[[28,18],[28,78]],[[28,18],[50,18],[65,28],[70,47],[65,67],[50,78],[28,78]]],
 F:[[[30,18],[30,78]],[[30,18],[70,18]],[[30,48],[60,48]]], G:[[[70,25],[58,18],[42,18],[30,27],[25,48],[30,68],[42,78],[58,78],[70,68],[70,50],[52,50]]], H:[[[28,18],[28,78]],[[72,18],[72,78]],[[28,48],[72,48]]], I:[[[35,18],[65,18]],[[50,18],[50,78]],[[35,78],[65,78]]], J:[[[68,18],[68,62],[63,73],[52,78],[40,76],[32,68]]], K:[[[28,18],[28,78]],[[70,18],[30,52],[72,78]]], L:[[[30,18],[30,78],[70,78]]], M:[[[22,18],[22,78]],[[22,18],[50,55]],[[78,18],[50,55]],[[78,18],[78,78]]], N:[[[25,18],[25,78]],[[25,18],[75,78]],[[75,18],[75,78]]], O:[[[50,18],[34,22],[26,35],[25,55],[31,71],[45,78],[59,77],[70,68],[75,50],[72,32],[62,21],[50,18]]], P:[[[28,18],[28,78]],[[28,18],[55,18],[68,25],[68,38],[58,47],[28,47]]], Q:[[[50,18],[34,22],[26,35],[25,55],[31,71],[45,78],[59,77],[70,68],[75,50],[72,32],[62,21],[50,18]],[[57,64],[76,82]]], R:[[[28,18],[28,78]],[[28,18],[55,18],[68,25],[68,38],[58,47],[28,47]],[[50,47],[72,78]]], S:[[[70,25],[60,18],[43,18],[30,25],[29,36],[37,44],[61,51],[70,59],[69,69],[58,77],[40,78],[28,71]]], T:[[[22,18],[78,18]],[[50,18],[50,78]]], U:[[[27,18],[27,60],[32,72],[42,78],[58,78],[68,72],[73,60],[73,18]]], V:[[[23,18],[50,78],[77,18]]], W:[[[18,18],[30,78],[50,43],[70,78],[82,18]]], X:[[[25,18],[75,78]],[[75,18],[25,78]]], Y:[[[24,18],[50,48],[76,18]],[[50,48],[50,78]]], Z:[[[25,18],[75,18],[25,78],[75,78]]],
 a:[[[65,48],[57,42],[45,42],[34,49],[31,60],[35,72],[46,78],[57,75],[65,66]],[[65,42],[65,78]]], b:[[[30,18],[30,78]],[[30,53],[39,44],[50,42],[61,47],[66,59],[62,71],[52,78],[41,77],[30,70]]], c:[[[65,48],[56,42],[45,42],[35,48],[31,60],[35,72],[46,78],[57,77],[65,71]]], d:[[[65,48],[56,42],[45,42],[35,48],[31,60],[35,72],[46,78],[57,75],[65,67]],[[65,18],[65,78]]], f:[[[62,18],[52,18],[45,24],[44,78]],[[32,42],[60,42]]], g:[[[65,48],[56,42],[45,42],[35,48],[31,60],[35,72],[46,78],[57,75],[65,67]],[[65,42],[65,82],[60,92],[49,95],[36,91]]], h:[[[30,18],[30,78]],[[30,55],[39,44],[49,42],[60,46],[65,55],[65,78]]], j:[[[55,42],[55,84],[50,93],[40,95],[33,91]],[[55,27],[55,30]]], k:[[[30,18],[30,78]],[[65,42],[31,62],[66,78]]], l:[[[48,18],[48,78]]], m:[[[20,78],[20,42],[20,53],[28,43],[37,42],[45,48],[47,78]],[[47,54],[55,43],[64,42],[73,47],[77,55],[77,78]]], o:[[[50,42],[38,45],[31,55],[31,65],[37,75],[49,78],[61,75],[67,65],[67,55],[61,45],[50,42]]], p:[[[31,42],[31,95]],[[31,51],[40,43],[51,42],[62,48],[66,60],[62,72],[52,78],[41,77],[31,70]]], s:[[[65,47],[55,42],[43,42],[34,48],[35,55],[44,59],[57,62],[65,68],[63,74],[53,78],[41,78],[32,73]]], t:[[[48,25],[48,68],[51,76],[60,78],[66,75]],[[32,42],[64,42]]], v:[[[28,42],[50,78],[72,42]]], w:[[[20,42],[32,78],[50,55],[68,78],[80,42]]], x:[[[30,42],[68,78]],[[68,42],[30,78]]], y:[[[28,42],[50,78],[72,42]],[[50,78],[44,90],[36,95]]], z:[[[31,42],[67,42],[31,78],[67,78]]],
 '0':[[[50,18],[35,22],[28,35],[28,60],[35,74],[50,78],[65,74],[72,60],[72,35],[65,22],[50,18]]], '1':[[[36,30],[50,18],[50,78]],[[36,78],[65,78]]], '2':[[[29,30],[34,21],[45,18],[58,19],[68,27],[68,38],[60,48],[30,78],[71,78]]], '3':[[[30,24],[40,18],[56,18],[67,25],[67,35],[59,45],[48,47],[59,48],[69,56],[69,67],[60,76],[45,78],[31,72]]], '4':[[[60,78],[60,18],[26,58],[74,58]]], '5':[[[68,18],[34,18],[31,45],[45,42],[59,44],[68,52],[69,64],[62,74],[50,78],[36,75],[29,70]]], '6':[[[65,22],[55,18],[42,22],[32,35],[29,53],[32,68],[42,77],[54,78],[65,72],[68,61],[63,51],[53,47],[42,48],[31,56]]], '7':[[[27,18],[73,18],[43,78]]], '8':[[[50,47],[37,42],[32,32],[35,23],[45,18],[56,18],[65,23],[68,32],[63,42],[50,47],[36,52],[30,62],[34,72],[44,78],[56,78],[66,72],[70,62],[64,52],[50,47]]], '9':[[[68,40],[59,48],[47,49],[36,45],[31,35],[35,24],[45,18],[56,19],[65,27],[68,40],[65,58],[56,72],[44,78],[34,75]]]
};
for (const [character, strokes] of Object.entries(authored)) paths[character] = strokes.map(stroke => stroke.map(([x,y]) => ({x,y})));
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
export function evaluate(strokes:Stroke[], letter:string, difficulty:Difficulty='normal', sensitivity=1, beginner=false){const guides=paths[letter]||[], ref=sample(guides), user=sample(strokes); const length=strokes.reduce((sum,s)=>sum+s.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-s[i].x,p.y-s[i].y),0),0); const tolerance=({easy:15,normal:11,challenge:8}[difficulty])*sensitivity*(beginner?1.65:1); const coverage=ref.length?ref.filter(p=>near(p,user,tolerance)).length/ref.length:0; const proximity=user.length?user.filter(p=>near(p,ref,tolerance)).length/user.length:0; const pathLength=(s:Stroke)=>s.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-s[i].x,p.y-s[i].y),0); const continuous=strokes.length===guides.length && guides.length>0 && guides.every((guide,i)=>(!beginner||pathLength(guide)<12||pathLength(strokes[i])>=pathLength(guide)*.45&&pathLength(strokes[i])<=pathLength(guide)*2.2)&&followsStroke(strokes[i],guide,tolerance)); return {coverage,proximity,length,continuous,passed:continuous&&length>25&&coverage>=(beginner?.52:({easy:.62,normal:.72,challenge:.8}[difficulty]))&&proximity>=(beginner?.5:({easy:.55,normal:.65,challenge:.75}[difficulty]))};}
export type Settings={language:'en'|'es';difficulty:Difficulty;sensitivity:number;thickness:number;mute:boolean;speech:boolean;music:boolean;musicVolume:number;manualValidation:boolean};
export type RecordEntry={section:Section;world:number;exercise:string;method:'guided'|'adult';date:string;free?:boolean};
export type CaseMode='title'|'upper'|'lower';
export const validateName=(value:string):string|null=>{const name=value.trim();return /^[A-Za-zÑñ]{1,20}$/.test(name)?name[0].toUpperCase()+name.slice(1).toLowerCase():null};
export const practiceName=(name:string,mode:CaseMode)=>mode==='upper'?name.toUpperCase():mode==='lower'?name.toLowerCase():name;
export type Progress={name:string;caseMode:CaseMode;unlocked:number;completed:number[];history:RecordEntry[];settings:Settings;sessions:number;levels:Record<Section,number[]>};
export const initial=():Progress=>({name:'Enrique',caseMode:'title',unlocked:1,completed:[],history:[],sessions:0,levels:{name:[],alphabet:[],numbers:[]},settings:{language:'en',difficulty:'normal',sensitivity:1,thickness:5,mute:false,speech:true,music:true,musicVolume:.25,manualValidation:true}});
export function load(storage:Pick<Storage,'getItem'>):Progress {try {const raw=storage.getItem('enrique-adventure-v1'); if(!raw)return initial(); const p=JSON.parse(raw); if(!p||!Array.isArray(p.completed)||!Array.isArray(p.history)||!Number.isInteger(p.unlocked)||p.unlocked<1||p.unlocked>10) return initial(); const d=initial(); const s=p.settings||{}; return {...d,...p,history:p.history.map((entry:RecordEntry)=>({...entry,section:entry.section||'name'})),unlocked:p.completed.includes(5)?Math.max(p.unlocked,6):p.unlocked,levels:{name:cleanLevels(p.levels?.name),alphabet:cleanLevels(p.levels?.alphabet),numbers:cleanLevels(p.levels?.numbers)},name:validateName(p.name||'Enrique')||'Enrique',caseMode:['title','upper','lower'].includes(p.caseMode)?p.caseMode:'title',settings:{...d.settings,...s,difficulty:['easy','normal','challenge'].includes(s.difficulty)?s.difficulty:'normal',language:s.language==='es'?'es':'en',mute:typeof s.mute==='boolean'?s.mute:d.settings.mute,speech:typeof s.speech==='boolean'?s.speech:d.settings.speech,music:typeof s.music==='boolean'?s.music:d.settings.music,musicVolume:typeof s.musicVolume==='number'&&Number.isFinite(s.musicVolume)&&s.musicVolume>=0&&s.musicVolume<=1?s.musicVolume:d.settings.musicVolume,sensitivity:typeof s.sensitivity==='number'&&s.sensitivity>=.7&&s.sensitivity<=1.3?s.sensitivity:1,thickness:typeof s.thickness==='number'&&s.thickness>=2&&s.thickness<=10?s.thickness:5}};} catch{return initial();}}
export function save(storage:Pick<Storage,'setItem'>,p:Progress){storage.setItem('enrique-adventure-v1',JSON.stringify(p));}
export function complete(p:Progress,world:number,exercise:string,method:'guided'|'adult',final:boolean,section:Section='name',free=false):Progress {return {...p,history:[...p.history,{section,world,exercise,method,date:new Date().toISOString(),...(free?{free:true}:{})}],completed:section==='name'&&final&&!p.completed.includes(world)?[...p.completed,world]:p.completed,unlocked:section==='name'&&final?Math.max(p.unlocked,Math.min(10,world+1)):p.unlocked};}

export function changeName(p:Progress,name:string):Progress { const valid=validateName(name); if(!valid||valid===p.name)return p; return {...p,name:valid,unlocked:1,completed:[],history:p.history.filter(entry=>entry.section!=='name'),levels:{...p.levels,name:[]}}; }

export type Section='name'|'alphabet'|'numbers';
const cleanLevels=(value:unknown):number[]=>Array.isArray(value)?Array.from(new Set(value.filter((n):n is number=>Number.isInteger(n)&&n>=1&&n<=10))):[];
export function levelExercises(section:Section, level:number, name:string, mode:'upper'|'lower', language:'en'|'es'='en'):string[] {
 if(section==='name') { const chars=Array.from(name); if(level<=5)return chars.length>1?chars:[...chars,...chars]; if(level===6)return [chars[0],...chars]; if(level===7)return [...chars,chars[chars.length-1]]; if(level===8)return chars.flatMap(c=>/[aeiou]/i.test(c)?[c,c]:[c]); if(level===9)return chars.flatMap(c=>[c,c]); return [...chars,...chars]; }
 const groups=section==='alphabet'?['ABC','DEF','GHI','JKL','MNO','PQR','STU','VWX','YZY','ABC']:['012','123','234','345','456','567','678','789','890','019'];
 const group=section==='alphabet'&&level===9&&language==='es'?'YZÑ':groups[Math.max(0,Math.min(9,level-1))];
 return Array.from(section==='alphabet'&&mode==='lower'?group.toLowerCase():group);
}
export function levelUnlocked(p:Progress,section:Section):number {
 if(section==='name') return Math.min(10,Math.max(p.unlocked,1));
 const completed=p.levels[section]; let n=1; while(n<10&&completed.includes(n)) n++; return n;
}
export function completeLevel(p:Progress,section:Section,level:number):Progress {
 if(level<1||level>10||!Number.isInteger(level)) return p;
 const existing=p.levels[section];
 if(existing.includes(level)) return p;
 return {...p,levels:{...p.levels,[section]:[...existing,level]},...(section==='name'?{unlocked:Math.max(p.unlocked,Math.min(10,level+1))}: {})};
}
export function mansionStage(p:Progress):number {return Math.min(30,new Set([...p.completed.filter(n=>n>=1&&n<=10),...p.levels.name]).size+p.levels.alphabet.length+p.levels.numbers.length);}
