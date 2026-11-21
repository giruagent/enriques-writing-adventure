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
