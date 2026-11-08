import {expect,it} from 'vitest'
import {mayCelebrate} from './event'
import {arrivalPoint} from './motion'
import {simulateChances} from './simulation'
it('limits event effects to forward ticks in one fixture and playback session',()=>{
 const a={fixture:'A',time:10,mode:'clock',playing:false,seek:0},b={...a,time:11}
 expect(mayCelebrate(a,b)).toBe(true)
 expect(mayCelebrate(undefined,b)).toBe(false)
 for(const next of [{...b,time:8},{...b,seek:1},{...b,fixture:'B'},{...b,time:50},{...b,mode:'replay'}])expect(mayCelebrate(a,next)).toBe(false)
 expect(mayCelebrate({...a,mode:'replay'},{...b,mode:'replay'})).toBe(false)
 expect(mayCelebrate({...a,mode:'replay'},{...b,mode:'replay',playing:true})).toBe(true)
})
it('clamps camera progression inside its authored path',()=>{expect(arrivalPoint(-2)).toEqual(arrivalPoint(0));expect(arrivalPoint(4)).toEqual(arrivalPoint(1));expect(arrivalPoint(1)[1]).toBeGreaterThan(arrivalPoint(0)[1])})
it('generates one repeatable chronological ledger for both animation and result',()=>{const e=simulateChances('demo',11,'Balanced');expect(e).toEqual(simulateChances('demo',11,'Balanced'));expect(e).toHaveLength(10);expect(e.map(c=>c.minute)).toEqual([...e].sort((a,b)=>a.minute-b.minute).map(c=>c.minute));expect(new Set(e.map(c=>c.side)).size).toBe(2)})
