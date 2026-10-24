import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {Engine,SearchCancelled} from '../lib/engine';
class FakeWorker{
 static instances:FakeWorker[]=[];messages:string[]=[];onmessage:any;onerror:any;
 constructor(public url:string){FakeWorker.instances.push(this);}
 postMessage(message:string){this.messages.push(message);if(message==='uci')queueMicrotask(()=>this.emit('uciok'));if(message==='isready')queueMicrotask(()=>this.emit('readyok'));}
 emit(line:string){this.onmessage?.({data:line});}terminate(){}
}
Object.assign(globalThis,{Worker:FakeWorker,document:{baseURI:'https://jrabalconesa.github.io/ajedrez-pro/'}});
const turn=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
const e=new Engine();await e.ready;const worker=FakeWorker.instances.at(-1)!;
assert.equal(worker.url,'https://jrabalconesa.github.io/ajedrez-pro/engine/stockfish.js');
const old=e.search(new Chess().fen(),20,true).catch(error=>error);await turn();e.stop();assert.ok(await old instanceof SearchCancelled);
const nextFen=new Chess();nextFen.move('e4');const next=e.search(nextFen.fen(),6);await turn();
assert.equal(worker.messages.filter(x=>x.startsWith('go ')).length,1,'La nueva posición espera a que finalice el cálculo cancelado');
worker.emit('bestmove e2e4');await turn();assert.equal(worker.messages.filter(x=>x.startsWith('go ')).length,2);
worker.emit('info depth 8 score cp 20 pv e7e5 g1f3\nbestmove e7e5');assert.equal((await next).move,'e7e5');assert.equal(e.busy,false);
const retry=e.search(new Chess().fen(),20,true);await turn();worker.emit('bestmove e2e4');assert.equal(worker.messages.at(-1),'go depth 8');
worker.emit('info depth 8 multipv 1 score cp 25 pv e2e4 e7e5\nbestmove e2e4');assert.equal((await retry).evaluation.depth,8);
const invalid=e.search(new Chess().fen(),6).catch(error=>error);await turn();worker.emit('bestmove e2e5');assert.ok(await invalid instanceof Error);assert.equal(e.busy,false);e.destroy();
console.log('Motor: cancelación drenada, turno negro posterior, mensajes multilínea, reintento sin valoración, rechazo de jugada ilegal y rutas de Pages: OK');
