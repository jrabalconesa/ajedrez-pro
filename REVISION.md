# Revisión integral de Ajedrez PRO · 24/10/2026 · versión 1.4.0

## Fallos corregidos

| Hallazgo | Corrección | Comprobación |
| --- | --- | --- |
| Una búsqueda cancelada podía contaminar la siguiente y bloquear negras | Esperar al bestmove cancelado, descartar sus datos, avisar al quedar libre y priorizar el turno negro | Prueba de cancelación/reanudación y partida real con sugerencia activa |
| Sugerencia pendiente tras cambiar de posición | No consumir el intento mientras el worker sigue ocupado; recalcular al liberar el motor | Activación y respuesta automática después de 1.e4 |
| Análisis de otra posición o refresco antiguo reemplazaba datos nuevos | Verificación de partida, FEN, revisión y secuencia | Tests de estado y comprobaciones de código |
| Coordenadas UCI poco legibles | Validar y convertir cada variante a SAN española en el cliente y servidor | Tres variantes visibles en Analizar |
| Análisis local no incluido en las preguntas al chat | Compartir la valoración de la FEN actual y sanear el payload MCP de guardado | Comprobación de código y pruebas MCP de contrato |
| Solución de cuarta pista o alternativas sin cálculo | Solicitar automáticamente el análisis adecuado al abrirlas | Comprobación de flujo y de variantes |
| Modo Analizar podía disparar movimientos negros automáticos | Suspender respuesta de entrenamiento en esta vista y permitir ambos bandos | Cambio de jugada negra desde historial |
| Exportación durante revisión perdía movimientos posteriores | Exportar fullPgn, mantener pgn de la posición para contexto | Prueba de exportación desde cursor anterior |
| Variante conservaba análisis/resultado del origen | Limpiar análisis, resultado y solicitud al crearla | Tests de almacenamiento |
| Abandono no preparaba tablero inicial | Archivar resultado y crear nueva partida conservando ajustes | Navegador: historial 0/0 y 32 piezas |
| Límite implícito de 100 partidas listadas | Recorrer páginas del almacenamiento | Inspección del bucle y tests de aislamiento |
| Dependencia del backend para poder usar Pages | Adaptador local con las mismas reglas de partida | Tests de persistencia, variantes, conflictos y errores de guardado |

## Validación

- Tests de reglas, lenguaje natural, PGN/FEN, enroque, captura al paso y promoción.
- Tests de aislamiento por usuario, revisión de cambios, variantes y abandono/reinicio.
- Prueba de arranque UCI real de Stockfish 19 y respuesta a 1.e4.
- Tests de cancelación, mensajes UCI multilínea, cálculo incompleto, jugada ilegal y ruta del worker bajo /ajedrez-pro/.
- Tests del contrato MCP y recurso de tablero autocontenido.
- Typescript sin errores y builds del Site y de Pages como condición de publicación.
- Navegador de escritorio: 1.e4 con sugerencia activa, respuesta negra y sugerencia nueva; tres variantes; cambio de jugada del historial; recarga; abandono/reinicio.
- Ancho medido del tablero en los tres modos: 626 px en la misma ventana; sin desbordamiento horizontal en esa ventana.

## Límites y publicación

La comprobación visual realizada corresponde a la versión estática y a escritorio. Site/plugin comparten su interfaz y lógica, pero su autenticación y el chat incrustado requieren comprobación en la sesión del usuario. No se han simulado todas las dimensiones de móvil o tableta.

GitHub Pages es un destino adicional, con partidas locales al navegador. Las partidas existentes del Site conservan su almacenamiento. No hay sincronización automática: trasladar PGN cuando se necesite.

Crear el repositorio y activar Pages requiere administración de GitHub. Registrar el proyecto «Ajedrez- PRO» en Codex requiere una sesión de Codex; preparar código y workspace no equivale a registrarlo en la cuenta.
