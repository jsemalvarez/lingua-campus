# Lingua Campus — Backlog Técnico

> Relevamiento inicial: **2026-08-09**, sobre la rama `stage` (commit `1e1e7b8`).
> Método: análisis estático del código. No se ejecutó la app ni se inspeccionó la base de datos.
> Los ítems marcados **(sin verificar en runtime)** requieren confirmación contra datos reales antes de actuar.

## Cómo usar este documento

Cada ítem tiene un **ID estable** (`SEC-01`, `FIN-03`, …). Para retomar trabajo en una sesión nueva
alcanza con decir *"resolvamos FIN-01 y FIN-02"* — el ítem contiene el contexto necesario para
trabajar sin releer todo el análisis.

**Estados:** `[ ]` pendiente · `[~]` en curso · `[x]` resuelto (dejar el ítem, no borrarlo, y anotar
el commit que lo cerró).

**🗣️** marca los ítems que vienen de un pedido directo del cliente.

**Prioridades:**

| | Criterio |
|---|---|
| **P0** | Rompe seguridad o corrompe datos financieros. Antes de sumar clientes. |
| **P1** | Bug funcional visible o riesgo de costo/abuso. |
| **P2** | Deuda técnica que frena el desarrollo. |
| **P3** | Mejora deseable, sin urgencia. |

**Flujo de trabajo:** los cambios van a `stage`, se prueban en el ambiente de stage
(Supabase + Vercel propios), y recién ahí se promueven a `main`.

## Contexto del producto (al 2026-08-09)

**Un solo cliente en producción, con salida a producción muy reciente.** Esto cambia el cálculo de
varios ítems y conviene tenerlo presente al priorizar:

- **Las migraciones de base son baratas ahora y solo se encarecen.** [FIN-05](#fin-05) (`Float` →
  `Decimal`), [FIN-06](#fin-06) (restricciones únicas), [ARQ-01](#arq-01) (foreign keys) y
  [ARQ-05](#arq-05) (borrado lógico) tocan datos existentes. Con un instituto y pocos meses de
  historia, el riesgo es mínimo. Con diez clientes, cada una es un proyecto.
- **El radio de daño de los agujeros de seguridad es acotado**, pero no nulo: los tutores de ese
  instituto tenían acceso efectivo de administrador ([SEC-01](#sec-01), resuelto el 2026-08-10 —
  eran 7 cuentas). Era lo primero, más por lo barato de arreglarlo ahora que por el volumen expuesto.
- **Se puede postergar sin culpa** lo que escala con la cantidad de clientes: [PED-07](#ped-07)
  (límites de consumo de IA), [SEC-09](#sec-09) (middleware) y [ARQ-02](#arq-02) (pooling) no
  aprietan con un solo instituto.
- **Los bugs financieros ([FIN-01](#fin-01) a [FIN-04](#fin-04)) no esperan**: son silenciosos y ya
  están corriendo sobre plata real de un cliente real.

---

## Orden de ejecución sugerido

Las prioridades P0–P3 dicen **qué tan grave** es cada cosa. Este orden dice **en qué secuencia
conviene hacerlas**, que no es lo mismo: hay ítems graves que conviene postergar porque dependen de
otro, e ítems menores que conviene adelantar porque son baratos y el cliente los está esperando.

### Atención inmediata · pedido el 2026-08-13

Dos reportes del cliente que se atienden **antes que cualquier tanda**, por decisión suya. Los dos
los sufre alguien todos los días y los dos tienen la causa ya identificada:

| | Estado del diagnóstico |
|---|---|
| [BUG-07](#bug-07) | ~~No se guardan las asistencias.~~ Resuelto el 2026-08-13 sin necesidad de la captura: el parte pasó de 78 sentencias a 4, medido. **Falta verificar en stage.** |
| [BUG-04](#bug-04) | Reabierto. La secretaria pasa a profesora en 11 pantallas. **Causa confirmada**: la cookie de rol es `httpOnly` y el `Navbar` la lee desde JavaScript, cosa que nunca puede funcionar. No requiere diagnóstico adicional. |

BUG-04 se puede cerrar sin depender de nadie.

### Tanda 1 · Pedidos del cliente que no dependen de nada

Son acotados, aislados y de valor visible inmediato. Sacarlos primero compra tiempo para el trabajo
de fondo, que no se ve.

| | Por qué acá |
|---|---|
| [BUG-05](#bug-05) | Causa confirmada, arreglo chico. Cuidado con la validación de instituto. |
| [FEAT-02](#feat-02) | Autocontenido. Es lo que más molesta a los profesores todos los días. |
| [FEAT-01](#feat-01) | Requiere decidir entre dos enfoques, pero no toca nada más. |

[BUG-04](#bug-04) **no va acá**: aunque es un pedido del cliente, es la misma deuda que SEC-01 y
arreglarlo por separado es hacer el trabajo dos veces. Va en la tanda 2. Lo que sí conviene hacer ya
es el **diagnóstico** (pedirle a la usuaria que cierre sesión y vuelva a entrar), porque puede darle
una solución provisoria en el día.

### Tanda 2 · Fundamento de permisos

El bloque más importante. Los cuatro son la misma deuda y **hay que hacerlos en este orden**: cada
uno prepara el terreno para el siguiente, y así cada paso queda reversible.

1. ~~[ARQ-07](#arq-07) — completar los tipos de sesión.~~ Hecho en `b781d4b`; el barrido de `as any`
   se completó el 2026-08-13.
2. ~~[SEC-02](#sec-02) — crear el helper `requireRole()`.~~ Hecho en `0dcf991`.
3. ~~[SEC-01](#sec-01) — migrar los llamadores a `roles[]` y borrar la columna `role`.~~ Hecho el 2026-08-10; **falta verificar en stage**.
4. ~~[SEC-08](#sec-08) + [BUG-04](#bug-04) — el `Navbar` leía los roles del JWT viejo.~~ Hecho el 2026-08-10.
5. ~~[SEC-04](#sec-04) — los chequeos de instituto que faltaban.~~ Hecho el 2026-08-10.
   [SEC-03](#sec-03) quedó cubierto salvo la decisión de producto sobre qué puede anular una secretaria.

**Tanda cerrada el 2026-08-10, a falta de verificar en stage.** Los tutores dejan de tener acceso de
administrador y la secretaria deja de convertirse en profesora. Sigue la tanda 3.

### Tanda 3 · Bugs de plata

Corren sobre dinero real de un cliente real y son silenciosos: nadie los reporta porque nadie los ve.

~~[FIN-01](#fin-01), [FIN-02](#fin-02) y [FIN-03](#fin-03) tocan **la misma función**
(`voidPaymentAction`): hacerlos en un solo pase.~~ Los tres hechos el 2026-08-10 en un solo pase;
**falta verificar en stage**. `voidPaymentAction` ahora deriva todo —cuota, estado, libro mayor y
saldo a favor— de los pagos `VALID` que siguen en pie, en vez de restarle el pago a un snapshot.

~~Después [FIN-04](#fin-04) (condiciones de carrera)~~ — hecho el 2026-08-10, en el mismo pase que
dejó las cuatro operaciones de cobro con bloqueo de fila.

~~y [FIN-07](#fin-07) (curso completo)~~ — hecho el 2026-08-10, con una decisión de producto que
recorta el alcance: el caso mixto (pagó algunas cuotas y después quiere el curso entero) queda sin
soportar a propósito.

**Falta para cerrar la tanda:** sólo [FIN-11](#fin-11) — la política de bloqueo de FIN-01 manda a
anular la aplicación de saldo y no hay UI que lo permita, así que necesita una definición de producto
antes de tocar código.

### Tanda 4 · Migraciones, mientras sean baratas

Tocan datos existentes. Con un instituto y pocos meses de historia esto es un rato; con diez clientes
es un proyecto. **La ventana se cierra sola.**

~~[FIN-06](#fin-06) (restricciones únicas)~~ — hecha en dos pasos, el 2026-08-10 (cuotas de
inscripción) y el 2026-08-11 con [FIN-12](#fin-12) (matrículas); **falta verificar en stage**. Sigue
[FIN-05](#fin-05) (`Decimal`) → [ARQ-01](#arq-01) (foreign keys e índices) → [FIN-08](#fin-08)
(`dueDate`).

[ARQ-05](#arq-05) (borrado lógico) entra acá también, pero es transversal y conviene partirlo:
primero alumno y clase — que resuelven [BUG-02](#bug-02) y [BUG-03](#bug-03) —, el resto después.
~~La parte de clase~~ hecha el 2026-08-11; **falta verificar en stage**. Queda pendiente la interfaz
para reactivar lo borrado, que conviene definir de una sola forma para todo el sistema.

### Tanda 5 · El módulo pedagógico

Acá está el diferencial del producto. Se empieza por cerrar el agujero de costos, porque es el único
con urgencia real.

~~[SEC-07](#sec-07) (cerrar los endpoints de IA)~~ — hecho el 2026-08-11; **falta verificar en
stage**, y hay una migración nueva que corre sola en el deploy. ~~[PED-01](#ped-01) (generar la
práctica con un botón)~~ — hecho el 2026-08-11, **falta verificar en stage**; no lleva migración.
Sigue [PED-02](#ped-02) (devolver el `weakArea` al docente) → [PED-04](#ped-04) (persistir las
conversaciones).

[PED-03](#ped-03) etapa 1 (reencuadrar la promesa) es solo texto y se puede hacer en cualquier
momento.

### Tanda 6 · El resto

[SEC-05](#sec-05), [SEC-06](#sec-06), [SEC-09](#sec-09), [SEC-10](#sec-10), [FIN-09](#fin-09),
[FIN-10](#fin-10), [ARQ-02](#arq-02), [ARQ-03](#arq-03), [PED-05](#ped-05) a [PED-08](#ped-08).

[ARQ-09](#arq-09) (registro de errores) y [ARQ-10](#arq-10) (auditoría) entran acá, pero conviene
decidirlos juntos: comparten las tres preguntas caras —dónde se guarda, cuánto tiempo y quién lo ve—
y contestarlas dos veces sale peor que una. [ARQ-09](#arq-09) tiene además una urgencia que los
otros ítems de la tanda no tienen: hasta que exista, un deploy roto se descubre porque avisa el
cliente.

[ARQ-04](#arq-04) (tests) queda fuera del orden por decisión explícita.

### 🗣️ Tanda 7 · Las matrículas del año que viene, antes de diciembre

**Decisión del cliente (2026-08-11): esto se retoma después de los temas del día a día del
instituto.** Salieron todos de resolver [FIN-12](#fin-12) y ninguno molesta hoy — se disparan cuando
se empiecen a cobrar las matrículas del año siguiente, que es en diciembre. Postergarlos es correcto;
olvidarlos, no.

[FIN-14](#fin-14) (la generación masiva ignora el año lectivo) → [FIN-18](#fin-18) (la seña del que
sigue en el mismo curso queda sin curso).

**El tope es antes de tomar las matrículas de diciembre de 2026.** [FIN-14](#fin-14) es el que
importa: es una regresión introducida el 2026-08-11 y termina en doble cobro. Hasta entonces sólo se
dispara si alguien elige el año próximo en el desplegable de generación masiva, que arranca en el año
en curso.

El resto de la familia no depende de la fecha y puede entrar cuando haya lugar:
[FIN-15](#fin-15), [FIN-16](#fin-16), [FIN-17](#fin-17) y [FIN-19](#fin-19).

### Sobre intercalar features del cliente

Este orden asume que no aparece nada nuevo, cosa que no va a pasar. La regla práctica: los pedidos
del cliente entran **entre tandas**, no en el medio de una. Cortar la tanda 2 por la mitad deja el
sistema en un estado donde la mitad de los permisos se evalúan de una forma y la otra mitad de otra
— que es exactamente el problema que estamos arreglando.

---

## Índice

| ID | Prioridad | Título | Estado |
|---|---|---|---|
| [SEC-01](#sec-01) | P0 | Eliminar `User.role` y unificar en `roles[]` | [x] |
| [SEC-02](#sec-02) | P0 | Helper único de autorización (`requireRole`) | [x] |
| [SEC-03](#sec-03) | P0 | Control de rol en las acciones financieras | [~] |
| [SEC-04](#sec-04) | P0 | Validación de instituto faltante en 2 acciones de cobro | [x] |
| [SEC-05](#sec-05) | P1 | Login sin alcance de instituto | [ ] |
| [SEC-06](#sec-06) | P1 | Contraseñas por defecto hardcodeadas | [ ] |
| [SEC-07](#sec-07) | P1 | Endpoints de IA abiertos y sin límite de uso | [x] |
| [SEC-08](#sec-08) | P2 | Permisos rancios en el JWT | [x] |
| [SEC-09](#sec-09) | P2 | `middleware.ts` de protección de rutas | [ ] |
| [SEC-10](#sec-10) | P2 | Validación de entrada en server actions | [ ] |
| [FIN-01](#fin-01) | P0 | Anular un pago no devuelve el saldo a favor | [x] |
| [FIN-02](#fin-02) | P0 | Anular un pago con saldo saca plata inexistente | [x] |
| [FIN-03](#fin-03) | P1 | `datePaid` se borra siempre al anular (código muerto) | [x] |
| [FIN-04](#fin-04) | P0 | Condición de carrera al registrar cobros | [x] |
| [FIN-05](#fin-05) | P1 | Montos en `Float` en lugar de `Decimal` | [ ] |
| [FIN-06](#fin-06) | P1 | Cuotas duplicadas: falta restricción única | [x] |
| [FIN-07](#fin-07) | P1 | Pasar a curso completo no limpia las cuotas mensuales | [x] |
| [FIN-08](#fin-08) | P2 | `OVERDUE` nunca se asigna / falta `dueDate` | [ ] |
| [FIN-09](#fin-09) | P2 | Deudores incluye alumnos dados de baja | [ ] |
| [FIN-10](#fin-10) | P3 | Formato de moneda con locale del servidor | [ ] |
| [FIN-11](#fin-11) | P1 | No hay forma de anular una aplicación de saldo a favor | [ ] |
| [FIN-12](#fin-12) | P1 | Los generadores de matrícula asumen una por alumno y año | [x] |
| [FIN-13](#fin-13) | P2 | 🗣️ No se ve quién aplicó un descuento o recargo, ni por qué | [ ] |
| [FIN-14](#fin-14) | P1 | La generación masiva de matrículas ignora el año lectivo | [ ] |
| [FIN-15](#fin-15) | P2 | La matrícula anticipada no tiene restricción única en la base | [ ] |
| [FIN-16](#fin-16) | P2 | El generador mensual ignora el período lectivo y a los alumnos de baja | [ ] |
| [FIN-17](#fin-17) | P2 | Las cuotas de examen quedaron fuera de la normalización del mes | [ ] |
| [FIN-18](#fin-18) | P3 | La matrícula anticipada del que sigue en el mismo curso queda sin curso | [ ] |
| [FIN-19](#fin-19) | P3 | Dos matrículas del mismo año se ven idénticas fuera del cobro | [ ] |
| [FIN-20](#fin-20) | P1 | 🗣️ Cuotas duplicadas al cambiar de curso: la regla única es por inscripción | [ ] |
| [FIN-21](#fin-21) | P2 | No se puede registrar un pago con fecha pasada | [ ] |
| [BUG-01](#bug-01) | P1 | El alumno que entra con DNI no puede guardar prácticas | [x] |
| [BUG-02](#bug-02) | P1 | Borrar una clase con prácticas hechas falla | [x] |
| [BUG-03](#bug-03) | P1 | Vaciar las frases de una clase ya practicada falla | [x] |
| [BUG-04](#bug-04) | P1 | 🗣️ El rol de la secretaria se revierte a profesora | [~] |
| [BUG-05](#bug-05) | P1 | 🗣️ El admin ve el hilo en la bandeja pero recibe 404 al abrirlo | [x] |
| [BUG-06](#bug-06) | P2 | El admin ve todos los hilos del instituto como no leídos | [ ] |
| [BUG-07](#bug-07) | P1 | 🗣️ No se pueden guardar las asistencias de la clase | [x] |
| [FEAT-01](#feat-01) | P2 | 🗣️ Adjuntar archivos en el primer mensaje de un hilo | [ ] |
| [FEAT-02](#feat-02) | P2 | 🗣️ Paginar las clases del curso por mes | [x] |
| [FEAT-03](#feat-03) | P3 | Saltar al mes de la clase recién creada o movida | [ ] |
| [FEAT-04](#feat-04) | P2 | 🗣️ Saber quiénes entraron a la plataforma, sobre todo los tutores | [ ] |
| [FEAT-05](#feat-05) | P1 | 🗣️ Recuperar la contraseña por correo | [ ] |
| [FEAT-06](#feat-06) | P2 | 🗣️ Que tutores y docentes puedan escribirle al docente del curso | [ ] |
| [FEAT-07](#feat-07) | P2 | 🗣️ Ver en el calendario las clases de los pares del mismo nivel | [ ] |
| [FEAT-08](#feat-08) | P2 | 🗣️ Columna de novedades: plataforma, instituto y curso | [ ] |
| [FEAT-09](#feat-09) | P2 | 🗣️ Firma de conformidad de las novedades | [ ] |
| [ARQ-01](#arq-01) | P2 | Multi-tenancy manual: FK e índices faltantes | [ ] |
| [ARQ-02](#arq-02) | P2 | Pooling de conexiones Prisma/Supabase | [ ] |
| [ARQ-03](#arq-03) | P2 | Dominios hardcodeados en `tenant.ts` | [ ] |
| [ARQ-04](#arq-04) | P3 | Tests automatizados | [ ] |
| [ARQ-05](#arq-05) | P1 | Política de borrado lógico en todo el sistema | [ ] |
| [ARQ-06](#arq-06) | P3 | Limpiar props de identidad sin uso en `MessagesBell` | [ ] |
| [ARQ-07](#arq-07) | P2 | Completar los tipos de sesión en `next-auth.d.ts` | [x] |
| [ARQ-08](#arq-08) | P3 | Los archivos del Storage no se borran nunca | [ ] |
| [ARQ-09](#arq-09) | P2 | Los errores no se registran en ningún lado | [ ] |
| [ARQ-10](#arq-10) | P2 | No hay auditoría de las acciones del panel | [ ] |
| [ARQ-11](#arq-11) | P2 | Guardar las notas de un informe cuesta 250 sentencias | [ ] |
| [PED-01](#ped-01) | P1 | Generar la práctica desde `topic`/`content` con un botón | [x] |
| [PED-02](#ped-02) | P1 | Devolver el `weakArea` agregado al docente | [ ] |
| [PED-03](#ped-03) | P1 | Validez de la evaluación de pronunciación | [ ] |
| [PED-04](#ped-04) | P1 | Persistir y moderar las conversaciones del chatbot | [ ] |
| [PED-05](#ped-05) | P2 | Fallas silenciosas en los providers de IA | [ ] |
| [PED-06](#ped-06) | P3 | `isCorrect` debe derivarse de `score` | [x] |
| [PED-07](#ped-07) | P2 | Límites de consumo de IA por plan | [ ] |
| [PED-08](#ped-08) | P3 | El caché de TTS no está funcionando | [ ] |
| [PED-09](#ped-09) | P2 | 🗣️ Generar recursos extra de la clase para el docente | [ ] |

---

# Seguridad y permisos

<a id="sec-01"></a>
## SEC-01 · Eliminar `User.role` y unificar en `roles[]` · **P0**

**Contexto.** El sistema arrancó con un rol único por usuario y después pasó a multi-rol. La
migración se completó en la capa de presentación pero **no en la de autorización**, y quedaron dos
fuentes de verdad desincronizadas.

**Por qué pasó desapercibido.** La UI decide qué mostrar con `getActiveRole()`
([`src/lib/roles.ts`](../src/lib/roles.ts)), que lee `roles[]` — por eso un tutor ve correctamente
los paneles de tutor. Pero los server actions leen `user.role`, el campo viejo. El menú no muestra
"Finanzas", y aun así el servidor no bloquea la acción si se la invoca directamente.

**El problema concreto.** En [`src/app/students/[id]/actions.ts:372`](../src/app/students/[id]/actions.ts)
se crea el tutor con `roles: ["GUARDIAN"]` pero sin setear `role`. El schema define
`role UserRole @default(ADMIN)` ([`prisma/schema.prisma:73`](../prisma/schema.prisma)), así que
**todo tutor queda con `role = "ADMIN"` en la base**, y pasa cualquier chequeo del tipo
`user.role === "ADMIN"`.

El desfasaje aparece también al modificar roles de usuarios existentes:

- [`src/app/teachers/actions.ts:50-57`](../src/app/teachers/actions.ts) — agrega a `roles`, deja `role` viejo.
- [`src/app/students/[id]/actions.ts:361-368`](../src/app/students/[id]/actions.ts) — ídem.
- [`src/app/teachers/actions.ts:225`](../src/app/teachers/actions.ts) — baja de profesor: `roles: { set: [] }`, `role` intacto.

Hay ~40 lecturas de `user.role` en el código.

**Cambios necesarios.**

1. Migración de datos que reconcilie el estado actual **antes** de tocar el schema:
   - `roles` vacío y `role` con valor → `roles = [role]`.
   - `roles` con valores → se considera la fuente de verdad; `role` se descarta.
   - Auditar cuántos usuarios tienen `role = 'ADMIN'` con `roles` que no incluye `ADMIN`
     (son los tutores afectados) y registrar el resultado antes de migrar.
2. Reemplazar las ~40 lecturas de `user.role` por chequeos sobre `roles[]`, vía [SEC-02](#sec-02).
3. Quitar `role` del `select` de todas las queries.
4. Eliminar el campo `role` del modelo `User` y generar la migración Prisma.
5. Revisar `authorize()` en [`src/lib/auth.ts:36`](../src/lib/auth.ts): `role: user.roles[0]` se usa
   "por compatibilidad" y no coincide con la jerarquía de `ROLE_PRIORITY`. Debería salir de
   `getActiveRole()` o eliminarse del token.

**Orden sugerido:** SEC-02 primero (crear el helper), después migrar los llamadores, y recién
entonces borrar la columna. Así cada paso es reversible.

**Criterio de aceptación.** No queda ninguna referencia a `\.role\b` sobre el modelo `User`. Un
usuario con `roles: ["GUARDIAN"]` recibe 403 en toda acción administrativa, verificado entrando con
una cuenta de tutor real en stage.

### Resuelto — 2026-08-10 · pendiente de verificar en stage

**Auditoría previa (stage, 17 usuarios).** Confirmó el agujero: **7 tutores** tenían
`role = 'ADMIN'` con `roles = ['GUARDIAN']`. Ningún usuario tenía `roles[]` vacío, así que el
backfill no toca filas en stage; se dejó escrito igual porque producción es otra base.

| `role` | `roles[]` | usuarios |
|---|---|---|
| ADMIN | GUARDIAN | 7 |
| ADMIN | ADMIN | 4 |
| TEACHER | TEACHER | 2 |
| SECRETARY | SECRETARY, GUARDIAN | 2 |
| TEACHER | TEACHER, SECRETARY | 1 |
| SUPERADMIN | SUPERADMIN | 1 |

**Lo que se hizo.** Toda decisión de autorización pasa ahora por `requireRole()` / `getAuthContext()`
([`src/lib/authz.ts`](../src/lib/authz.ts)), que leen `roles[]` **de la base** y evalúan el **rol
activo**. Se eliminó `role` del modelo, del token, de los tipos de sesión y de las ~60 queries que lo
seleccionaban. Dos migraciones separadas para que cada paso sea reversible:
`20260810120000_backfill_user_roles` y `20260810120100_drop_user_role`.

**El chequeo que había no era el que parecía.** El patrón repetido era
`user.role === "SUPERADMIN" → denegar`: una lista negra de un solo elemento. Traducirlo tal cual a
`roles[]` habría dejado el agujero abierto — un tutor tampoco es SUPERADMIN. Se reemplazó por listas
blancas por módulo, tomadas de lo que el menú ya decide
([`Navbar.tsx:62-75`](../src/components/layout/Navbar.tsx)):

| Constante | Roles | Módulos |
|---|---|---|
| `INSTITUTE_STAFF` | ADMIN, SECRETARY, TEACHER | cursos, clases, calendario, aulas, niveles, inscripciones, ficha del alumno |
| `INSTITUTE_ADMINS` | ADMIN, SECRETARY | finanzas, altas y bajas de alumnos, plantillas de informes |
| `["ADMIN"]` | ADMIN | personal, tutores, liquidación de sueldos, configuración del instituto |

**Agujeros concretos que esto cierra, además del principal:**

- `createGuardianAccount` mezclaba `role` y `roles` con un `OR`, así que **un tutor podía crear
  cuentas de tutor**.
- `createTeacherAction` sólo excluía a SUPERADMIN: cualquiera del instituto podía darse de alta como
  profesor.
- `generateStandaloneEnrollmentFeeAction` sólo pedía estar logueado y tener instituto — cualquier
  usuario del instituto podía emitir una matrícula.
- `deleteScheduleAction` sólo comprobaba el instituto, sin mirar el rol.
- `updateInstituteByAdminAction` leía el rol **del JWT**, no de la base.
- `schedule/page.tsx` filtraba profesores con `role: "TEACHER"` únicamente: quien hubiera recibido el
  rol por `roles[]` (el camino que usa el alta cuando el email ya existe) no aparecía en el
  calendario.

**Cambios de comportamiento a tener presentes al probar.**

1. **SUPERADMIN pierde el acceso a las acciones de instituto.** Antes podía resetear contraseñas y
   dar de baja profesores de cualquier instituto. `requireRole` lo excluye por diseño (no tiene
   `instituteId`); opera desde `/admin/institutes`, que tiene su propio control
   (`requireSuperadmin`). En stage hay un solo SUPERADMIN y es una cuenta de desarrollo.
2. **Se autoriza por rol activo, no por "algún rol".** Quien tenga dos roles y esté operando como
   profesor no puede ejecutar acciones administrativas sin cambiar de modo con el selector.
3. **Las cuentas con `status != "ACTIVE"` quedan fuera.** Antes varios chequeos no miraban el estado.

**Qué falta verificar en stage.** Entrar con una cuenta de tutor real y confirmar el 403; entrar con
la usuaria de doble rol (secretaria + profesora) y confirmar que puede operar en ambos modos.

---

<a id="sec-02"></a>
## SEC-02 · Helper único de autorización · **P0**

**Problema.** `getAuthAndInstitute()` está duplicada textualmente en
[`src/app/payments/actions.ts:8`](../src/app/payments/actions.ts) y
[`src/app/payments/billingActions.ts:8`](../src/app/payments/billingActions.ts), y hay una tercera
variante inline en [`src/app/payments/actions.ts:461`](../src/app/payments/actions.ts)
(`generateStandaloneEnrollmentFeeAction`) que ni siquiera excluye SUPERADMIN. Cada página y cada
acción repite su propia versión del chequeo, con criterios distintos.

**Cambio.** Un helper en `src/lib/authz.ts`:

```ts
requireRole(["ADMIN", "SECRETARY"])
// → { userId, instituteId, roles } | lanza / devuelve error
```

Debe basarse en `roles[]` y en el rol activo de la cookie (`getActiveRole`), no en `role`.
Reemplazar todas las variantes locales.

**Criterio de aceptación.** Un único punto en el código decide autorización. Los ~40 chequeos
dispersos pasan por él.

### Resuelto — el helper en `0dcf991`, su aplicación transversal junto con [SEC-01](#sec-01)

`src/lib/authz.ts` expone `getAuthContext()`, `requireRole()`, `requireSuperadmin()` y las listas
`INSTITUTE_STAFF` / `INSTITUTE_ADMINS`. Las tres variantes de `getAuthAndInstitute()` que había
sobreviven como envoltorios de dos líneas que delegan en `requireRole` y adaptan la forma del
retorno: se dejaron así a propósito para no meter ~40 renombres incidentales en el medio del código
financiero. La decisión de autorización vive en un solo lugar.

---

<a id="sec-03"></a>
## SEC-03 · Control de rol en las acciones financieras · **P0**

**Problema.** El chequeo actual es:

```ts
if (!user || user.role === "SUPERADMIN" || !user.instituteId) return null;
```

Solo excluye SUPERADMIN. **Un profesor legítimo** (`role = "TEACHER"`) pasa el filtro. Los server
actions de Next.js son endpoints POST reales: ocultar el botón en el menú no protege nada.

Acciones expuestas — [`src/app/payments/actions.ts`](../src/app/payments/actions.ts) y
[`src/app/payments/billingActions.ts`](../src/app/payments/billingActions.ts):

`createPaymentAction`, `voidPaymentAction`, `registerFullCoursePaymentAction`, `createExpenseAction`,
`voidExpenseAction`, `createIncomeAction`, `voidIncomeAction`, `registerAdvanceAction`,
`applyCreditToFeeAction`, `generateStandaloneEnrollmentFeeAction`, `getReceiptDataAction`,
`generateMonthlyFeesAction`, `generateYearlyEnrollmentFeesAction`, `getDebtorsReportAction`,
`deleteFeeAction`, `editFeeAmountAction`.

**Cambio.** Aplicar `requireRole(["ADMIN","SECRETARY"])` en todas. Definir explícitamente si
SECRETARY puede anular y borrar cuotas o solo registrar cobros — hoy no hay distinción.

**Alcance.** Hacer el mismo barrido sobre los módulos de alumnos, profesores, cursos, informes y
mensajería. Este ítem cubre finanzas; el resto se resuelve con SEC-02 aplicado transversalmente.

### Parcialmente resuelto con [SEC-01](#sec-01) — 2026-08-10

Las 16 acciones listadas arriba pasan ahora por `requireRole(["ADMIN", "SECRETARY"])`, y el barrido
transversal sobre alumnos, profesores, cursos e informes también se hizo. **Un profesor ya no pasa el
filtro de finanzas.**

**Queda abierta la decisión de producto** que este ítem plantea y que no corresponde tomar sin el
cliente: si SECRETARY puede **anular pagos y borrar cuotas** o sólo registrar cobros. Hoy, como
antes, no hay distinción — ambos roles pueden todo. Restringir `voidPaymentAction`,
`voidExpenseAction`, `voidIncomeAction` y `deleteFeeAction` a `["ADMIN"]` es un cambio de una línea
por acción cuando se defina.

---

<a id="sec-04"></a>
## SEC-04 · Validación de instituto faltante en 2 acciones de cobro · **P0**

**Problema.** Estas funciones **sí** validan el instituto:

- `voidPaymentAction` — [`actions.ts:528`](../src/app/payments/actions.ts)
- `getReceiptDataAction` — [`actions.ts:811`](../src/app/payments/actions.ts)
- `deleteFeeAction` / `editFeeAmountAction` — [`billingActions.ts:240,277`](../src/app/payments/billingActions.ts)

Estas **no**:

- `createPaymentAction` — [`actions.ts:46`](../src/app/payments/actions.ts): `findUnique({ where: { id: feeId } })` y opera sin comparar `fee.instituteId`.
- `applyCreditToFeeAction` — [`actions.ts:719`](../src/app/payments/actions.ts): ídem.

Un admin del instituto A puede impactar una cuota del instituto B enviando el ID. La inconsistencia
entre funciones hermanas indica olvido, no decisión de diseño.

**Cambio.** Agregar `if (fee.instituteId !== user.instituteId) return { success: false, error: "..." }`
en ambas, dentro de la transacción. Idealmente, incluir `instituteId` en el `where` de la query.

**Un tercer caso, encontrado al migrar [SEC-01](#sec-01).**
[`api/students/[id]/reports/route.ts`](../src/app/api/students/[id]/reports/route.ts) autoriza al
personal por rol y **nunca compara el instituto del alumno**: un profesor del instituto A puede leer
los informes publicados de un alumno del instituto B mandando su ID. No se tocó en ese pase para no
mezclar un arreglo de aislamiento con la migración de roles, pero es el mismo olvido y conviene
hacerlo acá: la ruta ya tiene el `instituteId` del actor a mano en el `AuthContext`.

### Resuelto — 2026-08-10 · pendiente de verificar en stage

**El instituto va en el `where`, no en un `if` posterior.** Las dos acciones del enunciado pasaron de
`findUnique({ where: { id } })` + chequeo olvidable a `findFirst({ where: { id, instituteId } })`.
Una cuota de otro instituto simplemente no existe para ese usuario, y no hay forma de perder el
chequeo al editar la función más adelante.

**Aparecieron dos casos más de la misma clase**, ambos en el mismo archivo:

- `registerAdvanceAction` — buscaba el alumno por ID sin instituto, y **acredita saldo a favor**: un
  admin podía cargarle plata a un alumno de otro instituto mandando su ID.
- `getStudentPendingFeesAction` — las cuotas ya filtraban por instituto, pero el `creditBalance` que
  se devuelve al lado salía de un `findUnique` sin filtrar. Con el alumno sin cuotas, filtraba el
  saldo de un alumno ajeno.

Más el tercer caso de arriba, en la API de informes del alumno.

**Verificado que las hermanas sí validaban**, como decía el relevamiento: `voidPaymentAction`,
`getReceiptDataAction`, `deleteFeeAction` y `editFeeAmountAction` comparan el instituto. Se dejaron
con su `if` posterior para no ampliar el diff; funcionan.

---

<a id="sec-05"></a>
## SEC-05 · Login sin alcance de instituto · **P1**

**Problema.** En [`src/lib/auth.ts`](../src/lib/auth.ts):

- Línea 24 — el login por email hace `user.findUnique({ where: { email } })` e **ignora el
  `instituteId` que recibe**. Se puede entrar desde el subdominio de un instituto con credenciales
  de otro.
- Línea 45 — para alumnos: `student.findFirst({ where: { email: identifier } })` sin `instituteId`.
  El email de alumno es único **por instituto** (`@@unique([email, instituteId])`), así que con dos
  alumnos homónimos en institutos distintos el resultado es arbitrario.
- Línea 29 — si existe un `User` con ese email pero la contraseña no coincide, sigue de largo y
  prueba contra la tabla `Student`. Comportamiento poco claro.

**Cambio.** Incorporar `instituteId` a la búsqueda cuando el host resuelve a un instituto
(`getTenantByHost`). Decidir el comportamiento para el dominio raíz. Revisar si `User.email` debe
seguir siendo único global o único por instituto.

---

<a id="sec-06"></a>
## SEC-06 · Contraseñas por defecto hardcodeadas · **P1**

Todas fijas en el código, iguales para todos los institutos:

| Contraseña | Archivo | Aplica a |
|---|---|---|
| `Modern2026` | [`students/[id]/actions.ts:347`](../src/app/students/[id]/actions.ts) | Tutores nuevos |
| `estudiante123` | [`students/new/StudentForm.tsx:105`](../src/app/students/new/StudentForm.tsx) | Alumnos nuevos |
| `tutor1234` | [`guardians/[id]/actions.ts:113`](../src/app/guardians/[id]/actions.ts) | Reset de tutor |
| `docente1234` | [`teachers/actions.ts:169`](../src/app/teachers/actions.ts) | Reset de profesor |
| `inscripcion123` | [`inscription/actions.ts:52`](../src/app/inscription/actions.ts) | Pre-inscripción pública |
| `admin123` | [`PrismaUserRepository.ts:13`](../src/features/superadmin/infrastructure/prisma/PrismaUserRepository.ts) | Admin de instituto nuevo |
| `student.dni` | [`students/[id]/actions.ts:148`](../src/app/students/[id]/actions.ts) | Reset de alumno (DNI como contraseña) |

Combinado con [SEC-01](#sec-01), `Modern2026` era acceso efectivo de administrador.

**Cambio.** Generar contraseña aleatoria por usuario y forzar cambio en el primer ingreso. Ya existe
el mecanismo de `StudentDataToken` — se puede reutilizar el patrón de token de un solo uso para el
alta de credenciales. Eliminar el DNI como contraseña.

---

<a id="sec-07"></a>
## SEC-07 · Endpoints de IA abiertos y sin límite de uso · **P1**

**Problema.** [`src/app/api/practice/chat/route.ts:23`](../src/app/api/practice/chat/route.ts) recibe
el `scenario` **desde el body del cliente** y lo usa como system prompt. La única validación es que
exista sesión. Cualquier usuario autenticado —de cualquier instituto, cualquier rol— puede enviar el
prompt que quiera contra tu cuenta de Gemini.

Mismo patrón, solo `if (!session)`:

- [`/api/practice/evaluate`](../src/app/api/practice/evaluate/route.ts)
- [`/api/practice/generate-phrases`](../src/app/api/practice/generate-phrases/route.ts)
- [`/api/practice/generate-listening`](../src/app/api/practice/generate-listening/route.ts)
- [`/api/practice/generate-listening-quiz`](../src/app/api/practice/generate-listening-quiz/route.ts)
- [`/api/practice/tts`](../src/app/api/practice/tts/route.ts) — el más caro si se usa ElevenLabs.

No hay rate limiting en ninguno.

**Cambios.**

1. El `scenario` debe cargarse **en el servidor** desde `lessonPractice.chatScenario`, a partir de un
   `lessonPracticeId` recibido del cliente. Nunca del body.
2. Verificar en cada endpoint que el alumno esté **inscripto en el curso** de esa práctica y que la
   práctica esté publicada. Hoy `session/route.ts` valida `isPublished` pero no la inscripción.
3. Rate limiting por usuario y por instituto.
4. Restringir `generate-*` al rol docente si son herramientas de preparación de clase.

### Resuelto — 2026-08-11 · pendiente de verificar en stage

**Los seis endpoints entran por una sola puerta**
([`src/lib/practice/guard.ts`](../src/lib/practice/guard.ts)). `guardPracticeAi` recibe un
`lessonPracticeId`, decide si esa persona puede usar esa práctica, descuenta cuota y devuelve el
contenido leído de la base. Cada ruta quedó en tres líneas de control y el resto es su propia lógica.

**El prompt ya no viaja en el body.** El `scenario` de `/chat` sale de
`LessonPractice.chatScenario`, las `seedPhrases` de `speakingPhrases` y el `seedText` de
`listeningText`. `AIChatbot` sigue recibiendo el escenario por props, pero **sólo para mostrarlo en
pantalla**.

**`/generate-listening-quiz` también se lee entero del servidor**, que no era obvio: el cliente le
mandaba el texto. Se puede porque ese endpoint arma el cuestionario del texto **original**
únicamente — cuando el alumno genera un texto nuevo, `/generate-listening` ya le devuelve el texto y
sus preguntas juntos, y `ListeningLab` no vuelve a pasar por ahí.

**El `language` era otra vía para escribir el prompt.** Venía del body y se interpolaba
(`You are a ${language} teacher`). Ahora es `PRACTICE_LANGUAGE`, constante del servidor. En `/tts`,
donde sí elige la voz, quedó una lista blanca de tres variantes de inglés.

**La inscripción se verifica, no sólo la publicación.** El alumno llega a una práctica publicada, de
una clase activa, de un curso de su instituto **en el que esté inscripto con `status = "ACTIVE"`**.
Faltaba en todos lados, incluido `/session`, que era el único que miraba `isPublished` y que quedó
arreglado en el mismo pase aunque no sea un endpoint de IA (no comparte el helper: es sólo para
alumnos y no descuenta cuota). El personal
entra por el mismo helper sin exigir `isPublished`, porque la vista previa del profesor existe
justamente para probar antes de publicar. Los tutores, que antes pasaban por tener sesión, ya no
pasan.

**El límite de uso va a la base** ([`AiUsage`](../prisma/schema.prisma), migración
`20260811183000_add_ai_usage`) y no a memoria del proceso: en Vercel cada instancia serverless
tendría su propio contador, el tope se multiplicaría por la cantidad de instancias y se reiniciaría
en cada arranque en frío.

**Dos escalas, no una** ([`src/lib/practice/quota.ts`](../src/lib/practice/quota.ts)):

- **150 por usuario por hora.** Una sesión de speaking gasta dos llamadas por frase; un alumno
  aplicado ronda las 60 en una hora. El tope corta el loop automatizado sin molestar a nadie.
- **1200 por instituto por día.** Este es el que mira la factura. El free tier de Gemini son 1500
  requests diarias para *todo* el proyecto, así que un tope horario por instituto no serviría: con
  seis horas de uso normal ya se pasaría. Ambos se pueden mover con `AI_LIMIT_USER_HOURLY` y
  `AI_LIMIT_INSTITUTE_DAILY`.

**El TTS del navegador no descuenta cuota.** Con `TTS_PROVIDER=browser` —el default de hoy— el
servidor contesta 204 y sintetiza el cliente: no hay nada que facturar, y cobrárselo al alumno le
comería el tope repitiendo el audio, que es la operación más frecuente del módulo.

**El punto 4 del enunciado no se aplicó, a propósito.** `generate-phrases` y `generate-listening` no
son herramientas de preparación de clase: son los botones "generar más frases" y "generar otro texto"
que el **alumno** toca dentro de su práctica (`SpeakingHub`, `ListeningLab`). Restringirlos al rol
docente rompía la funcionalidad sin cerrar nada — el acceso ya lo decide la inscripción.

**Riesgo residual, anotado a conciencia.** Quedan dos campos de texto libre en `/evaluate`
(`expected` y `actual`) y uno en `/tts` (`text`), porque pueden ser frases que generó la IA en esa
misma sesión y no están en ninguna tabla. No son system prompts —van adentro de una plantilla fija—
pero llegan al modelo, así que se recortan a 300 y 3000 caracteres. Lo que queda expuesto es una
completion corta por unidad de cuota. Cerrarlo del todo requiere persistir lo generado, que es
[PED-04](#ped-04).

**[PED-07](#ped-07) (topes por plan) ya tiene dónde apoyarse.** `AiUsage` guarda el inicio de la
ventana en vez del tipo de período, así que el mismo contador sirve para cualquier escala; lo que
falta ahí es la decisión comercial, no el mecanismo.

---

<a id="sec-08"></a>
## SEC-08 · Permisos rancios en el JWT · **P2**

`session.strategy = "jwt"` sin `maxAge` configurado, y los `roles` viajan dentro del token
([`auth.ts:75`](../src/lib/auth.ts)). Si se le quita un rol a un usuario, lo conserva hasta cerrar
sesión.

**Cambio.** Definir `maxAge`, o releer los roles desde la base en el callback `session`
(cuesta una query por request; evaluar). Como mínimo, invalidar la sesión al cambiar roles.

### Resuelto — 2026-08-10 · pendiente de verificar en stage

**Se releen los roles en el callback `jwt`, con un intervalo de 5 minutos**
([`auth.ts`](../src/lib/auth.ts)). El `token.rolesSyncedAt` acota cuánto puede tardar en verse un
cambio de roles sin pagar una query por request, que era el reparo del enunciado.

**Por qué en `jwt` y no en `session`.** El callback `session` corre en cada lectura de sesión; el
`jwt` puede guardar la marca de tiempo *dentro del token* y saltear la consulta hasta que expire.

**Después de [SEC-01](#sec-01) esto ya no es lo que decide permisos.** La autorización lee los roles
de la base en cada acción, vía `getAuthContext`. Lo que arregla este ítem es la **interfaz**: el
`Navbar` y el `RoleSwitcher` son componentes cliente y leen del token, que es exactamente lo que
dejaba a la secretaria sin selector de rol ([BUG-04](#bug-04)).

**Dos decisiones a tener presentes:**

- **Si el usuario no aparece en `User`, el token no se toca.** El token guarda el `id` pero no de qué
  tabla salió, y los alumnos viven en `Student`. Al alumno lo ataja un corte anterior
  (`roles` incluye `STUDENT`), así que ahí sólo puede caer una fila de `User` borrada físicamente —
  la app sólo da de baja lógica. Igual no se blanquea: los roles del token sólo alimentan la
  interfaz, y dejarla sin nada con qué decidir muestra una app vacía en lugar de un error. Quien
  deniega es `getAuthContext`.
- **Si la cuenta no está `ACTIVE`, se vacían los roles.** Sin roles no pasa ningún chequeo y la
  interfaz deja de ofrecer lo que ya no se puede hacer.

**`maxAge` sigue en el default de 30 días.** Acortarlo obliga a todos a volver a entrar más seguido:
es una decisión de producto, no de permisos, y con los roles frescos ya no hace falta para esto.

---

<a id="sec-09"></a>
## SEC-09 · `middleware.ts` de protección de rutas · **P2**

No existe `middleware.ts` en el proyecto. No hay barrera centralizada: cada página se defiende sola
con su propio `getServerSession`. Funciona, pero una página nueva sin el chequeo copiado queda
pública por omisión.

**Cambio.** Middleware que exija sesión en todo lo que no sea landing, login e inscripción, y que
aplique el mapa de roles por prefijo de ruta. No reemplaza los chequeos de los server actions
(SEC-03): son capas distintas.

---

<a id="sec-10"></a>
## SEC-10 · Validación de entrada en server actions · **P2**

Los server actions leen `formData.get("x") as string` y confían. `parseFloat("abc")` devuelve `NaN` y
solo algunos campos se validan.

**Cambio.** Esquemas `zod` por acción. Empezar por las financieras y por las que crean usuarios.

---

# Lógica financiera

<a id="fin-01"></a>
## FIN-01 · Anular un pago no devuelve el saldo a favor · **P0**

`createPaymentAction` acredita el excedente: `creditBalance: { increment: surplus }`
([`actions.ts:106`](../src/app/payments/actions.ts)).
`voidPaymentAction` ([`actions.ts:515-583`](../src/app/payments/actions.ts)) revierte la cuota y el
asiento, pero **nunca toca `creditBalance`**.

**Reproducción.** Cuota de $8.000, se cobra $10.000 → alumno con $2.000 a favor. Se anula el pago →
la cuota vuelve a deber $8.000 y el alumno conserva los $2.000. Repetible.

**Cambio.** Recalcular el excedente en la anulación y descontarlo del `creditBalance`. Contemplar el
caso en que el saldo ya se haya consumido en otra cuota (el balance no puede quedar negativo):
definir la política — bloquear la anulación, o permitir balance negativo como deuda.

**Nota.** Conviene resolverlo junto con [FIN-02](#fin-02): ambos tocan la misma función.

### Resuelto — 2026-08-10 en `b05b2cc` · pendiente de verificar en stage

**El excedente es de la cuota, no del pago.** El saldo que generó una cuota es
`max(0, capital cobrado − importe de la cuota)`; lo que aportó un pago suelto es cuánto baja ese
excedente al sacarlo del medio. `voidPaymentAction` recalcula ambos lados desde los pagos `VALID`
restantes y descuenta la diferencia del `creditBalance`. Se descartó guardar el excedente en una
columna nueva de `Payment` porque los pagos ya registrados no la tendrían: el recálculo vale también
para el historial.

Esto importa cuando la cuota tiene varios pagos: si se pagan $5.000 y $5.000 sobre una cuota de
$8.000, el excedente de $2.000 se revierte se anule el pago que se anule. Atribuírselo al último
habría dejado plata duplicada.

**Política ante saldo ya consumido: se bloquea la anulación.** Si devolver el excedente dejaría el
`creditBalance` negativo, la acción falla con el monto que falta y el que hay. La alternativa
—permitir balance negativo como deuda— quedaba invisible: ninguna pantalla muestra hoy un saldo
negativo. La comparación lleva media tolerancia de centavo por el ruido binario de los `Float`
([FIN-05](#fin-05)).

**Hueco conocido de esa política:** el mensaje de error pide anular primero los pagos hechos con ese
saldo, y **hoy no hay UI para hacerlo**. Queda anotado como [FIN-11](#fin-11), que depende de una
decisión de producto sobre qué muestra la tabla del libro mayor.

---

<a id="fin-02"></a>
## FIN-02 · Anular un pago con saldo saca plata inexistente · **P0**

`applyCreditToFeeAction` registra el asiento con `amount: 0`
([`actions.ts:750`](../src/app/payments/actions.ts)) — correcto, no ingresa efectivo, ya había
ingresado antes como adelanto.

Pero `voidPaymentAction` genera el contra-asiento con `amount: -payment.amount`
([`actions.ts:550`](../src/app/payments/actions.ts)), el monto completo. Al anular una aplicación de
saldo de $5.000, el libro mayor registra una **salida real de $5.000** que nunca existió. Tampoco se
devuelve el crédito al alumno.

**Cambio.** El contra-asiento debe reflejar el monto del asiento original, no el del pago. Los pagos
con `method: "SALDO"` necesitan tratamiento propio: revertir contra `creditBalance`, no contra caja.

### Resuelto — 2026-08-10 en `b05b2cc` · pendiente de verificar en stage

El contra-asiento ya no se calcula desde el pago sino **desde los asientos `VALID` que ese pago
generó**: se suman antes de marcarlos anulados y el ajuste va por `-suma`. Para una aplicación de
saldo eso da $0 y el tipo pasa a `ADJUSTMENT` en lugar de `REFUND` (un `REFUND` de $0 sería mentira:
no hubo devolución). Se leen los asientos en vez de mirar `method === "SALDO"` porque así el ajuste
espeja lo que efectivamente se asentó, sin depender de una constante de texto.

En paralelo, anular un pago con método `SALDO` devuelve el crédito al alumno. Las dos mecánicas
componen bien: si la aplicación de saldo estaba sobre una cuota sobrepagada, el crédito vuelve y el
excedente que ese crédito ayudó a formar se descuenta ([FIN-01](#fin-01)), y el neto es correcto.

---

<a id="fin-03"></a>
## FIN-03 · `datePaid` se borra siempre al anular · **P1**

[`actions.ts:564-572`](../src/app/payments/actions.ts):

```ts
let newStatus: any = "PARTIAL";
if (newPaidAmount === 0) newStatus = "PENDING";
// ...
datePaid: newStatus === "PAID" ? payment.fee.datePaid : null
```

`newStatus` solo puede ser `PARTIAL` o `PENDING`: la rama `"PAID"` es **código muerto** y `datePaid`
queda en `null` siempre. Además, si una cuota tenía dos pagos y se anula uno, queda `PARTIAL` aunque
el resto la cubra por completo.

**Cambio.** Recalcular el estado sumando los pagos `VALID` restantes, contemplando `PAID`.

**No era sólo cosmético.** El `paidAmount` se calculaba restando del snapshot ya topeado, y el
snapshot puede haber recortado un excedente. Cuota de $8.000 con dos pagos de $5.000: `paidAmount`
quedó topeado en $8.000 aunque el capital cobrado fue $10.000. Al anular uno, `8.000 − 5.000 = 3.000`,
cuando el pago que sigue vivo aporta $5.000. **El alumno quedaba debiendo $2.000 de más.** Detectado
el 2026-08-10 al resolver [FIN-01](#fin-01).

### Resuelto — 2026-08-10 en `b05b2cc` · pendiente de verificar en stage

La cuota se recalcula desde los pagos `VALID` que siguen en pie
(`Math.min(capitalAfter, originalAmount)`, el mismo `capitalAfter` que ya necesitaba
[FIN-01](#fin-01)) en lugar de restarle el pago al snapshot. De ahí se deriva el estado, ahora con la
rama `PAID` viva: una cuota con dos pagos que sigue cubierta después de anular uno vuelve a quedar
`PAID` y conserva su `datePaid`.

Las comparaciones llevan media tolerancia de centavo por [FIN-05](#fin-05) — sin eso, `0,10 × 3`
sobre una cuota de `0,30` da `0.30000000000000004` y la cuota saldada quedaba `PARTIAL` para siempre.
Es un parche de convivencia, no reemplaza migrar a `Decimal`: en ese mismo caso el `creditBalance`
queda con un residuo de `5.55e-17` que ninguna tolerancia limpia.

---

<a id="fin-04"></a>
## FIN-04 · Condición de carrera al registrar cobros · **P0**

`createPaymentAction` lee `fee.paidAmount` **fuera** de la transacción
([`actions.ts:46`](../src/app/payments/actions.ts)), calcula en memoria, y adentro escribe el valor
absoluto ([`actions.ts:95`](../src/app/payments/actions.ts)). Dos cobros simultáneos sobre la misma
cuota: el segundo pisa al primero y se pierde el registro.

Mismo patrón:
- `applyCreditToFeeAction` — lee `creditBalance`, valida, después descuenta. El balance puede quedar negativo.
- `registerFullCoursePaymentAction` — busca `existingFee` fuera de la transacción ([`actions.ts:211`](../src/app/payments/actions.ts)).

**Cambio.** Mover las lecturas dentro de `$transaction`, usar operaciones atómicas (`increment` /
`decrement`) donde se pueda, y evaluar `isolationLevel: "Serializable"` en las operaciones de cobro.

### Resuelto — 2026-08-10 en `92c1cd6` · pendiente de verificar en stage

**Bloqueos de fila (`SELECT … FOR UPDATE`), no `Serializable`.** Postgres resuelve los conflictos
serializables **abortando** una de las dos transacciones (error 40001). Sin un reintento, el cobro
que hoy se pierde en silencio pasaría a fallar con un "Error al registrar el pago" que el operador no
puede interpretar — cambiábamos un bug callado por uno ruidoso. Con el lock, la segunda operación
espera turno, vuelve a leer los valores ya actualizados y las dos se registran.

Los helpers `lockPayment` / `lockFee` / `lockEnrollment`
([`actions.ts:44`](../src/app/payments/actions.ts)) documentan el criterio en un solo lugar. **El
orden de toma es siempre Payment → Fee → Enrollment**, que es lo que evita que dos acciones que
tocan las mismas filas en distinto orden queden esperándose entre sí.

**Dónde se aplicó:**

- `createPaymentAction` — la cuota se lee adentro de la transacción y con la fila bloqueada.
- `registerFullCoursePaymentAction` — se bloquea la **inscripción**, no la cuota: la cuota
  `FULL_COURSE` puede todavía no existir, y ese es justamente el caso a serializar (dos registros
  simultáneos creaban dos cuotas).
- `applyCreditToFeeAction` — bloqueo de la cuota, y el saldo se descuenta con la condición dentro del
  `where` de un `updateMany`: el control y el descuento pasan a ser una sola operación atómica. El
  `decrement` suelto que hacía el paso 3 desaparece porque ahora ocurre ahí mismo. También rechaza
  aplicar saldo a una cuota sin deuda, que con el valor ya confiable es un caso decidible.
- `voidPaymentAction` — no figuraba en el enunciado pero tiene el mismo patrón, y más ahora que
  recalcula desde los pagos vivos ([FIN-01](#fin-01) a [FIN-03](#fin-03)): sin el lock del pago, dos
  anulaciones simultáneas leen `VALID` las dos y generan dos contra-asientos.

**Verificado contra la base**, porque `tsc` no valida SQL crudo: los nombres de tabla existen tal cual
(`"Payment"`, `"Fee"`, `"Enrollment"`) y **los locks sobreviven al pooler de Supabase**
(`pgbouncer=true`, modo transacción) — que es la premisa de todo esto: si el pooler repartiera las
sentencias de una transacción entre conexiones distintas, el lock no serviría de nada. En la prueba,
una segunda transacción pidió el mismo lock a los 316 ms y recién lo obtuvo a los 3605 ms, cuando la
primera commiteó. Lo que prueba el test es el **orden**, no los tiempos: se corrió desde una máquina
de desarrollo contra `us-east-1`, así que los milisegundos absolutos son latencia de esa conexión y
no representan lo que pasa entre Vercel y Supabase, que están en la misma región.

**Efecto colateral: el margen de las transacciones.** Ahora una operación puede tener que esperar
turno, así que los 2s/5s por defecto de Prisma quedan justos. Pero agrandarlos sin techo no sirve:
las funciones de Vercel tienen su propio límite de duración —el del plan gratuito, porque no hay
`vercel.json` ni `maxDuration` que lo cambien— y la función muere antes, así que un `timeout` más
largo que ese límite no se cumple nunca, sólo cambia quién corta. Quedó
`COLLECTION_TX_OPTIONS = { maxWait: 3s, timeout: 6s }`
([`actions.ts:70`](../src/app/payments/actions.ts)), compartido por las cuatro operaciones: la suma
entra en el presupuesto de la función y sigue siendo dos órdenes de magnitud más que lo que tarda la
transacción dentro de la región.

Eso **bajó** el margen que `registerFullCoursePaymentAction` ya tenía puesto de antes (10s/20s), que
por lo mismo no era alcanzable. Si en algún momento aparecen `P2028` en los logs de Vercel, el
problema no se arregla subiendo este número: hay que mirar por qué la transacción tarda.

---

<a id="fin-05"></a>
## FIN-05 · Montos en `Float` en lugar de `Decimal` · **P1**

En [`prisma/schema.prisma`](../prisma/schema.prisma), todos los campos monetarios son `Float`
(doble precisión binaria): `Transaction.amount`, `Fee.originalAmount`, `Fee.paidAmount`,
`Payment.amount/surcharge/discount`, `Student.creditBalance`, `Course.monthlyPrice/enrollmentPrice/examPrice`,
`Enrollment.custom*Price`, `Expense.amount`, `MiscellaneousIncome.amount`, `User.hourlyRate`.

Consecuencia concreta: `if (newPaidAmount === 0)` en
[`actions.ts:565`](../src/app/payments/actions.ts) es una comparación exacta. Si el arrastre binario
deja `2.8e-14`, la cuota nunca vuelve a `PENDING` y el alumno figura como deudor de una fracción de
centavo, sin forma de saldarla desde la UI.

**Cambio.** Migrar a `Decimal @db.Decimal(12,2)`. Requiere adaptar el código que hoy asume `number`
(Prisma devuelve `Decimal.js`) y revisar sumas, gráficos y generación de PDF.

**Riesgo.** Migración de datos sobre tablas con información real. Probar en stage con una copia de
producción. Hacerlo **ahora** que el volumen es chico.

---

<a id="fin-06"></a>
## FIN-06 · Cuotas duplicadas: falta restricción única · **P1**

`generateMonthlyFeesAction` ([`billingActions.ts:26`](../src/app/payments/billingActions.ts)) hace
"consultar existentes → filtrar en memoria → `createMany`", sin ninguna restricción en la base. Dos
clics rápidos, o dos usuarios generando a la vez, producen cuotas duplicadas. Mismo patrón en
`generateYearlyEnrollmentFeesAction`.

**No envolver esto en una transacción.** El `createMany` suelto
([`billingActions.ts:93`](../src/app/payments/billingActions.ts)) es una decisión tomada a partir de
un problema real en producción: la versión anterior escribía fila por fila dentro de una
`$transaction` y **se agotaba el tiempo de conexión** con el volumen de alumnos del instituto. Lo
mismo pasaba generando las notas de los informes. La solución no fue agrandar el `timeout` de Prisma
—el techo de duración de la función de Vercel corta antes, así que ese número no alcanzaba nunca—
sino colapsar todo a una sola query. La restricción única de este ítem es compatible con eso:
`createMany({ skipDuplicates: true })` sigue siendo una query y la base hace cumplir la regla.

Conviene tenerlo presente al leer los bloqueos de fila de [FIN-04](#fin-04): son para las operaciones
de **un** alumno, que hacen media docena de sentencias. No se aplican ni convienen acá.

**Cambio.**
1. Agregar al modelo `Fee`: `@@unique([enrollmentId, type, year, month])` para cuotas de inscripción,
   y una restricción equivalente para las de tipo `ENROLLMENT` que no tienen `enrollmentId`
   (probablemente `@@unique([studentId, type, year])`). **Limpiar duplicados existentes antes de
   aplicar la migración.**
2. Usar `createMany({ skipDuplicates: true })`.

**Tercer caso del mismo patrón (2026-08-10).** `generateStandaloneEnrollmentFeeAction`
([`actions.ts:538`](../src/app/payments/actions.ts)) también consulta si ya existe la matrícula y
después la crea, sin transacción. Quedó **sin tocar a propósito** al resolver [FIN-04](#fin-04): el
arreglo correcto acá es la restricción única de este ítem, no un lock. Cubrirlo cuando se aplique.

**Otros huecos de la misma función:**
- No contempla `startDate` / `endDate` del curso: genera cuotas de meses fuera del período lectivo.
- No filtra por `student.status`: un alumno dado de baja con inscripción activa sigue generando cuotas.

### Parcialmente resuelto — 2026-08-10 · pendiente de verificar en stage

**Hecho: la restricción para las cuotas con inscripción.** `@@unique([enrollmentId, type, year, month])`
en el modelo `Fee`, más `createMany({ skipDuplicates: true })` en los dos generadores. Cubre las
`MONTHLY` y las `FULL_COURSE`, que son las que reporta el enunciado.

La migración limpia los duplicados antes de crear el índice, pero **sólo borra cuotas sin ningún pago
asociado**, conservando de cada grupo la que tiene más pagos y, a igualdad, la más antigua. Si en
algún grupo quedara más de una cuota con pagos, el `CREATE UNIQUE INDEX` falla y el despliegue se
detiene: es plata cobrada y decidir cuál sobrevive no es algo que pueda hacer una migración a ciegas.
Ensayada contra stage dentro de una transacción revertida: 0 borrados y el índice entra sin
conflictos. **En producción no está verificado** — es otra base y no se miró.

**Falta: la restricción de las matrículas**, y la resuelve [FIN-12](#fin-12). Con la regla definida
el 2026-08-10 —la matrícula es **por curso**— la unidad pasa a ser la inscripción, así que alcanza
con normalizar el `month` de las matrículas para que la restricción que ya está puesta signifique
"una por inscripción y año". **Se evita el índice parcial**, que era lo único que obligaba a SQL
crudo fuera del radar de Prisma.

**Corrección al enunciado de arriba:** decía que las cuotas de tipo `ENROLLMENT` no tienen
`enrollmentId`. Es cierto sólo para las anticipadas; las que crea `createEnrollmentAction`
([`enrollments/actions.ts:67`](../src/app/enrollments/actions.ts)) sí lo llevan, y en stage las 12 lo
tienen. Esa afirmación ya había hecho fallar el filtro de [FIN-07](#fin-07), corregido en `0b55917`.

**En stage hay 6 matrículas duplicadas** (2026, un par por alumno), una de ellas con dos pagos
válidos. Son datos de prueba —"estudiante uno", "cursos test"—, así que no dicen nada sobre
producción: hay que mirarla aparte antes de aplicar el índice parcial.

### Al día 2026-08-11

**La mitad que faltaba la cerró [FIN-12](#fin-12)**, y sin índice parcial: con el mes de las
matrículas fijo, la restricción que ya estaba puesta significa "una matrícula por inscripción y año".
Al normalizar, la migración borró los 6 duplicados de stage —ninguno tenía pagos; en los dos grupos
donde hay un pago es una sola copia la que lo tiene, así que la afirmación de arriba sobre "dos pagos
válidos" era incorrecta—.

**Este ítem se cierra acá.** Lo que quedaba abierto no era la restricción única y salió a ítems
propios, para no dejar un `[~]` eterno colgando de un enunciado ya resuelto:

- La matrícula **anticipada**, que sigue sin protección de la base porque los NULL no chocan entre sí
  → [FIN-15](#fin-15).
- Los **otros huecos de `generateMonthlyFeesAction`** anotados arriba —período lectivo y alumnos de
  baja— → [FIN-16](#fin-16).
- Las **cuotas de examen**, que arrastran el mismo mes administrativo que tenían las matrículas y por
  eso tampoco quedan cubiertas por la restricción → [FIN-17](#fin-17).

---

<a id="fin-07"></a>
## FIN-07 · Pasar a curso completo no limpia las cuotas mensuales · **P1**

`registerFullCoursePaymentAction` ([`actions.ts:218`](../src/app/payments/actions.ts)) cambia
`billingMode` a `FULL_COURSE` y crea la cuota única, pero las cuotas `MONTHLY` ya generadas quedan
pendientes. El alumno pagó el curso entero y aparece como deudor.

Además, si `existingFee` tenía pagos parciales, se pisan con `paidAmount: originalAmount`
([`actions.ts:250`](../src/app/payments/actions.ts)), perdiendo el historial.

**Regla de negocio definida (2026-08-09).** Las cuotas mensuales pendientes **no se anulan**: siguen
visibles como deuda del alumno. El sistema debe mostrar como deuda lo que quedó impago al finalizar
el curso.

**Cambio.**
1. Dejar de pisar `paidAmount` cuando ya existe una cuota `FULL_COURSE` con pagos parciales
   ([`actions.ts:250`](../src/app/payments/actions.ts)): acumular en lugar de reemplazar.
2. Verificar que el reporte de deudores y la ficha del alumno muestren correctamente las cuotas
   mensuales pendientes de una inscripción que pasó a `FULL_COURSE` — hoy conviven dos modalidades
   sobre la misma inscripción y no está claro que la UI lo refleje bien.

**Pendiente de confirmar al implementar.** Si el alumno ya pagó 3 meses y después se pasa a curso
completo, ¿el monto que carga el administrador en el formulario es **el remanente** (lo que falta) o
el precio total del curso? Del código surge que el monto es libre
([`actions.ts:190`](../src/app/payments/actions.ts)), así que hoy depende del criterio de quien
carga. Definirlo evita cobrar dos veces los mismos meses.

### Resuelto — 2026-08-10 en `5e1130e` · pendiente de verificar en stage

**Decisión de producto (2026-08-10): el caso mixto no se soporta.** Si la inscripción ya tiene alguna
cuota con pagos, el curso completo **no se puede cobrar**. Es una limitación deliberada y elegida
sobre la alternativa: mientras no esté definido si el monto es el remanente o el total, la operación
a veces cobraría de más, y es preferible que no exista a que funcione mal. Eso deja sin efecto la
pregunta de arriba hasta que se retome el caso mixto.

Consecuencia útil: **el punto 1 del cambio se cierra por construcción**. `paidAmount: originalAmount`
sigue escribiéndose, pero ahora sólo puede alcanzar a una cuota `FULL_COURSE` sin pagos, así que ya
no hay historial que pisar. No hizo falta acumular.

**Las cuotas mensuales previas se borran**, revisando la regla del 2026-08-09 para este caso puntual:
serían la misma deuda que el pago acaba de cubrir, y dejarlas haría figurar como deudor a alguien que
terminó de pagar el curso entero. Se borran sólo las que no tienen **ningún** pago asociado —el mismo
criterio de `deleteFeeAction`, y lo único que la clave foránea de `Payment` permite borrar. El control
de arriba garantiza que ninguna tenga pagos válidos; una cuota con un pago ya anulado sobrevive con su
historia y sigue figurando como deuda. La regla del 2026-08-09 sigue valiendo para lo que era: los
meses que quedan impagos al terminar el curso.

**El punto 2 quedó verificado de paso:**

- `generateMonthlyFeesAction` filtra `billingMode: "MONTHLY"`
  ([`billingActions.ts:32`](../src/app/payments/billingActions.ts)), así que después del cambio **no
  se generan cuotas mensuales nuevas**. El problema estaba acotado a las ya existentes.
- `getDebtorsReportAction` **no** filtra por modalidad
  ([`billingActions.ts:186`](../src/app/payments/billingActions.ts)), así que esas cuotas sí
  aparecían como deuda. Con el borrado, deja de haber qué mostrar y no hizo falta tocar el reporte.
- Las matrículas no entran en el control **porque el filtro va por tipo** (`MONTHLY` y
  `FULL_COURSE`): se cobran aparte del precio del curso, así que pagarlas no tiene por qué impedir
  este pago. La primera versión filtraba sólo por inscripción, dando por buena la afirmación de
  [FIN-06](#fin-06) de que las matrículas no llevan `enrollmentId`. **Es falso**: las crea así
  `createEnrollmentAction` ([`enrollments/actions.ts:67`](../src/app/enrollments/actions.ts)), y en
  la base de stage las 12 lo tienen. Corregido antes de que llegara a stage.

El texto de ayuda del formulario anuncia la limitación
([`RegisterFullCourseFeeForm.tsx:99`](../src/app/payments/components/RegisterFullCourseFeeForm.tsx)),
para que no se complete todo y el error aparezca al final.

---

<a id="fin-08"></a>
## FIN-08 · `OVERDUE` nunca se asigna / falta `dueDate` · **P2**

El enum `PaymentStatus` define `OVERDUE` y ningún código lo asigna. El vencimiento se reconstruye
comparando `year`/`month` contra la fecha actual
([`billingActions.ts:199`](../src/app/payments/billingActions.ts)).

Las matrículas guardan `month: new Date().getMonth() + 1`, es decir el mes en que se generaron
([`billingActions.ts:154`](../src/app/payments/billingActions.ts) y
[`actions.ts:499`](../src/app/payments/actions.ts)) — un valor administrativo, no un vencimiento. El
cálculo de deuda funciona por coincidencia.

**Cambio.** Agregar `dueDate DateTime` al modelo `Fee` y usarlo como criterio único de vencimiento.
Decidir si `OVERDUE` se materializa (job programado) o se calcula al vuelo; si se calcula, quitar el
valor del enum para no dejar estados muertos.

### Lo que agregó FIN-12 — 2026-08-11

El mes de las matrículas pasó a ser fijo (`0`), así que **ya no hay ni siquiera coincidencia**: dos
consultas suman cuotas por mes exacto —el "Total a cobrar / cobrado" del período en
[`payments/page.tsx`](../src/app/payments/page.tsx) y el ingreso mensual del
[`dashboard`](../src/app/dashboard/page.tsx)— y las matrículas no caen en ningún mes. Antes caían en
el mes en que se las creó, que era arbitrario: la emitida en marzo y cobrada en junio figuraba en
marzo.

La plata no se pierde de vista —la caja sale del libro mayor por fecha de asiento, y la deuda usa
comparaciones `<=`, así que las matrículas cuentan como deuda desde el arranque del año— pero el "a
cobrar del mes" pasó a ser sólo cuotas. **Este ítem es lo que lo arregla de verdad**: con `dueDate`,
la matrícula tiene dónde decir cuándo vence y los agregados por período pueden usarlo. Hasta
entonces, no hay dónde poner el vencimiento de algo anual.

---

<a id="fin-09"></a>
## FIN-09 · Deudores incluye alumnos dados de baja · **P2**

`getDebtorsReportAction` ([`billingActions.ts:188`](../src/app/payments/billingActions.ts)) no filtra
`student.status`. Los alumnos con `status: "DELETED"` aparecen en el reporte.

**Cambio.** Agregar `student: { status: "ACTIVE" }` al filtro. Confirmar antes si el negocio quiere
seguir viendo la deuda histórica de un alumno dado de baja — puede que sí.

**Relacionado.** `deleteFeeAction` bloquea el borrado si `fee.payments.length > 0`
([`billingActions.ts:244`](../src/app/payments/billingActions.ts)), contando también los pagos
`VOIDED`. Una cuota cuyo único pago fue anulado no se puede borrar.

---

<a id="fin-10"></a>
## FIN-10 · Formato de moneda con locale del servidor · **P3**

`surplus.toLocaleString()` en [`actions.ts:66`](../src/app/payments/actions.ts) se ejecuta en el
servidor (Vercel, `en-US`), y guarda `"2,000"` en lugar de `"2.000"` en la nota del recibo.

**Cambio.** `toLocaleString("es-AR")` explícito, o formatear en el cliente.

**Segundo caso (2026-08-10).** El mensaje de error de `voidPaymentAction`
([`actions.ts:576`](../src/app/payments/actions.ts)) usa el mismo `toLocaleString()` pelado, y es
texto que ve el operador. Arreglar los dos juntos.

---

<a id="fin-11"></a>
## FIN-11 · No hay forma de anular una aplicación de saldo a favor · **P1**

`applyCreditToFeeAction` crea un `Payment` con `method: "SALDO"` y un asiento `ADJUSTMENT` de $0.
Ese movimiento **no es alcanzable desde ninguna pantalla**:

- la tabla del libro mayor descarta los asientos en $0
  ([`page.tsx:322`](../src/app/payments/page.tsx), `.filter(t => t.amount > 0)`);
- y aunque apareciera, el menú de acciones se oculta para los `ADJUSTMENT` y `REFUND`
  ([`TransactionActions.tsx:71`](../src/app/payments/components/TransactionActions.tsx)), pensado
  para que no se anulen los contra-asientos.

`voidPaymentAction` ya sabe revertirlo bien desde [FIN-02](#fin-02): lo que falta es el acceso.

**Por qué es P1 y no cosmético.** La política de [FIN-01](#fin-01) bloquea la anulación de un pago
cuyo excedente ya se consumió, y el mensaje de error dice *"anulá primero los pagos hechos con ese
saldo"*. Hoy eso es imposible: el operador queda trabado sin salida por la UI ante un error de carga
con plata real.

**Decisión de producto pendiente.** Qué es la tabla de `/payments`: ¿la caja (sólo movimientos de
dinero) o el libro de todos los movimientos, incluidos los internos de $0? De eso depende el cambio:

1. Si es la caja → dejar el filtro y dar acceso a la aplicación de saldo desde otro lado (la ficha
   del alumno o el detalle de la cuota, que es donde el operador la está mirando).
2. Si es el libro completo → levantar el filtro de $0, distinguir en la UI el `ADJUSTMENT` de
   aplicación de saldo del `ADJUSTMENT` de anulación (hoy comparten tipo), y habilitar el botón sólo
   para el primero.

La opción 1 es menos invasiva y no cambia lo que ve quien concilia caja.

---

<a id="fin-12"></a>
## FIN-12 · Los generadores de matrícula asumen una por alumno y año · **P1**

**🗣️ Regla de negocio definida (2026-08-10): la matrícula es por curso.** Si un alumno hace dos
cursos, paga dos matrículas. Si el instituto quiere bonificar, reparte descuentos al cobrar (por
ejemplo 50% en cada una), y esa política la decide cada instituto desde el panel — no se codifica.

Con esa regla, `createEnrollmentAction`
([`enrollments/actions.ts:47`](../src/app/enrollments/actions.ts)), que genera una matrícula por
inscripción, es **la que está bien**. Las que asumen lo contrario son las otras dos:

- `generateStandaloneEnrollmentFeeAction` ([`actions.ts:538`](../src/app/payments/actions.ts))
  rechaza la segunda matrícula del año con *"Ya existe una matrícula registrada para este alumno en
  el año X"*. Debería mirar sólo las **sin vincular**: la anticipada, que la primera inscripción
  consume.
- `generateYearlyEnrollmentFeesAction` ([`billingActions.ts:134`](../src/app/payments/billingActions.ts))
  saltea a los alumnos que ya tienen una matrícula ese año, cuando debería generar una **por
  inscripción activa** sin matrícula.

**Cambio.**
1. Corregir las dos funciones para que la unidad sea la inscripción y no el alumno.
2. Normalizar el `month` de las matrículas a un valor fijo. Con eso la restricción única que ya
   existe —`[enrollmentId, type, year, month]`, ver [FIN-06](#fin-06)— pasa a significar "una
   matrícula por inscripción y año" **sin necesidad de un índice parcial**, que es lo que Prisma 5 no
   sabe expresar y habría quedado fuera de su radar. Encaja con [FIN-08](#fin-08): para la matrícula
   el `month` es un valor administrativo, no un vencimiento. Requiere migrar las filas existentes.

**Cierra la mitad que le falta a [FIN-06](#fin-06).**

**Nota sobre los datos.** En stage hay 6 matrículas duplicadas, pero sus dos copias apuntan a la
**misma** inscripción, así que no son el caso que describe este ítem ni salieron de estas funciones:
son datos de prueba cargados a mano o de una versión anterior. En producción no se miró.

### Resuelto — 2026-08-11 · pendiente de verificar en stage

**El mes de la matrícula es fijo: `ENROLLMENT_FEE_MONTH = 0`**
([`utils.ts`](../src/lib/utils.ts)). No es un mes ni un vencimiento —la matrícula es anual—, y con
todas compartiendo el valor, la restricción única que ya existía —`[enrollmentId, type, year, month]`—
significa **"una matrícula por curso y año"**. **No hizo falta el índice parcial.** Ninguna pantalla lo
muestra: `formatFeeLabel` ya ignoraba el mes de las matrículas.

Dicho en los términos de la base la regla es "una por **inscripción** y año", que suena a que se
contradice con "un alumno puede tener dos matrículas el mismo año" pero es lo mismo: la inscripción es
la dupla alumno+curso, así que dos cursos son dos inscripciones y dos matrículas del mismo año, las dos
permitidas. Lo único que la restricción bloquea es la segunda copia del **mismo curso y año**, que es
el duplicado por doble clic de [FIN-06](#fin-06). Un curso que sigue dos años lleva dos matrículas
sobre la misma inscripción, una por año, también permitidas.

**Los dos generadores, corregidos:**

- `generateStandaloneEnrollmentFeeAction` ([`actions.ts`](../src/app/payments/actions.ts)) ahora sólo
  rechaza si ya hay una matrícula **anticipada sin vincular** del mismo año. La segunda matrícula del
  año, que es el caso normal desde que la matrícula es por curso, ya no se bloquea.
- `generateYearlyEnrollmentFeesAction` ([`billingActions.ts`](../src/app/payments/billingActions.ts))
  recorre **inscripciones activas** (de alumnos activos, en cursos activos) en vez de alumnos, y crea
  la matrícula con `enrollmentId`. Al quedar vinculada, `skipDuplicates` se apoya en la restricción y
  la generación masiva pasa a estar protegida de verdad; sigue siendo **una sola query** (ver la nota
  de [FIN-06](#fin-06) sobre por qué esto no va en una transacción).

**Dos decisiones que aparecieron al generar por inscripción:**

1. **Las anticipadas cuentan como cubiertas.** La matrícula sin `enrollmentId` no dice a qué curso va,
   pero ya es plata facturada: cada una descuenta una inscripción del alumno en la generación masiva.
   Sin eso, al alumno con una anticipada sin consumir se le cobraba dos veces. Queda sin vincular —
   se la lleva la próxima inscripción que se cargue, como siempre.
2. **Se respeta `customEnrollmentPrice`.** Es el precio propio de la inscripción, o sea las becas;
   antes era inalcanzable porque la generación iba por alumno. El monto del formulario pasó a ser el
   valor base, que es lo que la UI ya decía.

### 🗣️ La matrícula anticipada y el año lectivo — 2026-08-11

**Cómo funciona el negocio (definido en esta conversación).** El instituto cobra la matrícula del año
siguiente antes de tener armados los cursos: le guarda el lugar al alumno y le congela el precio del
año en curso, que es el descuento por pagar adelantado. **La anticipada no tiene curso porque el curso
todavía no existe**, y eso es exactamente para lo que `Fee.enrollmentId` es opcional. El año no sale de
ningún lado del sistema: lo elige quien cobra, en el selector "Año Académico — Actual / Próximo" de
[`RegisterEnrollmentFeeForm`](../src/app/payments/components/RegisterEnrollmentFeeForm.tsx).

**Por qué no va como saldo a favor**, que sería la alternativa obvia y el sistema ya lo tiene: el saldo
es plata, no precio. Emitida la matrícula del año siguiente a valor nuevo, aplicarle el saldo deja al
alumno debiendo la diferencia y el descuento se evapora. Como cuota anticipada, el precio queda
congelado en `originalAmount` —que es un snapshot— y la deuda cierra en cero.

**Lo que estaba roto.** `createEnrollmentAction` buscaba la anticipada por **año de calendario**. Con
el flujo real del instituto —cobrar la seña de 2027 en diciembre y armar los cursos de 2027 también en
diciembre— la seña de 2027 no aparecía: la inscripción emitía una matrícula 2026 nueva, a precio de
lista, y el alumno quedaba con la seña pagada más una deuda que no existe. No es un caso de borde: es
el flujo normal, todos los diciembres. La protección que este ítem agregó no lo cubría, porque alcanza
sólo a la generación masiva y no a la matrícula que se emite sola al inscribir.

**La regla que quedó**, en [`enrollments/actions.ts`](../src/app/enrollments/actions.ts):

1. El año lectivo sale de `course.startDate` cuando está cargado — es el único lugar del sistema que ya
   dice a qué ciclo pertenece un curso. Se lee con `getUTCFullYear`: las fechas se guardan a medianoche
   UTC y un curso que arranca el 1 de enero, leído en hora local, cae en diciembre del año anterior.
2. Si el curso no trae fecha, no sabemos de qué ciclo es, así que se acepta también la anticipada del
   año siguiente, prefiriendo siempre la más vieja. Así diciembre funciona carguen o no la fecha.
3. Al vincular se conserva **el año de la seña**, no el calculado acá: el de la seña es el dato bueno.

**El caso que queda torcido**, a sabiendas: inscribir en diciembre a un curso **del año en curso**, sin
fecha de inicio cargada, teniendo el alumno una seña del año siguiente sin usar. Ahí la seña se aplica
a la matrícula del año en curso. No se pierde plata —se cobra una vez— pero queda imputada al año
equivocado. Es preferible al doble cobro garantizado que había antes, y se evita cargando la fecha de
inicio de los cursos.

**Si el alumno sigue en el mismo curso** no hay inscripción nueva (la fila `Enrollment` es alumno+curso
y no lleva año), así que su anticipada nunca se vincula: queda cobrada y sin curso. No se le cobra dos
veces porque la generación masiva la descuenta, pero la matrícula no dice de qué curso es. Si eso
molesta, el formulario de anticipada tendría que dejar elegir el curso de forma opcional.

**Lo que sigue sin protección de la base:** la matrícula anticipada. Se crea sin `enrollmentId` y en
Postgres los NULL no chocan entre sí, así que ahí la regla la sigue haciendo cumplir el
"consultar y después crear" de la función. Es el caso de a un alumno por vez y con confirmación de
por medio; cubrirlo pediría el índice parcial que este ítem justamente evitó.

**Migración** (`20260810170000_normalize_enrollment_fee_month`): borra las matrículas que hoy conviven
en meses distintos para la misma inscripción y año —sólo las que **no tienen ningún pago**, con el
criterio de [FIN-06](#fin-06): sobrevive la que tiene más pagos y, a igualdad, la más antigua— y
después normaliza el mes. Si en algún grupo quedara más de una con pagos, el `UPDATE` viola el índice
único y el despliegue se detiene, que es lo que se quiere: es plata cobrada.

Ensayada contra stage dentro de una transacción revertida: **6 filas borradas** (los 6 duplicados de
datos de prueba, ninguna con pagos: en los dos grupos donde hay un pago, es una sola copia la que lo
tiene) y **6 matrículas normalizadas**, sin choques. **En producción no está verificado** — es otra
base y no se miró.

**Consecuencia a mirar en stage: las matrículas salen de los KPI "del mes".** Dos consultas agregan
cuotas por mes exacto —el "Total a cobrar / cobrado" del período en
[`payments/page.tsx`](../src/app/payments/page.tsx) y el ingreso mensual del
[`dashboard`](../src/app/dashboard/page.tsx)— y con el mes en 0 las matrículas ya no caen en ningún
mes. Antes caían en el mes en que se las había creado, que era arbitrario: la matrícula emitida en
marzo y cobrada en junio figuraba en marzo. **La plata real no se pierde de vista**: la caja se
calcula desde el libro mayor por fecha de asiento, y la deuda usa comparaciones `<=`, así que las
matrículas siguen contando como deuda (desde el arranque del año, no desde el mes de creación). Lo
que cambia es que el "a cobrar del mes" pasa a ser sólo cuotas. Es la misma carencia que anota
[FIN-08](#fin-08): mientras no haya `dueDate`, no hay dónde poner el vencimiento de una matrícula.

**De paso:** el asiento de aplicación de saldo a favor armaba su descripción con
`` `Cuota ${fee.month}/${fee.year}` `` y con el mes fijo habría escrito "Cuota 0/2026"; ahora usa
`formatFeeLabel`. Y el selector de cuota al cobrar muestra el curso al lado de la matrícula: dos
matrículas del mismo año eran indistinguibles.

---

<a id="fin-13"></a>
## FIN-13 · 🗣️ No se ve quién aplicó un descuento o recargo, ni por qué · **P2**

Los descuentos y recargos se cargan al cobrar (`RegisterFeeForm`, campos "Descuento (-)" y
"Recargo") y quedan bien guardados en `Payment.discount` / `Payment.surcharge`, separados del monto
cobrado. El problema es que **después no se ven en ningún lado salvo el recibo de ese pago**
([`TransactionActions.tsx:47`](../src/app/payments/components/TransactionActions.tsx)): la tabla del
libro mayor muestra la plata que entró, no lo que se bonificó, y no hay ninguna vista que sume
cuánto se bonificó en el período.

**Lo que ya está y lo que falta en el modelo:**

- **Importes:** están. `Payment.discount` y `Payment.surcharge`, por pago.
- **Quién:** no está en el pago. `Payment` no tiene `operatorId`; sí lo tiene el asiento del libro
  mayor (`Transaction.operatorId`), vinculado por `paymentId`, así que hoy el operador se puede
  deducir por ahí — pero es indirecto y se rompe si un pago no generó asiento.
- **Por qué:** no está. Sólo `Payment.notes`, texto libre, que además `createPaymentAction`
  sobrescribe con el aviso de excedente cuando hay saldo a favor
  ([`actions.ts:110`](../src/app/payments/actions.ts)).

**Cambio.** Definir si el motivo es texto libre o una lista de conceptos (beca, segundo curso,
pago adelantado…), agregar el operador al pago o resolverlo por el asiento, y mostrarlo: en el
detalle del pago y en alguna vista agregada por período.

**Decisión relacionada (2026-08-10): los montos en cero se siguen rechazando.**
`createPaymentAction` y `editFeeAmountAction` exigen importes mayores a cero, y eso **se conserva a
propósito** — evita toda una familia de estados raros (pagos fantasma, cuotas de $0 que no se sabe si
son gratis o un error). La contrapartida es que no se puede bonificar el 100% por esta vía; para eso
hay que borrar la cuota. La política de repartir los descuentos entre los cursos existe justamente
para no necesitar el cero.

---

<a id="fin-14"></a>
## FIN-14 · La generación masiva de matrículas ignora el año lectivo · **P1**

**Regresión introducida por [FIN-12](#fin-12) en `96daf04`.** No estaba antes.

`generateYearlyEnrollmentFeesAction`
([`billingActions.ts`](../src/app/payments/billingActions.ts)) recorre las inscripciones **activas
hoy** y no filtra por año lectivo, pero el formulario deja elegir el año —incluido el próximo—
([`GenerateFeesButton.tsx`](../src/app/payments/components/GenerateFeesButton.tsx)). Corrida en
diciembre de 2026 con año 2027, crea matrículas 2027 **atadas a las inscripciones de 2026**.

Ahí se rompe la cadena: cuando después se arman los cursos de 2027 y se inscribe al alumno,
`createEnrollmentAction` busca una matrícula anticipada **sin vincular** y estas ya están vinculadas,
así que no las encuentra y emite otra. **Doble cobro.**

Antes de [FIN-12](#fin-12) el mismo botón creaba matrículas sueltas sin inscripción, que la
inscripción nueva sí consumía. Al pasar la generación a por-inscripción, ese caso se rompió.

**Cambio.** Que la corrida de un año tome sólo las inscripciones de cursos **de ese año lectivo**,
con el criterio que ya usa `createEnrollmentAction`: el año sale de `course.startDate`. Los cursos sin
fecha entran únicamente cuando el año pedido es el año en curso — si no, pedir 2027 volvería a
alcanzar a las inscripciones viejas. Con eso, pedir el año próximo antes de que existan sus cursos no
genera nada, que es lo correcto.

**Tope: antes de tomar las matrículas de diciembre de 2026.** Hasta entonces el daño requiere que
alguien elija el año próximo en el desplegable, que arranca en el año en curso.

---

<a id="fin-15"></a>
## FIN-15 · La matrícula anticipada no tiene restricción única en la base · **P2**

Sale de [FIN-06](#fin-06), que la dejó afuera, y de [FIN-12](#fin-12), que decidió no resolverla con
un índice parcial.

`generateStandaloneEnrollmentFeeAction` ([`actions.ts`](../src/app/payments/actions.ts)) consulta si
ya existe una anticipada del año y después la crea, sin protección de la base: estas matrículas van
sin `enrollmentId` y en Postgres los NULL no chocan entre sí, así que la restricción
`[enrollmentId, type, year, month]` no las alcanza. **Dos envíos simultáneos crean dos.**

Es el tercer caso del patrón "consultar y después crear" que anota [FIN-06](#fin-06), y el único que
quedó sin cubrir. Atenuantes: es de a un alumno por vez, desde un formulario, y el duplicado se ve.

**Cambio.** Un índice parcial —`CREATE UNIQUE INDEX ... WHERE "enrollmentId" IS NULL AND type =
'ENROLLMENT'`—, que Prisma 5 no sabe expresar en el schema y hay que escribir a mano en la migración,
con el costo de quedar fuera de su radar. Evaluar si vale la pena o si alcanza con la ventana chica
que queda.

---

<a id="fin-16"></a>
## FIN-16 · El generador mensual ignora el período lectivo y a los alumnos de baja · **P2**

Sale de [FIN-06](#fin-06), donde estaban anotados como "otros huecos de la misma función" y no tenían
que ver con la restricción única que ese ítem resolvió.

`generateMonthlyFeesAction` ([`billingActions.ts`](../src/app/payments/billingActions.ts)):

- **No contempla `startDate` / `endDate` del curso**: genera cuotas de meses fuera del período
  lectivo.
- **No filtra por `student.status`**: un alumno dado de baja con la inscripción activa sigue
  generando cuotas. `generateYearlyEnrollmentFeesAction` sí lo filtra desde [FIN-12](#fin-12); este
  no.

**Cambio.** Agregar `student: { status: "ACTIVE" }` al filtro y acotar el mes al período del curso
cuando las fechas estén cargadas. Confirmar antes qué se espera de un curso sin fechas.

---

<a id="fin-17"></a>
## FIN-17 · Las cuotas de examen quedaron fuera de la normalización del mes · **P2**

`toggleExamRegistrationAction` ([`enrollments/actions.ts`](../src/app/enrollments/actions.ts)) crea
las cuotas `EXAM` con el mes en que se tocó el interruptor, que es el mismo valor administrativo sin
significado que [FIN-12](#fin-12) le sacó a las matrículas. `formatFeeLabel` tampoco lo muestra:
dice "Derecho de Examen 2026" y nada más.

Consecuencia: la restricción `[enrollmentId, type, year, month]` **no las protege**, porque dos
cuotas de examen de la misma inscripción y año en meses distintos no chocan. Hoy no se duplican
porque el chequeo previo de la función busca por inscripción y año ignorando el mes, pero es
exactamente el "consultar y después crear" de [FIN-06](#fin-06), sin red debajo.

**Cambio.** Mismo tratamiento que la matrícula: un mes fijo para las `EXAM` —conviene una constante
al lado de `ENROLLMENT_FEE_MONTH` ([`utils.ts`](../src/lib/utils.ts))— y una migración que normalice
las existentes con el criterio de [FIN-12](#fin-12). Es chico y cierra el patrón entero.

---

<a id="fin-18"></a>
## FIN-18 · La matrícula anticipada del que sigue en el mismo curso queda sin curso · **P3**

La fila `Enrollment` es la dupla alumno+curso y **no lleva año**, así que el alumno que continúa en el
mismo curso al año siguiente no genera una inscripción nueva. Como el vínculo de la seña ocurre en
`createEnrollmentAction`, esa matrícula anticipada **no se vincula nunca**: queda cobrada, sin curso,
para siempre.

No se le cobra dos veces —la generación masiva descuenta las anticipadas sin vincular, ver
[FIN-12](#fin-12)—, pero la matrícula no dice de qué curso es, y eso se ve en el libro mayor y en la
ficha del alumno.

**Cambio, a decidir entre dos.** Dejar elegir el curso de forma opcional al emitir la anticipada
([`RegisterEnrollmentFeeForm`](../src/app/payments/components/RegisterEnrollmentFeeForm.tsx)), lo que
sólo sirve si el curso del año próximo ya existe — y por definición no existe cuando se cobra la
seña. O vincularla más tarde, desde la ficha del alumno, cuando el curso aparezca. La segunda es la
que sirve para el caso real.

**Relacionado con [FIN-14](#fin-14):** los dos salen de que la inscripción no tiene año lectivo
propio. Si alguna vez se le agrega uno, los dos se simplifican.

---

<a id="fin-19"></a>
## FIN-19 · Dos matrículas del mismo año se ven idénticas fuera del cobro · **P3**

Desde que la matrícula es por curso, un alumno con dos cursos tiene dos matrículas del mismo año.
`formatFeeLabel` ([`utils.ts`](../src/lib/utils.ts)) devuelve "Matrícula 2026" para las dos, sin el
curso, porque no recibe la inscripción.

Dónde se ve: la ficha del alumno ([`students/[id]/page.tsx`](../src/app/students/[id]/page.tsx)), los
últimos pagos del [`dashboard`](../src/app/dashboard/page.tsx) y los recibos
([`ReceiptDownloadButton`](../src/components/financials/ReceiptDownloadButton.tsx)). Ya resueltos: el
selector de cobro ([`RegisterFeeForm`](../src/app/payments/components/RegisterFeeForm.tsx), en
[FIN-12](#fin-12)) y el reporte de deudores, que arma la etiqueta aparte.

**Cambio.** Que `formatFeeLabel` acepte el nombre del curso como parámetro opcional y lo agregue
cuando esté. Es el único lugar donde se decide; los llamadores le pasan lo que ya tienen a mano.

---

<a id="fin-20"></a>
## FIN-20 · Cuotas duplicadas al cambiar de curso: la regla única es por inscripción · **P1** · 🗣️ Pedido del cliente

**Reporte (2026-08-13).** Aparecieron cuotas duplicadas en alumnos que habían cambiado de curso.

**Por qué la restricción de [FIN-06](#fin-06) no lo atajó.** El índice que se agregó es
`@@unique([enrollmentId, type, year, month])`: impide dos cuotas del mismo mes **dentro de una
inscripción**. No dice nada sobre el alumno. Si el mismo alumno tiene dos inscripciones activas,
cada una genera su cuota del mismo mes y la base las acepta, porque para ella son de inscripciones
distintas.

Y esa regla es la correcta en el caso general: un alumno inscripto en dos cursos a la vez **debe**
tener dos cuotas por mes, una por curso. El problema no es la regla, es que el cambio de curso puede
dejar dos inscripciones abiertas.

**Cómo se llega ahí.** Hay dos caminos para mover un alumno de curso y sólo uno es correcto:

- [`changeStudentCourseAction`](../src/app/students/[id]/actions.ts) **reasigna el `courseId` de la
  inscripción existente**. Es el camino bueno: la inscripción sigue siendo una, y la restricción de
  FIN-06 sigue valiendo. Las cuotas ya generadas quedan colgando de esa inscripción, con el precio
  del curso viejo — que es otra discusión, pero no genera duplicados.
- Inscribir al alumno en el curso nuevo con
  [`createEnrollmentAction`](../src/app/enrollments/actions.ts) **sin dar de baja la vieja**. El
  índice `studentId_courseId` sólo impide repetir el mismo curso, así que esto se permite: quedan dos
  inscripciones `ACTIVE`. Desde ese momento, cada corrida del generador mensual produce dos cuotas
  del mismo mes para el mismo alumno.

Nada en la interfaz distingue "cambiar de curso" de "inscribir en otro curso más", y las dos cosas se
ven igual desde la ficha del alumno.

**Verificar antes de decidir el arreglo.** Una consulta a la base cierra la discusión: alumnos con
más de una inscripción `ACTIVE`, y si sus cuotas duplicadas son del mismo mes con `enrollmentId`
distinto. Si es eso, el diagnóstico está confirmado; si los duplicados comparten `enrollmentId`, el
índice de FIN-06 no está aplicado en esa base y el problema es otro.

**Cambio — a decidir con el cliente.** La pregunta de fondo es de negocio, no técnica: **¿un alumno
puede cursar dos cursos al mismo tiempo en este instituto?**

- Si **no** puede, la solución es dura y simple: impedir una segunda inscripción activa, y que el
  cambio de curso pase siempre por `changeStudentCourseAction`.
- Si **sí** puede, no se puede prohibir la segunda inscripción, y hay que atacar el cambio de curso:
  que la interfaz obligue a elegir entre "mover" y "agregar", y que al mover se cierre la inscripción
  anterior.

En los dos casos hace falta además **limpiar los duplicados ya generados**, con el mismo cuidado de
FIN-06: sólo se pueden borrar cuotas sin ningún pago asociado.

**Relacionado.** [FIN-16](#fin-16) (el generador mensual ignora el período lectivo y a los alumnos
de baja) toca la misma función y conviene mirarlos juntos.

---

<a id="fin-21"></a>
## FIN-21 · No se puede registrar un pago con fecha pasada · **P2**

**Estado actual.** Los tres lugares que crean un `Payment` escriben la fecha a mano con
`date: new Date()`: el cobro normal
([`payments/actions.ts:119`](../src/app/payments/actions.ts)), el pago único de curso completo
([`:374`](../src/app/payments/actions.ts)) y la aplicación de saldo a favor
([`:969`](../src/app/payments/actions.ts)). Los asientos del libro mayor que los acompañan hacen lo
mismo.

El modelo **sí lo permite**: `Payment.date` es un campo propio con `@default(now())`, distinto de
`createdAt`, y existe justamente para poder guardar la fecha del cobro. Lo que falta es exponerlo:
ningún formulario de cobro tiene campo de fecha, y el código pisa el default con el momento de la
carga. Hoy `date` y `createdAt` son siempre el mismo valor.

**Dos consecuencias, ninguna cosmética.**

1. **El recibo lleva la fecha de carga, no la del cobro.** El PDF imprime `data.date`, que sale de
   `payment.date` ([`ReceiptDownloadButton.tsx:52`](../src/components/financials/ReceiptDownloadButton.tsx)).
   Un pago recibido el viernes y cargado el lunes le llega al padre fechado el lunes.
2. **La caja del período se corre.** El KPI "Cobrado" y la rentabilidad filtran el libro mayor por
   fecha de asiento ([`payments/page.tsx:87`](../src/app/payments/page.tsx)), y el asiento se crea
   con la misma fecha del sistema. Cargar con demora mueve plata de un mes al siguiente. Es la
   explicación más probable de un futuro "los números del mes no me cierran".

**Cómo apareció (2026-08-13).** Salió al revisar qué efecto tuvo [FIN-12](#fin-12) sobre los
recibos. Las matrículas se habían cargado en febrero para que los padres vieran una fecha coherente,
y la duda era si normalizar el mes a `ENROLLMENT_FEE_MONTH` los había roto. **No los rompió**: el
recibo nunca miró el mes de la cuota — el concepto sale de `formatFeeLabel`, que para `ENROLLMENT`
devuelve `Matrícula {año}` e ignora el mes, y la fecha sale del pago. Al confirmar eso quedó a la
vista que la fecha del pago tampoco es elegible.

**Cambio.** Agregar un campo de fecha opcional a los formularios de cobro y propagarlo a las tres
creaciones **y al asiento del libro mayor**: si el pago y el asiento no llevan la misma fecha, el
recibo y la caja dejan de coincidir, que es peor que el problema actual.

Tres decisiones antes de tocar código:

- **Rango admitido.** No futura. Probablemente tampoco anterior al inicio del año lectivo, para que
  un error de tipeo no mande un cobro a 2019.
- **Quién puede retrofechar.** Una fecha de cobro editable es una forma de maquillar la caja de un
  período. Si la secretaria puede, conviene que quede registrado quién lo hizo — se cruza con
  [SEC-03](#sec-03) (qué puede hacer una secretaria en lo financiero) y con
  [ARQ-10](#arq-10) (auditoría de las acciones del panel).
- **Qué pasa con lo ya cargado.** Los pagos existentes tienen la fecha de carga y no hay forma de
  saber la real. No hay migración posible acá: se arregla de acá en adelante.

**Relacionado.** [FIN-08](#fin-08) es el otro lado de la misma carencia de fechas: aquel es *cuándo
vence* una cuota, este es *cuándo se cobró*. Conviene decidirlos juntos.

---

# Bugs funcionales

<a id="bug-01"></a>
## BUG-01 · El alumno que entra con DNI no puede guardar prácticas · **P1**

[`src/app/api/practice/session/route.ts:25`](../src/app/api/practice/session/route.ts):

```ts
if (!session || !session.user?.email) return new Response("No autorizado", { status: 401 });
```

`Student.email` es opcional en el schema y el login por DNI existe
([`auth.ts:48`](../src/lib/auth.ts)). **Todo alumno sin email recibe 401 al terminar de practicar**,
y pierde la sesión completa sin explicación.

**Por qué el email es opcional (contexto del cliente).** El instituto tiene alumnos de 6, 7 y 8 años
que no tienen correo electrónico. El dato obligatorio para todo estudiante es el **DNI**, y es con el
DNI que esos chicos entran al sistema. No es un campo opcional por descuido: identificar al alumno
por email deja afuera a toda una franja de usuarios reales.

Además, en la línea 53 busca `student.findFirst({ where: { email } })` **sin filtrar por instituto**,
y el email de alumno es único solo por instituto: dos homónimos en institutos distintos y la sesión
se guarda en el legajo equivocado.

**Cambio.** Usar `session.user.id` como `studentId`, tal como ya lo hace correctamente
[`practice/page.tsx:21`](../src/app/practice/page.tsx). Elimina las dos fallas de una vez.

**Nota.** Verificar si hay más endpoints que identifiquen al alumno por email en lugar de por id.

**Estado: resuelto en el código, pendiente de verificar en stage.**

La ruta ya no toca `session.user.email` ni busca al alumno por email: usa
[`getAuthContext()`](../src/lib/authz.ts), que devuelve el id de la sesión y de paso comprueba contra
la base que la cuenta siga activa. Un `auth.isStudent` falso responde 403, el mismo código que antes
daba el "no tiene perfil de alumno" — la vista previa del profesor no se ve afectada porque
`SpeakingHub`, `ListeningLab` y `AIChatbot` sólo hacen el POST cuando `!isPreview`.

En el mismo pase se acotó al instituto la búsqueda de la práctica. El `lessonPracticeId` viaja en el
body y el `findUnique` no miraba de quién era la clase: un alumno podía dejar una `PracticeSession`
colgada de una clase de otro instituto y ensuciar sus métricas. Ahora la consulta exige
`lesson.course.instituteId === auth.instituteId`. Es un caso más de los que enumera
[ARQ-01](#arq-01).

**Un hueco más, encontrado al verificar el arreglo.** El DNI es obligatorio para el negocio pero
opcional en el código, y eso es deliberado: el cliente arrastraba desorden administrativo y la
normalización se delegó a él, de forma progresiva (de ahí el link de completado de datos para
tutores). El mecanismo funciona porque el administrador se entera de qué falta cuando el alumno
quiere usar la plataforma. **Salvo en un caso:** sin email y sin DNI el alumno no puede iniciar
sesión, y el login le devuelve el mismo "credenciales inválidas" que si erró la contraseña. Ni él ni
el administrador se enteran de qué falta. Es el único dato incompleto que no se anuncia solo.

Se agregó la etiqueta **"No puede entrar"** al listado de alumnos
([`students/page.tsx`](../src/app/students/page.tsx)), junto a las que ya existían. Reemplaza a
`sin_dni` cuando aplica: la vieja etiqueta salía también en alumnos que entran por email, así que se
leía como ruido. No se tocó ningún camino de alta ni se endureció el schema — sería ir contra la
decisión ya tomada, y con los datos aún sin normalizar trabaría altas legítimas.

**Sobre la nota.** Se revisaron todas las búsquedas de `Student` del código: ésta era la única que
identificaba al alumno por email. La de [`auth.ts:50`](../src/lib/auth.ts) es el login y ahí el email
es el dato de entrada — su problema de instituto es [SEC-05](#sec-05), no éste. El resto ya resuelve
por id.

---

<a id="bug-02"></a>
## BUG-02 · Borrar una clase con prácticas hechas falla · **P1**

En [`prisma/schema.prisma`](../prisma/schema.prisma), `Attendance` (400), `Grade` (417) y
`LessonPractice` (346) tienen `onDelete: Cascade`. **`PracticeSession` no** (líneas 371 y 374), así
que queda en `Restrict` por defecto.

`lesson.delete()` en
[`courses/[id]/lessons/actions.ts:213`](../src/app/courses/[id]/lessons/actions.ts) viola la FK y el
`catch` devuelve un error genérico. El docente no puede borrar la clase y no sabe por qué.

**Decisión tomada (2026-08-09).** Se resuelve con **borrado lógico**, no físico. La clase pasa a
`status: "DELETED"` y las sesiones de práctica se conservan intactas. Motivo del cliente: si alguien
del instituto toca lo que no debe, los datos siguen estando y se pueden recuperar.

**Cambio.**
1. Agregar `status` al modelo `Lesson` (el resto de los modelos ya usa el patrón `ACTIVE` / `DELETED`).
2. Reemplazar `lesson.delete()` por un `update` de estado en
   [`courses/[id]/lessons/actions.ts:213`](../src/app/courses/[id]/lessons/actions.ts).
3. Filtrar `status: "ACTIVE"` en todas las consultas de clases: listados, asistencia, notas,
   calendario, métricas de práctica y liquidación de sueldos (`lib/payroll.ts` cuenta clases dictadas
   — verificar que no compute las borradas).

**Alcance mayor.** Este ítem es un caso particular de [ARQ-05](#arq-05), que audita todos los
borrados físicos del sistema. Conviene resolverlos juntos y de una sola forma.

**Estado: resuelto en el código, pendiente de verificar en stage.**

`Lesson` tiene `status` (migración `20260811150000_add_lesson_status`, con índice
`("courseId", "status")` porque toda consulta de clases filtra por esos dos campos), `deleteLessonAction`
hace `update` en vez de `delete`, y editar o borrar una clase ya borrada devuelve error.

**Lo que llevó el trabajo fue el punto 3.** Quedaron con filtro de estado: el listado y el navegador
de meses del curso, las métricas de práctica del curso, el calendario, los próximos eventos de los
cuatro tableros (alumno, docente, administración y tutor), las estadísticas académicas, el listado de
prácticas del alumno, la vista previa del docente, las pantallas de asistencia, escáner y notas —que
ahora redirigen al curso si la clase está borrada—, el alta del examen final y **la liquidación de
sueldos**, que era el que salía en plata: `lib/payroll.ts` contaba clases dictadas sin mirar el
estado. Por lo mismo, marcar clases como pagadas en `teachers/actions.ts` sólo alcanza a las activas.

**Dos lugares donde a propósito no se filtra**, ambos comentados en el código:

- El chequeo de "esta clase ya existe" de `generateLessonsAction`. Una clase borrada sigue ocupando su
  lugar: si se filtrara, regenerar el período reviviría lo que alguien borró, y encima duplicado.
  Para recuperar una clase hay que reactivarla, no volver a generarla.
- Las métricas de práctica del instituto (`PlaygroundChartServer`). Ahí se mide actividad, y que el
  docente borre la clase después no hace que el alumno no haya practicado.

**Un efecto que el ítem no anticipaba.** `Attendance` y `Grade` **sí** tenían cascade, así que hasta
acá desaparecían junto con la clase. Con borrado lógico la fila sobrevive, y sin filtrar quedaría un
"presente" de una clase que ya no existe en el legajo del alumno y en el portal del tutor. Se
filtraron los seis listados y los cuatro contadores de asistencia. Las filas siguen en la base: es
justamente lo que permite recuperarlas.

**Queda para [ARQ-05](#arq-05):** no hay forma de reactivar una clase borrada desde la interfaz. Hoy
se hace en la base.

**Decisión (2026-08-11).** No se hace ahora. El lugar natural es el panel del **superadministrador**,
no el del instituto: recuperar lo que alguien borró es una herramienta de soporte, no una función del
día a día. Se define junto con el resto del borrado lógico cuando se retome [ARQ-05](#arq-05).

---

<a id="bug-03"></a>
## BUG-03 · Vaciar las frases de una clase ya practicada falla · **P1**

Mismo origen que [BUG-02](#bug-02).
[`courses/[id]/lessons/actions.ts:175`](../src/app/courses/[id]/lessons/actions.ts) ejecuta
`lessonPractice.deleteMany({ where: { lessonId } })` cuando el docente borra todas las frases. Como
`PracticeSession.lessonPractice` no tiene cascade, falla si algún alumno ya practicó.

**Cambio.** Se resuelve junto con BUG-02. Alternativa razonable: en vez de borrar el
`LessonPractice`, marcarlo `isPublished: false` y conservar el registro.

**Estado: resuelto en el código, pendiente de verificar en stage.** Se tomó esa alternativa, con un
agregado: además de despublicar se vacía el contenido (`speakingPhrases`, `listeningText`,
`chatScenario`), porque si no, volver a poner frases más adelante arrastraría el texto viejo de
listening y el escenario de chat sin que el docente los haya vuelto a escribir. Para él el efecto es
el mismo que antes —la práctica desaparece del curso—, y las sesiones que los alumnos ya hicieron
siguen en pie.

---

<a id="bug-04"></a>
## BUG-04 · El rol de la secretaria se revierte a profesora · **P1** · 🗣️ Pedido del cliente

**Reporte.** Una usuaria con dos roles (secretaria y profesora) dice que el sistema "siempre se le
cambia a profesora".

**Lo que descarté.** La lógica de prioridad **no** es la causa: `ROLE_PRIORITY` en
[`src/lib/roles.ts:4`](../src/lib/roles.ts) pone `SECRETARY` **antes** que `TEACHER`, así que si
tuviera ambos roles y no hubiera cookie, el sistema elegiría secretaria. La cookie tampoco parece el
problema: `switchRoleAction` la guarda 30 días con `path: "/"`
([`actions/roles.ts:11`](../src/app/actions/roles.ts)).

**Dos causas candidatas (sin verificar en runtime).**

1. **JWT desactualizado — la más probable.** `getActiveRole` acepta la cookie solo si el rol está en
   `userRoles`, y `userRoles` sale del **token**, no de la base
   ([`auth.ts:75`](../src/lib/auth.ts)). Si a la usuaria le agregaron el rol de secretaria **después**
   de que iniciara sesión, su token sigue diciendo `roles: ["TEACHER"]`. La cookie `SECRETARY` se
   descarta por inválida y cae a la prioridad → `TEACHER`. Efecto secundario que confirma el
   diagnóstico: con un solo rol en el token, `RoleSwitcher` se oculta
   ([`RoleSwitcher.tsx:34`](../src/components/layout/RoleSwitcher.tsx)). Es exactamente
   [SEC-08](#sec-08). El token de NextAuth dura 30 días por defecto.
2. **Fallback hardcodeado a profesora.** Al menos 8 páginas usan
   `const userRoles = sessionUser.roles || [user?.role || "TEACHER"]` — con `"TEACHER"` escrito a
   mano como valor por defecto (`courses/page.tsx:30`, `courses/[id]/page.tsx:32`,
   `teachers/page.tsx:24`, `spreadsheet/page.tsx:18`, `attendance/page.tsx:27`, `grades/page.tsx:27`,
   `scanner/page.tsx:22`, `reports/[templateId]/page.tsx:25`). Si `roles` viene vacío por cualquier
   motivo, la usuaria queda como profesora. Es un bug latente independientemente de cuál sea la causa
   de este reporte.

**Diagnóstico antes de codificar.**
1. Consultar su registro en la base: ¿qué contienen `role` y `roles`?
2. Pedirle que **cierre sesión y vuelva a entrar**. Si se arregla → es la causa 1 (JWT), y el arreglo
   es [SEC-08](#sec-08).
3. Confirmar en el navegador si la cookie `lingua_current_role` existe después de cambiar de rol.

**Cambio.** Eliminar el `|| "TEACHER"` hardcodeado de las 8 páginas (no debe haber un rol por
defecto: si no hay roles, es un error). Y resolver [SEC-08](#sec-08) para que un cambio de roles
tenga efecto sin requerir reinicio de sesión.

**Dependencia.** Se resuelve junto con [SEC-01](#sec-01) y [SEC-08](#sec-08): los tres son la misma
deuda de la migración a multi-rol.

### Resuelto — 2026-08-10 · pendiente de verificar con la usuaria

**El fallback hardcodeado ya no existe.** Se eliminó `|| "TEACHER"` de las 8 páginas: donde había
`sessionUser.roles || [user?.role || "TEACHER"]` ahora hay `sessionUser.roles ?? []`. Sin roles no
hay rol por defecto.

**La auditoría de la base descarta un problema de datos.** La usuaria del reporte es la única con
`role = 'TEACHER'` y `roles = ['TEACHER', 'SECRETARY']`: `roles[]` la tiene bien cargada como
secretaria. Confirma la causa 1 — el token es lo que está viejo.

**La causa 1 se cerró con [SEC-08](#sec-08).** El token ahora relee los roles de la base cada 5
minutos, así que el `RoleSwitcher` recupera la opción de secretaria sola, sin que la usuaria tenga
que cerrar sesión. La cookie `lingua_current_role` que ya tenía guardada deja de descartarse por
inválida y `getActiveRole` devuelve `SECRETARY`.

**Qué confirmar con ella.** Que al entrar aparezca el selector de rol y que quede en modo Secretaría
entre sesiones. Si sigue pasando, la causa no era ninguna de las dos y hay que mirar la cookie en el
navegador.

### Reabierto — 2026-08-13 · 🗣️ vuelve a reportarse

Sigue pasando, así que la causa no era ninguna de las dos anteriores. **Esta vez sí está
identificada, y es una tercera, independiente de las otras.**

**La cookie es `httpOnly` y el `Navbar` intenta leerla desde JavaScript.**
[`switchRoleAction`](../src/app/actions/roles.ts) guarda `lingua_current_role` con `httpOnly: true`,
que es exactamente lo que impide que el navegador la exponga a `document.cookie`. Y
[`Navbar.tsx:46`](../src/components/layout/Navbar.tsx) hace justamente eso:

```ts
const roleCookie = document.cookie.split("; ").find((row) => row.startsWith("lingua_current_role="))
```

Ese `find` devuelve `undefined` **siempre**, en todos los navegadores, desde el día uno. No es una
falla intermitente ni depende de los datos.

**Qué pasa entonces.** Ese camino sólo corre cuando la página no le pasa `currentActiveRole` al
`Navbar`. En ese caso el rol mostrado queda en el valor inicial: `userRoles[0]` — **el primer
elemento del array, sin ninguna prioridad aplicada**. La auditoría anotada más arriba dice que la
usuaria tiene `roles = ['TEACHER', 'SECRETARY']`, así que `userRoles[0]` es `TEACHER`. El menú la
muestra como profesora aunque su cookie diga secretaria.

**Por qué lo ve tanto.** Son 11 pantallas las que renderizan `<Navbar />` sin la prop, contra 30 que
sí la pasan. Las 11 son, casi exactamente, el trabajo de una secretaria:

`/payments`, `/payments/debtors`, `/payments/payroll`, `/payments/tour`, `/enrollments/new`,
`/students/new`, `/guardians/[id]`, `/courses/new`, `/courses/classrooms`, `/courses/levels`.

Entra a Finanzas o a inscribir un alumno y el menú se le pasa a profesora; vuelve a una pantalla que
sí manda la prop y aparece de nuevo como secretaria. Descripto por quien lo sufre, eso es
"siempre se me cambia a profesora".

**Alcance: es la interfaz, no los permisos.** Las acciones del servidor resuelven el rol con
`requireRole`/`getAuthContext`, que leen la base y la cookie real. La secretaria no pierde
atribuciones — pierde el menú, que en esas pantallas pasa a ser el de profesora y le esconde
Finanzas e Informes.

**Cambio.**

1. Pasar `currentActiveRole` en las 11 pantallas, como ya hacen las otras 30.
2. Borrar el bloque que lee `document.cookie` en `Navbar`: no puede funcionar y disimula el olvido de
   la prop. Sin rol activo no hay que adivinar uno.
3. Que el valor inicial deje de ser `userRoles[0]`. Si hace falta un rol por defecto, tiene que salir
   de la prioridad de [`roles.ts`](../src/lib/roles.ts) —donde `SECRETARY` va antes que `TEACHER`—,
   que es el criterio que ya usa el servidor.

**Lección para la ficha.** Los tres intentos fallaron por lo mismo: se buscó la causa en la sesión y
en los datos, y estaba en la pantalla. El síntoma "el sistema me cambia el rol" describía un cartel,
no un permiso.

---

<a id="bug-05"></a>
## BUG-05 · El admin ve el hilo en la bandeja pero recibe 404 al abrirlo · **P1** · 🗣️ Pedido del cliente

**Reporte.** Si una profesora le pasa la tarea al tutor de un alumno ausente, el admin ve la
conversación en la bandeja, pero al entrar recibe un 404.

**Causa: confirmada.** Las dos funciones no comparten el criterio de acceso.

`getThreadsForUser` **sí** contempla al admin
([`actions/messages.ts:81`](../src/app/actions/messages.ts)):

```ts
const whereClause = isAdmin
    ? { instituteId }                                   // admin ve todo el instituto
    : isStudent ? { participants: { some: { studentId: userId } } }
                : { participants: { some: { userId } } };
```

`getThread` **no recibe `isAdmin`** y exige participación
([`actions/messages.ts:208-211`](../src/app/actions/messages.ts)):

```ts
const isParticipant = thread.participants.some((p) =>
    isStudent ? p.studentId === currentUserId : p.userId === currentUserId
);
if (!isParticipant) return null;   // → notFound() → 404
```

El admin no es participante del hilo, así que `getThread` devuelve `null` y
[`messages/[threadId]/page.tsx:29`](../src/app/messages/[threadId]/page.tsx) dispara `notFound()`.

**Cambio.**
1. Pasar `isAdmin` a `getThread`, igual que ya se hace con `getThreadsForUser`.
2. **Crítico:** al permitir el acceso por rol en lugar de por participación, hay que validar
   `thread.instituteId === user.instituteId`. Hoy `getThread` no lo chequea porque la participación
   ya lo garantizaba implícitamente. Sin esta validación se abre una fuga entre institutos.
3. Definir el comportamiento de "marcar como leído": el bloque de
   [`messages.ts:214`](../src/app/actions/messages.ts) actualiza `lastReadAt` del participante. Para
   un admin que no participa no hay fila que actualizar — el `updateMany` no falla, simplemente no
   afecta nada. Verificar que no rompa el contador de no leídos.

**Decisión tomada (2026-08-09).** El admin **puede responder y se suma al hilo** como participante,
de modo que la profesora y el tutor vean que se incorporó.

**Estado: resuelto.** Corregido en `72fbdca` y `7782037`, verificado en stage el 2026-08-09: el
admin abre el hilo, responde, y queda listado entre los participantes.

`7782037` cerró un hueco detectado durante esa prueba: la vista guardaba en estado sólo los
mensajes, así que tras responder el contador de participantes y el aviso de "estás viendo como
administración" seguían mostrando el estado previo hasta recargar la página.

El arreglo no pudo hacerse pasando un parámetro `isAdmin` a `getThread`: todas las funciones de
[`actions/messages.ts`](../src/app/actions/messages.ts) son server actions —endpoints POST que el
navegador invoca con los argumentos que quiera— y el módulo **no tenía ninguna verificación de
sesión**. Cualquiera habría mandado `isAdmin: true`. En el mismo pase se cerraron dos agujeros
preexistentes de la misma raíz: `sendMessage` confiaba en el `senderUserId` recibido (permitía
enviar mensajes en nombre de otra persona, incluso apareciendo como "Administración"), y `getThread`
confiaba en `currentUserId` (permitía leer hilos ajenos conociendo el id de un participante).

Las seis funciones derivan ahora identidad, rol activo e instituto de la sesión mediante
`getMessagingContext()`. Ver [BUG-06](#bug-06) y [ARQ-06](#arq-06) para lo que quedó fuera.

---

<a id="bug-06"></a>
## BUG-06 · El admin ve todos los hilos del instituto como no leídos · **P2**

**Problema.** El admin ve todos los hilos del instituto en la bandeja, pero no es participante de
casi ninguno. El contador de no leídos se calcula comparando el último mensaje contra el `lastReadAt`
**del participante** ([`actions/messages.ts`](../src/app/actions/messages.ts), en
`getThreadsForUser`), y para un no participante ese valor es `null`, así que cuenta como no leído
siempre. Nada lo cambia al abrir el hilo: `getThread` sólo actualiza `lastReadAt` si el usuario
participa.

Resultado: el badge del sobrecito muestra permanentemente el total de hilos del instituto, y nunca
baja. Es previo a [BUG-05](#bug-05), pero se nota más ahora que el admin puede abrirlos.

**Cambio — opciones.**
1. **Marcar como leído al abrir**, creando la fila de `ThreadParticipant` para el admin. Simple, pero
   lo convierte en participante por el sólo hecho de mirar, que contradice la decisión de BUG-05
   (sumarse es una acción explícita: responder).
2. **Tabla aparte de lecturas** (`ThreadRead`) desacoplada de la participación. Más prolijo y
   habilita "marcar como leído" para cualquier rol observador.
3. **No contar los hilos donde no participa.** El badge pasa a reflejar sólo lo que le compete
   directamente, y los hilos del instituto quedan visibles en la bandeja sin inflar el contador. Es
   la opción más barata y probablemente la que mejor refleja la expectativa del usuario.

Recomiendo la 3, y revisar con el cliente si el admin espera enterarse de mensajes nuevos en hilos
que no son suyos.

---

<a id="bug-07"></a>
## BUG-07 · No se pueden guardar las asistencias de la clase · **P1** · 🗣️ Pedido del cliente

**Reporte (2026-08-13).** Los profesores dicen que no pueden guardar el parte de asistencia. Sin
detalle de en qué clases, con cuántos alumnos, ni con qué mensaje en pantalla.

**Lo que descarté.** El formulario está bien:
[`AttendanceForm`](../src/app/courses/[id]/lessons/[lessonId]/attendance/AttendanceForm.tsx) arma el
payload con los alumnos que tienen estado marcado, llama a la acción y muestra el error que reciba.
El problema está del lado del servidor, en
[`saveLessonAttendanceAction`](../src/app/courses/[id]/lessons/[lessonId]/attendance/actions.ts).

**Causa más probable: se agota la transacción.** La acción abre una `$transaction` interactiva y
adentro hace **una consulta por alumno**, en serie: un `findMany` y después un `update` o un `create`
por cada uno. Contra una base remota, con 25 o 30 alumnos son 30 viajes de ida y vuelta dentro de una
transacción cuyo tope por defecto en Prisma son 5 segundos. Al pasarse, se cae **todo el guardado**,
no una fila.

Encaja con el reporte: intermitente, peor en los cursos más numerosos y en los horarios de más uso,
y sin patrón claro para quien lo sufre. Y es el mismo problema que [FIN-06](#fin-06) ya documenta
haber sufrido en producción con la generación de cuotas y de notas — ahí la solución no fue agrandar
el tope sino colapsar todo a una sola query. Es el tercer lugar con el mismo patrón.

**Segunda causa posible: choque con el kiosco de QR.** La acción decide entre `update` y `create`
mirando una lectura previa, y no hay nada que impida que entre la lectura y la escritura el kiosco
([`scanAttendanceQRAction`](../src/app/courses/[id]/lessons/[lessonId]/attendance/actions.ts)) cree
la fila del mismo alumno. El modelo tiene `@@unique([studentId, lessonId])`, así que el `create`
falla y arrastra la transacción entera. Es más raro, pero explicaría una falla puntual en una clase
donde se usó el escáner.

**Cambio propuesto.** Reemplazar el bucle por un `upsert` por alumno sobre la clave
`studentId_lessonId`, agrupados en un `$transaction([...])` en su forma de arreglo: es un solo lote
en vez de treinta viajes, elimina la carrera con el kiosco por construcción, y sigue siendo atómico.

**Hueco de permisos que aparece de paso.** La acción sólo verifica que haya sesión con email
(`if (!session || !session.user?.email)`). No comprueba rol ni instituto: cualquiera con sesión
—incluido un tutor— puede escribir asistencia de cualquier clase de cualquier instituto, si conoce
los ids. No es la causa de este bug, pero es del mismo tipo que [SEC-03](#sec-03) y quedó fuera de
aquel barrido. Corregirlo en el mismo pase.

**Antes de tocar código: pedir el mensaje exacto.** La acción devuelve `error.message` crudo de
Prisma al cliente, así que la profesora **está viendo el texto del error**. Un `P2028` (transacción
cerrada) confirma la causa 1; un `P2002` (restricción única) confirma la 2. Una captura de pantalla
decide entre las dos en un minuto y evita adivinar.

Que haga falta pedir una captura para saber qué se rompió es, en sí, [ARQ-09](#arq-09): los errores
no se registran en ningún lado.

### Resuelto — 2026-08-13 · pendiente de verificar en stage

**La captura terminó siendo innecesaria.** El cambio cubre las dos causas candidatas a la vez, así
que no hacía falta distinguirlas para arreglarlo. El bucle de un `findMany` más un `update` o
`create` por alumno dentro de una `$transaction` interactiva pasó a **dos sentencias masivas**: un
`UPDATE ... FROM (VALUES ...)` para los alumnos que ya tenían fila y un
`createMany({ skipDuplicates: true })` para los que no.

**Medido, no estimado.** Contra Postgres local, con 25 alumnos —el curso más grande del cliente—,
contando las sentencias que Prisma manda de verdad:

| Forma de guardar | Alta | Regrabado |
|---|---|---|
| Bucle en `$transaction` interactiva (código viejo) | 53 | **78** |
| Un `upsert` por alumno en `$transaction([...])` | 27 | 27 |
| `UPDATE ... FROM (VALUES)` + `createMany` (lo que quedó) | **4** | **4** |

**El regrabado es el caso común y era el peor**: el profesor corrige y vuelve a guardar. Daba 78
sentencias porque el `update` de Prisma hace un `SELECT` antes de cada `UPDATE`. Con la base en otra
región (~65 ms de ida y vuelta) eso son ~5 segundos, que es **exactamente** el tope por defecto de la
transacción interactiva. El reporte no necesitaba más explicación que esa aritmética.

**Un `$transaction([...])` de upserts no alcanzaba, y conviene que quede escrito por qué.** La forma
de arreglo no colapsa a una sola query: manda el lote al motor de Prisma en una llamada, pero el
motor sigue emitiendo una sentencia por alumno. Son 27 en vez de 78 —suficiente para que deje de
fallar— pero mantienen la conexión tomada ~27 viajes. Con un pool de 5, mientras un profesor guarda
los demás esperan, y el final de hora es justo cuando guardan todos juntos. Es la misma razón por la
que se sacaron las transacciones de las notas de los informes — que quedaron con su propio costo,
medido de paso y anotado en [ARQ-11](#arq-11).

**La transacción que quedó no es la que se sacó en los informes.** Aquella mantenía la conexión a lo
largo de N viajes con el control volviendo a JS en el medio; ésta son dos sentencias en un solo lote.
Y **sale gratis**: medido, `createMany` abre su propio `BEGIN`/`COMMIT` igual, así que envolver las
dos no agrega ni una sentencia y a cambio el parte queda atómico.

**Por qué no `updateMany`, y por qué SQL crudo.** Cada alumno lleva su propio estado y su propia
nota, y `updateMany` aplica **un** valor a todas las filas que matchean. El `VALUES` es la forma de
mandar 25 valores distintos en una sentencia; va parametrizado con `Prisma.sql`. Es la única
sentencia cruda de este módulo, y el módulo de pagos ya tenía precedente.

**Se descartó `INSERT ... ON CONFLICT` en una sola sentencia** (medido: 1 sentencia, contra 4).
Obliga a generar `id` y `updatedAt` a mano, porque no hay defaults en la base para ninguno de los
dos, y no hay librería de cuid entre las dependencias: los ids quedarían con otro formato que el
resto de la tabla. Ahorra ~3 viajes; no paga el precio.

**Verificado contra la base local**, 15 comprobaciones: escribe las 25 filas con sus estados y notas,
el regrabado no duplica ni pierde `id` ni `createdAt`, limpia la nota que se vació, pisa las filas
que había dejado el kiosco de QR sin chocar contra la restricción única, no toca las filas de otra
clase, y funciona con un solo alumno. **Falta la verificación en stage**, que es donde se ve la
latencia real.

**Si aparece lentitud, el lugar a mirar no es esta acción** sino la región de la base contra la de
Vercel. Sin `vercel.json` las funciones corren en `iad1` (us-east-1) y de las dos bases configuradas
una está en us-east-1 y la otra en us-west-2. Esa diferencia la paga **cada** consulta de la
aplicación, no sólo el parte de asistencia.

**El error crudo dejó de viajar al cliente.** Antes se devolvía `error.message` de Prisma tal cual y
la profesora leía un `P2028` en pantalla. Ahora el detalle va a `console.error` con `lessonId` y
`courseId`, y a la pantalla va un mensaje en castellano. No resuelve [ARQ-09](#arq-09) —sigue sin
haber registro centralizado— pero deja el rastro en el log de Vercel, que es donde hay que mirar si
esto reaparece.

**El hueco de permisos, cerrado con la política que ya aplicaban las pantallas.** Las dos acciones
del archivo pasan por un helper común, `authorizeLessonAttendance`: `requireRole(INSTITUTE_STAFF)`,
la clase tiene que ser del `courseId` recibido y de un curso del instituto propio, y **un docente
sólo entra al curso que dicta** —los roles administrativos siguen pasando a cualquier curso—. Con
eso queda cubierto el punto 3 de [FEAT-07](#feat-07) para asistencia; **notas y práctica siguen
pendientes**, que es donde vive el resto de ese alcance.

Tres cosas más que salieron del mismo pase, todas por el mismo criterio de que el servidor sostenga
lo que la pantalla ya muestra:

- **`scanAttendanceQRAction` tenía el hueco idéntico** treinta líneas más abajo y quedaba abierto si
  se arreglaba sólo la acción del enunciado. Usa el mismo helper. Su lógica de escaneo no se tocó.
- **El curso finalizado es de lectura también del lado del servidor.** La pantalla ya lo mostraba en
  modo lectura y el kiosco redirigía; la acción lo aceptaba igual.
- **Sólo se escribe asistencia de alumnos matriculados** (`ACTIVE` o `FINISHED`, lo mismo que lista
  la pantalla). Se **filtra** en vez de rechazar el parte entero: si a alguien le dieron de baja la
  matrícula con la pantalla abierta, el profesor no pierde la clase por eso. Lo descartado queda en
  el log.

**Qué falta verificar en stage:** guardar un parte en el curso más numeroso que haya, y guardar con
el escáner de QR corriendo en paralelo sobre la misma clase.

---

<a id="feat-01"></a>
## FEAT-01 · Adjuntar archivos en el primer mensaje de un hilo · **P2** · 🗣️ Pedido del cliente

**Reporte.** Para mandar un adjunto hay que enviar primero un mensaje y recién después aparece la
opción de adjuntar.

**Causa: confirmada, y es arquitectónica.**

- `createThread` **no tiene parámetros de adjunto**
  ([`actions/messages.ts:325-347`](../src/app/actions/messages.ts)). `sendMessage` sí
  ([`messages.ts:420-424`](../src/app/actions/messages.ts)).
- `ComposeClient.tsx` no tiene ninguna UI de archivos.
- La razón de fondo: el endpoint de subida **exige un `threadId`**
  ([`api/upload/message-attachment/route.ts:39`](../src/app/api/upload/message-attachment/route.ts)),
  lo usa para armar la ruta en Storage (`{instituteId}/{threadId}/{ts}-{id}.{ext}`) y para validar
  que quien sube sea participante del hilo. Al redactar el primer mensaje **el hilo todavía no
  existe**, así que no hay dónde guardar el archivo ni contra qué validar el permiso.

**Cambio — dos alternativas.**

- **A) Subir después de crear (más simple).** El cliente crea el hilo, y con el `threadId` devuelto
  sube el archivo y actualiza el mensaje. Poco código, pero deja una ventana en la que el hilo existe
  sin su adjunto: si la subida falla, el destinatario ya recibió un mensaje incompleto.
- **B) Área de staging (más prolijo, recomendada).** Subir a
  `{instituteId}/_pending/{userId}/{uuid}.{ext}` validando contra el instituto del usuario en lugar
  de contra el hilo, y mover el archivo a su ruta definitiva al crear el hilo. **Requiere resolver
  antes [ARQ-08](#arq-08):** hoy nada limpia el Storage, y este enfoque genera archivos huérfanos por
  diseño cada vez que alguien adjunta y se arrepiente.

En ambos casos hay que agregar los campos de adjunto a `createThread` y la UI de archivo a
`ComposeClient`, reutilizando el componente que ya existe en `ThreadViewClient`.

**Detalle a contemplar.** `createThread` hoy exige `body.trim()` no vacío
([`messages.ts:348`](../src/app/actions/messages.ts)). Si se quiere permitir un primer mensaje que
sea solo un archivo, hay que relajar esa validación a "cuerpo **o** adjunto".

---

<a id="feat-02"></a>
## FEAT-02 · Paginar las clases del curso por mes · **P2** · 🗣️ Pedido del cliente

**Reporte.** En cursos con muchas clases, los profesores tienen que hacer mucho scroll para
encontrar la clase del día.

**Causa: confirmada.** [`courses/[id]/page.tsx:47`](../src/app/courses/[id]/page.tsx) trae **todas**
las clases sin `take` ni `skip`, y con `orderBy: { date: 'asc' }` — de la más vieja a la más nueva.
En un curso anual, la clase de hoy queda al final de una lista de más de cien. Todo se renderiza del
lado del servidor y viaja completo al cliente, así que además es un problema de peso de página.

**Propuesta del cliente:** paginar por mes, mostrando el mes en curso por defecto. Es una buena
solución y la recomiendo, con dos agregados:

1. **Que el mes por defecto sea el de la clase más cercana a hoy**, no estrictamente el mes
   calendario actual. Si el curso terminó en noviembre y estamos en enero, el mes actual está vacío y
   el profesor ve una pantalla en blanco.
2. **Un salto directo a "Hoy"**, que es la acción real detrás del pedido. El profesor no quiere
   navegar por meses: quiere la clase de hoy en pantalla al entrar.

**Cambio.**
1. Agregar el mes como parámetro de búsqueda en la URL (`?mes=2026-08`), para que sea enlazable y
   sobreviva al refresco.
2. Filtrar las clases por rango de fechas en la query de Prisma, no en el cliente. Es lo que resuelve
   el problema de peso.
3. Navegador de meses que muestre solo los meses con clases, con la cantidad de cada uno.
4. Contemplar el caso de un curso sin clases en el mes seleccionado.

**Estado: resuelto.** Implementado en `1df5def`, verificado en stage el 2026-08-09.

Resuelto según lo propuesto, con los dos agregados sugeridos (mes por defecto = el de la clase más
cercana a hoy, y atajo "Hoy"). Las métricas de práctica **conservan alcance de curso completo**
mediante una consulta propia: el panel reporta promedios generales y "la clase más difícil", que
cambiarían de significado acotados a un mes. Los meses se calculan en UTC para coincidir con las
columnas `@db.Date`, y el navegador se oculta si todas las clases entran en un solo mes.

Queda pendiente [FEAT-03](#feat-03), consecuencia directa de paginar.

---

<a id="feat-03"></a>
## FEAT-03 · Saltar al mes de la clase recién creada o movida · **P3**

**Origen.** Consecuencia de [FEAT-02](#feat-02) (`1df5def`).

**Problema.** Si el profesor está viendo agosto y crea una clase para septiembre, la clase se crea
bien pero **no aparece en pantalla**. Parece que no se guardó.

**Recargar no lo soluciona**, que es la reacción natural:

- [`CreateLessonModal.tsx:64`](../src/app/courses/[id]/lessons/components/CreateLessonModal.tsx)
  hace `router.refresh()`, que vuelve a renderizar con **la misma URL**, incluido el `?mes=` actual.
- Una recarga del navegador tampoco cambia la URL.
- Única excepción: si la URL no tiene `?mes=` **y** la clase nueva resulta ser la más cercana a hoy,
  el mes por defecto la agarra. En el caso típico —cargar las clases del mes siguiente— no ocurre.

**Alcance.** Aplica también a `EditLessonModal` cuando se mueve una clase a otro mes, y en menor
medida a `GenerateLessonsModal`, que genera clases en varios meses a la vez.

**Cambio.** Tras crear o mover una clase, navegar a `?mes=` del mes de esa clase en lugar de
`router.refresh()`. El modal ya conoce la fecha elegida, así que no hace falta que la acción la
devuelva. Para la generación masiva, evaluar si conviene ir al primer mes generado o quedarse donde
está.

**Alternativa más barata:** un aviso al confirmar ("La clase se creó en septiembre") con un enlace a
ese mes. Menos fluido, pero elimina la sensación de que no se guardó, que es el problema real.

---

<a id="feat-04"></a>
## FEAT-04 · Saber quiénes entraron a la plataforma · **P2** · 🗣️ Pedido del cliente

**Reporte.** El cliente quiere saber quiénes entraron a la plataforma, **en especial los tutores**.

**Estado actual.** No se registra nada. Ni `User` ni `Student` tienen un campo de último acceso, y
no hay tabla de auditoría. `createdAt` / `updatedAt` no sirven: `updatedAt` cambia con cualquier
edición del perfil, no con el ingreso.

**Decisión pendiente — qué se quiere medir realmente.** El pedido admite dos lecturas con costos muy
distintos:

1. **Último acceso** (recomendado para empezar): un campo `lastLoginAt` en `User` y en `Student`.
   Responde la pregunta de fondo —"¿los tutores están usando el portal o no?"— con una migración
   trivial y sin costo de almacenamiento.
2. **Registro de accesos**: tabla `LoginEvent` con una fila por ingreso. Permite ver frecuencia y
   evolución en el tiempo, a cambio de una tabla que crece sin techo y de una decisión de retención.

El énfasis en los tutores sugiere que lo que se busca es **medir adopción**, no auditar. Si es así,
la opción 1 alcanza. Confirmar con el cliente antes de construir.

**Trampa importante.** El JWT dura 30 días y `authorize()` sólo corre al validar credenciales. Un
tutor que entra una vez y no cierra sesión va a figurar con **un solo ingreso en un mes**, aunque
haya usado la plataforma todos los días. Es decir: `lastLoginAt` mide *inicios de sesión*, no *uso*.
Si el cliente quiere saber quién está activo, hace falta otra cosa (registrar última actividad en el
middleware de [SEC-09](#sec-09), por ejemplo). **Aclarar esto antes de mostrar el número**, o el
cliente va a concluir que los tutores no entran cuando en realidad sí lo hacen.

**Cambios (opción 1).**
1. `lastLoginAt DateTime?` en `User` y en `Student`.
2. Actualizarlo en `authorize()` de [`src/lib/auth.ts`](../src/lib/auth.ts), que es el único punto de
   entrada de credenciales para ambas tablas.
3. Mostrarlo en el listado de tutores y en el de alumnos, con un estado claro para "nunca ingresó"
   —que probablemente sea el dato más accionable para el instituto.
4. Filtrar por instituto, como todo lo demás.

**Privacidad.** Guardar sólo fecha y hora. No registrar IP ni user-agent salvo que exista una
necesidad concreta: son datos personales, hay menores involucrados, y suman obligaciones sin aportar
a la pregunta que se quiere responder.

**Relacionado.** Encaja con el pendiente de mostrar uso real del instituto en el dashboard, anotado
en [TODO.md](./TODO.md). Si se hace la opción 2, conviene resolverlo junto con ese ítem.

---

<a id="feat-05"></a>
## FEAT-05 · Recuperar la contraseña por correo · **P1** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Que el usuario pueda recuperar su contraseña por correo electrónico.

**Hoy no existe ninguna recuperación**: si alguien se olvida la contraseña, la única salida es que
el instituto se la restablezca a mano, y el reset la deja en una contraseña fija escrita en el código
— [SEC-06](#sec-06) las lista todas. Los dos ítems son la misma conversación desde dos puntas:
mientras no haya recuperación, sacar las contraseñas por defecto obliga al instituto a repartir
claves aleatorias a mano. **Conviene hacer este primero**, y SEC-06 pasa a ser fácil.

**El proyecto no manda correos.** No hay ninguna dependencia de envío ni configuración de SMTP: no es
que falte la pantalla, falta el canal entero. Eso implica elegir proveedor, cargar sus variables de
entorno y **verificar el dominio del remitente** (SPF y DKIM en el DNS). El trabajo de DNS y de
reputación del remitente es real y no es de programación: sin eso los correos entran en spam, que
para una funcionalidad de recuperación es lo mismo que no funcionar.

**Tres cosas propias de este sistema que hay que resolver antes de copiar un flujo estándar:**

1. **Muchos alumnos no tienen correo, y es a propósito.** El instituto tiene chicos de 6, 7 y 8 años;
   el identificador obligatorio es el **DNI** y con eso entran ([BUG-01](#bug-01)). Un flujo "poné tu
   email" no los cubre, y no es un caso de borde: es una franja entera de usuarios. Para ellos la
   recuperación tiene que ir por el **tutor** o por el instituto. Diseñarlo como si todos tuvieran
   correo deja a los más chicos afuera.
2. **El correo no identifica a una persona sola.** `User.email` es único global
   ([`schema.prisma:71`](../prisma/schema.prisma)), pero `Student.email` es opcional y único **por
   instituto** (`@@unique([email, instituteId])`): la misma dirección puede existir en dos
   institutos. El flujo tiene que resolver a qué cuenta corresponde el pedido, igual que hace el
   login, que ya recibe `instituteId`.
3. **El enlace tiene que llevar el instituto**, porque la pantalla de login es por instituto.

**Forma del cambio.**

- Modelo `PasswordResetToken` con el mismo patrón que ya existe en
  [`StudentDataToken`](../prisma/schema.prisma) —token, vencimiento, `consumed`—, que conviene copiar
  en vez de inventar. Dos diferencias: guardar el **hash** del token y no el token, porque queda en
  la base y viaja por correo; y darle una vida corta (30 o 60 minutos, no días).
- Invalidar el token al usarlo y al cambiar la contraseña por cualquier otra vía.
- **La respuesta no debe revelar si la dirección existe.** Siempre el mismo mensaje: "si la dirección
  está registrada, te llega un correo". Si no, el formulario es una forma de averiguar quién es
  usuario del instituto.
- **Límite de pedidos** por dirección y por IP. El proyecto ya tiene un contador por ventana en la
  base para la IA ([`AiUsage`](../prisma/schema.prisma) y
  [`quota.ts`](../src/lib/practice/quota.ts)); el mecanismo sirve igual acá y evita que el formulario
  se use para inundar de correos a alguien.

**Por qué P1.** Es el pedido con más volumen escondido: hoy cada olvido de contraseña es una llamada
al instituto y un reset manual. Y desbloquea SEC-06, que es P1 de seguridad.

**Relacionado.** [SEC-06](#sec-06) (contraseñas por defecto) y [FEAT-04](#feat-04) (saber quién entró
alguna vez) tocan lo mismo desde otro ángulo: hoy nadie sabe cuántos tutores nunca pudieron entrar,
que es probablemente donde está el problema real.

---

<a id="feat-06"></a>
## FEAT-06 · Que tutores y docentes puedan escribirle al docente del curso · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Que los tutores y los docentes puedan **iniciar** conversaciones con el
docente del curso del alumno.

**Hoy no pueden, y es una decisión explícita del código, no un olvido.**
[`createThread`](../src/app/actions/messages.ts) corta así:

```ts
// Fase 1: sólo ADMIN, SECRETARY y TEACHER pueden iniciar hilos
if (isStudent || (!isAdmin && senderRole !== "TEACHER")) throw new Error(...)
```

El tutor puede **responder** un hilo donde lo metieron, pero no abrir uno. Levantar ese corte es la
mitad del trabajo; la otra mitad es que hoy no existe la lista de a quién podría escribirle.

**Son dos permisos distintos, con dificultad distinta:**

1. **El tutor.** Es el caso nuevo de verdad. Hay que construirle una lista de destinatarios que hoy
   no existe: sus alumnos vinculados → inscripciones activas → docente de cada curso. Y hay que
   **hacerla cumplir en el servidor**, no sólo dibujarla: si el destinatario llega en el body, un
   tutor podría escribirle a cualquiera del instituto.
2. **El docente.** Ya puede iniciar hilos, pero
   [`getCoursesWithRecipientsForUser`](../src/app/actions/messages.ts) sólo le arma como
   destinatarios a los alumnos y tutores **de sus propios cursos**: la lista de profesores
   (`allTeachers`) se completa **únicamente para administradores**. Alcanza con extendérsela, acotada
   al alcance que se decida.

**Lo que hay que definir con el cliente antes de codificar:**

- **¿De qué alumno se está hablando?** `MessageThread` guarda `courseId` pero **no** `studentId`
  ([`schema.prisma`](../prisma/schema.prisma)). Un tutor con dos hijos escribe sobre uno; el docente
  necesita saber cuál. Sin ese campo, el asunto queda como único contexto — que es exactamente cómo
  se pierden las conversaciones.
- **¿Hasta dónde llega el alcance del docente?** ¿Sólo los docentes de los otros cursos de sus
  alumnos, o cualquier docente del instituto? Lo segundo es más simple y probablemente lo que
  esperan; lo primero es más prolijo y más código.
- **¿El tutor puede escribirle a la administración también, o sólo al docente?** Si sólo al docente,
  la secretaría se entera de nada y va a terminar pidiéndolo después.

**Relacionado.** [BUG-06](#bug-06) (el contador de no leídos del admin) y [FEAT-01](#feat-01)
(adjuntos en el primer mensaje) tocan la misma pantalla; si se va a abrir el módulo, conviene
mirarlos juntos. Y abrir el canal a los tutores multiplica el volumen de hilos, así que BUG-06 pasa
de molestia a problema.

---

<a id="feat-07"></a>
## FEAT-07 · Ver en el calendario las clases de los pares del mismo nivel · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Que un docente pueda ver —**y sólo ver**, en gris— las clases de otros
docentes en el calendario, limitado a los cursos **del mismo nivel** que los suyos. El objetivo es
concreto: saber en qué tema van sus pares que dan el mismo nivel.

**La mitad ya está hecha.** El calendario **ya muestra el tema de la clase**:
[`schedule/page.tsx:338`](../src/app/schedule/page.tsx) renderiza `schedule.lessons[0].topic`, y las
tarjetas ya distinguen visualmente la clase cargada de la que no lo está (gris y borde punteado
cuando no hay `Lesson`). No hay que traer datos nuevos ni inventar una vista: hay que **ensanchar un
filtro**.

Hoy el filtro es:

```ts
...(isTeacher ? { teacherId: session.user.id } : {})
```

El cambio es incluir además los cursos cuyo `level` coincida con el de alguno de los suyos, y
marcarlos como ajenos para pintarlos distinto.

**El problema está en cómo se guarda el nivel.** `Course.level` es un `String?`
([`schema.prisma:182`](../prisma/schema.prisma)), y `Level` es una tabla aparte
([`schema.prisma:280`](../prisma/schema.prisma)) **sin clave foránea que las una**. El formulario de
curso elige de la lista de niveles, así que en general el texto va a coincidir, pero nada lo
garantiza: renombrar un nivel no actualiza los cursos, y un curso viejo puede tener un nombre que ya
no existe. "Mismo nivel" comparando strings funciona hasta que alguien renombra algo. Es la misma
deuda de [ARQ-01](#arq-01) (claves foráneas faltantes) y conviene decidir si se arregla acá o se
asume.

**Definir también:** qué ve un docente cuyo curso tiene `level` en `null` — hoy es un valor
permitido. Lo razonable es que no vea pares, pero hay que decirlo.

**"Sólo ver" es un requisito, no una preferencia visual (confirmado 2026-08-13).** El docente ajeno
tiene que poder ver por dónde va su par y **no poder editar nada**. Eso saca el problema del color de
la tarjeta y lo lleva al servidor, porque las pantallas de destino no siempre distinguen al docente
propio del ajeno. Esta ficha no lo empeora, pero lo pone a un clic de distancia, así que hay que
cerrarlo en el mismo pase.

Alcance del cierre, para no quedarse a mitad de camino:

1. Las tarjetas ajenas del calendario no navegan; muestran el tema y nada más.
2. Las pantallas de clase —asistencia, notas, práctica— exigen ser el docente del curso, no
   cualquier miembro del instituto. Los roles administrativos siguen entrando: el corte es entre
   docentes, no contra la conducción.
3. `saveLessonAttendanceAction` y las acciones equivalentes chequean lo mismo del lado del servidor.
   Es donde de verdad se decide: esconder el botón no protege un server action, que es un POST como
   cualquier otro.

**Asistencia ya está hecha (2026-08-13, en [BUG-07](#bug-07)).** Corrección de lo que decía esta
ficha: [`attendance/page.tsx`](../src/app/courses/[id]/lessons/[lessonId]/attendance/page.tsx) **sí**
exigía ser el docente del curso — quien no lo era no podía abrir la pantalla. Lo que no lo exigía era
el server action, así que el docente ajeno no podía abrirla pero sí guardar mandando los ids. Ese
lado quedó cerrado, para asistencia y para el kiosco de QR. **Queda pendiente el punto 1 (las
tarjetas del calendario) y las pantallas y acciones de notas y práctica**, que hay que revisar una
por una: la de asistencia no prueba nada sobre las otras.

`AttendanceForm` ya tiene una prop `readOnly` que hoy nadie usa para esto: es el lugar natural para
la vista del par.

**Por qué está bueno el pedido.** Es coordinación pedagógica real entre docentes que dan el mismo
nivel, y sale casi gratis sobre lo que ya existe. Es de las pocas cosas del backlog donde el valor
es alto y el trabajo chico.

---

<a id="feat-08"></a>
## FEAT-08 · Columna de novedades: plataforma, instituto y curso · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Una columna de novedades donde se comunican temas, en tres niveles:
nosotros anunciamos funcionalidades nuevas, el instituto comunica por ejemplo una salida, y el curso
comunica una tarea puntual. Las novedades deben poder firmarse — eso es [FEAT-09](#feat-09), que
depende de esta.

**No existe nada parecido**: no hay modelo de novedades ni de anuncios en el schema.

**Tres emisores con tres alcances, y no son simétricos:**

| Emisor | Destinatarios | Particularidad |
|---|---|---|
| Nosotros (SUPERADMIN) | **Sólo el personal**: ADMIN, SECRETARY y TEACHER, de todos los institutos | **Cruza el límite de instituto**, cosa que hasta ahora ninguna funcionalidad hace a propósito |
| El instituto | Su gente — a definir si todos, o por rol | Es el caso de la salida, y el que va a querer firma |
| El curso | Alumnos y tutores de ese curso | Lo más parecido a lo que ya existe |

**Decisión (2026-08-13): como plataforma no nos comunicamos con tutores ni con alumnos.** Nuestras
novedades —funcionalidades nuevas, avisos del producto— son para el personal del instituto y nadie
más. Eso acota bastante el caso raro: el alcance que cruza institutos tiene un público chico,
conocido y sin menores adentro, así que no arrastra las consideraciones de datos de terceros que
tendría un anuncio masivo a familias.

Aun así el primer emisor merece atención: todo el sistema está construido sobre "cada cosa pertenece
a un instituto" ([ARQ-01](#arq-01), [`tenant.ts`](../src/lib/tenant.ts)). Una novedad de plataforma
es la primera excepción deliberada, así que el modelo tiene que admitir `instituteId` nulo con un
significado claro —"es de la plataforma"— y todas las consultas tienen que contemplarlo, filtrando
además por rol para que no se le escape a un tutor. Si se resuelve creando una fila por instituto se
evita la excepción, a costa de duplicar el texto.

**Cuidado con terminar con dos bandejas.** El módulo de mensajería ya hace "uno a muchos dentro de un
curso" con los hilos `COURSE_BLAST`, y ya tiene su propio contador de no leídos —que hoy está roto
para el admin, [BUG-06](#bug-06)—. Si las novedades nacen como un segundo sistema de mensajes, el
usuario termina con dos lugares donde mirar y dos badges que no coinciden.

Conviene decidirlo de entrada. La distinción sana es: **una novedad no es una conversación**. Es de
una sola dirección, ordenada por fecha, y lo que importa es quién la leyó o la firmó, no quién
respondió. Con ese criterio va un modelo propio, reutilizando la resolución de destinatarios de
mensajería en vez de duplicarla.

**A definir con el cliente:**

- ¿La novedad del instituto le llega a todos —docentes, tutores, alumnos— o se elige el público?
- ¿Caducan? Una salida del mes pasado no debería seguir arriba de la columna.
- ¿Quién puede publicar en nombre del instituto: sólo ADMIN, o también la secretaría?

---

<a id="feat-09"></a>
## FEAT-09 · Firma de conformidad de las novedades · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Que las novedades sean "firmadas digitalmente por sus destinatarios".
Depende de [FEAT-08](#feat-08): sin novedades no hay qué firmar.

**Decisión (2026-08-13): es firma electrónica, y el objetivo es saber quién vio.** No se busca una
autorización con valor probatorio sino que el instituto sepa si los tutores y los alumnos vieron la
novedad o el informe. Eso baja la exigencia de golpe: no hace falta certificador licenciado ni las
formalidades de la *firma digital* de la Ley 25.506, que es un término legal distinto y con
presunción de autoría. Lo que se construye es un acuse de lectura con conformidad explícita.

Conviene que la interfaz diga eso mismo —"confirmo que lo leí"— y no "firma digital", por dos
razones: es lo que realmente hace, y evita que dentro de un año alguien lo invoque como si fuera lo
otro.

**Dónde sí importa la fortaleza del login.** Un acuse de lectura tolera bien que las credenciales
sean flojas: si la secretaría conoce la contraseña del tutor ([SEC-06](#sec-06)) y no hay
recuperación ([FEAT-05](#feat-05)), lo que se degrada es la confianza del dato, no la exposición
legal. Con este alcance, esos dos ítems **dejan de ser requisitos previos**.

Pero conviene tener marcada la frontera: el ejemplo de la salida es una **autorización**, no un
aviso. Si el día de mañana el instituto empieza a apoyarse en estas firmas para permisos —que es la
deriva natural, porque el mecanismo ya va a estar ahí—, entonces sí vuelven a pesar SEC-06 y
FEAT-05, porque "el tutor autorizó" no se sostiene si la contraseña la sabe la oficina. Vale
decidirlo cuando pase, no ahora, pero sabiendo que va a pasar.

**Se firma un texto, no una fila.** Hay que guardar el **hash del contenido exacto** al momento de
firmar. Si después alguien edita la novedad, la firma no puede seguir apareciendo como válida sobre
un texto que el firmante nunca vio. Las dos salidas razonables: congelar la novedad al publicarla, o
versionarla y volver a pedir firma. Cualquiera sirve; no decidirlo es lo que no sirve.

**Quién firma cuando el destinatario es menor.** El instituto tiene alumnos de 6, 7 y 8 años
([BUG-01](#bug-01)). Para una autorización de salida el firmante tiene que ser **el tutor**, no el
alumno. Cada novedad necesita decir a quién le exige firma, y no puede ser "todos los destinatarios"
por defecto.

**Lo que el instituto realmente necesita no es la firma: es la lista de quién falta.** Ante una
salida, la pregunta operativa es "¿qué chicos pueden ir?". La vista de firmas pendientes por novedad,
con nombre y curso, es el valor de esta ficha; la firma es el mecanismo. Conviene construir esa vista
desde el principio y no como agregado.

**Qué guardar, con cuidado.** Quién firmó, cuándo, y el hash de lo firmado. Sobre IP y dispositivo
hay una tensión real: [FEAT-04](#feat-04) tomó la posición de **no** guardarlos sin necesidad
concreta, porque son datos personales y hay menores. Acá sí hay necesidad —son parte de la prueba—,
así que la decisión es deliberada y hay que anotarla con la política de retención, no arrastrarla por
inercia. Es el mismo terreno de [ARQ-10](#arq-10) (auditoría de acciones del panel), que también
advierte sobre no copiar datos personales de más.

**Los informes entran desde el día uno.** El pedido nombra "la novedad **o el informe**", así que no
es un alcance futuro: son dos objetos firmables desde el arranque. El modelo no puede colgar de
`Announcement` — necesita apuntar a "un documento" de tipo variable, y el módulo de informes
([`ReportGradeSheet`](../src/app/courses/[id]/reports/[templateId]/ReportGradeSheet.tsx),
[`StudentReportViewer`](../src/components/reports/StudentReportViewer.tsx)) es el segundo caso a
cubrir. Que el reglamento o una autorización se sumen después sale gratis si esto se diseña así.

---

# Arquitectura

<a id="arq-01"></a>
## ARQ-01 · Multi-tenancy manual: FK e índices faltantes · **P2**

Cada query repite `instituteId` a mano; ya hay tres lugares donde se omitió ([SEC-04](#sec-04),
[SEC-05](#sec-05), [BUG-01](#bug-01)).

Además el campo es inconsistente en el schema: `Student`, `Course`, `Expense`, `Classroom`, `Level`,
`Notification`, `MiscellaneousIncome` y `ReportTemplate` tienen **relación** con `Institute`; pero
`Fee` (506), `Transaction` (448) y `MessageThread` (633) guardan `instituteId` como `String` suelto,
**sin foreign key**. No hay integridad referencial ni índice en `Fee.instituteId`, que es la tabla
más consultada del módulo financiero.

**Cambios.**
1. Agregar la relación y la FK en `Fee`, `Transaction` y `MessageThread`.
2. Índices: `Fee(instituteId, status)`, `Fee(studentId)`, `Transaction(instituteId, date)`.
3. Evaluar Prisma Client Extensions para inyectar el filtro de tenant automáticamente y dejar de
   depender de que nadie se olvide.

---

<a id="arq-02"></a>
## ARQ-02 · Pooling de conexiones Prisma/Supabase · **P2**

[`src/lib/prisma.ts`](../src/lib/prisma.ts) instancia `new PrismaClient()` sin configuración de
pooling. Con Vercel serverless + Supabase esto agota conexiones. El commit `a731b97`
("fix pwa install and fix time out db") sugiere que el problema ya apareció.

**Cambio (sin verificar en runtime).** Confirmar que `DATABASE_URL` apunte al pooler de Supabase
(puerto 6543, `?pgbouncer=true&connection_limit=1`) y `DIRECT_URL` al directo (5432) para las
migraciones. El schema ya declara ambas variables correctamente.

---

<a id="arq-03"></a>
## ARQ-03 · Dominios hardcodeados en `tenant.ts` · **P2**

[`src/lib/tenant.ts:15`](../src/lib/tenant.ts) tiene `lingua-campus.com.ar`, `localhost` y
`lingua-campus.vercel.app` escritos en el código. Con ambientes separados de stage y producción,
deberían ser variables de entorno.

---

<a id="arq-04"></a>
## ARQ-04 · Tests automatizados · **P3**

No hay tests en el proyecto. **Despriorizado por decisión del cliente interno** — hay funcionalidad
pendiente con más urgencia.

Cuando se retome, el mejor punto de entrada es extraer los cálculos financieros de los server actions
a funciones puras (`calcularEstadoCuota`, `revertirPago`, `aplicarSaldo`) y testear esas. Es el área
con lógica más sutil y consecuencias más caras. Anotado, no agendado.

---

<a id="arq-05"></a>
## ARQ-05 · Política de borrado lógico en todo el sistema · **P1**

**Decisión del cliente (2026-08-09).** Todo borrado pasa a ser **lógico**, no físico. Razón: si
alguien del instituto borra algo que no debía, los datos siguen estando y se pueden recuperar. Es
además un argumento comercial fuerte frente al cliente.

**Estado actual.** El patrón `status: "ACTIVE" | "DELETED"` ya existe en `User`, `Student` e
`Institute`, pero convive con borrados físicos en el resto del sistema.

**El caso más grave** — [`students/[id]/actions.ts:264-268`](../src/app/students/[id]/actions.ts):

```ts
prisma.attendance.deleteMany({ where: { studentId } }),
prisma.grade.deleteMany({ where: { studentId } }),
prisma.enrollment.deleteMany({ where: { studentId } }),
prisma.fee.deleteMany({ where: { studentId } }),
prisma.student.delete({ where: { id: studentId } })
```

Borrar un alumno destruye asistencias, notas, inscripciones **y todo el historial de cuotas**. Nota:
`Payment.fee` no tiene cascade, así que para un alumno que alguna vez pagó algo la operación
**falla** y se revierte entera — un salvavidas accidental. Para un alumno sin pagos, borra todo. Hay
que confirmar en stage cuál de los dos caminos se toma hoy **(sin verificar en runtime)**.

**Inventario de borrados físicos a convertir.**

| Archivo | Línea | Entidad |
|---|---|---|
| [`students/[id]/actions.ts`](../src/app/students/[id]/actions.ts) | 264-268 | Alumno + asistencias + notas + inscripciones + cuotas |
| [`courses/actions.ts`](../src/app/courses/actions.ts) | 85 | Curso |
| [`courses/actions.ts`](../src/app/courses/actions.ts) | 145 | Horario |
| [`courses/actions.ts`](../src/app/courses/actions.ts) | 251 | Inscripción |
| [`courses/[id]/lessons/actions.ts`](../src/app/courses/[id]/lessons/actions.ts) | 175, 213 | Práctica y clase — ver [BUG-02](#bug-02) / [BUG-03](#bug-03) |
| [`enrollments/actions.ts`](../src/app/enrollments/actions.ts) | 202 | Cuota |
| [`payments/billingActions.ts`](../src/app/payments/billingActions.ts) | 248 | Cuota |
| [`schedule/actions.ts`](../src/app/schedule/actions.ts) | 82 | Horario |
| [`courses/classrooms/actions.ts`](../src/app/courses/classrooms/actions.ts) | 100 | Aula |
| [`courses/levels/actions.ts`](../src/app/courses/levels/actions.ts) | 88 | Nivel |
| [`admin/actions.ts`](../src/app/admin/actions.ts) | 138 | Usuario |
| [`api/reports/templates/[id]/route.ts`](../src/app/api/reports/templates/[id]/route.ts) | 80, 178 | Plantilla y categorías de informe |
| [`api/courses/[id]/reports/[templateId]/route.ts`](../src/app/api/courses/[id]/reports/[templateId]/route.ts) | 73 | Vínculo curso-plantilla |
| [`api/courses/[id]/reports/[templateId]/entries/route.ts`](../src/app/api/courses/[id]/reports/[templateId]/entries/route.ts) | 180 | Entradas de informe |

**Cambios.**

1. Agregar `status` (o `deletedAt DateTime?`) a los modelos que hoy no lo tienen: `Lesson`, `Course`,
   `Enrollment`, `Fee`, `Schedule`, `Classroom`, `Level`, `LessonPractice` y los de informes.
2. Reemplazar cada `delete` / `deleteMany` de la tabla por un cambio de estado.
3. **Lo laborioso y lo más riesgoso:** filtrar los registros borrados en **todas** las consultas.
   Olvidar un filtro hace reaparecer datos borrados. Conviene apoyarse en Prisma Client Extensions
   para aplicar el filtro por defecto, igual que en [ARQ-01](#arq-01) con el tenant.
4. Definir quién puede **restaurar** un registro borrado y desde dónde. Sin esto, el borrado lógico
   solo sirve para recuperación manual desde la base.
5. Decidir qué pasa con las restricciones únicas: `@@unique([name, instituteId])` en `Classroom` y
   `Level` impide crear un aula con el nombre de una borrada. Suele resolverse incluyendo `deletedAt`
   en la clave o usando índices parciales.

**Nota sobre alcance.** Es un cambio transversal y no debería hacerse de una sola vez. Sugerencia de
orden: primero alumno y clase (los de mayor impacto y los que motivaron la decisión), después cursos
e inscripciones, y por último catálogos (aulas, niveles) e informes.

---

<a id="arq-06"></a>
## ARQ-06 · Limpiar props de identidad sin uso en `MessagesBell` · **P3**

**Origen.** Quedó pendiente al resolver [BUG-05](#bug-05) (`72fbdca`), para no ensanchar ese cambio.

[`MessagesBell.tsx`](../src/components/layout/MessagesBell.tsx) sigue recibiendo `userId`,
`isStudent`, `instituteId` e `isAdmin` desde [`Navbar.tsx`](../src/components/layout/Navbar.tsx),
pero ya no los usa: `getUnreadThreadCount()` deriva todo de la sesión. Sólo sobreviven en el array de
dependencias del `useEffect`, que por eso no dispara aviso de variable sin uso.

No rompe nada. Se anota porque dejar props de identidad en un componente cliente sugiere justamente
lo que se acaba de eliminar —que el cliente maneja identidad— y es lo primero que confunde a quien
lea el código después.

**Cambio.** Quitar las cuatro props de `MessagesBell`, ajustar el `useEffect` para depender sólo del
intervalo, y dejar de pasarlas desde `Navbar`. Revisar si `Navbar` las sigue necesitando para otra
cosa antes de borrarlas de ahí.

---

<a id="arq-07"></a>
## ARQ-07 · Completar los tipos de sesión en `next-auth.d.ts` · **P2**

**Problema.** [`src/app/types/next-auth.d.ts`](../src/app/types/next-auth.d.ts) declara sólo `role` e
`instituteId` en `Session["user"]`:

```ts
interface Session {
  user: { role?: string; instituteId?: string } & DefaultSession["user"];
}
```

Faltan `id`, `roles` y `birthDate`, que [`auth.ts:83-87`](../src/lib/auth.ts) **sí** escribe en la
sesión. Por eso todo el código hace `const sessionUser = session.user as any` — el patrón aparece en
decenas de páginas y es responsable de buena parte de los errores de ESLint
(`@typescript-eslint/no-explicit-any`).

Consecuencia real, más allá del ruido: al perder el tipado, TypeScript no puede avisar cuando se lee
una propiedad que no existe o se confunde `role` con `roles` — que es exactamente el origen de
[SEC-01](#sec-01).

**Cambio.** Declarar `id`, `roles: string[]` y `birthDate` en `Session["user"]` y en `JWT`, y
reemplazar los `as any` por acceso tipado. Al resolver [SEC-01](#sec-01) hay que quitar `role` de
este archivo también.

**Dependencia.** Conviene hacerlo **junto con [SEC-01](#sec-01)**: el tipado correcto convierte el
compilador en una red de seguridad para esa migración, que es grande y toca ~40 lugares. Hacerlo
antes ahorra trabajo, no lo agrega.

### Tipos declarados en `b781d4b`; falta el barrido de `as any`

`LinguaSessionFields` ya declara `id`, `roles`, `instituteId` y `birthDate` en `Session["user"]`, en
`User` y en `JWT`, y [SEC-01](#sec-01) sacó `role` de ahí. Sirvió para lo que se esperaba: el
compilador encontró los llamadores durante la migración.

### Resuelto — 2026-08-13 · pendiente de verificar en stage

**El barrido se hizo:** 30 `session.user as any` en 22 archivos, más un `instituteId as string` en la
bandeja de mensajes. En esos archivos los errores de `no-explicit-any` bajaron de 47 a 17, y los 17
que quedan no son de sesión — son internos de jsPDF (`doc as any`), formas de payload de Prisma y
APIs del navegador, que pertenecen a otras fichas.

**Lo que el tipado destapó, que era el punto del ítem.** Con `id?: string` a la vista, aparecen cinco
páginas que le pasaban ese campo a una consulta sin garantizar que existiera. No es cosmético:

- [`guardian/dashboard`](../src/app/guardian/dashboard/page.tsx) filtraba un `findMany` por
  `guardianId`. En Prisma **un filtro en `undefined` no falla: se ignora**, así que un token sin `id`
  no daba error — devolvía los vínculos de *todos* los tutores del sistema.
- [`schedule`](../src/app/schedule/page.tsx) tenía el mismo patrón con `teacherId` sobre los cursos.
- [`academics`](../src/app/academics/page.tsx),
  [`administration`](../src/app/administration/page.tsx) y
  [`dashboard`](../src/app/dashboard/page.tsx) lo usan en un `findUnique`, que sí revienta: un 500 en
  vez de una fuga.
- [`messages`](../src/app/messages/page.tsx) le pasaba el `id` a la bandeja para marcar los hilos
  propios; con `undefined` no coincidía ninguno.

Las cinco exigen ahora `session?.user?.id` antes de seguir, redirigiendo al login si falta. El
cambio de comportamiento es acotado —un token sin `id` es un token roto— pero hay que mirarlo en
stage junto con el resto de la tanda 2.

**Por qué el compilador no lo había marcado:** los tipos de Prisma declaran esos campos como
opcionales (`id?: string` en un `WhereUniqueInput`), así que pasarle `undefined` es legal para
TypeScript. El tipado de la sesión no encuentra este bug solo; lo que hace es dejarlo a la vista para
quien lee el código, que es como apareció.

---

<a id="arq-08"></a>
## ARQ-08 · Los archivos del Storage no se borran nunca · **P3**

**Lo que está bien.** La subida de adjuntos es sólida y no hace falta tocarla: la ruta se arma como
`{instituteId}/{threadId}/{timestamp}-{8 bytes aleatorios}.{ext}`
([`api/upload/message-attachment/route.ts:83`](../src/app/api/upload/message-attachment/route.ts)),
sin usar el nombre original del archivo, y `uploadToStorage` va con `upsert: false`
([`lib/supabase-server.ts:34`](../src/lib/supabase-server.ts)). Subir dos veces la misma imagen crea
dos archivos independientes; una colisión de nombres daría error en lugar de pisar contenido ajeno.

**El problema.** `deleteFromStorage` está definida en
[`lib/supabase-server.ts:63`](../src/lib/supabase-server.ts) y **no se invoca desde ningún lado**.
Los mensajes tampoco se borran. Todo lo que entra al bucket `message-attachments` queda ahí para
siempre, y no hay deduplicación por contenido: el mismo PDF enviado diez veces ocupa diez veces el
espacio.

Con el tope de 5 MB por archivo hacen falta muchos adjuntos para que duela, y hoy hay un solo
instituto. Se anota porque crece en silencio y porque dos ítems planificados lo empeoran:

- **[ARQ-05](#arq-05) (borrado lógico):** al no borrar filas, los archivos de lo "eliminado" tampoco
  se limpiarán nunca. Hay que decidir explícitamente si el archivo sobrevive al mensaje.
- **[FEAT-01](#feat-01) (adjunto en el primer mensaje):** la opción B (área de staging) **genera
  huérfanos por diseño** — todo el que adjunte un archivo al redactar y después se arrepienta deja
  basura en `_pending`. Si se elige ese camino, resolver este ítem **antes**.

**Cambios.**
1. Decidir la política de retención: ¿el adjunto sobrevive al borrado (lógico) del mensaje?
2. Usarla o eliminarla: si los archivos nunca se borran, `deleteFromStorage` es código muerto y
   conviene sacarla para que nadie asuma que existe una limpieza que no ocurre.
3. Si se adopta el staging de FEAT-01, tarea de limpieza de `_pending` por antigüedad.
4. Opcional: deduplicar por hash del contenido, guardando el archivo una sola vez por instituto.

---

<a id="arq-09"></a>
## ARQ-09 · Los errores no se registran en ningún lado · **P2**

**Estado actual.** Hay **80 `console.error`** repartidos por `src` y ninguna librería de logging en
`package.json`. La aplicación atrapa sus errores —hay nueve `error.tsx` más el global, y las server
actions devuelven `{ success: false, error }`— pero no los **reporta**: el usuario ve un cartel, el
error se imprime en la consola de Vercel y ahí muere.

Lo que eso significa en la práctica:

- **No se puede saber si un deploy rompió algo** hasta que el cliente avisa. Hoy hay un solo
  instituto y el cliente escribe; con tres, no.
- **No se puede consultar nada.** Los logs de Vercel no se filtran por instituto ni por usuario, no
  se agregan y se van con la retención del plan.
- **Los mensajes no tienen contexto.** `console.error("[CHAT] Error:", error.message)` no dice qué
  instituto, qué usuario ni qué práctica. Con un cliente se deduce; con varios, no.
- **El caso extremo ya está anotado en [PED-05](#ped-05):** los providers de IA degradan en silencio,
  así que ni siquiera llega a haber un error que registrar.

**Decisión pendiente — dónde se guardan.** Son dos caminos con costos distintos:

1. **Servicio externo** (Sentry y equivalentes). Trae agrupación, alertas y stack traces sin
   construir nada. Cuesta plata a partir de cierto volumen y suma un proveedor más al que mandarle
   datos — y acá hay datos de menores, así que hay que mirar qué se envía.
2. **Tabla propia** (`ErrorLog`), en la línea de lo que ya se hizo con `AiUsage` en
   [SEC-07](#sec-07). Cero proveedores nuevos, los datos no salen de la base, y el panel del
   superadmin ya existe como lugar donde mostrarlo. A cambio hay que construir el agrupado, la
   retención y la vista, y una tabla de errores crece rápido justo cuando algo se rompe en loop.

**Las métricas son un ítem aparte del registro, y conviene no mezclarlos.** "Cuántos errores hubo"
sale del registro; "cuánto se usa la plataforma" no, y es otra pregunta —la del cliente— que ya
aparece en [FEAT-04](#feat-04) y en [TODO.md](./TODO.md). Definir cuáles son las tres o cuatro
preguntas que se quieren contestar antes de elegir qué se guarda: es lo que decide el modelo.

**Cambios.**
1. Un helper único de registro en lugar de 80 `console.error` sueltos, que reciba el error más el
   contexto (instituto, usuario, acción). El patrón es el mismo de `getAuthContext` y
   `guardPracticeAi`: un solo lugar donde cambiar de destino después.
2. Elegir destino con el criterio de arriba.
3. Definir qué **no** se guarda. Nada de datos personales del alumno en el cuerpo del error, y
   cuidado con los `error.message` de proveedores externos, que a veces incluyen la request entera
   —incluida la API key, como pasa hoy con la de Gemini en la query string ([PED-05](#ped-05)).
4. Retención: los errores viejos no sirven y ocupan.
5. Recién después, las métricas y dónde se ven.

**Relacionado.** [ARQ-10](#arq-10) es el otro registro que falta y comparte casi todas estas
decisiones (dónde, cuánto tiempo, quién lo ve); si se hacen juntos, se decide una sola vez. Pero son
cosas distintas: acá se registra **lo que falló**, allá **lo que alguien hizo a propósito**.

---

<a id="arq-10"></a>
## ARQ-10 · No hay auditoría de las acciones del panel · **P2**

**Lo que pide el negocio.** Que el administrador del instituto pueda ver **quién hizo qué**: quién
modificó una nota, quién cambió un monto, quién dio de baja a un alumno.

**Estado actual.** No hay tabla de auditoría. Lo único que se parece es
`Transaction.operatorId` ([`schema.prisma:492`](../prisma/schema.prisma)), que es **opcional** y sólo
existe en el asiento del libro mayor: si una operación no generó asiento, no queda rastro de quién la
hizo. Todo lo demás —académico, alumnos, cursos, configuración— no registra autor.

**Por qué importa más de lo que parece acá:**

- **Los roles conviven.** Admin, secretaria y profesor operan sobre las mismas pantallas, y desde
  [SEC-01](#sec-01) una misma persona puede tener varios roles. "Se cambió la nota" no dice quién.
- **El borrado es lógico** ([ARQ-05](#arq-05)). El dato sobrevive, pero *quién lo borró y cuándo* no
  se guarda en ningún lado — que es justamente lo que hace falta para decidir si se restaura. La
  interfaz de deshacer que queda pendiente en el panel del superadmin no tiene hoy con qué mostrar
  el "quién".
- **Ya hay un pedido concreto que es un caso particular de esto:** [FIN-13](#fin-13) quiere ver quién
  aplicó un descuento o recargo y por qué. Si se construye la auditoría primero, FIN-13 sale casi
  gratis; si se construye FIN-13 sola, queda una solución de un solo uso.
- **[FEAT-04](#feat-04) es la otra mitad de la misma pregunta.** Ahí se registra quién *entró*; acá,
  quién *hizo*. Comparten tabla o no según qué se decida, pero conviene mirarlas juntas.

**Decisión pendiente — el alcance, que es lo que define el costo.** Auditar todo es una tabla que
crece más rápido que los datos del negocio y ruido en el que no se encuentra nada. Lo razonable es
empezar por lo que alguien podría querer discutir después: plata (pagos, descuentos, anulaciones),
académico (notas, asistencia), altas y bajas de personas, y cambios de rol o de permisos. Lo que se
lee no se audita.

**Cambios.**
1. Definir la lista de acciones auditables con el criterio de arriba, y confirmarla con el cliente:
   es una decisión de negocio, no técnica.
2. Modelo `AuditLog` polimórfico —actor, rol activo con el que operó, instituto, entidad, id,
   acción, fecha y el diff o los campos tocados—. `Notification` ya usa un enfoque polimórfico en
   este esquema, conviene seguir esa forma.
3. Escribirlo donde ya se decide la autorización. `getAuthContext` es el punto por el que pasa toda
   acción y sabe quién es y con qué rol activo opera: es el lugar natural para que registrar no
   dependa de que cada acción se acuerde.
4. Vista para el administrador, filtrada por instituto. Empezar por la ficha de cada entidad
   ("últimos cambios de este alumno"), que es más útil que un listado global.
5. Retención, y qué pasa con el registro cuando se da de baja a quien lo generó.

**Cuidado con lo obvio.** Un registro de auditoría es, por definición, un lugar donde se acumulan
datos personales de menores y de sus tutores. Guardar qué cambió, no copiar el dato entero cuando no
hace falta, y decidir la retención **antes** de empezar a escribir filas.

---

<a id="arq-11"></a>
## ARQ-11 · Guardar las notas de un informe cuesta 250 sentencias · **P2**

**De dónde sale.** Al resolver [BUG-07](#bug-07) el 2026-08-13 se midió, de paso, la carga de notas
de los informes. No hay una falla abierta: se reportaron fallas en su momento y el lote de 5 de
[`entries/route.ts`](../src/app/api/courses/[id]/reports/[templateId]/entries/route.ts) las hizo
desaparecer. Esto es el costo que quedó abajo.

**Medido** contra Postgres local, 25 alumnos × 4 categorías, contando las sentencias que Prisma manda
de verdad:

| | Sentencias | Resultado |
|---|---|---|
| Actual, en lotes de 5 | **250** | 25 informes, 75 entradas |
| Colapsada en sentencias masivas | **13** | 25 informes, 75 entradas |

Mismo resultado, 19× menos sentencias. Escala con alumnos **por** categorías, así que una plantilla
de 8 categorías duplica el número.

**El lote de 5 no alivia el pool: lo consume entero.** El comentario del código explica que procesa
de a 5 para que la cola de Prisma no llegue al timeout buscando conexiones libres, y como remedio del
síntoma funcionó. Pero el pool **es** de 5: un profesor guardando notas se lleva todas las conexiones
que hay, y lo que pase en simultáneo —otro profesor, una pantalla cargando— espera. Es un techo, no
un alivio. Relacionado con [ARQ-02](#arq-02).

**Por qué no se colapsó en su momento, que es una razón buena.** No es el caso de
[BUG-07](#bug-07): las `ReportEntry` cuelgan del `id` del `StudentReport` padre, que no existe hasta
crearlo, así que la operación *parece* inherentemente secuencial — hay que crear el padre de cada
alumno antes de poder tocar sus entradas.

**Cambio propuesto.** Resolver todos los ids de una sola vez, con una lectura en el medio:

1. `createMany({ skipDuplicates: true })` de los `StudentReport` que falten, más un `UPDATE ... FROM
   (VALUES ...)` masivo para los comentarios del docente.
2. **Un** `findMany` que traiga los 25 pares `id`/`studentId`. Es la sentencia que rompe la
   secuencialidad aparente.
3. Las entradas en tres sentencias masivas: `UPDATE ... FROM (VALUES ...)` para las que ya existían,
   `createMany({ skipDuplicates: true })` para las nuevas, y un `deleteMany` con los pares
   `reportId`/`categoryId` de las que el docente vació.
4. Una lectura final para devolver el resultado, en vez de un `findUnique` por alumno.

Con eso desaparece el lote de 5 y la operación pasa a retener una conexión, no cinco.

**El caso borde que hay que preservar, y es el que más fácil se rompe.** Hoy
`teacherComments: undefined` significa **"no toques el comentario"**, distinto de `null`, que
significa "borralo". Un `createMany` que mande `teacherComments || null` a ciegas pisa con `null` lo
que había. La versión medida filtra esos casos del `UPDATE`, pero la medición comprobó el resultado
agregado —25 informes, 75 entradas—, **no cada caso borde**. Antes de dar esto por bueno hay que
verificarlo como se verificó [BUG-07](#bug-07): payloads parciales, comentario ausente, entrada
vaciada, y alumno sin informe previo.

**Por qué P2 y no más.** No está roto y el cliente no lo está sufriendo. Es deuda de la misma familia
que [FIN-06](#fin-06) y [BUG-07](#bug-07) —el tercer y ahora cuarto lugar con el mismo patrón— y
conviene hacerlo cuando se toque ese módulo por otra razón, no como interrupción.

---

# Módulo pedagógico

> **Tesis.** El diferencial no es "tenemos IA" — eso lo replica cualquiera en un fin de semana. El
> diferencial es que `LessonPractice` cuelga de `Lesson`: la práctica está atada a **la clase concreta
> que dio la profesora**. Duolingo no sabe qué vio el alumno en clase. El foso es el circuito cerrado
> **aula → práctica → aula**, y hoy está abierto en las dos puntas: PED-01 cierra la de entrada,
> PED-02 la de salida.

<a id="ped-01"></a>
## PED-01 · Generar la práctica desde `topic`/`content` con un botón · **P1**

**Problema.** Para que exista práctica, el docente tiene que escribir a mano las frases de speaking,
el texto de listening y el escenario del chatbot, clase por clase. No es sostenible en el tiempo, y
si el docente no carga, el diferencial del producto no existe.

**Oportunidad.** El modelo `Lesson` ya tiene `topic` y `content`. Y ya existen `generateVariations` y
`generateListeningText` funcionando en el provider. Es reutilizar lo que hay cambiando el disparador.

**Cambio.** Botón "Generar práctica" en el modal de clase que precargue las tres secciones a partir
de `topic` + `content`, dejando al docente el rol de revisar y publicar (`isPublished` ya existe
justamente para eso).

**Por qué es P1.** Convierte el diferencial de "depende de la disciplina del docente" a "sale gratis".
Si hay que elegir **una sola cosa** de este módulo, es esta.

### Resuelto — 2026-08-11 · pendiente de verificar en stage

**Un botón en el modal de clase, y nada que se guarde solo.** "Generar práctica con IA" vive dentro
de la sección de práctica de
[`EditLessonModal`](../src/app/courses/[id]/lessons/components/EditLessonModal.tsx), llama a
[`/api/practice/generate-draft`](../src/app/api/practice/generate-draft/route.ts) y **llena los tres
campos del formulario**. No escribe en la base: el docente corrige lo que quiera y guarda con el
mismo "Guardar Cambios" de siempre, que ya sabe hacer el upsert de `LessonPractice`. Publicar sigue
siendo un acto aparte y deliberado — `isPublished` existe justamente para eso, y el borrador generado
no lo toca.

**Las tres secciones salen de una sola llamada** (`generatePracticeDraft` en
[`IAIProvider`](../src/lib/practice/providers/ai/IAIProvider.ts), implementado en
[`GeminiProvider`](../src/lib/practice/providers/ai/GeminiProvider.ts)). Tres llamadas habrían sido
tres unidades de cuota y, peor, tres materiales sin relación entre sí: acá el escenario del chatbot
tiene que necesitar el vocabulario del texto de listening, que a su vez es el de las frases. Es el
mismo pedido, no tres.

**El prompt se arma con lo que hay en la base.** `topic` y `content` los lee el guard, no vienen del
body. Contra el docente no defiende nada —puede guardar en `topic` lo que se le ocurra— pero contra
el resto sí: si el texto viajara en la request, cualquiera con sesión de profesor tendría un prompt
libre a nombre del proyecto, que es el agujero que cerró [SEC-07](#sec-07). `content` es un `@db.Text`
sin tope, así que se recorta a 4000 caracteres antes de entrar al prompt.

**Puerta propia, mismo permiso que guardar** (`guardPracticeDraft` en
[`guard.ts`](../src/lib/practice/guard.ts)). No reusa `guardPracticeAi` porque es la otra operación:
no es el alumno sobre una práctica publicada, es el docente sobre una clase que todavía no tiene
material. El criterio es el de `editLessonAction` —personal del instituto dueño del curso, clase
`ACTIVE` de tipo `CLASS`—, y por la razón evidente: quien puede guardar la práctica es quien puede
pedir el borrador. Descuenta cuota como cualquier otra llamada al proveedor.

**No se genera sobre una clase vacía, y esto pega en el caso normal.** Las clases nacen en tanda
desde los horarios del curso, con el tema en `SCHEDULED_LESSON_TOPIC` —"Clase Programada"— y sin
contenidos. Sin chequeo, el botón le pide a la IA una práctica sobre ese título y la escribe igual,
cobrando la llamada. La condición está en [`draft.ts`](../src/lib/practice/draft.ts), en un módulo
sin `prisma` ni `next-auth` para que la usen los dos lados: el modal deshabilita el botón y dice qué
falta **antes** del clic, y el endpoint responde 409 con el mismo texto, porque es el lado que gasta
plata y la interfaz puede equivocarse o no ser la que llamó.

Se exige tema real y **contenidos obligatorios** (30 caracteres, que no miden calidad: evitan que se
saltee el requisito con un punto). El tema no sirve para llenar ese lugar: es el título que ven
alumnos y tutores, corto por diseño. Lo que la IA lee es el contenido. Y los mensajes dicen
*"guardá"* y no *"cargá"*, porque el borrador lo arma el servidor leyendo la clase de la base:
escribirlo en el formulario sin guardar no alcanza.

**Si la IA no devuelve frases, se avisa.** El borrador sin `speakingPhrases` no es un borrador:
`editLessonAction` ni siquiera crearía el `LessonPractice`. El provider tira el error, el endpoint
responde 500 y el modal muestra el cartel. Es lo contrario de lo que hacen hoy los otros generadores
([PED-05](#ped-05)), a propósito: acá el docente aprieta un botón y espera, y el silencio sería
indistinguible de que la IA no hizo nada.

**Efecto colateral en el modal:** los campos de práctica ahora se cargan **al abrir** y no cuando
cambian las props. Sincronizarlos con `lessonPractice` significaba que un `router.refresh()` del
padre le borrara al docente lo que estaba escribiendo — con un borrador generado en pantalla, eso
pasaba de molestia a pérdida de una llamada paga.

**Lo que quedó afuera, a conciencia:**

- **El modal de creación no tiene el botón, y lo dice.** La clase todavía no existe, así que no hay
  `topic` en la base de dónde leer. El circuito es registrar la clase y generar al editarla, que
  además es el momento natural: la práctica se arma después de dar la clase, no antes.

  Se evaluó moverlo (2026-08-12): sacar la práctica del modal y darle pantalla propia, o aceptar el
  tema y los contenidos desde el body. Se descartaron las dos por ahora. La razón para no dejarlo
  callado es de **soporte**, no de interfaz: el 98% de las clases las crea el generador desde los
  horarios, así que el que crea a mano es un caso raro y espaciado, y nadie va a recordar el paso
  extra. Cuando eso llega a soporte llega mal contado. Así que el modal de creación muestra un cartel
  en la sección de práctica que dice dónde está el botón y por qué conviene cargar bien los
  contenidos — el tema es el título que ven alumnos y tutores, el contenido es lo que lee la IA.

  Si el rediseño se retoma, lo que estaba sobre la mesa era: pantalla de práctica propia por clase,
  entrando por el botón "Práctica" de la fila (hoy queda gris y sin acción cuando no hay material),
  con la carga manual, la generación, publicar y la vista previa en un solo lugar. Tiene una trampa
  anotada: si el modal deja de mandar los campos de práctica, la rama de `editLessonAction` que
  limpia la fila cuando llegan cero frases —la de [BUG-03](#bug-03)— se dispara en **cada** edición y
  borra la práctica en silencio. Mover la interfaz obliga a sacar la práctica de esa acción.
- **No se puede regenerar una sola sección.** Reemplaza las tres. Generar sólo el listening ya lo
  hace el alumno desde su práctica, y para el docente la coherencia entre las tres es el punto.

---

<a id="ped-02"></a>
## PED-02 · Devolver el `weakArea` agregado al docente · **P1**

**Problema.** `PracticeSession.weakArea` guarda el área de dificultad detectada por sesión
("th fricative", "short vowels"). Es el dato más valioso del sistema y hoy no vuelve al aula en forma
accionable.

**Cambio.** Vista para el docente a nivel curso: *"12 de 18 alumnos fallaron en /θ/ esta semana"*, y
sugerencia de actividad de 5 minutos. Existe
[`CoursePracticeMetrics.tsx`](../src/app/courses/[id]/lessons/components/CoursePracticeMetrics.tsx) —
revisar qué cubre hoy antes de diseñar.

**Por qué importa.** Es el salto de "app de práctica" a **asistencia pedagógica**. No lo puede copiar
Duolingo, porque Duolingo no tiene profesora.

**Dependencia.** El valor de este ítem depende de que `weakArea` sea confiable — ver
[PED-03](#ped-03).

---

<a id="ped-03"></a>
## PED-03 · Validez de la evaluación de pronunciación · **P1**

**Problema metodológico.** La evaluación no escucha al alumno. En
[`SpeakingHub.tsx:179`](../src/components/practice/SpeakingHub.tsx) se usa
`webkitSpeechRecognition`, y a [`/api/practice/evaluate`](../src/app/api/practice/evaluate/route.ts)
se le envía **texto**: la transcripción. El propio prompt lo dice:
*"The speech recognition transcribed what they said as..."*
([`GeminiProvider.ts:80`](../src/lib/practice/providers/ai/GeminiProvider.ts)).

El reconocimiento de voz del navegador está diseñado para **entender a pesar del acento**: tiene
corrección por modelo de lenguaje. Un hispanohablante que dice "sink" en lugar de "think" muy
probablemente sea transcripto como "think", porque el contexto lo sugiere.

Consecuencia: se evalúa lo que el motor de voz **adivinó que quiso decir**, no cómo lo pronunció. Y
Gemini, que solo recibe dos strings, **infiere** un `weakArea` plausible sin haber oído el audio.

**Riesgo comercial.** Un DOS que sepa de fonética lo detecta en la demo. Y el DOS es el comprador.

**Decisión tomada (2026-08-09).** El objetivo a futuro es **conseguir una API de evaluación fonética
real**. No es para ahora.

**Plan en dos etapas.**

1. **Ahora (bajo costo).** Reencuadrar la promesa en la UI y en la landing: no es "corrección de
   pronunciación" sino **producción oral y fluidez**. El producto sigue siendo valioso y se evita
   quedar expuesto ante un DOS que sepa de fonética. Revisar también los textos que ve el alumno para
   que el feedback no suene más preciso de lo que es.
2. **Cuando haya presupuesto.** Integrar una API de pronunciation assessment con scoring a nivel
   fonema sobre audio real (Azure Speech es la referencia más madura; también existe la opción de
   guardar el audio y evaluarlo con un modelo multimodal). Recién entonces el `weakArea` se vuelve un
   dato confiable y [PED-02](#ped-02) alcanza su valor real.

**Ventaja de la arquitectura actual:** el patrón de providers (`IAIProvider`, `ITTSProvider`) ya
permite sumar un `IPronunciationProvider` sin tocar el resto de la aplicación. La etapa 2 no requiere
refactor previo.

---

<a id="ped-04"></a>
## PED-04 · Persistir y moderar las conversaciones del chatbot · **P1**

**Problema.** `PracticeSession` guarda contadores y porcentajes. La conversación del chatbot **no se
persiste en ningún lado** — vive en el estado de React de
[`AIChatbot.tsx`](../src/components/practice/AIChatbot.tsx) y se pierde.

Dos consecuencias:

- **Producto.** Es el corpus más rico disponible: errores reales, de alumnos reales, sobre temas
  reales de clase. Alimenta PED-02 mucho mejor que un `weakArea` inferido.
- **Cumplimiento.** Con menores de edad y un portal de tutores, un padre **va a preguntar** qué habló
  su hijo con la IA. Hoy no hay respuesta posible. No hay moderación ni registro.

**Cambio.** Modelo `PracticeChatMessage` vinculado a `PracticeSession`. Definir política de
retención, quién puede leer las transcripciones (¿docente? ¿tutor?) y filtro de contenido. Revisar
qué exige la normativa aplicable sobre datos de menores.

---

<a id="ped-05"></a>
## PED-05 · Fallas silenciosas en los providers de IA · **P2**

Cuando Gemini falla, el código degrada en silencio en lugar de avisar:

- [`GeminiProvider.ts:212`](../src/lib/practice/providers/ai/GeminiProvider.ts) — `generateVariations`
  devuelve las frases originales con un punto agregado. El alumno pide "generar nuevas" y recibe las
  mismas.
- [`GeminiProvider.ts:259`](../src/lib/practice/providers/ai/GeminiProvider.ts) —
  `generateListeningText` devuelve el texto original y `questions: []`, sin quiz.
- [`GeminiProvider.ts:296`](../src/lib/practice/providers/ai/GeminiProvider.ts) —
  `generateListeningQuiz` devuelve `[]`.

**Cambio.** Propagar el error y mostrar un mensaje claro en la UI. Un error visible es mejor que una
degradación invisible.

**Además.** `callGemini` no tiene timeout ni `AbortController`
([`GeminiProvider.ts:38`](../src/lib/practice/providers/ai/GeminiProvider.ts)): una request colgada
consume tiempo de función en Vercel hasta el límite. Y la API key viaja en la query string
(`?key=${apiKey}`); Gemini acepta el header `x-goog-api-key`, que no queda en logs de proxies.

**Detalle.** El comentario de las líneas 11-14 describe `gemini-2.0-flash-lite` / `gemini-2.0-flash`,
pero el código usa `gemini-2.5-flash` (línea 18). El modelo debería ser variable de entorno.

---

<a id="ped-06"></a>
## PED-06 · `isCorrect` debe derivarse de `score` · **P3**

[`GeminiProvider.ts:123`](../src/lib/practice/providers/ai/GeminiProvider.ts) toma `isCorrect` de lo
que responde el modelo, en lugar de derivarlo de `score >= 70` como pide el propio prompt
(línea 86). Pueden contradecirse: `score: 85, isCorrect: false`.

**Cambio.** `isCorrect: score >= 70`, calculado en el código. Extraer el umbral a una constante.

---

<a id="ped-07"></a>
## PED-07 · Límites de consumo de IA por plan · **P2**

`InstitutePlan` define `BASIC` / `STANDARD` / `PREMIUM`, y el consumo de IA es ilimitado por alumno.
En el free tier de Gemini no se nota; con varios institutos activos, sí.

**Cambio.** Contador de uso por instituto y período, con tope por plan. Requiere decidir el modelo
comercial: ¿cuántas prácticas incluye cada plan? Se apoya en [SEC-07](#sec-07) (rate limiting), pero
es un problema de negocio, no técnico.

---

<a id="ped-08"></a>
## PED-08 · El caché de TTS no está funcionando · **P3**

[`api/practice/tts/route.ts:41`](../src/app/api/practice/tts/route.ts) devuelve
`Cache-Control: public, max-age=3600` con el comentario "el texto no cambia". Pero es una respuesta a
un **POST**, y los navegadores y CDN no cachean respuestas POST por defecto. El header no tiene
efecto y cada reproducción vuelve a generar el audio.

**Cambio.** Pasar a `GET` con el texto hasheado en la URL, o cachear el audio del lado del servidor
(Supabase Storage) con clave `hash(texto + voz + velocidad)`. Relevante si se usa un TTS pago.

---

<a id="ped-09"></a>
## PED-09 · Generar recursos extra de la clase para el docente · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Un generador de contenido de recursos extra para la clase, para uso del
docente.

**Qué lo distingue de [PED-01](#ped-01).** PED-01 genera lo que practica **el alumno** solo, en su
casa, y por eso tiene una forma fija: tres secciones que `LessonPractice` sabe guardar y que la app
del alumno sabe ejecutar. Esto es otra cosa: material para **la profesora**, para dar la clase
siguiente o reforzar la que dio. No lo consume la aplicación, lo consume una persona.

Esa diferencia es la que hay que resolver antes de escribir código, y no es técnica:

**Qué es un "recurso extra" hay que definirlo con el cliente.** Puede ser una guía de ejercicios para
imprimir, una actividad de 10 minutos para arrancar la clase, un juego para el aula, ejemplos
adicionales de un punto gramatical, o un texto de lectura. Cada una tiene una forma distinta, y "todo
eso" no es una funcionalidad, es cinco. Conviene que la profesora diga cuáles pide de verdad y con
qué frecuencia, antes de decidir qué genera el sistema.

**Dos preguntas que cambian el diseño por completo:**

1. **¿Se guarda o se descarta?** Si el recurso queda pegado a la clase, hace falta un modelo nuevo
   (`LessonResource`) y decidir quién lo ve — ¿sólo quien lo generó, todo el instituto, los alumnos?
   Si es de un solo uso, alcanza con generarlo y ofrecer copiarlo o bajarlo en PDF, y no hay
   migración.
2. **¿En qué formato sale?** Texto para copiar y pegar es lo más barato. Un PDF armado ya es otro
   trabajo, aunque el proyecto tiene `jspdf` y lo usa para recibos e informes, así que hay de dónde
   agarrarse.

**Lo que ya está construido y sirve.** El circuito completo de PED-01 es reutilizable tal cual: el
patrón de providers (`IAIProvider`), el guard de personal sobre una clase
([`guardPracticeDraft`](../src/lib/practice/guard.ts)), la cuota, y la validación de que la clase
tenga tema y contenidos ([`draft.ts`](../src/lib/practice/draft.ts)). Un método nuevo en el provider
y un endpoint que devuelva texto es la versión mínima, y es chica.

**Prioridad.** P2 y no P1: es un pedido nuevo, no algo roto, y el diferencial del producto —el
circuito aula → práctica → aula— pasa por [PED-02](#ped-02), no por acá. Pero es barato sobre lo que
ya existe, y es el tipo de cosa que la profesora nota todos los días.

**Riesgo a tener presente.** Cada generación cuesta cuota, y a diferencia de la práctica del alumno
—que la usa un curso entero— esto lo dispara una sola persona para su propio uso. Si se vuelve
frecuente, entra antes de lo previsto la discusión de [PED-07](#ped-07) (topes por plan).

---

## Apéndice · Verificado y descartado

Cosas que parecían problemas y no lo son. Anotadas para no volver a revisarlas:

- **Listados de profesores.** Se sospechó que consultaban solo el campo `role` (deprecado) y que por
  eso no aparecerían los profesores nuevos. **Falso**: usan `OR: [{ role: "TEACHER" }, { roles: { has: "TEACHER" } }]`
  en payroll, cursos, calendario y dashboard. Está bien resuelto.
- **`teachers/actions.ts:73`** sí setea `role` al crear un profesor. El campo solo queda sin setear al
  crear tutores y al agregar roles a usuarios existentes (ver [SEC-01](#sec-01)).
- **`prisma.ts`** sigue el patrón singleton estándar para desarrollo. El problema no es el patrón sino
  la falta de configuración de pooling ([ARQ-02](#arq-02)).
- **`stage` y `main`** tenían contenido de archivos idéntico al momento del relevamiento; la
  diferencia eran solo los commits de merge.
