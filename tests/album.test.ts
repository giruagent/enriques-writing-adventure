import {describe,it,expect} from 'vitest';
import {initial,completeLevel,complete,load} from '../lib/game';
import {albumStage,achievements} from '../lib/album';
describe('albums and trophies',()=>{
 it('derives stages from distinct valid levels including legacy Name worlds',()=>{const p=initial(); p.completed=[1,1,20]; p.levels.name=[1,2]; p.levels.alphabet=[1,1,12]; expect(albumStage(p,'name')).toBe(2); expect(albumStage(p,'alphabet')).toBe(1); expect(albumStage(p,'numbers')).toBe(0)});
 it('awards bounded section and all-section goals without replay inflation',()=>{let p=initial(); expect(achievements(p).every(a=>!a.earned)).toBe(true); for(const s of ['name','alphabet','numbers'] as const) for(let i=1;i<=10;i++) p=completeLevel(p,s,i); p=completeLevel(p,'numbers',1); p=complete(p,1,'A','guided',false); expect(achievements(p).every(a=>a.earned)).toBe(true); expect(achievements(p).every(a=>a.current<=a.target)).toBe(true)});
 it('uses recorded exercise history for the first exercise and retains legacy completion',()=>{let p=load({getItem:()=>JSON.stringify({unlocked:2,completed:[1],history:[]})}); expect(achievements(p).find(a=>a.id==='name-1')?.earned).toBe(true); expect(achievements(p).find(a=>a.id==='exercise')?.earned).toBe(false); p=complete(p,1,'A','adult',false); expect(achievements(p).find(a=>a.id==='exercise')?.earned).toBe(true)});
});
