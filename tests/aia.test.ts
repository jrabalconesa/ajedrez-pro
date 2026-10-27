import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {CATALOG,exercise} from '../lib/aia-curriculum';
import {freshAia,activeProfile,transitionAia,aiaView,localAia,mastery,trackLevel,buildPlan} from '../lib/aia';
const now=Date.UTC(2026,9,27,12);
assert.equal(CATALOG.length,648);assert.equal(new Set(CATALOG.map(e=>e.id)).size,CATALOG.length);
for(const e of CATALOG){
 assert.ok(e.concept&&e.task&&e.explanation&&e.hints.length);
 if(e.fen){const c=new Chess(e.fen);assert.equal(c.isGameOver(),false,e.id+' starts finished');const initial=c.fen();for(const move of e.line!){assert.ok(c.move(move),e.id+' '+move);}if(e.line!.at(-1)!.endsWith('#'))assert.equal(c.isCheckmate(),true,e.id+' expected mate');for(const m of e.accepted||[])assert.ok(new Chess(initial).move(m));}
 else {assert.ok(e.options!.length>=3);assert.ok(e.answer!>=0&&e.answer!<e.options!.length);}
}
// Cada etapa hasta 1400 ELO necesita exactamente 50 ejercicios por área.
for(const level of [0,1,2]){
 for(const track of ['opening','tactics','strategy','endgame']){
  const found=CATALOG.filter(e=>e.level===level&&e.track===track);
  assert.equal(found.length,50,'Faltan ejercicios en '+track+' nivel '+level);
  assert.ok(found.filter(e=>e.fen).length>=20,'Demasiada teoría sin tablero en '+track+' nivel '+level);
 }
}
assert.ok(CATALOG.filter(e=>e.id.startsWith('lichess-')).length>300);
const saavedra=new Chess(exercise('endgame-5-board').fen!);saavedra.move('c8=Q');saavedra.move('Rc4+');saavedra.move('Qxc4');assert.equal(saavedra.isStalemate(),true);const saavedraR=new Chess(exercise('endgame-5-board').fen!);saavedraR.move('c8=R');saavedraR.move('Rc4+');saavedraR.move('Rxc4');assert.equal(saavedraR.isStalemate(),false);
let state=freshAia();
function action(op:string,a:any={},time=now){const p=activeProfile(state),s=p.session;state=transitionAia(state,op,{revision:state.revision,sessionId:s?.id,exerciseId:s?.ids[s.index],step:s?.step,...a},time);return state;}
action('start',{exerciseId:'opening-0-board'});const initial=aiaView(state).currentExercise!.fen;
action('answer',{move:'a3'});assert.equal(aiaView(state).currentExercise!.fen,initial);assert.equal(activeProfile(state).attempts.length,1);assert.equal(activeProfile(state).reviews[0].failures,1);assert.equal(activeProfile(state).session!.done,false);
assert.throws(()=>transitionAia(state,'answer',{revision:0}),/otra ventana/);
action('answer',{move:'d4'});assert.equal(new Chess(aiaView(state).currentExercise!.fen!).get('d4')?.type,'p');assert.equal(activeProfile(state).attempts.at(-1)!.assisted,true);assert.equal(activeProfile(state).session!.done,true);
assert.throws(()=>transitionAia(state,'answer',{revision:state.revision,sessionId:'old',exerciseId:'opening-0-board',step:1,move:'e4'}),/cambiado/);
action('next');assert.equal(activeProfile(state).completed.length,1);
action('start',{exerciseId:'opening-2-board'});action('answer',{move:'d4'});assert.equal(activeProfile(state).session!.step,2);assert.equal(new Chess(aiaView(state).currentExercise!.fen!).get('d4')?.color,'b');action('answer',{move:'Nxd4'});assert.equal(activeProfile(state).session!.done,true);assert.equal(activeProfile(state).attempts.at(-1)!.assisted,false);
action('next');action('start',{exerciseId:'tactics-3-board'});action('hint');action('answer',{move:'Bxf7+'});action('answer',{move:'Nd5#'});assert.equal(activeProfile(state).attempts.at(-1)!.assisted,true);action('next');
action('start',{exerciseId:'endgame-0-board'});action('reveal');assert.equal(activeProfile(state).session!.done,true);assert.equal(activeProfile(state).attempts.at(-1)!.success,false);assert.equal(activeProfile(state).session!.results[0].success,false);action('next');
action('start',{exerciseId:'strategy-1-concept-0'});action('answer',{answer:0});assert.equal(activeProfile(state).attempts.at(-1)!.success,true);action('next');
const oldId=state.active,oldAttempts=activeProfile(state).attempts.length;action('profile',{name:'Segundo perfil'});assert.equal(activeProfile(state).attempts.length,0);assert.equal(activeProfile(state).session,null);action('profile',{profileId:oldId});assert.equal(activeProfile(state).attempts.length,oldAttempts);
const p=activeProfile(state);p.seed=1;p.attempts=[];for(let i=0;i<3;i++)p.attempts.push({id:String(i),exerciseId:i%2?'opening-1-concept-0':'opening-1-board',track:'opening',level:1,date:now+(i===2?86400000:0),success:true,assisted:false,answer:'x',reason:'x',sessionId:'x'});assert.equal(mastery(p,'opening',1).ready,true);assert.equal(trackLevel(p,'opening'),2);assert.equal(trackLevel(p,'endgame'),1);
p.attempts[2].assisted=true;assert.equal(mastery(p,'opening',1).ready,false);
p.attempts=[];assert.equal(buildPlan(p,now+3*86400000).due>0,true);
// Regression: tres sesiones seguidas del mismo día no deben repetir la primera.
const rotation=freshAia(),rotated=activeProfile(rotation);
rotated.seed=1;
const scheduled:string[][]=[];
for(let session=0;session<3;session++){
 const plan=buildPlan(rotated,now+session*60000);
 scheduled.push(plan.ids);
 assert.equal(plan.ids.length,4);
 assert.ok(plan.items.every(item=>item.kind==='nuevo'));
 for(const id of plan.ids){
  const e=exercise(id);
  rotated.attempts.push({id:'rotation-'+session+'-'+id,date:now+session*60000,exerciseId:id,track:e.track,level:e.level,success:true,assisted:false,answer:'correcto',reason:'simulación',sessionId:'session-'+session});
 }
}
assert.equal(new Set(scheduled.flat()).size,12,'debe haber 12 ejercicios distintos en tres sesiones');
assert.notDeepEqual(scheduled[0],scheduled[2],'la tercera sesión no debe ser idéntica a la primera');
const longer=freshAia(),longerProfile=activeProfile(longer);
longerProfile.seed=1;longerProfile.minutes=30;
const longPlan=buildPlan(longerProfile,now);
assert.equal(longPlan.ids.length,8);
assert.equal(new Set(longPlan.ids.map(id=>exercise(id).track)).size,4,'sesión larga equilibrada');
rotated.reviews.push({exerciseId:scheduled[0][0],due:now-60000,interval:0,failures:1,resolved:0});
const duePlan=buildPlan(rotated,now+4*60000);
assert.equal(duePlan.items.find(item=>item.id===scheduled[0][0])?.kind,'repaso');
const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)||null,setItem:(k:string,v:string)=>{map.set(k,v)}};
let v=localAia(storage,'get');v=localAia(storage,'start',{revision:v.revision,exerciseId:'opening-1-board'});assert.equal(localAia(storage,'get').profiles[0].session!.id,v.profiles[0].session!.id);
assert.throws(()=>localAia({...storage,setItem:()=>{throw Error()}},'settings',{revision:v.revision,minutes:10}),/guardar AIA/);
console.log('AIA: 648 contenidos, FEN y secuencias legales, mates, respuestas alternativas, reintentos, pistas, solución, perfiles, progreso por área, repaso, persistencia y conflictos: OK');
