import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {fresh,mutate,view,fromPgn,pgn,outcome} from '../lib/chess-state';
let g=fresh(6);g=mutate(g,'move',{move:'e4'});g=mutate(g,'move',{move:'e5'});const history=[...g.history];g=mutate(g,'seek',{cursor:1});assert.deepEqual(g.history,history);assert.equal(view(g).turn,'b');assert.equal(g.mode,'study');assert.throws(()=>mutate(g,'move',{move:'c5'}));assert.throws(()=>mutate(g,'seek',{cursor:99}));
g=mutate(g,'seek',{cursor:2});assert.throws(()=>mutate(g,'move',{move:'e5'}));g=mutate(g,'move',{move:'Nf3'});const copy=fromPgn(pgn(g));assert.equal(view(copy).fen,view(g).fen);assert.equal(copy.history.length,3);
let custom=fresh(5,'8/4k3/8/8/8/8/4P3/4K3 w - - 0 1');custom=mutate(custom,'move',{move:'e4'});assert.equal(view(fromPgn(pgn(custom))).fen,view(custom).fen);assert.ok(pgn(custom).includes('[SetUp "1"]'));assert.ok(pgn(custom).includes('[FEN '));
let mate=fresh();for(const move of ['f3','e5','g4','Qh4#'])mate=mutate(mate,'move',{move});assert.deepEqual(outcome(mate),{result:'0-1',reason:'checkmate'});assert.throws(()=>mutate(mate,'move',{move:'a3'}));
let rep=fresh();for(const move of ['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8'])rep=mutate(rep,'move',{move});assert.equal(outcome(rep)?.reason,'threefold_repetition');
let promo=fresh(6,'7k/P7/8/8/8/8/8/7K w - - 0 1');promo=mutate(promo,'move',{move:{from:'a7',to:'a8',promotion:'n'}});assert.equal(new Chess(view(promo).fen).get('a8')?.type,'n');assert.throws(()=>mutate(g,'settings',{difficulty:21}));
console.log('Core: legalidad, historial, PGN normal y FEN, jaque mate, repetición y promoción: OK');

const resigned=fresh();resigned.history=['e4','e5'];resigned.cursor=2;resigned.resigned=true;assert.equal(outcome(resigned)?.reason,'resignation');assert.equal(outcome(mutate(resigned,'seek',{cursor:1})),null);assert.equal(outcome(fromPgn('[Result \"0-1\"]\n\n1. e4 e5 0-1'))?.result,'0-1');

let natural=fresh();natural=mutate(natural,'move',{move:'Mueve el peón de rey dos casillas adelante'});assert.equal(natural.history[0],'e4');natural=mutate(natural,'move',{move:'e7e5'});natural=mutate(natural,'move',{move:'Saca el caballo de la derecha a la casilla f3'});assert.equal(natural.history[2],'Nf3');
assert.throws(()=>mutate(fresh(),'move',{move:'mueve el caballo'}),/ambigua/);
assert.equal(mutate(fresh(),'move',{move:'Cf3'}).history[0],'Nf3');
assert.throws(()=>mutate(fresh(),'move',{move:'enroque corto'}),/legal/);
let analyzed=mutate(fresh(),'request_analysis',{});assert.equal(analyzed.analysisRequested,true);analyzed=mutate(analyzed,'analysis',{fen:view(analyzed).fen,depth:12,pv:'e2e4 e7e5',cp:30,lines:[{rank:1,depth:12,cp:30,pv:'e2e4 e7e5'}]});assert.equal(analyzed.analysis?.lines?.[0].san,'e4 e5');assert.equal(analyzed.analysisRequested,false);assert.throws(()=>mutate(analyzed,'analysis',{fen:view(analyzed).fen,depth:12,lines:[{pv:'e2e5'}]}));
assert.equal(mutate(analyzed,'move',{move:'e4'}).analysis,undefined);
assert.equal(view(mutate(analyzed,'settings',{coachLevel:'iniciacion'})).coachContext.level,'iniciacion');
console.log('Guía v2: lenguaje natural, ambigüedad, SAN española, solicitud de análisis, variantes legales y contexto: OK');

let capture=fresh(6,'7k/8/8/8/5p2/8/3B4/7K w - - 0 1');assert.equal(mutate(capture,'move',{move:'Come el peón con mi alfil'}).history[0],'Bxf4');

const {coachSummary,spanishSan}=await import('../lib/coach');
const checkedFen='6k1/1p4pp/2b1p3/3pNr2/2pqPpQ1/8/2P2RPP/r5K1 w - - 0 27';
const checked=new Chess(checkedFen);assert.equal(checked.isCheck(),true);
const escape=checked.moves({verbose:true})[0];
const advice=coachSummary(checkedFen,{fen:checkedFen,pv:escape.from+escape.to,depth:12}, {san:'Ra1+',from:'a3',to:'a1'});
assert.match(advice.comment,/Primero resuelve el jaque/);assert.equal(advice.suggestion,spanishSan(escape.san));assert.match(advice.reason!,/Resuelve el jaque/);
assert.equal(coachSummary(checkedFen,{fen:new Chess().fen(),pv:'e2e4'}).suggestion,undefined);
assert.equal(spanishSan('Nf3 Qh5 Rxf7 Kf1 Bc4'),'Cf3 Dh5 Txf7 Rf1 Ac4');
console.log('Entrenador visible: jaque, sugerencia legal, SAN española y rechazo de análisis de otra posición: OK');

const {positionGuide,moveOutcome}=await import('../lib/coach');
const initial=new Chess();
assert.equal(initial.board().flat().filter(Boolean).length,32);
assert.equal(initial.board().flat().filter(p=>p?.color==='b'&&p.type==='p').length,8);
const guide=positionGuide(initial.fen());assert.equal(guide.hints.length,3);assert.match(guide.captures,/0 capturas/);assert.match(guide.plan,/desarrolla/);
const threat=positionGuide('7k/8/8/8/3q4/8/8/3R3K w - - 0 1');assert.match(threat.threats,/torre en d1/);assert.match(threat.undefended,/torre en d1/);
assert.match(positionGuide(checkedFen).threats,/jaque/);
assert.match(moveOutcome(initial.fen(),['e4','e5'])!,/e4.*casilla central/);
assert.match(moveOutcome(initial.fen(),['e4','d5','exd5'])!,/Captura un peón/);
let castle=new Chess();for(const m of ['e4','e5','Nf3','Nc6','Bc4','Nf6','O-O'])castle.move(m);
assert.equal(castle.get('g1')?.type,'k');assert.equal(castle.get('f1')?.type,'r');
assert.match(moveOutcome(initial.fen(),castle.history())!,/Enrocas/);
let enpassant=new Chess();for(const m of ['e4','a6','e5','d5','exd6'])enpassant.move(m);assert.equal(enpassant.get('d5'),undefined);assert.equal(enpassant.get('d6')?.type,'p');
console.log('Tres modos: guía sin soluciones, amenazas actuales, resultado de jugada, 32 piezas, enroque y captura al paso: OK');

// Existing games without a stored side still belong to White.
const legacy=fresh();delete legacy.playerColor;assert.equal(view(legacy).playerColor,'w');assert.equal(view(legacy).phase,'active');
let blackSide=fresh(6,undefined,'b');assert.equal(view(blackSide).phase,'engine_pending');
blackSide=mutate(blackSide,'move',{move:'e4'});assert.equal(view(blackSide).phase,'active');
blackSide=mutate(blackSide,'settings',{playerColor:'w'});assert.equal(view(blackSide).phase,'engine_pending');
blackSide=mutate(blackSide,'settings',{playerColor:'b'});blackSide=mutate(blackSide,'resign',{});assert.equal(outcome(blackSide)?.result,'1-0');
blackSide=mutate(blackSide,'settings',{playerColor:'w'});assert.equal(outcome(blackSide)?.result,'1-0');
console.log('Compatibilidad de partidas blancas, cambio de color y resultado de abandono: OK');
