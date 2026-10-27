import {Chess} from 'chess.js';
import type {Exercise,Track} from './aia-curriculum';

export const AREAS={all:'Todas las áreas',opening:'Aperturas',middlegame:'Medio juego',tactics:'Táctica y cálculo',strategy:'Estrategia',endgame:'Finales'};
export type Practice={area:keyof typeof AREAS;topic:string;query:string;mode:'only'|'priority'};
export const DEFAULT_PRACTICE:Practice={area:'all',topic:'all',query:'',mode:'priority'};
export const TOPICS=[
 {id:'italian',area:'opening',label:'Apertura Italiana',words:['italiana','italian']},
 {id:'spanish',area:'opening',label:'Española / Ruy López',words:['española','ruy lopez']},
 {id:'scotch',area:'opening',label:'Apertura Escocesa',words:['escocesa','scotch']},
 {id:'sicilian',area:'opening',label:'Defensa Siciliana',words:['siciliana','sicilian']},
 {id:'caro',area:'opening',label:'Defensa Caro-Kann',words:['caro kann']},
 {id:'scandinavian',area:'opening',label:'Defensa Escandinava',words:['escandinava','scandinavian']},
 {id:'english',area:'opening',label:'Apertura Inglesa',words:['inglesa','english opening']},
 {id:'french',area:'opening',label:'Defensa Francesa',words:['francesa','french defense']},
 {id:'queens-gambit',area:'opening',label:'Gambito de dama',words:['gambito de dama',"queen's gambit"]},
 {id:'london',area:'opening',label:'Sistema Londres',words:['londres','london']},
 {id:'development',area:'opening',label:'Desarrollo, centro y enroque',words:['desarrollo','desarrollar','centro','enroque']},
 {id:'fork',area:'middlegame',label:'Dobles ataques',words:['doble','horquilla']},
 {id:'pin',area:'middlegame',label:'Clavadas',words:['clavada']},
 {id:'mate',area:'middlegame',label:'Ataque al rey y mate',words:['mate','ataque al rey','enroque']},
 {id:'activity',area:'middlegame',label:'Actividad y coordinación de piezas',words:['activa','actividad','coordina','peor pieza','menos activa','no participa','columna']},
 {id:'pawns',area:'middlegame',label:'Estructuras y rupturas de peones',words:['peon','peones','ruptura','estructura']},
 {id:'defense',area:'middlegame',label:'Defensa y profilaxis',words:['defensa','defender','profilaxis','contrajuego']},
 {id:'pawn-endings',area:'endgame',label:'Rey y peones',words:['oposicion','regla del cuadrado','peon pasado','finales de peones','peones']},
 {id:'rook-endings',area:'endgame',label:'Finales de torres',words:['lucena','philidor','torres','torre']},
 {id:'queen-endings',area:'endgame',label:'Finales con dama',words:['dama','damas']},
 {id:'minor-endings',area:'endgame',label:'Finales de alfiles y caballos',words:['alfiles','caballos']},
 {id:'promotion',area:'endgame',label:'Coronación y subpromoción',words:['corona','promocion','saavedra']},
 {id:'stalemate',area:'endgame',label:'Ahogado',words:['ahogado','encerrar al rey']},
] as const;
export function normalizeTopic(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function areaMatches(track:Track,area:string){return area==='all'||area===track||(area==='middlegame'&&(track==='strategy'||track==='tactics'));}
export function topicAvailable(id:string,area:string){
 const t=TOPICS.find(t=>t.id===id);if(!t)return false;
 if(area==='all'||area===t.area)return true;
 if(t.area!=='middlegame')return false;
 return area==='tactics'?['fork','pin','mate','defense'].includes(id):area==='strategy'?['activity','pawns','defense','mate'].includes(id):false;
}
export function topicMatches(e:Exercise,id:string):boolean{
 if(id==='all')return true;
 const topic=TOPICS.find(t=>t.id===id);if(!topic||!areaMatches(e.track,topic.area)||!topicAvailable(id,e.track))return false;
 if(e.topics)return e.topics.includes(id);
 // Material real de la posición para distinguir familias de finales.
 if(e.fen&&['pawn-endings','rook-endings','queen-endings','minor-endings'].includes(id)){
  const pieces=new Chess(e.fen).board().flat().filter(Boolean).map(p=>p!.type);
  if(id==='pawn-endings')return pieces.includes('p')&&pieces.every(p=>p==='p'||p==='k');
  if(id==='rook-endings')return pieces.includes('r')&&!pieces.some(p=>['q','b','n'].includes(p));
  if(id==='queen-endings')return pieces.includes('q')&&!pieces.some(p=>['r','b','n'].includes(p));
  return pieces.some(p=>p==='b'||p==='n')&&!pieces.some(p=>p==='q'||p==='r');
 }
 return topic.words.some(w=>normalizeTopic(e.title).includes(normalizeTopic(w)));
}
export function searchExercises(e:Exercise,query:string){
 const text=normalizeTopic(e.title+' '+e.concept+' '+e.task);
 const q=normalizeTopic(query);if(!q)return true;
 const area=Object.entries(AREAS).find(([,label])=>normalizeTopic(label)===q);if(area)return areaMatches(e.track,area[0]);
 const alias=TOPICS.find(t=>areaMatches(e.track,t.area)&&(normalizeTopic(t.label)===q||((t.area==='opening'||['peones','torres','torre','dama','damas','alfiles','caballos'].includes(q))&&t.words.some(w=>normalizeTopic(w)===q))));
 return alias?topicMatches(e,alias.id):q.split(' ').every(word=>text.includes(word));
}
export function matchesPractice(e:Exercise,p:Practice){return areaMatches(e.track,p.area)&&topicMatches(e,p.topic)&&searchExercises(e,p.query);}
