'use client';
import {useState} from 'react';
import {paths} from '@/lib/game';

export default function StrokeDemo({letter,language}:{letter:string;language:'en'|'es'}) {
 const [replay,setReplay]=useState(0);
 const strokes=paths[letter] || [];
 const es=language==='es';
 if(!strokes.length)return null;
 return <div className="stroke-help">
  <p><strong>{strokes.length} {es?(strokes.length===1?'trazo':'trazos'):(strokes.length===1?'stroke':'strokes')}</strong> · {es?'Empieza en cada número. Sigue la flecha. Levanta el dedo entre trazos.':'Start at each number. Follow the arrow. Lift your finger between strokes.'}</p>
  <button className="demo-button" onClick={()=>setReplay(n=>n+1)}>{es?'▶ Ver cómo se escribe':'▶ Watch how to write'}</button>
  {replay>0&&<div className="demo-panel" key={`${letter}-${replay}`}><p>{es?'Mira los trazos en orden:':'Watch the strokes in order:'}</p><svg viewBox="0 0 100 100" role="img" aria-label={es?`Demostración de ${letter}, ${strokes.length} trazos`:`Demonstration of ${letter}, ${strokes.length} strokes`}>
   {strokes.map((s,i)=><path key={i} d={`M ${s.map(p=>`${p.x} ${p.y}`).join(' L ')}`} pathLength="1" fill="none" stroke="#253b75" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="demo-stroke" style={{animationDelay:`${i*1.2}s`}}/>)}
  </svg><p className="demo-reduced">{es?'Sigue los números del recuadro para ver el orden.':'Follow the numbers on the pad for the order.'}</p></div>}
 </div>;
}
