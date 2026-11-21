import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {complete,evaluate,initial,load,paths,save} from '../lib/game';
describe('writing geometry',()=>{it('accepts every reference trajectory',()=>{for(const [letter,path] of Object.entries(paths)) expect(evaluate(path,letter).passed,letter).toBe(true)});it('rejects taps and arbitrary lines',()=>{expect(evaluate([[{x:30,y:18}]],'E').passed).toBe(false);expect(evaluate([[{x:0,y:0},{x:100,y:100}]],'E').passed).toBe(false)});it('uses difficulty and tolerance',()=>{const shifted=paths.E.map(s=>s.map(p=>({x:p.x+12,y:p.y})));expect(evaluate(shifted,'E','easy').passed).toBe(true);expect(evaluate(shifted,'E','challenge',.7).passed).toBe(false)})});
describe('local progress',()=>{it('round trips and unlocks only on completion',()=>{let value='';const storage={getItem:()=>value,setItem:(_:string,v:string)=>{value=v}};let p=complete(initial(),1,'E','guided',false);expect(p.unlocked).toBe(1);p=complete(p,1,'e','guided',true);expect(p.unlocked).toBe(2);save(storage,p);expect(load(storage)).toEqual(p);expect(load({getItem:()=>'{bad'})).toEqual(initial());expect(initial().completed).toEqual([])});it('handles storage errors and invalid settings',()=>{expect(load({getItem:()=>{throw Error('denied')}})).toEqual(initial());const p=initial();p.settings.difficulty='easy';const loaded=load({getItem:()=>JSON.stringify({...p,settings:{...p.settings,difficulty:'invalid'}})});expect(loaded.settings.difficulty).toBe('normal');expect(()=>save({setItem:()=>{throw Error('full')}},p)).toThrow()})});

describe('guided stroke order and continuity',()=>{
 it('rejects reversed and fragmented reference strokes',()=>{
  for(const [letter,path] of Object.entries(paths)){
   expect(evaluate(path.map(s=>[...s].reverse()),letter).passed,letter).toBe(false);
   const first=path[0]; const fragments=first.slice(1).map((point,i)=>[first[i],point]);
   if(fragments.length>1) expect(evaluate([...fragments,...path.slice(1)],letter).passed,letter).toBe(false);
  }
 });
 it('accepts modest shifts and uneven sampling',()=>{
  for(const [letter,path] of Object.entries(paths)){
   const shifted=path.map(s=>s.map(p=>({x:p.x+3,y:p.y+2})));
   expect(evaluate(shifted,letter).passed,letter).toBe(true);
  }
 });
});

describe('expanded practice',()=>{
 it('has authored guides for all 62 characters',()=>{for(const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'){expect(paths[c],c).toBeDefined();expect(evaluate(paths[c],c).passed,c).toBe(true);expect(evaluate([[{x:0,y:0},{x:100,y:100}]],c).passed,c).toBe(false)}});
});

import {validateName, practiceName, changeName} from '../lib/game';
describe('names',()=>{
 it('validates supported letters and case modes',()=>{expect(validateName('  aLEx  ')).toBe('Alex');expect(validateName('José')).toBeNull();expect(validateName('A B')).toBeNull();expect(validateName('')).toBeNull();expect(practiceName('Alex','upper')).toBe('ALEX');expect(practiceName('Alex','lower')).toBe('alex');expect(practiceName('Alex','title')).toBe('Alex')});
 it('resets only name progress when explicitly changed',()=>{const p=complete(initial(),1,'E','guided',true);const changed=changeName(p,'Alex');expect(changed.name).toBe('Alex');expect(changed.completed).toEqual([]);expect(changed.history).toEqual([]);expect(changed.settings).toEqual(p.settings);expect(changeName(p,'Enrique')).toEqual(p)});
 it('migrates original data to Enrique',()=>{const p=initial();const {name: _name,caseMode: _mode,...legacy}=p;void _name;void _mode;expect(load({getItem:()=>JSON.stringify(legacy)}).name).toBe('Enrique')});
});

describe('Spanish letters',()=>{
 it('uses ordered authored guides including the tilde',()=>{
  expect(paths['Ñ']).toEqual([[{x:25,y:78},{x:25,y:22},{x:75,y:78},{x:75,y:22}],[{x:35,y:12},{x:41,y:8},{x:48,y:8},{x:55,y:12},{x:62,y:12},{x:68,y:8}]]);
  expect(paths['ñ']).toEqual([[{x:30,y:78},{x:30,y:42},{x:30,y:53},{x:38,y:43},{x:48,y:41},{x:59,y:45},{x:64,y:54},{x:64,y:78}],[{x:34,y:30},{x:40,y:26},{x:47,y:26},{x:54,y:30},{x:61,y:30},{x:67,y:26}]]);
  for(const c of 'Ññ'){expect(evaluate(paths[c],c).passed).toBe(true);expect(evaluate(paths[c].slice(0,1),c).passed).toBe(false);expect(evaluate([...paths[c]].reverse(),c).passed).toBe(false)}
 });
 it('supports ñ in names and preserves old saved settings',()=>{expect(validateName('  niÑo ')).toBe('Niño');const p=initial();p.settings.mute=true;p.settings.musicVolume=.25;const loaded=load({getItem:()=>JSON.stringify(p)});expect(loaded.settings.mute).toBe(true);expect(loaded.settings.musicVolume).toBe(.25)});
});

it('uses conventional separated top-down starts for the reviewed guides',()=>{
 for(const c of ['E','F','P','R','M','N','n']) {
  expect(paths[c][0][0].y).toBeLessThan(paths[c][0].at(-1)!.y);
  expect(evaluate(paths[c],c).passed).toBe(true);
 }
 expect(paths.E).toHaveLength(4); expect(paths.F).toHaveLength(3);
 expect(paths.P).toHaveLength(2); expect(paths.R).toHaveLength(3);
 expect(paths.M).toHaveLength(4); expect(paths.N).toHaveLength(3); expect(paths.n).toHaveLength(2);
});

describe('v1.3 level progression', () => {
 it('offers ten multi-exercise levels per section and unlocks only validated completions', async () => {
  const g = await import('../lib/game');
  for (const section of ['name','alphabet','numbers'] as const) {
   expect(g.levelExercises(section, 1, 'Enrique', 'upper').length).toBeGreaterThan(1);
   expect(g.levelExercises(section, 10, 'Enrique', 'upper').length).toBeGreaterThan(1);
   let p=g.initial();
   expect(g.levelUnlocked(p,section)).toBe(1);
   p=g.completeLevel(p,section,1);
   expect(g.levelUnlocked(p,section)).toBe(2);
   expect(g.mansionStage(p)).toBe(1);
   expect(g.mansionStage(g.completeLevel(p,section,1))).toBe(1);
  }
 });
 it('migrates legacy worlds without awarding new levels', async () => {
  const g=await import('../lib/game');
  const p=g.load({getItem:()=>JSON.stringify({unlocked:5,completed:[1,2,3,4],history:[],settings:{}})});
  expect(p.completed).toEqual([1,2,3,4]);
  expect(g.levelUnlocked(p,'name')).toBe(5);
  expect(g.levelUnlocked(p,'alphabet')).toBe(1);
  expect(g.mansionStage(p)).toBe(4);
 });
 it('accepts a wobbly beginner trace but rejects taps and random strokes', async () => {
  const g=await import('../lib/game');
  const wobble=g.paths.L.map(s=>s.map(p=>({x:p.x+18,y:p.y+2})));
  expect(g.evaluate(wobble,'L','normal',1,true).passed).toBe(true);
  expect(g.evaluate(wobble,'L','normal',1).passed).toBe(false);
  expect(g.evaluate([[{x:30,y:18}]],'L','normal',1,true).passed).toBe(false);
  expect(g.evaluate([[{x:0,y:0},{x:95,y:95}]],'L','normal',1,true).passed).toBe(false);
 });
});

it('unlocks all thirty levels sequentially without replay growth', async () => {
 const g=await import('../lib/game');
 let p=g.initial();
 for (const section of ['name','alphabet','numbers'] as const) {
  for(let level=1;level<=10;level++) {
   expect(g.levelUnlocked(p,section)).toBe(level);
   p=g.completeLevel(p,section,level);
   const count=g.mansionStage(p);
   p=g.completeLevel(p,section,level);
   expect(g.mansionStage(p)).toBe(count);
  }
 }
 expect(g.mansionStage(p)).toBe(30);
 const restored=g.load({getItem:()=>JSON.stringify(p)});
 expect(g.mansionStage(restored)).toBe(30);
});

it('unlocks the sixth name world for a legacy completed dragon', async () => {
 const g=await import('../lib/game');
 const p=g.load({getItem:()=>JSON.stringify({unlocked:5,completed:[1,2,3,4,5],history:[{world:5,exercise:'E',method:'guided',date:'2020-01-01'}],settings:{}})});
 expect(g.levelUnlocked(p,'name')).toBe(6);
 expect(p.history).toHaveLength(1);
 expect(p.levels.name).toEqual([]);
});

it('beginner tolerance still requires all strokes in order', async () => {
 const g=await import('../lib/game');
 expect(g.evaluate(g.paths.A,'A','normal',1,true).passed).toBe(true);
 expect(g.evaluate([g.paths.A[0]],'A','normal',1,true).passed).toBe(false);
 expect(g.evaluate([...g.paths.A].reverse(),'A','normal',1,true).passed).toBe(false);
});

it('covers each language alphabet in level tasks in both cases without granting progress', async()=>{
 const g=await import('../lib/game');
 for(const language of ['en','es'] as const) for(const mode of ['upper','lower'] as const){
  const expected=language==='es'?'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ':'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const tasks=Array.from({length:10},(_,i)=>g.levelExercises('alphabet',i+1,'Enrique',mode,language)).flat();
  expect(new Set(tasks)).toEqual(new Set(Array.from(mode==='lower'?expected.toLowerCase():expected)));
 }
 expect(g.mansionStage(g.initial())).toBe(0);
});

it('migrates old history and records other sections without name progress', async()=>{
 const g=await import('../lib/game');
 const old={world:2,exercise:'n',method:'guided',date:'2020-01-01'};
 let p=g.load({getItem:()=>JSON.stringify({unlocked:1,completed:[],history:[old]})});
 expect(p.history).toEqual([{...old,section:'name'}]);
 p=g.complete(p,1,'A','guided',true,'alphabet');
 p=g.complete(p,1,'0','guided',true,'numbers');
 expect(p.history.map(h=>h.section)).toEqual(['name','alphabet','numbers']);
 expect(p.completed).toEqual([]); expect(p.unlocked).toBe(1);
 expect(g.changeName(p,'Alex').history.map(h=>h.section)).toEqual(['alphabet','numbers']);
});

describe('forgiving guided practice',()=>{
 it('accepts realistic offsets at each difficulty while keeping the first level easier',()=>{
  for(const [difficulty,offset] of [['easy',16],['normal',12],['challenge',9]] as const){
   const trace=paths.A.map((stroke,i)=>stroke.map((p,j)=>({x:p.x+offset+(j%2),y:p.y+(i?1:-1)})));
   expect(evaluate(trace,'A',difficulty).passed,difficulty).toBe(true);
  }
  const beginner=paths.A.map(s=>s.map(p=>({x:p.x+18,y:p.y})));
  expect(evaluate(beginner,'A','normal',1,true).passed).toBe(true);
  expect(evaluate(beginner,'A','normal').passed).toBe(false);
 });
 it('rejects taps, arbitrary lines and missing strokes at every difficulty',()=>{
  for(const difficulty of ['easy','normal','challenge'] as const) for(const beginner of [false,true]){
   expect(evaluate([[{x:25,y:78}]],'A',difficulty,1,beginner).passed).toBe(false);
   expect(evaluate([[{x:0,y:0},{x:100,y:100}]],'A',difficulty,1,beginner).passed).toBe(false);
   expect(evaluate([paths.A[0]],'A',difficulty,1,beginner).passed).toBe(false);
  }
 });
});

describe('alphabet dragon progression',()=>{
 it('uses only unique alphabet level completions and survives legacy saves and reloads',async()=>{
  const g=await import('../lib/game');
  let p=g.load({getItem:()=>JSON.stringify({unlocked:5,completed:[1,2,3,4],history:[]})});
  expect(g.dragonStage(p)).toBe(0);
  p=g.completeLevel(p,'numbers',1); expect(g.dragonStage(p)).toBe(0);
  p=g.complete(p,1,'A','guided',true,'alphabet',true); expect(g.dragonStage(p)).toBe(0);
  for(let i=1;i<=10;i++){p=g.completeLevel(p,'alphabet',i);p=g.completeLevel(p,'alphabet',i);expect(g.dragonStage(p)).toBe(i)}
  expect(g.dragonStage(g.load({getItem:()=>JSON.stringify(p)}))).toBe(10);
 });
 it('scales all supplied crop rectangles into the actual image without exceeding bounds',async()=>{
  const {dragonCrops}=await import('../lib/dragon');
  expect(dragonCrops).toHaveLength(10);
  for(const [i,c] of dragonCrops.entries()) {expect(c.stage).toBe(i+1);expect(c.x).toBeGreaterThanOrEqual(0);expect(c.y).toBeGreaterThanOrEqual(0);expect(c.x+c.width).toBeLessThanOrEqual(1280);expect(c.y+c.height).toBeLessThanOrEqual(511);expect(c.width).toBeGreaterThan(0);expect(c.height).toBeGreaterThan(0)}
 });
});

describe('name house progression',()=>{
 it('counts unique completed name levels including legacy worlds, independently of other sections',async()=>{
  const g=await import('../lib/game');
  let p=g.load({getItem:()=>JSON.stringify({unlocked:4,completed:[1,2,3,3],history:[],levels:{name:[3,4],alphabet:[1,2],numbers:[1]}})});
  expect(g.nameHouseStage(p)).toBe(4);
  p=g.completeLevel(p,'name',5); p=g.completeLevel(p,'name',5);
  expect(g.nameHouseStage(p)).toBe(5);
  expect(g.nameHouseStage(g.load({getItem:()=>JSON.stringify(p)}))).toBe(5);
  expect(g.nameHouseStage(g.changeName(p,'Ana'))).toBe(0);
  expect(g.nameHouseStage(g.initial())).toBe(0);
  for(let n=1;n<=10;n++) p=g.completeLevel(p,'name',n);
  expect(g.nameHouseStage(p)).toBe(10);
 });
});

describe('Numbers alien progression',()=>{
 it('migrates legacy saves without inventing Numbers completions',async()=>{
  const g=await import('../lib/game');
  const p=load({getItem:()=>JSON.stringify({unlocked:6,completed:[1,2,3,4,5],history:[]})});
  expect(g.alienStage(p)).toBe(0); expect(p.completed).toEqual([1,2,3,4,5]);
 });
 it('counts only distinct valid Numbers levels, preserving progress on replay and reload',async()=>{
  const g=await import('../lib/game'); let p=initial();
  p=g.completeLevel(g.completeLevel(p,'name',1),'alphabet',1); expect(g.alienStage(p)).toBe(0);
  p=g.completeLevel(p,'numbers',1); expect(g.alienStage(p)).toBe(1);
  p=g.completeLevel(p,'numbers',1); expect(p.levels.numbers).toEqual([1]);
  for(let i=2;i<=10;i++) p=g.completeLevel(p,'numbers',i);
  let value=''; save({setItem:(_,v)=>{value=v}},p); expect(g.alienStage(load({getItem:()=>value}))).toBe(10);
  expect(g.alienStage(initial())).toBe(0);
  expect(g.alienStage({...p,levels:{...p.levels,numbers:[1,1,2,0,11]}})).toBe(2);
 });
});

it('keeps all ten supplied PNG files byte-for-byte intact',()=>{
 const hashes=["a2f354628a684f872c4af0f952d14e320fa308222204f93cefcaaf61c79f2640", "00a9ca3b23a07029b0709f453a98d090f5c87bf18a563fd9707b9ad13995e66c", "b3b809fb356c3b26ed383376c6cf0937e63883851e4808b4734dbe0671c0c2f2", "e6faacc3dc95fe5ffa58d42e1e53f96b973508f83062e42b0ce87da5a0fad654", "3d0b29142d084aba9f0b39352eba3983e8cf30d5c59809cdb91393a3d36575c3", "8cf6aca3bef9bfc6e72ecf5d2bb9e0efab56e1a1a8192f2d375f31f75550a933", "94b512553ee77a13ded206f88490cdfaf9ef2fff85d404b45a3781c0c2ae3808", "d942a31238d4de3bea5a9897393768fb9fa7063ba9022e47609c4a299c3fea62", "d57796f90440f2e352fd9e9d73681897b4ca02becc5fc1bb48bdb99cf06c793e", "917d63f4febe7f386ef290e781da51ce68b84911ca40295b2e50e1be3ae643bf"];
 hashes.forEach((hash,i)=>{const bytes=readFileSync(`public/alien/alien_stage_${String(i+1).padStart(2,"0")}.png`);expect(bytes.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));expect(createHash("sha256").update(bytes).digest("hex")).toBe(hash)});
});
