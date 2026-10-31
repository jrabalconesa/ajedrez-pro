import {makeChessBackup,mergeChessBackup,validateChessBackup} from './backup';
import {freshAia} from './aia';
import {attachTraining} from './training';
import {localAia} from './aia';
import {fresh,fromPgn,view,type Game} from './chess-state';
import {transitionGame} from './game-operations';
const key='ajedrez-pro:games:v1';
type Store={active?:string;games:Record<string,Game>};
export function localExecute(storage:Pick<Storage,'getItem'|'setItem'>,action:string,a:any={}){
 if(action==='backup_export'||action==='backup_import'){
  const gamesRaw=storage.getItem(key),aiaRaw=storage.getItem('ajedrez-pro:aia:v1');
  const games=JSON.parse(gamesRaw||'{"games":{}}'),aia=aiaRaw?JSON.parse(aiaRaw):freshAia();
  if(action==='backup_export')return makeChessBackup(Object.values(games.games),aia);
  const merged=mergeChessBackup(games.games,aia,validateChessBackup(a.backup));
  try{storage.setItem(key,JSON.stringify({...games,games:merged.games}));storage.setItem('ajedrez-pro:aia:v1',JSON.stringify(merged.aia));}
  catch(e){try{if(gamesRaw)storage.setItem(key,gamesRaw);if(aiaRaw)storage.setItem('ajedrez-pro:aia:v1',aiaRaw);}catch{}throw e;}
  return {ok:true,notice:`Copia combinada: ${merged.added} partidas añadidas; perfiles e historial AIA combinados. Recarga para verlos.`};
 }
 if(action==='aia'){if(a.op==='training_result'){const games=JSON.parse(storage.getItem(key)||'{"games":{}}');const game=games.games[a.gameId];if(!game)throw Error('Partida no encontrada');return localAia(storage,a.op,{...a,game});}return localAia(storage,a.op||'get',a);}
 const raw=storage.getItem(key);let state:Store;
 try{state=raw?JSON.parse(raw):{games:{}};if(!state.games||typeof state.games!=='object')throw Error();}catch{throw Error('No se pueden leer las partidas guardadas en este navegador. Conserva sus datos antes de volver a intentarlo.');}
 if(action==='list')return {games:Object.values(state.games).map(g=>({id:g.id,title:g.title,updatedAt:g.updatedAt})).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))};
 if(action==='new'||action==='import'){
  if(a.difficulty!==undefined&&(!Number.isInteger(a.difficulty)||a.difficulty<0||a.difficulty>20))throw Error('Nivel entre 0 y 20');
  let game=action==='new'?fresh(a.difficulty,a.fen,a.playerColor):fromPgn(String(a.pgn||''),a.difficulty,a.playerColor);if(a.fen)game.mode='study';if(action==='new'&&!a.fen&&a.useTraining){const profile=localAia(storage,'get');game=attachTraining(game,profile.active,profile.training);}if(a.title)game.title=String(a.title).slice(0,100);state.games[game.id]=game;state.active=game.id;
 }else{
  const id=a.id||state.active,g=state.games[id];if(!g){if(action==='get'&&!id)return {empty:true};throw Error('Partida no encontrada');}
  if(action==='get')return view(g);
  if(action==='open')state.active=id;
  else{const change=transitionGame(g,action,a);if(change.archived)state.games[g.id]=change.archived;state.games[change.active.id]=change.active;state.active=change.active.id;}
 }
 try{storage.setItem(key,JSON.stringify(state));}catch{throw Error('No se pudo guardar. El navegador tiene el almacenamiento bloqueado o lleno.');}
 return view(state.games[state.active!]);
}
