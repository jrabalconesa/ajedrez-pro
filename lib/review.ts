import {Chess,type Square,type Color} from 'chess.js';
import {moveGrade,score} from './engine-settings';
import {spanishSan} from './coach';
import type {SearchResult} from './engine';
const names:Record<string,string>={p:'peón',n:'caballo',b:'alfil',r:'torre',q:'dama',k:'rey'};
const values:Record<string,number>={p:100,n:320,b:330,r:500,q:900,k:0};
export function reviewPositions(initialFen:string,history:string[]){const c=new Chess(initialFen);return [{fen:c.fen(),san:'',from:'',to:'',color:c.turn()},...history.map(san=>{const m=c.move(san);return {fen:c.fen(),san:m.san,from:m.from,to:m.to,color:m.color};})];}
export function legalLine(fen:string,pv:string,limit=6){const c=new Chess(fen),moves:string[]=[];for(const uci of pv.trim().split(/\s+/).filter(Boolean).slice(0,limit)){const m=c.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});moves.push(spanishSan(m.san));}return moves.join(' ');}
export type ReviewEntry={grade:'good'|'ok'|'bad';loss:number;highlight:boolean;message:string;alternative:string;reply:string;depth:number;limited:boolean;color:Color};
export function reviewEntry(beforeFen:string,san:string,before:SearchResult,after:SearchResult|null):ReviewEntry{
 const c=new Chess(beforeFen),m=c.move(san),terminal=c.isGameOver();
 if(!terminal&&!after)throw Error('Falta el análisis de la respuesta rival');
 const best=new Chess(beforeFen).move({from:before.move.slice(0,2),to:before.move.slice(2,4),promotion:before.move[4]});
 const value=terminal?(c.isCheckmate()?100000:0):-score(after!.evaluation);
 const {grade,loss}=moveGrade(score(before.evaluation),value),alternative=legalLine(beforeFen,before.evaluation.pv),reply=after?legalLine(c.fen(),after.evaluation.pv):'';
 const wasCheck=new Chess(beforeFen).isCheck();
 const facts=[`${['q','r'].includes(m.piece)?'La':'El'} ${names[m.piece]} va de ${m.from} a ${m.to}.`];
 if(m.captured)facts.push(`Captura ${['q','r'].includes(m.captured)?'una':'un'} ${names[m.captured]}.`);
 if(m.promotion)facts.push(`Promociona a ${names[m.promotion]}.`);
 if(m.isKingsideCastle()||m.isQueensideCastle())facts.push('Enroca: protege al rey y activa la torre.');
 if(c.isCheckmate())facts.push('Da jaque mate: el rival no tiene ninguna respuesta legal.');
 else if(c.isCheck())facts.push('Da jaque: obliga al rival a responder al ataque sobre su rey.');
 if(wasCheck&&!c.isCheck())facts.push('Resuelve el jaque sobre su propio rey.');
 if(['n','b'].includes(m.piece)&&m.from[1]===(m.color==='w'?'1':'8'))facts.push('Desarrolla una pieza menor fuera de la primera fila.');
 if(['d4','e4','d5','e5'].includes(m.to))facts.push('Ocupa una casilla central.');
 const highlight=grade!=='good'||wasCheck||c.isCheckmate()||(m.from===best.from&&m.to===best.to&&(!!m.captured||c.isCheck()||m.isKingsideCastle()||m.isQueensideCastle()));
 if(grade!=='good'){
  facts.push(`Stockfish encuentra una alternativa mejor: ${spanishSan(best.san)}. La diferencia estimada es ${loss>90000?'una secuencia de mate':(loss/100).toFixed(2)+' peones de valoración'}.`);
  if(after){const response=new Chess(c.fen()).move({from:after.move.slice(0,2),to:after.move.slice(2,4),promotion:after.move[4]});facts.push(`El rival puede responder ${spanishSan(response.san)}${response.captured?', capturando '+(['q','r'].includes(response.captured)?'una ':'un ')+names[response.captured]:response.san.includes('+')?', dando jaque':''}. Compara esa respuesta con la continuación de la alternativa.`);}
  if(after){
   const line=new Chess(c.fen());let net=0;for(const uci of after.evaluation.pv.split(/\s+/).slice(0,6)){const step=line.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});const gain=(step.captured?values[step.captured]:0)+(step.promotion?values[step.promotion]-100:0);net+=step.color===m.color?gain:-gain;}
   if(net<0)facts.push(`En los próximos seis movimientos individuales de esta continuación, el balance de capturas y promociones supone una pérdida de ${(-net/100).toFixed(1)} puntos de material para quien hizo la jugada. No es una pérdida forzada demostrada.`);
   else if(loss<90000)facts.push('El empeoramiento corresponde a la valoración de la posición: esta continuación corta no muestra por sí sola una pérdida neta inmediata de material.');
  }
 }else facts.push(`${m.from===best.from&&m.to===best.to?'Coincide con la primera opción calculada.':'Conserva una valoración cercana a la mejor alternativa.'} No se detecta una pérdida importante con esta profundidad.`);
 return {grade,loss,highlight,message:facts.join(' '),alternative,reply,color:m.color,depth:Math.min(before.evaluation.depth,after?.evaluation.depth??before.evaluation.depth),limited:!before.evaluation.complete||!!after&&!after.evaluation.complete};
}
/** Local exchange calculation, not a full tactical or Stockfish assessment. */
function exchange(c:Chess,target:Square,depth=0):number{if(depth>=8)return 0;let best=0;for(const m of c.moves({verbose:true}).filter(m=>m.to===target&&m.captured)){c.move(m);const gain=values[m.captured!]+(m.promotion?values[m.promotion]-100:0)-exchange(c,target,depth+1);c.undo();best=Math.max(best,gain);}return best;}
export type Threat={square:Square;danger:boolean;attackers:Square[];defenders:Square[];description:string};
export function ownThreats(fen:string,side:Color):Threat[]{
 const c=new Chess(fen),enemy=side==='w'?'b':'w',parts=fen.split(' ');parts[1]=enemy;if(c.turn()!==enemy)parts[3]='-';const next=new Chess(parts.join(' '));
 return c.board().flat().filter(p=>p&&p.color===side&&c.isAttacked(p.square,enemy)).map(p=>{
  const piece=p!,square=piece.square,attackers=c.attackers(square,enemy),defenders=c.attackers(square,side);
  let danger=piece.type==='k';
  if(!danger)for(const m of next.moves({verbose:true}).filter(m=>m.captured&&(m.to===square||(m.isEnPassant()&&m.to[0]+m.from[1]===square)))){next.move(m);const gain=values[m.captured!]+(m.promotion?values[m.promotion]-100:0)-exchange(next,m.to);next.undo();if(gain>45)danger=true;}
  return {square,danger,attackers,defenders,description:`${names[piece.type]} en ${square}: ${piece.type==='k'?'rey atacado':danger?'posible pérdida de material en el intercambio local':'bajo ataque; comprueba las defensas'}. Atacantes: ${attackers.join(', ')}. Defensores: ${defenders.join(', ')||'ninguno'}.`};
 });
}
