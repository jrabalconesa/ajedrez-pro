import {Chess} from 'chess.js';
import {CATALOG,TRACKS,LEVELS,exercise,type Track,type Exercise} from './aia-curriculum';
import {spanishSan} from './coach';
import {resolveMove} from './move-input';
export type Attempt={id:string;date:number;exerciseId:string;track:Track;level:number;success:boolean;assisted:boolean;answer:string;fen?:string;reason:string;sessionId:string};
type Review={exerciseId:string;due:number;interval:number;failures:number;resolved:number};
export type Profile={id:string;name:string;seed:number;minutes:number;focus:'auto'|Track;attempts:Attempt[];reviews:Review[];session:Session|null;completed:{date:number;total:number;correct:number;independent:number}[]};
export type Session={id:string;started:number;ids:string[];index:number;step:number;path:string[];hints:number;mistakes:number;assisted:boolean;done:boolean;revealed:boolean;results:{exerciseId:string;independent:boolean;success:boolean}[];feedback:{kind:string;text:string};reason:string};
export type AiaStore={revision:number;active:string;profiles:Profile[]};
const DAY=86400000,INTERVALS=[1,3,7,14,30];
const tracks=Object.keys(TRACKS) as Track[];
export function freshAia():AiaStore{return {revision:0,active:'jose',profiles:[{id:'jose',name:'Jose',seed:1,minutes:15,focus:'auto',attempts:[],reviews:[],session:null,completed:[]}]};}
export function activeProfile(s:AiaStore){const p=s.profiles.find(p=>p.id===s.active);if(!p)throw Error('Perfil no encontrado');return p;}
function day(t:number){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid'}).format(t);}
export function mastery(p:Profile,track:Track,level:number){const rows=p.attempts.filter(a=>a.track===track&&a.level===level);const independent=rows.filter(a=>a.success&&!a.assisted),recent=rows.slice(-6),last=rows.slice(-3);return {attempts:rows.length,good:independent.length,days:new Set(independent.map(a=>day(a.date))).size,variants:new Set(independent.map(a=>a.exerciseId)).size,ready:last.length===3&&last.every(a=>a.success&&!a.assisted)&&new Set(independent.map(a=>day(a.date))).size>=2&&new Set(independent.map(a=>a.exerciseId)).size>=2,accuracy:recent.length?Math.round(recent.filter(a=>a.success&&!a.assisted).length/recent.length*100):null};}
export function trackLevel(p:Profile,t:Track){let level=p.seed;while(level<6&&mastery(p,t,level).ready)level++;return level;}
export function buildPlan(p:Profile,now=Date.now()){
 const due=p.reviews.filter(r=>r.due<=now).sort((a,b)=>a.due-b.due);
 const count=p.minutes>=30?8:4,ids:string[]=[];
 const dueIds=new Set(due.map(r=>r.exerciseId));
 for(const r of due.slice(0,Math.max(1,Math.floor(count/2))))if(!ids.includes(r.exerciseId))ids.push(r.exerciseId);
 const ordered=p.focus==='auto'?tracks:[p.focus,...tracks.filter(t=>t!==p.focus)];
 const candidates=new Map<Track,Exercise[]>();
 for(const t of ordered){
  let level=trackLevel(p,t);
  const last=p.attempts.filter(a=>a.track===t).slice(-2);
  if(last.length===2&&last.every(a=>!a.success)&&level>0)level--;
  const lastSeen=(id:string)=>p.attempts.filter(a=>a.exerciseId===id).at(-1)?.date||0;
  candidates.set(t,CATALOG.filter(e=>e.track===t&&e.level===level).sort((a,b)=>lastSeen(a.id)-lastSeen(b.id)));
 }
 // Repartir los ejercicios por áreas: en sesiones largas, una segunda vuelta
 // es preferible a concentrar los ocho ejercicios en la primera área.
 for(let round=0;round<count&&ids.length<count;round++){
  for(const t of ordered){
   const next=candidates.get(t)?.find(e=>!ids.includes(e.id));
   if(next&&ids.length<count)ids.push(next.id);
  }
 }
 // El catálogo inicial solo es un recurso adicional si falta contenido.
 for(const e of CATALOG.filter(e=>e.level===p.seed))if(ids.length<count&&!ids.includes(e.id))ids.push(e.id);
 const simplified=ordered.some(t=>{const a=p.attempts.filter(a=>a.track===t).slice(-2);return a.length===2&&a.every(a=>!a.success);});
 const items=ids.map(id=>({id,kind:dueIds.has(id)?'repaso':p.attempts.some(a=>a.exerciseId===id)?'refuerzo':'nuevo'}));
 const newCount=items.filter(i=>i.kind==='nuevo').length;
 const reason=due.length?'Hay repasos espaciados pendientes. Se indican por separado para que sepas por qué vuelven ejercicios conocidos.':simplified?'Las últimas dificultades aconsejan reforzar bases de esa habilidad antes de avanzar.':!p.attempts.length?'Primera sesión de comprobación: tu nivel inicial es orientativo y no acredita habilidades.':newCount?'Priorizamos variantes nuevas de cada área para seguir avanzando sin repetir la sesión anterior.':'Ya has practicado las variantes disponibles para esta etapa; hoy toca refuerzo. Ampliaremos el catálogo progresivamente.';
 return {ids,items,reason,due:due.length};
}
export function sessionFen(e:Exercise,s:Session){if(!e.fen)return null;const c=new Chess(e.fen);for(const m of s.path)c.move(m);return c.fen();}
function result(p:Profile,s:Session,e:Exercise,success:boolean,answer:string,now:number,fen?:string){
 const independent=success&&!s.assisted&&s.mistakes===0&&s.hints===0;
 p.attempts.push({id:crypto.randomUUID(),date:now,exerciseId:e.id,track:e.track,level:e.level,success,assisted:!independent,answer:answer.slice(0,100),fen,reason:s.feedback.text,sessionId:s.id});
 let r=p.reviews.find(x=>x.exerciseId===e.id);
 if(!r){r={exerciseId:e.id,due:now+DAY,interval:-1,failures:0,resolved:0};p.reviews.push(r);}
 if(!success||!independent){if(!success)r.failures++;r.interval=0;r.due=now+DAY;}
 else{r.resolved++;r.interval=Math.min(r.interval+1,INTERVALS.length-1);r.due=now+INTERVALS[r.interval]*DAY;}
 if(success){s.done=true;s.results.push({exerciseId:e.id,success:true,independent});}
}
export function transitionAia(input:AiaStore,action:string,a:any={},now=Date.now()):AiaStore{
 const state=structuredClone(input);
 if(action==='get')return state;
 if(a.revision!==state.revision)throw Error('AIA ha cambiado en otra ventana. Actualiza para continuar.');
 const p=activeProfile(state);
 if(action==='profile'){
  if(a.profileId){if(!state.profiles.some(p=>p.id===a.profileId))throw Error('Perfil no encontrado');state.active=a.profileId;}
  else{const name=String(a.name||'').trim().slice(0,60);if(!name)throw Error('Introduce un nombre');if(state.profiles.length>=20)throw Error('Máximo 20 perfiles');const id=crypto.randomUUID();state.profiles.push({...freshAia().profiles[0],id,name,attempts:[],reviews:[],completed:[]});state.active=id;}
 }else if(action==='settings'){
  if(a.seed!==undefined){if(!Number.isInteger(a.seed)||a.seed<0||a.seed>6)throw Error('Etapa no válida');p.seed=a.seed;}
  if(a.minutes!==undefined){if(![5,10,15,20,30].includes(a.minutes))throw Error('Duración no válida');p.minutes=a.minutes;}
  if(a.focus!==undefined){if(a.focus!=='auto'&&!tracks.includes(a.focus))throw Error('Objetivo no válido');p.focus=a.focus;}
 }else if(action==='start'){
  if(p.session&&p.session.index<p.session.ids.length)throw Error('Termina o cierra la sesión actual antes de comenzar otra.');
  const plan=buildPlan(p,now);let ids=plan.ids,reason=plan.reason;
  if(a.exerciseId){exercise(a.exerciseId);ids=[a.exerciseId];reason='Práctica manual del ejercicio elegido; se registra sin cambiar tu etapa inicial.';}
  if(a.reviewOnly){ids=p.reviews.filter(r=>r.failures>0).sort((a,b)=>a.due-b.due).map(r=>r.exerciseId).slice(0,4);if(!ids.length)throw Error('Todavía no hay errores que revisar');reason='Revisión de los errores guardados.';}
  p.session={id:crypto.randomUUID(),started:now,ids,index:0,step:0,path:[],hints:0,mistakes:0,assisted:false,done:false,revealed:false,results:[],feedback:{kind:'info',text:'Lee el concepto y el objetivo; después intenta resolverlo sin ayuda.'},reason};
 }else if(action==='close'){
  if(p.session&&p.session.index<p.session.ids.length)p.completed.push({date:now,total:p.session.results.length,correct:p.session.results.filter(r=>r.success).length,independent:p.session.results.filter(r=>r.independent).length});p.session=null;
 }else{
  const s=p.session;if(!s||s.index>=s.ids.length)throw Error('No hay ejercicio activo');
  if(a.sessionId!==s.id||a.exerciseId!==s.ids[s.index]||a.step!==s.step)throw Error('El ejercicio ha cambiado. Actualiza AIA.');
  const e=exercise(s.ids[s.index]);
  if(action==='next'){
   if(!s.done)throw Error('Resuelve el ejercicio o consulta su solución antes de continuar');
   s.index++;s.step=0;s.path=[];s.hints=0;s.mistakes=0;s.assisted=false;s.done=false;s.revealed=false;s.feedback={kind:'info',text:'Nuevo objetivo: lee el concepto antes de responder.'};
   if(s.index===s.ids.length)p.completed.push({date:now,total:s.results.length,correct:s.results.filter(r=>r.success).length,independent:s.results.filter(r=>r.independent).length});
  }else{
   if(s.done)throw Error('Este ejercicio ya ha terminado');
   if(action==='hint'){s.hints=Math.min(s.hints+1,e.hints.length);s.assisted=true;s.feedback={kind:'hint',text:e.hints[s.hints-1]};}
   else if(action==='reveal'){
    s.assisted=true;s.revealed=true;s.feedback={kind:'solution',text:'Solución guiada: '+(e.options?e.options[e.answer!]:spanishSan(e.line!.join(' ')))+'. '+e.explanation};
    result(p,s,e,false,'Solución consultada',now,sessionFen(e,s)||undefined);s.done=true;s.results.push({exerciseId:e.id,success:false,independent:false});
   }else if(action==='answer'){
    let correct=false,answer='',legal=true,observation='';const fen=sessionFen(e,s)||undefined;
    if(e.options){if(!Number.isInteger(a.answer)||a.answer<0||a.answer>=e.options.length)throw Error('Elige una respuesta');answer=e.options[a.answer];correct=a.answer===e.answer;}
    else{
     const c=new Chess(fen);let m;try{m=c.move(resolveMove(c,a.move));}catch{legal=false;}
     if(m){const replies=c.moves({verbose:true});const mate=replies.find(reply=>{const probe=new Chess(c.fen());probe.move(reply);return probe.isCheckmate();});const capture=replies.find(reply=>reply.to===m.to&&reply.captured&&m.piece!=='p'&&m.piece!=='k');if(mate)observation='Tras '+spanishSan(m.san)+', el rival dispone de '+spanishSan(mate.san)+', que da mate. Revisa la seguridad de tu rey.';else if(capture)observation='Tras '+spanishSan(m.san)+', el rival puede capturar la pieza de '+m.to+' con '+spanishSan(capture.san)+'. Comprueba las recapturas y la compensación antes de elegir.';else if(e.line!.at(-1)!.endsWith('#'))observation='La secuencia preparada lleva al mate. Revisa jaques y escapatorias del rey rival: esta jugada no inicia esa secuencia.';}
     answer=m?.san||String(a.move?.from||'')+String(a.move?.to||'');
     const expected=e.line![s.step],allowed=s.step===0&&e.accepted?e.accepted:[expected];correct=legal&&allowed.includes(m!.san);
    }
    if(correct){
     if(e.line){s.path.push(answer);s.step++;if(s.step<e.line.length){s.path.push(e.line[s.step]);s.step++;s.feedback={kind:'good',text:'Bien. El rival responde '+spanishSan(e.line[s.step-1])+'. Continúa la secuencia.'};}}
     if(!e.line||s.step>=e.line.length){s.feedback={kind:'good',text:(s.assisted||s.mistakes?'Resuelto con apoyo. Lo repasaremos para comprobar que puedes hacerlo sin ayuda. ':'Correcto sin ayuda. ')+e.explanation};result(p,s,e,true,answer,now,fen);}
    }else{
     s.mistakes++;s.assisted=true;
     const detail=e.wrong?.[answer];
     s.feedback={kind:'retry',text:!legal?'Ese movimiento no es legal en esta posición. Revisa el turno, el recorrido y la seguridad de tu rey.':detail||observation|| (e.options?'Replantea la respuesta. '+e.concept:'La jugada es legal, pero no cumple el objetivo de este ejercicio: '+e.task+' La posición se conserva para que pruebes otra alternativa.')};
     result(p,s,e,false,answer,now,fen);
    }
   }else throw Error('Acción AIA desconocida');
  }
 }
 state.revision++;return state;
}
export function aiaView(s:AiaStore,now=Date.now()){
 const p=activeProfile(s),session=p.session,e=session&&session.index<session.ids.length?exercise(session.ids[session.index]):null;
 return {...s,plan:buildPlan(p,now),currentExercise:e?{...e,answer:undefined,line:session?.done?e.line:undefined,accepted:undefined,fen:sessionFen(e,session!)}:null,tracks:tracks.map(track=>{const level=trackLevel(p,track);return {track,label:TRACKS[track],level,...mastery(p,track,level)};}),storageNotice:'El progreso de Sites y el de GitHub Pages se guardan por separado.'};
}
export function localAia(storage:Pick<Storage,'getItem'|'setItem'>,action:string,a:any={}){
 const raw=storage.getItem('ajedrez-pro:aia:v1');let s:AiaStore;
 try{s=raw?JSON.parse(raw):freshAia();if(!Array.isArray(s.profiles)||!Number.isInteger(s.revision))throw Error();}catch{throw Error('No se puede leer el progreso AIA. Conserva los datos del navegador antes de recuperarlo.');}
 const next=transitionAia(s,action,a);if(action!=='get')try{storage.setItem('ajedrez-pro:aia:v1',JSON.stringify(next));}catch{throw Error('No se pudo guardar AIA. El almacenamiento está lleno o bloqueado.');}return aiaView(next);
}
