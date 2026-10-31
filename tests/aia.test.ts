import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {CATALOG,exercise} from '../lib/aia-curriculum';
import {freshAia,activeProfile,transitionAia,aiaView,localAia,mastery,trackLevel,buildPlan} from '../lib/aia';
import {DEFAULT_PRACTICE,TOPICS,topicAvailable,areaMatches,matchesPractice,searchExercises,topicMatches} from '../lib/aia-topics';
const now=Date.UTC(2026,9,27,12);
assert.ok(CATALOG.length>=648);assert.equal(new Set(CATALOG.map(e=>e.id)).size,CATALOG.length);
for(const e of CATALOG){
 assert.ok(e.concept&&e.task&&e.explanation&&e.hints.length);
 if(e.fen){const c=new Chess(e.fen);assert.equal(c.isGameOver(),false,e.id+' starts finished');const initial=c.fen();for(const move of e.line!){assert.ok(c.move(move),e.id+' '+move);}if(e.line!.at(-1)!.endsWith('#'))assert.equal(c.isCheckmate(),true,e.id+' expected mate');for(const m of e.accepted||[])assert.ok(new Chess(initial).move(m));}
 else {assert.ok(e.options!.length>=3);assert.ok(e.answer!>=0&&e.answer!<e.options!.length);}
}
// Cada etapa hasta 1400 ELO necesita exactamente 50 ejercicios por área.
for(const level of [0,1,2]){
 for(const track of ['opening','tactics','strategy','endgame']){
  const found=CATALOG.filter(e=>e.level===level&&e.track===track);
  assert.ok(found.length>=50,'Faltan ejercicios en '+track+' nivel '+level);
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
// Selección estricta, prioridad real y compatibilidad con perfiles anteriores.
const scoped=freshAia(),sp=activeProfile(scoped);
assert.equal(sp.practice,undefined);
sp.practice={...DEFAULT_PRACTICE,area:'opening',topic:'italian',mode:'only'};
let selectedPlan=buildPlan(sp,now);
assert.ok(selectedPlan.available);assert.ok(selectedPlan.ids.length>0);
assert.ok(selectedPlan.ids.every(id=>matchesPractice(exercise(id),sp.practice!)));
assert.equal(selectedPlan.ids.length,4,'Una sesión específica debe tener cuatro ejercicios');
sp.reviews.push({exerciseId:'endgame-1-board',due:now-1,interval:0,failures:1,resolved:0});
assert.ok(buildPlan(sp,now).ids.every(id=>exercise(id).track==='opening'));
assert.equal(sp.reviews.length,1,'Conservar repasos excluidos');
sp.practice={...DEFAULT_PRACTICE,area:'opening',mode:'priority'};
selectedPlan=buildPlan(sp,now);assert.equal(selectedPlan.ids.length,4);
assert.ok(selectedPlan.ids.filter(id=>exercise(id).track==='opening').length>=3);
assert.ok(selectedPlan.ids.includes('endgame-1-board'),'Mantener un repaso ajeno al dar prioridad');
sp.practice={...DEFAULT_PRACTICE,area:'middlegame',mode:'only'};
assert.ok(buildPlan(sp,now).ids.every(id=>['tactics','strategy'].includes(exercise(id).track)));
sp.practice={...DEFAULT_PRACTICE,area:'endgame',topic:'pawn-endings',mode:'only'};
assert.ok(buildPlan(sp,now).ids.every(id=>topicMatches(exercise(id),'pawn-endings')));
sp.practice={...DEFAULT_PRACTICE,query:'tema inexistente xyz',mode:'only'};
assert.equal(buildPlan(sp,now).available,false);assert.equal(buildPlan(sp,now).ids.length,0);
assert.throws(()=>transitionAia(scoped,'start',{revision:scoped.revision},now),/No hay ejercicios/);
assert.throws(()=>transitionAia(scoped,'settings',{revision:scoped.revision,practice:{...DEFAULT_PRACTICE,area:'endgame',topic:'italian'}},now),/Tema de práctica/);
assert.ok(CATALOG.some(e=>searchExercises(e,'Siciliana')&&e.title.includes('Sicilian')),'Alias español de apertura inglesa');
const persisted=transitionAia(freshAia(),'settings',{revision:0,practice:{...DEFAULT_PRACTICE,area:'opening',topic:'italian',mode:'only'}},now);
assert.equal(activeProfile(JSON.parse(JSON.stringify(persisted))).practice?.topic,'italian');
assert.equal(activeProfile(transitionAia(persisted,'profile',{revision:1,name:'Nuevo'},now)).practice,undefined,'Cada perfil conserva sus filtros');
console.log('AIA: '+CATALOG.length+' contenidos, FEN y secuencias legales, mates, respuestas alternativas, reintentos, pistas, solución, perfiles, progreso por área, repaso, persistencia y conflictos: OK');

// Todas las combinaciones ofrecidas por la interfaz hasta 1400 ELO deben
// disponer de cuatro ejercicios distintos y formar una sesión exclusiva.
for(const level of [0,1,2])for(const area of ['all','opening','middlegame','tactics','strategy','endgame'])for(const topic of TOPICS.filter(t=>topicAvailable(t.id,area))){
 const practice={...DEFAULT_PRACTICE,area:area as any,topic:topic.id,mode:'only' as const};
 const pool=CATALOG.filter(e=>e.level===level&&areaMatches(e.track,area)&&topicMatches(e,topic.id));
 assert.ok(pool.length>=4,`Cobertura insuficiente: ${level}/${area}/${topic.id}: ${pool.length}`);
 const profile=activeProfile(freshAia());profile.seed=level;profile.practice=practice;
 const plan=buildPlan(profile,now);assert.equal(plan.available,true);assert.equal(plan.ids.length,4);
 assert.ok(plan.ids.every(id=>matchesPractice(exercise(id),practice)));
 assert.equal(new Set(plan.ids).size,4);
 // El nombre visible del tema se puede utilizar también como búsqueda.
 profile.practice={...practice,topic:'all',query:topic.label};
 assert.ok(buildPlan(profile,now).available,`Búsqueda sin coincidencias: ${topic.label}`);
}
// Un texto sin relación con el tema debe seguir produciendo un vacío real.
assert.equal(searchExercises(exercise('strategy-1-concept-0'),'apertura inexistente xyz'),false);
console.log('Cobertura de filtros y sesiones por tema hasta 1400 ELO: OK');

// El entrenamiento integrado conserva el progreso y exige cálculo en modo reto.
{
 let s=freshAia();s=transitionAia(s,'settings',{revision:s.revision,intensity:'challenge',seed:2});
 const p=activeProfile(s),plan=buildPlan(p,now);
 assert.ok(plan.ids.length>0);for(const id of plan.ids){const e=exercise(id);assert.ok(e.fen&&e.line&&e.line.length>=3);}
 const fen='6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1';
 s=transitionAia(s,'save_error',{revision:s.revision,fen,line:'Re8#',explanation:'Mate de última fila.'});
 assert.equal(activeProfile(s).personal?.length,1);
 s=transitionAia(s,'save_error',{revision:s.revision,fen,line:'Re8#'});assert.equal(activeProfile(s).personal?.length,1);
 assert.throws(()=>transitionAia(s,'save_error',{revision:s.revision,fen,line:'e4'}));
 const id=activeProfile(s).personal![0].id;
 s=transitionAia(s,'start',{revision:s.revision,exerciseId:id});assert.equal(aiaView(s).currentExercise?.id,id);
 const v=aiaView(s);s=transitionAia(s,'answer',{revision:s.revision,sessionId:v.profiles[0].session!.id,exerciseId:id,step:0,move:'Re8#'},now);
 assert.equal(activeProfile(s).attempts.at(-1)?.success,true);
 console.log('Integración: retos multijugada y errores personales con repaso OK');
}
{
 const added=CATALOG.filter(e=>e.sourceUrl&&e.puzzleRating!>=1200);
 assert.ok(added.length>=600);assert.ok(added.every(e=>(e.line?.length||0)>=3));
 const school=CATALOG.filter(e=>e.id.startsWith('trainer-opening-'));
 assert.ok(school.length>=100);
 assert.ok(school.some(e=>e.id.includes('-3-0'))&&school.some(e=>e.id.includes('-3-1')));
 console.log('Escuela de aperturas: '+school.length+' prácticas legales; catálogo total '+CATALOG.length);
}
// Correspondencia exacta con los doce cuadernos del libro.
{
 const courses=(await import('../lib/trainer-openings.json')).default;
 assert.equal(courses.length,12);for(const course of courses){for(const line of course.lines){const c=new Chess();for(const m of line.moves)c.move(m.san);}assert.ok(CATALOG.some(e=>e.id.startsWith('trainer-opening-'+course.id+'-')),course.name);}
 assert.ok(courses[8].name.includes('Eslava'));assert.ok(courses[11].name.includes('poco frecuentes'));
}
