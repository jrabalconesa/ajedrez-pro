import {playerColor,validatePlayerColor,type PlayerColor} from './player-side';
import {gameId} from './game-id';
import { Chess } from 'chess.js';
import {normalizeAnalysis} from './analysis';
import { resolveMove } from './move-input';
export type Game = {training?:{profileId:string;assisted:boolean;eligible:boolean;adaptive:boolean;level:number};playerColor?:PlayerColor;resignedColor?:PlayerColor;id:string; title:string; initialFen:string; history:string[]; cursor:number; difficulty:number; mode:'play'|'study'; revision:number; updatedAt:string; resigned?:boolean; importedResult?:string; analysisRequested?:boolean; coachLevel?:string; analysis?:{fen:string;cp?:number;mate?:number;pv:string;depth:number;lines?:any[]}; parentId?:string};
export function board(g:Game){ const c=new Chess(g.initialFen); for(const m of g.history.slice(0,g.cursor)) c.move(m); return c; }
export function outcome(g:Game,c=board(g)){
 if(g.resigned&&g.cursor===g.history.length)return {result:(g.resignedColor||playerColor(g))==='w'?'0-1':'1-0',reason:'resignation'};
 if(c.isCheckmate())return {result:c.turn()==='w'?'0-1':'1-0',reason:'checkmate'};
 if(c.isStalemate())return {result:'1/2-1/2',reason:'stalemate'};
 if(c.isThreefoldRepetition())return {result:'1/2-1/2',reason:'threefold_repetition'};
 if(c.isInsufficientMaterial())return {result:'1/2-1/2',reason:'insufficient_material'};
 if(c.isDrawByFiftyMoves())return {result:'1/2-1/2',reason:'fifty_move_rule'};
 if(g.importedResult&&g.cursor===g.history.length)return {result:g.importedResult,reason:'imported_result'};
 return null;
}
export function view(g:Game){ const c=board(g); const end=outcome(g,c); return {...g,playerColor:playerColor(g),fen:c.fen(),pgn:pgn(g),fullPgn:pgn({...g,cursor:g.history.length}),moves:c.history({verbose:true}).map(m=>({san:m.san,from:m.from,to:m.to,promotion:m.promotion,color:m.color})),turn:c.turn(),inCheck:c.isCheck(),outcome:end,phase:end?'finished':g.mode==='play'&&c.turn()!==playerColor(g)?'engine_pending':'active',legalMoves:c.moves(),coachContext:{fen:c.fen(),lastMove:c.history({verbose:true}).at(-1)?.san,level:g.coachLevel||'intermedio',evaluationPerspective:'white',engineLocation:'browser-worker',analysisStatus:g.analysis?.fen===c.fen()?'ready':g.analysisRequested?'pending':'missing',guidance:'Explicar amenazas, piezas sin defender, centro, peones, columnas y seguridad del rey. Proponer un plan de 2–3 jugadas; verificar variantes. No atribuir análisis humano a Stockfish.'},analysis:g.analysis?.fen===c.fen()?g.analysis:undefined}; }
export function pgn(g:Game){const c=board(g);c.header('Event',g.title,'White',playerColor(g)==='w'?'Jose':g.mode==='play'?'Stockfish 19':'Estudio','Black',playerColor(g)==='b'?'Jose':g.mode==='play'?'Stockfish 19':'Estudio','Result',outcome(g,c)?.result??'*');return c.pgn();}
export function fresh(difficulty=6,fen?:string,side?:PlayerColor):Game{ const c=new Chess(fen);return {playerColor:validatePlayerColor(side),id:gameId(),title:'Partida de entrenamiento',initialFen:c.fen(),history:[],cursor:0,difficulty,mode:'play',revision:0,updatedAt:new Date().toISOString()};}
export function mutate(g:Game,action:string,a:any){const c=board(g);g={...g};
 if(action==='move') {if(outcome(g,c))throw Error('La partida ha terminado. Crea una variante para continuar.'); if(g.cursor!==g.history.length)throw Error('Crea una variante antes de jugar desde una posición anterior.');const m=c.move(resolveMove(c,a.move));if(!m)throw Error('Jugada ilegal');if(a.trainingAssisted===true&&g.training)g.training={...g.training,assisted:true};g.history=[...g.history,m.san];g.cursor++;g.analysis=undefined;g.analysisRequested=false;}
 else if(action==='seek'){if(g.training)g.training={...g.training,assisted:true};if(!Number.isInteger(a.cursor)||a.cursor<0||a.cursor>g.history.length)throw Error('Posición fuera del historial');g.cursor=a.cursor;g.mode='study';g.analysis=undefined;g.analysisRequested=false;}
 else if(action==='mode'){if(g.training&&a.mode==='study')g.training={...g.training,assisted:true};if(!['study','play'].includes(a.mode))throw Error('Modo no válido');if(g.cursor<g.history.length&&a.mode==='play')throw Error('Crea primero una variante');g.mode=a.mode;}
 else if(action==='resign'){if(g.resigned||outcome(g,c))throw Error('Partida ya finalizada');g.resigned=true;g.resignedColor=playerColor(g);}
 else if(action==='request_analysis'){if(g.training)g.training={...g.training,assisted:true};g.analysisRequested=true;}
 else if(action==='settings'){if(a.trainingAssisted===true&&g.training)g.training={...g.training,assisted:true};if(g.training&&((a.difficulty!==undefined&&a.difficulty!==g.difficulty)||(a.playerColor!==undefined&&a.playerColor!==playerColor(g))))g.training={...g.training,eligible:false};if(a.playerColor!==undefined)g.playerColor=validatePlayerColor(a.playerColor);if(a.coachLevel!==undefined){if(!['iniciacion','intermedio','avanzado'].includes(a.coachLevel))throw Error('Nivel de explicación no válido');g.coachLevel=a.coachLevel;}if(a.difficulty!==undefined){if(!Number.isInteger(a.difficulty)||a.difficulty<0||a.difficulty>20)throw Error('Nivel entre 0 y 20');g.difficulty=a.difficulty;}if(a.title!==undefined)g.title=String(a.title).trim().slice(0,100)||g.title;}
 else if(action==='analysis'){if(g.training)g.training={...g.training,assisted:true};if(a.fen!==c.fen())throw Error('El análisis corresponde a otra posición');if(!Number.isInteger(a.depth)||a.depth<1||a.depth>100)throw Error('Análisis no válido');g.analysis=normalizeAnalysis(c.fen(),a);g.analysisRequested=false;}
 else throw Error('Acción no admitida');return g;
}
export function fromPgn(text:string,difficulty=6,side?:PlayerColor){if(text.length>100000)throw Error('PGN demasiado grande');const c=new Chess();c.loadPgn(text);const g=fresh(difficulty,c.getHeaders().FEN,side);g.history=c.history();g.cursor=g.history.length;g.mode='study';g.title=c.getHeaders().Event||'Partida importada';const result=c.getHeaders().Result;if(['1-0','0-1','1/2-1/2'].includes(result))g.importedResult=result;return g;}
