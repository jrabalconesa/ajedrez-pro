import {Chess} from 'chess.js';
const names:Record<string,string>={p:'peón',n:'caballo',b:'alfil',r:'torre',q:'dama',k:'rey'};
export function spanishSan(text:string){return text.replace(/(^|\s)([KQRBN])(?=[a-h1-8x])/g,(_,gap,p)=>gap+({K:'R',Q:'D',R:'T',B:'A',N:'C'} as Record<string,string>)[p]);}
export function coachSummary(fen:string,analysis?:any,last?:any){
 const c=new Chess(fen),side=c.turn()==='w'?'blancas':'negras';
 const legal=c.moves({verbose:true});
 const heading=c.isCheckmate()?'Jaque mate':c.isStalemate()?'Tablas por ahogado':`Turno de ${side}${c.isCheck()?' · estás en jaque':''}`;
 const lastMove=last?`Última jugada: ${spanishSan(last.san)}. ${last.san.endsWith('#')?'Da jaque mate.':last.san.includes('+')?'Da jaque al rey.':`El ${names[c.get(last.to)?.type||'p']} se ha movido de ${last.from} a ${last.to}.`}`:undefined;
 const comment=c.isCheckmate()?'El rey está atacado y no existe una respuesta legal.':c.isStalemate()?'El bando al turno no tiene jugadas legales y su rey no está en jaque.':c.isCheck()?`Primero resuelve el jaque. Hay ${legal.length} respuestas legales; solo puedes mover el rey, capturar la pieza atacante o interponer una pieza cuando sea posible.`:'Antes de mover, revisa los jaques, las capturas y las amenazas del rival. Comprueba qué piezas tuyas están atacadas y sin defensa.';
 let suggestion:string|undefined,reason:string|undefined;
 if(analysis?.fen===fen){const uci=(analysis.lines?.[0]?.pv||analysis.pv||'').trim().split(/\s+/)[0];try{const m=c.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});suggestion=spanishSan(m.san);reason=`Stockfish propone mover el ${names[m.piece]} de ${m.from} a ${m.to}. ${m.captured?`Captura un ${names[m.captured]}. `:''}${m.san.includes('#')?'Da jaque mate.':m.san.includes('+')?'Da jaque al rey rival.':new Chess(fen).isCheck()?'Resuelve el jaque actual.':'Revisa la continuación calculada más abajo antes de jugar.'}`;}catch{}}
 return {heading,lastMove,comment,suggestion,reason};
}

/** Position-only observations. Never reads a PV or exposes a candidate move. */
export function positionGuide(fen:string){
 const c=new Chess(fen),us=c.turn(),them=us==='w'?'b':'w',legal=c.moves({verbose:true});
 const pieces=c.board().flat().filter(p=>p!==null);
 const own=pieces.filter(p=>p.color===us),attacked=own.filter(p=>c.isAttacked(p.square,them));
 const loose=own.filter(p=>p.type!=='k'&&!c.isAttacked(p.square,us));
 const exposed=attacked.filter(p=>p.type!=='k'&&!c.isAttacked(p.square,us));
 const label=(p:typeof own[number])=>names[p.type]+' en '+p.square;
 const checks=legal.filter(m=>/[+#]/.test(m.san)).length,captures=legal.filter(m=>m.captured).length;
 const minors=own.filter(p=>['n','b'].includes(p.type)&&p.square[1]===(us==='w'?'1':'8'));
 const queens=pieces.some(p=>p.type==='q');
 const plan=c.isGameOver()?'La posición ha terminado. Revisa los momentos críticos o crea una variante.':c.isCheck()?'Resuelve el jaque antes de preparar un plan.':exposed.length?'Busca cómo proteger o retirar tus piezas atacadas sin defensa. Comprueba las consecuencias antes de actuar.':minors.length?'Mejora la actividad: desarrolla las piezas menores de la primera fila, disputa el centro y comprueba la seguridad del rey.':!queens?'Activa el rey cuando sea seguro y apoya el avance de tus peones. Evita dejarlos sin protección.':'Mejora tu pieza menos activa, observa las columnas abiertas y coordina tus piezas antes de avanzar peones junto al rey.';
 return {threats:c.isCheck()?'Tu rey está en jaque: debes responder al ataque.':attacked.length?'Piezas bajo ataque: '+attacked.map(label).join(', ')+'. Revisa capturas y defensas; un ataque no implica una pérdida forzada.':'No hay piezas propias bajo ataque directo. Comprueba también posibles amenazas de la siguiente jugada.',checks:`Dispones de ${checks} jaques legales. Comprueba primero si son útiles.`,captures:`Dispones de ${captures} capturas legales. Calcula la recaptura antes de elegir.`,undefended:loose.length?'Sin defensa directa: '+loose.map(label).join(', ')+'. No significa que estén amenazadas.':'Tus piezas, salvo el rey, tienen defensa directa.',plan,hints:[c.isCheck()?'Localiza la pieza que da jaque y revisa tus respuestas legales.':'Empieza por la seguridad de ambos reyes y los ataques sobre tus piezas.',exposed.length?'Presta atención a '+exposed.map(label).join(', ')+'.':minors.length?'Observa las piezas menores que siguen en su casilla inicial.':'Busca la pieza con menos actividad y cómo coordinarla.',`Compara dos candidatas: calcula tu jugada, la mejor respuesta rival y tu continuación. ${captures?'No olvides las recapturas.':'Comprueba que tu casilla de destino sea segura.'}`]};
}

export function moveOutcome(initialFen:string,history:string[]){
 const c=new Chess(initialFen);let result:string|null=null;
 for(const san of history){const m=c.move(san);if(m.color!=='w')continue;
 const facts=[`El ${names[m.piece]} pasa de ${m.from} a ${m.to}.`];
 if(m.captured)facts.push(`Captura un ${names[m.captured]}.`);
 if(m.promotion)facts.push(`Promociona a ${names[m.promotion]}.`);
 if(m.isKingsideCastle()||m.isQueensideCastle())facts.push('Enrocas: desplazas el rey y activas la torre.');
 if(c.isCheckmate())facts.push('La jugada da jaque mate.');
 else if(c.isCheck())facts.push('Das jaque: el rival debe responder.');
 else if(['d4','e4','d5','e5'].includes(m.to))facts.push('Ocupa una casilla central.');
 facts.push('Comprueba las amenazas de la respuesta rival antes de continuar.');
 result=spanishSan(m.san)+'. '+facts.join(' ');
 }return result;
}
