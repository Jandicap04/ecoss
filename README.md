# PACOTIZAR

MVP de un Micro-SaaS para talleres mecánicos. Permite crear cotizaciones profesionales, consultar clientes, administrar servicios y visualizar el estado comercial del taller.

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

- Resumen de cotizaciones, aprobación, ingresos y clientes.
- Gráfico de actividad semanal.
- Estado visual de conversión.
- Checklist de configuración del taller.
- Indicadores de operación y actividad del taller.

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

La vista **Admin principal** es una consola separada para el administrador global de la plataforma. Muestra talleres registrados, cotizaciones globales, ingresos por anuncios y el estado de la plataforma. También incluye el punto de entrada para conectar Gmail.

La conexión real se hará con **Google OAuth desde Supabase Auth**. El navegador no debe recibir contraseñas ni refresh tokens. La cuenta, permisos y estado quedan registrados en `platform_admins` y `gmail_connections`, mientras el intercambio de tokens debe vivir en una Edge Function o Supabase Vault.

## Base de datos Supabase

El esquema inicial está en [supabase/schema.sql](supabase/schema.sql). Se ejecuta completo desde **Supabase Dashboard → SQL Editor → New query**.

La configuración del proyecto está en `.env.local` y el cliente de navegador en [src/lib/supabase.js](src/lib/supabase.js). Como este proyecto usa Vite, las variables usan el prefijo `VITE_`; las variables `NEXT_PUBLIC_` de una guía Next.js no se leen automáticamente aquí.

El cliente Supabase persiste la sesión, refresca el token automáticamente y detecta retornos OAuth. No se usa middleware de Next porque este repositorio no tiene Next.js ni rutas server-side.

Incluye:

- Perfiles, talleres y miembros del taller.
- Clientes, vehículos, servicios y cotizaciones.
- Presupuesto mínimo, máximo y notas sugeridas por el cliente.
- Líneas de cotización con subtotal calculado.
- Campañas, impresiones, clics y conversiones de anuncios.
- Políticas RLS para aislar los datos de cada taller.
- Administradores globales y conexiones Gmail OAuth.

## Dónde está la lógica de cotización

La lógica temporal del MVP está en [src/main.js](src/main.js):

- `renderModal()` construye el formulario y muestra presupuesto mínimo, máximo y notas.
- `submitQuote()` valida el rango de presupuesto, calcula el total y guarda la cotización.
- `renderSettings()` muestra la sección de monetización por anuncios.

Cuando conectemos Supabase, esta lógica se separará en servicios de datos, pero esos son los puntos actuales que controlan la experiencia.

## Roles y permisos

- **Dueño del local**: administra su taller y tiene control total de clientes, servicios, vehículos y cotizaciones.
- **Administrador del taller**: puede modificar y eliminar clientes, vehículos, servicios y cotizaciones de su taller.
- **Asesor**: consulta clientes y servicios, y puede crear o actualizar cotizaciones según el flujo operativo.
- **Administrador principal**: controla la plataforma completa, talleres, feed, Gmail y reportes globales.

Estos permisos se aplican en Supabase mediante `is_workshop_manager()` y las políticas RLS de [supabase/schema.sql](supabase/schema.sql).

## Feed de cotizaciones

El dashboard muestra las cotizaciones más recientes en un feed anonimizado. No se publica el nombre, teléfono ni datos privados del cliente. El diálogo **¿Puedes ser tú el siguiente?** invita a crear la primera cotización para participar.

## Persistencia de datos

Este prototipo usa `localStorage` del navegador con la clave `cotizarapido-mvp`.

- Los cambios permanecen al recargar la página.
- Los datos no se comparten entre navegadores o dispositivos.
- La interfaz inicia sin datos demo y usa `localStorage` únicamente como estado temporal mientras conectamos Supabase.
- El SQL está preparado para usuarios reales, permisos, feed y sincronización con Supabase.
- **Restablecer demo** elimina los cambios locales y vuelve a los datos iniciales.

## Arquitectura actual

```text
index.html          Entrada HTML y metadatos
src/main.js         Estado, navegación, vistas y lógica de negocio del demo
src/style.css       Sistema visual responsive
supabase/schema.sql Esquema PostgreSQL, RLS y monetización por anuncios
public/             Archivos públicos estáticos
```

El proyecto conserva el stack ligero de Vite y JavaScript vanilla definido para este workspace.

## Qué falta para producción

- Supabase Auth para registro e inicio de sesión.
- Conectar las lecturas y escrituras del frontend con Supabase.
- Crear automáticamente el taller y su primer miembro después del registro.
- Migrar el feed local a `community_feed_posts`.
- Implementar edición y eliminación con confirmación y auditoría en la interfaz.
- Servicio de WhatsApp para enviar cotizaciones.
- Generación de PDF.
- Validación y manejo de errores en API.
- Sentry u otra herramienta de observabilidad.
- Integrar un proveedor o red publicitaria real y validar sus pagos.
- Configurar Google Provider en Supabase Auth y la Edge Function de Gmail.

## Flujo recomendado para probarlo

1. Abre el dashboard y revisa las métricas.
2. Entra en **Cotizaciones** y crea una nueva.
3. Registra un presupuesto mínimo y máximo.
4. Selecciona un servicio para comprobar el cálculo automático.
5. Guarda la cotización y abre su detalle.
6. Revisa que aparezcan el rango y las notas del presupuesto.
7. Agrega un cliente desde **Clientes**.
8. Cambia el nombre del taller desde **Ajustes**.
9. Recarga la página para comprobar que los cambios persisten.
10. Usa **Restablecer demo** para volver al estado inicial.

## Validación

El proyecto se valida con:

```bash
npm run build
```
