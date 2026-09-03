# Sistema de Gestión de Licitaciones

Este repositorio contiene una plataforma web moderna para la gestión integral de licitaciones comerciales, diseñada para administrar todo el ciclo de vida, desde la fase de borrador hasta la cobranza final.

## Entorno Trabajado

El proyecto está desarrollado bajo un entorno de ejecución de Node.js, utilizando principios de desarrollo moderno de aplicaciones web en un ecosistema basado en componentes de React y renderizado híbrido. Se ha optado por una arquitectura sin servidor (Serverless) para la lógica de negocio, lo que permite escalabilidad automática y alta disponibilidad. Todo el desarrollo está tipado estáticamente con TypeScript para garantizar seguridad y solidez en el código.

## Herramientas

Las principales tecnologías y librerías utilizadas en este proyecto son:
- **Next.js (App Router):** Estructura principal y enrutamiento tanto para la interfaz de usuario como para los servicios integrados (API).
- **React:** Biblioteca para la construcción de interfaces de usuario modulares y escalables.
- **Prisma ORM:** Mapeador relacional de objetos para interactuar con la base de datos con tipado seguro.
- **Supabase Storage:** Plataforma de almacenamiento en la nube para la gestión de documentos adjuntos.
- **Resend:** Servicio especializado para el envío de correos electrónicos transaccionales.
- **Vercel Cron Jobs:** Servicio para la ejecución de tareas automáticas programadas basadas en tiempo.

## Requisitos Previos

Para ejecutar y contribuir en este proyecto, es indispensable contar con los siguientes elementos instalados y configurados:
- Node.js (versión 18.17.0 o superior).
- Gestor de paquetes de Node (NPM) o su equivalente (Yarn, PNPM).
- Un servidor de base de datos PostgreSQL activo (local o en la nube).
- Una cuenta activa en Resend y sus credenciales (API Key).
- Un proyecto configurado en Supabase con un contenedor (bucket) creado para el almacenamiento de archivos.

## Como Instalar

Siga estos pasos en su terminal para preparar el entorno de desarrollo:

1. Clone el repositorio en su máquina local.
2. Acceda al directorio raíz del proyecto.
3. Ejecute el comando para descargar e instalar todas las dependencias requeridas:
   npm install
4. Aplique la configuración estructural a su base de datos. Este comando leerá el esquema de Prisma y creará las tablas necesarias en su servidor PostgreSQL:
   npx prisma db push

## Variables de Entorno

Debe crear un archivo de configuración denominado .env en el directorio raíz del proyecto. Este archivo debe contener de manera obligatoria las siguientes credenciales y rutas:

DATABASE_URL="postgres://usuario:contrasena@servidor:puerto/basededatos"
DIRECT_URL="postgres://usuario:contrasena@servidor:puerto/basededatos"
RESEND_API_KEY="re_123456789"
EMAIL_FROM="correo@tudominio.com"
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJh..."
SUPABASE_STORAGE_BUCKET="nombre_del_contenedor"
CRON_SECRET="mi_clave_secreta_y_segura"

## Base de Datos

El sistema utiliza PostgreSQL como motor de base de datos relacional. El diseño estructural incluye las siguientes entidades principales administradas mediante Prisma:

- **Usuario:** Administradores y operadores del sistema.
- **Cliente:** Empresas o contactos receptores de las propuestas comerciales.
- **Producto:** Catálogo base utilizado para costear las licitaciones.
- **Licitación:** Entidad central que almacena presupuestos, límites de fecha, estados y archivos vinculados.
- **Detalle de Licitación:** Relación de muchos a muchos que guarda la cantidad y el precio exacto ofertado de cada producto.
- **Historial de Transiciones:** Registro de auditoría inmutable que documenta quién y cuándo cambió el estado de una licitación.
- **Pago:** Control de abonos económicos asociados a licitaciones en estado de cobro.

## Como Ejecutar

Una vez instaladas las dependencias y configurada la base de datos, inicie el servidor de desarrollo local ejecutando:

npm run dev

El sistema estará operando localmente. Abra su navegador de preferencia y acceda a la dirección estandar: http://localhost:3000.

## Flujo de Uso

1. **Autenticación:** El usuario ingresa a la plataforma proporcionando sus credenciales de acceso.
2. **Panel Principal:** Visualización de métricas generales y estado actual de las operaciones.
3. **Gestión de Catálogos:** Creación y edición de registros en los directorios de Clientes y Productos.
4. **Creación de Licitación:** El usuario redacta una nueva propuesta vinculando un Cliente y seleccionando Productos del catálogo. 
5. **Carga de Propuesta:** Es obligatorio adjuntar el archivo final con el documento de la propuesta oficial (usualmente formato PDF).
6. **Emisión y Envío:** Al aprobar el documento, el usuario confirma el envío. El sistema emite la propuesta directamente al correo del cliente.
7. **Seguimiento:** El usuario monitorea las licitaciones activas y registra pagos sobre aquellas que han sido aceptadas por el cliente.

## Flujo de Negocio

La licitación opera bajo una máquina de estados finitos que dictamina las reglas del negocio:

1. **Borrador:** Estado inicial. Permite edición completa de la licitación y exige la carga del documento formal antes de avanzar.
2. **Activa:** Al avanzar, el sistema envía un correo electrónico al cliente con la propuesta y el documento adjunto. El sistema comienza a medir el tiempo límite de validez.
3. **Finalizada:** Representa una licitación ganada, aprobada por el cliente y ejecutada en su totalidad comercial.
4. **Por Cobrar:** La propuesta fue aceptada, el trabajo está en curso o terminado, y se esperan los abonos económicos.
5. **Cobrada:** El saldo total del proyecto asociado a la licitación ha sido liquidado al 100%.
6. **Perdida:** Licitación que fue rechazada explícitamente o que ha superado su fecha límite de validez, siendo dada de baja automáticamente por el sistema.

Adicionalmente, un proceso en segundo plano (Cron) evalúa el negocio cada hora para:
- Detectar licitaciones activas vencidas y moverlas al estado "Perdida".
- Alertar preventivamente al cliente, mediante correo electrónico, 48 horas antes de que la propuesta expire.

## Endpoints

El sistema provee rutas internas de servicio (API) para procesar las entidades lógicas:

- /api/auth/me y /api/auth/logout: Gestión de la sesión del usuario.
- /api/clientes: Métodos GET y POST para listar y registrar clientes.
- /api/productos: Métodos GET y POST para listar y registrar productos.
- /api/licitaciones: Funciones CRUD principales para la creación y obtención de las propuestas.
- /api/licitaciones/[id]/documento: Maneja de forma segura la carga del archivo PDF a la plataforma de almacenamiento externa.
- /api/licitaciones/[id]/enviar: Valida las reglas de negocio, realiza la transición a estado "Activa" y dispara la notificación de correo.
- /api/cron/vencimientos: Extremo destinado exclusivamente a la tarea programada que audita los estados y fechas límite.

## Seguridad

La arquitectura integra múltiples niveles de protección y validación de seguridad:
- **Protección de Rutas:** Los componentes de interfaz y los endpoints de servicio validan la existencia de una sesión de usuario activa y autorizada antes de procesar información.
- **Protección de Procesos (Cron):** El extremo de tareas programadas verifica la existencia y coincidencia de un identificador seguro en los encabezados HTTP, impidiendo ejecuciones maliciosas de terceros.
- **Gestión de Identidades Externa:** Las claves sensibles de Supabase utilizan perfiles de servicio con elevación de privilegios exclusivamente del lado del servidor, previniendo exposición en el entorno del cliente.
- **Inmutabilidad e Integridad:** Todas las transiciones de estado de las licitaciones validan el estado anterior frente a la ruta solicitada, impidiendo alteraciones de flujo. Cualquier cambio exitoso genera un registro forzado en la tabla de Historial de Transiciones, asegurando completa trazabilidad de auditoría.
