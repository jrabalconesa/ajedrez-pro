export const ANALYSIS_LEVELS = {
 fast:{label:'Rápido',depth:12,time:1000},
 balanced:{label:'Equilibrado',depth:16,time:3000},
 deep:{label:'Profundo',depth:20,time:7000},
} as const;
export type AnalysisLevel=keyof typeof ANALYSIS_LEVELS;
export function analysisLevel(value:unknown):AnalysisLevel{return value==='fast'||value==='deep'?value:'balanced';}
export function score(e:{cp?:number;mate?:number}){return e.mate===undefined?(e.cp??0):e.mate>0?100000-Math.abs(e.mate):e.mate<0?-100000+Math.abs(e.mate):-100000;}
export function moveGrade(best:number,value:number){const loss=Math.max(0,best-value);return {loss,grade:loss<=45?'good' as const:loss<=150?'ok' as const:'bad' as const,width:loss<=45?8:loss<=150?5:3};}
