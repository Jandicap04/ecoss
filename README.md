# CotizaRápido

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

## Qué incluye el MVP

### Dashboard

- Resumen de cotizaciones, aprobación, ingresos y clientes.
- Gráfico de actividad semanal.
- Estado visual de conversión.
- Checklist de configuración del taller.
- Banner de prueba gratuita de 7 días.

### Cotizaciones

1. Pulsa **Crear cotización** o entra en **Cotizaciones**.
2. Completa el cliente y el vehículo.
3. Selecciona servicios del catálogo.
4. Ajusta los precios si es necesario.
5. Guarda la cotización.
6. Abre una cotización para ver su detalle, duplicarla o simular el envío por WhatsApp.

La cotización queda guardada como borrador en el demo. El total se calcula automáticamente a partir de las líneas de servicio.

### Clientes

Desde **Clientes** puedes buscar clientes, consultar teléfono, vehículo, visitas y valor acumulado, y agregar un nuevo cliente.

### Servicios

Desde **Servicios** puedes consultar el catálogo de precios que aparece en el formulario de cotización.

### Ajustes y suscripción

Desde **Ajustes** puedes editar los datos del taller, ver el estado de la prueba gratuita, abrir la comparación de planes, simular la activación del plan Profesional y restablecer los datos iniciales.

## Navegación rápida

| Vista | Uso |
| --- | --- |
| Resumen | Métricas y actividad del taller |
| Cotizaciones | Crear y revisar propuestas |
| Clientes | Consultar y agregar clientes |
| Servicios | Revisar precios disponibles |
| Ajustes | Editar el perfil y el plan |

En móvil, el menú lateral se abre con el botón de menú de la barra superior.

## Persistencia de datos

Este prototipo usa `localStorage` del navegador con la clave `cotizarapido-mvp`.

- Los cambios permanecen al recargar la página.
- Los datos no se comparten entre navegadores o dispositivos.
- No hay todavía usuarios reales ni sincronización con un servidor.
- **Restablecer demo** elimina los cambios locales y vuelve a los datos iniciales.

## Arquitectura actual

```text
index.html       Entrada HTML y metadatos
src/main.js      Estado, navegación, vistas y lógica de negocio del demo
src/style.css    Sistema visual responsive
public/          Archivos públicos estáticos
```

El proyecto conserva el stack ligero de Vite y JavaScript vanilla definido para este workspace. No se añadió Next.js todavía porque esta entrega está enfocada en validar la experiencia antes de conectar infraestructura externa.

## Qué falta para producción

- Supabase Auth para registro e inicio de sesión.
- PostgreSQL/Supabase para talleres, clientes, servicios y cotizaciones.
- Row Level Security para separar los datos de cada taller.
- Stripe para suscripciones y prueba gratuita real.
- Webhooks para renovaciones y cancelaciones.
- Servicio de WhatsApp para enviar cotizaciones.
- Generación de PDF.
- Validación y manejo de errores en API.
- Sentry u otra herramienta de observabilidad.

## Flujo recomendado para probarlo

1. Abre el dashboard y revisa las métricas.
2. Entra en **Cotizaciones** y crea una nueva.
3. Selecciona un servicio para comprobar el cálculo automático.
4. Guarda la cotización y abre su detalle.
5. Agrega un cliente desde **Clientes**.
6. Cambia el nombre del taller desde **Ajustes**.
7. Activa el plan Profesional en modo demo.
8. Recarga la página para comprobar que los cambios persisten.
9. Usa **Restablecer demo** para volver al estado inicial.

## Validación

El proyecto se valida con:

```bash
npm run build
```

La compilación actual se completa correctamente con Vite.
