<img width="1917" height="906" alt="email-evidencia" src="https://github.com/user-attachments/assets/b8b2fac1-a59f-4616-bbec-b9ff9c42ee4e" />
<img width="1917" height="906" alt="email-evidencia" src="https://github.com/user-attachments/assets/2efb3436-1fb9-420d-ab9e-2625076d2e32" />
<img width="1917" height="906" alt="email-evidencia" src="https://github.com/user-attachments/assets/6e15e09e-0eee-4d37-86a3-138c2cba50a5" />
---

# Sistema de Gestión de Licitaciones

Plataforma web full-stack para la administración, trazabilidad y control integral del ciclo de vida de licitaciones comerciales, desde su formulación inicial hasta la liquidación de pagos.

- **Aplicación Desplegada (Producción):** [https://licitaciones-app-delta.vercel.app/](https://licitaciones-app-delta.vercel.app/)
- **Repositorio:** [https://github.com/Anrag24/Licitaciones-app](https://github.com/Anrag24/Licitaciones-app)

---

## 1. Credenciales de Acceso para Evaluación

Para probar la plataforma en el entorno de producción o local, utilice la siguiente cuenta administrativa preconfigurada:

- **URL de Acceso:** [https://licitaciones-app-delta.vercel.app/login](https://licitaciones-app-delta.vercel.app/login)
- **Correo Electrónico:** `admin@csc.com`
- **Contraseña:** `admin123`
- **Rol:** `admin` (acceso a gestión de usuarios, clientes, productos y licitaciones)

---

## 2. Stack Tecnológico e Integraciones Obligatorias

El proyecto cumple al 100% con los requisitos técnicos exigidos en la prueba técnica:

| Componente | Tecnología / Proveedor | Propósito |
|---|---|---|
| **Framework Full-Stack** | Next.js 16 (App Router, Turbopack) | Arquitectura Serverless, Renderizado Híbrido, API Routes y Server Actions |
| **Lenguaje** | TypeScript 5 | Tipado estático de extremo a extremo |
| **Base de Datos** | PostgreSQL (Supabase) | Base de datos relacional con pooling de conexiones |
| **ORM** | Prisma 5.22 | Modelado de datos, migraciones y consultas tipadas |
| **Email Transaccional** | Resend API | Envío automático de correos reales con resumen y documentos adjuntos |
| **Almacenamiento de Archivos** | Supabase Storage | Almacenamiento seguro de documentos formales de propuesta con URLs reales |
| **Tareas Programadas (Cron)** | Vercel Cron Jobs | Ejecución periódica para verificación de vencimientos y alertas automáticas |
| **Autenticación** | JWT + bcryptjs + Cookies HTTP-Only | Control de sesiones seguras y autorización basada en roles (Admin / User) |

---

## 3. Modelo de Datos y Relaciones

El esquema de base de datos relacional modela las siguientes entidades y restricciones:

- **Usuario:** Manejo de roles (`admin`, `user`), contraseñas cifradas con `bcrypt` y auditoría de acciones.
- **Cliente:** Razón social, identificación fiscal (RUC/NIT), email y teléfono de contacto. Relación 1:N con Licitaciones.
- **Producto:** Catálogo de bienes/servicios con SKU, nombre, descripción y precio unitario.
- **Licitacion:** Entidad principal vinculada a un cliente, con presupuesto máximo, fecha límite, estado actual, URL del documento de propuesta y saldo pendiente.
- **LicitacionProducto:** Tabla intermedia (N:M) que almacena cantidades y precios pactados por producto.
- **Pago:** Registro de transacciones económicas aplicadas a licitaciones en estado `por_cobrar`.
- **HistorialTransicion:** Tabla de auditoría inmutable que registra cada cambio de estado, usuario responsable, fecha/hora y notas.

---

## 4. Máquina de Estados y Reglas de Negocio

El sistema implementa una máquina de estados finitos estricta. Cualquier transición no autorizada es rechazada por el backend:

### Flujo de Estados

```
[Borrador] 
    │ (Exige documento subido -> Envía correo con adjunto)
    ▼
[Activa] ───────────────┬───────────────┐
    │                   │               │
    │ (Ganada)          │ (Manual)      │ (Vencimiento automático Cron/<48h)
    ▼                   ▼               ▼
[Finalizada]        [Perdida]       [Perdida]
    │
    │ (Facturación)
    ▼
[Por Cobrar]
    │
    │ (Pagos registrados hasta saldo = 0)
    ▼
[Cobrada]
```

### Reglas de Negocio Implementadas

1. **Validación de Presupuesto:** La suma del subtotal de productos no puede superar el presupuesto máximo establecido para la licitación.
2. **Requisito de Documento Formal:** Una licitación en borrador no puede pasar a estado `activa` sin haber cargado previamente el archivo de propuesta a Supabase Storage.
3. **Notificación por Email Real con Adjunto:** Al transicionar a `activa`, se despacha un correo al cliente vía Resend con el desglose de productos, presupuesto, fecha límite y el archivo PDF adjunto.
4. **Vencimiento y Recordatorios Automatizados (Cron):**
   - El endpoint `/api/cron/vencimientos` se ejecuta automáticamente mediante Vercel Cron.
   - Si una licitación `activa` supera la `fecha_limite`, se transiciona automáticamente a `perdida`.
   - Si faltan menos de 48 horas para la fecha límite y sigue `activa`, se envía un recordatorio por correo al cliente.
   - Cuenta con soporte de **Lazy Expiration** al consultar el detalle de una licitación en caso de desfase del cron.
5. **Control de Pagos y Cobranza:**
   - Solo se admiten pagos en estado `por_cobrar`.
   - No se permite registrar un monto de pago superior al saldo pendiente.
   - Cuando el saldo pendiente llega exactamente a 0, el sistema transiciona automáticamente a `cobrada`.
6. **Bloqueo de Modificaciones:** Una vez que la licitación sale de estado editable, no se permite añadir, editar o remover productos.
7. **Trazabilidad y Auditoría:** Cada cambio de estado genera un registro inmutable en `HistorialTransicion`.

---

## 5. Endpoints de la API

### Autenticación y Usuarios
- `POST /api/auth/login` - Inicio de sesión y generación de token JWT.
- `POST /api/auth/logout` - Cierre de sesión y limpieza de cookies.
- `GET /api/auth/me` - Obtener datos del usuario autenticado.
- `GET /api/usuarios` - Listado de usuarios (solo admin).
- `POST /api/usuarios` - Creación de nuevos usuarios (solo admin).

### Clientes y Productos
- `GET /api/clientes` - Listado general de clientes.
- `POST /api/clientes` - Registro de nuevo cliente.
- `GET /api/productos` - Listado del catálogo de productos.
- `POST /api/productos` - Creación de productos.

### Licitaciones y Operaciones
- `GET /api/licitaciones` - Listado con filtros por estado y cliente.
- `POST /api/licitaciones` - Creación de nueva licitación (estado borrador).
- `GET /api/licitaciones/[id]` - Detalle completo, productos, pagos e historial.
- `POST /api/licitaciones/[id]/documento` - Carga del documento de propuesta a Supabase Storage.
- `POST /api/licitaciones/[id]/enviar` - Transición a `activa` y envío de correo con adjunto.
- `POST /api/licitaciones/[id]/finalizar` - Marcar licitación como ganada (`finalizada`).
- `POST /api/licitaciones/[id]/perder` - Marcar licitación como `perdida`.
- `POST /api/licitaciones/[id]/facturar` - Transición a `por_cobrar`.
- `POST /api/licitaciones/[id]/pagos` - Registrar abonos económicos.
- `GET /api/licitaciones/[id]/historial` - Registro cronológico de transiciones.

### Tareas Programadas
- `GET /api/cron/vencimientos` - Verificación de fechas límite y recordatorios (protegido por `CRON_SECRET`).

---

## 6. Instalación y Ejecución Local

### Requisitos Previos
- Node.js 20.x o superior
- npm 10.x o superior
- Instancia de PostgreSQL (local o en la nube)

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/Anrag24/Licitaciones-app.git
cd Licitaciones-app/licitaciones-app
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` basado en `.env.example`:
```env
DATABASE_URL="postgresql://usuario:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://usuario:password@host:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_STORAGE_BUCKET="propuestas"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

RESEND_API_KEY="re_tu_api_key"
EMAIL_FROM="onboarding@resend.dev"

JWT_SECRET="clave_secreta_jwt"
CRON_SECRET="clave_secreta_cron"
```

4. Generar el cliente de Prisma y aplicar el esquema:
```bash
npx prisma db push
```

5. Ejecutar la semilla de datos inicial (Crea el usuario `admin@csc.com`):
```bash
npx prisma db seed
```

6. Iniciar el servidor de desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 7. Verificación y Evidencias de Entrega

- **Despliegue Funcional:** [https://licitaciones-app-delta.vercel.app/](https://licitaciones-app-delta.vercel.app/)
- **Almacenamiento de Documentos:** Los archivos se cargan en Supabase Storage y se sirven a través de URLs públicas directas verificables en el panel de detalle de cada licitación.
- **Envío de Correos con Adjuntos:** Las notificaciones al cliente utilizan la API de Resend adjuntando el binario del documento de propuesta directamente en el payload del correo.
- **Cron Jobs en Producción:** Configurados en `vercel.json` con programación diaria (`0 0 * * *`) y ejecución segura mediante autorización Bearer.
## Sección de Evidencias

![Evidencia Email](./docs/email-evidencia.png)

**(Nota para el evaluador: Si desea ver la evidencia del archivo almacenado, por favor consulte el panel web en producción).**
