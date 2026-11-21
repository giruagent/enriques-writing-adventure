import {describe, expect, it} from 'vitest';
import {paths} from '../lib/game';
import {makeGuides} from '../lib/guides';

describe('direction guides',()=>{
 it('uses a real forward segment for every authored stroke and keeps markers in bounds',()=>{
  for(const strokes of Object.values(paths)) {
   const guides=makeGuides(strokes); expect(guides).toHaveLength(strokes.length);
   guides.forEach((guide,i)=>{expect(guide.order).toBe(i+1); expect(guide.arrow).not.toBeNull(); const a=guide.arrow!; expect(Object.values(a).every(Number.isFinite)).toBe(true); const segment=strokes[i].slice(1).some((p,j)=>{const q=strokes[i][j];const dx=p.x-q.x,dy=p.y-q.y;const along=(a.x-q.x)*dx+(a.y-q.y)*dy;return Math.abs(dx*a.dy-dy*a.dx)<1e-7 && dx*a.dx+dy*a.dy>0 && Math.abs((a.x-q.x)*dy-(a.y-q.y)*dx)<1e-7 && along>=0 && along<=dx*dx+dy*dy});expect(segment).toBe(true);expect(guide.marker.x).toBeGreaterThanOrEqual(5);expect(guide.marker.x).toBeLessThanOrEqual(95);expect(guide.marker.y).toBeGreaterThanOrEqual(5);expect(guide.marker.y).toBeLessThanOrEqual(95);expect(JSON.stringify(guide)).not.toMatch(/NaN|Infinity/)});
   for(let i=0;i<guides.length;i++)for(let j=0;j<i;j++)expect(Math.hypot(guides[i].marker.x-guides[j].marker.x,guides[i].marker.y-guides[j].marker.y)).toBeGreaterThanOrEqual(10);
  }
 });
 it('handles tiny and degenerate strokes without inventing a direction',()=>{const guides=makeGuides([[{x:49,y:27},{x:49,y:30}],[{x:0,y:0},{x:0,y:0}],[]]);expect(guides[0].arrow?.dy).toBeGreaterThan(0);expect(Math.hypot(guides[0].marker.x-guides[0].arrow!.x,guides[0].marker.y-guides[0].arrow!.y)).toBeGreaterThanOrEqual(8);expect(guides[1].arrow).toBeNull();expect(guides[2].arrow).toBeNull();expect(JSON.stringify(guides)).not.toMatch(/NaN|Infinity/)});
});
