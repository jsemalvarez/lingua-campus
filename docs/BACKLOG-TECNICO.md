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
  instituto tienen hoy acceso efectivo de administrador ([SEC-01](#sec-01)). Sigue siendo lo primero,
  aunque más por lo barato de arreglarlo ahora que por el volumen expuesto.
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

1. [ARQ-07](#arq-07) — completar los tipos de sesión. Va primero porque convierte al compilador en
   red de seguridad para los pasos siguientes: ahorra trabajo, no lo agrega.
2. [SEC-02](#sec-02) — crear el helper `requireRole()`. No rompe nada, solo agrega.
3. [SEC-01](#sec-01) — migrar los ~40 llamadores a `roles[]` y recién entonces borrar la columna `role`.
4. [BUG-04](#bug-04) + [SEC-08](#sec-08) — caen casi solos una vez unificados los roles.
5. [SEC-03](#sec-03) + [SEC-04](#sec-04) — aplicar el helper a finanzas y tapar los dos chequeos de instituto faltantes.

Al terminar esta tanda, los tutores dejan de tener acceso de administrador y la secretaria deja de
convertirse en profesora.

### Tanda 3 · Bugs de plata

Corren sobre dinero real de un cliente real y son silenciosos: nadie los reporta porque nadie los ve.

[FIN-01](#fin-01), [FIN-02](#fin-02) y [FIN-03](#fin-03) tocan **la misma función**
(`voidPaymentAction`): hacerlos en un solo pase. Después [FIN-04](#fin-04) (condiciones de carrera) y
[FIN-07](#fin-07) (curso completo).

### Tanda 4 · Migraciones, mientras sean baratas

Tocan datos existentes. Con un instituto y pocos meses de historia esto es un rato; con diez clientes
es un proyecto. **La ventana se cierra sola.**

[FIN-06](#fin-06) (restricciones únicas) → [FIN-05](#fin-05) (`Decimal`) → [ARQ-01](#arq-01)
(foreign keys e índices) → [FIN-08](#fin-08) (`dueDate`).

[ARQ-05](#arq-05) (borrado lógico) entra acá también, pero es transversal y conviene partirlo:
primero alumno y clase — que resuelven [BUG-02](#bug-02) y [BUG-03](#bug-03) —, el resto después.

### Tanda 5 · El módulo pedagógico

Acá está el diferencial del producto. Se empieza por cerrar el agujero de costos, porque es el único
con urgencia real.

[SEC-07](#sec-07) (cerrar los endpoints de IA) → [PED-01](#ped-01) (generar la práctica con un botón)
→ [PED-02](#ped-02) (devolver el `weakArea` al docente) → [PED-04](#ped-04) (persistir las
conversaciones).

[PED-03](#ped-03) etapa 1 (reencuadrar la promesa) es solo texto y se puede hacer en cualquier
momento.

### Tanda 6 · El resto

[SEC-05](#sec-05), [SEC-06](#sec-06), [SEC-09](#sec-09), [SEC-10](#sec-10), [FIN-09](#fin-09),
[FIN-10](#fin-10), [ARQ-02](#arq-02), [ARQ-03](#arq-03), [PED-05](#ped-05) a [PED-08](#ped-08).

[ARQ-04](#arq-04) (tests) queda fuera del orden por decisión explícita.

### Sobre intercalar features del cliente

Este orden asume que no aparece nada nuevo, cosa que no va a pasar. La regla práctica: los pedidos
del cliente entran **entre tandas**, no en el medio de una. Cortar la tanda 2 por la mitad deja el
sistema en un estado donde la mitad de los permisos se evalúan de una forma y la otra mitad de otra
— que es exactamente el problema que estamos arreglando.

---

## Índice

| ID | Prioridad | Título | Estado |
|---|---|---|---|
| [SEC-01](#sec-01) | P0 | Eliminar `User.role` y unificar en `roles[]` | [ ] |
| [SEC-02](#sec-02) | P0 | Helper único de autorización (`requireRole`) | [ ] |
| [SEC-03](#sec-03) | P0 | Control de rol en las acciones financieras | [ ] |
| [SEC-04](#sec-04) | P0 | Validación de instituto faltante en 2 acciones de cobro | [ ] |
| [SEC-05](#sec-05) | P1 | Login sin alcance de instituto | [ ] |
| [SEC-06](#sec-06) | P1 | Contraseñas por defecto hardcodeadas | [ ] |
| [SEC-07](#sec-07) | P1 | Endpoints de IA abiertos y sin límite de uso | [ ] |
| [SEC-08](#sec-08) | P2 | Permisos rancios en el JWT | [ ] |
| [SEC-09](#sec-09) | P2 | `middleware.ts` de protección de rutas | [ ] |
| [SEC-10](#sec-10) | P2 | Validación de entrada en server actions | [ ] |
| [FIN-01](#fin-01) | P0 | Anular un pago no devuelve el saldo a favor | [ ] |
| [FIN-02](#fin-02) | P0 | Anular un pago con saldo saca plata inexistente | [ ] |
| [FIN-03](#fin-03) | P1 | `datePaid` se borra siempre al anular (código muerto) | [ ] |
| [FIN-04](#fin-04) | P0 | Condición de carrera al registrar cobros | [ ] |
| [FIN-05](#fin-05) | P1 | Montos en `Float` en lugar de `Decimal` | [ ] |
| [FIN-06](#fin-06) | P1 | Cuotas duplicadas: falta restricción única | [ ] |
| [FIN-07](#fin-07) | P1 | Pasar a curso completo no limpia las cuotas mensuales | [ ] |
| [FIN-08](#fin-08) | P2 | `OVERDUE` nunca se asigna / falta `dueDate` | [ ] |
| [FIN-09](#fin-09) | P2 | Deudores incluye alumnos dados de baja | [ ] |
| [FIN-10](#fin-10) | P3 | Formato de moneda con locale del servidor | [ ] |
| [BUG-01](#bug-01) | P1 | El alumno que entra con DNI no puede guardar prácticas | [ ] |
| [BUG-02](#bug-02) | P1 | Borrar una clase con prácticas hechas falla | [ ] |
| [BUG-03](#bug-03) | P1 | Vaciar las frases de una clase ya practicada falla | [ ] |
| [BUG-04](#bug-04) | P1 | 🗣️ El rol de la secretaria se revierte a profesora | [ ] |
| [BUG-05](#bug-05) | P1 | 🗣️ El admin ve el hilo en la bandeja pero recibe 404 al abrirlo | [~] |
| [BUG-06](#bug-06) | P2 | El admin ve todos los hilos del instituto como no leídos | [ ] |
| [FEAT-01](#feat-01) | P2 | 🗣️ Adjuntar archivos en el primer mensaje de un hilo | [ ] |
| [FEAT-02](#feat-02) | P2 | 🗣️ Paginar las clases del curso por mes | [ ] |
| [ARQ-01](#arq-01) | P2 | Multi-tenancy manual: FK e índices faltantes | [ ] |
| [ARQ-02](#arq-02) | P2 | Pooling de conexiones Prisma/Supabase | [ ] |
| [ARQ-03](#arq-03) | P2 | Dominios hardcodeados en `tenant.ts` | [ ] |
| [ARQ-04](#arq-04) | P3 | Tests automatizados | [ ] |
| [ARQ-05](#arq-05) | P1 | Política de borrado lógico en todo el sistema | [ ] |
| [ARQ-06](#arq-06) | P3 | Limpiar props de identidad sin uso en `MessagesBell` | [ ] |
| [ARQ-07](#arq-07) | P2 | Completar los tipos de sesión en `next-auth.d.ts` | [ ] |
| [ARQ-08](#arq-08) | P3 | Los archivos del Storage no se borran nunca | [ ] |
| [PED-01](#ped-01) | P1 | Generar la práctica desde `topic`/`content` con un botón | [ ] |
| [PED-02](#ped-02) | P1 | Devolver el `weakArea` agregado al docente | [ ] |
| [PED-03](#ped-03) | P1 | Validez de la evaluación de pronunciación | [ ] |
| [PED-04](#ped-04) | P1 | Persistir y moderar las conversaciones del chatbot | [ ] |
| [PED-05](#ped-05) | P2 | Fallas silenciosas en los providers de IA | [ ] |
| [PED-06](#ped-06) | P3 | `isCorrect` debe derivarse de `score` | [ ] |
| [PED-07](#ped-07) | P2 | Límites de consumo de IA por plan | [ ] |
| [PED-08](#ped-08) | P3 | El caché de TTS no está funcionando | [ ] |

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

---

<a id="sec-08"></a>
## SEC-08 · Permisos rancios en el JWT · **P2**

`session.strategy = "jwt"` sin `maxAge` configurado, y los `roles` viajan dentro del token
([`auth.ts:75`](../src/lib/auth.ts)). Si se le quita un rol a un usuario, lo conserva hasta cerrar
sesión.

**Cambio.** Definir `maxAge`, o releer los roles desde la base en el callback `session`
(cuesta una query por request; evaluar). Como mínimo, invalidar la sesión al cambiar roles.

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

**Cambio.**
1. Agregar al modelo `Fee`: `@@unique([enrollmentId, type, year, month])` para cuotas de inscripción,
   y una restricción equivalente para las de tipo `ENROLLMENT` que no tienen `enrollmentId`
   (probablemente `@@unique([studentId, type, year])`). **Limpiar duplicados existentes antes de
   aplicar la migración.**
2. Usar `createMany({ skipDuplicates: true })`.

**Otros huecos de la misma función:**
- No contempla `startDate` / `endDate` del curso: genera cuotas de meses fuera del período lectivo.
- No filtra por `student.status`: un alumno dado de baja con inscripción activa sigue generando cuotas.

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

Además, en la línea 53 busca `student.findFirst({ where: { email } })` **sin filtrar por instituto**,
y el email de alumno es único solo por instituto: dos homónimos en institutos distintos y la sesión
se guarda en el legajo equivocado.

**Cambio.** Usar `session.user.id` como `studentId`, tal como ya lo hace correctamente
[`practice/page.tsx:21`](../src/app/practice/page.tsx). Elimina las dos fallas de una vez.

**Nota.** Verificar si hay más endpoints que identifiquen al alumno por email en lugar de por id.

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

---

<a id="bug-03"></a>
## BUG-03 · Vaciar las frases de una clase ya practicada falla · **P1**

Mismo origen que [BUG-02](#bug-02).
[`courses/[id]/lessons/actions.ts:175`](../src/app/courses/[id]/lessons/actions.ts) ejecuta
`lessonPractice.deleteMany({ where: { lessonId } })` cuando el docente borra todas las frases. Como
`PracticeSession.lessonPractice` no tiene cascade, falla si algún alumno ya practicó.

**Cambio.** Se resuelve junto con BUG-02. Alternativa razonable: en vez de borrar el
`LessonPractice`, marcarlo `isPublished: false` y conservar el registro.

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

**Estado: corregido en `72fbdca`, pendiente de verificación en stage.**

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

**Ojo.** [`courses/[id]/page.tsx:100`](../src/app/courses/[id]/page.tsx) calcula las métricas de
práctica a partir de `course.lessons`. Si se filtra la query por mes, las métricas pasan a ser del
mes en lugar del curso completo. Hay que decidir si es lo deseado; si no, necesitan su propia
consulta.

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
