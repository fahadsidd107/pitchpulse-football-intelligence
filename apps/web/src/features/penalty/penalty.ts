export const targetZones=[
 {id:0,label:'Upper left',x:197,y:115},{id:1,label:'Upper centre',x:350,y:115},{id:2,label:'Upper right',x:503,y:115},
 {id:3,label:'Lower left',x:197,y:215},{id:4,label:'Lower centre',x:350,y:215},{id:5,label:'Lower right',x:503,y:215},
] as const
export interface PenaltyShot {readonly target:number;readonly keeper:number;readonly saved:boolean}
/** A single independent random draw commits the dive before any visual playback. */
export function resolvePenalty(target:number,random:number):PenaltyShot {
 if(!Number.isInteger(target)||target<0||target>=6)throw new RangeError('Choose a valid goal target.')
 if(!Number.isFinite(random)||random<0||random>=1)throw new RangeError('Random sample must be in [0, 1).')
 const keeper=Math.floor(random*6)
 return Object.freeze({target,keeper,saved:target%3===keeper%3})
}
export function penaltyFrame(shot:PenaltyShot,progress:number){
 const t=Math.max(0,Math.min(1,progress)),flight=Math.min(1,t/.82),eased=1-(1-flight)**2
 const target=targetZones[shot.target]!,dive=targetZones[shot.keeper]!
 const deflect=shot.saved?Math.max(0,(t-.82)/.18):0
 const x=350+(target.x-350)*eased+(shot.target%3===0?-70:70)*deflect
 const y=355+(target.y-355)*eased-Math.sin(flight*Math.PI)*35+deflect*90
 const reach=shot.saved?target:dive
 return {ballX:x,ballY:y,ballRadius:12-6*flight,keeperX:350+(reach.x-350)*Math.min(1,t/.65),keeperY:205+(reach.y+22-205)*Math.min(1,t/.65),keeperAngle:(reach.x-350)/153*Math.min(1,t/.65)*48}
}
