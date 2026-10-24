import {Chess} from 'chess.js';
export type Evaluation={cp?:number;mate?:number;depth:number;pv:string;san?:string};
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
 async search(fen:string,level:number,analyze=false,quick=false):Promise<SearchResult>{
  const generation=this.generation;await this.ready;await this.drain;
  if(this.dead||generation!==this.generation)throw new SearchCancelled();
  if(this.busy)throw Error('Stockfish ya está calculando');
  const position=new Chess(fen);if(position.isGameOver())throw Error('La posición ha terminado; no hay jugada que sugerir.');
  this.busy=true;let release!:()=>void;this.drain=new Promise(resolve=>{release=resolve;});
  return new Promise((resolve,reject)=>{
   let cancelled=false,settled=false,retried=false;let info:Evaluation={depth:0,pv:''};const lines=new Map<number,Evaluation & {rank:number}>();
   const finish=()=>{clearTimeout(timer);this.active=null;this.busy=false;release();this.onIdle?.();};
   const fail=(error:Error)=>{if(!settled){settled=true;reject(error);}finish();};
   const timer=setTimeout(()=>{this.worker.terminate();fail(Error('Stockfish no respondió. Se ha reiniciado el motor; vuelve a intentarlo.'));if(!this.dead)this.start();},10000);
   this.active={cancel:()=>{cancelled=true;if(!settled){settled=true;reject(new SearchCancelled());}this.worker.postMessage('stop');},fail,
    line:line=>{
     if(!cancelled&&line.startsWith('info ')&&line.includes(' pv ')){
      const d=line.match(/\bdepth (\d+)/),s=line.match(/\bscore (cp|mate) (-?\d+)/),rank=Number(line.match(/\bmultipv (\d+)/)?.[1]||1);
      if(d&&s&&!/lowerbound|upperbound/.test(line)){const entry={rank,depth:Number(d[1]),pv:line.split(' pv ')[1],...(s[1]==='cp'?{cp:Number(s[2])}:{mate:Number(s[2])})} as any;lines.set(rank,entry);if(rank===1)info=entry;}
     }
     if(!line.startsWith('bestmove '))return;
     if(cancelled){finish();return;}
     if(analyze&&info.depth<1&&!retried){retried=true;this.worker.postMessage('position fen '+fen);this.worker.postMessage('go depth 8');return;}
     const move=line.split(/\s+/)[1];
     try{new Chess(fen).move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]});if(analyze&&info.depth<1)throw Error('Stockfish no devolvió una valoración. Reintenta el análisis.');
      if(!settled){settled=true;resolve({move,evaluation:info,lines:[...lines.values()].sort((a,b)=>a.rank-b.rank)});}finish();
     }catch(e){fail(e instanceof Error?e:Error('Stockfish devolvió una jugada no válida'));}
    }};
   this.worker.postMessage('setoption name Skill Level value '+(analyze?20:Math.max(0,Math.min(20,level))));
   this.worker.postMessage('setoption name MultiPV value '+(analyze&&!quick?3:1));
   this.worker.postMessage('position fen '+fen);
   this.worker.postMessage('go movetime '+(analyze?(quick?350:900):Math.round(120+level*25)));
  });
 }
 stop(){this.generation++;this.active?.cancel();}
 destroy(){this.dead=true;this.stop();this.active?.fail(new SearchCancelled());this.worker.terminate();if(this.blobUrl)URL.revokeObjectURL(this.blobUrl);}
}
