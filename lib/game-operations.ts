import {gameId} from './game-id';
import {fresh,mutate,type Game} from './chess-state';
export function transitionGame(g:Game,action:string,a:any={}) : {active:Game;archived?:Game;created:boolean}{
 if(a.revision!==undefined&&a.revision!==g.revision)throw Error('La partida ha cambiado. Actualiza el tablero antes de continuar.');
 const stamp=(game:Game)=>({...game,revision:game.revision+1,updatedAt:new Date().toISOString()});
 if(action==='resign_and_new'){const archived=stamp(mutate(g,'resign',{})),active=fresh(g.difficulty,undefined,g.playerColor);active.coachLevel=g.coachLevel;return {active,archived,created:true};}
 if(action==='fork'||action==='branch_move'){
  if(action==='branch_move'&&g.cursor===g.history.length)throw Error('La partida ya está en la posición final.');
  let active:Game={...g,id:gameId(),parentId:g.id,title:(g.title+' · variante').slice(0,100),training:g.training?{...g.training,eligible:false,assisted:true}:undefined,history:g.history.slice(0,g.cursor),revision:0,resigned:false,resignedColor:undefined,importedResult:undefined,analysis:undefined,analysisRequested:false,mode:a.continueWithEngine?'play':'study',updatedAt:new Date().toISOString()};
  if(action==='branch_move')active=stamp(mutate(active,'move',{move:a.move}));
  return {active,created:true};
 }
 let active=mutate(g,action,a);if(action==='move'&&typeof a.continueWithEngine==='boolean')active.mode=a.continueWithEngine?'play':'study';
 return {active:stamp(active),created:false};
}
