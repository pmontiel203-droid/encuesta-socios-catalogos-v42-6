# Encuesta Socios Catálogos — V42.6

Aplicación web para captura de entrevistas y análisis de comentarios de socios sobre catálogos y acordeones.

## Contenido

- `index.html`: interfaz de captura, dashboard, clasificaciones y exportaciones.
- `api/surveys.js`: API de persistencia y consulta con Neon Serverless.
- `clasificacion.js` y `clasificacion-datos.js`: reglas y catálogo de clasificación de comentarios.
- `resumen-ejecutivo.js`, `resumen-catalogo.js`, `dashboard-ejecutivo.js`, `catalogo-popover.js`, `registros-filtros.js`, `catalogos-unificados.js`: módulos fuente de análisis y presentación.
- `Guia_Seguimiento_Comentarios_Socios.pdf`: guía de seguimiento.
- `vercel.json`: configuración de publicación.

## Despliegue en Vercel

1. Importar este repositorio como proyecto independiente o conectar el repositorio al proyecto Vercel previsto.
2. Mantener `Framework Preset: Other` y raíz del proyecto `.`.
3. Configurar `DATABASE_URL` únicamente en las variables de entorno de Vercel; nunca guardar credenciales en GitHub.
4. Antes de usar datos reales, implementar y validar autenticación/autorización para las consultas del dashboard y registros. La captura pública debe habilitarse solo de acuerdo con la política operativa aprobada.
5. Probar con datos ficticios antes de promover a producción.

## Seguridad y datos

Este repositorio contiene código fuente, no una copia de la base de datos. No subir exportaciones de encuestas, respaldos JSON/CSV, archivos `.env`, contraseñas ni cadenas de conexión. Los comentarios, números de socio y nómina son datos que requieren acceso restringido.

**No publicar datos personales ni habilitar el dashboard de registros en producción hasta que las consultas estén protegidas.** La disponibilidad pública del repositorio no sustituye los controles de acceso de la aplicación.
