# PACOTIZAR - Estado actual

## Actualización del 4 de octubre de 2026

El diagnóstico siguiente describe la línea base anterior y quedó parcialmente desactualizado. Desde entonces:

- Se conectaron el inicio de sesión, el registro y el flujo de recuperación/actualización de contraseña con Supabase Auth.
- **Solicitudes** ahora tiene una vista propia, búsqueda, filtro de categoría, detalles y envío de propuestas.
- Las propuestas usan la tabla `request_offers` con políticas RLS para que solo el proveedor y el solicitante puedan verlas.
- En "Mis solicitudes", el solicitante puede cerrar/reabrir solicitudes y aceptar/rechazar ofertas; aceptar cierra la solicitud y declina las otras propuestas pendientes dentro de una única función transaccional de PostgreSQL.
- El administrador principal puede gestionar la visibilidad y el orden de los negocios destacados.
- Las lecturas del marketplace muestran un error explícito y permiten reintentar cuando falta la migración o falla la conexión.
- `marketplace.sql` se ajustó para reutilizar las tablas reales en español de `schema.sql`; `quote_requests` es una vista de compatibilidad, por lo que no se indexa.
- La cuenta ya tiene un menú funcional de cierre de sesión, los roles visibles usan términos del marketplace y una sesión Supabase ausente ya no hereda permisos ni nombre local obsoleto.

Pendiente de verificación externa: ejecutar `schema.sql` y luego la versión actual de `marketplace.sql` en Supabase, configurar las URLs de redirección de Auth y probar creación de solicitudes/propuestas con dos usuarios. La aceptación/rechazo de ofertas aún requiere una prueba en el proyecto Supabase real.

## Resumen ejecutivo

Pacotizar está en un estado de prototipo funcional, pero no en un estado de producto marketplace general completado. La aplicación actual corre y renderiza una interfaz con navegación, dashboard, cotizaciones, clientes, servicios y ajustes, pero sigue centrada en un modelo de taller mecánico y no en el objetivo general del producto: una persona publica una necesidad de cotización y los negocios/proveedores encuentran solicitudes relevantes y responden con ofertas.

La base del proyecto tiene buen avance técnico en estructura modular, pero la mayor parte del flujo real del marketplace está incompleta, no está integrada al UI principal ni ha sido verificada end-to-end. La capa de persistencia actual sigue siendo localStorage y no está conectada a Supabase como fuente de verdad real.

Prioridad general: HIGH

---

## Estado actual

### Proyecto
- El repositorio es un Vite + JavaScript vanilla con estructura modular.
- La app se ejecuta localmente y compila correctamente.
- Hay una intención real de marketplace (por ejemplo `marketplaceService.js`, `quote_requests`, `featured_businesses`), pero esa parte aún está parcialmente implementada y no integrada de forma consistente.
- El branding y la UI siguen muy orientados a taller/vehículos.

### Evidencia observada
- El README describe un MVP de talleres mecánicos, no un marketplace general.
- La app inicial carga en `#/dashboard` con navegación de taller y textos como "Tu taller", "Cotizaciones recientes" y "Resumen del taller".
- La herramienta de marketplace (`src/services/marketplaceService.js`) existe, pero no se usa desde la UI principal.
- Los componentes de solicitud y negocios destacados (`ModalSolicitud.js`, `NegociosDestacados.js`) existen, pero no están conectados a la aplicación principal.
- La configuración de Supabase existe en `src/lib/supabase.js`, pero la app principal todavía usa `localStorage` como fuente activa de datos.

---

## Funcionalidades terminadas y verificadas

Las siguientes funcionalidades se consideran terminadas solo porque se validaron en ejecución real y no solo porque existen archivos o código que las intentan implementar:

### 1) Shell de aplicación y navegación base
- La app carga correctamente en el navegador.
- La navegación principal funciona con hash routes.
- Las vistas de dashboard, cotizaciones, clientes, servicios y ajustes renderizan.
- Se verificó que los cambios de ruta funcionan en navegador real.

### 2) Dashboard visual funcional
- El dashboard renderiza métricas, estado visual y secciones de cotizaciones recientes.
- La interfaz responde y no arroja errores de runtime en la carga inicial.

### 3) Proceso básico de cotización local
- El flujo de creación de cotización en la UI funciona con estado local.
- Hay validación de presupuesto máximo y advertencia cuando el total supera el presupuesto.
- La lógica de cálculo/guardado se ejecuta sin errores en la app.

### 4) Gestión básica de clientes y servicios
- Puesto de agregar cliente y servicio desde la UI.
- El estado persiste en `localStorage` y se puede recargar.

### 5) Guards por rol
- El router restringe acceso a ajustes y admin según el rol.
- Se validó que la navegación se redirige al dashboard cuando el perfil no tiene permiso.

### 6) Compilación del proyecto
- `npm run build` ejecuta correctamente y genera el bundle de producción.

### 7) Separación de capas (arquitectura base)
- Se mantiene una estructura modular con `router`, `store`, `services`, `views`, `components` y `utils`.
- Esto es una base útil, aunque no garantiza funcionamiento de negocio completo.

---

## Funcionalidades incompletas

Las siguientes funciones están incompletas o no están integradas al objetivo real del producto:

### Marketplace general
- Publicación de solicitudes de cotización desde el usuario comprador no está conectada al flujo principal.
- No hay flujo real de publicación de solicitudes con validación, notificaciones ni listado atractivo para proveedores.
- No hay una experiencia de vendedor/proveedor navegando necesidades relevantes.

### Proveedores / negocios destacados
- `featured_businesses` existe en SQL y servicio, pero no aparece ni se utiliza en la app principal.
- La lógica de negocios destacados está a medio camino: hay componente, servicio y SQL, pero no está integrada al recorrido del usuario.

### Autenticación real
- No hay flujo de login/registro completo con Supabase Auth enlazado a la UI.
- La app no exige sesiones ni perfiles reales para operar.

### Persistencia real con Supabase
- El proyecto tiene cliente de Supabase y migraciones SQL, pero la app sigue usando `localStorage` como fuente activa.
- No se observó sincronización real entre frontend y base de datos en la sesión actual.

### Administración global
- La pantalla `Admin principal` es un placeholder vacío.
- No hay control real de talleres, solicitudes globales, ingresos, anuncio, o Gmail OAuth integrados.

### Feed de comunidad y marketplace
- La UI muestra un feed de comunidad, pero sigue encapsulado en un enfoque de taller y no en un marketplace de proveedores.
- El contenido no está conectado a una base de datos real ni a datos del usuario final.

### Monetización y anuncios
- La infraestructura de anuncios existe, pero no está conectada a flujo real de campañas ni validación de payouts.

---

## Errores encontrados

### 1) Desalineación del producto con el objetivo real
El producto todavía se comporta como un panel de taller mecánico, no como un marketplace general de solicitudes de cotización. Esto afecta la claridad del MVP y los requisitos.

### 2) Código parcialmente implementado no conectado
`src/services/marketplaceService.js`, `ModalSolicitud.js` y `NegociosDestacados.js` están presentes, pero no están siendo activados desde la navegación o flujo principal. Esto indica trabajo incompleto y no verificado.

### 3) Persistencia engañosa
La app parece más integrada a Supabase de lo que realmente está, porque el frontend permite llamadas a Supabase en servicio, pero el comportamiento operativo real sigue en localStorage. Esto puede generar falsa sensación de completitud.

### 4) UI principal antigua
Los textos, métricas y estructura visual se basan en taller, vehículo y operación local, no en un marketplace de solicitudes y proveedores.

### 5) Default de entorno no realista
El estado base define `role: 'admin'`, lo que da acceso de administración por defecto en la sesión local. Esto no refleja una app con autenticación real y puede ser peligroso en producción.

---

## Problemas de seguridad

### 1) Persistencia local sin backend real
El sistema guarda datos clave en `localStorage`, que no es una capa segura ni compartida. Esto no sirve para un marketplace serio ni para datos de negocio sensibles.

### 2) RLS y Supabase no están activados en el flujo real
El SQL tiene reglas de seguridad, pero el frontend no está conectando el producto real a ellas. La seguridad del sistema real todavía depende de la implementación final y no está verificada.

### 3) Falsa sensación de seguridad
Se tiene `src/lib/supabase.js` y SQL con RLS, pero no hay validación real de sesión ni autorización del servidor en la experiencia actual. Esto no debe tomarse como seguro ni productivo.

### 4) Exposición de modelo de negocio incompleto
Como el enfoque sigue siendo local y no autenticado, no hay separación clara entre roles reales, permisos y decisiones operativas del marketplace.

---

## Problemas de UX/UI

### 1) El producto no comunica claramente su propósito
La app se ve como un dashboard de taller, no como marketplace de cotizaciones. El usuario no entiende de inmediato que puede publicar necesidades y recibir propuestas.

### 2) Hay componentes de marketplace sin integración visual
Los componentes esperados para la experiencia de compra/solicitud no aparecen en la app principal.

### 3) Texto y branding inconsistentes
Hay mezcla de términos de taller, Pacotizar y marketplace. La identidad del producto no está consolidada.

### 4) Admin y configuración no tienen utilidad real
La pantalla de administración global está vacía, lo que reduce la confianza del usuario y del producto.

---

## Deuda técnica

- La base modular está bien, pero el producto final no está cohesionado.
- Hay lógica y componentes de marketplace sin integración real.
- El proyecto tiene mezcla entre enfoque de taller y objetivo general del marketplace.
- La capa de persistencia actual es local y no productiva.
- Hay SQL y servicios avanzados, pero no están elegidos como fuente de verdad.
- La UI está más orientada a prototipo que a producto real.

---

## Próximos pasos priorizados

### Prioridad 1 - Asegurar la visión del producto
- Definir claramente el modelo de marketplace general.
- Eliminar el enfoque de taller como centro del producto.
- Rediseñar el flujo de publicación de solicitud como eje principal.

### Prioridad 2 - Conectar la capa real de datos
- Elegir Supabase como sistema de verdad real.
- Implementar autenticación real con roles y permisos de usuario/proveedor/admin.
- Conectar la app a la base de datos y dejar `localStorage` solo como respaldo o estado temporal.

### Prioridad 3 - Integrar marketplace core
- Publicación de solicitudes.
- Búsqueda/filtrado por categoría, ubicación y etiquetas.
- Visualización de proveedores y negocios relevantes.
- Propuestas/cotizaciones reales desde proveedor a solicitud.

### Prioridad 4 - Completar admin y monetización
- Dashboard global real.
- Gestión de negocios destacados.
- Gestión de anuncios y eventos.
- Seguridad y auditoría.

### Prioridad 5 - UX final y observabilidad
- Revisar datos, microcopy, navegación y diseño.
- Agregar manejo de errores y validaciones.
- Preparar monitoreo y logs básicos.

---

## Conclusión

Pacotizar tiene una base útil y una app funcional como prototipo, pero aún no cumple el objetivo real del producto. La parte más importante no es la UI, sino alinear el producto, los datos, la seguridad y la experiencia real de marketplace. El proyecto necesita un re-centramiento y una integración más fuerte con Supabase y con el flujo de publicación y respuesta de solicitudes.

El estado actual del proyecto es viable como prototipo, pero no como producto marketplace listo para crecimiento real.
