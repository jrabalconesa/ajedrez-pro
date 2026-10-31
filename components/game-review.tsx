'use client';
import {Chess} from 'chess.js';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Engine,SearchCancelled,type SearchResult} from '../lib/engine';
import {reviewPositions,reviewEntry,type ReviewEntry} from '../lib/review';
import {spanishSan} from '../lib/coach';
import {ANALYSIS_LEVELS,type AnalysisLevel} from '../lib/engine-settings';
type Props={game:any;engineSource?:string;quality:AnalysisLevel;onPosition:(p:any)=>void;onClose:()=>void;onTry:(cursor:number)=>void;busy:boolean;onSaveError?:(fen:string,line:string,explanation:string)=>Promise<void>};
export default function GameReview({game,engineSource,quality,onPosition,onClose,onTry,busy,onSaveError}:Props){
 const positions=useMemo(()=>reviewPositions(game.initialFen,game.history),[game]);
 const [cursor,setCursor]=useState(0),[entries,setEntries]=useState<Record<number,ReviewEntry>>({}),[done,setDone]=useState(0),[status,setStatus]=useState('Preparando Stockfish…'),[failure,setFailure]=useState(''),[attempt,setAttempt]=useState(0),[playing,setPlaying]=useState(false),[important,setImportant]=useState(false),[delay,setDelay]=useState(1800);
 const callback=useRef(onPosition);callback.current=onPosition;
 const [saveNotice,setSaveNotice]=useState('');
 const total=positions.length-1,entry=entries[cursor];
 useEffect(()=>{callback.current({...positions[cursor],cursor,moves:positions.slice(1,cursor+1)});},[cursor,positions]);
 useEffect(()=>{
  let alive=true;const engine=new Engine(engineSource),cache=new Map<string,SearchResult>();setEntries({});setDone(0);setFailure('');setStatus('Analizando momentos de la partida…');setPlaying(false);
  async function evaluation(fen:string){let r=cache.get(fen);if(!r){r=await engine.search(fen,20,true,true,quality);cache.set(fen,r);}return r;}
  void (async()=>{try{for(let i=1;i<=total;i++){
   const before=await evaluation(positions[i-1].fen);if(!alive)return;
   const c=new Chess(positions[i].fen);const after=c.isGameOver()?null:await evaluation(c.fen());if(!alive)return;
   const item=reviewEntry(positions[i-1].fen,positions[i].san,before,after);setEntries(old=>({...old,[i]:item}));setDone(i);
  }if(alive)setStatus('Revisión completa.');}catch(e){if(alive&&!(e instanceof SearchCancelled)){setFailure((e as Error).message);setStatus('Análisis interrumpido; las jugadas pendientes siguen sin calificar.');}}})();
  return()=>{alive=false;engine.destroy();};
 },[positions,total,engineSource,quality,attempt]);
 useEffect(()=>{if(!playing)return;if(cursor>=total){setPlaying(false);return;}
  // Wait for analysis: never skip a moment whose quality is still unknown.
  const next=important?Array.from({length:total-cursor},(_,i)=>cursor+i+1).find(i=>!entries[i]||entries[i].highlight):cursor+1;
  if(next===undefined){setPlaying(false);return;}if(!entries[next])return;
  const timer=setTimeout(()=>{setCursor(next);if(entries[next].highlight)setPlaying(false);},delay);return()=>clearTimeout(timer);
 },[playing,cursor,total,entries,important,delay]);
 function seek(n:number){setPlaying(false);setCursor(Math.max(0,Math.min(total,n)));}
 const counted=Object.values(entries).filter(e=>e.color===(game.playerColor||'w')),errors=counted.filter(e=>e.grade==='bad'),improvements=counted.filter(e=>e.grade==='ok'),good=counted.filter(e=>e.grade==='good');
 return <section className="game-review" aria-label="Revisión de partida"><div className="card-top"><b>Revisar partida</b><button className="text-button" onClick={onClose}>Cerrar revisión</button></div><p className="micro" role="status">{status} {done}/{total} medias jugadas · {ANALYSIS_LEVELS[quality].label}</p><div className="review-controls"><button onClick={()=>seek(0)} aria-label="Inicio de revisión">⇤</button><button disabled={cursor===0} onClick={()=>seek(cursor-1)} aria-label="Anterior en revisión">←</button><button disabled={cursor===total} onClick={()=>setPlaying(!playing)}>{playing?'Pausar':'Reproducir'}</button><button disabled={cursor===total} onClick={()=>seek(cursor+1)} aria-label="Siguiente en revisión">→</button><button onClick={()=>seek(total)} aria-label="Final de revisión">⇥</button><span>{cursor}/{total}</span></div><div className="review-options"><label>Recorrido <select value={important?'important':'all'} onChange={e=>{setPlaying(false);setImportant(e.target.value==='important');}}><option value="all">Todos los movimientos</option><option value="important">Solo momentos importantes</option></select></label><label>Velocidad <select value={delay} onChange={e=>setDelay(+e.target.value)}><option value={3000}>Lenta</option><option value={1800}>Media</option><option value={800}>Rápida</option></select></label></div>
 <div className={'move-feedback move-feedback-'+(entry?.grade||'neutral')} aria-live="polite"><p>{cursor===0?'Posición inicial. Pulsa Reproducir para recorrer la partida.':entry?<><b>{spanishSan(positions[cursor].san)} · {entry.grade==='bad'?'Error':entry.grade==='ok'?'Mejorable':entry.highlight?'Buena jugada destacada':'Buena jugada'}</b><br/>{entry.message}</>:'Jugada pendiente de análisis; aún no tiene valoración.'}</p>{entry&&<details><summary>Continuaciones verificadas · profundidad {entry.depth}</summary><p>Alternativa desde la posición anterior: {entry.alternative}</p>{entry.reply&&<p>Respuesta tras la jugada realizada: {entry.reply}</p>}<small>{entry.limited?'Resultado limitado por tiempo; puedes contrastarlo con Profundo.':'Profundidad objetivo alcanzada.'} Las explicaciones describen hechos del tablero y comparan el análisis; no son razonamientos internos del motor.</small></details>}</div>
 {playing&&(!entries[cursor+1])&&cursor<total&&<p className="micro" role="status">Esperando el análisis del siguiente momento…</p>}
 <div className="button-row">{onSaveError&&entry&&entry.grade!=='good'&&<button disabled={busy} onClick={async()=>{try{await onSaveError(positions[cursor-1].fen,entry.alternative,entry.message);setSaveNotice('Posición añadida a Mi entrenamiento · cuaderno de errores.');}catch(e){setSaveNotice((e as Error).message);}}}>Guardar como ejercicio AIA</button>}<span role="status">{saveNotice}</span><button className="secondary" disabled={busy||cursor===0} onClick={()=>{setPlaying(false);onTry(cursor-1);}}>Probar alternativa a esta jugada</button>{failure&&<button onClick={()=>setAttempt(n=>n+1)}>Reintentar análisis</button>}</div>{failure&&<p role="alert">{failure}</p>}
 {done===total&&<details><summary>Balance de tus decisiones</summary><p>{good.length} buenas · {improvements.length} mejorables · {errors.length} errores.</p><ul>{errors.length>0&&<li>Antes de mover, comprueba capturas y la respuesta rival.</li>}{improvements.length>0&&<li>Compara dos candidatas y su continuación antes de decidir.</li>}<li>Repite los momentos destacados y explica qué consigue cada jugada.</li></ul></details>}
 <details><summary>Ir a una jugada</summary><div className="review-moves">{positions.slice(1).map((p,i)=><button key={i} className={(cursor===i+1?'active-move ':'')+(entries[i+1]?'review-'+entries[i+1].grade:'')} onClick={()=>seek(i+1)}>{Math.floor(i/2)+1}{i%2?'…':'.'} {spanishSan(p.san)}{entries[i+1]?.highlight?' •':''}</button>)}</div></details><p className="micro">La reproducción se pausa en errores, jugadas mejorables y buenas jugadas destacadas. La partida original se conserva.</p></section>;
}
