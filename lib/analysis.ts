import {Chess} from 'chess.js';
/** Reject stale/illegal PVs and produce readable SAN for both deployment targets. */
export function normalizeAnalysis(fen:string,input:any){
 if(!Number.isInteger(input.depth)||input.depth<1||input.depth>100)throw Error('Stockfish no devolvió una profundidad válida.');
 const convert=(line:any)=>{const c=new Chess(fen),san:string[]=[],pv=String(line.pv||'').trim().split(/\s+/).filter(Boolean).slice(0,24);if(!pv.length)throw Error('La variante está vacía.');
 for(const uci of pv){if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw Error('Variante UCI no válida');san.push(c.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]}).san);}
 if(!Number.isInteger(line.depth)||line.depth<1||line.depth>100)throw Error('Profundidad de variante no válida');
 if(!Number.isFinite(line.cp)&&!Number.isFinite(line.mate))throw Error('Falta la valoración de la variante');
 return {...line,pv:pv.join(' '),san:san.join(' '),cp:Number.isFinite(line.cp)?line.cp:undefined,mate:Number.isFinite(line.mate)?line.mate:undefined};};
 const main=convert(input),lines=(Array.isArray(input.lines)&&input.lines.length?input.lines:[{...input,rank:1}]).slice(0,3).map(convert);
 return {...main,fen,lines};
}
