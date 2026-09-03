# Sistema de Gestión de Licitaciones

Este repositorio contiene una plataforma web moderna para la gestión integral de licitaciones comerciales, diseñada para administrar todo el ciclo de vida, desde la fase de borrador hasta la cobranza final.

## Descripción del Proyecto y Arquitectura

El propósito principal de la aplicación es permitir a los operadores comerciales redactar presupuestos, adjuntar documentos de propuesta, enviarlas automáticamente por correo electrónico al cliente final, y llevar el seguimiento hasta su aprobación o vencimiento, registrando de forma inmutable todas sus transiciones.

El proyecto está desarrollado utilizando principios de desarrollo moderno de aplicaciones web en un ecosistema basado en componentes de React y renderizado híbrido. Se ha optado por una arquitectura sin servidor (Serverless) para la lógica de negocio, lo que permite escalabilidad automática y alta disponibilidad. Todo el desarrollo está tipado estáticamente con TypeScript para garantizar seguridad y solidez en el código.

## Stack Tecnológico

Las principales tecnologías y librerías utilizadas en este proyecto son:
- **Next.js (App Router):** Estructura principal y enrutamiento full-stack.
- **PostgreSQL (Prisma):** Base de datos relacional y ORM para consultas con tipado seguro.
- **Resend:** Proveedor de email transaccional para el envío de notificaciones y recordatorios con adjuntos.
- **Supabase Storage:** Servicio de almacenamiento de archivos en la nube para gestionar los documentos de las propuestas.
- **Vercel Cron Jobs:** Mecanismo de tarea programada para la validación automática de fechas de vencimiento y envío de correos.

## Requisitos Previos

- Node.js (versión 18.17.0 o superior).
- Un servidor de base de datos PostgreSQL activo (local o en Supabase).
- Una cuenta activa en Resend y sus credenciales (API Key).
- Un proyecto configurado en Supabase con un contenedor (bucket) creado para el almacenamiento de archivos.

## Instrucciones de instalación local

```bash
git clone https://github.com/Anrag24/Licitaciones-app
cd Licitaciones-app
npm install
```

## Variables de entorno (.env.example)

Crea un archivo `.env.local` o `.env` en la raíz (asegúrate de que no se suba a GitHub) con la estructura necesaria mostrada en `.env.example`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_STORAGE_BUCKET="propuestas"
SUPABASE_SERVICE_ROLE_KEY="eyJh..."
RESEND_API_KEY="re_..."
EMAIL_FROM="onboarding@resend.dev"
JWT_SECRET="..."
CRON_SECRET="..."
```

## Comandos de base de datos

Aplica la configuración estructural a tu base de datos y llénala con datos iniciales ejecutando los siguientes comandos:

- **Ejecutar migraciones (o sincronizar esquema):**
  ```bash
  npx prisma db push
  ```
  *(o `npx prisma migrate dev` si prefieres llevar el control estricto de migraciones)*

- **Semilla de datos (seed):**
  ```bash
  npx prisma db seed
  ```
  *(Esto creará un usuario administrador por defecto para poder ingresar al sistema).*

## Como Ejecutar

Una vez instaladas las dependencias y configurada la base de datos, inicie el servidor de desarrollo local ejecutando:

```bash
npm run dev
```

Abra su navegador y acceda a la dirección: `http://localhost:3000`.

## Flujo de Negocio (Máquina de Estados)

La licitación opera bajo una máquina de estados finitos:
1. **Borrador:** Permite edición completa. Exige documento formal antes de enviar.
2. **Activa:** Al enviarse, se notifica al cliente por correo y el tiempo límite comienza a correr.
3. **Finalizada:** Licitación ganada.
4. **Por Cobrar:** Se esperan los abonos económicos.
5. **Cobrada:** El saldo total del proyecto asociado a la licitación ha sido liquidado al 100%.
6. **Perdida:** Licitación rechazada o que superó su fecha límite de validez.

Adicionalmente, un proceso en segundo plano (Cron Job) y un mecanismo de **Lazy Expiration** evalúan constantemente las licitaciones para pasarlas a estado "Perdida" si vencen y enviar recordatorios por correo 48 horas antes.

## Seguridad
- Protección estricta de rutas API mediante JWT.
- Protección del endpoint Cron utilizando `CRON_SECRET`.
- Archivo `.env` correctamente agregado a `.gitignore`.
- Las claves maestras de Supabase (Service Role) operan únicamente en el servidor (API Routes) para evitar fugas al frontend.

---

## Sección de Evidencias

![Evidencia Email](./docs/email-evidencia.png)

**(Nota para el evaluador: Si desea ver la evidencia del archivo almacenado, por favor consulte el panel web en producción).**
