# Ajedrez- PRO

**Ajedrez PRO - Aprende, juega y mejora**, entrenador personal de Jose con Stockfish 19, chess.js y React. Tres vistas de una misma partida: Aprender (predeterminada), Jugar y Analizar.

## Dos destinos desde un mismo código

| Destino | Dirección | Guardado |
| --- | --- | --- |
| Site y plugin de ChatGPT | https://ajedrez-pro.joserabalconesa.chatgpt.site | R2 por usuario autenticado; conserva las partidas existentes |
| GitHub Pages | https://jrabalconesa.github.io/ajedrez-pro/ (objetivo; verificar despliegue) | En el navegador, sin servidor ni sesión de ChatGPT |

GitHub Pages aloja archivos estáticos; no ejecuta las rutas `/api/game` ni `/mcp`. El adaptador `lib/local-game-service.ts` utiliza las mismas reglas de `lib/game-operations.ts` y guarda en localStorage. Los dos destinos no sincronizan partidas automáticamente. Exportar PGN completo e importarlo en el otro destino permite trasladar una partida. Borrar los datos del navegador elimina sus partidas locales: exportar antes las que se deseen conservar.

Los botones de preguntas abren el chat cuando el tablero está incrustado en ChatGPT; en la web copian pregunta y posición. El motor y los comentarios basados en reglas funcionan sin SmartChess. No hay una API LLM externa en Pages.

## Desarrollo y comprobación

Requisitos: Node 24 y pnpm 11.25.0.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm run typecheck
pnpm run build:pages
```

`pages-dist/` contiene el sitio estático publicable, con rutas relativas compatibles con `/ajedrez-pro/`. Servir con un servidor HTTP; no abrir como `file://` porque Stockfish usa Web Workers.

Para el Site:

```sh
node scripts/prepare-widget.mjs
npm run build
```

Conservar `.openai/hosting.json` y seguir el flujo Sites de guardar fuente y desplegar. Nunca subir estado de `.wrangler`, credenciales o datos personales.

## Abrir en Codex como «Ajedrez- PRO»

Abrir esta carpeta o `Ajedrez-PRO.code-workspace` en el editor y añadirla como proyecto de Codex con ese nombre. `AGENTS.md` conserva las instrucciones del proyecto. Para Codex web, seleccionar el repositorio `jrabalconesa/ajedrez-pro` al crear su entorno. La presencia de estos archivos no registra por sí sola un proyecto en la cuenta de Codex.

## Publicar en GitHub Pages

1. Crear o seleccionar el repositorio `jrabalconesa/ajedrez-pro`, con rama `main`.
2. Subir este código sin `node_modules`, `dist`, `pages-dist`, `.sites-runtime` ni `.wrangler`.
3. En Settings → Pages → Build and deployment, elegir **GitHub Actions**.
4. El workflow `.github/workflows/pages.yml` comprueba tipos, reglas, almacenamiento y motor, construye Pages y publica el artefacto.
5. Comprobar que el workflow y el despliegue terminan correctamente antes de dar por activa la dirección.

## Revisión 1.4.0

- Cancelación del motor drenada antes de una búsqueda nueva, con reintento controlado y protección contra resultados antiguos.
- Despertar del turno negro tras interrumpir sugerencias, y botón de reintento si falla el cálculo.
- Sugerencias activables, solución de cuarta pista y alternativas calculadas automáticamente cuando se solicitan.
- Variantes legales convertidas a SAN legible y notación española.
- Modo Analizar permite ambos bandos; no dispara una respuesta negra de entrenamiento al revisar una posición.
- Protección contra respuestas antiguas del refresco periódico y mejor rendimiento al renderizar la guía.
- PGN completo al exportar aunque se esté revisando una posición anterior.
- Historial y variantes conservados; reinicio a posición inicial tras abandonar.
- Adaptador estático de Pages y tests de persistencia, cancelaciones, legalidad y aislamiento de usuarios.

Los comentarios del entrenador son observaciones de reglas; una pérdida forzada o un error de centipeones solo debe afirmarse con un análisis apropiado. El rendimiento depende del dispositivo. Consultar `REVISION.md` para el resultado de las comprobaciones.

## Licencias

Stockfish 19: GPLv3. Copia en `public/engine/COPYING.txt` y, al construir Pages, `engine/COPYING.txt`. Fuente y versión del motor distribuido: https://github.com/nmrugg/stockfish.js/tree/v19.0.1 . Chess.js y las restantes dependencias conservan sus respectivas licencias. No se necesitan claves API para jugar ni analizar.

## AIA · Aprendizaje Interactivo Adaptativo (v1.5)

Sección independiente de la partida: 56 ejercicios originales en siete etapas y cuatro áreas (aperturas, táctica y cálculo, estrategia y finales). Incluye perfiles, sesiones reanudables, pistas, corrección activa, variantes preparadas, historial y repaso espaciado. El ELO de cada etapa solo orienta el temario. El catálogo inicial avanzado no equivale a una formación completa de maestría.

El avance por área requiere tres aciertos consecutivos sin ayuda, dos ejercicios y práctica en dos días. Los errores se repasan al día siguiente; tras resolver sin ayuda, el intervalo aumenta a 3, 7, 14 y 30 días. Dos errores recientes en un área proponen refuerzo de una etapa anterior. La selección manual de etapa no acredita dominio.

Sites guarda el progreso por usuario en R2 mediante escrituras condicionales; GitHub Pages lo conserva por perfil en localStorage. No existe sincronización de progreso entre ambas plataformas. El tablero de ejercicios no modifica las partidas.

`npm test` regenera el widget autocontenido antes de comprobar MCP y valida también el catálogo y el motor adaptativo. Para regenerarlo sin pruebas: `node scripts/prepare-widget.mjs`. No editar los archivos generados a mano.

Referencias de la ruta: [planes por nivel de Chess.com](https://www.chess.com/article/view/study-plan-directory), [estrategia intermedia](https://www.chess.com/article/view/study-plan-for-intermediate-players-strategy2), [ECU CiE](https://edu.europechess.org/cie-package/) y [lecciones interactivas](https://support.chess.com/en/articles/8609703-how-do-lessons-work-on-chess-com). Contenidos y reglas adaptativas originales.

## Entrenamiento integrado · v1.8

AIA reúne sesión diaria, comprobación por áreas, escuela de aperturas y ejercicios personales procedentes de la revisión de partidas. El selector «Reto» prioriza posiciones de varias jugadas y hasta una etapa adicional; no certifica un ELO. Las nuevas aperturas trasladan los cursos de Entrenador, con prácticas progresivas de ambos bandos y explicaciones de los movimientos rivales. La escuela conserva el orden de los doce cuadernos: Italiana, Española, Escocesa, Contra Siciliana, Contra Francesa, Contra Caro-Kann, Caro-Kann, Escandinava, Eslava, Gambito de Dama Rehusado, Contra Londres y Aperturas poco frecuentes. Las primeras fases enseñan el repertorio; las posteriores comienzan desde posiciones más avanzadas.

Se incorporan 600 problemas adicionales de la base oficial Lichess CC0, con rating del problema 1200–2399, al menos seis medias jugadas en el registro original y filtros de popularidad/uso. El archivo `lib/lichess-expanded.json` conserva identificador, FEN original, movimientos UCI, rating y temas. La posición de entrenamiento se obtiene después de aplicar la jugada inicial del rival. Todas las secuencias se validan con chess.js; su legalidad no equivale a demostrar que no existe ninguna otra solución.

En «Revisar partida», «Guardar como ejercicio AIA» permite practicar una alternativa preparada con Stockfish dentro del perfil activo. Los resultados y repasos usan las mismas reglas AIA. El entrenador anterior se conserva: su historial no se migra automáticamente entre orígenes; sus partidas se trasladan mediante PGN. No se han retirado sitios ni borrado datos.
