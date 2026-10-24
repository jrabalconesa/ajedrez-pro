# Ajedrez- PRO

Entrenador personal de Jose, interfaz española y nivel de referencia >800 ELO.

- Mantener el Site `appgprj_6ad67ff6c4ac81919eea69b821e4b153`, su identidad y sus partidas. Nunca registrar otro Site para una actualización.
- Aprender es la vista inicial; Jugar/Aprender/Analizar comparten tablero y tamaño. Cambiar de vista conserva la partida.
- Site y GitHub Pages usan los mismos componentes, reglas y motor Stockfish 19. Site guarda por usuario en R2; Pages guarda localmente. No prometer sincronización entre ambos.
- Compartir la lógica de cambios de partida en `lib/game-operations.ts`. Las variantes conservan la línea original. Abandonar guarda el resultado y crea un tablero inicial.
- Mantener sugerencias opcionales, pistas progresivas y distinción explícita entre observaciones del entrenador y análisis de Stockfish.
- No iniciar una búsqueda UCI nueva antes de recibir el bestmove de la cancelada. No aplicar resultados de otra partida, revisión o FEN. El turno negro tiene prioridad sobre el análisis educativo.
- Validar cada jugada con chess.js y las variantes completas antes de mostrarlas. Usar notación española en pantalla y SAN estándar en PGN.
- Comprobar con `npm test`, `npm run typecheck`, `npm run build:pages`; regenerar el widget con `node scripts/prepare-widget.mjs` antes de construir el Site.
- El objetivo de Pages es `https://jrabalconesa.github.io/ajedrez-pro/`. Publicar solo el resultado de `pages-dist`, nunca sustituir gh-pages por código fuente.
- No incluir credenciales ni partidas personales en Git. Conservar licencias de Stockfish.
