import { onBeforeUnmount, onMounted, ref } from 'vue'
export const clamp=(n:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n))
export function arrivalPoint(progress:number):[number,number,number] {
  const t=clamp(progress)
  if(t<.48){const a=t/.48;return [-12.8+7.8*a,.9+.19*a,0]}
  const u=(t-.48)/.52,e=u*u*(3-2*u)
  return [-5-1.2*e,1.09+4.1*e,6.4*e]
}
export function useMotionAllowed(){
  const allowed=ref(false);let mq:MediaQueryList|undefined
  function check(){allowed.value=!!mq&&!mq.matches&&!document.hidden}
  onMounted(()=>{mq=window.matchMedia?.('(prefers-reduced-motion: reduce)');mq?.addEventListener('change',check);document.addEventListener('visibilitychange',check);check()})
  onBeforeUnmount(()=>{mq?.removeEventListener('change',check);document.removeEventListener('visibilitychange',check)})
  return allowed
}
export function useReveal(){
  let observer:IntersectionObserver|undefined
  onMounted(()=>{if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{transform:'translateY(15px)',opacity:.82},{transform:'none',opacity:1}],{duration:420,easing:'ease-out'});observer?.unobserve(entry.target)}}),{threshold:.08})
    document.querySelectorAll('.home-page > section:not(.hero),.home-page > .match-centre').forEach(el=>observer!.observe(el))})
  onBeforeUnmount(()=>observer?.disconnect())
}
