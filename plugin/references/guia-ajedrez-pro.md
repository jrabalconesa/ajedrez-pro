# Guía técnica Ajedrez PRO · Arquitectura propia

Documento técnico y arquitectura del plugin Ajedrez PRO


1. Arquitectura General del Sistema

La experiencia interactiva de Ajedrez PRO dentro de un entorno de chat de LLM combina procesamiento
de lenguaje natural, un motor de ajedrez determinista y una interfaz visual dinámica.

Componentes Clave:
 • Interfaz de Chat e Interfaz Visual (Renderizado): Muestra el tablero al usuario mediante
   bloques visuales (imágenes estáticas regeneradas o un canvas interactivo) y recibe la entrada en
   texto.

 • Motor de Gestión de Estado (Chess.js / FEN): Mantiene la lógica del juego, valida la legalidad
   de los movimientos, detecta jaques, mates y tablas, y exporta el estado en formato FEN (Forsyth-
   Edwards Notation) o PGN (Portable Game Notation).

 • Motor de Análisis (Stockfish WASM/API): Evalúa las posiciones en segundo plano para
   obtener la evaluación matemática, las mejores jugadas de la posición (líneas críticas) y las
   amenazas del rival.

 • Orquestador LLM (Prompt System): Traduce el lenguaje natural a comandos estructurados y
   convierte los datos numéricos brutos de Stockfish en explicaciones estratégicas humanas.


2. Traducción de Lenguaje Natural a Notación Algebraica
Estándar (SAN)

El sistema debe mapear las instrucciones informales del usuario a un formato que la librería de
ajedrez entienda. A continuación se detallan los flujos de traducción sugeridos para el LLM:




                                                                                                      1

 Entrada de Usuario (Lenguaje                                                 Notación Estándar
                                       Interpretación del LLM
 Natural)                                                                     (SAN)

 "Mueve el peón de rey dos casillas    Apertura de peón de rey desde e2 a
                                                                              e4
 adelante"                             e4

 "Saca el caballo de la derecha a la
                                       Caballo de g1 se mueve a f3            Nf3
 casilla f3"

                                       Identificar qué alfil puede capturar
 "Come el peón con mi alfil"                                                  Bxf4 (ejemplo)
                                       un peón

 "Enroque corto" o "Enroque del lado
                                       Movimiento especial de enroque rey     O-O
 del rey"



3. Diseño de Prompts y Flujo de Análisis Táctico

Para lograr el enfoque educativo del plugin, el LLM debe asumir el rol de un entrenador maestro.
Cuando el usuario hace preguntas sobre la posición, el orquestador debe estructurar una llamada al
motor y pasarle los resultados al modelo utilizando el siguiente esquema de prompt del sistema:



  [SYSTEM PROMPT - MÓDULO ENTRENADOR DE AJEDREZ]
  Eres un gran maestro de ajedrez y un pedagogo paciente. Tu objetivo es explicar
  la posición actual del tablero sin limitarte a dar variantes numéricas
  difíciles de entender.


  Datos provistos en cada turno:
  - Estado FEN actual: {FEN_ACTUAL}
  - Último movimiento: {ULTIMO_MOVIMIENTO}
  - Evaluación de Stockfish: {EVAL_MOTOR} (ej. +1.5, -0.8, o M5)
  - Tres mejores jugadas sugeridas: {MEJORES_JUGADAS}


  Instrucciones de respuesta según la consulta:
  1. Si el usuario pregunta "¿Por qué este movimiento es malo?": Compara la
  evaluación del movimiento realizado con la mejor jugada propuesta por el motor.
  Explica la refutación táctica (ej. deja una pieza colgada, pierde una línea
  crítica, debilita el enroque).
  2. Si el usuario pregunta "¿Qué plan tengo ahora?": Identifica los temas
  posicionales principales basándote en el FEN (control del centro, mayoría de
  peones, piezas mal ubicadas, columnas abiertas) y sugiere un plan general a 2 o
  3 jugadas.
  3. Habla siempre en un tono motivador y adaptado al nivel del usuario.




                                                                                                     2

4. Pipeline Técnico de Ejecución (Flujo de Trabajo del Turno)

 • Paso 1: Recepción: El usuario escribe una jugada o una pregunta en el chat.

 • Paso 2: Parseo: El backend valida si la entrada es un movimiento. Si es texto plano, el LLM
  extrae la jugada en SAN. Si es una pregunta, salta al Paso 5.

 • Paso 3: Validación e Inyección: Se pasa el movimiento SAN a la instancia de chess.js. Si es
  legal, el estado FEN se actualiza.

 • Paso 4: Turno de la IA: Si es una partida en tiempo real contra la máquina, se invoca a Stockfish
  con el FEN actual, se calcula la respuesta del bot en un tiempo límite (ej. 500ms, profundidad 12)
  y se ejecuta en el tablero.

 • Paso 5: Evaluación de Soporte: Stockfish calcula la evaluación de la posición resultante y las
  amenazas latentes.

 • Paso 6: Generación de Respuesta y Renderizado: El LLM recibe el prompt con los datos
  técnicos enriquecidos y redacta la respuesta textual. En paralelo, se genera una imagen del
  tablero a partir del FEN para mostrar la nueva posición de forma visual en la interfaz del chat.


5. Stack de Herramientas Recomendado para tu Plugin

 • Lógica del Juego (Backend): chess.js (Node.js/Python-Chess) para validar reglas y mantener
  el estado.

 • Motor de Ajedrez: Stockfish.js (compilado en WebAssembly) ejecutándose del lado del
  servidor o en un worker para no bloquear el chat.

 • Renderizado del Tablero: Servidor de imágenes dinámico que tome un FEN y devuelva un
  PNG/SVG plano legible por la interfaz de chat, o un componente enriquecido UI si la plataforma
  del plugin permite Javascript en el frontend (ej. iFrames o Sandboxed Widgets).




                                                                                                       3



## Implementación en Ajedrez PRO
Chess.js es la autoridad de reglas; Stockfish 19 se ejecuta en un Worker propio y aislado; el tablero y el almacenamiento de partidas también son propios. El chat realiza la interpretación semántica; el backend resuelve entradas comunes inequívocas y rechaza ambigüedades. La sugerencia educativa usa una búsqueda rápida de unos 450 ms y el análisis MultiPV de tres variantes usa unos 950 ms, mostrando siempre la profundidad real alcanzada. La respuesta del motor dispone de su propio presupuesto y no bloquea la interfaz. No se añade una API LLM ni credenciales: ChatGPT es el orquestador. No se añaden imágenes estáticas porque ya existe una vista interactiva.
