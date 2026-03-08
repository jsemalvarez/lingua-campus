# Configuración de la Base de Datos y Creación del Super Admin

Este documento describe los pasos necesarios para conectar el proyecto a una nueva base de datos (por ejemplo, en Supabase) y crear el usuario Super Administrador inicial utilizando el script de seed.

## Pasos de Configuración

### 1. Preparar las Variables de Entorno

Debes tener o crear un archivo `.env` en la raíz del proyecto. Copia el contenido de `.env.example` si existe, o asegúrate de definir las siguientes variables clave:

```dotenv
# 1. Variables de Conexión a la Base de Datos (Ejemplo con Supabase)
# DATABASE_URL usa connection pooling (puerto 6543 y ?pgbouncer=true)
DATABASE_URL="postgresql://postgres.[TU-REFERENCIA]:[TU-PASSWORD]@aws-0-[TU-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# DIRECT_URL se conecta directamente y se usa para ejecutar las migraciones (puerto 5432)
DIRECT_URL="postgresql://postgres.[TU-REFERENCIA]:[TU-PASSWORD]@aws-0-[TU-REGION].pooler.supabase.com:5432/postgres"

# 2. Variables para el Seed del Super Admin
# Estas credenciales se usarán para iniciar sesión en la plataforma por primera vez
SEED_SUPERADMIN_EMAIL="tu_email_admin@ejemplo.com"
SEED_SUPERADMIN_PASSWORD="tu_password_seguro"
```

**Importante**: Nunca subas el archivo `.env` o credenciales reales al repositorio.

### 2. Sincronizar el Esquema de la Base de Datos

Una vez que las variables de conexión estén configuradas, el siguiente paso es aplicar la estructura (tablas) de tu base de datos y generar el cliente de Prisma.

La forma más rápida y directa de sincronizar el esquema (especialmente en Supabase cuando la base de datos está completamente vacía y no cuentas con un historial de carpetas de migraciones) es usar `db push`, el cual creará las tablas automáticamente y generará el cliente.

Ejecuta el siguiente comando:
```bash
npx prisma db push
```

> **Explicación:** `db push` lee tu archivo `schema.prisma` y empuja los cambios directamente a la base de datos de destino. El comando `migrate deploy` fallará si la base de datos es nueva y no existe la carpeta `prisma/migrations` en tu proyecto.

### 3. Ejecutar el Seed (Poblar la base de datos)

Para crear el Super Administrador inicial (y cualquier otra data configurada por defecto), ejecuta el comando de inserción de datos (seed):

```bash
npx prisma db seed
```

El script leerá automáticamente las variables `SEED_SUPERADMIN_EMAIL` y `SEED_SUPERADMIN_PASSWORD` que configuraste en tu `.env` y creará la cuenta con los privilegios de Super Administrador.

> **Nota:** Si las variables no están definidas en tu `.env`, el script lanzará un error y no podrá continuar.

### 4. Verificar la creación

Una vez ejecutado, deberías ver en la terminal un mensaje similar a: 

> `Super Admin created: tu_email_admin@ejemplo.com`

Ya puedes levantar el proyecto (`npm run dev`) e iniciar sesión con estas credenciales.

---

## 🚀 Migraciones a Producción (Sin Perder Datos)

Una vez que la plataforma esté en Producción con institutos y estudiantes reales, **NUNCA debes utilizar el comando `db push` para aplicar o sincronizar cambios**. Hacerlo puede provocar la pérdida de datos o reinicios no deseados en estructuras si hay conflictos en el esquema.

Para llevar los cambios que hagas en tu base de desarrollo (o Stage) hacia la base de Producción de forma segura sin romper información de clientes, usaremos el sistema de control de versiones SQL de Prisma, llamado **Prisma Migrate**.

### El Flujo de Trabajo Seguro

#### Paso 1: Generar la Migración (En tu entorno de desarrollo)
Cuando modifiques el archivo `schema.prisma` (por ejemplo: agregar una nueva tabla, nueva columna, etc.) y estés listo/a para guardar ese cambio:
```bash
npx prisma migrate dev --name agregar_nueva_tabla
```
> **¿Qué hace esto?** 
> * Crea una nueva carpeta en `prisma/migrations/` con un archivo `.sql`. Este archivo contiene las instrucciones precisas para actualizar la base de datos sin borrar el contenido de las demás tablas.
> * (Por esto mismo, el primer `migrate dev` de todo el proyecto debe correrse para crear un archivo llamado `init` que contenga toda la creación base).

#### Paso 2: Versionar el Historial (Subir a Git)
Asegúrate de hacer **commit y push** de la carpeta `prisma/migrations`. 
Estos archivos SQL son como el "pasaporte" de tus cambios; obligatoriamente **deben subirse al repositorio** para que producción sepa cómo actualizarse con el paso del tiempo.

#### Paso 3: Desplegar en Producción
Para reflejar los cambios en tu base de datos de producción con clientes reales:

1. El entorno que vaya a ejecutar el comando deber tener apuntado el `DATABASE_URL` y `DIRECT_URL` de **la base de datos de Producción** (generalmente este comando lo corre un CI/CD, por ejemplo al pushear a Vercel, en la config de "Build Command").
2. Ejecuta el comando de despliegue:
```bash
npx prisma migrate deploy
```
3. Finalmente, actualizar el cliente Prisma:
```bash
npx prisma generate
```

> **¿Por qué `migrate deploy` es seguro?**
> A diferencia del `push` (que sincroniza forzando), `migrate deploy` simplemente lee tu carpeta `prisma/migrations` y busca si hay archivos `.sql` nuevos que aún no se hayan ejecutado en la base de datos desde la última vez. Sólo aplica los "deltas" o "diferencias", protegiendo los registros actuales.
