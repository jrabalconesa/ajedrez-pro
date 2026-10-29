import {attachTraining,freshTraining} from './training';
import {freshAia,transitionAia,aiaView,type AiaStore} from './aia';
import {transitionGame} from './game-operations';
import { env } from 'cloudflare:workers';
import { fresh, view, mutate, board, fromPgn, type Game } from './chess-state';
async function prefix(user:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user));return 'chess/'+Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')+'/';}
function bucket(){return (env as any).BUCKET as R2Bucket;}
export async function execute(user:string,action:string,a:any={}){const root=await prefix(user);const b=bucket();
 if(action==='aia'){
 const key=root+'aia.json',obj=await b.get(key);const state=obj?await obj.json<AiaStore>():freshAia();
 let args=a;if(a.op==='training_result'){if(typeof a.gameId!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(a.gameId))throw Error('Identificador no válido');const stored=await b.get(root+'games/'+a.gameId+'.json');if(!stored)throw Error('Partida no encontrada');args={...a,game:await stored.json()};}const next=transitionAia(state,a.op||'get',args);
 if(a.op&&a.op!=='get'){const saved=await b.put(key,JSON.stringify(next),{onlyIf:obj?{etagMatches:obj.etag}:{etagDoesNotMatch:'*'}});if(!saved)throw Error('AIA ha cambiado en otra ventana. Actualiza para continuar.');}
 return aiaView(next);
 }
 if(action==='list'){const games:{id:string;title:string;updatedAt:string}[]=[];let cursor:string|undefined;do{const page=await b.list({prefix:root+'games/',limit:100,cursor});games.push(...page.objects.map(o=>({id:o.key.split('/').pop()!.replace('.json',''),title:o.customMetadata?.title||'Partida',updatedAt:o.uploaded.toISOString()})));cursor=page.truncated?page.cursor:undefined;}while(cursor);return {games:games.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))};}
 if(action==='new'||action==='import'){
  if(a.difficulty!==undefined&&(!Number.isInteger(a.difficulty)||a.difficulty<0||a.difficulty>20))throw Error('Nivel entre 0 y 20');
  let g=action==='import'?fromPgn(String(a.pgn||''),a.difficulty,a.playerColor):fresh(a.difficulty,a.fen,a.playerColor);if(a.fen)g.mode='study';if(action==='new'&&!a.fen&&a.useTraining){const stored=await b.get(root+'aia.json');const state=stored?await stored.json<AiaStore>():freshAia();const profile=state.profiles.find(p=>p.id===state.active)!;g=attachTraining(g,profile.id,profile.training||freshTraining());}if(a.title)g.title=String(a.title).slice(0,100);await b.put(root+'games/'+g.id+'.json',JSON.stringify(g),{customMetadata:{title:g.title}});await b.put(root+'active',g.id);return view(g);
 }
 let id=a.id;if(!id){const active=await b.get(root+'active');id=active?await active.text():null;}
 if(!id){if(action==='get')return {empty:true};throw Error('No hay partida activa');}
 if(typeof id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(id))throw Error('Identificador no válido');
 const key=root+'games/'+id+'.json';const obj=await b.get(key);if(!obj)throw Error('Partida no encontrada');let g:Game=await obj.json();
 if(action==='get')return view(g);
 if(action==='open'){await b.put(root+'active',id);return view(g);}
 const change=transitionGame(g,action,a);
 if(change.archived){const saved=await b.put(key,JSON.stringify(change.archived),{onlyIf:{etagMatches:obj.etag},customMetadata:{title:change.archived.title}});if(!saved)throw Error('Conflicto de cambios. Actualiza el tablero.');}
 g=change.active;const saved=await b.put(root+'games/'+g.id+'.json',JSON.stringify(g),{...(!change.created?{onlyIf:{etagMatches:obj.etag}}:{}),customMetadata:{title:g.title}});if(!saved)throw Error('Conflicto de cambios. Actualiza el tablero.');await b.put(root+'active',g.id);return view(g);
}
