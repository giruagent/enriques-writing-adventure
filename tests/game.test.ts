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
