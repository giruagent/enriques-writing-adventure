import {alienStage,dragonStage,nameHouseStage,type Progress,type Section} from './game';
export const albumStage=(p:Progress,section:Section)=>section==='name'?nameHouseStage(p):section==='alphabet'?dragonStage(p):alienStage(p);
export type Achievement={id:string; section:Section|'all'; target:number; current:number; earned:boolean};
export function achievements(p:Progress):Achievement[]{
 const sections:Section[]=['name','alphabet','numbers'];
 const goal=(id:string,section:Section|'all',value:number,target:number):Achievement=>({id,section,target,current:Math.min(target,value),earned:value>=target});
 return [goal('exercise','all',p.history.some(e=>e && ['name','alphabet','numbers'].includes(e.section) && ['guided','adult'].includes(e.method) && typeof e.exercise==='string' && e.exercise.length>0)?1:0,1),...sections.flatMap(section=>[1,5,10].map(n=>goal(`${section}-${n}`,section,albumStage(p,section),n))),...[1,5,10].map(n=>goal(`all-${n}`,'all',sections.filter(s=>albumStage(p,s)>=n).length,3))];
}
