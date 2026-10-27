import {Chess,type Square} from 'chess.js';
import type {Exercise,Track} from './aia-curriculum';
import {TOPICS,topicMatches,topicAvailable} from './aia-topics';

// Lecciones propias. Las continuaciones son líneas de repertorio, no una
// afirmación de que toda alternativa legal sea inferior.
const openings:Record<string,string>={
 italian:'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7',
 spanish:'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O',
 scotch:'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 O-O O-O Bb6',
 sicilian:'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2 e5 Nb3 Be7 O-O O-O',
 caro:'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O Nc6 Be3 cxd4 Nxd4 Nxd4',
 scandinavian:'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 O-O e6 Bd2 Bb4',
 english:'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3 Nc6 O-O Be7 d3 O-O',
 french:'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7 f4 O-O Nf3 c5',
 'queens-gambit':'d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 cxd5 Nxd5',
 london:'d4 d5 Nf3 Nf6 Bf4 e6 e3 Bd6 Bg3 O-O Bd3 c5 c3 Nc6 Nbd2 b6',
};
const plans:Record<string,string>={
 italian:'El alfil de c4 apunta al entorno de f7. c3 y d3 sostienen el centro y permiten completar el desarrollo antes de abrirlo.',
 spanish:'El alfil de b5 presiona el caballo que sostiene e5; puede retirarse a a4 y b3. El centro y el desarrollo siguen siendo prioritarios.',
 scotch:'d4 abre pronto el centro. Tras exd4, el caballo recaptura en d4: compara su actividad con los tiempos que el rival gana atacándolo.',
 sicilian:'Las negras presionan d4 con c5. Tras el cambio central, las blancas buscan actividad y las negras contrajuego en columnas y centro.',
 caro:'c6 prepara d5. En la variante del avance, las negras sacan el alfil a f5 antes de e6 y después presionan el centro con c5.',
 scandinavian:'d5 desafía e4 inmediatamente. La dama puede recapturar en d5, pero deberá retirarse tras Cc3 para no perder más tiempos.',
 english:'c4 controla d5 desde el flanco. El fianchetto en g2 aumenta la presión sobre el centro y permite enrocar.',
 french:'e6 sostiene d5. El centro puede cerrarse con e5: las negras buscan romper la cadena de peones con c5.',
 'queens-gambit':'c4 presiona el peón d5. Las negras pueden sostenerlo con e6; ambos bandos desarrollan piezas antes de decidir los cambios centrales.',
 london:'El alfil sale a f4 antes de e3. d4, e3 y c3 forman una base sólida; hay que vigilar la presión negra con c5.',
};
type Case=[string,string,string,string,string,string];
// [título, concepto, situación, respuesta adecuada, alternativa A, alternativa B]
const cases:Record<string,Case[]>={
 fork:[
 ['Dos objetivos','Un ataque doble amenaza dos objetivos con una misma jugada.','Un caballo puede atacar a la vez rey y dama.','Calcular el jaque y la captura posterior de la dama','Sumar el valor de todas las piezas del tablero','Dar por ganada la dama sin revisar la respuesta'],
 ['La captura intermedia','Antes de un ataque doble hay que comprobar capturas y jaques rivales.','Tu caballo ataca dos torres, pero puede ser capturado.','Comprobar si la captura del caballo elimina ambas amenazas','Contar dos torres ganadas automáticamente','Ignorar todas las respuestas del rival'],
 ['Una amenaza es jaque','Un jaque obliga al rival a responder a la amenaza sobre su rey.','Una dama puede dar jaque y atacar una torre indefensa.','Revisar las defensas al jaque y si después se gana la torre','Capturar la torre sin esperar la jugada rival','Considerar que el rival debe mover siempre el rey'],
 ['Defender dos puntos','Una sola jugada defensiva puede responder a varias amenazas.','El rival amenaza tu alfil y dar mate en una.','Buscar primero una defensa al mate que atienda también al alfil','Salvar el alfil ignorando el mate','Capturar cualquier peón sin calcular'],
 ],
 pin:[
 ['Clavada absoluta','Una pieza está absolutamente clavada si moverla expondría su propio rey.','Una torre enemiga apunta a tu rey y tu alfil está entre ambos.','No retirar el alfil si con ello el rey queda en jaque','Mover el alfil a cualquier casilla','Tratar la posición como si el rey no estuviese detrás'],
 ['Clavada relativa','Una clavada relativa protege una pieza valiosa situada detrás, pero no impide legalmente moverse.','Tu caballo está delante de tu dama en una diagonal enemiga.','Calcular si mover el caballo compensa perder la dama','Afirmar que moverlo es siempre ilegal','Ignorar la dama situada detrás'],
 ['Aumentar la presión','Una pieza clavada puede tener dificultades para defenderse o retirarse.','Tienes un caballo rival clavado y puedes atacarlo con un peón.','Comprobar el avance y las respuestas que rompen la clavada','Avanzar sin comprobar capturas','Suponer que una clavada dura toda la partida'],
 ['Romper la clavada','Apartar el rey de una línea puede liberar una pieza clavada.','Tu caballo está clavado al rey y quieres activarlo.','Examinar mover el rey o interponer otra pieza con seguridad','Mover directamente el caballo dejando jaque','Sacrificar la dama por un peón sin relación'],
 ],
 mate:[
 ['Escapatorias del rey','Para que haya mate, el rey en jaque no debe tener defensa legal.','Puedes dar jaque, pero el rey dispone de una casilla libre.','Comprobar esa escapatoria antes de anunciar mate','Anunciar mate solo porque hay jaque','Ignorar las casillas de huida'],
 ['Incorporar atacantes','Un ataque necesita piezas coordinadas y cálculo concreto.','La dama ataca al rey rival sin apoyo y puede ser capturada.','Añadir apoyo o elegir otro plan antes de entregarla','Sacrificar siempre la dama por acercarse al rey','Contar solo las piezas atacantes e ignorar defensores'],
 ['Seguridad propia','Atacar no elimina las amenazas contra tu propio rey.','Amenazas mate en dos, pero el rival amenaza mate en una.','Resolver primero la amenaza inmediata contra tu rey','Continuar el ataque sin revisar el mate rival','Hacer una jugada de espera sin calcular'],
 ['Última fila','Los peones del enroque pueden limitar las escapatorias de su rey.','Tu rey está encerrado y una torre rival puede entrar con jaque.','Comparar una defensa de la entrada con abrir una salida segura','Mover la torre defensora sin revisar el mate','Avanzar cualquier peón sin mirar los ataques'],
 ],
 activity:[
 ['La pieza peor situada','Una pieza activa participa en amenazas, defensa o control de casillas útiles.','Tu caballo está sin función mientras las demás piezas colaboran.','Buscar una ruta segura hacia una casilla útil','Mover otra vez la pieza más activa sin propósito','Elegir una jugada solo por ser la más rápida'],
 ['Torres y columnas','Una columna abierta no contiene peones y puede servir de entrada a una torre.','Una torre no participa y tienes una columna abierta accesible.','Valorar ocuparla y controlar sus puntos de entrada','Colocar la torre donde bloquee a tu propio rey','Suponer que ocuparla gana automáticamente'],
 ['Coordinar alfil y peones','Un alfil necesita diagonales para participar.','Tus propios peones bloquean al alfil sin amenazas urgentes.','Preparar una ruptura segura o una nueva diagonal','Dejarlo inmóvil por el resto de la partida','Entregarlo por un peón sin compensación'],
 ['Intercambiar la pieza activa','Un cambio modifica la actividad de las piezas que quedan.','El rival quiere cambiar tu único alfil activo por un caballo sin función.','Valorar la posición posterior antes de aceptar el cambio','Aceptar porque toda simplificación es buena','Rechazar cualquier cambio sin examinarlo'],
 ],
 pawns:[
 ['Peón aislado','Un peón aislado no tiene peones amigos en columnas adyacentes.','El rival tiene un peón aislado central y no hay táctica urgente.','Estudiar bloquear su avance y aumentar la presión','Suponer que todo peón aislado pierde inmediatamente','Alejar todas las piezas del centro sin propósito'],
 ['Preparar una ruptura','Una ruptura de peones abre líneas y cambia las casillas disponibles.','Quieres abrir el centro, pero tus piezas siguen sin desarrollar.','Comparar la apertura de líneas con la seguridad de tu rey','Abrir el centro siempre sin contar piezas activas','Empujar todos los peones al mismo tiempo'],
 ['Peón pasado','Un peón pasado no tiene peones enemigos delante en su columna o las adyacentes.','Tu peón pasado puede avanzar, pero quedaría sin apoyo.','Calcular el bloqueo rival y coordinar el apoyo antes de empujarlo','Avanzarlo siempre porque no tiene peones delante','Cambiarlo gratis por una pieza que no puedes capturar'],
 ['Casilla débil','Una casilla que no puede defenderse con peones puede convertirse en punto de entrada.','Un caballo rival amenaza instalarse en una casilla central estable.','Examinar el control de esa casilla y la posibilidad de cambiar el caballo','Mover un peón lejano sin relación con la amenaza','Declarar perdida la partida sin buscar defensa'],
 ],
 defense:[
 ['Identificar la amenaza','Defender empieza por entender qué pretende el rival en la siguiente jugada.','El rival acaba de atacar tu dama.','Revisar capturas, retiradas y contraamenazas concretas','Ignorar el ataque para ganar un peón lejano','Suponer que el rival ha perdido el turno'],
 ['Profilaxis','La profilaxis busca prevenir un plan útil del rival.','El rival prepara una ruptura que abriría líneas contra tu rey.','Comparar impedirla con preparar una respuesta favorable','Esperar que nunca juegue la ruptura','Copiar su última jugada automáticamente'],
 ['Defensa activa','Una amenaza propia puede ser defensiva si responde concretamente al peligro rival.','Puedes dar un jaque que gana tiempo mientras defiendes una pieza.','Calcular la respuesta al jaque y comprobar que la pieza queda a salvo','Dar cualquier jaque sin mirar su respuesta','Afirmar que atacar siempre es mejor que defender'],
 ['Cambiar al atacante','Un cambio puede reducir el peligro si elimina una pieza atacante importante.','Puedes cambiar la dama rival mientras tu rey está inseguro.','Evaluar el final resultante y la reducción del ataque','Rechazar todo cambio por estar defendiendo','Aceptar el cambio aunque pierdas por fuerza'],
 ],
 promotion:[
 ['Elegir la promoción','Al coronar puedes elegir dama, torre, alfil o caballo.','Coronar dama ahogaría al rival, pero otra promoción conserva opciones de ganar.','Calcular una subpromoción y verificar las respuestas legales','Elegir siempre dama sin mirar la posición','Dejar el peón en la última fila sin promocionar'],
 ['Frenar al peón','El rival puede amenazar coronar con jaque.','Vas a ganar un peón, pero el rival coronaría dando jaque.','Comparar detener la coronación con un recurso forzante suficiente','Capturar el peón sin mirar la coronación','Suponer que una dama recién creada no puede dar jaque'],
 ['Apoyar la coronación','Un peón en séptima todavía necesita que su avance sea legal y seguro.','La casilla de coronación está ocupada por una pieza rival.','Liberarla o capturar legalmente en otra casilla de la última fila','Avanzar de frente capturando la pieza','Promocionar desde la séptima sin mover'],
 ['Promoción a caballo','Un caballo puede dar un jaque que una dama recién creada no daría.','Una promoción a caballo permite un ataque doble con jaque.','Calcular esa promoción y la posición después de responder al jaque','Elegir dama por valor nominal sin calcular','Creer que coronar caballo permite moverlo otra vez'],
 ],
};

export function completeFoundations(catalog:Exercise[]){
 const count=(track:Track,level:number,topic:string)=>catalog.filter(e=>e.track===track&&e.level===level&&topicMatches(e,topic)).length;
 for(const [topic,pgn] of Object.entries(openings)){
  const moves=pgn.split(' ');const c=new Chess();const positions=moves.map(san=>{const fen=c.fen();c.move(san);return fen;});
  for(let level=0;level<3;level++)for(let variant=0;variant<4&&count('opening',level,topic)<4;variant++){
   const index=4+level*4+variant,san=moves[index],probe=new Chess(positions[index]);const move=probe.move(san);
   const piece=({p:'peón',n:'caballo',b:'alfil',r:'torre',q:'dama',k:'rey'} as const)[move.piece];
   const purpose=move.flags.includes('k')?'El enroque aparta el rey del centro y acerca la torre al juego.':move.captured?'La captura cambia la estructura o el material; comprueba qué líneas quedan abiertas.':move.piece==='p'?'El avance modifica el control de casillas; comprueba su apoyo y las líneas que abre.':'La pieza ocupa '+move.to+'; examina las casillas que controla y qué amenazas atiende.';
   catalog.push({id:`foundation-${topic}-${level}-${variant}`,level,track:'opening',topics:[topic,'development'],title:TOPICS.find(t=>t.id===topic)!.label+' · '+['Primeros pasos','Desarrollo y seguridad','Conexión con el medio juego'][level]+' '+(variant+1),concept:plans[topic],task:'Continúa la línea de repertorio preparada. '+(level===0?'Busca el movimiento del '+piece+'.':'Compara desarrollo, centro y seguridad antes de mover.'),fen:positions[index],line:[san],explanation:purpose+' '+plans[topic]+' Otras jugadas legales pueden ser razonables; aquí practicamos esta continuación concreta.',hints:['Identifica el bando al turno y las amenazas inmediatas.','La continuación mueve el '+piece+' a '+move.to+'.']});
  }
 }
 for(const [topic,rows] of Object.entries(cases))for(const track of ['tactics','strategy','endgame'] as Track[]){
  if(!topicAvailable(topic,track))continue;
  for(let level=0;level<3;level++)for(let variant=0;variant<4&&count(track,level,topic)<4;variant++){
   const [title,concept,scenario,good,bad1,bad2]=rows[variant];const options=[good,bad1,bad2];const rotation=(level+variant)%3;const rotated=options.slice(rotation).concat(options.slice(0,rotation));
   catalog.push({id:`foundation-${track}-${topic}-${level}-${variant}`,level,track,topics:[topic],title:TOPICS.find(t=>t.id===topic)!.label+' · '+title+' · '+['Reconocer','Elegir un plan','Comparar riesgos'][level],concept,task:scenario+' '+['¿Qué comprobación básica debes realizar?','¿Qué plan responde mejor al problema?','¿Qué decisión evita valorar la posición por una sola ventaja aparente?'][level],options:rotated,answer:rotated.indexOf(good),explanation:good+'. '+concept+' El principio orienta tu decisión: en una partida hay que comprobar las jugadas concretas.',hints:['Distingue el peligro inmediato del beneficio que esperas conseguir.',concept]});
  }
 }
 // Mate en una y prevención del ahogado, con posiciones propias y ambos colores.
 for(let level=0;level<3;level++)for(let variant=0;variant<4&&count('endgame',level,'stalemate')<4;variant++){
  const c=new Chess();c.clear();
  const transform=(square:string):Square=>{let f=square.charCodeAt(0)-97,r=+square[1];if(level===1)f=7-f;if(level===2){f=7-f;r=9-r;}return (String.fromCharCode(97+f)+r) as Square;};
  const color=level===2?'b':'w',other=color==='w'?'b':'w';
  c.put({type:'k',color},transform('c6'));c.put({type:'q',color},transform('cdef'[variant]+'7'));c.put({type:'k',color:other},transform('a8'));
  const fen=c.fen().split(' ');fen[1]=color;const initial=fen.join(' ');const board=new Chess(initial),m=board.move({from:transform('cdef'[variant]+'7'),to:transform('b7')});
  if(!board.isCheckmate())throw Error('Posición de ahogado sin mate válido');
  catalog.push({id:`foundation-stalemate-${level}-${variant}`,level,track:'endgame',topics:['stalemate','queen-endings'],title:'Evitar el ahogado · red de mate '+(variant+1),concept:'Ahogado es quedarse sin jugadas legales sin estar en jaque: son tablas. Para dar mate debes dar jaque y eliminar todas las defensas.',task:'Da mate en una sin ahogar al rey rival. Revisa si tu jugada da jaque.',fen:initial,line:[m.san],explanation:'La dama da jaque en '+transform('b7')+' y controla las casillas de salida. El rey propio protege a la dama: el rival no puede capturarla ni escapar.',hints:['Busca una casilla para la dama junto al rey rival que esté protegida por tu rey.','Examina '+transform('b7')+' y comprueba que es jaque mate.']});
 }
}
