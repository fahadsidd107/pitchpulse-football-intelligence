export interface Moment {fixture:string; time:number; mode:string; playing:boolean; seek:number}
export function mayCelebrate(before:Moment|undefined,after:Moment){return !!before && before.fixture===after.fixture && before.mode===after.mode && before.seek===after.seek && after.time>before.time && after.time-before.time<=10 && (after.mode==='clock'||after.playing)}
