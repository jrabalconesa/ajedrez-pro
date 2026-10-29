import {Chess} from 'chess.js';
import {outcome,type Game} from './chess-state';
import {playerColor} from './player-side';
export type TrainingResult={gameId:string;date:number;score:number;assisted:boolean;level:number;counted:boolean};
export type Training={adaptive:boolean;level:number;pending:number[];results:TrainingResult[];message:string};
export function freshTraining():Training{return {adaptive:true,level:1,pending:[],results:[],message:'Punto de partida 1/20. No equivale a un ELO.'};}
export function trainingSettings(t:Training,a:any):Training{
 t=structuredClone(t);
 if(a.adaptive!==undefined){if(typeof a.adaptive!=='boolean')throw Error('Ajuste adaptativo no válido');if(a.adaptive!==t.adaptive)t.pending=[];t.adaptive=a.adaptive;}
 if(a.level!==undefined){if(!Number.isInteger(a.level)||a.level<0||a.level>20)throw Error('Nivel entre 0 y 20');if(a.level!==t.level)t.pending=[];t.level=a.level;}
 t.message='Configuración guardada. Se aplicará a la próxima partida.';return t;
}
export function attachTraining(g:Game,profileId:string,t:Training){if(g.initialFen!==new Chess().fen()||g.history.length||g.mode!=='play')return g;return {...g,difficulty:t.level,training:{profileId,assisted:false,eligible:true,adaptive:t.adaptive,level:t.level}};}
export function recordTraining(t:Training,g:Game,now=Date.now()):Training{
 const end=outcome({...g,cursor:g.history.length}),meta=g.training;
 if(!meta||!end||t.results.some(r=>r.gameId===g.id))return t;
 t=structuredClone(t);
 const own=playerColor(g),points=end.result==='1/2-1/2'?.5:end.result===(own==='w'?'1-0':'0-1')?1:0;
 const counted=!!(meta.eligible&&!meta.assisted&&meta.adaptive&&t.adaptive&&meta.level===t.level&&g.difficulty===meta.level&&!g.parentId&&end.reason!=='imported_result'&&g.history.length>=4);
 t.results.push({gameId:g.id,date:now,score:points,assisted:meta.assisted,level:meta.level,counted});
 // Keep IDs to make re-opening any finished game idempotent.
 if(!counted){t.message=meta.assisted?'Partida con ayuda registrada; no cambia la dificultad.':'Partida registrada sin ajustar el nivel (manual, variante o demasiado breve).';return t;}
 t.pending.push(points);
 if(t.pending.length>=3){const total=t.pending.slice(-3).reduce((a,b)=>a+b,0),delta=total>=2.5?1:total<=.5?-1:0;t.level=Math.max(0,Math.min(20,t.level+delta));t.pending=[];t.message=delta?'Próxima partida: nivel '+t.level+'/20. Ajuste de un paso según tres partidas sin ayuda.':'Nivel mantenido tras tres partidas sin ayuda.';}
 else t.message='Partida sin ayuda registrada: '+t.pending.length+'/3 para revisar la dificultad.';
 return t;
}
