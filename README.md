# PACOTIZAR

Marketplace de solicitudes de cotización con un panel operativo para proveedores. Permite publicar necesidades, explorar solicitudes abiertas, descubrir proveedores destacados y, en el módulo de taller, administrar cotizaciones, clientes y servicios.

## Ejecutar el proyecto

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abre la URL local que muestre Vite, normalmente `http://localhost:5173`.

Para comprobar la compilación de producción:

```bash
npm run build
```

## Versión híbrida para celular

PACOTIZAR funciona como una PWA instalable. Usa la misma aplicación web en computador y celular, pero en el teléfono puede abrirse como una app independiente y conservar el shell básico en caché.

Archivos responsables:

- `public/manifest.webmanifest`: nombre, icono, colores y modo de instalación.
- `public/sw.js`: caché offline básica del shell de la aplicación.
- `index.html`: metadatos de instalación para Android y iPhone.

### Instalar en Android

1. Abre PACOTIZAR desde Chrome usando HTTPS.
2. Abre el menú del navegador.
3. Pulsa **Instalar aplicación** o **Añadir a pantalla de inicio**.

### Instalar en iPhone

1. Abre PACOTIZAR desde Safari usando HTTPS.
2. Pulsa **Compartir**.
3. Selecciona **Añadir a pantalla de inicio**.

Para publicar una aplicación nativa en Google Play o App Store, el siguiente paso sería envolver esta PWA con Capacitor y generar los proyectos Android/iOS.

## Qué incluye el MVP

### Dashboard

- Resumen de solicitudes abiertas, presupuesto y proveedores destacados.
- Feed de actividad reciente con información pública de las solicitudes.
- Acceso directo para publicar una solicitud.

### Solicitudes

- Busca solicitudes por título, descripción, ubicación, categoría y etiquetas.
- Filtra por categoría y consulta el detalle, presupuesto, etiquetas e imágenes vinculadas.
- Publica solicitudes con ubicación, presupuesto, categoría y etiquetas opcionales.
- Envía una propuesta con precio y mensaje; el autor de la solicitud y cada proveedor pueden consultar las propuestas permitidas por RLS.
- En **Mis solicitudes**, quien publicó puede cerrar o reabrir solicitudes, aceptar una propuesta (cierra la solicitud y marca las demás como no seleccionadas) o rechazar propuestas.
- En el panel de Supabase configurado, las solicitudes abiertas se leen mediante la función pública `get_open_quote_requests`; el alta requiere una sesión autenticada.
- Sin Supabase configurado, las solicitudes se guardan como datos locales de demostración.

### Cotizaciones

1. Pulsa **Crear cotización** o entra en **Cotizaciones**.
2. Completa el cliente y el vehículo.
3. Registra el presupuesto mínimo y máximo que puede pagar el cliente.
4. Añade notas sobre prioridades o ajustes posibles.
5. Selecciona servicios del catálogo y ajusta los precios.
6. Guarda la cotización.
7. Abre una cotización para ver su detalle, duplicarla o simular el envío por WhatsApp.

La cotización queda guardada como borrador en el demo. El total se calcula automáticamente a partir de las líneas de servicio.

### Clientes

Desde **Clientes** puedes buscar clientes, consultar teléfono, vehículo, visitas y valor acumulado, y agregar un nuevo cliente.

### Servicios

Desde **Servicios** puedes consultar el catálogo de precios que aparece en el formulario de cotización.

### Ajustes y monetización

Desde **Ajustes** puedes editar los datos del taller, consultar la sección de ingresos por anuncios, preparar la futura configuración de campañas publicitarias y restablecer los datos iniciales.

### Admin principal

La vista **Admin principal** está reservada para el administrador global. Permite revisar los negocios conectados, activar o desactivar su aparición como destacados y editar categoría, descripción y orden. Las operaciones requieren sesión de administrador en Supabase y la migración de marketplace.

La conexión real se hará con **Google OAuth desde Supabase Auth**. El navegador no debe recibir contraseñas ni refresh tokens. La cuenta, permisos y estado quedan registrados en `platform_admins` y `gmail_connections`, mientras el intercambio de tokens debe vivir en una Edge Function o Supabase Vault.

## Base de datos Supabase

El esquema inicial está en [supabase/schema.sql](supabase/schema.sql). Se ejecuta completo desde **Supabase Dashboard → SQL Editor → New query**.

Para habilitar la lectura pública de solicitudes y las propuestas, ejecuta también [supabase/marketplace.sql](supabase/marketplace.sql) después de `schema.sql`. El esquema base crea `quote_requests` como una vista de compatibilidad sobre `solicitudes_cotizacion`; la migración adicional trabaja con la tabla real y no intenta crear índices sobre esa vista. Los destacados ya usan `negocios_destacados` y la función existente del esquema base. La pantalla de solicitudes muestra un aviso con opción de reintento si RPC, migración o permisos no están disponibles.

En **Supabase → Authentication → URL Configuration**, agrega la URL local y el dominio de producción a las URLs de redirección para que los enlaces de recuperación de contraseña regresen a PACOTIZAR.

La configuración del proyecto está en `.env.local` y el cliente de navegador en [src/lib/supabase.js](src/lib/supabase.js). Como este proyecto usa Vite, las variables usan el prefijo `VITE_`; las variables `NEXT_PUBLIC_` de una guía Next.js no se leen automáticamente aquí.

El cliente Supabase persiste la sesión, refresca el token automáticamente y detecta retornos OAuth. No se usa middleware de Next porque este repositorio no tiene Next.js ni rutas server-side.

El esquema inicial incluye:

- Perfiles, talleres y miembros del taller.
- Clientes, vehículos, servicios y cotizaciones.
- Presupuesto mínimo, máximo y notas sugeridas por el cliente.
- Líneas de cotización con subtotal calculado.
- Campañas, impresiones, clics y conversiones de anuncios.
- Políticas RLS para aislar los datos de cada taller.
- Administradores globales y conexiones Gmail OAuth.

## Dónde está la lógica de cotización

La lógica de cotización está separada por capas:

- [src/components/ModalCotizacion.js](src/components/ModalCotizacion.js) construye y valida el formulario, incluido el aviso si el total supera el presupuesto máximo.
- [src/services/dataService.js](src/services/dataService.js) expone operaciones asíncronas para cotizaciones, clientes, servicios y perfil del taller.
- [src/store/state.js](src/store/state.js) centraliza el estado reactivo y su persistencia temporal.
- [src/router/router.js](src/router/router.js) coordina las rutas, vistas y eventos de la interfaz.

Los datos de cotizaciones, clientes y servicios del panel operativo todavía usan Store/localStorage. Las solicitudes publicadas y los proveedores destacados usan Supabase cuando está configurado; los datos de demostración locales solo se usan cuando Supabase no está configurado.

## Roles y permisos

- **Proveedor (`owner`)**: administra la información y las ofertas de su negocio.
- **Administrador del taller**: puede modificar y eliminar clientes, vehículos, servicios y cotizaciones de su taller.
- **Colaborador (`advisor`)**: puede apoyar la gestión operativa según los permisos de su cuenta.
- **Administrador principal**: controla la plataforma completa, talleres, feed, Gmail y reportes globales.

El acceso Supabase incluye registro, inicio de sesión, cierre de sesión desde el menú de cuenta y recuperación de contraseña por correo. El enlace de recuperación permite establecer y confirmar una contraseña nueva. Una sesión ausente se representa como visitante y no conserva permisos de proveedor. La UI protege la ruta de administrador principal, y las operaciones de destacados verifican además al administrador en Supabase. La autorización definitiva depende de las políticas RLS de [supabase/schema.sql](supabase/schema.sql) y [supabase/marketplace.sql](supabase/marketplace.sql).

## Feed de cotizaciones

El dashboard muestra actividad general en un feed anonimizado. No se publican nombres, notas, teléfonos, direcciones ni vehículos que puedan identificar al cliente; el diálogo **¿Puedes ser tú el siguiente?** invita a crear la primera cotización para participar.

## Persistencia de datos

La persistencia es híbrida durante esta etapa:

- Las sesiones se gestionan con Supabase Auth.
- Las solicitudes abiertas y los negocios destacados se leen y escriben en Supabase cuando está configurado.
- Cotizaciones, clientes y servicios del panel de taller siguen guardándose en `localStorage` (`cotizarapido-mvp`); también se pueden migrar datos desde la clave anterior `pacotizar-workspace-v2`.
- Sin Supabase configurado, la app usa estado local de demostración.
- **Restablecer demo** elimina el estado local y vuelve a los datos iniciales.

## Arquitectura actual

```text
index.html          Entrada HTML y metadatos
src/main.js         Carga estilos, registra el service worker e inicia el Router
src/store/          Estado global reactivo y persistencia temporal
src/router/         Navegación hash, guards por rol y coordinación de eventos
src/services/       API asíncrona de datos (adaptador actual de localStorage)
src/components/     Formularios, modales y feed anonimizado
src/views/           Renderizado de Dashboard, Cotizaciones, Clientes, Servicios, Ajustes y Admin
src/utils/            Formato, escape HTML e iconos compartidos
src/style.css       Sistema visual responsive
supabase/schema.sql Esquema PostgreSQL, RLS y monetización por anuncios
public/             Archivos públicos estáticos
```

El proyecto conserva el stack ligero de Vite y JavaScript vanilla definido para este workspace.

## Qué falta para producción

- Aplicar y validar `schema.sql` y `marketplace.sql` en el proyecto Supabase de producción.
- Crear automáticamente el taller y su primer miembro después del registro.
- Persistir cotizaciones, clientes y servicios del panel operativo en Supabase.
- Implementar edición y eliminación con confirmación y auditoría en la interfaz.
- Servicio de WhatsApp para enviar cotizaciones.
- Generación de PDF.
- Validación y manejo de errores en API.
- Sentry u otra herramienta de observabilidad.
- Integrar un proveedor o red publicitaria real y validar sus pagos.
- Configurar Google Provider en Supabase Auth y la Edge Function de Gmail.

## Flujo recomendado para probarlo

1. Con Supabase configurado, aplica ambos archivos SQL y comprueba el inicio de sesión.
2. Desde **Solicitudes**, prueba la búsqueda y el filtro por categoría.
3. Publica una solicitud y revisa su detalle en el mercado.
4. Usa **¿Olvidaste tu contraseña?** desde el acceso y valida el correo de restablecimiento.
5. Entra en **Cotizaciones** y crea una cotización operativa.
6. Registra un presupuesto mínimo y máximo, selecciona un servicio y comprueba el cálculo automático.
7. Guarda la cotización y abre su detalle.
8. Agrega un proveedor desde **Proveedores** y cambia el perfil desde **Ajustes**.
9. Con administrador global, modifica un destacado desde **Admin principal**.
10. Recarga la página para comprobar la persistencia y usa **Restablecer demo** para reiniciar los datos locales.

## Validación

El proyecto se valida con:

```bash
npm run build
```
