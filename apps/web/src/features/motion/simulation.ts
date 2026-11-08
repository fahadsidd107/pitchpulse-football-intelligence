export interface Chance { minute:number; side:'Home'|'Away'; goal:boolean; x:number; y:number }
export function simulateChances(id:string,seed:number,plan:string):Chance[]{
  let n=Math.abs(Math.trunc(Number(seed)||0))>>>0
  for(const char of id+plan)n=(Math.imul(n,31)+char.charCodeAt(0))>>>0
  const draws=()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296}
  return (['Home','Away'] as const).flatMap((side,j)=>Array.from({length:5},(_,i)=>{
    const draw=draws(),chance=side==='Home'?(plan==='Press high'?.44:.34):(plan==='Press high'?.42:.29)
    return {minute:6+i*17+j*7,side,goal:draw<chance,x:side==='Home'?85:15,y:12+draw*40}
  })).sort((a,b)=>a.minute-b.minute)
}
