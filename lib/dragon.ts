// Coordinates supplied with the artwork, scaled independently to its actual size.
const original = [
 [87,183,169,150],[428,124,205,209],[786,77,237,257],[1178,28,261,306],[1560,3,330,331],
 [12,457,295,309],[326,438,328,330],[665,412,369,358],[1041,387,440,385],[1483,345,497,429]
];
export const dragonCrops = original.map(([x,y,width,height],i)=>{
 const left=Math.floor(x*1280/1983), top=Math.floor(y*511/793);
 const right=Math.min(1280,Math.ceil((x+width)*1280/1983)), bottom=Math.min(511,Math.ceil((y+height)*511/793));
 return {stage:i+1,x:left,y:top,width:right-left,height:bottom-top};
});
