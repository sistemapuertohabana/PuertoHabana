# 📄 Propuesta del Sistema **Puerto Habana**

## 1️⃣ Requerimientos del proyecto

| Área | Funcionalidad solicitada | Detalle |
|------|--------------------------|---------|
| **Unificación de paneles** | Dashboard homogéneo y premium para **Mozo**, **Cocina**, **Lavaplato**, **Desarrollador** y **Admin** | Navegación, colores, tipografías, micro‑animaciones y diseño “glassmorphism”. |
| **Sincronización de pagos** | El **Admin** registra pagos → se reflejan automáticamente en la sección **Pagos** del empleado correspondiente (Mozo, Cocina, Lavaplato y Desarrollador). |
| **Perfil y rol correctos** | Cada usuario ve su nombre real y el rol adecuado (ej. “Desarrollador”). |
| **Inventario dinámico** | Los ítems del inventario se cargan desde la API y se actualizan en tiempo real; el stock se descuenta al registrar un pedido. |
| **Modo offline** | Cuando el internet falla, la app sigue operativa usando **localStorage** como respaldo y guarda en cola los cambios para sincronizarlos al reconectar. |
| **Seguridad básica** | Acceso a cada portal mediante URLs privadas y validación de sesión en localStorage. |
| **Estética premium** | Paleta de colores armoniosa, tipografía **Inter**, sombras suaves, efectos hover y transiciones fluidas. |
| **Escalabilidad** | Código modular y preparado para añadir nuevos módulos o integrar Firebase/ Supabase sin romper la arquitectura. |

---

## 2️⃣ Cómo usar la aplicación

1. **Login**
   - Cada rol tiene su propia página de login (`/login‑mozo`, `/login‑cocina`, `/login‑lavaplato`, `/login‑desarrollador`, `/login‑admin`).
   - Se guarda la sesión en `localStorage` (`ph_<portal>_session`).

2. **Dashboard**
   - Al ingresar, el usuario ve su **dashboard** con barra de navegación y accesos a:
     - **Perfil** (editar nombre, foto, datos de contacto).
     - **Pagos** (ver historial y detalle de ingresos).
     - **Inventario** (solo Mozo y Admin pueden crear/editar ítems).

3. **Registrar un pedido (Mozo)**
   - Selecciona el plato/bebida/taper desde el **menú cargado dinámicamente**.
   - Al confirmar, se envía un `PATCH` a `/api/inventario/:seccion` con `{ id, delta: -1 }` para descontar stock.

4. **Registrar un pago (Admin)**
   - En **Admin → Registro de pagos**, selecciona al personal → el salario y concepto se autocompletan.
   - Si la conexión está caída, el pago se guarda en `localStorage` y se sincroniza automáticamente cuando haya red.

5. **Modo offline**
   - La UI sigue funcionando; cualquier cambio (nuevo ítem, pago, edición de perfil) se guarda localmente.
   - Al volver a estar online, la app detecta el evento `ph_store_update` y envía los datos pendientes al servidor.

---

## 3️⃣ Arquitectura y flujo de datos

```
┌───────────────┐   fetch/POST/PATCH   ┌─────────────────────┐
│   Front‑End   │ ──────────────────► │  Supabase API / DB  │
│ (Next.js 13) │   (REST)            │  (usuarios, pagos,  │
├───────────────┤                     │   inventario)       │
│   localStorage│ ◄───────────────────│  (fallback offline) │
│   (caché)    │   sync on reconnect │                     │
└───────────────┘                     └─────────────────────┘
```
- Cada vista usa **hooks** (`useEffect`, `subscribeInventario`) que escuchan el evento `ph_store_update`.
- Los **datos críticos** (personal, inventario, pagos) se persisten en `localStorage` con la clave `ph_inventario`.
- El **router** de Next.js (app router) gestiona rutas protegidas mediante la comprobación de la sesión en `localStorage`.

---

## 4️⃣ Los 4 dashboards funcionales

| Dashboard | Módulos principales | Comentario de UI |
|-----------|---------------------|------------------|
| **Mozo** | - Menú dinámico (comida, bebidas, tapers)  <br> - Historial de pedidos  <br> - Perfil y pagos | Barra de navegación azul‑gris, tarjetas con sombra ligera, micro‑animaciones al hacer click. |
| **Cocina** | - Lista de órdenes pendientes  <br> - Detalle de cada orden  <br> - Historial de platos preparados | Fondo oscuro con acentos naranja, resaltado de órdenes nuevas con efecto “pulse”. |
| **Lavaplato** | - Inventario de utensilios y platos  <br> - Registro de pagos del personal de lavado  <br> - Perfil | Paleta cian‑gris, cajas con efecto glassmorphism y bordes redondeados. |
| **Desarrollador** | - Perfil del dev (nombre, foto, rol)  <br> - Pagos del dev  <br> - Acceso a herramientas de depuración (solo interno) | Tema morado‑indigo, tipografía Inter, iconos de “code” en hover. |
| **Admin** | - Registro y edición de personal (incl. rol *dev*)  <br> - Registro de pagos al personal  <br> - Inventario global  <br> - Reportes de ingresos/gastos | Diseño premium con gradientes violetas‑azules, botones con sombra “elevada”, tabla con colores de rol. |

---

## 5️⃣ Estimación de costos (Soles) 

| Concepto | Detalle | Costo (S/.) |
|----------|---------|-------------|
| **Desarrollo** | 4 dashboards + sincronización de pagos, inventario offline, UI premium, pruebas | **1 200 S/.** |
| **Diseño UI/UX** | Tipografía, paleta, micro‑animaciones, mock‑ups | **300 S/.** |
| **Integración Supabase** (esquema, reglas de seguridad, pruebas) |  | **200 S/.** |
| **Gestión de proyecto y QA** | Reuniones, documentación, pruebas finales | **200 S/.** |
| **Margen de contingencia** (cambios menores) |  | **100 S/.** |
| **Total estimado** |  | **2 000 S/.** |

> El precio final se ha redondeado a **S/. 2000** (equivalente a **≈ $540** al tipo de cambio actualizado 1 USD ≈ 3.70 S/.)

---

## 6️⃣ Próximos pasos

1. **Validar la propuesta** (confirmar alcance y presupuesto). 
2. **Crear tickets de tareas** en GitHub (Dashboard UI, Inventario API, Pagos, Modo offline). 
3. **Kick‑off** (reunión de 1 h para alinear prioridades). 
4. **Entregas parciales** cada 2 semanas con demo de cada dashboard.

---

### 📬 ¡Listos para seguir!
Si todo está de acuerdo, podemos planificar la primera entrega y abrir el repositorio para comenzar.
