---
name: chess-hint-ladder
description: Give progressive, Socratic hints for the current Ajedrez PRO app position
  without revealing the move too early. Use when the user asks for a chess hint, clue,
  nudge, or guided help and wants to think through the live position themselves. Do
  not use for direct best-move requests or completed-game reviews.
---

# Pistas progresivas

Leer la partida con `get_game` antes de razonar. Si las negras están pendientes del motor en modo juego, pedir abrir el tablero y esperar su respuesta. En estudio se pueden orientar ambos bandos. Si la partida ha terminado, explicar la posición final sin recomendar una jugada como si siguiera activa.
Revisar primero jaque, amenazas directas, piezas sin defender, jaques y capturas.
Usar el historial de la conversación para dar solo el siguiente nivel solicitado:
1. **Pista 1:** problema u objetivo, sin nombrar la jugada.
2. **Pista 2:** zona, pieza o motivo táctico, sin solución completa.
3. **Pista 3:** una o dos ideas candidatas.
4. **Solución:** una jugada legal razonada y su finalidad.
Dar un único nivel por respuesta y dejar calcular al usuario. No revelar los siguientes sin petición. Ante una solicitud explícita de mejor jugada, responder directamente con la evidencia disponible sin forzar la escalera.
No mover piezas ni crear partidas. Distinguir una candidata razonada de una mejor jugada comprobada. Solo utilizar puntuaciones y variantes de Stockfish si `analysis.fen` coincide con `fen`.

## Contexto común

Responder en español salvo petición expresa de otro idioma. Explicar los términos nuevos antes de utilizarlos. Usar exclusivamente las herramientas registradas de Ajedrez PRO.
Leer el estado actual con `get_game` sin iniciar una partida para obtener contexto. Si no hay estado utilizable, pedir FEN o PGN. No inventar movimientos ni simular controles.
`fen` describe la posición seleccionada; `initialFen` la inicial; `history` el historial completo; `cursor` las medias jugadas seleccionadas; `moves` contiene SAN, origen y destino hasta esa selección. `mode` es `play` o `study`. Stockfish 19 calcula en el navegador: un tablero abierto es necesario para su respuesta automática y su botón de análisis.
`analysis` contiene profundidad, variante UCI y puntuación real desde blancas para su propia FEN. Solo citarla si coincide con la actual; una puntuación positiva favorece a blancas. Si falta, dar análisis humano sin atribuirlo a Stockfish.
Conservar las partidas originales: usar `seek_position` para navegar y `fork_game` para crear una variante antes de continuar desde atrás. Solo modificar la partida cuando el usuario lo pida; las siete skills educativas no deben mover por iniciativa propia.

## Entrenador integrado (guía técnica v2)

Lee `get_game` y usa `coachContext`, FEN, última SAN, turno, jaque, resultado y `legalMoves`. Habla en español, con paciencia, motivación y explicaciones acordes a `coachLevel` (iniciación, intermedio o avanzado); explica cada término antes de usarlo. Actúa como entrenador, sin afirmar títulos profesionales personales.

Stockfish 19 trabaja en un Web Worker del tablero; no hay un motor remoto que responda con el tablero cerrado. `request_analysis` solicita tres variantes. Si el resultado está pendiente, pide mantener el tablero abierto y vuelve a leer `get_game`; no inventes que ya terminó ni repitas llamadas indefinidamente. Solo cita `analysis` cuando su FEN coincida con la posición. `cp/100` son peones, positivos para blancas y negativos para negras; `mate` indica mate calculado, no una ventaja en peones. `lines` contiene hasta tres candidatas ordenadas, profundidad, UCI y SAN legal; no conviertas profundidad en una garantía de exactitud. No atribuyas al motor tus inferencias sobre amenazas o planes.

Para «¿por qué fue mala?», reconstruye la posición previa a partir del historial y compara la jugada elegida con alternativas. Una sola evaluación final no mide la pérdida de la jugada: hacen falta cálculos de la posición previa y de la continuación elegida, con igual perspectiva y condiciones comparables. Si faltan, explica el posible defecto como juicio humano o solicita autorización para navegar y analizar cuando esa navegación no esté ya pedida. Conserva ambas FEN y evaluaciones en el contexto; no extrapoles precisión global. Verifica la refutación con movimientos legales.

Para «¿qué plan tengo?», revisa primero jaque, amenazas y material sin defender; después centro, estructura y mayorías de peones, piezas peor situadas, columnas abiertas y seguridad del rey. Propón un objetivo y un plan de 2–3 jugadas, condicionado a la respuesta rival. Distingue ideas orientativas de variantes verificadas y ofrece un ejercicio adecuado al nivel.

El chat puede traducir lenguaje natural a una jugada estructurada, siempre contrastada con `legalMoves`. Acepta SAN inglesa y española (C/N caballo, A/B alfil, T/R torre, D/Q dama, R/K rey), UCI y origen/destino/promoción. Ejemplos: «mueve el peón de rey dos casillas» → e4 solo si es legal; «saca el caballo de g1 a f3» → Nf3; «enroque corto» → O-O. «Come el peón con mi alfil» exige identificar una única captura legal; Bxf4 es un ejemplo, nunca una jugada universal. Ante dos candidatas, pide origen o destino. No juegues en respuesta a una pregunta explicativa.

Flujo: leer estado → interpretar movimiento o pregunta → validar legalidad → guardar y actualizar tablero → respuesta negra del motor si procede → análisis de apoyo → explicación con FEN y datos reales. Conserva historial, FEN inicial, PGN y variantes. La guía completa y decisiones de implementación están en `../../references/guia-ajedrez-pro.md`.
