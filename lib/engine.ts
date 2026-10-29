import {Chess} from 'chess.js';
import {ANALYSIS_LEVELS,type AnalysisLevel} from './engine-settings';
export type Evaluation={cp?:number;mate?:number;depth:number;pv:string;san?:string;targetDepth?:number;elapsedMs?:number;complete?:boolean};
export type SearchResult={move:string;evaluation:Evaluation;lines:(Evaluation & {rank:number})[]};
export class SearchCancelled extends Error {constructor(){super('Cálculo cancelado');this.name='SearchCancelled';}}
/** A cancelled UCI search must finish before the next position is sent. */
export class Engine {
 worker!:Worker;ready!:Promise<void>;busy=false;onIdle?:()=>void;
 private source?:string;private blobUrl?:string;private dead=false;private generation=0;
 private active:{line:(text:string)=>void;cancel:()=>void;fail:(error:Error)=>void}|null=null;
 private drain:Promise<void>=Promise.resolve();
 constructor(source?:string){this.source=source;this.start();}
 private start(){
  if(this.source&&!this.blobUrl)this.blobUrl=URL.createObjectURL(new Blob([this.source],{type:'text/javascript'}));
  this.worker=new Worker(this.blobUrl||new URL('engine/stockfish.js',document.baseURI).href);
  this.ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Stockfish no pudo iniciarse. Recarga el tablero.')),25000);
   this.worker.onerror=()=>{clearTimeout(timer);const error=Error('Stockfish no está disponible en este navegador. Recarga el tablero.');reject(error);this.active?.fail(error);};
   this.worker.onmessage=e=>{for(const raw of String(e.data).split(/\r?\n/)){const line=raw.trim();if(line==='uciok'){this.worker.postMessage('setoption name Hash value 32');this.worker.postMessage('isready');}if(line==='readyok'){clearTimeout(timer);resolve();}this.active?.line(line);}};
   this.worker.postMessage('uci');
  });
 }
 async search(fen:string,level:number,analyze=false,quick=false,quality:AnalysisLevel='balanced',searchMoves?:string[],allCandidates=false):Promise<SearchResult>{
  const generation=this.generation;await this.ready;await this.drain;
  if(this.dead||generation!==this.generation)throw new SearchCancelled();
  if(this.busy)throw Error('Stockfish ya está calculando');
  const position=new Chess(fen);if(position.isGameOver())throw Error('La posición ha terminado; no hay jugada que sugerir.');
  const config=ANALYSIS_LEVELS[quality],started=Date.now();
  const allowed=searchMoves?.length?new Set(searchMoves):null;
  const variations=analyze?(quick?1:Math.min(allCandidates?256:3,allowed?.size??position.moves().length)):1;
  this.busy=true;let release!:()=>void;this.drain=new Promise(resolve=>{release=resolve;});
  return new Promise((resolve,reject)=>{
   let cancelled=false,settled=false,retried=false;let info:Evaluation={depth:0,pv:''};const lines=new Map<number,Evaluation & {rank:number}>();const iterations=new Map<number,Map<number,Evaluation & {rank:number}>>();
   const finish=()=>{clearTimeout(timer);this.active=null;this.busy=false;release();this.onIdle?.();};
   const fail=(error:Error)=>{if(!settled){settled=true;reject(error);}finish();};
   const timer=setTimeout(()=>{this.worker.terminate();fail(Error('Stockfish no respondió. Se ha reiniciado el motor; vuelve a intentarlo.'));if(!this.dead)this.start();},config.time+15000);
   this.active={cancel:()=>{cancelled=true;if(!settled){settled=true;reject(new SearchCancelled());}this.worker.postMessage('stop');},fail,
    line:line=>{
     if(!cancelled&&line.startsWith('info ')&&line.includes(' pv ')){
      const d=line.match(/\bdepth (\d+)/),s=line.match(/\bscore (cp|mate) (-?\d+)/),rank=Number(line.match(/\bmultipv (\d+)/)?.[1]||1);
      if(d&&s&&!/lowerbound|upperbound/.test(line)){const entry={rank,depth:Number(d[1]),pv:line.split(' pv ')[1],...(s[1]==='cp'?{cp:Number(s[2])}:{mate:Number(s[2])})} as any;lines.set(rank,entry);let iteration=iterations.get(entry.depth);if(!iteration){iteration=new Map();iterations.set(entry.depth,iteration);}iteration.set(rank,entry);if(rank===1)info=entry;}
     }
     if(!line.startsWith('bestmove '))return;
     if(cancelled){finish();return;}
     if(analyze&&info.depth<1&&!retried){retried=true;this.worker.postMessage('position fen '+fen);this.worker.postMessage('go depth 8 movetime '+config.time+(allowed?' searchmoves '+[...allowed].join(' '):''));return;}
     const bestMove=line.split(/\s+/)[1];
     if(analyze){const completed=[...iterations.entries()].filter(([,rows])=>rows.size>=variations&&Array.from({length:variations},(_,i)=>rows.has(i+1)).every(Boolean)).sort((a,b)=>b[0]-a[0])[0];if(!completed){fail(Error('No se completó ninguna profundidad de análisis. Reintenta o elige un análisis más largo.'));return;}lines.clear();for(const [rank,entry] of completed[1])lines.set(rank,entry);info=lines.get(1)!;}
     const move=analyze?info.pv.split(/\s+/)[0]:bestMove;
     const decorate=(entry:Evaluation)=>({...entry,targetDepth:config.depth,elapsedMs:Date.now()-started,complete:entry.depth>=config.depth});
     try{if(allowed&&!allowed.has(move))throw Error('Stockfish devolvió una jugada fuera de los destinos solicitados');new Chess(fen).move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]});if(analyze&&info.depth<1)throw Error('Stockfish no devolvió una valoración. Reintenta el análisis.');
      if(!settled){settled=true;resolve({move,evaluation:decorate(info),lines:[...lines.values()].sort((a,b)=>a.rank-b.rank).map(entry=>({...decorate(entry),rank:entry.rank}))});}finish();
     }catch(e){fail(e instanceof Error?e:Error('Stockfish devolvió una jugada no válida'));}
    }};
   this.worker.postMessage('setoption name UCI_LimitStrength value false');
   this.worker.postMessage('setoption name Skill Level value '+(analyze?20:Math.max(0,Math.min(20,level))));
   this.worker.postMessage('setoption name MultiPV value '+variations);
   this.worker.postMessage('position fen '+fen);
   this.worker.postMessage((analyze?'go depth '+config.depth+' movetime '+config.time:'go movetime '+Math.round(200+level*35))+(allowed?' searchmoves '+[...allowed].join(' '):''));
  });
 }
 stop(){this.generation++;this.active?.cancel();}
 destroy(){this.dead=true;this.stop();this.active?.fail(new SearchCancelled());this.worker.terminate();if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);}
}
