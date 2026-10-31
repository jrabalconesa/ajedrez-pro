# Sincronización PRO

`pro-sync.json` registra los archivos comunes y sus SHA-256 al sincronizar Sites y GitHub. Los adaptadores de plataforma quedan fuera. `node scripts/check-pro-sync.mjs` enumera cambios desde la última sincronización.

La comprobación automática compara ambos lados con esa base: propaga cambios de un solo lado, detiene conflictos y valida antes de publicar. Se conserva la privacidad actual de Sites. No se copian datos de usuarios, credenciales, PDF personales ni estado de bases de datos al repositorio.

Los perfiles y el progreso se trasladan por copia JSON desde la propia aplicación. La sincronización de código no implica sincronización de datos personales.
