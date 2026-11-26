import {describe,expect,it} from 'vitest'
import {penaltyFrame,resolvePenalty} from './penalty'
describe('local penalty mechanics',()=>{
 it('commits an independent keeper dive and produces goals and saves',()=>{
  expect(resolvePenalty(0,0)).toEqual({target:0,keeper:0,saved:true})
  expect(resolvePenalty(2,0)).toEqual({target:2,keeper:0,saved:false})
  expect(resolvePenalty(5,.99).saved).toBe(true)
  expect(resolvePenalty(0,.99).keeper).toBe(resolvePenalty(2,.99).keeper)
 })
 it('replays the committed shot without further random draws',()=>{
  const goal=resolvePenalty(2,0),save=resolvePenalty(0,0)
  expect(penaltyFrame(goal,1)).toEqual(penaltyFrame(goal,1))
  expect(penaltyFrame(goal,0).ballY).toBe(355)
  expect(penaltyFrame(goal,1).ballX).toBe(503)
  expect(penaltyFrame(save,1).ballY).toBeGreaterThan(115)
  expect(penaltyFrame(save,.82).keeperX).toBe(197)
 })
 it('rejects invalid targets and random samples',()=>{
  expect(()=>resolvePenalty(6,.5)).toThrow(RangeError)
  expect(()=>resolvePenalty(0,1)).toThrow(RangeError)
  expect(()=>resolvePenalty(0,NaN)).toThrow(RangeError)
 })
})
