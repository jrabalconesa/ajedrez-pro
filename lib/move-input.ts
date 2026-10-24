import { Chess } from 'chess.js';
const clean=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
/** Resolve only a unique legal move; ambiguous instructions never change the board. */
export function resolveMove(c:Chess,input:any):any {
 if(typeof input!=='string')return input;
 const raw=input.trim(); const legal=c.moves({verbose:true});
 const direct=legal.find(m=>m.san===raw || m.san.replace(/[+#]$/,'')===raw || m.from+m.to+(m.promotion||'')===raw.toLowerCase());
 if(direct)return direct.san;
 const spanish=raw.replace(/^([RDTAC])(?=[a-h1-8x])/,(s)=>({R:'K',D:'Q',T:'R',A:'B',C:'N'}[s]!));
 if(spanish!==raw){const match=legal.find(m=>m.san===spanish||m.san.replace(/[+#]$/,'')===spanish);if(match)return match.san;}
 const s=clean(raw);if(/enroque|^0-0/.test(s)){const san=/largo|dama|0-0-0/.test(s)?'O-O-O':'O-O';if(legal.some(m=>m.san.replace(/[+#]$/,'')===san))return san;throw Error('Ese enroque no es legal en esta posición.');}
 if(/peon de rey/.test(s)&&/dos/.test(s)){const san=c.turn()==='w'?'e4':'e5';if(legal.some(m=>m.san.replace(/[+#]$/,'')===san))return san;throw Error('El avance doble del peón de rey no es legal.');}
 const movingText=s.match(/(?:con|usando) (?:mi |el |la )?(caballo|alfil|torre|dama|reina|rey|peon)/)?.[1]||s;
 const type=({caballo:'n',alfil:'b',torre:'r',dama:'q',reina:'q',rey:'k',peon:'p'} as Record<string,string>)[movingText.match(/\b(caballo|alfil|torre|dama|reina|rey|peon)\b/)?.[1]||''];
 const squares=s.match(/[a-h][1-8]/g)||[];
 let matches=legal.filter(m=>!type||m.piece===type);
 if(squares.length>=2)matches=matches.filter(m=>m.from===squares[0]&&m.to===squares[1]);
 else if(squares.length===1)matches=matches.filter(m=>m.to===squares[0]);
 else if(/peon de rey/.test(s)&&/dos/.test(s))matches=matches.filter(m=>m.from===(c.turn()==='w'?'e2':'e7')&&m.to===(c.turn()==='w'?'e4':'e5'));
 else if(!type)throw Error('Indica una jugada SAN, coordenadas o pieza y destino.');
 if(/come|captura/.test(s))matches=matches.filter(m=>m.captured);
 if(/peon/.test(s)&&type!=='p'&&/come|captura/.test(s))matches=matches.filter(m=>m.captured==='p');
 if(/derecha/.test(s))matches=matches.filter(m=>m.from[0]>='e');
 if(/izquierda/.test(s))matches=matches.filter(m=>m.from[0]<'e');
 if(matches.length===1)return matches[0].san;
 if(matches.length>1)throw Error('Instrucción ambigua. Indica origen, destino y promoción si procede. Candidatas legales: '+matches.map(m=>m.san).join(', '));
 throw Error('No hay una jugada legal que coincida con la instrucción.');
}
