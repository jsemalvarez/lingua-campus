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
| [BUG-04](#bug-04) | ~~La secretaria pasa a profesora en 11 pantallas.~~ Resuelto el 2026-08-13: la prop `currentActiveRole` del `Navbar` pasó a ser obligatoria, así que la próxima pantalla que la olvide no compila. **Falta verificar con la usuaria.** |

BUG-04 se puede cerrar sin depender de nadie.

### 🗣️ Pedidos del cliente · 2026-09-02

Siete pedidos del mismo día. **Dos no son trabajo nuevo**, y conviene contestarlos antes de ponerlos
en la cola:

| | Qué es en realidad |
|---|---|
| [FIN-29](#fin-29) | La cuota que no se emite al inscribir. **Es el único urgente**: es plata que no se factura y que no se ve en ninguna pantalla. |
| [FIN-09](#fin-09) | Los deudores acotados a alumnos activos en cursos activos. Estaba decidido a medias el 16/08 y nunca se hizo; el pedido le agrega el curso. |
| [FEAT-17](#feat-17) | Borrador de la clase y publicación. El estado ya existe dos veces en el producto —la práctica y los informes—; lo caro es lo que arrastra la liquidación de sueldos. |
| [FEAT-18](#feat-18) | Que el listado del curso no muestre a los que dejaron. El parte y las notas ya los filtran: empareja la lista con lo que el sistema ya decidió. **Se cruza con FIN-09.** |
| [FEAT-06](#feat-06) | Escribirle al docente del curso. Ya estaba pedido para tutores y docentes; ahora suma a los alumnos. Es el mismo corte de código. |
| [BUG-13](#bug-13) | Cambiar de curso desde la ficha del alumno. **Ya existe y la secretaria ya puede**: falta saber con qué se topó ella. |
| [FEAT-19](#feat-19) | Sumar un concepto de nota al boletín desde el 2° trimestre. La plantilla es una sola fila viva y sin tiempo: hacerlo hoy le cambia el informe que las familias ya firmaron. **Tiene fecha: antes de que se toque la plantilla.** |

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
   ~~[SEC-03](#sec-03) quedó cubierto salvo la decisión de producto sobre qué puede anular una
   secretaria.~~ Decidido y cerrado el 2026-08-13: la secretaría entra a la plata que entra y no a la
   que sale.

**Tanda cerrada el 2026-08-10, a falta de verificar en stage.** Los tutores dejan de tener acceso de
administrador y la secretaria deja de convertirse en profesora. [SEC-03](#sec-03) y
[BUG-04](#bug-04) se cerraron el 2026-08-13. Sigue la tanda 3.

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
| [SEC-03](#sec-03) | P0 | Control de rol en las acciones financieras | [x] |
| [SEC-04](#sec-04) | P0 | Validación de instituto faltante en 2 acciones de cobro | [x] |
| [SEC-05](#sec-05) | P1 | Login sin alcance de instituto | [ ] |
| [SEC-06](#sec-06) | P1 | Contraseñas por defecto hardcodeadas | [ ] |
| [SEC-07](#sec-07) | P1 | Endpoints de IA abiertos y sin límite de uso | [x] |
| [SEC-08](#sec-08) | P2 | Permisos rancios en el JWT | [x] |
| [SEC-09](#sec-09) | P2 | `middleware.ts` de protección de rutas | [ ] |
| [SEC-10](#sec-10) | P2 | Validación de entrada en server actions | [ ] |
| [SEC-11](#sec-11) | P1 | 🗣️ Obligar a cambiar la contraseña por defecto en el primer ingreso | [ ] |
| [SEC-12](#sec-12) | P1 | El login del alumno no mira el estado: el preinscripto y el dado de baja entran igual | [ ] |
| [SEC-13](#sec-13) | P2 · hoy inofensivo | El login del alumno no ata la búsqueda al instituto | [ ] |
| [FIN-01](#fin-01) | P0 | Anular un pago no devuelve el saldo a favor | [x] |
| [FIN-02](#fin-02) | P0 | Anular un pago con saldo saca plata inexistente | [x] |
| [FIN-03](#fin-03) | P1 | `datePaid` se borra siempre al anular (código muerto) | [x] |
| [FIN-04](#fin-04) | P0 | Condición de carrera al registrar cobros | [x] |
| [FIN-05](#fin-05) | P1 | Montos en `Float` en lugar de `Decimal` | [ ] |
| [FIN-06](#fin-06) | P1 | Cuotas duplicadas: falta restricción única | [x] |
| [FIN-07](#fin-07) | P1 | Pasar a curso completo no limpia las cuotas mensuales | [x] |
| [FIN-08](#fin-08) | P2 | `OVERDUE` nunca se asigna / falta `dueDate` | [ ] |
| [FIN-09](#fin-09) | P2 | 🗣️ Deudores incluye alumnos dados de baja y cursos terminados | [ ] |
| [FIN-10](#fin-10) | P3 | Formato de moneda con locale del servidor | [ ] |
| [FIN-11](#fin-11) | P1 | No hay forma de anular una aplicación de saldo a favor | [x] |
| [FIN-12](#fin-12) | P1 | Los generadores de matrícula asumen una por alumno y año | [x] |
| [FIN-13](#fin-13) | P2 | 🗣️ No se ve quién aplicó un descuento o recargo, ni por qué | [ ] |
| [FIN-14](#fin-14) | P1 | La generación masiva de matrículas ignora el año lectivo | [x] |
| [FIN-15](#fin-15) | P2 | La matrícula anticipada no tiene restricción única en la base | [ ] |
| [FIN-16](#fin-16) | P2 | El generador mensual ignora el período lectivo y a los alumnos de baja | [ ] |
| [FIN-17](#fin-17) | P2 | Las cuotas de examen quedaron fuera de la normalización del mes | [x] |
| [FIN-18](#fin-18) | P3 | La matrícula anticipada del que sigue en el mismo curso queda sin curso | [ ] |
| [FIN-19](#fin-19) | P3 | Dos matrículas del mismo año se ven idénticas fuera del cobro | [ ] |
| [FIN-20](#fin-20) | P1 | 🗣️ Cuotas duplicadas al cambiar de curso: la regla única es por inscripción | [ ] |
| [FIN-21](#fin-21) | P2 | No se puede registrar un pago con fecha pasada | [ ] |
| [FIN-22](#fin-22) | P1 | 🗣️ El generador mensual no ve las cuotas sin inscripción y las duplica | [x] |
| [FIN-23](#fin-23) | P1 | Desinscribir a un alumno le suelta todas las cuotas, incluidas las pagas | [x] |
| [FIN-24](#fin-24) | P2 | Cambiar de curso no define qué pasa con las cuotas | [ ] |
| [FIN-25](#fin-25) | P2 | 🗣️ Las condiciones especiales de una inscripción no se ven | [ ] |
| [FIN-26](#fin-26) | P2 | 🗣️ No hay dónde conciliar una diferencia de plata a favor del alumno | [ ] |
| [FIN-27](#fin-27) | P1 | «Usar Saldo» deja el formulario armado para un cobro que nadie hizo | [x] |
| [FIN-28](#fin-28) | P3 hoy · **P1 en noviembre** | La fecha de inicio del curso es opcional, y sin ella el curso no tiene año | [ ] |
| [FIN-29](#fin-29) | P1 | 🗣️ Inscribir a un alumno no le emite la cuota del mes | [ ] |
| [FIN-30](#fin-30) | P2 | Volver a un curso que se dejó no tiene camino propio ni deja rastro | [ ] |
| [BUG-01](#bug-01) | P1 | El alumno que entra con DNI no puede guardar prácticas | [x] |
| [BUG-02](#bug-02) | P1 | Borrar una clase con prácticas hechas falla | [x] |
| [BUG-03](#bug-03) | P1 | Vaciar las frases de una clase ya practicada falla | [x] |
| [BUG-04](#bug-04) | P1 | 🗣️ El rol de la secretaria se revierte a profesora | [x] |
| [BUG-05](#bug-05) | P1 | 🗣️ El admin ve el hilo en la bandeja pero recibe 404 al abrirlo | [x] |
| [BUG-06](#bug-06) | P2 | El admin ve todos los hilos del instituto como no leídos | [x] |
| [BUG-07](#bug-07) | P1 | 🗣️ No se pueden guardar las asistencias de la clase | [x] |
| [BUG-08](#bug-08) | P1 | 🗣️ La preinscripción duplica alumnos y se la puede inscribir a un curso | [ ] |
| [BUG-09](#bug-09) | P3 | Los meses salen en inglés en la liquidación de sueldos | [ ] |
| [BUG-10](#bug-10) | P2 | 🗣️ Un concepto largo empuja el importe fuera de la pantalla | [x] |
| [BUG-11](#bug-11) | P3 | El saldo a favor del formulario queda viejo si se anula desde la tabla | [ ] |
| [BUG-12](#bug-12) | P3 | El escáner de QR pisa la observación que escribió la docente | [x] |
| [BUG-13](#bug-13) | P2 | 🗣️ La secretaria no encuentra cómo cambiar de curso a un alumno | [ ] |
| [BUG-14](#bug-14) | P2 | Los filtros del calendario no avisan que están filtrando | [ ] |
| [BUG-15](#bug-15) | P2 | En el celular el listado de alumnos no tiene ninguna acción | [ ] |
| [BUG-16](#bug-16) | P1 | 🗣️ El alumno y el tutor no pueden descargar el recibo de un pago | [ ] |
| [BUG-17](#bug-17) | P1 | 🗣️ Las clases que cargan las docentes no aparecen en el calendario | [x] |
| [BUG-18](#bug-18) | P2 | La vista Día del calendario no ofrece tomar asistencia | [ ] |
| [BUG-19](#bug-19) | P2 | El panel de uso declara en producción una fecha desde la que nunca midió | [ ] |
| [BUG-20](#bug-20) | P3 | La ficha dice «Sin datos registrados» teniendo el teléfono del tutor | [ ] |
| [BUG-21](#bug-21) | P2 | 🗣️ La tarjeta de asistencia del tutor no mide el período que anuncia | [ ] |
| [BUG-22](#bug-22) | P3 | Los cuatro contadores del Hub del alumno no comparten universo | [ ] |
| [FEAT-01](#feat-01) | P2 | 🗣️ Adjuntar archivos en el primer mensaje de un hilo | [ ] |
| [FEAT-02](#feat-02) | P2 | 🗣️ Paginar las clases del curso por mes | [x] |
| [FEAT-03](#feat-03) | P3 | Saltar al mes de la clase recién creada o movida | [ ] |
| [FEAT-04](#feat-04) | P2 | 🗣️ Saber quiénes entraron a la plataforma, sobre todo los tutores | [ ] |
| [FEAT-05](#feat-05) | P1 | 🗣️ Recuperar la contraseña por correo | [ ] |
| [FEAT-06](#feat-06) | P2 | 🗣️ Que alumnos, tutores y docentes puedan escribirle al docente del curso | [~] |
| [FEAT-07](#feat-07) | P2 | 🗣️ Ver en el calendario las clases de los pares del mismo nivel | [x] |
| [FEAT-08](#feat-08) | P2 | 🗣️ Columna de novedades: plataforma, instituto y curso | [ ] |
| [FEAT-09](#feat-09) | P2 | 🗣️ Firma de conformidad de informes y novedades | [ ] |
| [FEAT-10](#feat-10) | P2 | Seguimiento visual de las cuotas eliminadas | [x] |
| [FEAT-11](#feat-11) | P3 | 🗣️ Métricas de uso de la plataforma para el administrador | [ ] |
| [FEAT-12](#feat-12) | P3 | 🗣️ Aviso por correo cuando llega un formulario de inscripción | [ ] |
| [FEAT-13](#feat-13) | P3 | Guardar la asistencia sola, sin botón de guardar | [ ] |
| [FEAT-14](#feat-14) | P2 | 🗣️ Carrito de pagos: cobrar varias cuotas en una sola operación | [ ] |
| [FEAT-15](#feat-15) | P2 | 🗣️ Filtrar los deudores por mes | [x] |
| [FEAT-16](#feat-16) | P3 | Mudar la actividad del Playground al panel de uso | [ ] |
| [FEAT-17](#feat-17) | P2 | 🗣️ Borrador de la clase, y publicarla cuando el docente quiera | [ ] |
| [FEAT-18](#feat-18) | P3 | 🗣️ Que el listado del curso no muestre a los que dejaron | [ ] |
| [FEAT-19](#feat-19) | P2 | 🗣️ Sumar un concepto de nota al boletín sin tocar lo ya publicado | [ ] |
| [FEAT-20](#feat-20) | P2 | Acusar por correo la preinscripción, para que el que se anota no quede sin respuesta | [ ] |
| [FEAT-21](#feat-21) | P2 | 🗣️ Firma de la dirección y del profesor en el boletín | [~] |
| [FEAT-22](#feat-22) | P2 · sube a P1 con FEAT-06 | Notificaciones push: el sobre solo no alcanza | [ ] |
| [FEAT-23](#feat-23) | P3 | Los hilos de mensajes no se cierran nunca | [ ] |
| [FEAT-24](#feat-24) | P3 | Buscar dentro del contenido de los mensajes | [ ] |
| [FEAT-25](#feat-25) | P3 | No se sabe quién de la administración contestó un hilo | [ ] |
| [FEAT-26](#feat-26) | P2 | Reponer una cuota eliminada sin pasar por un script | [ ] |
| [FEAT-27](#feat-27) | P3 | 🗣️ La pantalla promete un boletín cuando el alumno no tiene ninguno | [x] |
| [FEAT-28](#feat-28) | P3 | 🗣️ El alumno grande sin tutor cargado no lleva sección de tutores | [x] |
| [FEAT-29](#feat-29) | P3 | Desvincular a un tutor de un alumno | [ ] |
| [FEAT-30](#feat-30) | P3 | Que la familia vea todas las clases del curso y en cuáles estuvo | [ ] |
| [FEAT-31](#feat-31) | P2 | 🗣️ Ver los gastos cargados, filtrados por mes | [ ] |
| [ARQ-01](#arq-01) | P2 | Multi-tenancy manual: FK e índices faltantes | [ ] |
| [ARQ-02](#arq-02) | P2 | Pooling de conexiones Prisma/Supabase | [ ] |
| [ARQ-03](#arq-03) | P2 | Dominios hardcodeados en `tenant.ts` | [ ] |
| [ARQ-04](#arq-04) | P3 | Tests automatizados | [ ] |
| [ARQ-05](#arq-05) | P1 | Política de borrado lógico en todo el sistema | [ ] |
| [ARQ-06](#arq-06) | P3 | Limpiar props de identidad sin uso en `MessagesBell` | [x] |
| [ARQ-07](#arq-07) | P2 | Completar los tipos de sesión en `next-auth.d.ts` | [x] |
| [ARQ-08](#arq-08) | P3 | Los archivos del Storage no se borran nunca | [ ] |
| [ARQ-09](#arq-09) | P2 | Los errores no se registran en ningún lado | [ ] |
| [ARQ-10](#arq-10) | P2 | No hay auditoría de las acciones del panel | [ ] |
| [ARQ-11](#arq-11) | P2 | Guardar las notas de un informe cuesta 250 sentencias | [ ] |
| [ARQ-12](#arq-12) | P2 | Versionar el proyecto y mostrar la versión en la app | [ ] |
| [ARQ-13](#arq-13) | P3 | Saber qué versión está usando cada usuario | [ ] |
| [ARQ-14](#arq-14) | P3 | La purga de un alumno no puede borrar a ningún alumno real | [ ] |
| [ARQ-15](#arq-15) | P2 | 🗣️ La identidad está partida en dos tablas: `User` y `Student` | [ ] |
| [ARQ-16](#arq-16) | P3 · sube con el número | Qué cuesta cada filtro del calendario | [ ] |
| [PED-01](#ped-01) | P1 | Generar la práctica desde `topic`/`content` con un botón | [x] |
| [PED-02](#ped-02) | P1 | Devolver el `weakArea` agregado al docente | [ ] |
| [PED-03](#ped-03) | P1 | Validez de la evaluación de pronunciación | [ ] |
| [PED-04](#ped-04) | P1 | Persistir y moderar las conversaciones del chatbot | [ ] |
| [PED-05](#ped-05) | P2 | Fallas silenciosas en los providers de IA | [ ] |
| [PED-06](#ped-06) | P3 | `isCorrect` debe derivarse de `score` | [x] |
| [PED-07](#ped-07) | P2 | Límites de consumo de IA por plan | [ ] |
| [PED-08](#ped-08) | P3 | El caché de TTS no está funcionando | [ ] |
| [PED-09](#ped-09) | P2 | 🗣️ Generar recursos extra de la clase para el docente | [ ] |
| [PED-10](#ped-10) | P2 | Consumo de IA por instituto, visible para el superadmin | [ ] |

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

### Resuelto — 2026-08-13 · pendiente de verificar en stage

**La decisión la tomó el instituto y el criterio es la dirección de la plata, no la gravedad de la
acción.** La secretaría entra a todo lo que **entra** —cuotas, matrículas e ingresos varios, que son
el libro o la fotocopia que vende el instituto— y no toca lo que **sale**. Los gastos y los sueldos
son del dueño.

Eso deja el corte así:

| Acción | Quién |
|---|---|
| `voidPaymentAction` | ADMIN + SECRETARY — es cuota o matrícula |
| `createIncomeAction` / `voidIncomeAction` | ADMIN + SECRETARY — un libro, una fotocopia |
| `deleteFeeAction` | ADMIN + SECRETARY — la cuota es lo suyo |
| `createExpenseAction` | **ADMIN** — cubre los sueldos, que entran por acá con `category === "Payroll"` |
| `voidExpenseAction` | **ADMIN** |

**La interfaz ya estaba bien; lo que faltaba era el servidor.** `/payments` ya le escondía a la
secretaría el formulario de egresos, el acceso a sueldos, el selector de mes y **todos** los bloques
de KPI —incluidas Rentabilidad y Total de egresos, que exponen el gasto aunque no se liste—, y
filtraba del libro mayor todo `EXPENSE`, `PAYROLL` o con `expenseId`. Pero las acciones seguían
aceptando SECRETARY, y esconder un formulario no protege un server action.

**Dos huecos que aparecieron al implementarlo, y que no eran de permisos de acción sino de acceso:**

1. **`/payments/payroll` se abría escribiendo la URL.** El botón estaba escondido, pero la página
   usaba `INSTITUTE_ADMINS`, que incluye SECRETARY. Se veía cuánto cobra cada profesor. Ahora es
   `["ADMIN"]`.
2. **`/api/teachers/[id]/payroll` le devolvía el sueldo de cualquier profesor.** Se sacó SECRETARY;
   el profesor consultando el propio se mantiene por `isSelf`, así que una secretaria que además dé
   clases sigue viendo el suyo.

`/api/institutes/payroll` y las acciones de `teachers/actions.ts` —`processTeacherPayment`,
`processBulkPayrollAction`— ya estaban en `["ADMIN"]`. La escritura de sueldos nunca estuvo abierta;
lo que estaba abierto era mirarlos.

**`deleteFeeAction` ahora deja asiento.** Era la única acción de plata sin rastro: anular un pago, un
gasto o un ingreso escribe su contra-asiento con `operatorId`, pero acá la fila desaparecía y no
quedaba nada. No borra plata cobrada —se niega si la cuota tiene pagos— pero **borra una deuda**. La
decisión fue dejarla con la secretaría y emparejarle la traza, no restringirla: el problema no era
quién podía, era que fuera invisible.

El asiento va con importe 0, con la misma forma que la aplicación de saldo a favor, y nombra alumno,
período e importe. **Dos límites conocidos:** no se ve en la tabla del libro mayor, que filtra los de
importe 0, y suma un tercer sentido a `ADJUSTMENT`.

Ese filtro **se queda**: [FIN-11](#fin-11) decidió el mismo día que esa pantalla es la caja. Así que
el rastro existe y es consultable, pero sólo desde la base. Hacerlo visible es
[FEAT-10](#feat-10), que además lo saca de `Transaction` y le da tabla propia con motivo — este
asiento es un puente, no la forma definitiva.

**Qué falta verificar en stage.** Entrar como secretaria y confirmar: que `/payments/payroll`
redirige al dashboard, que la pantalla de finanzas sigue dejándole registrar un ingreso vario, y que
borrar una cuota impaga funciona y deja el asiento con su `operatorId`. Y como admin, que los gastos
y los sueldos siguen funcionando igual.

### Verificado en stage — 2026-08-16

**Como secretaria** (`roles = {TEACHER, SECRETARY}`, en modo Secretaría):

- `/payments/payroll` **escribiendo la URL redirige al dashboard**. Era el hueco real de esta ficha:
  el botón estaba escondido pero la página se abría y mostraba cuánto cobra cada profesor.
- En `/payments` **no hay formulario de egresos**, ni KPI de Rentabilidad, ni de Total de egresos, ni
  acceso a sueldos. El único formulario de la pantalla es el de cobro. La palabra "egresos" aparece
  sólo en el subtítulo genérico de la pantalla.

**Como admin**, que es la mitad que comprueba que no se haya trabado nada del lado del dueño:

- **Gasto asentado y anulado.** $12.345 en ALQUILER: se creó con `status VALID` y su `Transaction`
  de −12.345; al anularlo quedó en `VOIDED` con un `ADJUSTMENT` de +12.345 y la descripción
  "Anulación de Gasto #…". Neto cero, sin borrar la fila.
- **Sueldo liquidado y anulado.** "Pago de Haberes - July 2026", $20.000, `category = 'Payroll'`, con
  su `Transaction` de tipo `PAYROLL` y el destinatario correcto. Entra por `createExpenseAction`, que
  desde este ítem es sólo de admin, así que es la prueba de que ese corte no rompió la liquidación.
- **El operador quedó bien registrado en las cuatro operaciones.**
- Como admin **sí** aparecen el KPI de Rentabilidad, el acceso a Pago de Sueldos y la solapa de Otros
  Gastos. El contraste entre los dos roles es el que definió el instituto.

**Los dos gastos de prueba quedaron anulados, no borrados**, que es lo que corresponde a la política
de borrado lógico: en stage hay dos `Expense` en `VOIDED` con su contrapartida, de neto cero.

**Sigue sin probarse** el borrado de una cuota impaga con su asiento, que es el tercer punto que esta
ficha pide para la secretaría.

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
| `student.dni` | [`students/[id]/actions.ts:138`](../src/app/students/[id]/actions.ts) | Reset de alumno (DNI como contraseña) |
| `lingua1234` | [`students/[id]/actions.ts:138`](../src/app/students/[id]/actions.ts) | Reset de alumno **sin DNI** |

Combinado con [SEC-01](#sec-01), `Modern2026` era acceso efectivo de administrador.

**`lingua1234` se encontró el 2026-08-24** midiendo la métrica 6 de [FEAT-11](#feat-11): es el
respaldo del reset de alumno cuando no hay DNI que usar, y faltaba en esta lista. Cae exactamente
sobre los alumnos con la ficha incompleta, que son los que menos mira nadie.

**Cambio.** Generar contraseña aleatoria por usuario y forzar cambio en el primer ingreso. Ya existe
el mecanismo de `StudentDataToken` — se puede reutilizar el patrón de token de un solo uso para el
alta de credenciales. Eliminar el DNI como contraseña.

**La mitad de forzar el cambio se separó en [SEC-11](#sec-11)**, y conviene hacerla primero: no
necesita correo, así que no espera a [FEAT-05](#feat-05) como sí lo hace la contraseña aleatoria —que
hay que poder entregarle a la persona de alguna forma.

### La forma del reemplazo (2026-08-25)

**Lo que lo destapa es el segundo instituto.** Mientras hay uno solo, "iguales para todos los
institutos" es una frase sin consecuencia. Con dos, `Modern2026` es una clave que sirve en los dos, y
la sabe cualquiera que haya dado de alta un tutor en cualquiera de ellos.

**La propuesta que se evaluó:** que el superadmin configure, **por instituto y por grupo**
—administradores, profesores, alumnos y tutores—, cuál es la contraseña por defecto de cada uno.

**Se compra la mitad y se descarta la otra.**

- **Separar por grupo, sí.** Que la clave de los alumnos no sea la de los administradores es una
  mejora real y barata. Hoy `Modern2026` es de tutores y, con [SEC-01](#sec-01), fue acceso efectivo
  de administrador.
- **Una clave compartida por grupo, no.** Achica el radio —de todos los institutos a un grupo de un
  instituto— pero no cambia la clase de problema: sigue siendo un secreto que conoce mucha gente. La
  secretaría lo dice en voz alta, viaja por mensaje, y alcanza con que una persona lo sepa para entrar
  a la cuenta de cualquiera que no la haya cambiado. La métrica 6 de [FEAT-11](#feat-11) va a decir
  que casi nadie la cambió.

**Y arrastra un problema que hoy no existe: la contraseña en claro en la base.** Para que la
configuración sirva, alguien tiene que poder leerla — el administrador necesita decirle al tutor cuál
es. Eso obliga a guardarla en texto plano (o cifrada de forma reversible, que para esto es casi lo
mismo) en una columna de `Institute`. Hoy las contraseñas están mal, pero están **en el código**: no
hay ninguna guardada en claro en la base. Esta funcionalidad la crea, y es un empeoramiento que no
salta a la vista porque viene envuelto en una mejora.

**La alternativa, que no es más cara: contraseña aleatoria por cuenta, mostrada una sola vez.**

El canal de entrega **ya existe y es humano**: el modal de alta de tutor
([`CreateGuardianModal.tsx`](../src/app/students/[id]/components/CreateGuardianModal.tsx)) hoy le
dice al administrador *"la contraseña inicial es Modern2026"* para que se la pase. Cambiar ese texto
por *"la contraseña es K7m-2pQx, copiala ahora"* es la misma pantalla y el mismo flujo. No hay
secreto compartido, no hay nada en claro en la base, no hay configuración nueva en el superadmin.

**Y no espera a [FEAT-05](#feat-05).** Lo que necesita correo es la **entrega automática**, no la
contraseña aleatoria. Quien crea la cuenta ya es quien la entrega.

**Dónde la configuración por instituto sí gana: los alumnos.** Ahí el argumento se da vuelta y
conviene no aplicar la misma regla a los cuatro grupos. Se crean de a doscientos en una importación,
son chicos de 6 a 8 años, muchos no tienen correo y el DNI ya es su identificador
([BUG-01](#bug-01), [FEAT-05](#feat-05)). Repartir doscientas claves aleatorias de a una no es
operable. Para ese grupo sirve un valor repartible —por instituto, o el DNI, que ya es lo que hace el
reset—, asumiendo que es un secreto flojo y compensándolo con [SEC-11](#sec-11).

**[SEC-11](#sec-11) es lo que más cambia la ecuación, y es el más barato de los tres.** Si el sistema
obliga a cambiar la contraseña en el primer ingreso, la ventana en la que el secreto compartido sirve
para algo se reduce a *entre que se crea la cuenta y la primera vez que entran*. Con eso, hasta una
clave repartible deja de ser un agujero permanente.

**Orden recomendado:** [SEC-11](#sec-11) primero; después aleatoria por cuenta para administradores,
profesores y tutores; y valor configurable por instituto sólo para alumnos, si hace falta.

#### Qué le hace esto a la métrica 6 de [FEAT-11](#feat-11)

Menos de lo que parece, y en un punto la mejora:

- **La columna `hasDefaultPassword` sobrevive a los tres escenarios.** Las diez escrituras la
  encienden en el momento de crear la cuenta y **sin comparar nada**, así que da igual si la
  contraseña es fija, por instituto o aleatoria.
- **Con contraseñas aleatorias, la pasada deja de poder mirar hacia atrás**: no hay catálogo contra el
  cual comparar. Pero la pasada existe **sólo** para las cuentas viejas, que sí tienen una de las
  ocho. Es una razón más para correrla antes de cambiar el esquema, y la única que queda.
- **La marca pasa a significar algo mejor**: *"todavía tiene la contraseña con la que se creó la
  cuenta"*. Eso es un hecho registrado en el momento del alta, no una inferencia — que es exactamente
  lo que la decisión del 2026-08-24 en [FEAT-11](#feat-11) pedía.
- **Si se elige el camino por instituto**, el costo cae sobre
  [`defaultPasswords.ts`](../src/lib/defaultPasswords.ts): el catálogo deja de ser una constante y
  pasa a depender del instituto, así que `isDefaultForUser` necesita saber cuál. Vuelve a tocar las
  diez escrituras. Es mecánico, pero hay que contarlo.

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

<a id="sec-11"></a>
## SEC-11 · Obligar a cambiar la contraseña por defecto en el primer ingreso · **P1** · 🗣️ Pedido del cliente

**Pedido (2026-08-24)**, saliendo de la métrica 6 de [FEAT-11](#feat-11).

**Hoy no hay nada que empuje a cambiarla.** Verificado el 2026-08-24: no existe `mustChangePassword`,
ni vencimiento, ni aviso, ni recuperación. Una cuenta creada con `Modern2026` puede seguir con
`Modern2026` dos años después, y el sistema no se entera ni le avisa a nadie. Eso convierte a cada
contraseña de [SEC-06](#sec-06) en un acceso permanente y compartido: la sabe quien la repartió, está
escrita en el código, y con [SEC-01](#sec-01) ya fue acceso efectivo de administrador.

**Es la mitad de [SEC-06](#sec-06) que se puede hacer ya, y ese es todo el punto de separarla.**
SEC-06 propone dos cosas: generar contraseñas aleatorias por usuario **y** forzar el cambio en el
primer ingreso. La primera necesita una forma de hacerle llegar la contraseña a la persona, o sea
correo, o sea [FEAT-05](#feat-05). **La segunda no necesita nada**: la persona ya tiene la contraseña
—se la dieron en mano—, y lo único que se agrega es que el sistema no la deje seguir hasta cambiarla.
Sin proveedor de correo, sin SPF ni DKIM, sin esperar a nada.

**Forma del cambio.**

- Una marca por cuenta que diga que la contraseña vigente es una de las que reparte el sistema. Es
  **la misma columna** que necesita la métrica 6 de [FEAT-11](#feat-11), y conviene hacerlas juntas:
  una la enciende y la otra la apaga.
- La encienden los seis lugares que escriben una contraseña por defecto, que ya saben cuál están
  escribiendo. La apaga el cambio de contraseña. **Ninguno necesita comparar hashes**: comparar sólo
  hace falta una vez, en la pasada que llena el pasado.
- Una compuerta después del login que mande a cambiarla y no deje pasar a otra pantalla.

**Dos trampas que conviene mirar antes de escribir la compuerta.**

1. **Los alumnos de 6 a 8 años.** El identificador obligatorio es el DNI y muchos no tienen correo
   ([BUG-01](#bug-01)). Una compuerta que los obligue a inventar y recordar una contraseña propia les
   corta el acceso al módulo de práctica, y no hay recuperación que los rescate hasta que exista
   [FEAT-05](#feat-05). **Conviene empezar por tutores y profesores**, que son los que tienen algo que
   perder, y decidir a los alumnos aparte.
2. **El reset del instituto vuelve a dejar la contraseña por defecto.** Si la compuerta no se
   reactiva con el reset, alcanza con pedir un restablecimiento para volver al estado de antes.

**Relacionado.** [SEC-06](#sec-06) es la otra mitad y va después. [FEAT-11](#feat-11) aporta el
número: cuántas cuentas siguen con la contraseña por defecto, partido en alumnos, tutores y
profesores, que es la barra de avance de este despliegue y termina en cero.

---

<a id="sec-12"></a>
## SEC-12 · El login del alumno no mira el estado: el preinscripto y el dado de baja entran igual · **P1**

**Encontrado el 2026-09-09**, analizando el correo de acuse de la preinscripción pública. No es parte
de ese trabajo: es de antes, y sale a la superficie porque ese correo tenía que decidir si copiaba el
DNI del aspirante.

**`authorize` no filtra por estado.** [`auth.ts:49`](../src/lib/auth.ts) busca al alumno por correo, o
por DNI más instituto, y compara la contraseña. En ningún momento mira `status`. Si la contraseña da,
emite la sesión con `roles: ["STUDENT"]` fijo. Un `PRE_INSCRIBED` y un `DELETED` entran igual que un
alumno activo.

**Y a los alumnos no los alcanza la red que sí tiene el personal.** La relectura periódica del JWT
vacía los roles de un `User` que dejó de estar activo ([`auth.ts:144`](../src/lib/auth.ts)), pero
está adentro de un `if (!isStudent)` ([`auth.ts:124`](../src/lib/auth.ts)) — el alumno nunca pasa por
ahí. Su `["STUDENT"]` queda escrito en el token y no se revisa nunca más, en los 30 días que dura.

**Lo que sí ataja hoy es `getAuthContext`**, que consulta la fila y devuelve `null` si el alumno no
está `ACTIVE` ([`authz.ts:70`](../src/lib/authz.ts)). Todo lo que pasa por el helper deniega bien, y
por eso esto no es un agujero de permisos financieros ni de administración.

**Pero 23 archivos leen la sesión directo, sin pasar por el helper.** Entre ellos
[`practice/page.tsx`](../src/app/practice/page.tsx), [`profile/page.tsx`](../src/app/profile/page.tsx)
y las tres pantallas de [`messages/`](../src/app/messages/page.tsx). O sea que el alumno dado de baja
entra, usa el módulo de práctica, ve su ficha y escribe mensajes.

**Por qué es P1 y no defensa en profundidad.** La política del sistema es el borrado lógico
([ARQ-05](#arq-05)): dar de baja **es** la única forma de sacar a alguien. Un borrado que no corta el
acceso no es un borrado — el instituto cree que lo sacó y la persona sigue adentro, sin que nada en la
pantalla se lo desmienta a ninguno de los dos.

**Los dos estados llegan acá por caminos distintos.**

- **`DELETED`** es el caso grave, porque es una decisión explícita del instituto que el sistema no
  ejecuta.
- **`PRE_INSCRIBED`** es un aspirante que el instituto todavía no aceptó ([BUG-08](#bug-08)): no es
  alumno y no tiene por qué tener sesión. Y ahí se suma que su contraseña es `"inscripcion123"`, fija
  y escrita en el repositorio ([SEC-06](#sec-06)), así que **con saber el DNI alcanza para entrar** —
  y el DNI no es un secreto. Es la mitad de este ítem que además es un acceso adivinable.

**Qué tiene que pasar en su lugar.** El filtro va en `authorize`, que es el único lugar donde se emite
una sesión. Tres cosas, y ninguna es cara:

1. **`status: "ACTIVE"` en la búsqueda del alumno**, con el mensaje de error de siempre. Si dijera
   *"tu cuenta está dada de baja"*, el formulario de login pasaría a contestar quién existe en el
   instituto y quién no.
2. **Mirar de paso la rama de `User`**, que tampoco filtra. Hoy el usuario no activo entra y queda sin
   roles, que es mucho más suave, pero es el mismo agujero y se arregla en la misma línea.
3. **Sacar el `if (!isStudent)` de la relectura**, o las sesiones ya emitidas sobreviven al arreglo
   hasta 30 días. Sin esto, el alumno que el instituto da de baja hoy con la sesión abierta sigue
   entrando mañana.

**Relacionado.** [SEC-06](#sec-06) (la contraseña fija de la preinscripción, que es lo que vuelve
adivinable el acceso del aspirante), [ARQ-05](#arq-05) (la política de borrado lógico que esto
incumple), [BUG-08](#bug-08) (qué es un preinscripto y por qué no es un alumno),
[SEC-09](#sec-09) (el `middleware.ts` que no existe y que sería la otra capa).

---

<a id="sec-13"></a>
## SEC-13 · El login del alumno no ata la búsqueda al instituto · **P2 · hoy inofensivo**

**De dónde sale.** Apareció probando [FEAT-06](#feat-06) en stage el 2026-09-14, al preguntarse por
qué un login por DNI podía fallar según la URL. No es de ese cambio: está desde antes.

**Lo que pasa.** El alumno entra por DNI, y la búsqueda es
[`auth.ts`](../src/lib/auth.ts): `{ dni: identifier, instituteId: instituteId }`. El
`instituteId` viene del formulario —[`LoginForm.tsx:45`](../src/app/login/LoginForm.tsx), que manda
`institute?.id ?? ""`— y `authorize` lo pasa por `|| undefined`. **En Prisma, un `undefined` no
filtra: desaparece de la consulta.** O sea que cuando el instituto no resuelve del host, la búsqueda
pasa de "este DNI en este instituto" a "este DNI en cualquier instituto", en silencio.

Y el host no siempre resuelve: [`tenant.ts`](../src/lib/tenant.ts) matchea por `customDomain` o por
subdominio, así que la URL larga de un deploy de Vercel
(`lingua-campus-stage-git-stage-….vercel.app`) **no cae en ninguna de las dos** y devuelve `null`.

**La rama por email es peor**, porque no tiene filtro de instituto ni siquiera escrito:
`findFirst({ where: { email: identifier } })`. Y `Student` permite el mismo correo en dos institutos
—la clave única es `@@unique([email, instituteId])`—, así que ahí el instituto **nunca** entró en la
cuenta.

**Por qué "hoy inofensivo" y no P1.** Hay un solo instituto, así que no hay otro adonde ir a parar.
Y aun con dos, no alcanza con adivinar: la contraseña tiene que coincidir. El caso real no es un
ataque sino una **confusión**: la misma persona dada de alta en dos institutos entrando por el
dominio de uno y cayendo en la cuenta del otro. Sube de prioridad el día que haya un segundo cliente
—y ese día conviene mirarlo junto con [ARQ-03](#arq-03), que es el otro lado del mismo problema.

**El arreglo.** Exigir el instituto en vez de dejarlo caer: si no resolvió, el login falla con un
error en vez de buscar más ancho. Es la misma forma que ya tiene el resto del sistema, donde el
aislamiento entre institutos se hace a mano ([ARQ-01](#arq-01)).

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

### Ya son tres los lugares que dejan el mes 0 afuera — 2026-08-19

El filtro por mes del reporte de deudores ([FEAT-15](#feat-15)) se suma a los dos agregados de arriba:
elegir junio deja fuera las matrículas y los derechos de examen, que en stage son **$40.000 de
$385.000**. No es un problema nuevo —es este, otra vez— y por eso la pantalla **entra sin filtro**:
«Todos los períodos» es el único lugar donde esa deuda se ve, y arrancar filtrado la haría invisible
para quien trabaje siempre por mes. Es un cuidado en la interfaz, no un arreglo; el arreglo es
`dueDate`. Sigue valiendo que **nada en el código bifurca sobre `month === 0`**.

### Evaluado y descartado — 2026-08-16 · mover el mes de la matrícula a febrero

Salió de contestar la segunda pregunta al cliente de T2 del lote del 15/08. **Propuesta del dueño:**
en vez del `0`, guardar las matrículas en el mes **2**, que es donde se cargó la enorme mayoría (209
de 212 en producción) y donde la plata entró de verdad. **Decisión: no. Se deja el `0`** — y el
motivo que lo cierra lo puso el mismo dueño, por lo contable.

**Por qué se descarta.** Con la constante en `2`, la matrícula del alumno que se inscriba en agosto
de 2027 se sumaría al **"Ingresos del Mes" de febrero de 2027** y al "Progreso de Cobro" de febrero:
un mes ya cerrado que sigue creciendo hacia atrás. Con el `0` eso no puede pasar nunca — ninguna
matrícula entra en el mes de nadie— y la plata se ve en el mes en que entró, por la caja. El `0` no
es una fecha mala: es la ausencia de fecha, que es lo honesto mientras no exista `dueDate`.

**El valor tiene que ser uniforme, sea cual sea.** No se puede poner febrero a las históricas y
dejar el `0` para las nuevas: la restricción única es `[enrollmentId, type, year, month]`, así que
una matrícula en mes 2 y otra en mes 0 de la misma inscripción y año **no chocan**, y vuelve el
duplicado que FIN-12 vino a tapar. O todas en 0, o todas en 2.

**Superficie real del cambio, si algún día se hace.** Es más chica de lo que parece: la constante
`ENROLLMENT_FEE_MONTH` en [`utils.ts:23`](../src/lib/utils.ts) más una migración que renormalice las
filas. El valor se usa en **cuatro** lugares, todos de escritura —
[`enrollments/actions.ts:114`](../src/app/enrollments/actions.ts) (vincular una anticipada) y `:126`
(emitir al inscribir), [`billingActions.ts:253`](../src/app/payments/billingActions.ts) (el generador
masivo) y [`payments/actions.ts:643`](../src/app/payments/actions.ts) (la anticipada)— y **nada en el
código bifurca sobre `month === 0`**.

**Qué no toca el mes, verificado el 16/08.** Es la parte que costó averiguar y conviene no volver a
averiguarla:

- **El recibo en PDF.** La fecha sale de `payment.date`
  ([`ReceiptDownloadButton.tsx:52`](../src/components/financials/ReceiptDownloadButton.tsx)), la del
  cobro real. El concepto sale de `formatFeeLabel`, que para `ENROLLMENT` devuelve `Matrícula <año>`
  e **ignora el mes**. El mes no entra nunca al PDF.
- **Los KPI por fecha de asiento:** "Cobrado en \<mes\>" con su desglose, "Rentabilidad (Neto)" y
  "Gastos Operativos". Filtran `Transaction` por fecha, así que la matrícula cobrada en agosto
  aparece en agosto.
- **"Deuda Total".** Las matrículas impagas **sí** cuentan: el filtro es `month <= mes actual` y el
  `0` siempre entra, computada como deuda histórica
  ([`payments/page.tsx:124`](../src/app/payments/page.tsx)).

**Qué sí quedó afuera con el `0`,** y es exactamente lo que este ítem arregla: **"Progreso de Cobro"**
([`payments/page.tsx:70`](../src/app/payments/page.tsx)) e **"Ingresos del Mes"** del dashboard
([`dashboard/page.tsx:568`](../src/app/dashboard/page.tsx)), que filtran `Fee.month = mes actual`. Son
la vista de devengado —"de lo que tenía que cobrar este mes, cuánto llevo"— y las matrículas no
figuran. Con `dueDate` esas dos consultas pasan a agrupar por vencimiento y el problema desaparece
sin tener que elegir un mes falso.

**Impacto medido en producción al 16/08**, para dimensionar la urgencia: julio perdió $46.000 sobre
$10.843.000 de cuotas (0,4 %) y agosto $55.000 sobre $10.964.000 (0,5 %). El bloque grande es
febrero —209 matrículas, $7.315.000— pero es la carga inicial. **No hay urgencia**; el instituto no
lo va a notar, y además todavía se están migrando datos.

---

<a id="fin-09"></a>
## FIN-09 · Deudores incluye alumnos dados de baja y cursos terminados · **P2** · 🗣️ Pedido del cliente

`getDebtorsReportAction` ([`billingActions.ts:188`](../src/app/payments/billingActions.ts)) no filtra
`student.status`. Los alumnos con `status: "DELETED"` aparecen en el reporte.

**Cambio.** Agregar `student: { status: "ACTIVE" }` al filtro. Confirmar antes si el negocio quiere
seguir viendo la deuda histórica de un alumno dado de baja — puede que sí.

### Decidido — 2026-08-16 · no se filtran: se agrega un filtro

**La duda que dejaba la ficha está contestada, y por la negativa: la deuda del alumno en la papelera
tiene que seguir viéndose.** Sacarla del reporte sería perder plata de vista.

El caso real que lo define: un alumno deja de asistir debiendo cuotas y se va del instituto. Esas
cuotas **quedan como deuda** y el alumno va a la papelera —con deuda y todo, y también si llegó a
pagar la matrícula y alguna cuota—. Si más adelante vuelve y se lo restaura, **la deuda tiene que
reaparecer**, y ahí el instituto decide si se la perdona o se la cobra.

**Entonces el cambio es al revés del que decía la ficha:** en vez de excluirlos, el reporte de
deudores lleva un **filtro por estado del alumno** —activos, en papelera, o todos—, con los activos
como vista por defecto. La deuda del que se fue deja de ensuciar el trabajo diario sin desaparecer.

**Perdonar la deuda todavía no existe como operación**, y es lo que hace falta cuando el alumno
vuelve. Está en [FIN-26](#fin-26), junto con las otras formas de conciliar una diferencia.

**Relacionado.** `deleteFeeAction` bloquea el borrado si `fee.payments.length > 0`
([`billingActions.ts:244`](../src/app/payments/billingActions.ts)), contando también los pagos
`VOIDED`. Una cuota cuyo único pago fue anulado no se puede borrar.

### 🗣️ Ampliado por el cliente — 2026-09-02 · activos, y en cursos activos

**Pedido.** Que los deudores que muestra la pantalla sean los de **alumnos activos en cursos
activos**.

**Confirma la decisión del 16/08 y le suma un eje.** Aquella dejó definido el filtro por estado del
alumno con los activos por defecto; el cliente pide eso mismo y además que el curso cuente.

**Hoy no se filtra ninguna de las dos cosas.** `getDebtorsReportAction`
([`billingActions.ts:350`](../src/app/payments/billingActions.ts)) filtra por instituto, estado de la
cuota, importe mayor a cero y período vencido — y nada más: ni `student.status`, ni
`enrollment.status`, ni `course.status`. Lo único que se sumó desde entonces es el filtro por mes de
[FEAT-15](#feat-15), que corre en el cliente sobre esa misma lista. **La decisión del 16/08 nunca se
implementó**, así que el pedido no cambia el rumbo: lo reafirma.

**Son tres ejes y no uno**, y conviene nombrarlos porque no dicen lo mismo:

1. **Alumno activo** — el de la decisión del 16/08: el que está en la papelera.
2. **Inscripción activa** — el alumno sigue en el instituto, pero dejó ese curso.
3. **Curso activo** — el curso terminó o se dio de baja, y el alumno sigue activo.

**La trampa está en el 3, y es plata.** Un curso que terminó en julio con cuotas impagas es deuda
real: si "curso activo" filtra de verdad, esa deuda desaparece de la pantalla el día que el curso se
cierra — que es justo cuando hay que ir a cobrarla. Vale la misma regla que ya se decidió para el
alumno de la papelera: **filtro con vista por defecto, no exclusión**. Los tres ejes en el mismo
control, con "activos en cursos activos" como vista que abre.

**Y una trampa técnica: las cuotas sueltas.** Una cuota con `enrollmentId` en `null` no tiene
inscripción y por lo tanto tampoco tiene curso ([FIN-22](#fin-22), [FIN-23](#fin-23)): cualquier
filtro que pase por `enrollment.course` la deja afuera **en silencio**. Son cuotas de alumnos reales
y con deuda real —las que quedaron de cuando desinscribir borraba la fila—, así que el filtro tiene
que contemplarlas aparte en vez de perderlas. La pantalla ya las distingue sin proponérselo: la
etiqueta de cada cuota lleva el curso entre paréntesis
([`debtors/page.tsx:62`](../src/app/payments/debtors/page.tsx)) y la suelta aparece sin él.

**Antes de codificar conviene el número**, que además dimensiona el pedido: de las filas que hoy
muestra deudores, cuántas son de alumnos en la papelera, cuántas de inscripciones cerradas, cuántas
de cursos no activos y cuántas sin inscripción. Si el grueso está en el eje 1, el trabajo es el que
ya estaba escrito el 16/08 y el resto es alcance.

**Y el eje 2 no se decide solo.** El mismo día se pidió que el listado del curso deje de mostrar a
los alumnos marcados como incompletos ([FEAT-18](#feat-18)). Las dos cosas juntas hacen desaparecer
al que dejó el curso debiendo, que es el caso que la decisión del 16/08 quería conservar: hay que
escribirlas mirando la otra.

---

<a id="fin-10"></a>
## FIN-10 · Formato de moneda con locale del servidor · **P3**

`surplus.toLocaleString()` en [`actions.ts:66`](../src/app/payments/actions.ts) se ejecuta en el
servidor (Vercel, `en-US`), y guarda `"2,000"` en lugar de `"2.000"` en la nota del recibo.

**Cambio.** `toLocaleString("es-AR")` explícito, o formatear en el cliente.

**Segundo caso (2026-08-10).** El mensaje de error de `voidPaymentAction`
([`actions.ts:576`](../src/app/payments/actions.ts)) usa el mismo `toLocaleString()` pelado, y es
texto que ve el operador. Arreglar los dos juntos.

### Resuelto a medias — 2026-08-17 · los dos casos de `actions.ts`, con helper (`b0d0ee7`)

`formatCurrency` en [`utils.ts`](../src/lib/utils.ts) es `toLocaleString("es-AR")` **sin el signo
`$`**, para que reemplace a `toLocaleString()` justo donde ya estaba y la barrida que falta sea
mecánica. Entró en los dos casos que nombra esta ficha —la nota del recibo y el mensaje de error— más
los dos importes de la columna financiera de la ficha del alumno, que quedaban pegados al bloque nuevo
de [FIN-11](#fin-11) y se veían `$15,000` arriba de `$15.000`.

**Y corrige el conteo del lote: no son 57 casos parejos.** El defecto aparece **sólo donde el string se
arma en el servidor**. `toLocaleString()` en un componente cliente usa el locale del navegador, así que
la tabla del libro mayor imprime `$30.000` bien mientras los KPI de la misma pantalla —que son server
components— imprimen `$30,000`. Eso explica los dos formatos conviviendo en `/payments`, que el lote
había anotado como misterio. Lo que falta barrer es el subconjunto que corre en el servidor, bastante
menor que 57, y **no se puede detectar mirando la pantalla en un navegador argentino**.

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

### Decidido — 2026-08-13 · la opción 1, y el acceso va en la ficha del alumno

**La tabla de `/payments` es la caja.** El filtro de $0 se queda. Y el acceso no va ahí por una razón
más fuerte que la elegancia del modelo: **nadie llega al problema por esa pantalla**. Los pagos mal
cargados los reportan los alumnos o los tutores, y el instituto mira la ficha del alumno; si hay
deuda, la página de deudores. A `/payments` no se entra a buscar un movimiento.

**Deudores es donde se nota, no donde se arregla.** Lista cuotas `PENDING` o `PARTIAL`
([`billingActions.ts:239`](../src/app/payments/billingActions.ts)), y una cuota mal pagada con saldo
queda `PAID`: no aparece. Sirve para detectar que algo no cierra, no para corregirlo.

**El trabajo real no es el botón, es que la ficha del alumno hoy no alcanza.** Trae sólo las
**últimas 5 cuotas** (`take: 5`) y de cada una **sólo el último pago válido** (`take: 1`,
[`students/[id]/page.tsx:125`](../src/app/students/[id]/page.tsx)). El pago con `method: "SALDO"` que
hay que anular puede no estar cargado en la página, así que el acceso no se puede colgar de lo que ya
se muestra.

**Forma propuesta.** Un bloque propio en la ficha —"Saldo a favor aplicado"— que liste los `Payment`
con `method: "SALDO"` y `status: "VALID"` del alumno, con la cuota a la que se aplicaron, el importe
y la fecha, y un botón de anular por fila que llame a `voidPaymentAction`, que **ya sabe revertirlo
bien** desde [FIN-02](#fin-02). Es una consulta aparte, no depende de los `take` de arriba, y le
contesta literalmente al mensaje de error de [FIN-01](#fin-01): *"anulá primero los pagos hechos con
ese saldo"* — el operador ve esa lista y nada más.

**De paso, mejorar el mensaje de error.** Hoy dice qué hacer pero no dónde: nombrar las cuotas que
retienen el saldo le ahorra la búsqueda.

**Lo que esta decisión deja sin resolver, a propósito.** Los asientos internos de $0 siguen sin
verse: la aplicación de saldo, el contra-asiento de anulación y —desde [SEC-03](#sec-03)— la cuota
borrada. Son tres sentidos distintos de `ADJUSTMENT` conviviendo en un tipo, registrados y
consultables pero invisibles en la interfaz. La opción 2 era la que los sacaba a la luz. Si algún día
hace falta auditar desde la pantalla, esto vuelve — y probablemente vuelva junto con
[ARQ-10](#arq-10), que es el mismo problema mirado desde otro lado.

### Reabierto y resuelto — 2026-08-17 · la fila también va en el libro mayor

**La decisión de arriba se tomó sobre una premisa falsa.** Reproducir el caso en stage la falsificó, y
el instituto la reabrió: *"tomé mal la decisión y recién ahora entiendo bien todo el problema"*.

**Cómo se falsificó.** Se armó el caso completo con datos reales de stage —dos hermanas, la madre paga
$30.000 de las dos, se carga todo sobre una, el excedente se aplica a la cuota siguiente— y se le pidió
al operador que hiciera lo que el mensaje de error le manda a hacer. **Anuló la fila equivocada:** no
encontró la aplicación de saldo en el libro mayor, vio otro movimiento de $15.000 y anuló ese. El
mensaje decía la verdad y aun así no alcanzaba.

De los tres argumentos que sostenían la opción 1, **dos no sobrevivieron al código**:

| Lo que decía la decisión | Lo verificado el 2026-08-17 |
|---|---|
| *"Listarla obligaría a filtrar por el **texto** de la descripción"* | **Falso.** Los tres ajustes en $0 se distinguen por estructura: la aplicación de saldo tiene `paymentId` → pago con `method: SALDO`; el contra-asiento de una anulación nace `VALID` con el original ya `VOIDED`; y la cuota borrada de [SEC-03](#sec-03) no tiene `paymentId` |
| *"Mete filas en $0 en la pantalla que se usa para conciliar caja"* | **Cierto sólo visualmente.** Ningún KPI suma `ADJUSTMENT`: *Cobrado* filtra `type === "PAYMENT"`, *Ventas* `MISC_INCOME`, los egresos `EXPENSE`/`PAYROLL`. Mostrar la fila no mueve un solo total |
| *"Nadie llega al problema por esa pantalla"* | **Es el que se cayó.** El operador **está parado en `/payments`** cuando aparece el muro, porque el mensaje de error sale ahí |

**Lo que se hizo, entonces, son dos accesos y no uno.**

1. **La fila en Movimientos Recientes**, que es donde está el operador cuando se traba. Se muestra como
   movimiento interno y no como plata: sin `+` ni `−`, en azul, con la etiqueta **SALDO APLICADO** y la
   aclaración *"no mueve caja"*. Los totales quedan idénticos, que es lo que la caja necesitaba
   proteger. El botón de anular se habilita sólo para ella; el resto de los `ADJUSTMENT` y `REFUND`
   sigue sin acciones.
2. **El bloque «Saldo a Favor Aplicado» en la ficha del alumno**, que es donde mira el instituto cuando
   el que reclama es el tutor. Con **consulta propia**: las cuotas de la ficha traen sólo las últimas 5
   y un pago por cuota, así que el pago a anular puede no estar entre ellas.

**Lo que no cambió:** la caja sigue siendo la caja. Lo que se corrigió es **qué muestra**, no qué suma.

**El contra-asiento de anular una aplicación no se dibuja**, a propósito: también vale $0, y la fila
original tachada con `ANULADO` ya dice que se anuló. Por eso anular un pago en efectivo deja dos filas
y anular una aplicación de saldo deja una sola.

**Verificado en stage el 2026-08-17, ejercitando el callejón entero por pantalla.** Sobre la alumna que
había quedado trabada: se anuló la aplicación de saldo desde la fila nueva —el pago quedó `VOIDED`, la
cuota volvió a `PENDING`, **el saldo volvió de $0 a $15.000** y el contra-asiento salió `ADJUSTMENT` de
**$0**, sin inventar una salida de caja— y recién ahí se pudo anular el pago original de $30.000, que
es lo que el viernes no tenía salida: quedó `VOIDED` con su `REFUND` de **−$30.000**, las dos cuotas en
`PENDING` y el saldo en $0. Neto cero y la secretaría en condiciones de cobrarle a cada hermana.

**Commits.** `b0d0ee7` (los dos accesos, el mensaje que nombra la cuota y [FIN-10](#fin-10)) ·
`677e59d` (dos defectos propios: el texto largo empujaba la columna Monto fuera de la pantalla, y la
fila anulada se señalaba a sí misma con *"Anula a:"*).

**Sigue sin resolverse, y ahora es sólo la mitad.** Los otros dos `ADJUSTMENT` en $0 —el contra-asiento
y la cuota borrada— siguen invisibles. La cuota borrada tiene su propia pantalla en
[FEAT-10](#feat-10); el contra-asiento no le importa a nadie hoy.

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

### El mes en producción no era arbitrario — 2026-08-13

**Las matrículas de este cliente estaban en febrero a propósito.** Se cargaron en febrero para que
los padres vieran una fecha coherente al descargar el recibo. La ficha asumía que el mes era ruido —
el mes de creación— y coincidió: se generaron en febrero, así que quedó `month = 2` sola. Pero
significaba algo.

**Los recibos no se rompieron.** Se verificó: el recibo nunca miró el mes de la cuota. El concepto
sale de `formatFeeLabel`, que para `ENROLLMENT` devuelve `Matrícula {año}` e ignora el mes, y la
fecha sale de `payment.date`, que la migración no tocó. Lo que ven los padres quedó igual.

**Lo que sí cambió es de puertas adentro**, y de forma retroactiva, porque la migración reescribió el
mes de *todas* las matrículas existentes:

- El **"Ingresos del Mes"** del dashboard y el **"Total a cobrar"** del período bajaron: ambos filtran
  por mes exacto y el 0 no cae en ninguno. Febrero 2026 es el mes afectado en este cliente.
- En la vista de los tutores las matrículas se ordenan al final del año en vez de entre las de
  febrero ([`guardian/payments/page.tsx`](../src/app/guardian/payments/page.tsx) ordena por `month`).
- La **caja no cambió**: sale del libro mayor por fecha de asiento. Y la **deuda tampoco**: usa
  `<=`, y 0 es menor que cualquier mes.

**Decisión: `ENROLLMENT_FEE_MONTH` se queda en 0.** Se evaluó ponerlo en 2 —la restricción única
funciona con cualquier valor fijo, lo único que importa es que todas compartan el mes— y se descartó:
codifica "la matrícula es de febrero" para todos los institutos y años. La corrección de los números
de febrero se hace a mano en la base.

> **Aviso para esa corrección a mano.** Los dos caminos que crean una matrícula escriben
> `month: ENROLLMENT_FEE_MONTH` ([`billingActions.ts:202`](../src/app/payments/billingActions.ts),
> [`actions.ts:643`](../src/app/payments/actions.ts)). Un `UPDATE` que ponga las viejas en 2 dejando
> la constante en 0 **reabre el bug que cerró [FIN-06](#fin-06)**: el índice único es
> `[enrollmentId, type, year, month]`, así que `(inscripción, ENROLLMENT, 2026, 2)` y
> `(inscripción, ENROLLMENT, 2026, 0)` son filas distintas para la base y la garantía de "una
> matrícula por inscripción y año" desaparece para esas inscripciones. Quedaría sólo el filtro en
> memoria, que es exactamente lo que FIN-06 dice que no alcanza.
>
> Las dos salidas seguras son **no tocar el mes** (y explicarle al cliente por qué cambiaron los
> números de febrero) o **cambiar la constante y las filas en la misma operación**. Tocar la base
> dejando el código como está es la única combinación que rompe.

**Relacionado.** [FIN-08](#fin-08) es la causa de fondo: mientras `Fee` no tenga `dueDate`, el mes es
lo único que hace de vencimiento y una cuota anual no tiene mes donde caer. Con `dueDate` la
matrícula vuelve al período que le corresponde sin forzar nada.

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

### Definido — 2026-08-16 · el freno va en el código, y tiene que explicarse

**No alcanza con que el filtro deje de emitir de más: el operador tiene que entender por qué.** Un
botón que se aprieta y no hace nada se lee como una falla del sistema, y el siguiente paso previsible
es volver a apretarlo o buscar otro camino para lograrlo.

Las dos mitades:

- **La limitante**, que es el filtro por año lectivo de arriba: pedir un año sin cursos no genera
  nada, y no hay forma de forzarlo desde la pantalla.
- **La explicación**, antes de apretar y no después: que el formulario diga cuántas inscripciones
  alcanza el año elegido. Con **0**, el botón se deshabilita y dice por qué —*"todavía no hay cursos
  que empiecen en 2027"*—, en vez de dejar apretar para después informar que no pasó nada.

Es el mismo criterio de [FIN-24](#fin-24): el sistema resuelve la consecuencia y la pantalla informa
el resultado, en lugar de advertir sobre un riesgo y dejar la decisión del lado del operador.

### Hecha — 2026-08-17 · `1922188` · T5 del lote del fin de semana

Las dos mitades, sin migración.

**La limitante.** La corrida toma sólo las inscripciones cuyo curso pertenece al año pedido. El
criterio salió de `createEnrollmentAction`, que ya lo tenía: el año es `course.startDate` leído en
**UTC** —las fechas se guardan a medianoche UTC y en hora local un curso del 1 de enero cae en
diciembre del año anterior—. Los cursos **sin fecha** entran únicamente cuando el año pedido es el de
calendario; si entraran siempre, pedir 2027 volvería a alcanzar a las inscripciones de 2026, que es
el defecto entero.

**La explicación.** El formulario pide el alcance del año elegido antes de apretar y lo muestra. Con
cero, el botón queda deshabilitado y dice por qué —*"Todavía no hay cursos que empiecen en 2027"*—.
Con más de cero, muestra a cuántas inscripciones alcanza y aclara que sólo se emite a las que
todavía no tienen la suya. El texto del `confirm()` dejó de decir "TODAS las inscripciones activas",
que era falso desde este cambio y engañoso desde antes.

**El conteo y la corrida comparten un solo `where`** (`yearlyEnrollmentTargetsWhere`), a propósito:
una pantalla que promete un número que la corrida no cumple es peor que no mostrar ninguno.

**Sin filas que arreglar.** La consulta 2 de T2 contra producción dio cero matrículas con año > 2026:
nadie llegó a correr el generador con el año próximo, así que la regresión estaba abierta pero no
había hecho daño.

### Verificado por pantalla — 2026-08-17 · contra la base de desarrollo

Ejercitado en `/payments` con el admin, sobre una base con **30 cursos, todos con inicio en marzo de
2026 y ninguno sin fecha**. Los números se predijeron contra la base **antes** de abrir el navegador,
que es lo que le da valor a la coincidencia:

| Año pedido | Lógica vieja | Predicho | En pantalla |
|---|---|---|---|
| 2025 | 145 inscripciones | 0 | — |
| **2026** | 145 inscripciones | 145 | **«Alcanza a 145 inscripciones de 2026»** |
| **2027** | 145 inscripciones | 0 | **Botón deshabilitado + el cartel ámbar** |

Con el código anterior, pedir **2027** habría emitido **145 matrículas 2027 atadas a las inscripciones
de 2026**: el doble cobro de esta ficha, con número.

- **2027**: el botón quedó deshabilitado con el monto ya cargado en $15.000, y el clic **no hizo nada**
  —sin diálogo, sin aviso— y la base siguió con **cero matrículas 2027**.
- **2026**: el `confirm()` nuevo salió con el alcance adentro, y la corrida emitió **143 sobre 145**.
  Las dos que faltan son las que ya estaban cubiertas: una matrícula vinculada y una suelta que el
  generador consume. Las 143 se borraron después y la base quedó con los mismos 3 ids que antes.

Que el número de la pantalla coincidiera con el medido de antemano es lo que prueba que el conteo y la
corrida siguen compartiendo el mismo `where`.

**Salió de acá [FIN-28](#fin-28)**: el año del curso lo da la fecha de inicio, que es un campo
opcional. Sin ella el curso no tiene año propio y este filtro no lo puede ubicar.

### Mejora a futuro, sin prioridad hoy — 2026-08-17 · los dos relojes del "año en curso"

Visto al escribir el filtro. **No está descartado: es una mejora válida que hoy no tiene prioridad.**
Queda anotado porque el próximo que lea el código lo va a encontrar, y para que sepa que ya se miró.

El desplegable del formulario arma los años con `now.getFullYear()` del **navegador** (Argentina,
UTC−3) y el filtro del servidor decide si el año pedido es el de calendario con
`new Date().getFullYear()` **del servidor** (Vercel, UTC). Entre las 21:00 del 31 de diciembre y la
medianoche los dos no coinciden: el navegador dice 2026 y el servidor 2027, así que en esa franja una
corrida de 2026 dejaría afuera a los cursos **sin fecha de inicio**.

**Por qué no entra hoy:** son tres horas al año, **el 31 de diciembre es feriado y nadie trabaja en esa
franja**. Y el arreglo no es local: `createEnrollmentAction`
([`enrollments/actions.ts:63`](../src/app/enrollments/actions.ts)) usa el mismo
`new Date().getFullYear()` para su año de recambio, así que tocar uno solo dejaría **dos definiciones
distintas de "año en curso"**, que es peor que la que hay.

**Cuando entre, cómo entra.** Los dos lugares juntos, con una sola definición de "año en curso" —el
reloj del servidor, que es el que decide— y el desplegable armándose desde ahí en vez de desde el
navegador. No es un cambio grande; lo que lo hace no-trivial es que son dos archivos que hoy no saben
uno del otro.

**Y puede que se resuelva solo.** Si entra [FIN-28](#fin-28) —fecha de inicio obligatoria—, deja de
haber cursos sin fecha, que son los únicos a los que este desfasaje afecta. El caso desaparece sin
tocar ninguno de los dos relojes. Conviene mirar eso antes de encarar este.

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

### Replanteado — 2026-08-16 · puede que no sea un defecto

**Antes de poner el índice hay que decidir si el caso está mal.** Dos matrículas anticipadas del
mismo alumno pueden ser una funcionalidad futura y no un accidente: el alumno que va a hacer **dos
cursos cortos** en el año —el producto que ya obligó a replantear [FIN-20](#fin-20)— necesita dos
señas, y hoy no hay forma de cobrárselas por adelantado.

Con eso, el índice de esta ficha **prohibiría algo que el instituto podría querer vender**. Sigue
existiendo el problema real —dos envíos simultáneos del mismo formulario crean dos filas iguales sin
que nadie lo haya pedido—, pero la solución ya no puede ser "una sola por alumno y año".

**Queda pendiente distinguir las dos cosas:** el duplicado accidental, que hay que evitar, de las dos
señas deliberadas, que habría que poder emitir a propósito y ver diferenciadas. Mientras no esté
resuelto, no poner el índice.

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

### Hecha la mitad — 2026-08-16 · `6889995`

El filtro `student: { status: "ACTIVE" }` entró junto con [FIN-22](#fin-22), que toca la misma
función. En producción no cambia nada hoy: no hay ninguna inscripción activa de un alumno dado de
baja —verificado el 15/08—, así que es una red, no una corrección.

**Queda abierta la otra mitad**, y por eso el ítem sigue sin tildar: acotar el mes al período lectivo
del curso. No entró porque necesita decidir **qué se espera de un curso sin fechas**, y sin esa
respuesta el filtro dejaría de generar cuotas de cursos que hoy sí las generan. Es una decisión de
negocio, no de código.

De paso, algo que quedó a la vista al mirar los datos y que pertenece a esta mitad: volver a generar
un mes pasado le crea la cuota a todo el que no la tenga. En producción, marzo tiene 175 cuotas sobre
206 inscripciones, así que regenerarlo emitiría 31 cuotas de marzo a alumnos que entraron después.
Es el mismo agujero del período lectivo, visto desde el otro lado.

### Definido — 2026-08-16 · regenerar un mes cerrado también se limita, y se explica

Mismo criterio que [FIN-14](#fin-14). El período lectivo del curso es la limitante de fondo —un
alumno que entró en julio no puede recibir una cuota de marzo—, pero hace falta además que la
pantalla lo diga **antes** de apretar:

- Cuántas cuotas va a emitir el mes elegido, y **a cuántos alumnos que entraron después** deja
  afuera. Hoy el operador aprieta a ciegas y se entera por el número final, cuando ya se emitieron.
- Que elegir un mes ya cerrado se distinga de la corrida normal del mes en curso, que es la operación
  de todos los días.

Sin período lectivo cargado no hay forma de saber cuándo empezó a cursar el alumno; con `enrolledAt`
se puede aproximar, pero la respuesta buena depende de la decisión pendiente sobre **qué se espera de
un curso sin fechas**.

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

### Resuelto — 2026-08-17 · `c463844`

`EXAM_FEE_MONTH = 0` en [`utils.ts`](../src/lib/utils.ts), al lado de `ENROLLMENT_FEE_MONTH`, y
`toggleExamRegistrationAction` ([`enrollments/actions.ts`](../src/app/enrollments/actions.ts)) la
usa en vez del mes del calendario. Comparte el valor con la matrícula y no hay ambigüedad: `type`
está dentro de la restricción, así que la matrícula y el examen de la misma inscripción y año
siguen siendo dos filas distintas. Migración `20260817130000_normalize_exam_fee_month`, nombrada
por encima de la de [FEAT-10](#feat-10), que era la otra migración del mismo fin de semana.

**Cero filas afectadas, y medido antes de escribir la migración:** no existe ninguna cuota `EXAM`
en producción ni en stage. El interruptor de examen no se usó todavía, así que el `DELETE` y el
`UPDATE` no tocan nada en ninguna de las dos bases. Es preventivo a propósito: después de la
primera cuota emitida deja de ser gratis.

**Un lugar más del que decía el enunciado.** Arriba dice que `formatFeeLabel` no muestra el mes, y
es cierto — pero el portal del tutor
([`guardian/payments/page.tsx`](../src/app/guardian/payments/page.tsx)) tiene **su propia** función
de etiqueta y era el único punto del sistema que imprimía el mes de una cuota de examen. Con el mes
fijo habría dicho «Examen Mes 0 2026» en la pantalla que ve la familia. Quedó como el resto:
«Derecho de Examen 2026».

**Lo que cambia en los números, y es lo mismo que ya pasó con las matrículas.** Las cuotas de
examen salen de las dos vistas de devengado que filtran por mes exacto —«Progreso de Cobro» en
[`payments/page.tsx`](../src/app/payments/page.tsx) e «Ingresos del Mes» del
[`dashboard`](../src/app/dashboard/page.tsx)— y **siguen contando enteras** en «Deuda Total» y en
el reporte de deudores, cuyo filtro es `month <= mes actual`, computadas como mora histórica. Nada
que vaya por fecha de asiento se mueve. Es el hueco que arregla de fondo [FIN-08](#fin-08) con
`dueDate`; el mapa completo de qué KPI mira cada cosa está en esa ficha.

**Verificado por pantalla el 2026-08-17** contra la base de desarrollo, con los números anotados
antes de abrir el navegador. Prender el interruptor sobre `sofia sanabria` emitió la cuota con
**mes 0** y apagarlo la borró por impaga; sobre `catalina gonzalez rossi`, cuya cuota está **paga**,
apagar **no** la borró y volver a prender **no la duplicó** —mismo id—. En deudores se lee «Derecho
de Examen 2026 (Adolescents+ M-J)», sin mes, bajo «Vencido (histórico)» y no bajo «Agosto», que es
exactamente lo previsto.

**Y la restricción se probó de las dos maneras**, con dos `INSERT` directos dentro de una
transacción revertida: con el mes fijo la base **rechaza** la segunda cuota de examen de la misma
inscripción y año (`P2002`); con un mes cualquiera —lo que escribía el código hasta acá— **la
aceptaba**. Ese era el hueco, y no había restricción que lo atajara.

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

### Decidido — 2026-08-13 · la regla es la simultaneidad, y va por configuración

**La pregunta de la ficha estaba mal planteada.** Preguntaba si un alumno puede cursar dos cursos,
como si fuera sí o no. La respuesta del instituto es más fina y cambia el arreglo:

- **No simultáneos.** Es un instituto de inglés: un alumno está en un curso por vez.
- **Pero sí dos en el mismo año**, uno después del otro, porque hay **cursos cortos para adultos**.

Por lo tanto **la restricción no puede ser por año, tiene que ser sobre la simultaneidad**: un alumno
con una inscripción `ACTIVE` no puede tener otra `ACTIVE`; cuando la primera termina, puede empezar
otra. La lectura fácil de "no puede hacer dos cursos" —una inscripción por alumno y año— habría roto
los cursos cortos, que son un producto que el instituto vende.

**Y no va escrita en el código.** El instituto siguiente puede ser de varios idiomas, donde cursar
inglés y portugués a la vez es normal. El corte es una configuración por instituto —un
`allowsConcurrentEnrollments` en `Institute`, en falso por defecto— que consulta
[`createEnrollmentAction`](../src/app/enrollments/actions.ts). Este cliente lo tiene apagado y el
error se vuelve imposible; el día que aparezca el otro, se prende sin tocar código.

**Alcance del cambio:**

1. El campo en `Institute` y su migración.
2. `createEnrollmentAction` rechaza la segunda inscripción activa cuando está apagado, con un mensaje
   que mande a cambiar de curso en vez de a inscribir de nuevo.
3. La interfaz, que hoy no distingue "mover" de "agregar". Con la bandera apagada alcanza con que el
   rechazo explique la diferencia; con la bandera prendida hay que preguntar cuál de las dos cosas se
   quiere hacer.
4. Limpiar los duplicados ya generados, con el cuidado de [FIN-06](#fin-06): sólo cuotas sin ningún
   pago.

**Confirmado de paso, y cierra una duda de [FIN-12](#fin-12):** el adulto que hace dos cursos cortos
en el mismo año tiene dos inscripciones y por lo tanto **paga dos matrículas**. Es intencional — la
matrícula es por curso. Si el instituto quiere bonificar la segunda, aplica un descuento al cobrar,
que es una decisión comercial y no una regla del sistema.

### Corregido — 2026-08-15 · el diagnóstico era otro, y la bandera no va

**Reemplaza a la decisión del 13/08 de arriba**, que queda como está para que se entienda de dónde
salió. Las dos cosas cambiaron: la causa y el arreglo.

**La causa no era esta.** La consulta de verificación que esta misma ficha pedía se corrió contra la
base de producción el 15/08, y dio que **ningún alumno tuvo nunca más de una inscripción**, de
cualquier estado. El índice de [FIN-06](#fin-06) sí está aplicado en esa base. Los duplicados que
reportó el cliente salieron de otro lado: el generador mensual no ve las cuotas con `enrollmentId` en
`null` y las vuelve a crear. Eso es [FIN-22](#fin-22), que se abrió con ese hallazgo y **es lo que
arregla el pedido del cliente**.

**Y la bandera `allowsConcurrentEnrollments` no se hace.** La decisión del 13/08 leyó de más lo que
dijo el instituto: que *este* instituto no va a tener un alumno en dos cursos a la vez, y que otro
podría. De ahí no se sigue que haga falta una configuración — alcanza con que **todos los institutos
puedan**, que es el caso general y el que el modelo ya soporta. Una columna para prohibir algo que
nadie pidió prohibir es lógica de más.

Con esto se caen los puntos 1, 2 y 3 del alcance: no hay campo en `Institute`, no hay migración y
`createEnrollmentAction` no rechaza nada. El punto 4 —limpiar los duplicados— **ya lo hizo el
instituto con un script contra la base**, y la consulta del 15/08 confirma que no queda ninguna cuota
mensual duplicada.

**Que el sistema no lo impida es deliberado.** El instituto sostiene que no va a tener alumnos
simultáneos; queda como acuerdo con ellos, no como regla del código. Es la misma línea que el resto
del modelo, donde los obligatorios del negocio son opcionales en el schema.

**Lo que queda abierto de esta ficha**, y no entró en el lote del 15/08: la interfaz sigue sin
distinguir **mover** de **agregar**, que es la rama que la propia ficha anticipaba para el caso de
"sí puede cursar dos". Con dos inscripciones activas permitidas, inscribir en el curso nuevo sin dar
de baja el viejo genera dos cuotas por mes — que ahora es el comportamiento correcto, pero puede no
ser el que el operador quiso. En producción no pasó nunca, así que no urge.

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

<a id="fin-22"></a>
## FIN-22 · El generador mensual no ve las cuotas sin inscripción y las duplica · **P1** · 🗣️ Pedido del cliente

**Es la causa real del reporte que abrió [FIN-20](#fin-20)**, y no es lo que esa ficha suponía. Salió
al correr la consulta de verificación contra la base de producción el 2026-08-15, dentro de T4 del
lote del fin de semana.

`generateMonthlyFeesAction` ([`billingActions.ts`](../src/app/payments/billingActions.ts)) averigua
qué cuotas ya existen así:

```ts
where: { instituteId, month, year, type: "MONTHLY", enrollmentId: { in: enrollments.map(e => e.id) } }
```

Una cuota con `enrollmentId` en `null` **no cae en ese `in`**. El generador no la ve, y crea otra del
mismo mes atada a la inscripción. Y la restricción única de [FIN-06](#fin-06) tampoco la ataja:
Postgres no considera iguales dos `NULL` en un índice único, así que `skipDuplicates` no tiene con
qué comparar. El resultado es una cuota duplicada por alumno y por mes, en cada corrida.

**Qué mostró la base de producción (2026-08-15).**

- **Cero** alumnos con más de una inscripción, de cualquier estado. El mecanismo que suponía FIN-20
  —dos inscripciones `ACTIVE`— no ocurrió nunca en esta base.
- **Ocho** alumnos con cuotas `MONTHLY` sueltas: seis sin ninguna inscripción, y **Aylen Zunda** y
  **Benjamin Rivero**, que son los dos casos reportados. A los dos los inscribieron en la app en
  agosto teniendo ya cargadas por script las cuotas de marzo a julio, sueltas.
- Las cuotas de agosto de los dos se crearon en la misma corrida masiva, el 10/08 a las 14:01.

Los duplicados **existieron** y se borraron a mano con un script contra la base; por eso la consulta
de hoy no los encuentra. Lo que sigue en pie es el mecanismo que los produjo.

**Sigue vivo.** Los seis alumnos sin inscripción tienen cuotas sueltas de los meses 3 a 8. El día que
los inscriban en la app, la siguiente corrida sobre cualquiera de esos meses les duplica la cuota
igual que a los otros dos.

**De dónde salen las cuotas sueltas — corregido el 2026-08-16.** La primera versión de esta ficha lo
atribuía a la carga inicial de datos por script. Es **una** de las fuentes, pero la importante es
otra y está en el código: **desinscribir a un alumno borra la fila de `Enrollment`**, y como la clave
foránea es `ON DELETE SET NULL`, todas sus cuotas quedan sueltas de golpe. Eso es
[FIN-23](#fin-23).

Con eso el caso reportado se reconstruye entero, y ya no hace falta suponer nada: al alumno lo sacan
del curso viejo —se le sueltan las cuotas, incluidas las de meses ya cobrados— y lo inscriben en el
nuevo; la siguiente corrida del generador no ve las sueltas y emite otra vez la del mes. Nunca
existieron dos inscripciones, que es lo que la consulta contra producción mostró y lo que hacía
incomprensible el reporte.

**Cambio.** Que la corrida traiga también las cuotas sueltas —`enrollmentId: null`, mismo período y
tipo— de los alumnos alcanzados, y que el alumno que tenga una **quede afuera de la generación**, con
su cuenta aparte en el resultado para que el operador lo vea.

**Y que no las vincule al pasar.** Es la decisión de fondo de esta ficha, y va en contra de lo que
parece más servicial:

- Con dos inscripciones activas legítimas —que desde la decisión del 2026-08-15 en
  [FIN-20](#fin-20) puede tener cualquier instituto— **no hay forma de saber de cuál de las dos es
  la cuota suelta**. Vincularla sería adivinar, y con plata cobrada adentro.
- Un generador masivo que reescribe el historial mientras corre es exactamente la forma del incidente
  del 13/08. El generador tiene que dejar de duplicar y avisar; **vincular es normalizar**, y eso se
  hace una vez, mirando las filas, fuera de una corrida masiva.

**No lleva migración.** El índice de FIN-06 se queda como está.

**Relacionado.** [FIN-20](#fin-20) (de donde salió, y que queda reducida a la interfaz de mover vs.
agregar), [FIN-16](#fin-16) (los otros huecos de la misma función), [FIN-06](#fin-06) (el patrón
"consultar y después crear", del que esto es otro caso), [FIN-18](#fin-18) (las matrículas sueltas,
que son el mismo desprendimiento del lado de la matrícula).

### Hecho — 2026-08-16 · `6889995`

La corrida trae también las cuotas sueltas del período y deja afuera a esos alumnos, devolviendo
`skipped` para que el botón de generar lo muestre en un aviso aparte. No las vincula.

**Verificado contra la base de producción** simulando la lógica nueva sobre los datos reales, antes y
después: volver a generar cualquier mes de marzo a julio creaba **2** cuotas duplicadas —Aylen Zunda
y Benjamin Rivero— y con el cambio crea **0**. Agosto y septiembre daban 0 en los dos casos.

**Y verificado en stage con el botón, sobre el código desplegado — 2026-08-16.** La consulta no puede
ejercitar la server action, así que se armó el caso a mano:

| Paso | Qué se hizo |
|---|---|
| Control | Generar Agosto 2026 con todo normal → *"Se generaron 0 cuotas"*, sin aviso |
| Preparación | A una de las 5 cuotas de agosto se le puso `enrollmentId = NULL` por SQL, que es lo que provoca hoy desinscribir a un alumno |
| Predicción | Medida antes de correr: el código **viejo** crearía **1** duplicada; el nuevo dejaría **1** alumno afuera |
| Resultado | **5** cuotas de agosto y **0** alumnos con duplicado — corriendo el generador **dos veces**. Con el código viejo habrían sido 6 y 1 |
| Aviso | El cartel amarillo *"1 alumno quedó afuera…"* aparece. Confirmado en pantalla |
| Restauración | La cuota volvió a su `enrollmentId` original. Stage quedó idéntico a antes: 2/6/6/6/5 cuotas por mes, 0 sueltas, 0 duplicados |

**De paso quedó a la vista algo que no es de esta ficha:** el `confirm()` pelado del botón de generar
bloquea el hilo de la página. Además de impedir que la confirmación explique nada, cuelga cualquier
automatización del navegador hasta que una persona lo acepta a mano.

**Queda pendiente y no es de esta ficha:** las cuotas sueltas siguen sueltas. Normalizarlas es
trabajo de datos, no de código — ver «Aparecido durante el lote» en
[`tareas/lote-finde-2026-08-15.md`](../tareas/lote-finde-2026-08-15.md).

---

<a id="fin-23"></a>
## FIN-23 · Desinscribir a un alumno le suelta todas las cuotas, incluidas las pagas · **P1**

**Es de dónde salen las cuotas sueltas de [FIN-22](#fin-22)**, y explica el caso que el instituto no
podía reconstruir: por qué aparecían duplicados sin que ningún alumno tuviera dos inscripciones.

[`removeStudentFromCourseAction`](../src/app/courses/actions.ts) —el botón de desinscribir del
listado del curso— **borra la fila de `Enrollment`**:

```ts
// Hard-delete: used for errors
await prisma.enrollment.delete({ where: { id: enrollmentId } });
```

Y la clave foránea de `Fee` es `ON DELETE SET NULL` — verificado el 2026-08-16 sobre la base de
producción, no sólo en el schema:

```
Fee_enrollmentId_fkey → SET NULL
Fee_studentId_fkey    → RESTRICT
```

**Al borrar la inscripción, todas sus cuotas quedan con `enrollmentId` en `null`.** Las impagas y las
pagas por igual, en silencio, sin aviso ni confirmación. Las cuotas sobreviven —eso lo garantiza el
`RESTRICT` de `studentId`— pero **pierden de qué curso eran**.

**Qué se pierde con la fila.** No es sólo el vínculo: la inscripción tiene `billingMode`,
`customMonthlyPrice`, `customEnrollmentPrice`, `customExamPrice`, `customFullCoursePrice` y
`takesExam`. Al alumno con beca o precio propio, desinscribirlo le borra la beca sin dejar rastro.

**Y después duplica.** Con las cuotas sueltas, el generador mensual las creaba de nuevo — eso es
[FIN-22](#fin-22), ya arreglado en `6889995`, así que **el duplicado ya no ocurre**. Lo que sigue
ocurriendo es el desprendimiento: mover un alumno de curso por desinscribir + inscribir le suelta el
historial, y desde FIN-22 además lo deja **afuera de la generación** hasta que alguien normalice sus
cuotas a mano. El síntoma cambió de "cuota duplicada" a "cuota que no se generó", que es mejor pero
no es correcto.

**Contradice la regla del proyecto**, que es **borrado lógico siempre**. Y el camino lógico ya
existe: `Enrollment.status` admite `ACTIVE`, `FINISHED` e `INCOMPLETE`, y
[`markEnrollmentIncompleteAction`](../src/app/courses/actions.ts) —en el mismo archivo, treinta
líneas más abajo— hace exactamente eso sin borrar nada. El `delete` quedó de cuando la acción era
para deshacer un error de carga, que es lo que dice su comentario; pero es el botón que tiene el
operador para sacar a un alumno de un curso, y lo usa para mover gente.

**Y no es sólo el `delete`: los dos caminos no compiten de igual a igual.** Verificado el 2026-08-16.
El permiso no es el problema —las dos acciones admiten `ADMIN` y `SECRETARY`, y la secretaria, que es
quien más mueve alumnos, ve las dos—. El problema es dónde están y cómo se ven:

| | «Cambiar curso» (el bueno) | «Eliminar inscripción» (el que rompe) |
|---|---|---|
| **Pantalla** | Ficha del alumno, tarjeta de la inscripción | Listado del curso, fila del alumno |
| **Aspecto** | Un ícono de lápiz de 14 px, **sin etiqueta** | Ícono de tacho rojo, **oculto hasta pasar el mouse** en escritorio |
| **Qué anuncia** | Sólo el `title="Cambiar de curso"` | `title="Eliminar inscripción (Error de carga)"` |
| **Confirmación** | Modal con curso actual y destino | "¿Eliminar? / Confirmar" en línea, **sin decir qué se lleva** |

Quien piensa "muevo a este alumno del curso x al z" abre **el curso**, que es donde está la lista de
alumnos — y ahí el único botón que saca a alguien es el que borra. El camino bueno está en otra
pantalla y no se anuncia. El resultado es el que se vio en producción.

**Lo barato de esto**, y conviene hacerlo aunque el `delete` se arregle: ponerle etiqueta al botón de
cambiar curso, para que el camino sano se encuentre. **Hecho el 2026-08-16**, y **verificado en
stage**: el botón se lee «✏️ Cambiar curso» debajo del badge de estado, en la tarjeta de la
inscripción, sin romper el ancho de la tarjeta.

**Lo que NO se hace: avisar en la confirmación de eliminar que las cuotas quedan sin curso.** Se
descartó a propósito. Un cartel que advierte sobre una consecuencia contable le traslada la decisión
al operador, y esa decisión no es suya: la secretaria saca a un alumno de un curso, no elige qué pasa
con la caja. Documentar el defecto no es arreglarlo. El criterio está escrito en [FIN-24](#fin-24), y
lo que corresponde acá es que el borrado deje de perder cosas — que es esta ficha.

**Y lo que lo cierra de verdad, para más adelante (pedido el 2026-08-16):** llevar el botón de
cambiar curso **también al listado del curso**, al lado del de eliminar. Es la pantalla donde el
operador ya está parado cuando piensa "muevo a este alumno", y hoy es la única de las dos que no le
ofrece el camino bueno. Con los dos botones juntos, la decisión se toma mirando las dos opciones en
vez de eligiendo la única que hay a mano. El modal
([`ChangeCourseModal`](../src/app/students/[id]/components/ChangeCourseModal.tsx)) ya es un componente
cliente autónomo: recibe `enrollmentId`, el curso actual y la lista de cursos, así que se monta ahí
sin tocar su lógica. Lo que hay que resolver es de dónde saca la lista de cursos disponibles esa
página, que hoy no la carga.

### Por qué la cuota no debería quedar suelta, y cuál de los tres caminos — 2026-08-16

Una cuota suelta no es sólo una cuota sin curso: es una cuota **sin dueño**. No sale en el listado del
curso, el recibo no puede nombrar de qué curso era, el generador la saltea desde [FIN-22](#fin-22)
—mejor que duplicarla, pero tampoco correcto— y si el alumno tenía precio propio, ese precio se fue
con la inscripción y no se puede reconstruir.

| | Qué hace | Costo |
|---|---|---|
| **A · No borrar la inscripción** | Se le pone un estado. La cuota sigue colgada de ella y la inscripción del curso | Chico: el camino ya existe |
| **B · Guardar el curso en la cuota** | Un `courseId` propio en `Fee` | Migración, backfill y un dato duplicado que puede contradecir a la inscripción |
| **C · Que la base no deje borrar** | La clave foránea pasa de `SET NULL` a `RESTRICT` | Migración chica, pero hay que reordenar el purgado |

**Va A, y B se descarta.** La inscripción **es** el vínculo con el curso: mientras exista, la cuota
sabe de qué curso es, a qué precio y con qué condiciones. Un `courseId` en `Fee` guarda dos veces el
mismo dato, y se contradicen solos en cuanto alguien cambie de curso —`changeStudentCourseAction`
reasigna el `courseId` de la inscripción y el de las cuotas viejas no—, con lo que habría que decidir
a cuál creerle. Es más deuda, no menos.

**A arrastra una decisión, y es la que muerde.** `Enrollment` tiene `@@unique([studentId, courseId])`.
Si la inscripción deja de borrarse, el día que el alumno **vuelva al mismo curso** el alta falla con
*"El estudiante ya se encuentra inscripto en este curso"*. Hoy no pasa porque el borrado la hace
desaparecer. La salida limpia: que [`createEnrollmentAction`](../src/app/enrollments/actions.ts)
**reactive** la inscripción cerrada en vez de crear otra. Es lo correcto además de lo cómodo —mismo
alumno y mismo curso es la misma inscripción— y así se conservan sus cuotas.

**C sirve como red mientras A se decide**, y encima codifica en la base la regla que se quería: sólo
se puede borrar una inscripción sin cuotas.

**Ojo con la purga, que hoy depende de este mismo defecto.**
[`hardDeleteStudentAction`](../src/app/students/[id]/actions.ts) borra las inscripciones **antes** que las
cuotas, y le funciona **porque** el `SET NULL` las desvincula sola en el camino. Con `RESTRICT` ese
paso empieza a fallar; el arreglo es mover una línea, borrar las cuotas primero. Esa función además
ya está rota por otros tres `RESTRICT` que no contempla — ver [ARQ-14](#arq-14), que salió de acá.

**Cambio.** Que desinscribir marque la inscripción en vez de borrarla. Hay que decidir dos cosas:

- **Qué estado le corresponde** a "lo saqué del curso": `INCOMPLETE` es el que más se le parece, pero
  hoy significa "no terminó el curso", que no es lo mismo que "lo movimos".
- **Qué pasa con el error de carga real** —inscribí al alumno equivocado hace cinco minutos, sin
  cuotas emitidas—, que es para lo que la acción se escribió. Puede seguir borrando si la inscripción
  no tiene ninguna cuota asociada, que es verificable en el momento, y que es exactamente lo que
  impone el camino **C**.

**El otro `delete` no es este problema.**
[`hardDeleteStudentAction`](../src/app/students/[id]/actions.ts) también borra inscripciones, pero borra
además las cuotas y al alumno, detrás de un permiso propio: es una purga deliberada, no un efecto
colateral.

### Hecho — 2026-08-16 · con un punto abierto

Entró el camino **A + C** completo:

- `Fee.enrollment` pasa a `onDelete: Restrict`, con su migración
  (`20260816120000_restrict_fee_enrollment_delete`). **No toca ninguna fila**: `RESTRICT` sólo actúa
  sobre borrados futuros, y las cuotas ya sueltas no lo violan.
- `removeStudentFromCourseAction` verifica antes y explica qué hacer en su lugar, para que el
  operador no se coma el error crudo de la base.
- `hardDeleteStudentAction` borra las cuotas **antes** que las inscripciones, que es lo que ese orden
  necesitaba para sobrevivir al cambio (ver [ARQ-14](#arq-14)).
- `createEnrollmentAction` **reactiva** la inscripción cerrada en lugar de fallar contra el índice
  único, así el alumno puede volver a un curso del que salió — y vuelve con sus cuotas, su precio
  propio y su modalidad. Si la inscripción reactivada ya tiene la matrícula del año, no se le emite
  otra.

**El punto abierto, que salió al medir el efecto sobre datos reales.** La regla quedó en "no se borra
si tiene **alguna** cuota", y eso **deja sin salida al error de carga**, que era el caso para el que
la acción existía:

- Las **206** inscripciones de producción tienen cuotas. Ninguna se puede borrar más. Correcto y
  buscado.
- Pero **27 de los 31 cursos activos** tienen matrícula mayor a cero, y `createEnrollmentAction`
  emite esa cuota **en el mismo acto de inscribir**. O sea que una inscripción cargada por error nace
  con una cuota y ya no se puede deshacer, ni un minuto después.

Dos salidas, y es decisión de negocio:

1. **Dejarlo así.** El error de carga se resuelve marcando la inscripción, no borrándola. Queda una
   inscripción cerrada y una matrícula impaga que hay que anular aparte. Es lo más conservador y no
   pierde nada, pero deja basura visible por cada error.
2. **Afinar la regla a "no se borra si tiene cuotas con pagos".** Si las cuotas están todas en cero,
   se borran junto con la inscripción en la misma transacción. Es lo que de verdad significa deshacer
   un error de carga —no hay plata de por medio— y el criterio es el mismo de [FIN-06](#fin-06) y
   `deleteFeeAction`. **Contra:** borra cuotas físicamente, y eso choca con la política de borrado
   lógico, salvo que se lo entienda como lo que es: deshacer, dentro de la misma operación, algo que
   el sistema acababa de crear solo.

**Recomendación: la 2**, y que el borrado deje su rastro por [FEAT-10](#feat-10) cuando esa pantalla
exista.

### Verificado en stage — 2026-08-16

La migración se aplicó sola con el despliegue, a las 20:13 UTC, **sin rollback y sin tocar ninguna
fila**: 7 alumnos, 6 inscripciones, 38 cuotas, 0 sueltas y 9 pagos, antes y después. Las tres claves
foráneas quedaron como se buscaba:

```
Fee_enrollmentId_fkey → ON DELETE RESTRICT   (era SET NULL)
Fee_studentId_fkey    → ON DELETE RESTRICT
Payment_feeId_fkey    → ON DELETE RESTRICT
```

**Probado el rechazo, que es la mitad importante.** Sobre una inscripción con 7 cuotas y 5 pagos, el
tacho del listado del curso **no borró nada**: la inscripción y sus cuotas siguen enteras. Es la
garantía que se buscaba — con plata cobrada de por medio, no hay camino que suelte ni borre.

**Y probado el borrado que sí procede.** Sobre una inscripción con 6 cuotas —5 mensuales y la
matrícula— y **ningún pago**, con el resultado anotado antes de apretar:

| | Daría el código viejo | Predicción del nuevo | Resultado |
|---|---|---|---|
| Inscripciones | 5 | 5 | **5** |
| Cuotas totales | 38 | 32 | **32** |
| **Cuotas sueltas** | **6** | **0** | **0** |
| Pagos | 9 | 9 | **9** |

La inscripción y sus seis cuotas se borraron juntas y **no quedó ninguna cuota huérfana**, que es
justamente lo que el `SET NULL` habría producido. Las dos mitades de la regla quedan verificadas
sobre el código desplegado: con pagos no se borra, sin pagos se borra entero y limpio.

### Resuelto el punto abierto — 2026-08-16 · va la opción 2

El corte pasa a ser **el pago, no la cuota**: se rechaza si alguna cuota tiene filas de `Payment`, y
si no, las cuotas se borran junto con la inscripción en una transacción. Se pregunta por filas de
`Payment` y no por `paidAmount` porque es el criterio de [FIN-06](#fin-06) y porque un pago anulado
deja la cuota en cero con la fila viva, que es justo lo que haría fallar a `Payment_feeId_fkey`.

**Y queda un riesgo abierto que conviene mirar de frente**, porque la regla es más ancha de lo que
sugiere el nombre "error de carga":

> Un alumno **deudor** —cinco cuotas impagas, ningún pago— cumple la condición. Apretar el tacho le
> borra la inscripción **y la deuda**, en silencio. No es lo que la acción quiere hacer, pero es lo
> que permite.

Marcar la inscripción como incompleta es lo correcto en ese caso y ya existe, pero **nada obliga a
elegirlo**. Tres formas de cerrarlo, para decidir más adelante:

- **Que deje rastro.** Cuando exista [FEAT-10](#feat-10), que este borrado escriba en `FeeDeletion`
  igual que `deleteFeeAction`, con motivo obligatorio. Es lo más barato y lo que más sirve: no
  impide, pero nada se pierde sin dejar quién y por qué. **Es la salida recomendada.**
- **Acotar por antigüedad o por tipo** —por ejemplo, permitir sólo si la inscripción no tiene cuotas
  `MONTHLY`—, con lo que el error de carga sigue funcionando y el deudor queda afuera. Más estrecho,
  pero la regla se vuelve difícil de explicar.
- **Restringir quién puede.** Hoy la acción admite `ADMIN` y `SECRETARY`. Borrar una deuda es una
  decisión de plata; se cruza con [SEC-03](#sec-03).

No se cerró ahora porque las tres dependen de decisiones que exceden esta ficha, y porque **el daño
grave ya está tapado**: nada con plata cobrada se puede borrar, ni por este camino ni por ninguno.

**Relacionado.** [FIN-22](#fin-22) (el duplicado que esto causaba), [FIN-20](#fin-20) (el diagnóstico
que buscaba dos inscripciones donde en realidad había una borrada), [ARQ-05](#arq-05) (interfaz para
restaurar lo borrado), [FIN-18](#fin-18) (matrículas sin curso, el mismo desprendimiento),
[FIN-24](#fin-24) (qué pasa con las cuotas al mover de curso, que es la decisión que el sistema
todavía no toma).

---

<a id="fin-24"></a>
## FIN-24 · Cambiar de curso no define qué pasa con las cuotas · **P2**

> **El criterio que abre esta ficha, y que vale más allá de ella (2026-08-16).** Las consecuencias
> contables las tiene que contemplar el sistema —permitiéndolas o limitándolas—, no quien aprieta el
> botón. La secretaria mueve alumnos; no decide sobre la caja del instituto. Cuando un texto de
> interfaz le pide a un operador que entienda una consecuencia contable, lo que falta no es el texto:
> **es la regla.** Un cartel que avisa de un efecto raro es un defecto documentado, no resuelto.

[`changeStudentCourseAction`](../src/app/students/[id]/actions.ts) hace exactamente una cosa:

```ts
await prisma.enrollment.update({ where: { id: enrollmentId }, data: { courseId: newCourseId } });
```

Está bien que no borre nada —es el camino sano, y el que [FIN-23](#fin-23) quiere que se use—, pero
**no decide nada sobre la plata**, y hay cuatro consecuencias que hoy ocurren solas:

1. **Las cuotas ya emitidas quedan con el precio del curso viejo.** Mover a alguien de un curso de
   $42.000 a uno de $65.000 a mitad de mes deja ese mes cobrado al precio viejo. Nadie eligió eso.
2. **Y encima pasan a mostrarse como del curso nuevo.** La cuota cuelga de la inscripción, y la
   inscripción ahora apunta al otro curso: una cuota de marzo del curso x aparece como del curso z.
   El importe no miente, pero la etiqueta sí.
3. **El precio propio se muda con el alumno.** `customMonthlyPrice` está en la inscripción, no en el
   curso: una beca acordada para el curso x se le aplica al z en silencio, sin que nadie la vuelva a
   aprobar.
4. **`billingMode` también.** Una inscripción `FULL_COURSE` —el alumno pagó el curso x entero por
   adelantado— movida al curso z sigue diciendo que está paga entera. Es el caso más caro de los
   cuatro y el menos visible.

**Ninguna de las cuatro tiene hoy una regla.** Son el resultado de que la acción actualiza un campo y
nada más.

**Qué hay que decidir**, y es de negocio:

- **Las cuotas pagas no se tocan nunca.** Eso no debería estar en discusión: son historia y hay un
  recibo emitido. Lo que sí falta es que la cuota recuerde de qué curso era, para que el punto 2 deje
  de pasar.
- **La cuota impaga del mes del movimiento**: ¿se reprecia al curso nuevo o se respeta la emitida? Las
  dos son defendibles. Respetar la emitida es más predecible —lo que se comunicó se cobra— y
  repreciarla es más exacto. **Recomendación: respetar la emitida, y que el cambio rija desde la
  generación siguiente**, que es la regla más fácil de explicarle a un padre.
- **El precio propio y el `billingMode`**: al mover de curso, el sistema tiene que **preguntar o
  limpiar**, no arrastrar. Arrastrar es la única de las tres opciones que nadie eligió.

**Recomendación de forma.** Que el modal de cambiar curso muestre el efecto ya resuelto —"las cuotas
emitidas se conservan; desde el mes que viene se cobra $X"— en vez de advertir sobre consecuencias.
La diferencia con un cartel de advertencia es que acá el sistema ya decidió y sólo informa.

### Decidido — 2026-08-16

**1 · La cuota emitida no se toca, venga del curso que venga.** El motivo cierra la discusión mejor
que cualquier argumento de diseño: **se factura en un país con inflación**, y las cuotas de un mismo
curso ya cambian de valor cada dos o tres meses. El precio de una cuota **nunca** fue "el precio
actual del curso": es el precio del momento en que se emitió. Repreciarla al mover de curso sería
inconsistente con cómo funcionan los precios desde siempre. Que el importe venga del curso anterior o
del actual no es el eje.

**2 · Que la cuota recuerde su curso — decidido, va.** Es la consecuencia directa de la
decisión 1: si la cuota es la foto de lo que se acordó, tiene que ser la foto **completa**. Hoy
congela el importe pero el curso se lo pide prestado a la inscripción, que es justamente el dato que
cambia; por eso una cuota de marzo del curso x pasa a mostrarse como del curso z.

> **Confirmado el 2026-08-16, y con la forma que se quiere ver:** al mover un alumno de curso, en su
> ficha tiene que poder verse que **la matrícula y las primeras cuotas son de un curso y las nuevas
> de otro**. No es sólo corregir una etiqueta equivocada: es que el historial cuente la trayectoria
> del alumno por el instituto, que es lo que alguien busca cuando abre esa ficha.
>
> El campo va en `Fee` y se escribe **al emitir**; los cambios de curso posteriores no lo tocan. La
> matrícula anticipada nace sin curso —todavía no se sabe cuál— y lo recibe cuando la inscripción la
> consume. **De paso cierra [FIN-19](#fin-19)**, que es el mismo problema visto desde las dos
> matrículas del mismo año que se ven idénticas.

> **Corrección a lo escrito en [FIN-23](#fin-23):** ahí se descartó guardar el curso en `Fee` por
> considerarlo un dato duplicado. Con la decisión 1 adelante, **no lo es**: son dos hechos distintos.
> La inscripción dice *dónde está el alumno hoy*; la cuota tiene que decir *qué se cobró y por qué
> curso*. Lo que sigue valiendo de FIN-23 es lo otro: la inscripción no se borra. Las dos cosas
> conviven.

**3 · La beca se muda con el alumno, y está bien — pero tiene que verse.** `customMonthlyPrice`
**no se muestra hoy en ninguna pantalla**: sólo se usa para calcular. Un alumno con beca es
indistinguible de uno sin beca para quien está frente a la pantalla, y depende de que alguien se
acuerde. Va badge → [FIN-25](#fin-25).

**4 · `FULL_COURSE` también se mantiene al mover, y también tiene que verse.** Que el alumno que pagó
el curso entero lo siga teniendo pago es lo correcto. El badge `💎 Pago Único 100%` existe, pero
**sólo en la ficha del alumno**: no está en el listado del curso, ni en deudores, ni en cobros →
[FIN-25](#fin-25).

Lo que queda abierto de este punto es la plata: mover a alguien de un curso pago entero a otro de
distinto precio deja una diferencia a favor o en contra, y hoy no hay dónde resolverla →
[FIN-26](#fin-26).

**Cómo apareció (2026-08-16).** Al etiquetar el botón de cambiar curso en [FIN-23](#fin-23), el
tooltip decía "conservando sus cuotas". Se sacó: le pedía a la secretaria que entendiera una
consecuencia contable que el sistema no contempla. La ficha es el otro lado de ese texto borrado.

**Relacionado.** [FIN-23](#fin-23) (de donde salió), [FIN-19](#fin-19) (dos matrículas del mismo año
se ven idénticas — el mismo problema de que la cuota no dice de qué curso es), [FIN-20](#fin-20) (que
ya anotaba el precio del curso viejo como "otra discusión": es esta), [FIN-25](#fin-25) y
[FIN-26](#fin-26), que salieron de sus decisiones.

---

<a id="fin-25"></a>
## FIN-25 · Las condiciones especiales de una inscripción no se ven · **P2**

Sale de las decisiones 3 y 4 de [FIN-24](#fin-24). Una inscripción puede tener condiciones que
cambian lo que el alumno paga, y **quien está frente a la pantalla no las ve**: dependen de que
alguien se acuerde.

| Condición | Dónde vive | Dónde se ve hoy |
|---|---|---|
| **Beca / precio propio** | `Enrollment.customMonthlyPrice` | **En ningún lado.** Verificado el 2026-08-16: sólo se lee en [`billingActions.ts`](../src/app/payments/billingActions.ts) para calcular. Ninguna pantalla la muestra |
| **Curso completo pago** | `Enrollment.billingMode = FULL_COURSE` | Sólo en la ficha del alumno (`💎 Pago Único 100%`, [`students/[id]/page.tsx`](../src/app/students/[id]/page.tsx)). No en el listado del curso, ni en deudores, ni en cobros |
| Matrícula propia, examen propio | `customEnrollmentPrice`, `customExamPrice` | En ningún lado |

**Por qué importa más desde [FIN-24](#fin-24).** Las dos condiciones **se mudan con el alumno** cuando
cambia de curso, y se decidió que está bien que así sea. Pero una condición que viaja sola y no se ve
es una condición que nadie vuelve a aprobar: la beca acordada para un curso termina aplicada a otro
sin que aparezca en ninguna pantalla.

**Cambio.** Un badge en la inscripción, con el mismo criterio que el de `FULL_COURSE` que ya existe, y
llevarlo a **las pantallas donde se decide sobre plata**: el listado del curso, el reporte de
deudores y el selector de cobro. En la beca, el badge tiene que decir el importe —"Beca $X"—, porque
saber que tiene beca sin saber de cuánto no alcanza para cobrar.

**Cuidado con quién lo ve.** El precio propio de un alumno es un dato sensible entre compañeros. El
badge va en las pantallas administrativas; conviene revisar que no se filtre a las del alumno o el
tutor antes de sumarlo en cualquier lado.

**Relacionado.** [FIN-24](#fin-24) (de donde sale), [FIN-13](#fin-13) (no se ve quién aplicó un
descuento ni por qué — el mismo hueco, del lado del cobro puntual).

---

<a id="fin-26"></a>
## FIN-26 · No hay dónde conciliar una diferencia de plata a favor del alumno · **P2**

**Pedido (2026-08-16).** Sale de la decisión 4 de [FIN-24](#fin-24), y el caso que lo dispara es
mover a un alumno que pagó el curso completo a otro curso de distinto precio: queda una diferencia, y
hoy **no hay ninguna pantalla donde resolverla**.

La diferencia puede ir para cualquiera de los dos lados y tiene tres salidas posibles, todas
legítimas y todas decisión del instituto:

1. **Devolverle la plata** al alumno.
2. **Que pague la diferencia** para completar el curso nuevo.
3. **Bonificársela**, aplicando la diferencia como descuento.

Ninguna de las tres existe hoy como operación. La única herramienta cercana es el saldo a favor, que
resuelve el caso 1 a medias —y cuya anulación recién se destraba con [FIN-11](#fin-11)—, pero no
contempla ni la bonificación ni el cobro de la diferencia como concepto propio.

**Qué hay que definir antes de programar nada.**

- **Dónde vive.** El pedido es que se haga **desde finanzas**, no desde la ficha del alumno: es una
  decisión de plata, y es del dueño. Encaja con el criterio de [FIN-24](#fin-24).
- **Qué deja escrito.** Las tres salidas mueven plata y por lo tanto tienen que dejar asiento en el
  libro mayor, con el motivo. Una bonificación sin motivo registrado es un descuento que nadie puede
  explicar después — es el mismo problema que anota [FIN-13](#fin-13).
- **Quién puede.** Bonificar y devolver plata no es lo mismo que cobrar. Se cruza con
  [SEC-03](#sec-03), que ya separó qué puede hacer una secretaria en lo financiero.

**No es sólo el cambio de curso.** La misma carencia aparece cada vez que hay que devolver o
compensar: un alumno que se va a mitad de año habiendo pagado de más, un cobro duplicado, una cuota
emitida de más. Conviene resolverlo como "conciliación", no como "el caso del cambio de curso".

**Un cuarto caso, agregado el 2026-08-16: perdonar la deuda del que vuelve.** El alumno que se fue
debiendo va a la papelera con su deuda; cuando vuelve y se lo restaura, la deuda reaparece y el
instituto **decide si se la perdona o se la cobra** (ver [FIN-09](#fin-09)). Perdonarla es la salida
3 de esta ficha —bonificar— aplicada a cuotas viejas, y hoy la única forma de hacerlo es borrar las
cuotas, que borra también el registro de que existieron. Es el caso que más claramente necesita que
la operación deje asiento y motivo.

**Relacionado.** [FIN-24](#fin-24) (de donde sale), [FIN-11](#fin-11) (anular una aplicación de saldo
a favor, la herramienta más cercana que existe), [FIN-13](#fin-13) (descuentos sin motivo
registrado), [SEC-03](#sec-03) (qué puede hacer la secretaría con la plata).

---

<a id="fin-27"></a>
## FIN-27 · «Usar Saldo» deja el formulario armado para un cobro que nadie hizo · **P1**

**Apareció el 2026-08-17**, reproduciendo [FIN-11](#fin-11) en stage. No lo encontró una auditoría del
código: lo pisó el operador, en el segundo intento de seguir un instructivo.

**El hueco.** Al aplicar un saldo a favor,
[`RegisterFeeForm.tsx`](../src/app/payments/components/RegisterFeeForm.tsx) hacía tres cosas mal
seguidas: mostraba **«Pago registrado exitosamente»** —reusa el estado `success` del cobro normal, así
que afirma algo que no pasó—, recargaba las cuotas pendientes y **auto-seleccionaba la siguiente**, con
el `useEffect` cargándole el importe adeudado. El formulario quedaba completo bajo un botón que dice
**«Confirmar Ingreso (+)»**.

**Un clic de más asienta un cobro en efectivo que nunca ocurrió.** Pasó exactamente así: diez segundos
después de aplicar el saldo había **$15.000 de ingreso inventado** sobre una cuota de junio que nadie
había pagado. Se detectó por la base, no por la pantalla — porque en la pantalla se ve como un cobro
normal y correcto.

**Es peor que el problema que estaba reproduciendo.** [FIN-11](#fin-11) traba al operador; esto le
fabrica plata en la caja, en silencio, y el error queda indistinguible de un cobro legítimo salvo que
alguien recuerde que ese alumno no pagó.

**Cambio.** Un estado propio para la aplicación de saldo, con su mensaje: qué importe y a qué cuota,
más la aclaración de que **no ingresó dinero** porque ese saldo ya se había cobrado, y dónde se anula.
Y soltar al alumno: el formulario queda vacío, no armado sobre otra cuota. De paso, el armado de la
etiqueta de una cuota salió a una función (`feeLabel`), que el `<select>` y el mensaje comparten.

**Commit.** `3b27801`.

**Verificado en stage el 2026-08-17.** El cartel es el nuevo y el formulario queda vacío.

### Pendiente — 2026-08-17 · el arreglo se pasó de seguro, y hay un punto medio

Al vaciar el formulario, pagar **lo que falta** de una cuota que el saldo cubrió sólo en parte obliga a
**volver a buscar al alumno**. Reportado por el instituto al ejercitar el caso mixto: aplicó $10.000 de
saldo a una cuota de $15.000 y tuvo que rehacer la búsqueda para cobrar los $5.000.

**El peligro nunca fue que el formulario quedara cargado: era que quedaba cargado sobre *otra* cuota**,
una que nadie pensaba pagar. Que quede cargado sobre **la misma cuota que se acaba de tocar**, con el
saldo restante, no tiene ese problema — se confirma exactamente lo que se está mirando.

**Cambio propuesto**, unas seis líneas: si el saldo **cubrió** la cuota, limpiar todo como ahora; si
quedó **parcial**, conservar alumno y cuota, con el importe en lo que falta y el cartel diciendo
*"aplicado $10.000, quedan $5.000"*. `getStudentPendingFeesAction` ya devuelve las `PARTIAL` y el
importe se recalcula solo como deuda menos pagado: lo único que falta es que `loadFees` pueda conservar
la cuota elegida en vez de saltar siempre a la primera.

**No entró el 17/08** por agenda: quedaban T5, T6 y T7 del lote.

**Relacionado.** [FIN-11](#fin-11) (de donde salió), [FIN-01](#fin-01) y [FIN-02](#fin-02) (la
mecánica del saldo a favor), [FEAT-14](#feat-14) (el carrito, que se lleva puesto todo este flujo).

---

<a id="fin-28"></a>
## FIN-28 · La fecha de inicio del curso es opcional, y sin ella el curso no tiene año · **P3 hoy · P1 en noviembre**

**Apareció el 2026-08-17**, al terminar [FIN-14](#fin-14). Salió de una pregunta del dueño y no de una
auditoría: *"¿el administrador puede en diciembre crear los cursos del año próximo, si los cursos que
cree en diciembre van a ser de este año?"*

**Puede**, y esa parte está bien: el año del curso lo da el campo **Fecha de Inicio** del alta
([`CourseForm.tsx:163`](../src/app/courses/new/CourseForm.tsx)), no el momento en que se crea. Un curso
dado de alta en diciembre de 2026 con fecha 09/03/2027 es un curso de 2027.

**El hueco es que ese campo es opcional.** Arranca vacío, no tiene `required`, no lo valida el
formulario ni la acción del servidor —[`courses/actions.ts:41`](../src/app/courses/actions.ts) hace
`startDateStr ? new Date(startDateStr) : null`—, y la etiqueta no dice "Opcional" como sí lo dice la de
Fecha de Fin. El mismo patrón está en el alta y en la edición
([`EditCourseModal.tsx:77`](../src/app/courses/components/EditCourseModal.tsx)).

**Dos consecuencias, y la segunda es la de fondo:**

1. **El caso puntual.** Si en diciembre se crean los cursos de 2027 sin fecha, la generación masiva de
   matrículas de 2027 no los alcanza y muestra *"Todavía no hay cursos que empiecen en 2027"* con los
   cursos recién creados en pantalla. El operador no tiene forma de entender por qué.
2. **Un curso sin fecha no tiene año propio: tiene el año de hoy.** Todo el sistema lo trata como del
   año en curso —[`createEnrollmentAction`](../src/app/enrollments/actions.ts) para el año lectivo de
   la matrícula, y el filtro de FIN-14—, así que **el 1 de enero cambia de año solo**, sin que nadie lo
   toque. Una matrícula emitida en diciembre y una emitida en enero para el mismo curso caen en años
   distintos.

**Cambio, decidido con el dueño el 2026-08-17: hacer obligatoria la fecha de inicio.** Es lo que le da
año propio al curso y cierra las dos consecuencias de raíz. La alternativa —dejarla opcional y que la
pantalla de matrículas avise cuántos cursos sin fecha está dejando afuera— tapa el síntoma y deja la
deriva de enero intacta.

Falta resolver, y es lo que lo hace más que una validación de una línea: **qué se hace con los cursos
sin fecha que ya existan** cuando la validación entre. Es la misma pregunta que frena la otra mitad de
[FIN-16](#fin-16) —qué se espera de un curso sin fechas— y conviene contestarla una sola vez.

### Prioridad — 2026-08-17 · hoy no, en noviembre sí

**Hoy no hay ni un caso** y no urge. Verificado contra la base de **producción** el 17/08: **31
cursos, los 31 con fecha de inicio cargada, todos de 2026**. (Uno no tiene fecha de fin, que es otro
campo y sí está marcado como opcional.) O sea que el instituto viene cargándola siempre, por costumbre,
sin que nada se lo exija.

**Sube a P1 en noviembre o diciembre de 2026**, que es cuando se arman los cursos del año siguiente y
la costumbre deja de alcanzar: es el único momento del año en que un curso se crea para un año que no
es el corriente, y es exactamente cuando olvidarse la fecha hace daño.

**Relacionado.** [FIN-14](#fin-14) (de donde salió, y quien consume el año del curso),
[FIN-16](#fin-16) (comparte la decisión sobre los cursos sin fechas), [FIN-18](#fin-18) (la inscripción
tampoco tiene año propio, que es el otro lado de esta carencia).

---

<a id="fin-29"></a>
## FIN-29 · Inscribir a un alumno no le emite la cuota del mes · **P1** · 🗣️ Pedido del cliente

**Reporte (2026-09-02).** Se da de alta un alumno nuevo, se lo inscribe a un curso, y no se le genera
la cuota.

**Confirmado en el código, y no es una falla: nunca existió.**
[`createEnrollmentAction`](../src/app/enrollments/actions.ts) emite **una sola** cuota al inscribir
—la **matrícula**, y sólo si el curso tiene `enrollmentPrice > 0`—. La cuota mensual no la emite nadie
ahí: las `MONTHLY` salen únicamente de `generateMonthlyFeesAction`, la corrida masiva del botón
*Generar Cuotas* de la pantalla de pagos
([`GenerateFeesButton.tsx:54`](../src/app/payments/components/GenerateFeesButton.tsx)).

**Entonces el alumno que entra después de la corrida del mes no tiene cuota de ese mes.** Y como no
tiene cuota, tampoco figura en deudores: **no hay ninguna pantalla donde el hueco se vea**. Es la
misma familia que los bugs de la tanda 3 —plata que no se factura y que nadie reclama, silenciosa
porque nadie la ve—, con el agravante de que acá no hay siquiera una fila mal calculada: no hay fila.

**Cuánto dura.** Hasta que alguien vuelva a generar ese mes. Repetir la corrida es seguro: el filtro
en memoria más el `skipDuplicates` apoyado en la restricción única de [FIN-06](#fin-06) hacen que le
cree la cuota al que faltaba y no toque al resto. Pero hay que saberlo, y nada lo sugiere: el que ya
generó el mes no tiene motivo para volver, y el aviso de [FIN-22](#fin-22) —*"N alumnos quedaron
afuera, revisalos antes de volver a generar"*— empuja para el otro lado.

**Y hay una decisión pendiente que puede tapar esa salida.** [FIN-16](#fin-16) tiene definido limitar
la regeneración de un mes ya cerrado. Si eso entra antes que esto, el hueco se queda sin arreglo por
pantalla. O van en el orden inverso, o el límite de FIN-16 nace con la excepción escrita.

**Lo que hay que decidir con el instituto**, y es de negocio:

- **¿El que entra el 20 paga el mes entero?** Es la única pregunta que importa. **Recomendación:
  emitir la cuota completa** y que la secretaría la ajuste cuando corresponda — editar el importe de
  una cuota sin pagos ya existe (`editFeeAmountAction`), y borrarla deja rastro con motivo desde
  [FEAT-10](#feat-10). Prorratear es una regla nueva, con redondeos y con la pregunta espejo de qué
  pasa con el mes de la baja, y no es lo que pidieron.
- **¿Y el que se inscribe el 28 de septiembre a un curso que arranca en octubre?** Ahí la cuota de
  septiembre no corresponde. El año del curso lo da `startDate` ([FIN-28](#fin-28)); el mes hay que
  mirarlo igual antes de emitir.

**Alcance.** Todo lo que la corrida masiva ya sabe hay que repetirlo en el alta, o compartirlo:

1. **`billingMode`.** Una inscripción `FULL_COURSE` no lleva cuota mensual. La corrida lo filtra; el
   alta no puede olvidarse, o le cobra dos veces al que pagó el curso entero.
2. **El precio** sale de `customMonthlyPrice` y, si no hay, del curso.
3. **La cuota suelta de [FIN-22](#fin-22).** Si el alumno ya tiene una `MONTHLY` de ese período con
   `enrollmentId` en `null`, no se le emite otra.
4. **Curso activo y del período lectivo**, para no emitir la cuota de septiembre de un curso que
   terminó en julio.

**Que las mismas cuatro reglas vivan en dos lugares es la deuda de fondo.** Conviene una función
única de emisión de cuota mensual: la corrida la llama en lote y el alta la llama para uno. Si se
copian, la próxima regla se va a agregar en uno solo de los dos — que es exactamente cómo nació
[FIN-16](#fin-16).

**Dos cosas más que quedan a la vista en la misma función**, y conviene resolverlas en el mismo pase:

- **La matrícula del alta ignora el precio propio de la inscripción.** Usa `course.enrollmentPrice`
  pelado, mientras que la corrida anual sí respeta `customEnrollmentPrice`
  ([`billingActions.ts:309`](../src/app/payments/billingActions.ts)). Una beca de matrícula cargada en
  la inscripción no se aplica si la matrícula la emite el alta.
- **Con la matrícula del curso en 0, el alta no emite absolutamente nada.** Y 0 es el valor con el que
  arranca el formulario de curso ([`CourseForm.tsx:50`](../src/app/courses/new/CourseForm.tsx)),
  coherente con que la corrida anual pida el monto a mano. Si el instituto carga los cursos así,
  inscribir a un alumno hoy no genera ni cuota ni matrícula — que es, textual, lo que reportaron.

**Verificar antes de codificar**, y son dos consultas cortas: cuántos cursos activos tienen
`enrollmentPrice` en 0, y qué inscripciones activas de alumnos activos con `billingMode = MONTHLY` no
tienen cuota `MONTHLY` del mes en curso. La segunda además devuelve la lista de lo que hay que emitir
a mano para no perder el mes.

**Relacionado.** [FIN-16](#fin-16) (el límite a regenerar, que hay que ordenar con esto),
[FIN-22](#fin-22) (las cuotas sueltas que la corrida saltea), [FIN-06](#fin-06) (la restricción que
hace repetible la corrida), [FIN-28](#fin-28) (el año del curso), [FIN-09](#fin-09) (la pantalla donde
esto tendría que haberse visto), [BUG-08](#bug-08) (el alta por preinscripción, el otro camino por el
que un alumno llega a un curso).

---

<a id="fin-30"></a>
## FIN-30 · Volver a un curso que se dejó no tiene camino propio ni deja rastro · **P2**

**Abierto el 2026-09-02**, saliendo de [FEAT-18](#feat-18): si el alumno marcado incompleto deja de
figurar en el listado del curso, hay que poder decir **cómo vuelve**.

**Volver ya funciona, y funciona bien: lo que no existe es el camino.**
`createEnrollmentAction` ([`enrollments/actions.ts:39`](../src/app/enrollments/actions.ts)) busca la
inscripción por `studentId_courseId` y, si la encuentra cerrada, **la reactiva** en lugar de crear
otra. Eso conserva lo que importa —las cuotas de antes, el precio propio, la modalidad de cobro, el
registro de examen— y no vuelve a emitir la matrícula del año si ya la tiene. Es la decisión de
[FIN-23](#fin-23) y sigue siendo la correcta.

**El problema es por dónde se llega.** El único acceso es *Inscribir Alumno* → `/enrollments/new`,
que es la misma pantalla con la que se inscribe a alguien por primera vez: hay que saber que
"inscribir" al que ya estuvo significa reincorporarlo. Y al terminar, el cartel dice *"¡Alumno
inscripto exitosamente!"* ([`EnrollmentForm.tsx:184`](../src/app/enrollments/new/EnrollmentForm.tsx));
nunca dice que reactivó la inscripción vieja con sus cuotas colgando.

Desde el listado del curso no hay nada: el botón de dar de baja sólo se dibuja para las inscripciones
`ACTIVE` ([`courses/[id]/page.tsx:432`](../src/app/courses/[id]/page.tsx)), así que la fila incompleta
es hoy una fila sin acciones. **Con [FEAT-18](#feat-18) adelante deja de estar siquiera a la vista**,
y el camino de vuelta pasa a depender de que alguien se acuerde de que existe.

**Recomendación: que la vuelta viva donde está el alumno.** Es lo que resuelve el desplegable que ya
recomienda FEAT-18 —*"1 dejó el curso"*—: adentro, un botón **Reincorporar** que llame a la misma
reactivación. Las dos fichas se sostienen entre sí: la lista se limpia y el camino de vuelta queda a
un clic del lugar donde se lo busca.

**Y hay dos vueltas distintas que hoy son el mismo clic:**

1. **El error.** Se marcó incompleto al alumno equivocado, hace treinta segundos. Corresponde
   deshacer, y que no quede nada.
2. **El regreso real.** Dejó en mayo y vuelve en agosto. No es un error: es un hueco de tres meses que
   **tiene que poder explicarse**, sobre todo del lado de las cuotas.

Hoy las dos hacen exactamente lo mismo, y ninguna deja registro.

**Lo que no se guarda en ningún lado, y es lo que hay que decidir:**

- **Cuándo dejó y cuándo volvió.** `Enrollment` no tiene `leftAt` ni historial de estados, y
  `enrolledAt` conserva la fecha original —la reactivación no la toca—, así que la ficha del alumno
  muestra el alta de la primera vez y nada más. La pantalla dice "Incompleto" pero no *desde cuándo*.
- **Por qué faltan las cuotas del hueco.** No se generan, porque el generador mensual sólo mira las
  inscripciones `ACTIVE` ([`billingActions.ts:40`](../src/app/payments/billingActions.ts)), y eso está
  bien. Lo que falta es que se entienda el faltante cuando alguien mire esa ficha el año que viene.
- **La deuda vieja vuelve con él, y eso ya está decidido.** [FIN-09](#fin-09) lo dejó escrito el
  16/08: *"si más adelante vuelve y se lo restaura, la deuda tiene que reaparecer, y ahí el instituto
  decide si se la perdona o se la cobra"*. Perdonarla sigue sin existir como operación
  ([FIN-26](#fin-26)). Al reincorporar conviene **mostrar el saldo que vuelve con el alumno**, en vez
  de que aparezca solo en deudores tres días después.

**Lo mínimo que cierra esto** son dos cosas: una fecha —cuándo se marcó incompleto— y que reincorporar
sea una acción con nombre propio. El historial completo de cambios de estado es [ARQ-10](#arq-10)
(auditoría de las acciones del panel): si esa ficha se hace, esto viene adentro, así que no conviene
inventar acá una tabla que después se duplique.

**Relacionado.** [FEAT-18](#feat-18) (de donde salió, y dónde va el botón), [FIN-23](#fin-23) (la
reactivación que hace posible todo esto), [FIN-24](#fin-24) (el otro movimiento del alumno entre
cursos), [FIN-09](#fin-09) y [FIN-26](#fin-26) (la deuda que vuelve con él), [ARQ-10](#arq-10).

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

### Verificado en stage — 2026-08-16

Con un usuario en `roles = {TEACHER, SECRETARY}` —la forma exacta de la usuaria del reporte, con
`TEACHER` primero, que es lo que hacía que `userRoles[0]` diera profesora—, en modo Secretaría:

- **Las ocho pantallas que la secretaria puede abrir muestran «Modo Secretaría»**, y Finanzas e
  Informes siguen en el menú: `/payments`, `/payments/debtors`, `/payments/tour`, `/enrollments/new`,
  `/students/new`, `/courses/new`, `/courses/classrooms`, `/courses/levels`.
- **Sin parpadeo al ir y volver**: `/payments` → `/courses` → `/payments` → `/students` →
  `/payments`, con navegación de cliente. El modo no cambia en ningún salto. Era exactamente lo que
  ella describía como "siempre se me cambia a profesora".
- **El selector cambia a Profesora y se mantiene**, y ahí Finanzas e Informes desaparecen, que es lo
  correcto. Sirve de comprobación de que sacarle el estado local al `Navbar` no rompió el cambio de
  rol: ahora depende del redirect de `switchRoleAction`.

**Dos de las diez pantallas que lista esta ficha no son verificables con una secretaria, y conviene
corregirlo acá:** `/payments/payroll` y `/guardians/[id]` son las dos `requireRole(["ADMIN"])` y la
redirigen al dashboard. La ficha las agrupa como "casi exactamente el trabajo de una secretaria" y en
esas dos no lo es. Que `/guardians/[id]` sea sólo de admin **es una pregunta abierta para el
instituto**, no un defecto de este ítem: la secretaría es quien trata con los tutores.

**Falta todavía la confirmación con la usuaria**, que es la única que cierra la ficha — los tres
intentos anteriores también pasaban las pruebas de quien los escribía.

### Resuelto — 2026-08-13 · pendiente de verificar en stage

**La prop pasó a ser obligatoria.** `currentActiveRole` era opcional y ese era el fondo del asunto:
olvidarla no costaba nada y once pantallas la olvidaron. Ahora es `currentActiveRole: string`, así
que **la próxima pantalla que se olvide no compila**. Es el único de los tres puntos que impide la
recaída; los otros dos arreglan lo que ya estaba roto.

Las 11 renderizaciones que faltaban ya la pasan: ocho salen de `auth.activeRole` —el mismo
`requireRole` que esas páginas ya llamaban—, dos de `payments/debtors` y `payments/tour` que **ya
calculaban `activeRole` con `getActiveRole` y no lo estaban usando**, y `students/new`, la única que
no tenía rol a mano, ahora lo pide con `getActiveRole`.

**El bloque de `document.cookie` se borró.** Con la prop obligatoria no hay caso en que haga falta
adivinar. De paso desaparecieron el `useState` y el `useEffect` que lo sostenían: el rol activo es
ahora una lectura directa de la prop, sin estado propio. El cambio de rol sigue funcionando porque
`switchRoleAction` escribe la cookie en el servidor y redirige, así que vuelve por una renderización
nueva con la prop ya actualizada — nunca dependió del estado del cliente.

**`userRoles[0]` no se reemplazó por nada.** El punto 3 del cambio pedía que el valor inicial saliera
de la prioridad de [`roles.ts`](../src/lib/roles.ts) en vez del primer elemento del array. Al hacer
la prop obligatoria el valor inicial dejó de existir: el servidor ya resolvió el rol con
`getActiveRole`, que es exactamente esa prioridad. Poner un segundo criterio en el cliente habría
sido una forma nueva de que los dos lados discrepen.

**Verificado:** `tsc --noEmit` limpio y build completo. **Falta la verificación con la usuaria**, que
es la única que cierra la ficha: entrar a `/payments` y a `/enrollments/new` y confirmar que el menú
sigue diciendo "Modo Secretaría" y que Finanzas e Informes no desaparecen.

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

**Verificado en producción el 2026-08-14.** La administradora del instituto abre los hilos que antes
le daban 404. Lo reportó ella, sin que se lo preguntáramos.

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

### Resuelto — 2026-09-13 en `b0303d8` · va la opción 3 · verificado en stage el 2026-09-14

Entró con [FEAT-06](#feat-06), que abrió el canal de las familias y convirtió este contador en la
herramienta de supervisión de la administración: era el momento.

**El contador cuenta sólo los hilos donde la persona participa.** Los hilos del instituto siguen
todos visibles en la bandeja del admin; lo que dejan de hacer es inflar el badge. Se sumó una regla
que no estaba en ninguna de las tres opciones y que hacía falta igual: **los mensajes propios no
cuentan como sin leer**, porque el que acaba de escribir ya sabe lo que escribió.

**Y dejó de reusar la bandeja.** `getUnreadThreadCount` hacía `getThreadsForUser()` y contaba en
memoria, o sea que cada vuelta del sobre levantaba todos los hilos con todos sus participantes —para
un admin, el instituto entero, una vez por minuto y por pestaña abierta. Ahora es un `COUNT` en SQL
sobre `ThreadParticipant`.

**Medido en producción antes de tocar nada:** la administradora tenía el badge en **27** —todos los
hilos del instituto— y participa de 4. Con la consulta nueva da **0**, que es lo correcto: de esos 4,
en ninguno hay algo sin leer que no haya escrito ella. La misma consulta sobre el resto del padrón
devuelve números distintos de cero (alumnos con 2 y 3 sin leer), así que no está apagada de más.

**Verificado en pantalla en stage el 2026-09-14:** la administradora ve los 15 hilos del instituto
con el badge en 0, y **abrir un hilo del que no participa no le mueve el contador**. Ver el detalle
en [FEAT-06](#feat-06).

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

### Verificado en stage — 2026-08-16 · con 25 alumnos

**El curso más numeroso de stage tenía 5 alumnos, así que no servía**: el defecto era de cantidad de
sentencias y con 5 no se acerca al tope. Se crearon 20 alumnos de prueba por SQL —sin pasar por
`createEnrollmentAction`, así que sin cuotas— hasta llegar a **25 inscriptos activos**, que es el
curso más grande del cliente. Al terminar se borraron los tres niveles (asistencias, inscripciones,
alumnos) y stage quedó como estaba: 7 alumnos, 5 inscriptos, 0 sobrantes.

Sobre la clase del 27/08, por pantalla y contra el código desplegado, recargando la página entre cada
paso para leer del servidor y no del estado del formulario:

| | Qué se hizo | Resultado |
|---|---|---|
| **Alta** | Los 25 marcados | 25 filas |
| **Regrabado 1** | 3 estados cambiados + una nota nueva | Persistió. Siguen 25 filas |
| **Regrabado 2** | Esa nota vaciada | La nota quedó en `null`. Siguen 25 filas |

**La prueba de que fueron las dos sentencias masivas está en las marcas de tiempo**, y es más directa
de lo que se esperaba: las 25 filas comparten `createdAt` **idéntico al milisegundo** (22:05:55.320),
porque salieron de un solo `INSERT`, y comparten `updatedAt` idéntico (22:18:22.493), porque el
regrabado fue un solo `UPDATE` con `NOW()`. Con el bucle viejo —o incluso con un `upsert` por
alumno— las marcas diferirían fila por fila. De paso descarta el borrar-y-recrear: el `createdAt` del
alta sobrevivió a los dos regrabados.

**Las notas vacías quedan en `null`, no en cadena vacía:** 25 filas, 25 `null`, 0 `''`.

**Un detalle útil para quien verifique esta pantalla:** el formulario **no** arranca con todos en
Presente. Un alumno sin registro previo queda en `status: null`, sin ningún botón encendido
([`AttendanceForm.tsx:42`](../src/app/courses/[id]/lessons/[lessonId]/attendance/AttendanceForm.tsx)).
Por eso los estados marcados al abrir la página son datos guardados y no un valor por defecto. El
comentario de la línea 33 dice lo contrario y quedó viejo.

**Sigue sin probarse el escáner de QR en paralelo** sobre la misma clase, que es el otro escenario
que pedía esta ficha.

**De acá salió [FEAT-13](#feat-13)**, la idea de que cada marca escriba sola.

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

**Al 2026-08-24 no hay nada esperando adelante de esto.** Se evaluó si la métrica 6 de
[FEAT-11](#feat-11) obligaba a correr algo antes —la lógica era que este ítem hace que la gente
cambie contraseñas en masa y borre la evidencia de quién nunca entró— y **la dependencia se cayó** al
redefinir esa métrica: mide contraseñas por defecto, no ingresos, y tiene que bajar cuando alguien
cambia la suya. También conviene mirar [SEC-11](#sec-11), que resuelve la parte del riesgo que no
necesita correo y por eso no espera a este ítem.

**Y la pregunta de "quién nunca pudo entrar" ya tiene quien la conteste**, aunque sólo hacia
adelante: el registro de actividad de [FEAT-11](#feat-11), desplegado el 2026-08-23. Cuando este ítem
salga, va a haber historia real para saber a quién le sirvió.

### Partida en dos entregas (2026-08-26)

**Por decisión del cliente**, y por urgencia: *"la prioridad hoy son los tutores que entran cada tanto
a la plataforma y para cuando quieren volver a ingresar, se olvidaron el pass"*. Los alumnos **no se
caen del alcance, se corren**: la parte 2 es una entrega pendiente de este mismo ítem, no una idea.

Lo que hace barata la partición es que la parte 1 no toca nada que la parte 2 tenga que rehacer. Tres
decisiones cuestan lo mismo hoy y evitan la reescritura:

- El token guarda `subjectType` + `subjectId` y no un `userId` con relación. En la parte 1 esa columna
  siempre dice `"USER"` y parece de más; es la única de las tres que después sería una migración.
- El destinatario del correo es un dato aparte de la cuenta que se restablece. Hoy son siempre el
  mismo; con los alumnos el correo le llega al tutor.
- Resolver el identificador es un paso propio que devuelve candidatos y **se niega si hay más de uno**.

### Hecha · parte 1: las cuentas con correo propio (2026-08-27)

Commit `96a9193`. Cubre todo lo que vive en `User` — tutores, docentes y administración.

**Las tres trampas de arriba se resolvieron así:**

1. **Los alumnos sin correo** quedan para la parte 2. La pantalla no los deja esperando: ver abajo.
2. **El correo no identifica a una persona sola** — pero para `User` sí, porque `email` es único
   global. **La parte 1 no necesitó arreglar [SEC-05](#sec-05)**, y la regla del corte por más de un
   candidato es lo que va a sostener eso cuando entren los alumnos, cuyo correo y cuyo DNI son únicos
   sólo por instituto.
3. **El enlace lleva el instituto** porque sale de su ficha —`customDomain`, o el subdominio— y no del
   host del pedido: `instituteBaseUrl` en [`tenant.ts`](../src/lib/tenant.ts). Además cierra un agujero
   que no estaba anotado: nadie puede hacer que un correo nuestro apunte a otro lado mandando un
   `Host` cualquiera. Y como stage y producción son dos bases, cada una apunta a su entorno sin
   ninguna variable de entorno.

**Seis cosas que aparecieron al hacerlo y no estaban en la ficha:**

- **El mensaje neutro deja a los chicos en silencio.** Un alumno que escribe su DNI recibe "si está
  registrado, te llega un correo" y espera un mail que no existe. La pantalla lo distingue por la
  forma de lo tipeado —un DNI no tiene arroba—, que no consulta ni revela nada, y le dice que se lo
  pida al instituto.
- **El remitente es un dato del instituto y no una constante** (`Institute.senderEmail`, con caída al
  de la plataforma). Sale de una decisión del 2026-08-26: **un cliente premium tiene su marca y no
  corresponde que aparezca "Lingua Campus"**. Con el dato en la ficha, ese cambio es cargar un campo.
- **`Institute.email` no sirve de remitente.** Es el contacto de la ficha y nadie verificó que su
  dominio nos autorice a mandar en su nombre: en el `from` es spam, o rechazo si el dominio tiene
  DMARC. Sí es lo correcto como dirección de respuesta, y ahí se usa.
- **El seguimiento de clics de SendGrid hay que apagarlo.** Reescribe los enlaces para que pasen por
  un dominio suyo, así que el botón dejaría de apuntar al instituto. En un correo de recuperación eso
  se parece a un phishing.
- **El límite se cuenta sobre la propia tabla de tokens**, no con el mecanismo de
  [`AiUsage`](../prisma/schema.prisma) que proponía la ficha: cada pedido ya deja una fila con su
  fecha, así que no hace falta un contador aparte. Y se cuenta por cuenta y **no por IP**: guardar la
  IP de cualquiera que pase por la pantalla es un dato personal que el sistema no guarda en ningún
  lado, y de las direcciones que no existen no sale correo ni queda fila, así que no hay nada que
  inundar.
- **El token se marca antes de tocar la contraseña**, con un `updateMany` que exige que siguiera sin
  usar. Comprobar y después escribir deja una ventana en la que dos clics simultáneos pasan los dos.

También: **SHA-256 y no bcrypt** para el hash del token —son 32 bytes al azar, no hay diccionario que
los adivine, y hace falta que el hash sea determinístico para buscar por índice—, y la invalidación de
tokens pendientes quedó enganchada en el cambio desde el perfil y en los resets de profesor y de
tutor. La contraseña nueva recalcula `hasDefaultPassword`, así que la métrica 6 de
[FEAT-11](#feat-11) sigue diciendo la verdad.

**Verificado corriendo contra la base local**, no leído: el correo sale con el nombre del instituto;
el enlace apuntó al dominio del instituto aunque el pedido se hizo desde `localhost`; la pantalla del
enlace nombra la cuenta; contraseñas que no coinciden no queman el token; después del cambio la nueva
sirve y la anterior no; el enlace vuelto a abrir dice que ya se usó; un pedido nuevo invalida el
anterior; y al cuarto pedido en la ventana no salió correo y la pantalla dijo exactamente lo mismo.

**Lo que sigue pendiente y no es de programación**: crear la cuenta de SendGrid, autenticar
`mail.<dominio del cliente>` —el subdominio y no la raíz, que es un pedido que el cliente puede
aprobar sin miedo a romperse el correo que ya tiene— y pasarle los tres CNAME a quien le administre el
DNS. Hasta entonces `EMAIL_PROVIDER=console` deja el flujo entero probable sin mandar nada.

**Y el canal queda montado para los otros tres casos**: [FEAT-12](#feat-12), [SEC-06](#sec-06) y el
formulario del landing pasan a ser una plantilla y una llamada.

### Hecha · parte 2: los alumnos (2026-08-30)

Commits `17d06bc` y `0c6a94c`. El alumno pide con su DNI o con su correo; si tiene dirección propia el
enlace le llega a él, y si no, **le llega a su tutor**.

**Los tutores se juntan de las dos fuentes que tiene el sistema** —las cuentas vinculadas por
`GuardianStudentLink` y los correos sueltos de la ficha—, y se descartan los repetidos. Ninguna de las
dos está garantizada: hay fichas con el correo del padre cargado a mano y sin cuenta creada, y cuentas
de tutor creadas después sin que nadie volviera a tocar la ficha. Si hay dos tutores salen dos correos
con **un solo enlace**, que gasta el primero que lo use.

**El instituto del host ahora achica la búsqueda, pero sólo la de alumnos**, que son los que tienen
correo y DNI únicos por instituto. La de `User` sigue abierta, que es lo que mantiene a
[SEC-05](#sec-05) afuera de esto. Y el corte por más de un candidato sigue siendo la red: con dos
institutos, el mismo chico anotado en los dos no recibe nada en vez de recibir el enlace equivocado.

**Un error que apareció armando el caso de prueba**, y que no se habría visto sin datos reales: la
plantilla decidía si el correo era para el dueño de la contraseña **comparando nombres**. El tutor
cargado en la ficha puede tener el correo sin el nombre al lado —es lo más común—, y sin nombre la
comparación daba "es la misma persona": al tutor le llegaba un *"restablecé tu contraseña"* por una
clave que no era suya, saludándolo por el nombre de su hijo. Ahora el dato viaja explícito desde donde
se sabe hasta la plantilla.

**El número que hay que mirar antes de festejar esto.** En la base de desarrollo, **276 de 284 alumnos
activos no tienen correo propio ni ningún tutor cargado**: para ellos la recuperación existe y no
alcanza a nadie. Todos tienen DNI, así que el problema no es el identificador — es que la ficha está
vacía del lado del contacto. **Eso no lo puede resolver el sistema**: es carga de datos del instituto,
y conviene medirlo en producción y decirle el número al cliente antes de anunciarle la función. Sin
eso, esta entrega le sirve a ocho alumnos.

**Verificado corriendo** contra la base de desarrollo: un alumno sin correo propio con dos tutores
—uno con nombre y otro sin— recibe dos correos con el mismo enlace, uno saludando por nombre y el otro
arrancando por el motivo, los dos diciendo "la contraseña de *fulanito*"; el repetido entre la cuenta
vinculada y la ficha se descarta; el enlace nombra al alumno en la pantalla; después de usarlo la
copia del otro tutor dice "ya se usó"; la contraseña nueva sirve, el DNI —que era su clave por
defecto— deja de servir, y `hasDefaultPassword` pasa a `false`. Un alumno con correo propio recibe el
suyo, con *"restablecé **tu** contraseña"*.

**Dos cosas que no se ejercitaron de punta a punta** y conviene mirar al probar en stage: que el reset
de alumno desde la ficha invalide un enlace pendiente —la llamada está puesta y el helper está
probado, pero hace falta una sesión de administración para dispararlo— y el corte por más de un
candidato, que necesita dos institutos.

**Sigue afuera del código**: la cuenta de SendGrid y el DNS del cliente. Y el uso que esto habilita
más allá del olvido: hoy al alumno se le reparte `estudiante123` o su DNI, y el mismo mecanismo
mandado al tutor es la salida de [SEC-06](#sec-06) para los chicos — que vuelve a depender de que la
ficha tenga el correo del tutor.

### Hecha · parte 3: el proveedor real es Resend (2026-09-09)

Commit `365c852`. **El proveedor deja de ser SendGrid y pasa a ser Resend**, y el cambio costó un
archivo: `ResendEmailProvider` es el tercero sobre la misma interfaz, y el factory ahora acepta
`"console" | "resend" | "sendgrid"`. No hubo que tocar el flujo — el envío ya estaba enganchado desde
la parte 1, y [`IEmailProvider`](../src/lib/email/IEmailProvider.ts) existía justamente para esto.
**SendGrid queda como plan B**: el archivo no molesta, no corre, y es la salida si el dominio se cae.

**La adaptación que importa: Resend no tira cuando el envío falla, devuelve `{ data, error }`.**
Verificado con una clave inválida — el SDK loguea el 401 y retorna normal. De ese `throw` cuelga el
`Promise.allSettled` de la acción, que es quien decide si le avisa al instituto que no salió nada.
Sin convertirlo, un envío rechazado se contaría como exitoso y el fracaso quedaría invisible para
todos, porque la pantalla contesta siempre lo mismo. Es el mismo agujero que el aviso a la campana
vino a tapar, y se habría reabierto por debajo.

**El seguimiento de clics ya no se apaga por mensaje**, y conviene tenerlo anotado: en SendGrid era
una opción del envío, en Resend es una configuración **del dominio**. Tiene que quedar apagado por la
razón de siempre —reescribe los enlaces y el botón deja de apuntar al instituto, que en un correo de
recuperación se lee como phishing—, pero ahora eso se rompe desde el panel de Resend y **sin que
cambie una línea de código**.

**La plantilla pasó a React Email.** El HTML lo arma un componente y el texto plano se sigue
escribiendo a mano, pero los dos salen del **mismo** saludo y del mismo motivo. Eso no es prolijidad:
el error de la parte 2 fue exactamente que una de las dos versiones decidía por su cuenta si el correo
era para el dueño de la contraseña o para su tutor. Ahora no puede.

**La paleta es la del modo claro de `globals.css`, token por token** — y llegó ahí después de una
vuelta. El componente entró con una paleta propia, navy y amarillo, que al verla entregada al lado del
sitio del cliente y de la pantalla de éxito se leía como otro producto. El enlace de un correo de
recuperación aterriza en el campus, y **parecerse a donde uno aterriza es la mitad de lo que distingue
un correo legítimo de uno que lo imita**: el mail oscuro trabajaba en contra de eso.

Copiar los tokens de la app alinea las dos superficies de una sola vez, porque **los tokens de la app
ya son la marca del cliente**: `--c-primary` es el mismo verde que `InstituteLanding.tsx` tiene
hardcodeado y `--c-accent` el mismo azul. Los grises salen de la app y no del landing, que usa slate
azulados casi negros — funcionan a 48px sobre un degradé y pesan a 20px sobre blanco.

**Es una copia a mano y no hay forma de evitarlo**, que es la deuda que esto deja. El correo viaja con
todo el estilo en atributos `style`: sin hoja de estilos, sin cascada, y ningún cliente de correo
resuelve un `var(--c-primary)`. Si cambian los tokens de `globals.css`, **hay que pasar por
`PasswordResetEmail.tsx`**, y nada lo va a avisar. Queda dicho en el archivo.

De paso quedó a la vista algo más grande: **ninguna superficie sabe de qué color es el instituto**. El
landing tiene sus tres colores hardcodeados, las pantallas de login y recuperación un índigo
`#4F46E5` que no aparece en ningún otro lado, y `Institute` tiene `logoUrl` y ningún campo de color.
Hoy no molesta porque el cliente es uno solo y los tokens de la app son justo los suyos; **con el
segundo cliente eso se rompe solo**, y ahí el correo va a heredar la marca del cliente equivocado.

**La marca del cuerpo es la del instituto, no la de la plataforma** — la misma regla que ya seguía el
remitente. Un correo firmado "Modern English School" que adentro se presenta como otra empresa se lee
como phishing. Lingua Campus queda en el pie. Y **Exo 2 no se va a ver casi nunca**: Gmail bloquea las
fuentes remotas, así que lo que se lee es el fallback.

**Un error que traía la implementación de referencia**, y que vale anotar porque es fácil de repetir:
elegía el remitente con `process.env.NODE_ENV === "production"`. En Vercel eso vale `production` en
**los dos** proyectos —stage también compila en modo producción—, así que stage habría mandado desde
la casilla de producción. El remitente sale de `EMAIL_FROM`, que es por entorno, y de
`Institute.senderEmail`, que es por instituto; el entorno no entra al código.

**Verificado renderizando** los tres casos —dueño, tutor con nombre y tutor sin nombre—: la paleta va
inline, el `href` del botón queda intacto apuntando al instituto, y en el del tutor "tu contraseña"
aparece cero veces. **No hubo ningún envío real todavía**: el dominio `lingua-campus.com.ar` está en
`pending` en Resend, con los tres registros (DKIM, y el MX y el TXT de `send`) sin verificar.

**El número que la parte 2 pedía medir en producción, medido (2026-09-09).** De **362 alumnos
activos**: 14 tienen correo propio, 200 no lo tienen pero sí al menos un tutor con dirección, y **148
no tienen ninguna** — el 41%. Es bastante mejor que el 97% de la base de desarrollo, pero sigue
queriendo decir que **cuatro de cada diez alumnos no pueden recuperar su contraseña por esta vía**, y
para ellos lo que se dispara es el aviso a la campana. Los 182 usuarios activos tienen todos correo.
Sigue siendo carga de datos del instituto, y sigue conviniendo decirle el número al cliente antes de
anunciarle la función.

**Lo que falta, y no es de este ítem**: verificar el dominio en Resend, cargar `EMAIL_PROVIDER`,
`RESEND_API_KEY` y `EMAIL_FROM` en los dos proyectos de Vercel, y dos bloqueantes que se descubrieron
buscando dónde probar. El Supabase de stage está **pausado**. Y **producción está cinco migraciones
atrás** —la última aplicada es del 2026-08-18—, así que ahí no existen ni `PasswordResetToken` ni
`Institute.senderEmail`: **FEAT-05 no está desplegado en producción**. Promover a `main` corre
`migrate deploy` con las cinco de una sola vez, sobre una base sin backups.

Al probar en stage hay una trampa que ya mordió una vez: **el enlace sale de la ficha del instituto,
no del host desde el que se pidió**. Si la ficha de stage es copia de producción, el correo de prueba
llega con un enlace a `modernenglishschool.com.ar` — o sea, a producción, donde el token no existe.

---

<a id="feat-06"></a>
## FEAT-06 · Que alumnos, tutores y docentes puedan escribirle al docente del curso · **P2** · 🗣️ Pedido del cliente

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

### 🗣️ Ampliado — 2026-09-02 · los alumnos también

**Nuevo pedido.** Que también **los alumnos** puedan escribirle al docente de su curso. El pedido del
13/08 nombraba a los tutores y a los docentes; ahora son los tres.

**Es el mismo corte de código, y ya los tenía adentro.** `createThread` bloquea `isStudent` en la
misma línea en que bloquea al tutor ([`messages.ts:383`](../src/app/actions/messages.ts)), y el
comentario de arriba lo dice como decisión de fase: *"En Fase 1, STUDENT y GUARDIAN no pueden iniciar
(solo responder)"*. Levantar el corte para los dos es un cambio, no dos. Responder ya pueden: el
alumno participa de hilos y manda mensajes en ellos, lo único que no puede es abrir uno.

**Y el alumno es el más barato de los tres destinatarios.** El tutor necesita una lista que hoy no
existe —sus alumnos vinculados → inscripciones activas → docente de cada curso—; el alumno tiene esa
lista en su propia inscripción: el docente de sus cursos activos, y nadie más. Sigue valiendo lo otro:
la lista **se hace cumplir en el servidor**, porque el destinatario llega en el body.

**Trae una pregunta que el pedido del tutor no tenía: la edad.** Hay alumnos de 6 a 8 años, que entran
con DNI y sin correo propio. Abrirles un canal directo con la docente es una decisión del instituto y
no un corolario del pedido:

- **¿El tutor ve lo que escribe su hijo?** Hoy un hilo tiene participantes y nada más: no hay forma de
  que un tercero supervise sin ser participante. Sumar al tutor como participante automático es una
  opción, y cambia lo que la docente puede contestar ahí adentro.
- **¿Todos los alumnos, o de cierta edad para arriba?** `Student.birthDate` permitiría el corte, pero
  es opcional y puede estar vacío en muchas fichas: antes de apoyar un permiso en ese campo hay que
  decidir qué pasa con el alumno sin fecha de nacimiento. Es la misma línea del resto del modelo,
  donde los obligatorios del negocio son opcionales en el schema.
- **El volumen.** Sumar tutores ya movía a [BUG-06](#bug-06) de molestia a problema; con los alumnos
  adentro son tres veces los hilos sobre el mismo contador roto.

### Decidido — 2026-09-13 · las seis preguntas, cerradas de a una

El pedido volvió por tercera vez, ahora como *"que los estudiantes y los tutores puedan iniciar
conversación con el profesor de la clase"*. Se cerraron seis puntos con el cliente, de a uno. El
docente→docente del pedido original **queda afuera de este paquete** (ver el final de la ficha).

**1 · El hilo guarda de qué alumno habla.** Va una columna `studentId` opcional en `MessageThread`.
El curso más el tutor alcanzan para deducir el alumno salvo con hermanos en el mismo curso — pero la
deducción es **en vivo**, y se cae el día que el alumno se cambia de curso o se da de baja. Un hilo
viejo tiene que poder decir de quién hablaba. Es el criterio que ya usan `ReportBatchSignature`, que
congela `signerName` en vez de leerlo del curso, y `FeeDeletion`, que copia el nombre del alumno.

La tentación que se descartó es resolverlo **sumando al alumno como participante**: en este modelo
participar *es* poder leer, así que el tutor que escribe "Juan está desbordado" lo estaría
escribiendo en un hilo que Juan abre. Quién es el sujeto y quién lee tienen que ser dos cosas
distintas.

De experiencia: el tutor con un solo hijo **no elige nada**; con dos o más elige el hijo y el curso
se desprende de ahí — el tutor piensa en el hijo, no en el curso. Y la docente lo ve **en la
bandeja**, no adentro del hilo (*"Marta González · sobre Juan Pérez · Nivel 3"*): si hay que abrir
el hilo para saber de quién le hablan, el campo no sirvió de nada. Desde el hilo, atajo a la ficha
del alumno.

**2 · Quién ve qué.** El hilo del alumno es alumno↔docente y el del tutor es tutor↔docente, y **no
se cruzan**: el tutor no ve lo que escribe su hijo ni el alumno lo que escribe su tutor. La
supervisión la hace la administración, que **ya ve todos los hilos del instituto** — eso no hay que
construirlo, está en [`getThreadsForUser`](../src/app/actions/messages.ts) y en el chequeo de
`isInstituteAdmin` de `getThread`. Y está bien resuelto el matiz: mirar es invisible, contestar no —
el admin que responde se suma al hilo como participante y el resto lo ve entrar.

**La secretaría también lee.** Hoy el código no las distingue (`isAdmin` mete a ADMIN y a SECRETARY
en la misma bolsa), y el cliente decidió dejarlo así y avisarle al instituto; si les incomoda, se
quita después. Vale saber que del lado de la familia **sí se distinguen al escribir**: firman
"Administración" y "Secretaría" respectivamente, con el rol congelado por mensaje en
`Message.senderRole`.

**Sin corte de edad**, y el argumento es del cliente: el alumno cumple años a mitad de cursada, y un
permiso que cambia solo el día del cumpleaños es un problema esperando. De paso desaparece la
dependencia de `Student.birthDate`, que es opcional y está vacío en muchas fichas — el problema que
la ampliación del 02/09 dejaba abierto.

**3 · El aviso es el sobre, y nada más.** Hoy **no hay ninguno**: ni `createThread` ni `sendMessage`
escriben una `Notification` ni mandan correo, y el único indicio es el badge del sobre, que se
refresca con un poll de 60 segundos y sólo mientras la persona está adentro de la app. No se nota
porque la mensajería corre en un solo sentido —escribe el instituto y leen las familias, y el que
escribe ya sabe que escribió—; al abrir el otro sentido, el mensaje de un tutor queda esperando a
que la docente entre y mire un sobrecito.

**Se evaluó escribir una `Notification` por mensaje y se descartó**, con el motivo que puso el
cliente: *"si mandamos la notificación en la campana, ¿para qué tenemos el sobre?"*. Serían dos
contadores del mismo hecho, y se desincronizan — leer el hilo actualiza el `lastReadAt` del
participante y **no toca** la fila de `Notification`, así que la campana seguiría marcando pendiente
algo ya leído y contestado. La campana es un **evento** ("se publicó un boletín"), el sobre es un
**estado** ("tenés tres conversaciones sin leer"), y mensajería ya lleva ese estado bien.

Entonces al sobre hay que darle lo que no tiene: **realtime** —el canal `user:${id}` ya existe y la
campana ya está suscripta ([`NotificationBell.tsx`](../src/components/layout/NotificationBell.tsx)),
así que el sobre puede colgarse del mismo y de paso desaparece el poll que para un admin levanta
todos los hilos del instituto una vez por minuto y por pestaña—, el **contador arreglado**
([BUG-06](#bug-06)) y un **desplegable** con los últimos hilos sin leer, con quién escribió y sobre
qué alumno.

**Sin correo.** Razón del cliente: los correos están saturados y la gente no los mira. Se suma que
iría a la casilla personal de la docente, que es justo donde no queremos que termine lo que escribe
una familia. **El push queda para más adelante** y está más cerca de lo que parece: la app ya es PWA
con service worker propio (`@ducanh2912/next-pwa`, `public/sw.js`) y ya tiene el diálogo de
instalación; falta VAPID, una tabla de suscripciones por dispositivo y el handler en el worker. Con
una salvedad que decide si sirve: **en iPhone el push web sólo llega si la familia instaló la app**
en la pantalla de inicio, así que la conversión de la PWA pasa a ser parte del problema.

**4 · Dos destinos: el docente del curso y Administración.** Si el único destino fuera el docente,
lo administrativo entraría igual por ahí — el tutor no separa lo pedagógico de lo de secretaría,
escribe donde tiene un cuadrito — y la docente terminaría de mesa de entradas reenviando consultas
de cuotas. Además la administración ya les escribe hoy, y un canal de una sola mano se iba a sentir
como un olvido. De yapa resuelve un caso feo: **el curso puede no tener docente**, porque
`teacherId` es opcional y [`courses/actions.ts`](../src/app/courses/actions.ts) guarda
`teacherId || null` sin chistar; con Administración entre los destinos, ese curso no queda con un
botón que no hace nada.

**Se elige un área o un curso, nunca un nombre** ("Mi profesor de Nivel 3", "Administración"): así
no se le muestra el padrón del instituto a nadie.

**5 · Se mantiene el hilo por tema, con asunto.** Se evaluó pasarlo a un chat único por alumno y
curso —el cliente los venía llamando "chats"— y lo descartó con el argumento correcto: el asunto es
lo que después permite encontrar *"la respuesta sobre la tarea del martes"* sin scrollear una
conversación única. Su lectura: tiene la dinámica de chat para escribir, contestar y ver quién está,
y la de correo para organizar. La fricción del asunto —un tutor apurado y un chico de 8 años no
inventan un título— se resuelve **en la pantalla**, con sugerencias tocables ("Tarea",
"Inasistencia", "Consulta sobre la clase"), no sacando el campo.

**6 · Buscador por asunto, filtros y paginación.** La bandeja **no tiene nada de eso**:
[`MessagesInboxClient`](../src/app/messages/components/MessagesInboxClient.tsx) son 127 líneas que
reciben la lista y la dibujan entera, y `getThreadsForUser` no tiene `take` — para un admin trae
todos los hilos del instituto, siempre. Con el modelo de hilo por tema recién confirmado, esto deja
de ser un lujo: sin buscador, "un hilo por tema" es sólo muchos hilos.

Van **filtros por curso, por alumno y por sin leer** —los tres salen de datos que el hilo ya va a
tener, así que son casi gratis—, **paginación**, y el buscador **sólo por asunto**: por contenido es
índice de texto completo en Postgres, y eso se paga en infraestructura todos los meses, no una vez.
Si el instituto lo pide, se cotiza aparte.

Volumen estimado, **sin medir**: el instituto ronda las 580 personas (el mismo número que usa
`ActivityDay` para acotar su crecimiento). Si un tercio de las familias abre un hilo por mes —y con
dos destinos habilitados no parece exagerado—, son unos 150 hilos nuevos por mes y cerca de 1.500 en
el año lectivo, hoy todos en una sola página y recontados cada 60 segundos.

### Lo que queda afuera, anotado para no perderlo

Cuatro de estos temas tienen **ficha propia desde el 2026-09-13**, para no quedar enterrados acá
adentro: [FEAT-22](#feat-22) (push), [FEAT-23](#feat-23) (cerrar los hilos), [FEAT-24](#feat-24)
(buscar por contenido) y [FEAT-25](#feat-25) (quién de administración contestó). Lo que sigue es el
porqué, y lo que no tiene ficha.

**El ciclo de vida de los hilos — planteado por el cliente el 2026-09-11, no se implementa ahora.**
*"Los chats no tienen que vivir para siempre: cuando un estudiante cambia de curso, o cuando el
curso termina, no tiene sentido que sigan accesibles."* Adentro hay dos cosas y una ya está resuelta
sola: **abrir hilos nuevos con el docente equivocado no va a pasar**, porque la lista de
destinatarios se arma de inscripciones activas y cursos activos, así que el docente viejo
simplemente deja de aparecer. Lo que falta decidir es qué pasa con **los hilos ya abiertos**.

La forma recomendada: **se cierran, no se borran** — sólo lectura, porque una conversación entre una
familia y una docente es registro del instituto y acá el borrado es siempre lógico
([ARQ-05](#arq-05)). Y **derivado, sin columna nueva**: el hilo ya sabe el curso y el alumno, así que
*"¿sigue activa esa inscripción y sigue activo el curso?"* se contesta sola, sin proceso que correr
ni hilos que alguien se olvide de cerrar. No contradice el punto 1: **se congela el sujeto y se
deriva el permiso** — de quién se hablaba es un hecho del pasado y hay que guardarlo; quién puede
escribir hoy es una pregunta del presente.

**Lo único que hay que hacer desde ahora, y es gratis:** que los hilos que abren alumnos y tutores
lleven `courseId` **siempre**. Hoy es opcional en `MessageThread` y se abren desde un curso igual,
así que no cuesta nada — pero si entran hilos sin curso, van a ser justo los que nadie sepa cuándo
cerrar.

**El docente→docente del pedido original (13/08).** El cliente no lo nombró en ninguno de los dos
pedidos siguientes, que hablaron de estudiantes y tutores. Sigue valiendo lo de arriba: el docente ya
puede iniciar hilos, pero `allTeachers` se arma **sólo para administradores**, así que alcanza con
extendérselo. Se deja afuera porque trae su propia pregunta de alcance —¿cualquier docente del
instituto, o sólo los de los otros cursos de sus alumnos?— que no tiene nada que ver con las seis
que se cerraron.

**[BUG-06](#bug-06) deja de ser una molestia.** Con la administración como única supervisión de lo
que escriben los alumnos, ese contador **es** la herramienta de supervisión: hoy muestra
permanentemente todos los hilos del instituto como no leídos y nunca baja, así que no distingue un
hilo nuevo de uno de agosto. Sube de prioridad por sí solo, y además el punto 3 lo toca igual.

### Medido en producción — 2026-09-13 · el instituto escribe y la familia no lee

Con las seis decisiones cerradas, se midió la base de producción para ver cuánto se usa hoy la
mensajería y qué mueve el cambio. Consultas de sólo lectura. **Dos de los números que se dieron por
buenos más arriba estaban mal, y van corregidos al final.**

**Cuánto se usa.** 27 hilos, 61 mensajes y 118 participaciones desde el 2026-05-12. Por mes: 1 en
mayo, 4 en junio, ninguno en julio, 11 en agosto y 11 en septiembre al día 13. **Viene creciendo
rápido** — septiembre proyecta unos 25. No es un módulo muerto al que le estamos agregando features.

**Quién escribe: los docentes, no la administración.** 44 de los 61 mensajes (72%) los mandó alguien
con rol TEACHER, en 23 de los 27 hilos. La administración puso 3 y la secretaría 4. Era justo al
revés de lo que se suponía al empezar la ronda.

**Y las familias contestan cuando les llega.** 5 mensajes de tutores y 4 de alumnos, en 7 hilos
distintos. El promedio es de 2,26 mensajes por hilo y sólo 8 de 27 se quedaron en un solo mensaje:
**el 70% tiene ida y vuelta**. El canal de vuelta ya funciona para el que lo ve.

**El dato más importante, y es malo.** El **80%** de las participaciones de alumnos (37 de 46) y el
**86%** de las de tutores (38 de 44) tienen `lastReadAt` en `null`: **nunca abrieron el hilo**.
Docentes y staff, 0%. Es lo que motiva [FEAT-22](#feat-22) y lo que le pone condición al punto 3:
abrir el canal de ida sirve de poco si la respuesta de la docente no se lee.

**Lo que confirma las decisiones:**

- **`COURSE_BLAST` no se usó nunca.** Los 27 hilos son `DIRECT`, con 4,4 participantes promedio: los
  docentes arman el envío a varios **a mano**, seleccionando alumnos, teniendo la función de curso
  completo al lado. Conviene averiguar por qué antes de construir más pantalla — o no la encuentran,
  o no les sirve como está.
- **26 de 27 hilos ya llevan curso.** Exigir `courseId` en los hilos de familia no cambia la
  costumbre, la garantiza ([FEAT-23](#feat-23)).
- **El selector casi nunca va a preguntar.** Sólo **1** de los 205 alumnos con inscripción activa
  está en más de un curso, y sólo **29 de 173 tutores** (17%) tienen más de un hijo. Lo decidido —no
  preguntar cuando hay uno solo— cubre al 83% de los tutores y a prácticamente todos los alumnos.
- **No hay un solo curso activo sin docente: 0 de 31.** El caso feo que justificaba en parte el
  destino "Administración" **no se da hoy**. El destino se sostiene por el otro motivo: lo
  administrativo entra igual por el canal del docente.
- **96% de los alumnos activos sin correo** (348 de 362). Confirma que para el alumno no hay ningún
  canal fuera de la app.

**Dos correcciones a lo escrito más arriba:**

1. **`birthDate` no está "vacío en muchas fichas": faltan 7 de 362 alumnos activos, el 2%.** La
   decisión de no usar la edad sigue en pie, pero por el motivo del cliente —el alumno cumple años a
   mitad de cursada— y no por la calidad del dato, que es buena.
2. **La proyección de ~1.500 hilos al año estaba inflada unas seis veces.** Salía de suponer que un
   tercio de las familias abriría un hilo por mes. Con la base real, y aun triplicando el volumen al
   abrir el canal, da del orden de **200 a 400 hilos por año lectivo**. Consecuencia: **la paginación
   y el buscador no son urgentes por volumen.** Entran igual —el modelo de hilo por tema los
   necesita— pero no hay que apurarlos por miedo a que la bandeja explote. Lo mismo vale para
   [BUG-06](#bug-06): el badge del admin muestra 27, no 1.500.

**Un caso de borde que ahora tiene nombre.** Hay una persona en producción que es **tutora y docente
a la vez**. Con el canal abierto va a poder escribirle a la docente de su hijo y recibir mensajes
como docente, en la misma bandeja. El rol activo ya resuelve qué permisos tiene en cada momento
([SEC-01](#sec-01)), pero es el caso que hay que probar a mano antes de salir.

### Hecho — 2026-09-13 en `b0303d8` · pendiente de verificar en stage

Las seis decisiones, construidas. De la ficha queda abierto sólo el docente→docente del pedido
original del 13/08.

**La columna.** `MessageThread.studentId`, opcional, con `onDelete: Restrict` —migración
`20260913120000_add_message_thread_student`—. Los 27 hilos que ya existen quedan en `null` y **no se
rellenan hacia atrás**: el dato no se puede reconstruir con certeza, y esta columna existe
justamente para no deducirlo. Los hilos que el instituto le manda a **un solo** alumno también la
llenan, así el filtro por alumno sirve de los dos lados.

**La puerta de la familia es una función aparte**, `createFamilyThread`, en vez de levantar el corte
de `createThread`. Aquella recibe ids de destinatarios sueltos, que es aceptable para quien ya ve a
todo el instituto y no para una familia. Lo que llega acá es `"TEACHER"` o `"ADMIN"`, nunca un id: el
destinatario real sale de recalcular el alcance con `getFamilyRecipients`, **la misma función que
dibuja la pantalla**. Si sólo dibujara, alcanzaría con mandar otro `courseId` en el cuerpo del pedido.

**El redactor.** Pantalla propia para la familia. Con un alumno y un curso no pregunta nada; con
varios hijos se elige el hijo y el curso se desprende de ahí. Los dos destinos son botones con
nombre de área, y el del docente se deshabilita solo cuando el curso no tiene docente activo —un
docente dado de baja queda con `roles` vacío pero sigue colgando del curso ([SEC-01](#sec-01)), y
escribirle sería mandarle un mensaje a una cuenta que ya no entra—. El asunto trae sugerencias
tocables según el destino.

**La bandeja.** Buscador por asunto, filtros por curso, por alumno y por sin leer, y paginación de
20. Los filtros viven en la URL, así que la búsqueda se comparte y el botón de atrás hace lo que uno
espera. El chip *"sobre Fulano"* va en la fila y no adentro del hilo; para el personal es además
atajo a la ficha del alumno.

**El aviso.** El sobre escucha el canal `user:${id}` que ya usaba la campana, con evento
`new_message`. El poll de 60 segundos pasa a red de seguridad cada 5 minutos —por si Realtime está
apagado en el proyecto, que es el caso que ya contempla `NotificationBell`— más un refresco al
volver a la pestaña. Lo que llega por el canal sólo dice "pasó algo": el número se vuelve a pedir al
servidor en vez de sumarlo del lado del cliente, que se despegaría con dos pestañas abiertas.

**La migración corre sola en el deploy**, porque `build` hace `migrate deploy`. Es un `ADD COLUMN`
nulable más dos índices y una clave foránea sobre una tabla de 27 filas: instantánea y sin bloqueo
que se note. Pero es la misma que va a correr al promover a `main`.

### Verificado por pantalla — 2026-09-13 · contra la base local · dos cosas que el build no veía

Se sembró el escenario en la base de desarrollo: una tutora con **dos hijas**, una en un curso con
docente y la otra en uno **sin** docente, más un alumno con una sola materia y 32 hilos de relleno
para ver la paginación. Lo que se recorrió, con las dos correcciones que salieron, en `e745991`.

**El canal en vivo del sobre no conectaba nunca, y el motivo no es el que decía el aviso.** Las dos
campanas de la barra se suscribían al **mismo tema** `user:${id}`, y un cliente de Supabase no admite
dos suscripciones al mismo tema: la segunda recibe `CHANNEL_ERROR` y queda muda. Como
`NotificationBell` monta primero, la que perdía era siempre el sobre. Se descartó la primera
sospecha —"Realtime apagado", que es lo que dice el aviso heredado— abriendo un WebSocket a mano
contra el proyecto: responde. El sobre pasó a `user:${id}:messages` y **el aviso llega**: con la
bandeja abierta y sin recargar, el badge de la tutora pasó de 0 a 1 al entrar un mensaje.

Vale para cualquiera que agregue una tercera suscripción: **un tema por consumidor**.

**El tiempo relativo de la bandeja rompía la hidratación.** El servidor renderizaba *"hace 1m"* y el
navegador *"hace 2m"* un segundo después. Ya estaba antes de este cambio; se marca el `span` como
diferencia esperada, que es lo que es.

**Lo recorrido, y anduvo:** la tutora con dos hijas ve el selector y el curso se desprende del hijo;
con la hija del curso sin docente, el botón del profesor **se deshabilita solo** y las sugerencias de
asunto cambian a las administrativas; el hilo se crea con el alumno guardado y **sin la hija adentro
como participante**; el docente lo ve en su bandeja con el chip *"sobre aitana"* y el badge en 1;
para el personal ese chip es enlace a la ficha y para la familia no; responder baja el badge a 0 y
levanta el de la tutora; el alumno no elige alumno y le sale su curso y su profe; el buscador por
asunto filtra; la paginación corta en 20 y la segunda página trae las 16 restantes.

**Y la prueba de [BUG-06](#bug-06) en pantalla:** la administradora ve los 36 hilos del instituto y
el badge le queda en **cero**, con los dos desplegables —curso y alumno— ya poblados.

**Lo que quedó sin verse acá:** la persona que es tutora **y** docente a la vez — en la base local no
existía el caso con datos creíbles. Se recorrió en stage al día siguiente, más abajo.

**Ojo con el `.env` de desarrollo:** `NEXT_PUBLIC_SUPABASE_URL` apunta al proyecto de **producción**
mientras `DATABASE_URL` apunta a la base local. Para estas pruebas dio igual —el canal en vivo no
guarda nada—, pero conviene saberlo antes de probar Storage desde local. Y `supabase-server.ts` usa
esa misma URL con la service role key, así que **un adjunto subido desde local va al bucket de
producción**.

### Verificado en stage — 2026-09-14 · el doble rol, que local no podía mostrar

Sobre datos copiados de producción, con las tres personas que ejercitan los casos. Los números se
predijeron contra la base **antes** de abrir la pantalla, y dieron.

**La tutora con tres hijos** (Pamela Paez). El selector con los tres, y al cambiar de hijo cambian el
curso **y** el docente — son tres cursos distintos con tres docentes distintos. El hilo quedó con
`studentId` de Thiago, participantes la madre y la docente, y **cero alumnos adentro**.

**El doble rol** (Patricia Muñiz, docente y tutora de Ariana). Es el caso que justificaba probar en
stage y salió entero:

- Entra con el rol activo en **docente**, sin elegir, porque TEACHER gana por prioridad sobre
  GUARDIAN. El panel le muestra "Mis Cursos: 1".
- Como docente ve el redactor del personal, con **un solo curso en el desplegable** —el suyo, no los
  31 del instituto— y **sin la pestaña de Profesores**, que es de administración.
- Al cambiar el selector a tutora, el redactor pasa al de la familia: sin selector de hijo, *Sobre
  Ariana Muñiz*, *Pre-adolescents 1 M-J late shift*, *Profesor del curso — Rosa Marin*.
- **Y el mensaje queda grabado con `senderRole = GUARDIAN`**, no TEACHER. Es lo que más importa de
  este caso: si guardara el otro rol, Rosa Marin estaría leyendo un mensaje de una colega en vez de
  uno de una madre, y releyendo el hilo mañana nadie sabría con qué sombrero se escribió.

**[BUG-06](#bug-06) en la pantalla del admin.** Ve los **15 hilos** del instituto y el badge del
sobre le queda en **0**; antes del arreglo habría marcado 15, porque participa de 3. Abrir un hilo
del que no participa **no le mueve el contador**, que es justamente lo que se buscaba.

**Un detalle del chip del alumno, que estaba mal descrito arriba:** en la **bandeja** es una etiqueta
para todos; el **enlace a la ficha** vive adentro del hilo y sólo para el personal. Y sigue el rol
activo, no la lista de roles: a Patricia, mirando como tutora, el mismo chip le salió sin enlace.

**El destino "Administración", que era la última rama sin ejecutar.** Se mandó uno desde Pamela sobre
otro hijo (Thian, *Children 2 Ma - Jue*) y quedó con **tres participantes** —la madre como autora y
las dos cuentas de administración del instituto—, con el alumno guardado, cero alumnos adentro y
**sin el docente del curso**, que es la distinción que hace al destino. Del lado de la familia las
dos cuentas se muestran como **"Administración"** y **"Secretaría"**: los nombres propios del
personal no se filtran. Nota: una de las dos es docente *y* secretaria, y aun así aparece como
"Secretaría", que es el rol por el que entró al hilo.

### Lo que sigue sin ejercitarse

Para que no se lea como "probado entero", que no lo está:

- **El corte del servidor, a la mala.** Nunca se intentó mandar un `courseId` ajeno. Está escrito
  para rechazarlo —el alcance se recalcula con la misma función que dibuja la pantalla, y lo que
  viaja es `"TEACHER"`/`"ADMIN"` y jamás un id—, pero por la interfaz no hay forma de elegir un
  curso que no sea de la familia, así que probarlo de verdad pide forjar el pedido.
- **En stage quedaron sin recorrer** el alumno escribiendo, el aviso en vivo del sobre, el buscador
  y la paginación —stage tiene 15 hilos y la página corta en 20—, y responder un hilo. Los cinco sí
  se ejercitaron en local.
- **El curso sin docente** no se puede ver en stage: no hay ninguno (0 de 31, igual que producción).
  El botón deshabilitado se probó sólo en local, con un curso sembrado a mano.
- **La docente que sea tutora de un alumno de su propio curso** no tendría a quién escribirle —sería
  ella misma, y el autor se excluye de los destinatarios— y vería *"No hay a quién dirigir este
  mensaje"*, que para ese caso es un mensaje pobre. No pasa hoy ni en stage ni en producción.

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

### Hecho — 2026-08-18 · pendiente de verificar en stage

**La ficha decía "no navega"; se decidió lo contrario, y por una razón.** La tarjeta del par **sí**
lleva a la ficha del curso, en modo lectura. El motivo es que
[`courses/[id]/page.tsx`](../src/app/courses/[id]/page.tsx) **ya dejaba entrar a cualquiera del
instituto a cualquier curso** —sólo validaba `instituteId`—, así que no poner el enlace habría sido
un cartel: el docente ajeno entraba igual escribiendo la URL, y ahí veía la lista de alumnos con sus
teléfonos y el acceso a sus fichas. Peor todavía, por ahí entraba también un **tutor**, que es
`User` con instituto. El listado `/courses` ya exigía ser personal; esta página se había quedado
atrás.

Ahora la página exige `INSTITUTE_STAFF` y decide entre tres casos: el docente del curso y la
conducción entran como siempre; un docente de otro curso del **mismo nivel** entra en modo lectura
—libro de temas y horarios, sin alumnos, sin informes y sin ninguna acción—; y el que no es ninguna
de las dos cosas va a `/courses`.

**El calendario.** El filtro del docente pasó de `teacherId: yo` a `yo` ∪ `mismo nivel`
([`lib/peers.ts`](../src/lib/peers.ts), compartido con la ficha del curso para que el alcance se
defina en un solo lugar). Las tarjetas ajenas van en gris —sin el color del curso, tengan tema
cargado o no— con la etiqueta «Otro docente», y su acción es «Ver Temas», nunca «Asistencia».

**El interruptor.** Filtro «Ver a mis pares» en la barra, en la URL como los demás (`pares=0`) y
arrastrado por la navegación de semanas. Aparece sólo si el docente dicta algún nivel. Con varios
cursos por nivel la vista semanal se llena de tarjetas ajenas, y a veces uno sólo quiere ver lo suyo.
El desplegable de cursos lista lo mismo que muestra la agenda: si ve a sus pares, puede filtrar por
el curso de un par.

**Lo que se cerró del lado del servidor**, que era el punto 3 de la ficha y resultó más grande de lo
que decía:

| | Cómo estaba |
|---|---|
| `saveLessonGradesAction` | **Sin autorización de ninguna clase**: alcanzaba con tener sesión. Un tutor, un alumno o un docente de otro instituto escribía las notas de cualquier clase mandando los ids. Ahora usa el mismo control que asistencia y sólo acepta alumnos matriculados en el curso. |
| `createLessonAction`, `editLessonAction`, `deleteLessonAction`, `generateLessonsAction` | Chequeaban personal e instituto pero no de quién era el curso: un docente le borraba las clases a otro por POST. Ahora exigen dictar el curso. `editLessonAction` y `deleteLessonAction`, además, no verificaban que la clase fuera del curso que venía en el mismo pedido: el par de ids podía no tener nada que ver entre sí. |
| `practice-preview/page.tsx` | Buscaba la práctica **sólo por `lessonId`**: cualquier personal, de cualquier instituto, veía la práctica de cualquier clase. No miraba instituto ni que la clase fuera del curso de la URL. |

El chequeo que vivía adentro de la acción de asistencia se mudó a
[`lib/lessonAccess.ts`](../src/lib/lessonAccess.ts) sin cambiarlo, porque las notas necesitaban
exactamente el mismo. Los roles administrativos siguen entrando a todo: el corte es entre docentes.

**Lo que quedó afuera, a propósito.** Las acciones del libro de temas **no** chequean que el curso
esté finalizado, aunque la pantalla esconde los botones cuando lo está. Es la misma clase de hueco
que se cerró en asistencia, pero es una regla distinta de la que trae esta ficha y no la toqué para
no arrastrar un cambio de comportamiento sin mirar. **Anotarlo como pendiente.**

### Lo que dijo producción, y una regla que se corrigió por eso — 2026-08-18

Antes de sembrar nada se miró la forma de los cursos en producción, que es la pregunta de fondo:
**¿esto muestra algo en la realidad?** Sí.

- **Todos los cursos activos tienen docente y tienen horarios.** No hay cursos sueltos.
- **Cinco niveles tienen más de un docente**, que son los que se van a ver entre sí: Adults Level 2
  (tres docentes), y Children 4, Upper-intermediate, Pre-adolescents 2 y Pre-intermediate (dos cada
  uno). El resto de los niveles los dicta una sola persona y no cambia nada para ellos.
- El typo **`"Adolesnts 1"` está en producción**, no sólo en la base local: un curso con el nivel mal
  escrito, aislado de cualquier «Adolescents 1». Es exactamente el modo en que la comparación por
  texto falla, y ya está pasando — no es hipotético. Mientras `Course.level` sea texto suelto
  ([ARQ-01](#arq-01)), «no veo a mi par» se diagnostica mirando ese campo.

**La corrección: un curso sin docente no es la clase de un par.** La primera versión tomaba como par
a cualquier curso del mismo nivel, incluidos los que no dicta nadie, y los rotulaba «Otro docente» —
que es falso. En producción no cambia nada porque todos los cursos tienen docente asignado; lo que
evita es una etiqueta mentirosa el día que quede uno sin asignar, que es justo cuando alguien mira.

### Verificación — 2026-08-18 · la base local quedó sembrada para esto

La base de desarrollo tiene información parcial de producción y **ningún curso de par tenía horarios
cargados**, así que el calendario no mostraba nada nuevo: el calendario dibuja `Schedule`. Se sembró
a mano lo que faltaba, imitando la forma de producción — tres cursos Upper-intermediate con dos
docentes distintos, igual que allá:

| Curso | Nivel | Docente | Para qué está |
|---|---|---|---|
| Adolescents+ M-J | Upper-intermediate | profe roxana | El curso propio |
| Children 2 Lu-Mie | *(null)* | profe roxana | Curso propio **sin nivel**: no aporta pares |
| Upper-intermediate M-V | Upper-intermediate | profe hugo | Par |
| Upper-intermediate M-J early shift | Upper-intermediate | mama prueba | Segundo par |
| Upper-intermediate M-J late shift | Upper-intermediate | *(sin docente)* | Mismo nivel pero **no es par** |
| Children 1 | Children 1 | *(sin docente)* | Ni propio ni par |

Predicción para `profe roxana`, calculada antes de mirar la pantalla:

| | Pares encendidos | Pares apagados |
|---|---|---|
| Plantillas de clases | **7** | **3** |
| Desplegable de cursos | **4** | **2** |

Y la semana en curso le tiene que quedar así — martes y jueves con tres tarjetas, la propia en el
medio y una de cada par a los costados:

| Día | Hora | | Curso |
|---|---|---|---|
| Lun | 10:00 | propio | Children 2 Lu-Mie |
| Mar | 16:00 | **par** | Upper-intermediate M-J early shift · mama prueba |
| Mar | 18:00 | propio | Adolescents+ M-J |
| Mar | 20:00 | **par** | Upper-intermediate M-V · profe hugo |
| Jue | 16:00 | **par** | Upper-intermediate M-J early shift · mama prueba |
| Jue | 18:00 | propio | Adolescents+ M-J |
| Jue | 20:00 | **par** | Upper-intermediate M-V · profe hugo |

**El martes 21:30 no tiene que aparecer**: es «Upper-intermediate M-J late shift», mismo nivel pero
sin docente. Si aparece, la regla del docente no está andando.

En la semana en curso **todas** las tarjetas, propias y ajenas, tienen que decir «Tema de la clase:
sin registrar»: las clases de hoy en adelante están en «Clase Programada» porque nadie escribió
todavía qué se dio. Si alguna dice «Clase Programada» tal cual, el rótulo se está mostrando como si
fuera un tema. Una semana atrás todas tienen tema propio.

Y entrando a `/courses/cmnkwnffi0001dli0m8iod5ji` (el curso de hugo) el libro de temas de agosto
tiene que mostrar **8 clases**: las cuatro de antes del 18 con su tema y su contenido **completo** —
las del 11 y el 13 tienen varias líneas a propósito, para ver que no se recorta—, y las cuatro
siguientes en «Clase Programada» sin contenido.

**Las clases se sembraron para todo el período de vigencia** (9/3 al 18/12), no sólo para la semana
en curso: con una sola semana cargada, cualquier otra sale punteada y parece que la función no anda.
Son 465 clases generadas desde los horarios, con la misma regla que `generateLessonsAction` —no se
pisa una clase que ya existe para ese curso, fecha y horario— y **sin prácticas**: `LessonPractice`
no se tocó.

**Y se sembraron como se ven en la realidad, que no es lo mismo:** las clases anteriores a hoy tienen
tema y contenido cargados —es lo que el docente registró—, y las de hoy en adelante están en «Clase
Programada» sin contenido. Los cursos avanzan desfasados entre sí, así que dos cursos del mismo nivel
nunca están en el mismo tema.

### 🗣️ El plan del curso no es lo que pasó en el aula — 2026-08-18

**Lo que el cliente pide es lo segundo, y la primera versión mostraba lo primero.** La distinción ya
existía en el modelo y se había perdido de vista: `generateLessonsAction` crea todas las clases del
período con el tema en `SCHEDULED_LESSON_TOPIC` —la constante vale literalmente `"Clase Programada"`—
y sin contenido, y **el docente después edita cada clase y escribe qué dio**. Una clase con el rótulo
puesto no quiere decir «el tema es Clase Programada»: quiere decir **que todavía nadie escribió nada**.

El calendario mostraba ese rótulo como si fuera el tema. Para el docente propio es apenas feo; para
el par es el pedido incumplido, porque mira la tarjeta y no se entera de nada. Ahora la tarjeta
distingue tres estados: tema registrado, clase creada pero sin registrar, y sin clase.

**El problema de fondo, que no es de datos: el calendario abre en la semana en curso, que es
justamente la que nadie llenó todavía.** El docente escribe qué dio después de dar la clase, así que
en la pantalla que el cliente va a abrir por defecto la tarjeta del par casi siempre iba a estar en
blanco. La información que contesta «¿por dónde va mi par?» vive en las clases **pasadas**.

**Decidido el 2026-08-18, después de probarlo y descartarlo: la respuesta está en la ficha del
curso, no en la tarjeta.**

Se llegó a implementar que la tarjeta del par mostrara su última clase registrada con fecha,
contenido recortado y todo. **Se sacó.** La tarjeta del calendario tiene que ser la misma para todos:
meterle lo que dio un colega la vuelve incómoda de leer, mete información de curso en un objeto que
es de horario, y ensancha una grilla que ya tiene siete columnas. El calendario es una agenda; sirve
para ver que la clase del par existe y para entrar. Lo que dio se lee adentro.

Queda entonces un solo camino, y es el que ya estaba: **clic en la tarjeta → libro de temas del par**,
mes a mes, con tema y contenido de cada clase, en sólo lectura.

Lo que sí se sumó en esa pantalla: **el contenido de cada clase se muestra entero** en la vista del
par, no recortado a dos líneas como lo ve el docente del curso. El docente del curso recorta porque
puede abrir la clase y leerla completa; el par no puede, y leer qué dio su colega es exactamente a lo
que vino. Es lo único que faltaba para que la ficha conteste el pedido.

**Un defecto viejo que apareció en el camino.** La vista diaria decidía si había clase mirando dos
lugares —las clases del horario y las del curso— pero después leía `schedule.lessons[0]` a secas. Una
clase cargada **sin horario asociado** —el modal lo permite: `scheduleId` es opcional— en un día que
sí tiene horario dejaba la primera lista vacía y la segunda llena, y ahí `[0]` es `undefined`: se
cae la pantalla del calendario entera, no la tarjeta. Corregido en el mismo pase.

Para probar por pantalla, entrando como `profe@test.com`:

1. `/schedule` → 7 plantillas y el interruptor «Ver a mis pares». Apagarlo deja 3, y `pares=0`
   sobrevive al cambiar de semana.
2. `/courses/cmnkwnffi0001dli0m8iod5ji` (Upper-intermediate M-V, par de hugo) → modo lectura, con el
   aviso arriba, sin columna de alumnos y sin la sección de informes.
3. `/courses/cmnkwnfkw000ndli035rowsy9` (Upper-intermediate M-J late shift, mismo nivel **sin
   docente**) → rebota a `/courses`.
4. `/courses/cmnkwnfn9000zdli0240b2dmp` (Children 1, otro nivel) → rebota a `/courses`. **Antes de
   este cambio entraba y veía los alumnos con sus teléfonos.**

---

<a id="feat-08"></a>
## FEAT-08 · Columna de novedades: plataforma, instituto y curso · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Una columna de novedades donde se comunican temas, en tres niveles:
nosotros anunciamos funcionalidades nuevas, el instituto comunica por ejemplo una salida, y el curso
comunica una tarea puntual. Las novedades deben poder firmarse — eso es [FEAT-09](#feat-09), que ya
**no depende de esta**: por la decisión del 2026-08-19 arranca por los informes, y las novedades son
su segunda etapa.

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
## FEAT-09 · Firma de conformidad de informes y novedades · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-08-13).** Que las novedades sean "firmadas digitalmente por sus destinatarios".

**Ampliación (2026-08-19).** El pedido se concreta sobre los **informes**: que el tutor firme cuando
ve las notas, y que esa firma sea la devolución al instituto de que efectivamente las vio. Y suma un
requisito nuevo: la firma es un **trazo dibujado**, y tiene que parecerse entre informe e informe —
que no valga un círculo en uno y un cuadrado en el otro.

**Decisión (2026-08-19): arranca por los informes y no espera a [FEAT-08](#feat-08).** La ficha nacía
colgada de las novedades —"sin novedades no hay qué firmar"—, pero los informes ya existen
([`prisma\schema.prisma:862`](../prisma/schema.prisma), `StudentReport` con su `publishedAt`), así que
esa dependencia no era real. Queda en dos etapas: **primero informes**, después novedades cuando
FEAT-08 exista. El modelo se diseña igual apuntando a "un documento" de tipo variable, así que sumar
novedades, el reglamento o una autorización más adelante sale gratis.

**Decisión (2026-08-13): es firma electrónica, y el objetivo es saber quién vio.** No se busca una
autorización con valor probatorio sino que el instituto sepa si los tutores y los alumnos vieron la
novedad o el informe. Eso baja la exigencia de golpe: no hace falta certificador licenciado ni las
formalidades de la *firma digital* de la Ley 25.506, que es un término legal distinto y con
presunción de autoría. Lo que se construye es un acuse de lectura con conformidad explícita.

Conviene que la interfaz diga eso mismo —"confirmo que lo leí"— y no "firma digital", por dos
razones: es lo que realmente hace, y evita que dentro de un año alguien lo invoque como si fuera lo
otro. **El trazo no cambia esto**: dibujar la firma le da al acto peso de acto, pero lo que queda
registrado sigue siendo un acuse de lectura.

### El trazo y el parecido entre firmas (2026-08-19)

**Contra qué protege el parecido, y contra qué no.** Para el objetivo declarado —que el instituto
sepa que el tutor vio las notas— la comparación no aporta nada: el login ya identifica al tutor. Lo
que el parecido cuida es que el tutor no haga un palito para sacarse el cartel de encima. Es una
**señal de seriedad, no de seguridad**, y de ahí sale todo lo que sigue: acá nadie está falsificando,
el problema es el descuido.

**Decisión: la firma de referencia se registra en la primera firma.** No hay un paso de enrolamiento
aparte. La primera vez que el tutor firma, ese trazo queda guardado como referencia, y contra ese se
comparan todos los siguientes.

**Decisión (2026-08-19): la referencia vive en el perfil de quien firma.** No cuelga del informe ni
del alumno, sino de la persona. Así "¿es la primera vez que firma?" es una pregunta sobre el
firmante, y el caso de los dos tutores se resuelve solo: si el primer informe lo firma la madre y el
segundo el padre, cada uno tiene su propio estreno y su propia referencia. De paso, un tutor con tres
hijos registra la firma una vez y le sirve para los informes de los tres.

**Pero el firmante no siempre es un `User`.** `Student` **no** es un `User`: tiene su propio `email` y
`password` ([`prisma\schema.prisma:106`](../prisma/schema.prisma)), y los alumnos entran con DNI. Con
los mayores de edad firmando por sí mismos, la referencia no puede colgar de `User`. El patrón ya
existe en el proyecto y conviene copiarlo en vez de inventar otro: `ThreadParticipant` usa
`userId?` / `studentId?` con *"exactamente uno de los dos debe estar poblado"*
([`prisma\schema.prisma:739`](../prisma/schema.prisma)).

**El primer trazo es el que nadie hace con cuidado.** Define todas las comparaciones futuras, y lo
hace alguien que nunca firmó ahí y no sabe que cuenta. Dos cosas, entonces: avisar en esa primera vez
que ese trazo queda como su firma, y dejar que la vuelva a registrar desde su propio perfil cuando
quiera — él, no la secretaría. Las firmas ya hechas no se tocan: cada una guarda su propio trazo.

**Decisión: no se bloquea nunca por parecido.** Se guarda el puntaje y se le muestra al instituto en
la misma lista donde ve quién falta. El motivo es concreto: los tutores van a firmar con el dedo en
un celular, donde la misma persona varía muchísimo. Un umbral que rechace le traba la firma a padres
legítimos, y ahí no hay quién destrabe — la secretaría no puede firmar por ellos, y el sistema no
puede dejar un callejón sin salida del lado de la familia.

**Mostrarle al tutor su firma anterior mientras firma.** Resuelve el grueso del problema
círculo-contra-cuadrado sin ningún algoritmo, y es lo más barato de todo el ítem. Conviene construir
eso primero y ver cuánto queda por resolver después.

**Guardar el trazo como secuencia de puntos con tiempos, no como PNG.** Comparar imágenes es flojo;
lo que funciona para comparar firmas es la **dinámica** del trazo —el orden, la velocidad, las
pausas—. Además ocupa menos, y la imagen se renderiza cuando se la necesita. Si se guarda sólo el
PNG, esa puerta queda cerrada para siempre.

**Dónde sí importa la fortaleza del login.** Un acuse de lectura tolera bien que las credenciales
sean flojas: si la secretaría conoce la contraseña del tutor ([SEC-06](#sec-06)) y no hay
recuperación ([FEAT-05](#feat-05)), lo que se degrada es la confianza del dato, no la exposición
legal. Con este alcance, esos dos ítems **dejan de ser requisitos previos**.

**Matiz agregado el 2026-08-20.** Sigue siendo cierto para que el mecanismo funcione, pero no para
que el **porcentaje** signifique algo: desde que el instituto va a mirar ese número y actuar sobre
él, [SEC-06](#sec-06) pasa a ser lo que lo hace creíble. Está desarrollado más abajo, en "El tutor
que no entra nunca".

Pero conviene tener marcada la frontera: el ejemplo de la salida es una **autorización**, no un
aviso. Si el día de mañana el instituto empieza a apoyarse en estas firmas para permisos —que es la
deriva natural, porque el mecanismo ya va a estar ahí—, entonces sí vuelven a pesar SEC-06 y
FEAT-05, porque "el tutor autorizó" no se sostiene si la contraseña la sabe la oficina. Vale
decidirlo cuando pase, no ahora, pero sabiendo que va a pasar.

**Se firma un texto, no una fila.** Hay que guardar el **hash del contenido exacto** al momento de
firmar. Si después alguien edita la novedad, la firma no puede seguir apareciendo como válida sobre
un texto que el firmante nunca vio. Las dos salidas razonables: congelar la novedad al publicarla, o
versionarla y volver a pedir firma. Cualquiera sirve; no decidirlo es lo que no sirve.

**En informes esto ya es un agujero concreto (2026-08-19).** `StudentReport` tiene `publishedAt`,
pero **nada impide seguir editando las notas después de publicado**
([`prisma\schema.prisma:885`](../prisma/schema.prisma), `ReportEntry`). Hoy no molesta a nadie. Con
firma sí: el tutor firma, el profesor corrige un 7 por un 5, y queda una firma "válida" sobre un
informe que esa persona nunca vio. Hay que resolverlo en el mismo movimiento que la firma, no
después.

**Respuesta del instituto (2026-08-20): sí se puede editar, y sólo el ADMIN.** El razonamiento es que
los informes virtuales reemplazan a los físicos y el error humano existe; obligar a refirmar por una
nota mal cargada es desproporcionado. La edición posterior a la publicación queda restringida al
administrador, y **la firma del tutor sigue valiendo**.

**Por qué la restricción al ADMIN es lo que sostiene la firma.** Razonamiento del cliente, y es el
correcto: si cada profesor pudiera modificar las notas después de publicadas, la firma **sí** sería
un adorno. Que la corrección tenga que pasar por una sola persona es lo que la mantiene siendo un
hecho raro y deliberado en vez de la operación normal. El costo operativo es real y aceptado: el
profesor carga las notas pero no corrige su propio error una vez publicado, se lo pide al
administrador.

**Aun así hay que dejar el rastro.** Si el hash actual difiere del hash firmado, el informe se marca
como *modificado después de la firma*, con la fecha y quién lo hizo. **En esta primera etapa esa
marca se muestra sólo al instituto** (decisión del 2026-08-20); mostrársela al tutor se evalúa
después, si al instituto le parece bien. Lo importante es que **el dato se registra desde el día
uno** — lo que se posterga es la pantalla, no el registro, así que habilitarlo más adelante no exige
reconstruir nada hacia atrás. Por lo mismo, en esta etapa **al tutor que ya firmó tampoco se le
notifica** la modificación: el aviso que sí va es el de publicación.

**Quién firma cuando el destinatario es menor.** El instituto tiene alumnos de 6, 7 y 8 años
([BUG-01](#bug-01)). Para una autorización de salida el firmante tiene que ser **el tutor**, no el
alumno. Cada novedad necesita decir a quién le exige firma, y no puede ser "todos los destinatarios"
por defecto.

**Lo que el instituto realmente necesita no es la firma: es la lista de quién falta.** Ante una
salida, la pregunta operativa es "¿qué chicos pueden ir?"; ante un informe, "¿qué familias se
enteraron de las notas?". Eso es exactamente la devolución al instituto que pide el cliente: la
vista de firmas pendientes —por curso y período en informes, por novedad en el otro caso, con nombre
y curso— es el valor de esta ficha; la firma es el mecanismo. Conviene construir esa vista desde el
principio y no como agregado, y es donde aparece el aviso de que una firma no se parece a las
anteriores.

**Qué guardar, con cuidado.** Quién firmó, cuándo, el hash de lo firmado y el trazo. Sobre IP y
dispositivo hay una tensión real: [FEAT-04](#feat-04) tomó la posición de **no** guardarlos sin
necesidad concreta, porque son datos personales y hay menores. Acá sí hay necesidad —son parte de la
prueba—, así que la decisión es deliberada y hay que anotarla con la política de retención, no
arrastrarla por inercia. **El trazo sube ese escalón**: es un dato personal, y guardado con su
dinámica se acerca bastante a un dato biométrico de los tutores. Es el mismo terreno de
[ARQ-10](#arq-10) (auditoría de acciones del panel), que también advierte sobre no copiar datos
personales de más.

**El modelo apunta a un documento, no a una novedad.** El pedido original nombra "la novedad **o el
informe**", y con la decisión del 2026-08-19 el informe pasa a ser el primero de los dos. El modelo
no puede colgar de `Announcement`: necesita apuntar a "un documento" de tipo variable. Las pantallas
del módulo de informes son
[`ReportGradeSheet`](../src/app/courses/[id]/reports/[templateId]/ReportGradeSheet.tsx) (el docente
carga) y [`StudentReportViewer`](../src/components/reports/StudentReportViewer.tsx) (el tutor mira, y
es donde va la firma).

**Con cuántas firmas alcanza un informe.** Un alumno puede tener **varios tutores**:
[`GuardianStudentLink`](../prisma/schema.prisma) es de muchos a muchos y hasta guarda el vínculo
(madre, padre, tío). Entonces "el tutor firmó el informe" es ambiguo: ¿alcanza con que firme uno, o
el informe queda pendiente hasta que firmen todos? No es una sutileza — define qué significa
"pendiente" en la lista, que es el entregable de esta ficha. Y del otro lado está el alumno **sin
ningún tutor cargado**, para el que hoy no habría quién firme.

**Respuesta del instituto (2026-08-20): alcanza con que firme un tutor.** Cada informe tiene que
tener **al menos una** firma. Simplifica bastante: por informe el estado es binario —firmado o no—,
la lista de pendientes son los informes con cero firmas, y el porcentaje se calcula por tanda (curso
más período) y en general.

**El alumno mayor firma su propio informe. El corte es a los 20 (2026-08-20).** Hasta 19 inclusive
firma el tutor; de 20 en adelante firma el alumno y **no se le muestra la casilla del tutor**. El
motivo, que conviene tener escrito porque es lo que habría que revisar si algún día cambia: a los 19
el curso lo sigue pagando el tutor en la mayoría de los casos, así que la familia todavía está
mirando. Como **quién debe firmar se congela al publicar**, el que cumple años a mitad de año no le
cambia el estado a los informes ya publicados.

Consecuencia menor: el alumno de 20 o más que igual tenga tutores cargados **les sigue avisando** la
publicación —el aviso va al alumno y a los tutores—, sólo que la firma que cuenta es la de él.

Arrastra un detalle: `Student.birthDate` es
**opcional** ([`prisma\schema.prisma:129`](../prisma/schema.prisma)), así que hay alumnos sobre los
que la regla no se puede evaluar. No hace falta volver obligatoria la fecha, pero la regla sí
necesita una respuesta para ese caso: lo prudente es **tratarlo como menor** —firma el tutor— y que
la fecha faltante se vea en la lista de pendientes, para que alguien la cargue.

**Quién debe firmar se congela al publicar.** Mismo criterio que el hash del contenido, y por la
misma razón. Si la lista de firmantes se calcula en vivo, se mueve sola: un alumno cumple 18 en junio
y cambia quién le debía firmar el informe de marzo; se carga un tutor nuevo en agosto y aparece como
pendiente en un informe de marzo que nunca pudo ver. Al publicar el informe se resuelve **a quiénes
les toca firmar** y eso queda escrito.

### La pantalla del instituto (definida el 2026-08-20)

**Pantalla propia, para ADMIN y SECRETARY** —el grupo `INSTITUTE_ADMINS` que ya existe desde
[SEC-03](#sec-03)—, con los informes entregados: porcentaje de firmas por tanda y porcentaje general,
y desde ahí se entra al informe para ver quiénes faltan. Es el entregable de la ficha, no un
agregado. Notar que **editar el informe sigue siendo sólo del ADMIN**: la secretaría mira y persigue,
no corrige.

Dos precisiones sobre qué significan esos números, ahora que alcanza con un tutor:

- Por informe el estado es **binario**. El porcentaje sólo tiene sentido sobre un conjunto: "2º
  período, Upper-Intermediate: 18 de 24 firmados".
- Ahí van también las dos marcas que necesitan acción: informes **modificados después de la firma**, y
  alumnos **sin fecha de nacimiento**, que son los que no dejan resolver a quién le toca firmar.

**Al que no firma nunca lo persigue el instituto a mano, desde esta pantalla** (decisión del
2026-08-20). No hay recordatorio automático; si más adelante lo quieren, es trabajo aparte.

### Aviso de publicación (pedido el 2026-08-20)

Cuando el profesor publica el informe, el aviso tiene que llegarle **al alumno y a los tutores**. Es
barato: [`Notification`](../prisma/schema.prisma) ya existe con el mismo patrón `userId?` /
`studentId?`, más `type`, `read` y `link`. Alcanza con un tipo nuevo y una fila por destinatario
apuntando al informe. El mismo mecanismo sirve para avisar la modificación posterior a la firma.

### Decisiones nuestras (2026-08-20)

**No se guardan la IP ni el dispositivo.** Queda alineado con [FEAT-04](#feat-04) y saca del medio
toda la discusión de retención de esos datos.

**Retención del trazo.** Separar dos cosas que hoy suenan iguales: la **referencia** existe para
comparar y sirve mientras la persona siga firmando; las **firmas hechas** son el registro de quién
vio qué, y tienen que durar lo que dure el informe. Entonces: conservar siempre el hecho —quién,
cuándo, hash— y **soltar el trazo cuando deja de tener función**, al cortarse el último vínculo con
el instituto y con un año lectivo de gracia, para poder mostrar firmado un informe de diciembre
durante el año siguiente. Encaja con el borrado lógico del proyecto ([ARQ-05](#arq-05)): no se borra
la fila, se vacía el campo del trazo.

**Umbral del aviso de parecido.** El cliente delegó el criterio (2026-08-20), así que queda tomado
como sigue. El número no se puede elegir ahora sin inventarlo. Se guarda el
puntaje desde el día uno **sin mostrar nada**, y se mira la distribución con firmas reales antes de
fijar el corte. Dos criterios para cuando llegue el momento: comparar **contra el propio historial de
la persona** y no contra un número global —hay gente consistentemente irregular, y un umbral fijo la
castiga—, y **no marcar nada con menos de tres firmas previas**, porque no hay historia suficiente.

Y una decisión de producto: se muestra **una marca, no un porcentaje**. Un "72% de parecido" es un
número que se sobreinterpreta y sobre el que se empiezan a tomar decisiones que el dato no aguanta.
Por lo mismo **no va en las métricas generales**: el porcentaje de firmas es operativo y sirve; el
parecido promedio no significa nada y sólo invita a comparar familias.

**Secuencia: los trazos se guardan desde el día uno, la comparación va en una segunda pasada.** Es la parte con más ingeniería y la de menos valor de toda la ficha —el instituto ya sabe
quién vio, por el acuse—, y postergarla no cuesta nada porque la historia queda guardada igual. Lo
que sí conviene tener desde el arranque es mostrarle al tutor su firma anterior mientras firma, que
es lo que de verdad evita el círculo y el cuadrado.

### Alcance de la etapa 1

Con todo lo decidido entre el 2026-08-19 y el 2026-08-20, lo que entra es:

1. **Un firmable genérico**, apuntando a un documento de tipo variable, con firmante de dos lados
   (`userId?` / `studentId?`) y la firma de referencia colgada del perfil de quien firma.
2. **La firma en el informe del tutor**: dibuja el trazo, se le muestra al lado su firma anterior, y
   la primera vez se le avisa que ese trazo queda como su firma. Se guarda quién, cuándo, el hash del
   contenido y el trazo como puntos con tiempos. **Sin IP ni dispositivo.**
3. **Resolver y congelar al publicar** a quiénes les toca firmar: hasta 19 el tutor, de 20 el alumno,
   sin fecha de nacimiento se trata como menor.
4. **Tres estados por informe, no dos**: firmado, pendiente y **sin firmante** — este último para el
   alumno sin tutor cargado o cuya cuenta no puede entrar. Está desarrollado más abajo, en "El tutor
   que no entra nunca".
5. **La pantalla del instituto** (ADMIN y SECRETARY): porcentaje de firmas por tanda y general
   —calculado **sobre los que pueden firmar**, con los "sin firmante" contados al lado—, quién falta,
   informes modificados después de la firma, y alumnos sin fecha de nacimiento.
6. **"Entregado por otro medio"**, un estado propio que carga el instituto para la familia que no va
   a entrar nunca. Aprobado por el cliente el 2026-08-20; **falta el visto bueno del instituto**, que
   es quien lo va a usar.
7. **Restringir al ADMIN** la edición del informe publicado, y marcarlo como modificado cuando el
   hash deja de coincidir.
8. **El aviso de publicación** al alumno y a los tutores, con `Notification`.
9. **Guardar el puntaje de parecido sin mostrarlo**, para poder calibrar el umbral más adelante.

Queda para la etapa 2: las novedades ([FEAT-08](#feat-08)), la comparación de firmas visible, la
marca de modificación para el tutor, y los recordatorios automáticos a quien no firma.

**Antes de empezar conviene medir cuántos tutores entraron alguna vez** — está el porqué más abajo.
Es una consulta de una sola vez y cambia la expectativa sobre lo que el porcentaje va a mostrar el
primer mes.

### El tutor que no entra nunca (2026-08-20)

El instituto respondió que el alumno sin tutor cargado se va a ver como no firmado y que ellos
decidirán si insisten, y agregó un hecho: **hay tutores que no van a entrar nunca a la plataforma**.
Eso obliga a separar dos situaciones que la respuesta trata igual:

| | Qué significa | Qué se hace |
|---|---|---|
| **Sin tutor cargado** | No hay `GuardianStudentLink`. Nadie *puede* firmar | Cargar al tutor. Insistir no aplica: no hay a quién |
| **Tutor cargado que no entra** | Hay quién puede firmar y no lo hace | Perseguirlo, que es lo que el instituto quiere hacer |

**Por eso el estado es de tres valores, no de dos: firmado, pendiente y sin firmante.** El porcentaje
se calcula **sobre los que pueden firmar**, y los "sin firmante" se muestran al lado, contados
aparte: *"18 de 22 firmados (82%), 2 sin firmante"*. Si se mezclan, un curso al 60% no distingue
entre cuarenta por ciento de familias desatentas y cuarenta por ciento de cuentas que no funcionan
—que se resuelven con acciones distintas y de personas distintas—, y un número que no se puede
accionar termina ignorado.

**Antes de construir esto conviene medir cuántos tutores entraron alguna vez.** Es lo que decide si
la ficha entrega lo que el instituto espera: con la mayoría de los tutores adentro, esto es una nota
al pie; con una minoría, el porcentaje de la etapa 1 va a ser sobre todo ruido y la prioridad real
pasa a ser que los tutores entren. Hoy el sistema no lo registra —eso es [FEAT-04](#feat-04)—, pero
hay un atajo para medirlo una vez: **contar los tutores que todavía tienen la contraseña por defecto**
`Modern2026` ([SEC-06](#sec-06)), que son exactamente los que nunca entraron a cambiarla.

**Y el número crea un incentivo que antes no existía.** El tutor que nunca entró es justo el que
sigue teniendo una contraseña que está escrita en el código y es igual en todos los institutos. Con
una casilla de "leído" a nadie le importaba; con un porcentaje que el instituto mira, "le firmo yo
que ya le avisé" es una tentación de cinco segundos y completamente indetectable. Dos consecuencias: **el
porcentaje no debería convertirse en una meta con la que se mida a la secretaría** —es una lista
operativa, no un indicador de desempeño—, y **[SEC-06](#sec-06) deja de ser sólo higiene**: es lo que
hace creíble el número. No bloquea la etapa 1, pero sí conviene resolverlo antes de que alguien tome
decisiones mirando ese porcentaje.

**Opción para ofrecerle al instituto: registrar "entregado por otro medio".** Para la familia que no
va a entrar nunca, el informe en papel o el aviso en la puerta sigue existiendo. Si el sistema no
tiene dónde anotarlo, esos informes quedan en rojo para siempre —y el número se empieza a ignorar— o
alguien termina firmando por el tutor. Un estado propio, cargado por el instituto y visible como lo
que es, es más honesto que cualquiera de esas dos salidas. Queda a decisión de ellos.

Las preguntas abiertas de [FEAT-08](#feat-08) —a quién le llega una novedad, si caduca, quién la
publica— son sobre **novedades, no sobre informes**, y no bloquean nada de esto: son de la segunda
etapa.

---

<a id="feat-10"></a>
## FEAT-10 · Seguimiento visual de las cuotas eliminadas · **P2**

**Origen.** Sale de [SEC-03](#sec-03), al definir que la secretaría puede borrar cuotas. Ahí se le
agregó a `deleteFeeAction` el rastro que le faltaba, pero quedó **invisible**: se escribe como asiento
de importe 0 en `Transaction` y la tabla del libro mayor filtra esos movimientos — filtro que
[FIN-11](#fin-11) decidió mantener, porque esa pantalla es la caja. Hoy el registro sólo se consulta
desde la base.

**Lo que falta es que el instituto lo pueda mirar sin entrar a Supabase.**

**Decidido con el cliente el 2026-08-13:**

| | |
|---|---|
| **Motivo** | **Obligatorio.** Sin motivo queda una lista de fechas, no un rastro. Es más exigente que las anulaciones, donde el motivo es opcional — y es a propósito: acá no queda la fila original para mirar |
| **Dónde** | **Pantalla propia.** No en la ficha del alumno: el seguimiento es para revisar el conjunto, no para resolver un caso puntual |
| **Quién** | **Sólo ADMIN.** La secretaría borra, pero el seguimiento es herramienta de control del dueño |

**El registro necesita su propia tabla, no la fila en `Transaction`.** Esa fila fue un rodeo: era el
único lugar del sistema con `operatorId`. Para sostener una pantalla no alcanza, por tres razones:

- El libro mayor son movimientos de dinero y una cuota impaga borrada no lo es.
- Listarla obligaría a filtrar por el **texto** de la descripción (`like 'Cuota eliminada%'`), que es
  una base frágil para una pantalla.
- No tiene dónde guardar el motivo, que es justamente lo que se decidió pedir.

**Forma propuesta.** Una tabla `FeeDeletion` con la **foto** de la cuota —la fila original ya no
existe cuando esto se escribe—: instituto, alumno (id y nombre), tipo, año, mes, importe, curso si la
cuota tenía inscripción, más `reason`, `deletedById` y `deletedAt`. Índice por
`[instituteId, deletedAt]`, que es como lo lista la pantalla.

**Alcance del cambio:**

1. La migración y el modelo.
2. `deleteFeeAction` pasa a recibir `reason` y a escribir en `FeeDeletion` en vez de en
   `Transaction`. Sigue compartiendo transacción con el `delete`.
3. [`PendingFeeActions`](../src/app/payments/debtors/PendingFeeActions.tsx) —el único lugar desde
   donde se borra, en la pantalla de deudores— pide el motivo. Hoy usa un `confirm()` pelado; el
   componente ya tiene un modo de edición en línea del que copiar la forma.
4. La pantalla, con fecha, alumno, cuota, importe, operador y motivo, filtrable por período.
5. El acceso a la pantalla desde `/payments`, visible sólo para admin.

**Deuda que deja el orden en que se hizo.** El rastro en `Transaction` sale con
[SEC-03](#sec-03) y se reemplaza acá. Si se llega a borrar alguna cuota entre un despliegue y el
otro, esos registros quedan en `Transaction` y **no van a aparecer en la pantalla nueva**. Son pocos
o ninguno, y se pueden migrar a mano con el `like` de la descripción — pero hay que acordarse, o
mirar primero si hay alguno.

**Relacionado.** [ARQ-10](#arq-10) (auditoría de las acciones del panel) es este mismo problema
generalizado. Esta ficha es el primer caso concreto y conviene mirarla como el primer ladrillo: si
ARQ-10 se encara después, `FeeDeletion` debería poder absorberse en el modelo general en vez de
quedar como una isla.

### Resuelto — 2026-08-17 · `75fc4d7`

Los cinco puntos del alcance, con la migración `20260817120000_add_fee_deletion`, que **sólo crea la
tabla**: no borra ni modifica ninguna fila.

| | |
|---|---|
| **El modelo** | `FeeDeletion`, la foto: instituto, alumno (id **y** nombre), tipo, año, mes, importe, curso si la cuota tenía inscripción, `reason`, `deletedById` y `deletedAt`. Índice `[instituteId, deletedAt]` |
| **La acción** | `deleteFeeAction(feeId, reason)` escribe en `FeeDeletion` **en vez de** en `Transaction`, en la misma transacción que el `delete`. Motivo obligatorio, tope de 200 caracteres |
| **El motivo** | Se pide **en la tarjeta de la cuota**, con la forma del modo de edición en línea que el componente ya tenía |
| **La pantalla** | `/payments/deletions`, `requireRole(["ADMIN"])` con `redirect("/dashboard")` — el mismo patrón de `/payments/payroll`, que es el que SEC-03 verificó. Filtra por período sobre `deletedAt`, y arranca **sin filtro** a propósito: borrar una cuota es raro y un mes vacío no se distingue de una pantalla que no anduvo |
| **El acceso** | Botón «Cuotas Eliminadas» en `/payments`, escondido para la secretaría |

**Sin claves foráneas, a propósito.** Ni a `Student`, ni a `Course`, ni a `User`. La fila tiene que
sobrevivir a que después se borre o se purgue lo que nombra, que es exactamente el caso para el que
se escribe — y `purgeStudentAction` borra alumnos de verdad. Por eso el alumno va con su id y con su
nombre: el id para llegar a la ficha, el nombre para que la pantalla siga diciendo algo si el id ya
no lleva a ningún lado.

**El `confirm()` no se reemplazó sólo por el campo.** El cartel del navegador decía *"¿Eliminar esta
cuota/matrícula no pagada permanentemente?"*, sin nombrar al alumno, el período ni el importe: no
confirmaba nada, porque no dejaba ver cuál se estaba por borrar. El formulario nuevo vive dentro de
la tarjeta, con esos tres datos a la vista arriba del campo.

**Verificado por pantalla el 17/08**, contra la base de desarrollo y con el resultado anotado antes
de apretar:

- Con el campo **vacío**, el botón de confirmar **no borra**: sale «Escribí el motivo: sin él queda
  una fecha, no un rastro» y la cuota sigue en la lista.
- Borrada la **Matrícula 2026 de `estudiante uno 2233`, $15.000** con motivo *"duplicada con la carga
  inicial de febrero"*: `Fee` pasó de 10 a 9, `FeeDeletion` de 0 a 1 con la foto completa —curso
  `Adolescents+ M-J` incluido— y el operador correcto.
- **Los asientos `'Cuota eliminada%'` en `Transaction` siguieron en cero**, que es la mitad que
  comprueba que el rodeo viejo dejó de escribirse. En el libro mayor de `/payments` no apareció nada.
- La pantalla mostró **«1 cuota eliminada · $15.000 de deuda dada de baja»** con fecha, alumno,
  cuota, curso, importe, operador y motivo. Filtrada por **2026 · Julio** queda vacía con su cartel;
  por **2026 · Agosto** vuelve la fila.
- **Como secretaría** —cambiándole los roles al usuario de prueba en la base de desarrollo, y
  restaurados al terminar—, `/payments/deletions` **escribiendo la URL redirige al dashboard**, y en
  `/payments` el botón no está.

**La base de desarrollo quedó como estaba** después de la primera tanda: la cuota se restauró con su
mismo id y la fila de `FeeDeletion` de la prueba se borró. De las pruebas del dueño quedaron dos
cuotas borradas —la matrícula de `abril dukard98` y la de `pilar melczarski`, $10.000 cada una— con
sus dos registros. **Son sólo de la base de desarrollo.**

**Las dos guardas que faltaban, ejercitadas por el dueño el mismo 17/08.** Ninguna de las dos la tocó
este cambio, pero pasan por la función que sí se tocó:

- **Una cuota con pagos se rechaza.** Sobre la Cuota Abril 2026 de `zoe grimalt`, que tiene
  `paidAmount = 0` y **una fila de `Payment` anulada** —así que la interfaz sí le muestra el tacho y
  el único que la frena es el servidor—: salió «No se puede eliminar una cuota que ya tiene pagos.
  Anule los pagos primero.» y la cuota siguió en la lista. Es el criterio de [FIN-06](#fin-06): un
  pago anulado deja la fila viva.
- **La secretaría borra, y el dueño ve quién fue.** Con `secretaria@test.com` —una secretaria de
  verdad, no un usuario con los roles cambiados a mano— se borró la Cuota Abril 2026 de
  `pilar melczarski` con motivo «beca de agosto», y `/payments/deletions` escribiendo la URL la
  mandó al dashboard. Entrando después como admin, la fila figura con **`Secretaria Uno`** en la
  columna «Eliminó». Es el punto entero de esta ficha, ejercitado de punta a punta.

**Desplegado en stage el 17/08.** La migración se aplicó sola con el build, a las 01:06 UTC, y **la
base de producción no se enteró**: su última migración sigue siendo `20260811183000_add_ai_usage`,
del 13/08, y `FeeDeletion` no existe ahí. Es la tercera vez que el freno de `vercel.json` aguanta un
push con una migración adentro.

**La ventana de huérfanos quedó en cero, como se buscaba.** La consulta 5 del lote midió el 16/08
contra producción: cero filas `'Cuota eliminada%'`. Y en producción [SEC-03](#sec-03) todavía no
está —sale con T1—, así que el asiento viejo nunca llegó a escribirse ahí. Si alguna cuota se borra
en stage entre este commit y el despliegue, ese registro queda en `Transaction` y **no aparece en la
pantalla nueva**; se migra a mano con el `like` de la descripción.

**Lo que no entró.** [FIN-23](#fin-23) deja anotado que `removeStudentFromCourseAction` también borra
cuotas físicamente y que, cuando exista esta tabla, ese borrado debería escribir acá con motivo
obligatorio. Es la salida recomendada de aquella ficha y sigue abierta: son tres decisiones que
exceden ésta.

---

<a id="feat-11"></a>
## FEAT-11 · Métricas de uso de la plataforma para el administrador · **P3** · 🗣️ Pedido del cliente

**Pedido (2026-08-15).** Que el administrador del instituto pueda ver métricas de usabilidad de la
aplicación.

**Esto y [FEAT-04](#feat-04) son la misma pregunta con dos alcances**, y conviene decidirlos juntos o
fusionarlos. FEAT-04 pide saber **quiénes entraron**, sobre todo los tutores, y es un pedido concreto
con una respuesta concreta. Esto es más amplio: qué se usa, cuánto y por quién. Hacer FEAT-04 por su
cuenta y después esto significa construir dos veces el mismo registro.

**Lo que hay que definir antes de tocar código, y no es técnico.** "Métricas de usabilidad" no es una
funcionalidad: son N funcionalidades hasta que alguien dice cuáles tres o cuatro preguntas quiere
contestar. Las candidatas, por lo que ya pidió el instituto:

- ¿Qué tutores no entraron nunca? (es literalmente FEAT-04)
- ¿Cuántos alumnos practican, y con qué frecuencia?
- ¿Qué docentes cargan asistencia y notas al día?
- ¿Qué pantallas no usa nadie?

Las tres primeras se contestan con datos que **ya existen** en la base — sesiones de práctica,
`Attendance`, `Grade` — y no necesitan registro nuevo, sólo consultas y una pantalla. La última exige
instrumentar la aplicación, que es otro trabajo y otro costo. **Conviene separar las dos mitades**: la
primera es barata y es la que el cliente pidió; la segunda es un proyecto.

**Ampliación (2026-08-20): el cliente quiere un panel de "uso del sistema".** Es la pantalla que
unifica lo que hoy está repartido en cuatro fichas —esta, [FEAT-04](#feat-04), [ARQ-12](#arq-12) y
[ARQ-13](#arq-13)—, y confirma por el otro lado lo que ya decía arriba: conviene decidirlas juntas.
Nombró dos métricas concretas:

1. **Ingresos por día, separados en tutores, profesores y alumnos.** Es FEAT-04 con una dimensión de
   tiempo. Hoy no se registra nada: hace falta un evento por ingreso. El lugar natural es el
   `events.signIn` de NextAuth, uno solo para toda la aplicación. Y vuelve a aparecer el firmante de
   dos lados: profesores y tutores son `User`, los alumnos son `Student`, así que el registro necesita
   `userId?` / `studentId?` como ya hacen `Notification` y `ThreadParticipant`. **Sin IP ni
   dispositivo**, por la posición de FEAT-04.
2. **Cuántos usuarios tienen la app instalada y con qué versión.** Ver la nota de PWA en
   [ARQ-13](#arq-13): la segunda mitad se puede, la primera tiene un límite que conviene conocer
   antes de prometer el número.

`recharts` ya está en el proyecto, así que los gráficos del panel no suman dependencia.

**Notas prácticas para el panel (se trabaja el fin de semana del 2026-08-23).**

**Un solo registro de ingreso resuelve las tres fichas.** Si el evento guarda, además de quién y
cuándo, **el rol activo, si venía corriendo instalada y qué versión traía**, entonces FEAT-04,
ARQ-13 y esta ficha salen todas del mismo lugar. Es exactamente lo que ARQ-13 pedía —"sólo tiene
sentido si antes existe FEAT-11"— y evita construir dos registros paralelos. Campos: firmante de dos
lados (`userId?` / `studentId?`), fecha, rol activo, modo de visualización, versión. **Sin IP ni
dispositivo.**

**Lo único que apura de verdad es empezar a registrar.** Las métricas de práctica, asistencia y notas
salen de datos que ya están en la base y se pueden reconstruir hacia atrás el día que se haga la
pantalla. Los ingresos no: lo que no se registre se pierde. Conviene enganchar `events.signIn` de
NextAuth aunque el panel venga después.

**Qué se puede saber de la instalación, y qué no.** Está desarrollado en [ARQ-13](#arq-13), pero el
resumen para no prometer de más: **no se puede saber quién tiene la app instalada**. Se puede saber
quién **entró desde la app instalada**, y contar instalaciones nuevas con el evento `appinstalled`.
Las desinstalaciones son invisibles. La métrica hay que titularla por lo que mide.

**La versión necesita [ARQ-12](#arq-12) antes**, aunque sea la parte mínima: hoy `package.json` dice
`1.0.2` y nada lo lee, y desde el cliente no se puede leer — hay que inyectarla en tiempo de build.

**Ojo con el par `userId?` / `studentId?` de este registro**: es uno de los cinco lugares que motivan
[ARQ-15](#arq-15). Se construye igual —es una tabla de sólo agregar filas y migrarla después es
cambiar una columna—, pero conviene saber que está en esa lista.

### Decisión (2026-08-22): las ocho métricas, cerradas

**Lo que esta ficha pedía definir antes de tocar código quedó definido.** Ocho métricas, dos zonas,
un selector de período y una fase previa de registro que es lo único que apura.

**Lo primero que sale del alcance es la versión de la aplicación por usuario.** No es un pedido del
cliente: salió de una idea nuestra. Entonces [ARQ-13](#arq-13) no entra en la primera versión del
panel y [ARQ-12](#arq-12) deja de ser prerrequisito de nada de acá. Lo que el cliente sí quiere, y
reemplaza a eso en la lista, es **ver los últimos ingresos de los tutores** para saber si miran las
asistencias y las notas.

**Las cinco primeras se calculan hacia atrás sin límite.** Es lo que hace que el panel no nazca
vacío: el día que se abra por primera vez ya tiene todo 2026 adentro. Sólo las tres de actividad
arrancan en cero.

| # | Métrica | Definición exacta | Sale de | Zona |
|---|---|---|---|---|
| 1 | **Clases sin parte de asistencia** | Universo: `Lesson.status = ACTIVE`, `date <= hoy`, **de cursos con al menos una inscripción activa**, tipos `CLASS`, `TP` y `EXAM`. Tres estados: completa (filas ≥ inscriptos), **incompleta**, sin ningún registro | `Attendance` | Período |
| 2 | **Marcas con el escáner QR** | % de filas `Attendance` con `source = QR` sobre el total del período, más cursos que lo usaron | `Attendance.source` (nueva) | Período |
| 3 | **Cursos con práctica publicada** | `LessonPractice` con contenido en **al menos uno** de los tres campos y `isPublished`. Más el número que importa: **clases publicadas con cero `PracticeSession`** | `LessonPractice`, `PracticeSession` | Período |
| 4 | **Alumnos y su tutor** | Cinco estados sobre alumnos `ACTIVE`: con cuenta vinculada · **con datos en la ficha y sin cuenta** · sin ningún dato · mayor de 20 (firma solo) · sin `birthDate` | `GuardianStudentLink`, `Student.guardian1*`, `birthDate` | Hoy |
| 5 | **Tutores con cuenta** | `User` con rol `GUARDIAN` del instituto, partido en con alumno vinculado / **sin ninguno** | `User`, `GuardianStudentLink` | Hoy |
| 6 | **Cuentas con la contraseña por defecto** | Las que conservan una de las contraseñas que reparte el sistema, separadas en alumnos, tutores y profesores | Pasada única + columna, sostenida en cada escritura de contraseña | Hoy |
| 7 | **Personas activas por día** | Personas distintas con actividad ese día, por rol activo | Registro nuevo | Período |
| 8 | **Últimos ingresos de los tutores** | Lista, no gráfico: tutor, alumnos, último ingreso, qué miró, y **"nunca"** como estado propio | Registro nuevo + portal del tutor | Período |

#### Las trampas, una por métrica

Todas verificadas contra el código el 2026-08-22, y cada una cambia el número:

- **Un curso sin alumnos figura "sin parte" para siempre**, por eso el universo los excluye.
- **`Attendance.createdAt` sobrevive al regrabado** a propósito (está comentado en
  [`attendance/actions.ts`](../src/app/courses/[id]/lessons/[lessonId]/attendance/actions.ts)), así
  que sirve para medir la demora de carga y no sólo la existencia del parte.
- **El escáner deja filas sueltas y sólo `PRESENT`.** Una clase escaneada y nunca cerrada por el
  docente cae en "incompleta", que es el caso que más vale ver y con dos estados se pierde.
- **La marca del QR hoy es un texto en `notes`** y no aguanta como fuente de la métrica — ver
  [BUG-12](#bug-12). De ahí sale la columna `source`.
- **`LessonPractice` puede existir vacía** (`speakingPhrases: []` y los otros dos en `null`). Contar
  la fila es contar una práctica que no existe.
- **El alumno de 20+ no necesita tutor** ([FEAT-09](#feat-09)). Contarlo como faltante inventa
  trabajo, y el que no tiene `birthDate` no se puede clasificar: por eso son cinco estados.
- **Una persona puede ser tutora y profesora** ([SEC-01](#sec-01)). Definir si el panel cuenta
  personas o roles, y decirlo en el título.
- **La contraseña por defecto no es una consulta SQL.** Se guardan con `bcrypt.hash(password, 10)` y
  salt aleatoria ([`students/[id]/actions.ts:318`](../src/app/students/[id]/actions.ts)), así que hay
  que comparar fila por fila: con ~181 usuarios y varios candidatos por cuenta son decenas de
  segundos, imposible al cargar la pantalla. Ver abajo la decisión del 2026-08-24, que además corrige
  qué significa el número.
- **Mirar no deja rastro.** Ni la asistencia ni las notas escriben nada cuando el tutor las lee, así
  que la pregunta del cliente no tiene respuesta con los datos de hoy. Ver la fase 0.

#### La forma del panel

- **Pantalla propia y sólo para el `ADMIN`.** No entra en
  [`dashboard/page.tsx`](../src/app/dashboard/page.tsx), que ya son 775 líneas y siete consultas en
  serie, y que además contesta otra pregunta —"cómo va el instituto"— que se mira en otro momento. La
  secretaria queda afuera porque **aparece adentro de las métricas**, con el criterio de
  [SEC-03](#sec-03).
- **Dos zonas rotuladas, porque la mitad de las métricas no tiene período.** "Estado de hoy" no
  obedece al selector y lo dice; "Actividad del período" sí. Si conviven bajo el mismo control, es el
  problema de los dos relojes de finanzas otra vez.
- **Un solo reloj.** "Últimos 30 días" es una opción del mismo selector que el mes, no un modo
  aparte, y todos los mosaicos de la zona de abajo obedecen lo que esté elegido. El selector de mes
  entra desde el principio: agregarlo después es reescribir todas las consultas.
- **Fecha de piso por métrica, y "cero" nunca se muestra como dato.** Un mosaico sin historia dice
  *"Midiendo desde el 22/8"*, no `0`. Mismo dato, impresión opuesta: uno se lee como un sistema que
  empezó a medir y el otro como uno que no anda.

  | Métrica | Hasta dónde llega hacia atrás |
  |---|---|
  | 1, 3, 4, 5 | Todo el historial |
  | 6 | Todo el historial, vía la pasada única |
  | 2 | Desde la migración. Lo anterior, aproximado |
  | 7, 8 | Desde que se registre. Antes, nada |

- **Cada número lleva a una lista de nombres.** Un número que no se puede clicar no se acciona y
  termina ignorado — el mismo razonamiento que ya hizo [FEAT-09](#feat-09) con las firmas.
- **Listas de pendientes, no puntajes de personas.** *"7 clases sin parte, la más vieja del 3/8"* se
  convierte en un mensaje; *"profesor X: 72%"* se convierte en una discusión. Vale para todo el
  panel, y generaliza lo que FEAT-09 ya decidió para el porcentaje de firmas.
- **El gráfico diario de activos no se muestra el primer mes.** Va a subir solo mientras la gente
  vuelve a iniciar sesión, y eso se lee como crecimiento de uso cuando es la instrumentación
  llenándose. Hasta los 30 días, el contador con su fecha de piso.

**Fuera del panel, y a propósito:** pantallas más visitadas —es la mitad que esta misma ficha llama
"un proyecto", y con un instituto la respuesta ya se sabe—, tiempo de permanencia, y cualquier
ranking de personas con porcentaje. El consumo de IA es de [PED-10](#ped-10) y es del superadmin;
entra acá el día que el plan tenga tope y le afecte al instituto ([PED-07](#ped-07)).

**El mockup** de las dos pantallas —el panel y el detalle de tutores— está en
https://claude.ai/code/artifact/72db505b-75dd-4710-945f-17314f0dd408

#### Fase 0 · lo único que apura, y no tiene pantalla

**Lo que no se registre se pierde**; las otras cinco métricas se reconstruyen el día que se haga la
pantalla. Cuatro cosas chicas, ninguna con interfaz, todas acumulando desde que se despliegan:

> **Estado al 2026-08-24.** Los tres puntos están hechos y verificados — `9a8e02a` (el registro de
> actividad) y `6e5f560` (la columna `source`). El cuarto que había acá salió de la fase, por la
> decisión del 2026-08-24 que está más abajo: no acumula nada, así que no apura. **Nada de esto junta
> datos todavía**: el registro empieza a llenarse recién cuando está desplegado, así que el reloj
> sigue corriendo hasta que llegue a producción.

1. **`lastSeenAt` dentro de la compuerta de 5 minutos que ya existe.** El callback `jwt` de
   [`auth.ts:97`](../src/lib/auth.ts) relee los roles cada `ROLES_REFRESH_MS` mientras la persona usa
   la aplicación: ahí ya hay una consulta con la frecuencia justa. Escribir la actividad en esa misma
   compuerta cuesta **una sentencia cada 5 minutos por persona activa**, sin middleware, sin tocar
   `getAuthContext` y sin instrumentar pantallas. Y mide **uso**, no inicios de sesión — que es lo
   que arregla la trampa del JWT de 30 días de [FEAT-04](#feat-04). Dos límites: la compuerta
   **excluye a los alumnos** a propósito (su rol no cambia nunca), así que necesitan su propio punto;
   y no dice *qué* miró la persona.
2. **Tres líneas en el portal del tutor** — [`guardian/dashboard`](../src/app/guardian/dashboard/page.tsx),
   [`guardian/academics`](../src/app/guardian/academics/page.tsx) y
   [`guardian/payments`](../src/app/guardian/payments/page.tsx) — que registren tutor, día y sección.
   Es lo que contesta la pregunta literal del cliente, y **no es "instrumentar la aplicación"**: es
   instrumentar las tres pantallas donde vive la pregunta.
3. **La columna `Attendance.source`**, con el relleno del pasado desde `notes` y sacando esa marca
   del campo, que es [BUG-12](#bug-12).
Había un cuarto punto —la pasada de contraseñas por defecto— que salió de esta fase. Ver abajo.

### Decisión (2026-08-24): la métrica 6 mide contraseñas, no ingresos

**La métrica 6 estaba mal titulada, y el título le prometía algo que no puede dar.** "Cuentas que
nunca se usaron" se calculaba como "conserva la contraseña inicial", y esa inferencia sólo corre para
un lado:

- Si nunca entró → seguro conserva la contraseña inicial. ✅
- Si conserva la contraseña inicial → **puede haber entrado todos los días.** ❌

Verificado en el código el 2026-08-24: **no existe ninguna obligación de cambiar la contraseña.** No
hay `mustChangePassword`, ni vencimiento, ni aviso, ni recuperación. Y cuando nada obliga, casi nadie
cambia. El número no era un conteo sino un **techo**, y un techo tan flojo que el mosaico podía
marcar 150 con una respuesta real de 12. Peor todavía: el reset manual del instituto vuelve a dejar
la contraseña en una de por defecto, así que alguien que entró, la cambió, se la olvidó y pidió que
se la restablezcan volvía a contar como "nunca entró".

**La decisión del instituto es no mostrar ese dato.** Prefiere que el panel conteste quién entró y
quién no **desde que el sistema mide**, aunque eso empiece vacío y sólo mire hacia adelante, antes que
mostrar un número que se desarma con una sola pregunta. Es un cliente solo y sabe que esto se está
construyendo. El argumento es de credibilidad y vale para todo el panel: un número que se cae con una
pregunta no cuesta ese número, cuesta la confianza en los otros siete.

**Lo que sí mide bien se queda, con su nombre verdadero: cuántas cuentas conservan la contraseña que
les dio el sistema**, partido en alumnos, tutores y profesores. El instituto lo quiere ver. Es un
número de seguridad y no de uso, no promete nada sobre ingresos, y es exactamente el trabajo pendiente
de [SEC-06](#sec-06).

**Y se cae la dependencia con [FEAT-05](#feat-05).** Lo único que obligaba a correr la pasada antes
era congelar el techo de "nunca entró" antes de que la gente cambiara contraseñas en masa. Sin esa
lectura no hay nada que congelar: el número tiene que **bajar** cuando alguien cambia su contraseña,
porque bajar es justamente lo que significa que el problema se está resolviendo. FEAT-05 puede
arrancar cuando se quiera, sin nada de esta ficha adelante.

#### Cómo se calcula, corregido

**Son siete valores por defecto y no tres**, y la ficha original sólo miraba los de alta.
[SEC-06](#sec-06) los lista todos; los de **reset** cuentan igual, porque una cuenta reseteada queda
tan abierta como una recién creada:

| Grupo | De alta | De reset |
|---|---|---|
| Alumnos | `estudiante123` | el propio DNI, o `lingua1234` si no tiene |
| Tutores | `Modern2026` | `tutor1234` |
| Profesores | **ninguno** — el admin la tipea al crear la cuenta | `docente1234` |

`lingua1234` ([`students/[id]/actions.ts:138`](../src/app/students/[id]/actions.ts)) no estaba en la
lista de [SEC-06](#sec-06), y es el caso que más importa de los tres del alumno: cae justo sobre los
que no tienen DNI cargado.

**Los profesores sólo se pueden detectar por el reset**, y conviene saberlo antes de leer el número:
un profesor cuya cuenta se creó con una contraseña floja elegida por el admin no aparece acá. El
mosaico cuenta lo que el sistema repartió, no lo que es débil. Los preinscriptos (`inscripcion123`)
siguen fuera: todavía no son usuarios.

**La pasada llena el pasado; las escrituras la sostienen.** Una sola pasada compara fila por fila
—decenas de segundos, y por eso no puede vivir en la pantalla— y deja el resultado en una columna.
De ahí en adelante **no hace falta volver a comparar nunca**: los seis lugares que escriben una
contraseña ya saben cuál están escribiendo, así que prenden o apagan la bandera de una. Es lo que
hace que el número siga siendo verdad sin ninguna pasada periódica.

**Este número es el que le da sentido a [SEC-11](#sec-11)**, que obliga a cambiar la contraseña por
defecto en el primer ingreso: el mosaico deja de ser un diagnóstico y pasa a ser la barra de avance
de ese despliegue, y su final natural es cero.

#### Métrica 6 · **hecha** (2026-08-25)

Commit `858cd06`, migración `add_default_password_flag`. La columna `hasDefaultPassword` en `User` y
`Student`, el catálogo en [`defaultPasswords.ts`](../src/lib/defaultPasswords.ts), la pasada por
lotes con su botón, el mosaico y el listado en `/dashboard/usage/contrasenas` con los cuatro grupos
como filtro.

**Eran diez sitios de escritura y no seis.** Faltaban el alta de administrador de instituto
([`admin/actions.ts`](../src/app/admin/actions.ts)) y el repositorio del superadmin. Ninguno compara
hashes: cada uno ya sabe qué contraseña escribe.

**Dos cosas salieron de medir y no de estimar**, y las dos cambiaron el código:

- `bcrypt.compare` con coste 10 tarda **~137 ms**, no los ~65 supuestos. El lote bajó de 25 a 12.
- El lote pedía 12 alumnos **y** 12 usuarios en paralelo, o sea el doble del presupuesto. Ahora
  comparten el lote y se piden en serie.

**Verificado por pantalla el 2026-08-25** contra una consulta de control que prueba *todos* los
candidatos e informa cuál coincidió, en vez de cortar en el primero: 294 cuentas a revisar, y el
resultado **6 = 3 alumnos + 2 tutores + 0 profesores + 1 administración**. Los orígenes: 2 por el
propio DNI, 1 de `estudiante123`, 2 de `Modern2026`, 1 de `admin123`. Los filtros del listado también.

**Lo que la pantalla todavía no resuelve bien:** en el grupo de alumnos, la columna de teléfono es la
del alumno, y a quien hay que llamar para que un chico de siete años cambie su contraseña es al
tutor. No es un error del número, es que esa fila no lleva a quien puede accionarla.

### Decisión (2026-08-24): la métrica 8 se queda como está, con el rastro indirecto

Al revisar la métrica 6 apareció la pregunta de si la 8 tiene el mismo problema: también muestra
"Nunca" cuando no encuentra rastro, y la ausencia de rastro no prueba que nadie haya entrado. **Se
queda como está**, y la diferencia con la 6 es la que decide:

- **El error de la 6 no se corregía solo**, y encima empeoraba: cada persona que cambiaba su
  contraseña se iba del conteo sin que eso dijera nada sobre si entraba.
- **El de la 8 se corrige solo, y rápido.** Cada ingreso escribe en el registro, así que el rastro
  indirecto se reemplaza por uno real en cuestión de semanas, sin que nadie haga nada.

Y la pantalla ya distingue las dos cosas sin cartel: **el rastro real trae los distintivos de "qué
miró" y el indirecto no**, porque `sections` sólo lo escribe el registro. El dato sin distintivos es
el que se levantó de la base para que la métrica no naciera vacía, y así se le explica al instituto.

**La forma del registro.** Una fila por persona y por día, no por evento: acota el crecimiento sin
depender de con qué frecuencia se escriba, y no obliga a decidir la retención antes de empezar.

```
subjectType  "USER" | "STUDENT"
subjectId    id suelto, como AiUsage
instituteId  ← lo que a AiUsage le falta y le impide agregar por instituto (PED-10)
day          fecha
role         rol activo de ese día
logins       contador
lastSeenAt   última actividad de ese día
@@unique([subjectType, subjectId, day])
```

Es la forma de `AiUsage` que el proyecto ya aceptó —un contador con `subjectId` suelto—, y por eso
esquiva [ARQ-15](#arq-15) en vez de sumarse a su lista, al revés de lo que anotaba esta ficha más
arriba. Cota superior con los números de hoy: 580 personas × 200 días lectivos ≈ 116.000 filas al
año, y eso suponiendo que entren todos todos los días.

**Sección aparte, y medir antes:** si además se quiere actividad más fina que la compuerta de 5
minutos, eso sí cuesta una sentencia por request y hay que medirlo contra [ARQ-02](#arq-02) y
[ARQ-11](#arq-11) antes de escribirlo, no suponerlo.

#### Fase 1 · la pantalla · **hecha** (2026-08-24)

`/dashboard/usage`, sólo `ADMIN`, con entrada por un botón en el encabezado del Resumen y no por el
menú: es seguimiento, no trabajo diario. Commits `e2ac4d4` (estado de hoy), `5a0f2d4` (actividad del
período y el selector) y `a860fd8` (las dos del registro). Cada mosaico se verificó contra una
consulta de control formulada distinta de la de la pantalla.

**El selector es mes + año, no una lista de meses.** Una sola lista crece con el tiempo —doce
opciones el primer año, treinta y seis al tercero—; partido, el mes son siempre doce y el año crece
de a uno. Los años salen de la clase más vieja del instituto.

**Simplificación conocida, con el cliente al tanto (2026-08-24): el gráfico diario agrupa a la
persona multi-rol por lo que *es* y no por lo que *hizo*.** La precedencia es alumno → staff → tutor,
y elige **uno solo** porque es un conteo de personas: contarla dos veces haría que la barra sume más
gente de la que entró. Las listas no eligen — quien tiene rol `GUARDIAN` aparece en ellas igual.

Se puede afinar sin migración: `sections` ya guarda si esa persona abrió el portal del tutor ese día,
así que el `CASE` de la consulta podría contarla como tutor los días que va a mirar las notas de su
hijo y como staff los días que va a trabajar. **Hoy en producción son dos personas**, medido el
2026-08-24, así que no paga hacerlo todavía.

#### Fase 2 · los listados detrás de cada número · **hecha** (2026-08-24)

Commit `24fb2a2`. Completa el principio que la fase 1 dejó a medias: *"cada número lleva a una lista
de nombres"*. Cuatro pantallas nuevas bajo `/dashboard/usage` —`alumnos`, `tutores`, `clases` y
`practica`—, sólo `ADMIN`, con el filtro y el período en la URL.

**Cuatro listados y no catorce.** El estado va como filtro adentro de la lista de su métrica, en vez
de una pantalla por cada renglón del desglose. Quien abre "con datos y sin cuenta" muchas veces
quiere mirar enseguida "sin ningún dato", que es el mismo trabajo con otro grado de dificultad. Por
lo mismo **las métricas 5 y 8 comparten pantalla**: son la misma gente mirada por dos preguntas
—si llegan a un alumno, y si entran—, y el tutor sin alumno vinculado es casi siempre el que nunca
entró. Las métricas 1 y 2 comparten por la misma razón: son las mismas clases, miradas por el estado
del parte y por cómo se cargó.

**La clasificación se mudó a [`metricas.ts`](../src/app/dashboard/usage/metricas.ts) y el período a
[`periodo.ts`](../src/app/dashboard/usage/periodo.ts)**, y los llaman tanto el mosaico como el
listado. No es por no repetir código: es que un mosaico que dice 7 y una lista que trae 6 no se lee
como un error de una de las dos, se lee como que el panel miente — y con la regla escrita dos veces
eso pasa la primera vez que alguien toca una y no la otra, en silencio.

**Dos números no se abren, a propósito.** Las marcas del escáner —"con el escáner: 2", "cargadas a
mano: 1"— porque son marcas y el listado son clases: un número que abre una lista de otro largo se
lee como un error del panel, así que la fila que abre es la de cursos, que termina en las clases
escaneadas. Y **ningún número en cero enlaza**, ni el titular ni la fila: el destino sería una lista
vacía, y un clic que no lleva a ningún lado enseña a no volver a hacer clic. El chip del filtro en
cero se muestra igual pero no se puede apretar, porque esconderlo haría que la lista de filtros
cambie de forma según el mes y que "ninguna incompleta" —buena noticia— sea indistinguible de "esta
pantalla no mide eso".

**Cada fila termina donde se arregla**: el alumno en su ficha, el tutor en la suya, la clase en su
parte de asistencia, la práctica en su vista previa. Y la columna que hace utilizable a las dos
listas de personas es el teléfono: el mosaico dice cuántos son, la lista dice a quién llamar.

**Sigue valiendo que son listas de pendientes y no puntajes de personas.** El docente aparece en el
listado de clases porque es a quien hay que avisarle de esa clase, no para sumarle un porcentaje al
lado del nombre.

**Verificado el 2026-08-24** contra una consulta de control formulada distinta —SQL crudo con `CASE`
y subconsultas correlacionadas, contra el `findMany` + clasificación en memoria del código—: 284
alumnos activos (6 / 258 / 0 / 20 / 0), 7 tutores con cuenta y 3 sin ningún rastro, 53 clases en el
período (52 sin parte, 1 incompleta), 3 marcas con 2 del escáner en 1 curso.

#### Lo que quedó afuera de la fase 1

Las ocho métricas, las dos zonas y el selector. `recharts` ya está en el proyecto. Las consultas son
agregaciones por instituto: `groupBy` o SQL, no `findMany` con un `reduce` en memoria como hace hoy
[`PlaygroundChartServer`](../src/app/dashboard/components/PlaygroundChartServer.tsx), que además trae
dos veces las mismas sesiones de 30 días para calcular dos cosas distintas.

**[FEAT-16](#feat-16) le agrega una métrica más**, y es la única que se decidió sumar después de
cerrar las ocho: la actividad del Playground, que hoy vive en el Panel de Control. Es la otra mitad
de la métrica 3 —ésta mide lo que se publicó, aquélla lo que se practicó— y separadas ninguna de las
dos se puede interpretar sola.

**Relacionado.** [ARQ-09](#arq-09) anota que las métricas y el registro de errores son cosas
distintas y no conviene mezclarlas: "cuántos errores hubo" sale del registro, "cuánto se usa la
plataforma" no. Comparten, eso sí, las mismas tres decisiones caras — dónde se guarda, cuánto tiempo
y quién lo ve. También hay un ítem viejo en [TODO.md](./TODO.md) que pide mostrar uso real del
instituto en el dashboard, y es esto.

---

<a id="feat-12"></a>
## FEAT-12 · Aviso por correo cuando llega un formulario de inscripción · **P3** · 🗣️ Pedido del cliente

**Pedido (2026-08-15).** Que llegue un correo al instituto avisando que entró un formulario de
pre-inscripción.

**El problema real es que hoy el instituto no se entera.** La pre-inscripción pública
([`inscription/actions.ts`](../src/app/inscription/actions.ts)) crea el registro y ahí queda: alguien
tiene que acordarse de mirar. Un aspirante puede quedar sin respuesta durante días sin que nadie lo
sepa.

**El costo no está en el aviso, está en que no hay correo en el proyecto.** No hay ninguna librería
de envío en `package.json` — ni nodemailer, ni Resend, ni SendGrid. Este ítem es, en realidad, la
decisión de **cómo manda correo esta aplicación**, y esa decisión no es de este ítem solo:

- [FEAT-05](#feat-05) (recuperar la contraseña por correo) es **P1 y pedido del cliente**, y necesita
  exactamente la misma infraestructura.
- [SEC-06](#sec-06) (contraseñas por defecto hardcodeadas) se resuelve de verdad mandando un enlace de
  alta, que también es correo.
- El formulario de contacto del landing, anotado en [TODO.md](./TODO.md), es el tercer caso.

**Por eso conviene que el primero que se haga sea FEAT-05**, que es el más urgente, y que deje el
helper de envío montado. Los otros tres pasan a ser una plantilla y una llamada. Hacer este primero
sería resolver el problema chico y dejar el caro para después.

**Al 2026-08-29 eso ya pasó: el canal de correo está montado** ([FEAT-05](#feat-05), commit
`96a9193`). Existe [`src/lib/email/`](../src/lib/email/index.ts) con proveedor elegible por
`EMAIL_PROVIDER`, el remitente resuelto por instituto y una plantilla de ejemplo, así que **este ítem
ya no arrastra la decisión de cómo manda correo la aplicación**: es escribir la plantilla del aviso y
llamar al proveedor. Lo que sigue abierto de acá es lo propio: a qué dirección se avisa —¿la de la
ficha del instituto, configurable?— y que el cuerpo mande a la aplicación en vez de copiar los datos
del aspirante, porque son datos de menores.

**Decisiones que arrastra.** Proveedor y dominio remitente (un correo que sale de un dominio sin SPF
y DKIM cae en spam, que es peor que no mandarlo); a qué dirección se avisa —¿la del instituto,
configurable por instituto?—; y qué lleva el cuerpo, teniendo presente que **hay datos de menores**:
conviene que el correo avise que llegó una inscripción y mande a la aplicación, no que copie los
datos del aspirante.

**Alternativa más barata, mientras tanto.** Un contador de pre-inscripciones sin atender en el
dashboard del instituto resuelve buena parte del problema sin infraestructura nueva. No reemplaza al
correo —no avisa a quien no entró—, pero es de horas y no de días.

### Decidido — 2026-09-09 · sale junto con [FEAT-20](#feat-20)

Lo que quedaba abierto acá se cerró al definir el acuse al aspirante, que es el correo espejo de éste:

- **Se avisa a `Institute.email`**, el correo de contacto de la ficha del instituto. Es la dirección
  que `resolveSender` ya usa como `replyTo` de todo lo que sale, así que no se agrega ningún concepto
  nuevo. **Ojo que el campo es opcional en el schema** (`email String?`): si en producción está vacío,
  el aviso no sale y el instituto se sigue enterando sólo por la campana — que es exactamente lo que
  este ítem viene a arreglar. **Hay que verificar que esté cargado antes de darlo por hecho.**
- **El cuerpo no copia los datos del aspirante** y manda a la aplicación, como esta ficha ya venía
  diciendo por tratarse de datos de menores. FEAT-20 llegó a la misma conclusión por otro camino —la
  dirección de destino no está verificada—, así que los dos correos se redactan igual de cortos.
- **Se hacen en la misma pasada.** Se enganchan en el mismo punto de la misma función
  ([`inscription/actions.ts:87`](../src/app/inscription/actions.ts)) y comparten la infraestructura de
  [FEAT-05](#feat-05): una vez abierto el archivo, el segundo es una plantilla más. Siguen siendo
  independientes — si uno se cae, el otro se hace igual.

---

<a id="feat-13"></a>
## FEAT-13 · Guardar la asistencia sola, sin botón de guardar · **P3**

**Idea (2026-08-16)**, surgida al verificar [BUG-07](#bug-07) en stage: que cada marca de presente sea
un `insert` o un `update` inmediato, en vez de un parte que se manda entero al apretar Guardar.

**El argumento a favor es real pero engaña, y conviene dejarlo escrito.** Es cierto que con este
enfoque BUG-07 no habría pasado: no hay transacción grande que se pase de los 5 segundos. Pero la
causa de BUG-07 no era el tamaño del parte, era **cuántas sentencias se emitían por guardado** — y en
esa cuenta el guardado por clic es **peor que lo que quedó**, no mejor:

| Forma de guardar 25 alumnos | Requests | Sentencias |
|---|---|---|
| Bucle en `$transaction` interactiva (el código que falló) | 1 | 78 |
| `UPDATE ... FROM (VALUES)` + `createMany` (lo que hay hoy) | 1 | **4** |
| Un guardado por clic | **25** | ~75 |

Los ~75 salen de que cada clic es un request completo: `getAuthContext` lee el usuario de la base
para autorizar, la acción verifica la matrícula, y recién ahí escribe. **Y el pool es de 5**
([ARQ-02](#arq-02)), así que el final de hora —cuando todos los docentes guardan a la vez— es
exactamente el peor momento para multiplicar los requests por 25. Se cambia una conexión tomada cinco
segundos por veinticinco conexiones peleándose.

**Lo que sí resuelve, y es su verdadero valor: el trabajo que se pierde.** Hoy, si el docente marca a
los 25 y se va sin apretar Guardar, o si se le corta la conexión antes, **no queda nada**. Eso BUG-07
no lo cubre, y es un problema distinto que este enfoque ataca de verdad. El argumento a favor está
bien; lo que hay que corregir es el motivo.

**Las contras a analizar.**

1. **El parte deja de ser atómico.** Hoy se guarda entero o no se guarda. Por clic, un parte a medias
   pasa a ser un estado legítimo, y «sin marcar» deja de distinguirse de «no se llegó a guardar».
2. **Los errores pasan a ser por fila.** Si falla el alumno 12, ¿qué ve el docente? Hace falta estado
   y reintento por fila, no el cartel único que hay hoy.
3. **Las notas no pueden ir por tecla.** Necesitan su propio mecanismo de espera, aparte del de los
   estados.
4. **El aula con wifi flojo empeora.** Un guardado único se reintenta; veinticinco sueltos dejan la
   lista a mitad de camino, y hay que saber cuál es cuál.
5. `revalidatePath` por clic sería desperdicio puro.

**El punto medio, que probablemente es lo que conviene evaluar primero:** guardado automático con
espera. Se juntan los cambios de unos segundos y se mandan con **la misma sentencia masiva que ya
existe**. Gana el «no se pierde el trabajo» sin multiplicar los requests, y no toca la acción del
servidor: es todo del lado del formulario.

**Relacionado.** [BUG-07](#bug-07) (de donde sale), [ARQ-02](#arq-02) (el pool de conexiones),
[ARQ-11](#arq-11) (el mismo patrón de muchas sentencias, en las notas de los informes).

---

<a id="feat-14"></a>
## FEAT-14 · Carrito de pagos: cobrar varias cuotas en una sola operación · **P2 · 🗣️ cliente**

**Pedido por el instituto el 2026-08-17**, al ejercitar [FIN-11](#fin-11) en stage.

**El hueco.** Cada cobro es una cuota. Un padre con **dos hijos y cuatro cuotas** obliga a repetir el
recorrido entero cuatro veces —buscar alumno, elegir cuota, importe, método, confirmar— y se lleva
**cuatro comprobantes** por una sola entrega de plata. Lo mismo pasa en chico cuando una cuota se paga
mitad con saldo a favor y mitad en efectivo: son dos pasadas por el formulario.

**Forma pedida.** Un carrito donde se acumulan los movimientos —cuotas de uno o varios alumnos, con su
importe, método, recargo o descuento, y las aplicaciones de saldo— y **se confirman todos juntos, una
sola vez**.

**Tres decisiones antes de estimar, y ninguna es de programación.**

1. **El recibo es el argumento más fuerte, más que los clics.** Quien paga $60.000 quiere **un**
   comprobante, no cuatro. `generatePaymentReceipt` ya acepta **varios conceptos** —hoy los usa para
   separar recargo y descuento—, así que el PDF combinado está más cerca de lo que parece. Lo que falta
   es **algo que agrupe los pagos** para poder reimprimirlo después, y eso es cambio de modelo: un
   `PaymentBatch`, o un id de lote en `Payment`.
2. **Todo junto o nada.** Cuatro cuotas tienen que confirmarse en **una** transacción: si la tercera
   falla no puede quedar cobrada la primera. [`actions.ts`](../src/app/payments/actions.ts) ya tiene
   una disciplina de bloqueos escrita para evitar deadlocks —`Fee`, después `Payment`, después
   `Enrollment`—; con N cuotas hay que **tomarlos en orden determinístico**. Es la parte con filo.
3. **Entre hermanos hay una pregunta de negocio.** El saldo a favor es **por alumno**
   (`Student.creditBalance`). Si el padre paga de más, ¿el excedente queda a favor del hijo cuya cuota
   se estaba cobrando, o del grupo familiar? ¿Y el saldo de un hermano puede pagar la cuota del otro?
   Eso decide si el carrito **cruza alumnos** o es uno por alumno, que es la diferencia de tamaño más
   grande de toda la ficha. Roza [ARQ-06](#arq-06) y la relación tutor–alumno.

**Lo que no cambia.** Cada línea sigue siendo su propio `Payment` con su asiento `PAYMENT`: la caja
sigue viendo un movimiento por cuota, y ningún KPI cambia. El carrito es de la interfaz y de la
transacción, no del libro mayor.

**No entra en el lote del 15/08**, que es para cerrar los huecos del release accidental. Esto es
funcionalidad nueva.

**Relacionado.** [FIN-27](#fin-27) (el punto medio del formulario, que es el parche mientras esto no
exista), [FIN-11](#fin-11) (de donde salió la conversación), [FIN-01](#fin-01) (el excedente y a quién
pertenece).

---

<a id="feat-15"></a>
## FEAT-15 · Filtrar los deudores por mes · **P2 · 🗣️ cliente**

**Pedido por el instituto el 2026-08-19.** "Los deudores de junio": poder recortar
[`/payments/debtors`](../src/app/payments/debtors/page.tsx) a un mes.

**Qué significa, definido antes de escribir nada.** La pantalla contesta **quién debe la cuota de ese
mes** —filtro por el período de la cuota— y no "cuánto se debía al cierre de junio", que es una foto
histórica y es otro informe.

**El filtro es fuerte, y fue una decisión del dueño.** Con un mes elegido se lista sólo al que debe
*ese* mes y se muestra sólo *esa* cuota: **la deuda total del alumno no aparece**. Se planteó la
contra —en stage los 5 deudores de junio deben $77.000 promedio y sólo $15.000 son de junio, así que
quien llame por la lista de junio reclama el mes y no lo que el alumno arrastra— y se decidió igual,
porque la pregunta que la secretaría quiere contestar es "a quién le reclamo junio". **La deuda
completa sigue estando a un clic**, en «Todos los períodos».

**Se entra sin filtro, y eso no es una preferencia de arranque: es lo que sostiene el punto de
abajo.** «Todos los períodos» es el estado inicial y la única vista donde se ven las matrículas y los
derechos de examen.

**Este filtro es el tercer agregado por mes exacto que deja afuera al mes 0.** Las matrículas y los
derechos de examen van con `month = 0` a propósito ([FIN-12](#fin-12), [FIN-17](#fin-17)) y no caen en
ningún mes del selector: en stage son **$40.000 de $385.000, el 10% de la mora**. Ya estaban afuera
del "a cobrar del mes" de [`/payments`](../src/app/payments/page.tsx) y de los "Ingresos del Mes" del
[dashboard](../src/app/dashboard/page.tsx); ahora son tres. **No se toca el `0`** —está evaluado y
descartado dos veces, ver [FIN-08](#fin-08)—, y lo que lo arregla de fondo sigue siendo `dueDate`.
Mientras tanto, lo que evita que esa deuda quede invisible es que la pantalla **no arranque
filtrada**.

**Los doce meses se ofrecen siempre, tengan deuda o no.** Un mes que falta del selector se lee como
una pantalla rota; uno vacío que contesta "sin deudas" contesta la pregunta. Con una distinción que
importa: **un mes que todavía no llegó no dice "sin deudas"**. Septiembre 2026 tiene 3 cuotas emitidas
por $45.000 que el reporte excluye por no vencidas —`month <= mes actual`—, así que decir "sin deudas
de septiembre" sería falso. Dice **"Septiembre 2026 todavía no venció"**.

### Resuelto — 2026-08-19 · verificado en desarrollo, pendiente de verificar en stage

Tres archivos, sin migración y sin tocar `getDebtorsReportAction`: el reporte ya se traía entero y el
recorte es de interfaz. El estado vive en el cliente, junto al buscador, el orden y la paginación que
ya eran de cliente — el costo es que el filtro no se comparte por link.

- [`page.tsx`](../src/app/payments/debtors/page.tsx) agrega `month` y `year` crudos a cada cuota del
  desglose, que sólo llevaba la etiqueta ya formateada.
- [`DebtorsClient.tsx`](../src/app/payments/debtors/DebtorsClient.tsx) hace el resto: el selector, el
  recorte (`viewList`), y **tres reencuadres que el filtro obliga**, porque lo que quedaba en pantalla
  decía cosas que ya no eran ciertas:
  1. **Las tres tarjetas de arriba** —"Mora Histórica / Pendiente de *mes actual* / Deuda Total"— se
     calculan contra el mes en curso y la tercera es la deuda total, que esta vista no muestra. Con
     filtro se reemplazan por **una sola, ancha**: `Deuda de Junio 2026 · $75.000 · 5 deudores`.
  2. **Las tres cajas de cada alumno** serían el mismo número: se colapsan a una, `Debe de Junio 2026`.
  3. **El PDF.** Clavaba `getMonthName(currentMonth)` en los encabezados y sólo declaraba el filtro de
     nombre. Un PDF filtrado que se llame "Reporte de Deudores" se lee como el reporte completo del
     instituto: ahora el título dice el recorte, las columnas se reducen a
     `Alumno · Teléfono · Cuota · Importe`, y una línea al pie avisa que esos alumnos pueden deber de
     otros períodos.
- El orden por monto pasa a ser por **el valor de la cuota del mes**, que no es el mismo en todos los
  cursos.

**Lo que no se tocó.** `getDebtorsReportAction` sigue trayendo lo mismo y con el mismo criterio de
vencido, así que la deuda que la pantalla puede mostrar no cambió: cambió cómo se la recorta.

**Verificado por pantalla el 2026-08-19** contra la base de desarrollo, con los números anotados antes
de abrir el navegador. Sin filtro: mora histórica **$85.000**, pendiente de agosto **$0**, **6
deudores**. Con **Abril 2026**: `$60.000 · 5 deudores`, y **`estudiante uno 2233` desaparece de la
lista** porque sólo debe matrícula — que es el filtro fuerte funcionando. El caso que lo muestra
entero es `alex ibragin sánchez fernández`: sin filtro debe **$25.000** (cuota de abril $15.000 +
matrícula $10.000) y con abril puesto su tarjeta dice **$15.000**, sin la matrícula en ningún lado.
**Junio 2026** —un mes sin ninguna cuota— da "Sin deudas de Junio 2026", y **Septiembre 2026**,
"todavía no venció". Los dos carteles, que son la diferencia entre "no debe nadie" y "no llegó".

> **Al margen, y anotado para no repetirlo:** durante la prueba la pantalla mostró la 404 y la sesión
> no arrancaba. No era la funcionalidad: se había corrido `next build` con el `next dev` levantado, y
> los dos escriben en el mismo `.next/`. El síntoma es `/api/auth/session` devolviendo 404 con HTML en
> vez de JSON, y NextAuth sin poder armar la sesión. Se arregla con `rm -rf .next && npm run dev`.

**Relacionado.** [FIN-09](#fin-09), que agrega a esta misma pantalla un filtro por estado del alumno
—activos, papelera, todos— y va en la misma barra: conviene diseñarla una sola vez.

---

<a id="feat-16"></a>
## FEAT-16 · Mudar la actividad del Playground al panel de uso · **P3**

**Decidido el 2026-08-25.** Hoy
[`PlaygroundChartServer`](../src/app/dashboard/components/PlaygroundChartServer.tsx) vive en el
Panel de Control, tercero en una pila de tres gráficos grandes, y lo ven `ADMIN` y `SECRETARY`.

**Ese gráfico son dos cosas pegadas, y cada una es de una pantalla distinta.**

- **Sesiones por día, total y reparto entre Speaking / Listening / Chat.** Contesta *"¿los alumnos
  practican?"*, que es una pregunta de uso. **Va al panel de [FEAT-11](#feat-11).**
- **Accuracy promedio por curso, top 8.** No mide si se usa el sistema, mide qué tan bien les va: es
  "cómo va el instituto", que es la pregunta del Panel de Control. **Se queda donde está.** Además es
  un ranking de cursos con porcentaje, justo lo que FEAT-11 decidió no tener —*listas de pendientes,
  no puntajes*—, así que mudarla rompería el criterio del panel al que iría.

**El argumento decisivo es que la métrica 3 ya contesta la otra mitad de la misma pregunta.** Hoy el
panel dice *"el docente publicó práctica en N cursos"* y *"M publicadas que nadie practicó"* —la
oferta—, y el gráfico del Panel de Control dice cuánto se consumió —la demanda—. Separadas, ninguna
de las dos se puede interpretar: si nadie practica, no se sabe si es porque no hay nada publicado o
porque hay y no llega a los alumnos. Juntas, se sabe.

**Tres motivos que se suman:**

- **El Panel de Control ya está cargado**: 775 líneas y siete consultas en serie. Y este componente
  **trae dos veces las mismas sesiones de 30 días** para calcular dos cosas distintas — hay que
  arreglarlo en el mismo pase, vaya donde vaya.
- **Son dos relojes.** El gráfico tiene su propio selector 7d/30d, del lado del cliente. Al mudarse
  tiene que obedecer el selector mes+año del panel y perder el suyo; si conviven dos controles de
  período en la misma pantalla, es el problema de los dos relojes de finanzas otra vez.
- **Momento de mirada.** El Panel de Control se abre todos los días para trabajar; el panel de uso,
  cada tanto para evaluar. "¿Los alumnos practican?" es de las segundas.

**Lo que se queda en el Panel de Control: una tarjeta chica**, del tipo *"X sesiones de práctica este
mes"*. No es un consuelo, resuelve dos cosas concretas. El Playground es el diferencial del producto
y el panel de uso entra por un botón secundario, no por el menú: sin nada en el home, el diferencial
deja de verse donde se mira a diario. Y **es lo único que la secretaría necesita de esto**: queda
afuera del panel de uso por el criterio de [SEC-03](#sec-03), y el gráfico grande no es algo que mire.

**El costo no es trivial y conviene saberlo antes de empezar.**
[`PlaygroundActivityChart`](../src/app/dashboard/components/PlaygroundActivityChart.tsx) es un
componente de cliente con estado propio y su propio filtro de período: mudarlo es reescribirle el
manejo de período para que lea el de la URL, no mover un import.

### Hecha (2026-08-25)

Commit `29e2f20`. **Se hizo antes de promover [FEAT-11](#feat-11) y no después**, al revés de lo que
decía esta ficha: como todo viaja en la misma promoción, el cliente ve el panel completo de una vez y
se ahorra un despliegue. El riesgo que preocupaba —tocar el Panel de Control, que usa todo el mundo
todos los días— se cubre probándolo en stage antes de promover, que es lo que había que hacer igual.

**Tres cosas aparecieron al mudarlo, y las tres estaban desde antes:**

- **El día se agrupaba en UTC.** `toISOString()` corría al día siguiente toda práctica hecha después
  de las 21:00 de Argentina — en la base de desarrollo, **51 de 172 sesiones**. Ahora la conversión
  pasa por los dos husos, como ya hacía el registro de actividad.
- **Las barras se rotulaban con el nivel del curso**, y el nivel se repite entre secciones: salían dos
  "Pre-adolescents 1" y dos "Upper-intermediate" con números distintos, que se lee como un error del
  gráfico. Ahora va el nombre real del curso.
- **La consulta traía dos veces las mismas sesiones** y las recorría en memoria. Quedó en una sola
  agregación en la base.

**Y se agregó lo que el desglose por color no decía: el número de cada día.** Una barra de tres
cuartos de alto puede ser 6 personas o 60 según el techo del período, y el techo cambia con cada mes
elegido — así que el gráfico sólo se podía comparar consigo mismo. El cartel sale con `group-hover` y
con `group-focus`, o sea con el mouse y con el dedo, sin estado ni bundle de cliente. Lo comparten
los dos gráficos diarios en [`BarrasDiarias`](../src/app/dashboard/usage/BarrasDiarias.tsx), y cada
uno pone su unidad: **"personas" en uno y "sesiones" en el otro**, que es justamente la diferencia
que los dos no mostraban y que hacía que se confundieran.

---

<a id="feat-17"></a>
## FEAT-17 · Borrador de la clase, y publicarla cuando el docente quiera · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-09-02).** Que el docente pueda armar la clase como **borrador** y **publicarla cuando
lo considere necesario**.

**Hoy no hay estado intermedio: lo que se guarda, se ve.** El tema de la clase llega a cinco lugares
apenas se guarda —el panel del alumno ([`dashboard/page.tsx:244`](../src/app/dashboard/page.tsx)), sus
académicos ([`academics/page.tsx:83`](../src/app/academics/page.tsx)), los del tutor
([`guardian/academics/page.tsx:60`](../src/app/guardian/academics/page.tsx)), el panel del instituto
([`dashboard/page.tsx:620`](../src/app/dashboard/page.tsx)) y el calendario, incluido el de los pares
de [FEAT-07](#feat-07)—, y las cinco consultas filtran lo mismo: `status: "ACTIVE"` y de hoy en
adelante. No hay dónde poner un borrador.

**Antes de diseñar nada, un dato que achica el pedido: el alumno no ve los contenidos.** De la clase
se le muestran el **tema**, la fecha y el horario; `content` no se renderiza en ninguna pantalla de
alumno ni de tutor — es lo que lee la IA para escribir la práctica ([PED-01](#ped-01)) y lo que ve el
docente. Así que hoy "publicar una clase" es **publicar su título**, y —si se decide así— su práctica.
Si lo que preocupa al docente es que le lean los contenidos mientras los escribe, eso se contesta, no
se construye.

**El estado ya existe dos veces en el producto, con dos formas distintas:**

- **`LessonPractice.isPublished`** — *"El profesor activa cuando está listo"*, textual en el schema.
  Es exactamente lo que se está pidiendo, un nivel más abajo: la práctica de la clase ya se publica
  aparte, con su interruptor en el modal de la clase.
- **`StudentReport.publishedAt`** — `null` es borrador, la fecha es publicado ([FEAT-09](#feat-09)).
  Además de decir *si*, dice *cuándo*, y ese dato terminó sosteniendo todo lo demás: el congelamiento
  de los firmantes, el aviso al tutor y la marca de edición posterior.

**Recomendación: la forma de `publishedAt`**, por lo mismo que sirvió en los informes, y en **campo
propio, no en `status`**. `Lesson.status` es `ACTIVE | DELETED` y es el borrado lógico de
[ARQ-05](#arq-05): un borrador borrado necesita las dos cosas dichas por separado.

**Y hay un tercer estado ya inventado a mano que conviene absorber.** `generateLessonsAction`
([`lessons/actions.ts:273`](../src/app/courses/[id]/lessons/actions.ts)) crea todas las clases del
período desde los horarios del curso con el tema en `SCHEDULED_LESSON_TOPIC` —la cadena
`"Clase Programada"`—, y el calendario decide si la clase está cargada **comparando el título contra
esa cadena** ([`schedule/page.tsx:355`](../src/app/schedule/page.tsx),
[`WeeklyGridView.tsx:111`](../src/app/schedule/components/WeeklyGridView.tsx)). Mientras tanto el
alumno ve *"Clase Programada"* en su lista de próximas clases, que es un borrador publicado sin que
nadie lo haya decidido. Con el campo nuevo, **la clase generada nace en borrador** y esa comparación
de strings se reemplaza por el estado real. La migración se resuelve sola: todo lo existente se
publica en el backfill, salvo las programadas que nadie cargó.

**Lo que hay que decidir con el docente y con el instituto:**

- **¿Qué pasa con la asistencia y las notas de una clase en borrador?** Si se tomó asistencia, la
  clase existió. La regla más fácil de explicar es que **tomar asistencia publica la clase**; la más
  previsible es que no haga nada y publique el docente. Hay que elegir una: hoy las dos pantallas
  escriben sin preguntar nada sobre el estado.
- **¿La práctica conserva su propio interruptor?** Dos publicaciones en el mismo modal se explican
  mal. Lo coherente es que la práctica no pueda estar publicada sobre una clase en borrador —el alumno
  vería la práctica de una clase que no ve— y que el interruptor quede sólo para publicar la clase sin
  la práctica.
- **¿Se avisa al publicar?** [FEAT-09](#feat-09) le avisa al alumno y a los tutores cuando se publica
  un informe, que son dos o tres por año. Una clase por semana y por curso es otro volumen:
  **recomendación, no avisar**.
- **¿El par del mismo nivel ve los borradores?** [FEAT-07](#feat-07) existe para saber en qué tema van
  los pares. Lo razonable es que vea lo publicado, igual que el alumno.

**Y una consecuencia de plata que hay que resolver en el mismo pase.** La liquidación de sueldos
cuenta **una clase por cada fila `ACTIVE` del período** ([`payroll.ts:18`](../src/lib/payroll.ts)),
con el criterio escrito ahí mismo: *"Una clase borrada no se dictó: no se paga"*. O sea que la
existencia de la fila es lo que se paga: una clase generada que no se dictó **se liquida igual** si
nadie la borró. Los borradores multiplican esas filas, así que la pregunta deja de poder postergarse:
**¿se paga la clase programada o la clase dictada?** Si es la segunda, el borrador no cuenta y el
criterio pasa a ser la publicación —o, mejor, la asistencia tomada—. No es algo que resuelva quien
liquida, fila por fila: lo tiene que contemplar el sistema.

**Alcance:**

1. `publishedAt` en `Lesson`, su migración y el backfill.
2. El filtro en las cinco consultas de alumno, tutor y calendario. **Que viva en un solo lugar**, como
   el `yearlyEnrollmentTargetsWhere` de [FIN-14](#fin-14): cinco copias del mismo `where` son cinco
   lugares donde olvidarse el día que aparezca una pantalla más.
3. La acción de publicar —y la de volver a borrador, si se decide que exista— con
   `requireCourseWriteAccess`, que es el corte que ya usa el resto del libro de temas.
4. El distintivo en el libro de temas del curso, que es donde el docente ve la lista, y la decisión
   sobre la liquidación de arriba.

**Relacionado.** [FEAT-09](#feat-09) (de donde sale la forma de `publishedAt`), [PED-01](#ped-01) (el
`isPublished` de la práctica), [FEAT-07](#feat-07) (el calendario de los pares),
[ARQ-05](#arq-05) (`status` es el borrado lógico y no se puede mezclar), [FEAT-02](#feat-02) (el libro
de temas paginado, donde va el distintivo).

---

<a id="feat-18"></a>
## FEAT-18 · Que el listado del curso no muestre a los que dejaron · **P3** · 🗣️ Pedido del cliente

**Pedido (2026-09-02).** Que en la pantalla del curso no aparezcan los alumnos marcados como
**incompletos**, que es como queda la inscripción del que dejó el curso.

**El criterio ya existe y ya está aplicado en las otras pantallas.** El parte de asistencia
([`attendance/page.tsx:41`](../src/app/courses/[id]/lessons/[lessonId]/attendance/page.tsx)) y la
planilla de notas ([`grades/page.tsx:41`](../src/app/courses/[id]/lessons/[lessonId]/grades/page.tsx))
traen las inscripciones con `status: { in: ["ACTIVE", "FINISHED"] }`, y el generador mensual sólo le
emite cuotas a las `ACTIVE` ([`billingActions.ts:39`](../src/app/payments/billingActions.ts)). El que
dejó el curso ya desapareció de todo eso. **La única pantalla que lo sigue mostrando es el listado del
curso**, que trae todas las inscripciones sin filtrar
([`courses/[id]/page.tsx:83`](../src/app/courses/[id]/page.tsx)) y las distingue con un distintivo
ámbar *"Incompleto"*. El pedido no inventa una regla: empareja la lista con lo que el sistema ya
decidió.

**Y de paso arregla un número que no cierra.** El encabezado dice *"Alumnos Inscritos (N)"* contando
`course.enrollments.length` —todos, incompletos incluidos—, mientras que el `totalEnrolled` que usa el
resto de la pantalla cuenta sólo los `ACTIVE`
([`:212`](../src/app/courses/[id]/page.tsx)). Son dos números del mismo grupo en la misma pantalla. El
subtítulo, además, ya promete lo que el pedido pide: *"Listado oficial de estudiantes activos en este
grupo"*.

**Qué no hay que filtrar de más.** `FINISHED` no es `INCOMPLETE`: al finalizar un curso,
`finishCourseAction` pasa todas las inscripciones activas a `FINISHED`, así que filtrar los dos
dejaría todo curso terminado con la lista vacía. El corte es sólo `INCOMPLETE`, igual que en el parte.

**Recomendación: ocultar por defecto, con manera de verlos** —un *"N dejaron el curso"* que
despliegue— y no excluirlos del todo. Tres razones concretas:

1. **Es la salida que el propio sistema recomienda.** Al intentar eliminar una inscripción con cuotas
   pagas, el error dice *"Si el alumno dejó el curso, marcá la inscripción como incompleta"*
   ([`courses/actions.ts:259`](../src/app/courses/actions.ts)). No es un caso raro: es el camino
   oficial.
2. **Hoy es un estado sin vuelta desde esta pantalla.** El botón de dar de baja sólo se dibuja para
   las inscripciones `ACTIVE` ([`:432`](../src/app/courses/[id]/page.tsx)), así que una vez marcada
   incompleta no queda nada que tocar; si además desaparece, quien se equivocó de alumno no ve qué
   hizo. La vuelta existe —volver a inscribirlo reactiva **la misma** inscripción con sus cuotas
   ([FIN-23](#fin-23))—, pero hay que saberla.
3. **Es la misma doctrina que se decidió en [FIN-09](#fin-09)**: filtro con vista por defecto, no
   exclusión.

**Ojo con el cruce con el otro pedido del mismo día.** [FIN-09](#fin-09) pide que los deudores sean
los de alumnos activos en cursos activos. Si eso se implementa como *"inscripción activa"* y esto
oculta al incompleto del listado, **el alumno que dejó el curso debiendo cuotas desaparece de las dos
pantallas a la vez** y su deuda queda sólo en su ficha. Es exactamente el caso que la decisión del
16/08 de FIN-09 dijo que no puede perderse de vista — el que se va debiendo y quizás vuelve. Las dos
fichas se tocan acá y conviene escribirlas mirando la otra.

**Alcance.** El filtro en la consulta del curso —o en memoria, que ya está a mano—, el número del
encabezado, y dónde queda el desplegable de los que dejaron. No toca la base.

**Relacionado.** [FIN-09](#fin-09) (el cruce de arriba), [FIN-23](#fin-23) (la inscripción que no se
borra y se reactiva), [FIN-24](#fin-24) (mover de curso, la otra salida cuando el alumno no se va sino
que cambia).

### Decidido — 2026-09-02 · sin estado nuevo, y el criterio es el del parte

**No se agrega un estado.** La pregunta que abrió esto era si el que abandona necesita un estado
propio, y la respuesta es que ya lo tiene: `INCOMPLETE` significa exactamente eso y es lo único que lo
escribe —`markEnrollmentIncompleteAction`, desde el botón del listado—. Un valor nuevo sería un
sinónimo, y saldría gratis en la base —`Enrollment.status` es un `String` con los valores en un
comentario, no un enum— pero habría que enseñárselo a los quince lugares que filtran por ese campo con
listas literales, uno de ellos SQL crudo en el widget de cumpleaños que TypeScript no chequea. **Lo
que cambia es la pantalla, no el modelo.**

**Y hay una tercera pantalla que ya lo hace: la tarjeta del listado de cursos.** `/courses` trae los
nombres y el conteo con `where: { status: "ACTIVE" }`
([`courses/page.tsx:56`](../src/app/courses/page.tsx) y [`:61`](../src/app/courses/page.tsx)). Por eso
hoy el mismo curso se ve con **dos números distintos**: la tarjeta dice *"Alumnos Inscriptos (3)"* y
la pantalla de administrar, *"(4)"*. Es el mejor argumento del pedido — no es una preferencia, es una
inconsistencia visible sin abrir el código.

**Pero el `where` de la tarjeta no es el que hay que copiar.** Filtra sólo `ACTIVE`, así que en la
pestaña de finalizados la tarjeta muestra el curso con **cero alumnos**; el comentario de esa misma
consulta lo dice a medias (*"For finished courses, we might want to see who WAS active"*). El criterio
bueno es el del parte, `["ACTIVE", "FINISHED"]`, y conviene emparejar la tarjeta en el mismo pase:
quedan las tres pantallas diciendo lo mismo.

**Lo único que queda por definir** es si el que dejó desaparece del todo o queda como *"1 dejó el
curso"* desplegable. Sigue valiendo la recomendación de arriba —con vista, no excluido—, y la razón
más concreta es que desde esa pantalla marcar incompleto no tiene vuelta: **cómo vuelve un alumno
incompleto quedó abierto en [FIN-30](#fin-30)**, y ahí adentro es donde tiene sentido que viva el
botón.

---

<a id="feat-19"></a>
## FEAT-19 · Sumar un concepto de nota al boletín sin tocar lo ya publicado · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-09-02).** Sumarle un concepto de nota —*"Comprensión oral"*— a un boletín trimestral
que **ya tiene el 1° trimestre publicado**, y que se vea **del 2° informe en adelante**. Con dos
condiciones que puso el cliente: que **no se puedan cargar notas del concepto nuevo en el 1°
trimestre**, y que el cambio pueda alcanzar **a un curso sí y a otro no**.

**Hoy la plantilla no tiene tiempo ni dueño, y por eso el pedido no se puede hacer sin daño.**
`CourseReportTemplate` ([`schema.prisma:969`](../prisma/schema.prisma)) es un puntero
`courseId + templateId`, no una copia: todos los cursos vinculados miran **la misma fila viva**. Y el
informe publicado tampoco guarda su estructura — `StudentReport` guarda notas y comentario, nada más;
el boletín se arma en tiempo de lectura contra `template.categories` **actual**
([`StudentReportViewer.tsx:331`](../src/components/reports/StudentReportViewer.tsx)). Agregar la
categoría hoy, tal como está el código:

- **le aparece al 1° trimestre ya publicado**, vacía, con la leyenda *"Calificación no provista para
  este período"* ([`:380`](../src/components/reports/StudentReportViewer.tsx)), en pantalla y en el
  PDF que la familia se descargó ([`:166`](../src/components/reports/StudentReportViewer.tsx));
- **alcanza a todos los cursos** vinculados a esa plantilla, y a todos los años;
- **y las firmas no se enteran.** `reportContentHash`
  ([`signatures.ts:18`](../src/lib/reports/signatures.ts)) hashea `categoryId=valor` más el
  comentario, y una categoría sin nota no genera fila `ReportEntry`: el hash no se mueve. El informe
  cambia y la pantalla del instituto sigue diciendo *firmado, sin ediciones*. Es exactamente el
  agujero que [FEAT-09](#feat-09) vino a tapar;
- y si después **alguien carga la nota atrasada del 1°**, ahí sí cambia el hash y los informes quedan
  marcados *"editado tras firmar"* para todo el curso, con el nombre del admin
  ([`signatures/page.tsx:97`](../src/app/reports/signatures/page.tsx)).

El pedido son en realidad **dos ejes de la misma falta**: la categoría no sabe **desde cuándo** vale
ni **para quién**.

### 1 · Desde cuándo — la vigencia de la categoría

**No alcanza con el índice de período: tiene que ser un punto del calendario.** Con
`activeFromPeriod` solo, la columna desaparecería cada enero, porque `periodIndex 1` en 2027 vuelve a
ser el 2° trimestre y el 1° del año que viene tampoco la tendría. Van los dos campos —
`activeFromYear` + `activeFromPeriod` — y el predicado es
`year > afy || (year === afy && periodIndex >= afp)`. Para este pedido: `2026` y `1`.

**Los cuatro lugares que hoy leen `template.categories` crudo** y tienen que respetarla:

1. la planilla del docente, en el armado del estado
   ([`ReportGradeSheet.tsx:91`](../src/app/courses/[id]/reports/[templateId]/ReportGradeSheet.tsx)) y
   en las columnas ([`:406`](../src/app/courses/[id]/reports/[templateId]/ReportGradeSheet.tsx));
2. el POST de notas
   ([`entries/route.ts:184`](../src/app/api/courses/[id]/reports/[templateId]/entries/route.ts)), que
   tiene que **rechazar** una categoría fuera de vigencia aunque le llegue igual — misma disciplina
   que el guard de publicado que ya está ahí: la pantalla frena, el servidor decide;
3. el visor de la familia;
4. el PDF, que es el que queda impreso en la carpeta.

**Tres propiedades salen gratis con esto:**

- **El 1° trimestre no cambia de estructura**, así que el hash y las firmas quedan intactos. La
  vigencia no es sólo la forma linda de hacerlo: es la que no rompe [FEAT-09](#feat-09).
- **Ocultar no borra.** El POST sólo elimina los `categoryId` que le llegan con valor vacío, y una
  categoría fuera de vigencia ya no viaja en el pedido: si alguien alcanzó a cargar una nota por
  error, la fila sobrevive.
- **El mismo campo resuelve dar de baja un concepto**, que hoy es imposible. Una categoría con una
  sola nota cargada no se puede borrar nunca más
  ([`templates/[id]/route.ts:63`](../src/app/api/reports/templates/[id]/route.ts)) — y está bien que
  no se pueda, porque borrarla se llevaría notas puestas. Lo que falta es poder decir *"esta va hasta
  acá"*.

### 2 · Para quién — el ámbito por curso

Confirmado: **hoy no se puede**, y no es un descuido chico. La categoría cuelga de la plantilla
([`schema.prisma:949`](../prisma/schema.prisma)) y el vínculo con el curso es un puntero. Hay tres
salidas.

**(a) Sin tocar el schema: copiar la plantilla y cambiar de plantilla a mitad de año.** Al curso que
no cambia se le deja la vieja; al que sí, se le vincula la copia, y el 2° trimestre se carga ahí.
Funciona —el 1° queda bajo la plantilla vieja y el 2° bajo la copia, y como no comparten
`periodIndex` el visor de la familia no se pisa—, pero **funciona de casualidad**: el visor agrupa
por curso y busca el informe por `periodIndex` **sin mirar `templateId`**
([`:295`](../src/components/reports/StudentReportViewer.tsx)), así que el día que alguien cargue el
mismo período bajo las dos plantillas, una tapa a la otra. Además el panel del curso pasa a mostrar
dos tarjetas, con el 1° colgando de una y el 2° de la otra.

**(b) Ámbito por curso en la categoría.** Una tabla `ReportCategoryCourse`: sin filas, la categoría
vale para todos los cursos; con filas, sólo para esos. Barato, sin migrar datos, no toca nada de lo
que hoy funciona. El costo es conceptual: el editor de plantillas del instituto se convierte en una
matriz de *"esta categoría, desde cuándo y en qué cursos"*, y escala mal si los cursos empiezan a
divergir en serio.

**(c) Instancia por curso.** Vincular una plantilla **copia** sus categorías al curso, y la planilla,
el visor y `ReportEntry` pasan a apuntar a la categoría del curso. Es el modelo correcto: la
plantilla del instituto queda como lo que en realidad es —un modelo, un punto de partida— y el curso
edita lo suyo sin tocarle el boletín a nadie. Lo caro es la migración: copiar categorías por cada
curso vinculado y **remapear los `ReportEntry` ya cargados**, sobre una base sin backup.

**Recomendación.** La vigencia primero: es lo que el cliente pidió, no depende de nada y tiene fecha.
Para el ámbito, la **(b)**, que no bloquea la (c) — cuando la instancia por curso exista, el ámbito
de la categoría se convierte en la instancia. La **(a) no**: es la que parece gratis y es la que
después no se desarma.

### Lo que hay que decidir antes de escribir código

- **¿El ámbito es una excepción sobre la plantilla del instituto (b) o una instancia del curso (c)?**
  Cambia el tamaño de la migración, no el resultado.
- **¿Qué pasa con una nota cargada antes de la vigencia?** Queda guardada e invisible —y sin poder
  editarla desde ninguna pantalla—, o hay que mostrársela a alguien.
- **Si el instituto edita el modelo después, ¿qué pasa con los cursos que ya lo tenían?** No se
  propaga nada y se ofrece aplicarlo, o se propaga y volvemos al problema de hoy.

### El editor de plantillas no avisa de nada, y esto no lo cubre todo

La vigencia arregla agregar y dar de baja. **Renombrar sigue siendo retroactivo y silencioso:** la
familia firmó *"Lectura: 8"* y pasa a ver *"Comprensión oral: 8"*, con el hash intacto, porque el
hash guarda `categoryId`, no el nombre. Eso se tapa metiendo el nombre y el conjunto de categorías
**adentro del hash**, o —la versión de fondo— guardando en el informe **el snapshot de la estructura
con la que se publicó**, igual que ya congela los firmantes.

Y hay tres cambios más que el PUT
([`templates/[id]/route.ts:76`](../src/app/api/reports/templates/[id]/route.ts)) acepta sobre
plantillas con informes publicados, sin preguntar:

- **cambiar la escala** deja los valores viejos huérfanos: el boletín sigue mostrando *"8.5"* y la
  planilla del docente lo muestra **en blanco**, porque ese valor no está entre las opciones del
  `select` ([`:438`](../src/app/courses/[id]/reports/[templateId]/ReportGradeSheet.tsx)). El dato no
  se pierde al guardar, pero es invisible para quien corrige;
- **cambiar el rango numérico** recalcula la barra de progreso de todos los informes publicados;
- **cambiar el tipo de período o las etiquetas** renombra períodos ya publicados y, si achica la
  cantidad, deja los informes con `periodIndex` mayor **sin pestaña** en el visor de la familia.

Lo que sí está frenado hoy: borrar una categoría con notas cargadas y borrar una plantilla con
boletines ([`:147`](../src/app/api/reports/templates/[id]/route.ts)).

**Alcance:**

1. `activeFromYear` y `activeFromPeriod` en `ReportCategory`, con migración y backfill en el año y
   período más viejos —que es lo que significa lo que hay hoy—.
2. **Un solo helper** que conteste si una categoría corre en un `(year, periodIndex)`, y que lo usen
   los cuatro lugares. Que viva en un lugar, como el `yearlyEnrollmentTargetsWhere` de
   [FIN-14](#fin-14): cuatro copias del mismo criterio son cuatro lugares donde olvidarse el día que
   aparezca una pantalla más.
3. El guard en el POST de notas.
4. El editor de plantillas: dónde se elige la vigencia, y **el aviso de cuántos informes publicados y
   firmados toca el cambio** — hoy no dice nada de nada.
5. El ámbito por curso, según lo que se decida arriba.

**Cuándo.** Antes de que alguien toque esa plantilla, que es lo mismo que decir antes de cargar el 2°
trimestre. Hasta entonces el pedido está frenado por una razón sana: hacerlo hoy le cambia el boletín
a las familias que ya firmaron.

**Relacionado.** [FEAT-09](#feat-09) (las firmas, el hash de contenido y el congelamiento de
firmantes — es lo que esto no puede romper, y de donde sale la idea del snapshot),
[ARQ-11](#arq-11) (la misma planilla de notas, del lado del costo de guardarla),
[ARQ-05](#arq-05) (dar de baja una categoría es este mismo campo, no un borrado),
[FEAT-17](#feat-17) (la misma forma: algo que vale desde un momento y no desde siempre).

---

<a id="bug-08"></a>
## BUG-08 · La preinscripción no tiene reglas: duplica alumnos y se la puede inscribir a un curso · **P1** · 🗣️ Pedido del cliente

**Qué es la preinscripción (definido el 2026-08-16).** Es **el que llenó el formulario público y el
instituto todavía no aceptó**. No es un alumno: es un aspirante esperando respuesta. De ahí salen dos
reglas que hoy no existen.

### 1 · Crea alumnos duplicados, y le rompe el acceso al que ya existía

[`createPreEnrollmentAction`](../src/app/inscription/actions.ts) **no verifica nada** antes de
crear: no hay `findFirst` ni `findUnique` en la función. Llama directo a `student.create` con
`status: "PRE_INSCRIBED"`.

Entonces un alumno que **ya existe** —activo, o en la papelera— que vuelve a llenar el formulario
genera una **segunda fila `Student` con el mismo DNI**. Y `Student.dni` no tiene `@unique` en el
schema, así que la base lo acepta.

**No es sólo un registro repetido: le rompe el ingreso.** El DNI es el identificador obligatorio del
alumno y su forma de entrar al sistema —hay chicos de 6 a 8 años sin correo—, así que con dos filas
del mismo DNI el login pasa a depender de cuál encuentre primero. El alumno puede terminar entrando a
una ficha vacía, sin sus cursos ni sus cuotas.

**Qué tiene que pasar en su lugar.** Detectar que ese DNI ya existe y **avisar a los dos lados**:

- **Al que está llenando el formulario**, para que sepa que ya está registrado y no vuelva a
  intentarlo pensando que no funcionó.
- **Al instituto**, porque es información: alguien que ya es alumno se está queriendo anotar de
  nuevo, o alguien que está en la papelera quiere volver. Las dos cosas piden una acción humana.

El mensaje al aspirante tiene que ser cuidadoso: confirmarle que **su solicitud llegó**, sin revelar
datos de la ficha existente ni si está activo o dado de baja. Del otro lado, el instituto sí necesita
saber cuál de los dos casos es.

**Se apoya en [FEAT-12](#feat-12)** para el aviso por correo, y esa ficha explica por qué el correo
es una decisión más grande que este ítem. **La detección no espera al correo**: bloquear el duplicado
y mostrarlo en la aplicación se puede hacer ya.

### 2 · La regla "sólo un activo se inscribe" no está en el servidor · **P3**

> **Corregido el 2026-08-16, el mismo día**, al intentar reproducirlo en stage. La primera versión de
> esta ficha decía que a un preinscripto **se lo podía inscribir desde la pantalla**. Es falso, y la
> prueba lo mostró enseguida: el buscador no lo encuentra.
> [`enrollments/new/page.tsx`](../src/app/enrollments/new/page.tsx) lista los alumnos con
> `where: { status: "ACTIVE" }`, así que un aspirante nunca aparece para elegir.

**Regla, y esto sí vale:** sólo un alumno **activo** se inscribe a un curso. Aceptar la
preinscripción —pasarlo a activo— es el paso que lo habilita, y es una decisión del instituto.

**Lo que falta es que el servidor la sostenga.**
[`createEnrollmentAction`](../src/app/enrollments/actions.ts) no mira `student.status` en ningún
momento: la regla vive sólo en la consulta que arma el desplegable. Es defensa en profundidad, no un
agujero que el operador pueda pisar sin querer, y por eso es **P3** y no P1 como la mitad de arriba.

Vale la pena igual, porque el estado del alumno ya decide otras cosas del mismo circuito: desde
[FIN-22](#fin-22) los dos generadores facturan sólo a alumnos activos, así que si alguna vez entrara
una inscripción de un preinscripto por otro camino, **ocuparía lugar en el curso sin que se le
facture nada**, en silencio.

**Relacionado.** [FEAT-12](#feat-12) (el aviso por correo y la decisión de infraestructura que
arrastra), [SEC-06](#sec-06) (el alta del alumno y sus credenciales), [FIN-16](#fin-16) (el filtro de
estado en los generadores, que es la otra mitad de la incoherencia).

---

<a id="bug-09"></a>
## BUG-09 · Los meses salen en inglés en la liquidación de sueldos · **P3**

**Visto el 2026-08-16** verificando [SEC-03](#sec-03) en stage. En `/payments/payroll` el selector de
período ofrece `January … December`, y el comprobante que se genera queda con el mes en inglés: el
gasto de la prueba se guardó como **"Pago de Haberes - July 2026"**, y el modal de confirmación dice
*"Período: July 2026"*. El resto de la aplicación está en castellano, incluida la pantalla de
finanzas de al lado.

**No es sólo la etiqueta: queda escrito en la base.** La descripción del `Expense` se arma con el
nombre del mes, así que el historial de liquidaciones del instituto queda mezclado —lo viejo en
inglés, lo nuevo en castellano el día que se arregle—. Conviene decidir si se normaliza lo ya
escrito o se deja como está; son pocas filas.

**Causa probable.** Un `toLocaleString`/`Intl` sin locale, o un array de meses en inglés escrito a
mano. Es el mismo tipo de olvido que [FIN-10](#fin-10), que también sale de no fijar el locale: en
Vercel el idioma por defecto del servidor es inglés, así que **esto no se ve corriendo en local** —
que es probablemente por qué llegó hasta acá.

**P3 porque es cosmético y no afecta ningún importe.** Pero es de la pantalla del dueño, y el dueño
es quien mira los sueldos.

---

<a id="bug-10"></a>
## BUG-10 · Un concepto largo empuja el importe fuera de la pantalla · **P2**

**Visto el 2026-08-17**, provocado por un texto que agregó [FIN-11](#fin-11) y revertido ahí mismo —
pero **la fragilidad es anterior y sigue**.

La tabla del libro mayor es `whitespace-nowrap`
([`TransactionTable.tsx`](../src/app/payments/components/TransactionTable.tsx)) y de la columna
*Concepto / Referencia* **sólo trunca el título** (`max-w-[350px] truncate`). La segunda línea —la que
lleva la etiqueta, el *"Anula a: …"*, el ticket y el badge de anulado— **no trunca nunca**, así que
crece con su contenido y empuja *Fecha*, *Monto* y *Acciones* fuera del `overflow-x-auto`.

**Se ve como si los importes hubieran desaparecido de todos los movimientos**, no sólo del que tiene el
texto largo: la columna sigue ahí, hay que arrastrar la tabla en horizontal para encontrarla. Es un
susto grande para algo que no perdió ningún dato — el reporte fue literalmente *"desaparecieron todos
los montos de todos los movimientos"*.

**Hoy no se dispara con los datos de prueba, que son cortos.** Pero el texto de esa línea incluye
nombres de alumno y de curso: *"Anulación de Pago de Cuota #abc123 · Anula a: Cuota Septiembre 2026 -
María Fernanda Gutiérrez Rodríguez"* con un nombre real y un curso de nombre largo llega igual. En
producción hay 181 usuarios y nadie miró los largos.

**P2 y no P3** porque la pantalla es la caja: una columna de importes que parece vacía es de las cosas
que hacen desconfiar del sistema entero.

### Resuelto — 2026-08-17 · `170f888`

El tope de ancho quedó en el `div` y **no en el `<td>`**: la tabla es de layout automático, donde el
`max-width` de una celda es apenas una sugerencia que el navegador puede ignorar, y el de un div se
respeta siempre. La segunda línea ahora **envuelve** (`flex-wrap` + `whitespace-normal`) en vez de
estirarse: la fila se hace más alta, que es barato, y las columnas de la derecha no se mueven.

Entró **dentro del lote y no después**, a pedido del instituto, con un argumento que vale anotar: *"a
primera vista no se van a dar cuenta de lo que pasó, como me pasó a mí"*. Un error que se presenta como
"desaparecieron todos los importes" no admite quedar en la cola.

---

<a id="bug-11"></a>
## BUG-11 · El saldo a favor del formulario queda viejo si se anula desde la tabla · **P3**

**Visto el 2026-08-17**, cerrando la verificación de [FIN-11](#fin-11) en stage.

**El hueco.** El saldo que muestra el formulario de cobro
([`RegisterFeeForm.tsx`](../src/app/payments/components/RegisterFeeForm.tsx)) es estado del navegador:
se carga con `loadFees` al elegir al alumno y no se vuelve a leer. Anular un pago desde la **tabla** es
otro componente; `revalidatePath` redibuja la tabla —que es servidor— pero **el formulario conserva su
estado**. Queda mostrando el saldo de antes de la anulación, con su botón «Usar Saldo».

**La plata no corre riesgo, y conviene dejar escrito por qué.** `applyCreditToFeeAction` no descuenta
leyendo y después escribiendo: la condición viaja dentro del `UPDATE`
(`where: { creditBalance: { gte: creditAmount } }`, [`actions.ts:1002`](../src/app/payments/actions.ts)),
evaluada contra la fila real y con la cuota bloqueada. Aplicar un saldo que ya no existe devuelve
**«Saldo insuficiente»**. Lo mismo protege contra dos pestañas abiertas.

**El caso al revés es el que molesta de verdad.** Si el saldo **aparece** por una anulación hecha en la
tabla, el formulario sigue en cero y **ni siquiera dibuja el bloque azul**: la secretaría no ve un
saldo que existe y le cobra en efectivo al alumno. No se pierde plata —vuelve a quedar a favor— pero es
un cobro que no había que hacer, y nadie tiene motivo para sospecharlo.

**Dos arreglos posibles.**

1. **Barato:** que `handleApplyCredit` relea antes de aplicar. Tapa el caso que se vio, no el inverso.
2. **De fondo:** que el importe lo decida el servidor. La acción recibiría la cuota y un "aplicá lo que
   haya hasta cubrir la deuda", y calcularía `min(saldo real, deuda)` sobre la fila ya bloqueada. El
   cliente deja de tener autoridad sobre el número, que es de donde sale todo este problema. Reemplaza
   el `gte: creditAmount` por el cálculo desde la fila leída dentro de la transacción — hay que
   conservar la atomicidad que ese chequeo aporta hoy.

**P3** porque no hay plata en juego y el back rechaza lo inválido. Sube si el instituto reporta cobros
en efectivo a alumnos que tenían saldo.

**Relacionado.** [FIN-27](#fin-27) (el mismo formulario mostrando un estado que ya no corresponde),
[FIN-11](#fin-11) (de donde salió), [FEAT-14](#feat-14) (el carrito rehace este flujo entero).

---

<a id="bug-12"></a>
## BUG-12 · El escáner de QR pisa la observación que escribió la docente · **P3**

**Visto el 2026-08-22**, definiendo la métrica de QR contra manual de [FEAT-11](#feat-11).

**Qué pasa.** El kiosco de QR marca presente y escribe `notes: "Marcado vía QR Kiosk"`
([`attendance/actions.ts:184`](../src/app/courses/[id]/lessons/[lessonId]/attendance/actions.ts) y
`:193`). En el camino de `update` —el alumno ya tenía fila con estado distinto de `PRESENT`— eso
**reemplaza la observación que había**. Un *"faltó, avisó la madre"* desaparece cuando el chico
escanea al llegar tarde, y nadie se entera de que había una nota.

**Al revés no pasa**, y conviene dejarlo escrito para no volver a revisarlo: el guardado masivo de la
docente **no** borra nada. El formulario precarga la observación existente
([`AttendanceForm.tsx:40`](../src/app/courses/[id]/lessons/[lessonId]/attendance/AttendanceForm.tsx))
y la vuelve a mandar al guardar (`:78`), así que el `UPDATE` reescribe el mismo valor.

**El problema de fondo es que `notes` es un campo del negocio usado como marca técnica.** Por eso la
docente ve `Marcado vía QR Kiosk` escrito en el campo de observaciones de cada alumno escaneado: es
basura visual, y está a una tecla de que alguien la borre.

**Se resuelve junto con la métrica**, no aparte: la columna `Attendance.source` (`MANUAL` | `QR`) de
la fase 0 de [FEAT-11](#feat-11) es la marca correcta. Con ella, el escáner deja de escribir en
`notes` y el campo vuelve a ser de la docente. El relleno del pasado sale del mismo texto, sabiendo
que es aproximado.

**P3** porque no hay plata ni acceso en juego y el caso pide que coincidan un estado previo cargado a
mano y un escaneo posterior. Pero es pérdida silenciosa de un dato que escribió una persona.

**Resuelto el 2026-08-23** (`6e5f560`), junto con la columna `source` de la fase 0 de
[FEAT-11](#feat-11), como estaba previsto. El escáner escribe `source` y no toca `notes`; el `UPDATE`
masivo del parte no toca `source`; y un distintivo `QR` al lado del nombre reemplaza al texto que se
sacó, para no dejar a la docente sin forma de ver qué marcas vinieron del kiosco.

**Verificado en desarrollo** sembrando la forma vieja sobre una clase real: las tres filas con la
marca pasaron a `QR` con la observación vacía, la observación de la docente quedó intacta, y después
de regrabar el parte entero las tres siguieron en `QR`.

**Lo que falta ejercitar, y necesita cámara:** el escaneo sobre un alumno que ya tiene observación
cargada. Es el caso original de la ficha. Queda para stage.

---

<a id="bug-13"></a>
## BUG-13 · La secretaria no encuentra cómo cambiar de curso a un alumno, y el botón está · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-09-02).** Que la secretaria pueda cambiar de curso a un alumno desde la ficha del
alumno.

**Ya puede, y hace rato.** El botón **Cambiar curso** está en cada tarjeta de curso de la ficha
([`students/[id]/page.tsx:258`](../src/app/students/[id]/page.tsx)) y
[`changeStudentCourseAction`](../src/app/students/[id]/actions.ts) autoriza a `["ADMIN", "SECRETARY"]`:
no le falta ningún permiso. Está en `main` desde la promoción del 19/08, con la etiqueta que se le
puso el 16/08 en [FIN-23](#fin-23) **justamente porque como lápiz pelado no se lo encontraba**.

**Así que lo que falta no es código: es el dato de con qué se topó ella.** Cuatro hipótesis, en orden
de probabilidad:

1. **Lo buscó en otro lado.** El único acceso vive dentro de la tarjeta del curso, en la ficha del
   alumno. Desde el listado del curso lo que hay es desinscribir, que es el camino que le suelta las
   cuotas al alumno ([FIN-23](#fin-23)) — el que gana cuando el bueno no se anuncia.
2. **Estaba operando como profesora.** Los controles de la ficha se dibujan por **rol activo**
   (`isAdmin = ["ADMIN", "SECRETARY"].includes(activeRole)`,
   [`students/[id]/page.tsx:80`](../src/app/students/[id]/page.tsx)), no por los roles que tiene la
   cuenta: con el selector en Profesora no hay botón. Es el residuo esperable de [BUG-04](#bug-04) —
   lo que se arregló es que el rol se revirtiera solo, no que el selector exista.
3. **El alumno no tenía ninguna inscripción.** Sin tarjeta no hay botón: ahí lo que aparece es
   *"Inscribir en un Curso"*.
4. **Quería otra cosa**: mover a un preinscripto ([BUG-08](#bug-08)), o mover a varios de una.

**Qué preguntar, en una sola vuelta:** qué alumno, qué vio en la pantalla —¿la tarjeta del curso con
el estado, o el cartel de "No inscripto"?— y qué decía el selector de rol de arriba a la derecha.

**Nada se codifica hasta tener eso.** Si es la 1, lo que falta no es un permiso sino que el camino se
encuentre, y la respuesta es de pantalla. Si es la 2, la ficha se cierra contra [BUG-04](#bug-04) y lo
que hay que mirar es por qué la secretaria termina operando con otro rol. Si es cualquier otra, recién
ahí hay un defecto.

**Y si el camino se empieza a usar de verdad, aprieta [FIN-24](#fin-24)**, que es lo que el cambio de
curso todavía no decide sobre las cuotas ya emitidas.

**Relacionado.** [FIN-23](#fin-23) (de donde salió la etiqueta del botón), [FIN-24](#fin-24),
[BUG-04](#bug-04), [BUG-08](#bug-08).

---

<a id="bug-14"></a>
## BUG-14 · Los filtros del calendario no avisan que están filtrando · **P2**

**Visto el 2026-09-02**, probando *"Ver a mis pares"* ([FEAT-07](#feat-07)): entre el clic y el
calendario nuevo pasa un rato en el que **no pasa nada en la pantalla**. El botón queda igual, la
grilla queda igual, y no hay manera de saber si el clic entró.

**La causa es de una línea.** Los cuatro filtros de la barra —curso, profesor, aula y pares— hacen
`router.push()` pelado
([`ScheduleFilters.tsx:36`](../src/app/schedule/components/ScheduleFilters.tsx)), sin
`useTransition`: el componente no tiene ningún estado "en curso" que dibujar. La navegación se
resuelve entera en el servidor y recién vuelve con la pantalla nueva.

**Y el esqueleto de carga existe, pero no aparece.** `/schedule` tiene su `loading.tsx`; lo dispara
entrar a la ruta, no cambiarle los parámetros a una ruta ya montada. Por eso la primera carga avisa y
el filtro no — que es también por qué esto no se notó antes.

**Cambio.** `startTransition` alrededor del `router.push`, y usar `isPending` para dos cosas: marcar
**el control que se tocó** —no un cartel arriba de todo— y bajarle la opacidad a la grilla mientras
llega la respuesta. Va en los cuatro filtros: el reporte salió del de pares, pero los otros tres
tienen exactamente el mismo silencio.

**No es sólo cosmético, y por eso es P2:** sin señal, la reacción natural es volver a apretar, y cada
clic de más es otra navegación entera al servidor. La pantalla se siente más lenta justo cuando ya
estaba lenta.

**Relacionado.** [ARQ-16](#arq-16) es la otra mitad del mismo reporte —cuánto tarda de verdad— y
conviene hacerlas en este orden: esto es barato, seguro, y puede disolver la queja sin tocar una sola
consulta. [FEAT-07](#feat-07), el filtro que lo destapó.

---

<a id="bug-15"></a>
## BUG-15 · En el celular el listado de alumnos no tiene ninguna acción · **P2**

**Visto el 2026-09-10**, buscando por dónde se borra la preinscripción de un chistoso. La respuesta
—desde la ficha, con el botón *"Borrar Inscripción"* de la Zona de Peligro
([`StudentDangerZone.tsx:116`](../src/app/students/[id]/StudentDangerZone.tsx))— **alcanza tal como
está**: con status `PRE_INSCRIBED` ese botón hace borrado duro, que para una preinscripción falsa es
lo que corresponde, y **no se agrega un tacho a la pestaña** (decidido el mismo día). Lo que quedó a
la vista buscándolo es otra cosa.

**La columna de acciones no existe abajo de 1024px.** El `<th>` y el `<td>` llevan
`hidden lg:table-cell` ([`students/page.tsx:258`](../src/app/students/page.tsx) y `:381`): en un
celular, o en una tablet en vertical, la columna no se aprieta ni se corta, no se dibuja. Y hay una
segunda capa debajo, que es la que hace que borrar esa clase no alcance: los botones de las tres
ramas viven en `opacity-0 group-hover:opacity-100`
([`StudentListActions.tsx:78`](../src/app/students/components/StudentListActions.tsx)), y en una
pantalla táctil no hay hover.

**Lo que se pierde no es lo mismo en cada pestaña**, y ahí está la diferencia entre una molestia y un
callejón sin salida:

| Pestaña | Acciones de la fila | ¿Hay otra puerta? |
|---|---|---|
| Pre-inscriptos | link de completar datos, activar, ver ficha | **Sí.** El nombre es link a la ficha, y ahí están el banner de activar ([`page.tsx:203`](../src/app/students/[id]/page.tsx)) y el mismo botón de completar datos ([`StudentProfileView.tsx:105`](../src/app/students/[id]/StudentProfileView.tsx)). Se pierde el atajo, no la función. |
| Activos | link de completar datos, ver ficha | **Sí**, los mismos dos. |
| Archivados | restaurar, borrar permanentemente | **No.** |

**Desde un celular, un alumno dado de baja no se puede recuperar.** `restoreStudentAction` se importa
en un solo lugar, que es la fila del listado, y la Zona de Peligro del archivado no sirve de
reemplazo: con status `DELETED` el botón cae en `softDeleteStudent`, o sea que vuelve a dar de baja a
alguien que ya está de baja. La purga permanente está igual. Son las dos únicas acciones del módulo
con una sola puerta, y es justo la que se cierra en la pantalla chica.

**Cambio.** Dos cosas, y la segunda importa más que la primera:

1. Que las acciones se vean abajo de `lg`. No basta con sacar el `hidden lg:table-cell`: hay que
   resolver también el `opacity-0` donde no hay hover, o los botones quedan presentes e invisibles,
   que es peor que ausentes.
2. Darle a *restaurar* un lugar propio en la ficha del archivado, al lado de donde ya vive el
   borrado. Sin eso la fila del listado sigue siendo la única puerta, y cualquier pantalla que la
   esconda —hoy el celular, mañana otra— vuelve a dejar sin salida al alumno dado de baja.

**Por qué P2 y no P1:** no se mueve plata y ninguna pantalla miente, y en la pestaña que destapó esto
sólo se pierde un atajo. Lo que lo sostiene arriba es Archivados: la ficha es responsive, así que
**dar de baja sí se puede desde el celular y deshacerlo no** — la asimetría exacta que el borrado
lógico existe para no tener.

**Relacionado.** [BUG-10](#bug-10) (la otra vez que la tabla no entró en la pantalla),
[ARQ-14](#arq-14) (la purga que este listado ofrece y que no puede borrar a un alumno real),
[ARQ-05](#arq-05) (la política de borrado lógico), [FIN-30](#fin-30) (volver después de una baja,
que tampoco tiene camino propio).

---

<a id="feat-20"></a>
## FEAT-20 · Acusar por correo la preinscripción, para que el que se anota no quede sin respuesta · **P2**

**Planteado el 2026-09-09.** El que completa el formulario público ve una pantalla que le dice
*"Pronto nos pondremos en contacto"* y ahí termina todo. No le queda nada: ni una constancia de que su
formulario llegó, ni un lugar donde mirar. Del otro lado, el instituto se entera por la campana
([`inscription/actions.ts:95`](../src/app/inscription/actions.ts)), que exige que alguien entre a la
plataforma ese día. **Entre las dos puntas hay un silencio que puede durar una semana**, y quien lo
sufre es el que menos puede hacer algo al respecto.

**El canal de correo ya está montado** desde [FEAT-05](#feat-05): proveedor elegible, remitente
resuelto por instituto y el par plantilla + copy con HTML y texto plano saliendo del mismo lugar. Esto
es una plantilla y una llamada. **El trabajo está en las decisiones, no en el código**, y por eso esta
ficha es mayormente decisiones.

### Es un acuse, no una copia de la ficha

El pedido arrancó como *"que se le mande un correo con los datos que puso en el formulario"*. **Se
descartó**, y es la decisión más importante de acá.

El alumno queda `PRE_INSCRIBED`: es un aspirante esperando respuesta, **no está inscripto**. Un correo
que devuelva la ficha completa se lee como una confirmación de vacante y le crea al instituto una
expectativa que después tiene que desarmar. Y los datos no le sirven a nadie: la persona los acaba de
tipear.

**El cuerpo lleva el nombre del alumno y nada más.** El nombre sí hace falta — una madre que anota a
dos hijos tiene que saber de cuál es este correo. El DNI, el nivel, el domicilio y el teléfono no
entran.

### Por qué el DNI no entra, aunque sea lo que la persona escribió

Porque en este sistema **el DNI es media credencial**. El alumno entra con DNI más contraseña, la
preinscripción le escribe `"inscripcion123"` —fija y escrita en el repositorio, [SEC-06](#sec-06)— y
el login no filtra por estado, así que un preinscripto entra igual ([SEC-12](#sec-12)).

La dirección de destino **no está verificada**: la escribió quien llenó el formulario. Si está mal
tipeada, o si la puso a propósito de un tercero, el que recibe el correo se queda con la única pieza
que le faltaba.

**Esto no ata FEAT-20 a SEC-12**: justamente por no llevar el DNI, el acuse se puede hacer hoy y SEC-12
se arregla cuando toque.

### El nivel tampoco entra, por otro motivo

Los tutores no saben a qué nivel se anota el chico — eso lo asigna el instituto. Ponerlo invita a una
pregunta que el correo no puede contestar.

De paso queda anotado que **el nivel se guarda como ID y no como nombre** (el `<select>` manda
`level.id`, [`RegistrationForm.tsx:247`](../src/app/inscription/RegistrationForm.tsx)). Las pantallas
lo resuelven, pero la notificación de la campana no: hoy la secretaria lee `Nivel: cmf3x8k2...`
([`inscription/actions.ts:89`](../src/app/inscription/actions.ts)). **Es un bug aparte y chico**, no
lo arregla esta ficha, pero está a la vista de quien la lea.

### A quién le llega

**Al alumno y al tutor 1, a los dos, los que tengan correo.** Cuando el alumno es menor los tutores
son los que pagan el curso, así que el tutor no puede quedar afuera; y un alumno de 15 con correo
propio tampoco. Hay que **normalizar y descartar repetidos**: es muy común que la madre ponga su
misma dirección en el "Email Personal" del chico y otra vez en el suyo, y sin eso le llegan dos
correos idénticos. `destinatariosDeAlumno`
([`forgot-password/actions.ts:75`](../src/app/forgot-password/actions.ts)) ya hace exactamente eso.

**El texto va en tercera persona** — *"Recibimos la preinscripción de Tomás Ferreyra a Modern English
School"*— para que le cierre a los dos lectores. Eso ahorra toda la maquinaria de `esParaOtro` que sí
necesitó el correo de recuperación.

**Al tutor 2 no se le manda.** En el formulario está rotulado "Segundo Contacto de Emergencia", y un
acuse no es una emergencia.

### El correo no se vuelve obligatorio

Se evaluó exigirlo —al alumno si es adulto, al tutor 1 si es menor— y **se descartó**. Los campos que
el negocio pide son opcionales en el schema a propósito, y trabar el formulario le cobra el precio a
la familia que menos puede pagarlo: la que no tiene correo hoy se anota igual y el instituto la llama.
Después del cambio se trabaría en la pantalla y **el instituto no se enteraría de que existió**.

En su lugar, tres cosas:

1. **Un cartel al apretar enviar**, sólo si el campo que corresponde quedó vacío, invitando a
   completarlo y ofreciendo mandar igual. Cuatro condiciones para que no termine siendo la obligación
   con pasos de más:
   - **No es un muro**: las dos salidas igual de visibles. Si "enviar sin correo" queda chiquito y
     gris al lado de un botón grande, es una obligación disfrazada.
   - **Aparece una sola vez.** Si vuelve a preguntar, la persona cree que el formulario está roto y
     abandona — el peor de los dos mundos.
   - **"Agregar mi correo" lleva el foco al campo.** En un celular ese campo quedó ocho pantallas más
     arriba; si sólo cierra el cartel, la mitad no lo encuentra y manda igual. Es la diferencia entre
     que el patrón convierta o no.
   - **Apagado en `complete-profile`**, que usa el mismo componente
     ([`page.tsx:75`](../src/app/complete-profile/[token]/page.tsx)): ahí la persona ya es alumno y no
     hay ningún acuse que perder.
2. **Texto de ayuda en el campo, en positivo** — *"Acá te confirmamos que tu inscripción llegó"*—, que
   da una razón para completarlo en vez de una penalidad por no hacerlo. **Reemplaza** al renglón de
   advertencia que se había pensado primero: anunciar el aviso antes de darlo lo vuelve repetitivo.
3. **Que la campana lo diga.** Cuando no hay ninguna dirección, el cuerpo de la notificación que el
   instituto ya recibe suma `· sin correo de contacto`. **Sin esto el cartel no sirve de nada**: la
   familia sin correo es exactamente la que se queda en el silencio que esta ficha viene a cerrar, y
   avisarle a ella que no va a recibir nada no hace que alguien la llame. La secretaria abre la
   campana, ve cuáles hay que llamar por teléfono, y el vacío se cierra por otra vía.

### El formulario es público, y eso lo vuelve un botón de mandar correo

Cualquiera puede escribir la casilla de un tercero y texto libre en el nombre, y sale un correo
firmado con el dominio del cliente. Las quejas de spam caen sobre `senderEmail` —**el mismo dominio
por el que sale la recuperación de contraseña**— y degradan la entrega de todo junto.

Juega a favor algo que no es obvio: el correo **sólo sale cuando se crea el alumno**, y
`@@unique([dni, instituteId])` bloquea el DNI repetido. Para mandar dos veces a la misma víctima hay
que inventar dos DNIs, y **cada envío deja una fila basura en la pestaña de preinscriptos**. El abuso
se acumula donde el instituto lo ve.

**Lo que se hace:**

- **Cuerpo sin texto libre más allá del nombre.** Sin eso el correo no sirve como vehículo de mensaje:
  el que lo recibe ve un acuse genérico de un instituto.
- **Tope por casilla de destino.** Antes de mandar, contar cuántas preinscripciones de las últimas 24 h
  de este instituto llevan esa misma dirección; pasado el tope, la inscripción **se guarda igual** pero
  el correo no sale. Una consulta, sin tabla nueva.

**Lo que no se hace, y por qué:**

- **Límite por IP.** Obligaría a guardar la IP de cualquiera que pase por la pantalla, que es un dato
  personal que hoy el sistema no guarda en ningún lado. Es el mismo criterio ya razonado en
  [`passwordReset.ts:70`](../src/lib/passwordReset.ts).
- **Captcha (Turnstile).** Corta la automatización, que es lo único que lleva esto a volumen dañino,
  pero es una dependencia y una clave más en dos proyectos de Vercel. **Con un solo instituto y unas
  pocas inscripciones por semana el atacante no gana nada.** Queda anotado para el día que la pestaña
  de preinscriptos aparezca con basura.
- **Mandar recién cuando el instituto acepta.** Cierra el abuso del todo porque cada envío lo aprueba
  una persona, pero mata el sentido: el punto era avisar que el formulario llegó.

### El que ya estaba registrado

Hoy ese camino devuelve *"El DNI del alumno ya se encuentra registrado en este instituto"*
([`inscription/actions.ts:113`](../src/app/inscription/actions.ts)), lo que convierte al formulario en
una forma de averiguar quién es alumno ahí. **Esta parte cambia el comportamiento de algo que ya está
en producción**, no agrega algo nuevo al lado, y es la más delicada de la ficha.

- **A la persona, la misma pantalla y el mismo correo que si fuera nueva.** No se le miente: su
  formulario llegó de verdad. Y el que estaba probando DNIs no aprende nada, porque la respuesta es
  idéntica en los dos casos.
- **Al instituto, la verdad completa por la campana**, distinguiendo cuál de los tres estados es. Los
  tres piden cosas distintas: el `ACTIVE` probablemente quiere otra cosa, el `DELETED` quiere volver
  —eso es [FIN-30](#fin-30)—, y el `PRE_INSCRIBED` está ansioso porque nadie le contestó, que es un
  problema del instituto y no suyo.

La persona no recibe la explicación: recibe la llamada. La explicación va a quien puede resolverla.

> **Corrección a [BUG-08](#bug-08) — 2026-09-09.** Esa ficha dice que `Student.dni` no tiene `@unique`
> y que por eso la preinscripción duplica alumnos. **Quedó viejo**: el schema hoy tiene
> `@@unique([dni, instituteId])` y `@@unique([email, instituteId])`, y la acción ya atrapa el `P2002`.
> El duplicado no se crea. Lo que sigue abierto de BUG-08 es qué se le contesta a cada lado, que es
> justamente lo que resuelve este bloque.

### Alcance

**Sólo el formulario público.** El alta a mano del admin
([`students/new/actions.ts`](../src/app/students/new/actions.ts)) y la actualización por token de
`complete-profile` quedan afuera. La del admin es el lugar natural de un correo de bienvenida con el
acceso, pero **ése es otro correo** y se cruza con [SEC-06](#sec-06) y [SEC-11](#sec-11).

### Relacionado

[FEAT-12](#feat-12) es el correo espejo —el aviso **al instituto**— y **sale en la misma pasada**: se
engancha en el mismo punto de la misma función, con la misma infraestructura. [FEAT-05](#feat-05)
puso el canal. [BUG-08](#bug-08) define qué es un preinscripto y comparte el bloque del duplicado.
[SEC-12](#sec-12) salió a la superficie analizando esta ficha. [SEC-06](#sec-06) es lo que vuelve
adivinable el acceso del aspirante.

---

<a id="feat-21"></a>
## FEAT-21 · Firma de la dirección y del profesor en el boletín · **P2** · 🗣️ Pedido del cliente

**Pedido (2026-09-10).** Que el profesor tenga su firma en el boletín, y la dirección también. Firman
**una vez y se replica en todos los alumnos de ese informe**.

**Punto de partida: hoy no firma nadie del instituto.** En el PDF son dos rayas con una leyenda debajo
—*"Prof. X"* y *"Firma de la Institución"*—
([`StudentReportViewer.tsx:210`](../src/components/reports/StudentReportViewer.tsx)), y en pantalla ni
las rayas. La firma de conformidad de las familias ([FEAT-09](#feat-09)) es **otra cosa** y no se
toca: aquélla es un acuse de lectura, ésta es del lado del instituto.

### Qué significa cada firma, que no es lo mismo

- **La dirección revisa.** La dueña ya lee las notas y los comentarios antes de que salgan; hoy lo
  hace fuera del sistema. Su firma dice *"revisé esto"* — es una revisión **del trabajo de otro**.
- **El profesor firma autoría.** Las notas son suyas. No revisa nada: declara que son las que puso.
- **Y de yapa, la firma del profesor es un aviso.** En el circuito real el profesor le avisa a la
  dueña que la tanda está lista para firmar. Esa firma *es* ese aviso, así que la lista de pendientes
  de ella no es "todo lo sin firmar" sino **"firmadas por el profesor y todavía no por mí"**. Sale
  gratis y es lo que le ordena los 30 cursos.

**La unidad que se firma es la tanda**: curso + plantilla + año + período. En la base **no existe como
fila**: son N `StudentReport` que comparten esas cuatro claves. Es lo que agrupa la planilla del
docente y lo que ya agrupa la pantalla de firmas
([`signatures/page.tsx:59`](../src/app/reports/signatures/page.tsx)).

### Decidido con el cliente — 2026-09-10

| | |
|---|---|
| **1 · No traba la publicación** | Se publica sin firma de nadie. Motivo del cliente: se está estrenando el mecanismo y conoce a la gente que lo usa. **La traba queda para la etapa 2** |
| **2 · Editar una nota tira la firma de la dirección, y sólo en ese alumno** | La del profesor no se cae |
| **3 · La firma de dirección es del cargo** | Cualquier ADMIN firma y el boletín imprime su nombre. La secretaría no firma |
| **4 · Se firma hacia atrás** | Dirección, profesores y tutores |
| **5 · No hay "firmar todo lo pendiente"** | Firma adentro de cada planilla, con las notas delante |
| **6 · Los profesores también firman hacia atrás** | Son 7 u 8 firmas cada uno, no 30: firman por informe |

**Por qué sólo se cae la de ella (decisión 2).** Si el profesor corrige una nota que él mismo puso,
sigue siendo el autor: no hay nada que volver a declarar, y hacerlo refirmar es un trámite sin
contenido. Ella en cambio revisó *ese* contenido, y si cambió, no lo revisó. **Y sólo en el alumno
tocado**: le cambiaron la nota a una alumna, las otras 23 sí las revisó y no hay razón para
castigarlas. Tirar la tanda entera por un typo es desproporcionado.

**Cómo se entera ella, que es lo que hace que la decisión 2 signifique algo.** Tres momentos, porque
cada uno atrapa un caso que los otros no:

1. **Antes** — aviso al profesor en la planilla: *"este informe ya lo firmó la dirección; si guardás,
   su firma se cae para los alumnos que modifiques"*. Avisa, no traba, siguiendo la decisión 1. Es lo
   único que **evita** el problema.
2. **En el momento** — notificación por la campanita, que ya existe (`NotificationBell`,
   `createNotificationForUsers`). **Se dispara en la transición** de firmada a caída, no en cada
   guardado: cinco correcciones seguidas mandan un aviso, no cinco.
3. **Después** — la pantalla de firmas, donde ve el conjunto y resuelve.

**Y un aviso al profesor cuando el ADMIN edita un informe publicado.** Su firma no se cae, pero se
entera. Razonamiento del cliente: en general va a ser la confirmación de que el cambio que él pidió se
hizo; **el caso que justifica el aviso es el otro** — que el administrador tenga un vecino cursando,
le parezca que merece más nota y la suba sin permiso. Sin el aviso, la firma del profesor queda sobre
una nota que no puso y él nunca se entera.

**El candado que ya existe cubre sólo la mitad.** Un informe publicado lo toca únicamente el ADMIN, en
la pantalla ([`ReportGradeSheet.tsx:248`](../src/app/courses/[id]/reports/[templateId]/ReportGradeSheet.tsx))
y en el servidor con 403
([`entries/route.ts:136`](../src/app/api/courses/[id]/reports/[templateId]/entries/route.ts)). Pero
como la firma **no traba** (decisión 1), ella va a firmar tandas todavía sin publicar —que es el orden
natural: el profesor carga, ella revisa, después se publica—, y ahí el profesor sigue editando sin
restricción. Por eso la detección tiene que ser del sistema y no de que ella lo note.

**Los tutores hacia atrás son la parte que más interesa (decisión 4), y ya está resuelta.** El script
[`backfill-report-signers.js`](../scripts/backfill-report-signers.js) le agrega hash y lista de
firmantes a los informes publicados antes de que existiera la firma, sin pisar `publishedAt`,
resolviendo la edad con la fecha original y sin disparar el aviso de publicación. Para dirección y
profesor firmar hacia atrás no necesita nada: entran a la planilla vieja y firman.

#### Corrido en producción el 2026-09-15

El día después de promover el lote. **209 hashes escritos y 203 firmantes creados** —202 tutores y un
alumno que ya tenía 20 a la fecha original de publicación—, repartidos en **201 informes**. Quedan
**8 sin firmante**, y la razón no es la que parece: **7 de los 8 tienen el tutor cargado en la ficha**
—nombre y, en 6 casos, teléfono o mail—, lo que les falta es la **cuenta**. `resolveSigners` mira
`GuardianStudentLink`, que son cuentas de usuario, no los campos `guardian1Name` / `guardian1Phone` /
`guardian1Email` de la ficha del alumno, que son datos de contacto. Es la misma distinción que el
panel de uso ya muestra como «con datos, sin cuenta creada» —127 alumnos al 15/09— con el texto «se
sabe a quién llamar y todavía no puede entrar». Sólo dos no tienen ni el dato: uno de ellos en un
curso de adultos, donde el firmante correcto es el alumno y lo que falta es su fecha de nacimiento.

**El camino de salida es crear esas cuentas y volver a correr el script**, que filtra por «publicado y
sin firmantes»: esos informes entran de nuevo y esta vez sí resuelven firmante. Verificado en pantalla:
las 28 tandas aparecen con su fecha real —del 11 de junio al
2 de septiembre— y `publishedAt` no se movió en ninguna. La pantalla marca además **1 informe en
«requieren atención»**, de un alumno sin fecha de nacimiento: no se pudo decidir si firmaba él, así
que le quedaron los tutores.

**Hizo falta arreglar el script antes, y el arreglo no está versionado.** Tal como estaba escribía los
209 hashes de a uno dentro de la `$transaction`, y eso no entra en los 5 segundos que Prisma le da a
una transacción interactiva: probado primero contra stage —que tenía los datos de producción por el
ensayo de la promoción— falló con `P2028 Transaction already closed`, con rollback limpio. Es el mismo
problema que [FIN-06](#fin-06) dejó escrito para los generadores masivos de cuotas, y la misma salida:
colapsar a una sola query —un `UPDATE … FROM unnest(ids, hashes)`— en vez de agrandar el timeout.

Como `/scripts` está entero en `.gitignore` —protege `scripts/.pgurl`, que tiene la clave de
producción, en un repositorio público—, **ese arreglo vive sólo en la máquina de desarrollo y esta
ficha es su único rastro**. Por lo mismo, el enlace al script de tres párrafos más arriba está roto en
GitHub, igual que la mención en
[`batchSignatures.ts:118`](../src/app/actions/batchSignatures.ts). Se arregla cambiando el ignore por
una lista blanca (`/scripts/*` y después `!*.sh`, `!*.js`, `!*.ts`), que versiona el código y nunca
los datos.

**Una aspereza conocida:** los 8 informes sin tutor vuelven a entrar en cada corrida —el filtro es
«publicado y sin firmantes», y firmantes no van a tener nunca— así que se les reescribe el hash cada
vez. Es inofensivo, porque el hash es determinista; lo que el script no sabe decir es «no hay nada que
hacer».

**Por qué no un botón de firmar todo (decisión 5).** Son 30 cursos y la primera tanda va a ser larga
—el cliente lo sabe y lo acepta—, pero un botón que firma 30 tandas de un click convierte la revisión
en un trámite y la firma vuelve a no decir nada, que es justo lo que se estuvo cuidando. Lo que sí: la
pantalla de firmas lista lo pendiente, linkea a cada planilla, **devuelve a la lista** después de
firmar y muestra el avance. Con 30 cursos eso es la diferencia entre una tarde y tres.

**La transición, para que ningún boletín ya emitido se vea peor (decisión 6).** Hoy el PDF imprime
siempre las dos rayas con los nombres. La regla nueva es *sin firma no se imprime la línea*, pero
aplicada a todo, los boletines que ya salieron **perderían** algo que hoy tienen. Entonces: **una
tanda anterior a esta funcionalidad sigue imprimiendo la raya y el nombre hasta que se firme**; cuando
la firman, la firma reemplaza la línea. Las tandas nuevas, sin firma no llevan línea.

### El modelo

Tabla nueva, `ReportBatchSignature`: `instituteId`, la clave natural de la tanda
(`courseId` + `templateId` + `year` + `periodIndex`), `signerRole` —`"ADMIN"` o `"TEACHER"`, como
`ThreadParticipant.actingRole` ya guarda el rol activo—, `userId`, `signerName`, `signedAt`,
`batchHash` y `strokeData`. Con `@@unique([courseId, templateId, year, periodIndex, signerRole])`:
una firma por rol y por tanda, y volver a firmar la reemplaza.

**No puede ser una fila en `Signature`.** La pantalla del instituto hace
`report.signatures.length > 0` ([`signatures/page.tsx:77`](../src/app/reports/signatures/page.tsx)):
la firma del profesor daría por firmada a la familia y el porcentaje de FEAT-09 pasaría a mentir.

**Por qué la clave natural y no una tabla `ReportBatch` con FK.** Es el modelo correcto y obligaría a
backfillear todos los `StudentReport` existentes. Así es puramente aditivo: **una tabla nueva, cero
columnas tocadas, cero filas migradas** — importa porque el `build` corre `migrate deploy`. La tanda
como entidad real queda como refactor posterior, y ese día también le sirve a [FEAT-19](#feat-19).

**La foto de lo firmado es un mapa por alumno, no un hash de la tanda.** El enunciado original decía
`batchHash`, un sha256 sobre la lista ordenada; **al implementar no alcanza**, y por la decisión 2:
un hash único sabe que *algo* cambió y no *a quién*, que es exactamente lo que hay que responder para
que la firma se caiga sólo en el alumno tocado. Va entonces
`contentHashes: { studentId: contentHash }`. Un alumno que no está en la foto —se inscribió después—
tampoco está cubierto, que es lo correcto: la persona que firmó nunca vio sus notas.

**Lo que habilita todo lo anterior: mantener `contentHash` también en los informes sin publicar.** Hoy
sólo se escribe para los publicados
([`entries/route.ts:231`](../src/app/api/courses/[id]/reports/[templateId]/entries/route.ts)), y sin
eso no hay contra qué comparar en la mitad donde la firma de ella tiene más sentido. Son dos líneas.
`lastEditedAt` / `lastEditedById` siguen siendo sólo de lo publicado, que es lo que audita ediciones
posteriores. No rompe el filtro de la pantalla de firmas, que pide `publishedAt` **y** `contentHash`,
pero hay que corregir el comentario de
[`publish/route.ts:150`](../src/app/api/courses/[id]/reports/[templateId]/publish/route.ts), que
documenta lo contrario.

**El trazo se copia en la firma, no se lee de la referencia.** Mismo patrón que `Signature.strokeData`:
si ella retoca su firma, los boletines viejos no se reescriben.

**El nombre del firmante se congela.** Hoy el PDF lee `course.teacher.name` en vivo
([`StudentReportViewer.tsx:151`](../src/components/reports/StudentReportViewer.tsx)), así que cambiar
el profesor del curso reescribe el nombre en boletines ya emitidos. Es **anterior a esta ficha**; con
firma se imprime el nombre congelado y al menos deja de empeorar.

### Alcance

1. **Pantalla "mi firma" en el perfil.** Es donde el profesor y la dirección registran la suya, y
   cierra un hueco de FEAT-09: la interfaz ya se la promete al tutor
   ([`ReportSignatureBox.tsx:96`](../src/components/reports/ReportSignatureBox.tsx)) y `/profile` no
   la tiene; `getMySignatureReference` quedó escrita y sin usar. **FEAT-09 todavía no está en
   producción, así que es el momento de cerrarlo.**
2. La tabla, `reportBatchHash()` y el `contentHash` en borradores.
3. **Firmar desde la planilla**, que ya pueden abrir ADMIN, SECRETARY y el docente del curso
   ([`page.tsx:45`](../src/app/courses/[id]/reports/[templateId]/page.tsx)). Autoriza por rol activo;
   la secretaría no firma.
4. **Dibujar la firma** en pantalla y en el PDF. `strokeToPath`
   ([`signatureCompare.ts:148`](../src/lib/reports/signatureCompare.ts)) ya devuelve coordenadas
   normalizadas: en pantalla es un `<path>`, en el PDF son segmentos.
5. **La pantalla de firmas**: estado por tanda, las tandas sin publicar que tengan firma del personal
   —hoy quedan fuera del filtro—, el orden por "listas para firmar" y el avance.
6. Las notificaciones: a ella cuando su firma se cae, al profesor cuando el ADMIN edita.
7. **Retención.** El trazo del personal es el mismo tipo de dato que el del tutor: se vacía con la
   regla que FEAT-09 ya definió, y el boletín viejo degrada a la raya con el nombre impreso.

**En el texto no puede decir "firma digital"**, por lo mismo que se cuidó en FEAT-09: es una firma
ológrafa digitalizada, y la Ley 25.506 usa ese término para otra cosa.

### Lo que no se toca

La firma de conformidad de las familias, el flujo de publicación y el porcentaje de firmas.

### Etapa 2

La traba: sin firma de la dirección no se publica. Y enchufar `specialFields.teacherSignature`
([`ReportTemplateManager.tsx:120`](../src/features/reports/ReportTemplateManager.tsx)), que hoy se
configura en el editor de plantillas y **nadie lee** — es configuración muerta anterior a esta ficha.

### Implementado — 2026-09-10

Migración `20260910120000_add_report_batch_signatures`: **una tabla nueva, cero columnas tocadas,
cero filas migradas.** Lo construido:

- [`ReportBatchSignature`](../prisma/schema.prisma) con la clave natural de la tanda y el mapa de
  hashes por alumno.
- [`batchSignatures.ts`](../src/lib/reports/batchSignatures.ts) con las reglas puras —qué cubre una
  firma, qué alumnos se le cayeron, qué tanda es anterior a la funcionalidad— y
  [`batchSignatureQuery.ts`](../src/lib/reports/batchSignatureQuery.ts) con el cruce, que **no
  devuelve las firmas caídas**: para el boletín es como si no estuvieran.
- [`signReportBatchAction`](../src/app/actions/batchSignatures.ts), con `unsign` para sacar la
  propia. Autoriza la de dirección por rol activo y la del docente por ser el del curso.
- **Firmar una tanda vieja resuelve sus firmantes.** Escribirle el hash a un informe publicado antes
  de que la firma existiera es lo que lo mete en la pantalla de firmas de las familias, y sin
  firmantes entraría mostrando a **todos** los alumnos como *"sin firmante"*. La acción los resuelve
  con la **fecha original de publicación**, igual que el script. El script sigue haciendo falta para
  habilitar todo de una; esto saca la dependencia del orden, que era la trampa: firmar antes de
  correrlo ensuciaba la pantalla.
- El panel de firma en la planilla
  ([`BatchSignaturePanel.tsx`](../src/app/courses/[id]/reports/[templateId]/BatchSignaturePanel.tsx)),
  **arriba y no en la barra del final**: con treinta cursos, que el botón esté sin scrollear es la
  diferencia entre una tarde y tres. Ahí va también el aviso al docente de que guardar tira la firma
  de la dirección.
- La pantalla "Mi firma" en el perfil
  ([`SignatureManager.tsx`](../src/components/reports/SignatureManager.tsx)), que cierra la promesa
  de FEAT-09 y es por donde el personal registra su trazo. Con la referencia puesta, firmar una
  tanda es un click.
- El boletín dibuja las firmas en pantalla y en el PDF —vectorial, punto por punto, sin pasar por
  imagen— con el corte `BATCH_SIGNATURES_SINCE` para que las tandas viejas conserven la raya.
- La pantalla de firmas suma las tandas **sin publicar** que tengan firma del instituto, el estado
  por tanda, y el orden que sale del circuito real: primero las que el docente ya firmó y ella no.
- Los dos avisos, en [`batchSignatureNotices.ts`](../src/lib/reports/batchSignatureNotices.ts).

**Un arreglo de FEAT-09 que salió en el camino.** El alumno de 20 o más **no podía firmar su propio
informe**: `/academics` monta el visor sin pasarle `viewer`
([`StudentAcademicsView.tsx`](../src/app/dashboard/components/StudentAcademicsView.tsx)), así que el
cuadro de firma no aparecía nunca — y a él no le firma nadie más, con lo cual su informe quedaba
pendiente para siempre. Corregido acá porque FEAT-09 todavía no salió a producción.

**Un docente sólo puede firmar los cursos que tiene hoy.** El permiso sale de `course.teacherId`,
que es el docente **actual**. Si un curso cambió de profesor durante el año, el que dictó el 1°
trimestre no puede entrar a firmarlo y el que está ahora lo firmaría con su nombre sobre notas que
no puso. No se resolvió: `StudentReport` no guarda quién lo dictó, y arreglarlo de verdad es darle
al informe su propio docente. **Mientras tanto, conviene mirar si hubo cambios de docente antes del
operativo de firma hacia atrás.**

**Qué falta verificar en stage.** Con la dueña: firmar una tanda sin publicar, publicarla y
confirmar que la firma sale en el PDF de la familia. Con un docente: que su firma aparezca en la
lista de ella como "lista para firmar". Editar una nota de una tanda firmada y confirmar las tres
cosas: que el boletín de **ese** alumno pierde la firma de dirección, que los demás la conservan, y
que a ella le entra un solo aviso. Y que un boletín viejo sin firmar siga imprimiendo la raya con el
nombre como antes.

---

<a id="bug-16"></a>
## BUG-16 · El alumno y el tutor no pueden descargar el recibo de un pago · **P1** · 🗣️ Pedido del cliente

**Reporte (2026-09-10).** Los alumnos y los tutores no pueden descargar los recibos de sus pagos.

**El botón está bien; la acción que llama los echa.** `ReceiptDownloadButton` le pide los datos a
`getReceiptDataAction`, y esa acción entra por el `getAuthAndInstitute` del módulo de pagos, que exige
`requireRole(["ADMIN", "SECRETARY"])` ([`payments/actions.ts:18`](../src/app/payments/actions.ts)).
`requireRole` corta dos veces ([`authz.ts:141`](../src/lib/authz.ts)): primero por `ctx.isStudent`,
que voltea al alumno, y después por el rol activo, que voltea al tutor. Vuelve
`{ success: false, error: "No autorizado" }` y el botón lo muestra tal cual en un `alert`
([`ReceiptDownloadButton.tsx:60`](../src/components/financials/ReceiptDownloadButton.tsx)).

**El síntoma exacto es un cartel que dice "No autorizado".** Si lo que vieron fue otra cosa —que no
pasa nada, o que baja un PDF roto— hay un segundo problema y esta ficha no lo cubre; ver el último
bloque.

### Son dos bugs con historias distintas

**El del tutor es una regresión del 2026-08-10**, commit `782f9f3`. Antes el chequeo era
`user.role !== "SUPERADMIN" && user.instituteId`: cualquier tutor pasaba y el recibo bajaba. La
migración a `requireRole(["ADMIN", "SECRETARY"])` le cerró la puerta.

**Y no fue un descuido.** [SEC-03](#sec-03) lista textualmente `getReceiptDataAction` entre las 16
acciones a cerrar. Pero las otras 15 escriben plata —cobran, anulan, generan cuotas, borran— y ésta es
la única que es una **lectura que dos portales de fuera del instituto ya estaban usando**. Se fue con
el lote.

**El del alumno nunca funcionó.** [`/administration`](../src/app/administration/page.tsx) existe desde
el 2026-04-18 con el botón puesto, y el helper viejo buscaba
`prisma.user.findUnique({ where: { email } })`: los alumnos viven en `Student`, no en `User`, así que
siempre devolvió `null`. Es el golpe de [ARQ-15](#arq-15), el mismo de [BUG-01](#bug-01) — lo que
cruza las dos tablas de identidad hay que construirlo dos veces, y lo que se construye una sola vez
deja afuera a una de las dos.

**A quién le pega hoy:** a todos los tutores, en el histórico de
[`guardian/payments`](../src/app/guardian/payments/page.tsx), y a los alumnos **mayores de edad** en
`/administration`. Los menores no llegan: la pantalla los redirige y el `Navbar` ni les dibuja el
acceso.

### Sumar los dos roles a la lista es el arreglo equivocado

Si a `getReceiptDataAction` se le agregan `GUARDIAN` y `STUDENT`, el único filtro que queda es el del
instituto ([`payments/actions.ts:1089`](../src/app/payments/actions.ts)). Con un solo instituto eso no
filtra nada: cualquier tutor logueado, mandando un `paymentId` que no es suyo, se baja el recibo de
otra familia con nombre, domicilio e importe. Un server action es un POST como cualquier otro y el
`paymentId` viaja en el cuerpo — el mismo argumento con el que se escribió SEC-03, ahora en el otro
sentido.

**El corte no es por rol, es por vínculo.** Tres caminos sobre el mismo pago:

| Quién | Qué tiene que ser cierto |
|---|---|
| ADMIN / SECRETARY | `payment.fee.instituteId === auth.instituteId` — lo de hoy |
| STUDENT | `payment.fee.studentId === ctx.userId` |
| GUARDIAN | hay un `GuardianStudentLink` entre `ctx.userId` y `payment.fee.studentId` |

**Cambio.** Que la acción entre por `getAuthContext()` en vez de por el helper de pagos y decida con
esa tabla. Conviene que **viva fuera de `payments/actions.ts`**: ese módulo es la caja, y todo lo que
está adentro asume `["ADMIN", "SECRETARY"]`. Dejar una excepción en el medio es invitar al próximo
barrido a repetir exactamente esto.

### Lo que esta ficha no arregla

El PDF se arma entero en el navegador y `generatePaymentReceipt` envuelve todo en un `try` que sólo
hace `console.error` ([`generateReceipt.ts:226`](../src/lib/pdf/generateReceipt.ts)): si falla algo
adentro, el botón deja de girar y no pasa nada más. Desde afuera se ve igual que este bug, y no deja
ni un rastro que se pueda pedir. No es la causa del reporte, pero es lo que lo va a tapar la próxima
vez.

**Y ya hay algo cayéndose ahí adentro, en silencio: el logo.** `institute.logoUrl` es una URL de
Cloudinary y se la pasa como está a `doc.addImage`, que no busca nada por la red — sólo acepta base64,
un data URI o un elemento del DOM. Tira, lo agarra el `catch` de al lado y el recibo sale con el
nombre del instituto en texto. **Nadie se entera de que el logo nunca estuvo**, y el que emite el
recibo tampoco, porque el fallback se ve prolijo. Arreglarlo es leer la imagen antes de armar el PDF y
pasarla convertida.

**Relacionado.** [SEC-03](#sec-03), de donde salió. [ARQ-15](#arq-15) y [BUG-01](#bug-01), la
identidad partida en dos tablas. [FIN-19](#fin-19) toca el mismo recibo por el otro lado: el concepto
que no nombra el curso. [ARQ-09](#arq-09), los errores que no se registran en ningún lado.

---

<a id="bug-17"></a>
## BUG-17 · Las clases que cargan las docentes no aparecen en el calendario · **P1** · 🗣️ Pedido del cliente

**Reporte (2026-09-13).** Las profesoras cargaron las clases de sus cursos y en el calendario no se
ven. La captura que llegó muestra las 61 tarjetas de la semana, todas en gris punteado y todas
diciendo «Pendiente».

**La grilla dibujaba las siete columnas corridas un día.** En la captura, la columna rotulada **LUNES
llevaba la fecha 15/9**, que es martes. Las tarjetas estaban bien puestas —van por `dayOfWeek` del
horario—, pero la **fecha** contra la que cada columna buscaba su clase era la del día siguiente. La
tarjeta de un curso de lunes preguntaba si había clase el martes. Nunca la hay.

### La causa: dos puntas calculando el mismo lunes con reglas distintas

El servidor sacaba su lunes con `date-fns` y `weekStartsOn: 1`
([`schedule/page.tsx:151`](../src/app/schedule/page.tsx)), y la grilla sacaba el suyo con dayjs
([`WeeklyGridView.tsx:52`](../src/app/schedule/components/WeeklyGridView.tsx)):

```js
const startOfViewWeek = dayjs(currentDate).startOf('week').add(1, 'day');
```

Ese `.add(1, 'day')` compensaba que dayjs arranca la semana **en domingo**. Y es cierto — mientras el
locale sea el de fábrica:

| locale de dayjs | `weekStart` | Qué hace la línea |
| --- | --- | --- |
| `en` (fábrica) | 0 · domingo | De lunes a sábado da el lunes correcto. **Los domingos** `startOf('week')` devuelve ese mismo domingo y el `+1` salta al lunes **siguiente**: la grilla se corre una semana entera. |
| `es` | 1 · lunes | `startOf('week')` ya devuelve el lunes, el `+1` sobra y la grilla se corre **un día, todos los días**. |

**El locale de dayjs es global de la pestaña, y lo pone otra pantalla.** `dayjs.locale("es")` se
ejecuta al cargarse [`StudentDashboardV2View.tsx:22`](../src/app/dashboard/components/StudentDashboardV2View.tsx)
y [`StudentAcademicsView.tsx:32`](../src/app/dashboard/components/StudentAcademicsView.tsx), que lo
necesitan para escribir los meses en castellano. Son los dos únicos lugares del repo que lo tocan. El
calendario nunca lo pidió: se lo encuentra puesto.

En el build se ve el reparto:

```
dayjs.locale("es") aparece solo en:   app/dashboard/page-*.js
                                      app/academics/page-*.js
chunks de WeeklyGridView:             0 ocurrencias
```

**Por eso el bug parecía depender del dispositivo, y no depende.** Es el mismo JavaScript en Windows,
Android e iPhone. Lo que cambia es por dónde se entró al calendario **en esa pestaña**:

| Cómo se llega a `/schedule` | locale | Columna LUNES | Qué se ve |
| --- | --- | --- | --- |
| Login → Inicio → Calendario | `es` | 15/9 | 0 clases, todo «Pendiente» |
| Entrada directa: marcador, recarga dura, ícono del PWA | `en` | 14/9 | las clases aparecen |

Es estado, no configuración. Una recarga dura lo "arregla" y volver a pasar por Inicio lo rompe de
nuevo — de ahí que el reporte sea tan difícil de describir y que a una persona le funcione y a otra no.

### Medido contra producción

Con las columnas corridas un día, sobre los 31 cursos activos de la semana del 14/09:

```
tarjetas dibujadas: 61   ·   tarjetas que enganchan clase: 0
```

Cero, siempre. No es que se vieran pocas: no se veía **ninguna**, en ninguna semana. Con las columnas
en su lugar, esa misma semana muestra **15 tarjetas con clase, 8 con el tema escrito**; la semana
anterior —la que las docentes habían cargado— muestra **24 con clase y 21 con tema**.

### El arreglo: la semana se calcula una sola vez

No se tocó el `+1`. Parchearlo dejaba viva la causa, que es que hubiera dos cuentas. **El servidor
calcula las siete fechas y se las pasa a la grilla**, que ya no hace aritmética de fechas: dibuja lo
que recibe. Así las dos puntas no pueden discrepar por construcción, y `dayjs` salió del componente.

Dos decisiones de detalle:

- **La cuenta va en UTC y sin librería.** `Lesson.date` es un `date` de Postgres —un día, sin hora—,
  así que la semana es un rango de días calendario, no de instantes. `date-fns` calcula en la zona del
  proceso, y eso hacía que el mismo instante cayera en semanas distintas según dónde corriera. Ahora
  no depende ni de la zona del servidor ni de la del dispositivo.
- **Se fue el `.add(12, 'hour')`** de la comparación de clases. Compensaba que la fecha llega como
  medianoche UTC y se leía en hora local, y aguantaba de UTC−11 a UTC+11 — suficiente para Argentina,
  pero una trampa esperando a alguien. Las fechas se comparan como texto `yyyy-MM-dd`, que ordena igual
  que una fecha y no tiene zona.

### Lo que esta ficha no arregla

Dos cosas que aparecieron midiendo y que siguen en pie:

1. **El calendario dibuja `Schedule`, no `Lesson`.** La clase es un adorno de la tarjeta del horario
   que cae ese día de la semana. Una clase cargada en un día en que el curso no tiene horario **no
   aparece nunca**: hoy hay 17 así en producción —15 de «Children 3 TM», que se generaron con horario
   L-M y después el horario pasó a M-J, más dos recuperatorios—. Y si hay **dos clases el mismo día**,
   la tarjeta muestra una sola: pasa hoy con «Upper-intermediate M-J early shift» el 08/09.
2. **El calendario abre en la semana en curso, que es la que todavía nadie llenó.** La docente escribe
   el tema después de dar la clase, así que la pantalla que se abre por defecto siempre muestra la
   mayoría de las tarjetas en «Pendiente» — 46 de 61 la semana del 14/09, contra 24 con clase la
   semana anterior. Es lo mismo que quedó anotado en [FEAT-06](#feat-06) el 2026-08-18, resuelto
   entonces sólo para la tarjeta del par y no para la vista.

### Verificado en stage el 2026-09-15 (`60cf0d5`)

Los números, predichos contra la base **antes** de abrir el navegador, en los cuatro casos:

- **Semana, como dirección.** Semana del 3/8: se dibujan **60 tarjetas de las 61 plantillas**
  —«Adults Level A2» arranca el 6/8 y por eso no entra en la columna del martes—, **30 con clase** y
  **26 con tema**. Dio exacto en las cinco columnas.
- **Día.** Martes 4/8: «Mostrando **14** clases», 6 con tema, 1 en «sin registrar» y 7 pendientes.
  Coincide con lo que la vista Semana muestra para ese mismo día, que es justamente el punto: las dos
  vistas ahora cuentan lo mismo.
- **Pares, como Agustina Melluso.** Semana del 10/8: 6 plantillas, 4 con «Otro docente», y los cuatro
  bordes **medidos** en `rgb(148, 163, 184)` —incluidos los de «Unit 7A» y «Unit 7»—, o sea el par en
  gris aunque tenga tema, con «Ver Temas» y nunca «Asistencia». Con `pares=0` quedan 2, las propias.
- **El camino del reporte**: entrar por Inicio y pasar al Calendario por el menú, sin recargar. Abre
  en LUNES 14/9 con las clases enganchadas. Era el camino que lo rompía.

**Lo que quedó sin medir:** una tarjeta **propia con clase** tomando el color del curso. El curso de
la docente de prueba corre del 6/8 al 10/12 y sus diez clases están entre el 19/3 y el 30/4 — cero
dentro de su propio rango, que es el mismo patrón de las 17 clases huérfanas de más arriba. Esa rama
(`linkedLesson && !isPeer`) no la tocó este cambio.

**Relacionado.** [FEAT-07](#feat-07), que es donde se escribió la tarjeta del calendario y donde ya se
había corregido el otro defecto de la vista diaria. [BUG-14](#bug-14), los filtros del calendario que
no avisan que filtran — el mismo síntoma para el usuario: la pantalla muestra de menos sin decirlo.
[BUG-18](#bug-18) salió de probar ésta.

---

<a id="bug-18"></a>
## BUG-18 · La vista Día del calendario no ofrece tomar asistencia · **P2**

**De dónde sale.** De verificar [BUG-17](#bug-17) por pantalla en stage, el 2026-09-15. Con la vista
Día en el martes 4/8 había **14 tarjetas, 7 de ellas con la clase cargada** — y las catorce ofrecían
el mismo botón: «Ver Curso».

**La misma clase, en la vista Semana, ofrece «Asistencia»** con enlace directo a
`/courses/:id/lessons/:lessonId/attendance`
([`WeeklyGridView.tsx:214`](../src/app/schedule/components/WeeklyGridView.tsx)). En la vista Día el
botón tiene sólo dos ramas, y ninguna es ésa
([`schedule/page.tsx:440`](../src/app/schedule/page.tsx)):

```tsx
<Link href={`/courses/${schedule.course.id}`}>
    {schedule.isPeer
        ? <><Eye size={14} /> Ver Temas</>
        : <><BookOpen size={14} /> Ver Curso</>}
```

**Está al revés de lo que uno esperaría.** La pantalla se llama «Clases del Día» y es la que una
docente abre para el día que está dando; es exactamente la que no ofrece el atajo. Desde la agenda
semanal, que es para mirar la semana, sí. Llegar igual se llega —Ver Curso → el mes → la clase →
asistencia— pero son tres pantallas de más, todos los días.

**No es una decisión, es un olvido, y hay rastro.**
[`schedule/page.tsx:10`](../src/app/schedule/page.tsx) importa `ClipboardCheck` —el ícono que
`WeeklyGridView` usa **exactamente** para el botón de asistencia— y no lo usa en ninguna parte del
archivo. ESLint lo viene marcando como importación sin uso desde entonces.

**El arreglo es corto: los datos ya están calculados.** La vista Día resuelve `lesson` y `hasLesson`
([`schedule/page.tsx:376`](../src/app/schedule/page.tsx)) para decidir el color y el rótulo de la
tarjeta; sólo falta usarlos también en el `href`. Y hay que conservar la regla del par: al par **no**
se le ofrece asistencia, porque el servidor se la rechazaría y ofrecerla sería prometer algo que no va
a pasar — es lo que ya hace la grilla semanal.

**Relacionado.** [BUG-15](#bug-15), la misma forma en otra pantalla: una vista que no ofrece las
acciones que la otra sí. [FEAT-07](#feat-07), de donde sale la regla del par.

---

<a id="bug-19"></a>
## BUG-19 · El panel de uso declara en producción una fecha desde la que nunca midió · **P2**

**De dónde sale.** Del ensayo del 2026-09-15, antes de promover el lote: backup de producción
restaurado sobre la base de stage y redeploy con las siete migraciones pendientes. Las migraciones
corrieron limpias. Lo que no viaja con ellas es el piso.

**Los dos pisos son constantes, y la fecha que tienen es la de stage.**
[`piso.ts:21`](../src/app/dashboard/usage/piso.ts) y [`piso.ts:31`](../src/app/dashboard/usage/piso.ts)
fijan `PISO_QR` y `PISO_REGISTRO` al **2026-08-23**, que es el día en que `add_activity_day` y
`add_attendance_source` entraron en la base de **stage**. En producción esas dos migraciones se
aplican el día de la promoción: `ActivityDay` nace vacía y `Attendance.source` nace con todas las
filas en `MANUAL`, puestas por el default de la columna y no por nadie que las haya mirado.

**Tres frases de la pantalla quedan falsas el día que se promueve:**

- «Midiendo desde el 23/8» — con el gráfico vacío hasta la fecha del despliegue, que se lee como que
  en ese mes no entró nadie.
- «Hasta el 23/8 figura el último rastro indirecto; desde esa fecha, el ingreso real» — con los 173
  tutores en «Nunca».
- «El origen se distingue desde el 23/8» — sobre marcas cuyo origen nunca se distinguió.

**El número que lo vuelve concreto.** De las 542 marcas de asistencia de producción, **465 se
crearon entre el 29/8 y el 14/9**: el 86% de la tabla, entera dentro del rango que la pantalla
declara medido. Ninguna lo fue. El valor que muestran es casi seguro el correcto —en producción el
escáner no dejó una sola marca, medido sobre `notes` antes de migrar— pero la pantalla lo afirma por
un default, no por una medición, y ésa es la diferencia que el panel existe para no borrar.

**Es exactamente lo que el propio archivo dice querer evitar:** «Cero y "no medido" son cosas
distintas, y confundirlas es exactamente cómo el administrador termina concluyendo que en marzo no
entraba nadie». El mecanismo está bien resuelto —una métrica sin historia dice desde cuándo mide en
vez de mostrar un cero—; lo que quedó atado a un entorno es la constante.

**El arreglo: que cada base diga su propio piso.** La fecha real ya está guardada en cada base, en
`_prisma_migrations.finished_at` de `20260822180000_add_activity_day` y
`20260823160000_add_attendance_source`. Derivarla de ahí hace que stage siga diciendo 23/8, que
producción diga la fecha de su promoción, y que una base nueva no necesite que nadie se acuerde de
tocar el archivo. `piso.ts` ya tiene la forma para recibirlo: las dos fechas viven juntas y la
pantalla las lee por `pisoCorto()`.

**Lo que esta ficha no arregla.** Las 465 marcas de producción quedan en `MANUAL` igual: el origen de
lo que ya pasó no se puede recuperar, porque el escáner tampoco lo escribía. Mover el piso no cambia
el dato, cambia lo que la pantalla dice sobre él.

**Relacionado.** [FEAT-11](#feat-11), de donde salen las ocho métricas del panel.
[BUG-12](#bug-12), el escáner que pisaba la observación de la docente y el motivo de que el origen
anterior sea aproximado.

---

<a id="bug-20"></a>
## BUG-20 · La ficha dice «Sin datos registrados» teniendo el teléfono del tutor · **P3**

**De dónde sale.** De verificar [FEAT-28](#feat-28) en stage el 2026-09-16. La ficha de un alumno de
70 años mostraba la sección de tutores con las dos tarjetas en «Sin datos registrados»; en la base
tenía `guardian1Phone` cargado.

**La tarjeta anida el contacto adentro del nombre.** En
[`StudentProfileView.tsx`](../src/app/students/[id]/StudentProfileView.tsx) la rama es
`guardian1Name ? (nombre + celular + email) : g1Link ? (datos de la cuenta) : «Sin datos
registrados»`. Sin nombre y sin cuenta vinculada, el teléfono y el correo **no tienen dónde
dibujarse**, aunque estén guardados. Lo mismo del lado del Tutor 2.

**No es sólo feo, la pantalla afirma algo falso.** «Sin datos registrados» le dice a la secretaría que
no hay a quién llamar, y hay un teléfono. Es la misma forma que [BUG-19](#bug-19): la pantalla
declarando algo que el dato no sostiene.

**Son 8 alumnos activos en producción** con teléfono o correo de tutor cargado, sin nombre y sin
cuenta vinculada. Siete de ellos tienen 20 o más, que es lo que lo hizo visible: son justo los que
[FEAT-28](#feat-28) estaba evaluando.

**El arreglo es de la tarjeta, no del dato.** Dibujar el contacto que haya aunque falte el nombre —con
un rótulo honesto del tipo «Tutor sin nombre cargado»—, en vez de tratar el nombre como condición
para mostrar lo demás.

**Cuidado con el orden.** Mientras la tarjeta no dibuje ese teléfono, la regla de
[FEAT-28](#feat-28) **no** lo cuenta como dato, justamente para no dejar la sección vacía. Si se
arregla esto, hay que sumar teléfono y correo a
[`muestraSeccionDeTutores`](../src/lib/tutores.ts) en el mismo commit, o la sección va a esconder algo
que pasó a verse.

---

<a id="bug-21"></a>
## BUG-21 · 🗣️ La tarjeta de asistencia del tutor no mide el período que anuncia · **P2**

**De dónde sale.** Una madre preguntó el 2026-09-17 qué significaba la tarjeta «Asistencia» de su
portada: si el 70% era del mes, y de dónde salía «Culture». Las dos preguntas tienen la misma
respuesta — la tarjeta no muestra lo que su título dice.

**Qué muestra en realidad.** Es la portada del tutor
([`GuardianDashboardView.tsx:142`](../src/app/dashboard/components/GuardianDashboardView.tsx)). El
anillo es el porcentaje de las **últimas 10 marcas de asistencia**, sin ningún corte de fecha
([`dashboard/page.tsx:87`](../src/app/dashboard/page.tsx)). Los tres renglones de abajo son las
**últimas 3 clases**, cada una con el `topic` que cargó el docente y el estado del alumno. «Culture»
no es ninguna categoría del sistema: es el tema de esa clase, escrito por la profesora.

Son cuatro defectos distintos en la misma tarjeta, y se pueden arreglar por separado:

1. **El rótulo miente sobre el período.** Dice «Período Académico Actual» y son las últimas 10
   marcas, vengan del mes que vengan. El producto tiene una noción real de período
   —[`usage/periodo.ts`](../src/app/dashboard/usage/periodo.ts), la que usa el panel de uso— y la
   tarjeta no la usa. Es la misma forma que [BUG-19](#bug-19) y [BUG-20](#bug-20): la pantalla
   afirmando algo que el dato no sostiene.
2. **Con dos hijos, los mezcla.** El cálculo aplana las marcas de todos los alumnos vinculados,
   ordena por fecha y se queda con 10
   ([`dashboard/page.tsx:147`](../src/app/dashboard/page.tsx)): un solo anillo para dos chicos, y los
   tres renglones sin decir de quién es cada clase. **Le toca a 29 de los 174 tutores de
   producción** — los mismos 29 de [FEAT-29](#feat-29).
3. **La consulta del tutor no descarta las clases borradas.** Le falta el
   `where: { lesson: { status: "ACTIVE" } }` que sí tienen la del alumno
   ([`dashboard/page.tsx:215`](../src/app/dashboard/page.tsx)), la del hub del tutor
   ([`guardian/academics/page.tsx:78`](../src/app/guardian/academics/page.tsx)) y la del legajo
   ([`academics/page.tsx:41`](../src/app/academics/page.tsx)). **Hoy no cambia ningún número: hay 0
   marcas colgando de clases borradas.** Es la fila que falta para que siga siendo cierto, no un
   error que alguien esté viendo.
4. **La leyenda del gráfico se encima con el texto.** El contenedor mide `h-32` (128px) y el gráfico
   declara `min-h-[220px]`
   ([`GuardianAttendanceChart.tsx:41`](../src/app/dashboard/components/GuardianAttendanceChart.tsx)),
   así que la leyenda de Recharts cae sobre el tercer renglón. En la captura de la madre se lee
   «Reading: a poem● Ausente ● Presente».

**«Tarde» cuenta como presente** en el anillo, y eso hoy no mueve nada: de las 772 marcas de
producción hay **641 presentes, 130 ausentes, 1 justificada y ninguna tarde**, aunque el parte
ofrece los cuatro botones
([`AttendanceForm.tsx:162`](../src/app/courses/[id]/lessons/[lessonId]/attendance/AttendanceForm.tsx)).
Conviene saberlo antes de rediseñar el número: el estado existe y nadie lo usa.

**Por qué P2 y no P1.** El número es engañoso, no está roto: para el tutor de un solo hijo con
clases recientes, «últimas 10» y «período» se parecen bastante. Lo que no se arregla solo es el
rótulo y el caso de los hermanos.

**Lo que este arreglo no resuelve.** Aunque el anillo diga la verdad, sigue sin haber dónde ver el
detalle completo — que es lo que la madre quería en realidad. Eso es [FEAT-30](#feat-30).

---

<a id="bug-22"></a>
## BUG-22 · Los cuatro contadores del Hub del alumno no comparten universo · **P3**

**De dónde sale.** De buscar, para [FEAT-30](#feat-30), qué había ya parecido a un historial de
asistencia. Lo más cercano son los cuatro números de colores del Hub de Progreso del alumno
([`StudentAcademicsView.tsx:266`](../src/app/dashboard/components/StudentAcademicsView.tsx)): Total
Clases, Clases Dictadas, Asistencias y Faltas.

**Invitan a una cuenta que no cierra.** Se calculan en
[`academics/page.tsx:116`](../src/app/academics/page.tsx) y salen de dos universos distintos:

- **Total Clases** y **Clases Dictadas**: clases `ACTIVE` del **curso principal** (`enrollments[0]`).
- **Asistencias** y **Faltas**: marcas del alumno en **todos sus cursos**, de toda su historia, sin
  límite de fecha.

Así que «Dictadas − Asistencias − Faltas» no da «clases sin registrar»: pueden sobrar marcas de un
curso anterior y faltar las de las clases sin parte. Dos universos con la misma tipografía, uno al
lado del otro.

**Tres detalles más chicos, del mismo párrafo.**

- **`enrollments` no filtra por estado** en esta consulta
  ([`academics/page.tsx:26`](../src/app/academics/page.tsx)), a diferencia del dashboard
  ([`dashboard/page.tsx:203`](../src/app/dashboard/page.tsx)). El «curso principal» puede ser uno
  que el alumno dejó.
- **`enrollments[0]` no tiene `orderBy`**: cuál es el primero lo decide la base. Con dos
  inscripciones, el curso que titula la pantalla puede cambiar entre dos recargas.
- **«Justificado» no entra en ningún contador**: Asistencias es `PRESENT`+`LATE` y Faltas es sólo
  `ABSENT`. Hoy es exactamente 1 marca en producción.

**Por qué P3.** Son números feos en una pantalla que no decide nada: no hay plata ni permisos de por
medio. Pero **si se hace [FEAT-30](#feat-30) hay que resolverlo en el mismo trabajo**, porque la
pantalla nueva es justamente la que vuelve verificable esta cuenta.

---

<a id="feat-22"></a>
## FEAT-22 · Notificaciones push: el sobre solo no alcanza · **P2**

**De dónde sale.** De la ronda de decisiones de [FEAT-06](#feat-06) (2026-09-13). Ahí se descartó el
correo —"están saturados y la gente no los mira"— y quedó el sobre como único aviso de que llegó un
mensaje. El push quedó anotado como el reemplazo, para más adelante.

**El número que lo justifica, medido en producción el 2026-09-13.** De las 118 participaciones en
hilos, **el 80% de las de alumnos y el 86% de las de tutores tienen `lastReadAt` en `null`**: nunca
abrieron el hilo en el que están. Las de docentes y staff, 0% — pero es esperable, son los que
escriben. Dicho en limpio: **el instituto escribe y ocho de cada diez familias no leen.** No es un
problema de contenido ni de adopción del módulo, que viene creciendo; es que no hay forma de que se
enteren si no entran solas a la app.

**Eso le cambia el sentido a [FEAT-06](#feat-06).** Abrir el canal de ida sirve de poco si el de
vuelta tiene esa tasa: la familia escribe, la docente contesta, y la respuesta se queda adentro de
una campana que nadie mira. **Este ítem sube a P1 el día que se abra el canal de las familias.**

**Qué falta.** La base ya está: la app es PWA con service worker propio (`@ducanh2912/next-pwa`,
`public/sw.js`) y ya tiene el diálogo de instalación (`@khmyznikov/pwa-install`). Falta el par de
claves VAPID, una **tabla de suscripciones por dispositivo** —una persona puede tener varias, y
caducan solas, así que hay que darlas de baja cuando el proveedor las rechaza— y el handler en el
worker.

**La salvedad que decide si sirve, y no es un detalle de implementación.** En iPhone el push web
**sólo llega si la PWA está instalada** en la pantalla de inicio; en el navegador suelto no existe.
Así que la tasa de instalación pasa a ser parte del problema: sin ella, este ítem no mueve la aguja
en la mitad del padrón.

**Y para los alumnos no compite con nada.** 348 de los 362 alumnos activos —el 96%— no tienen correo
cargado: entran con DNI. Para ellos el push no es una alternativa al correo, es el único aviso
posible fuera de la app.

**Relacionado.** [FEAT-06](#feat-06), de donde sale. [BUG-06](#bug-06), el otro extremo del mismo
problema: el aviso que sí existe, roto para el admin.

---

<a id="feat-23"></a>
## FEAT-23 · Los hilos de mensajes no se cierran nunca · **P3**

**De dónde sale.** Planteo del cliente durante la ronda de [FEAT-06](#feat-06), el 2026-09-11: *"los
chats no tienen que vivir para siempre; cuando un estudiante cambia de curso, o cuando el curso
termina, no tiene sentido que sigan accesibles"*. Se decidió **no implementarlo ahora** y dejarlo
anotado.

**Adentro hay dos cosas, y una se resuelve sola.** Abrir hilos *nuevos* con el docente equivocado no
va a pasar: la lista de destinatarios se arma de inscripciones activas y cursos activos, así que el
docente del curso que el alumno dejó simplemente no aparece. Lo que falta decidir es qué pasa con
**los hilos ya abiertos**.

**La forma recomendada: se cierran, no se borran.** Sólo lectura. Una conversación entre una familia
y una docente es registro del instituto, y acá el borrado es siempre lógico ([ARQ-05](#arq-05)).

**Y derivado, sin columna nueva.** El hilo va a saber el curso y el alumno, así que *"¿sigue activa
esa inscripción y sigue activo el curso?"* se contesta sola, sin proceso que correr ni hilos que
alguien se olvide de cerrar. No contradice la columna `studentId` que suma FEAT-06: **se congela el
sujeto y se deriva el permiso** — de quién se hablaba es un hecho del pasado y hay que guardarlo;
quién puede escribir hoy es una pregunta del presente.

**El prerrequisito es gratis y hay que cumplirlo desde ahora:** que los hilos que abren alumnos y
tutores lleven `courseId` **siempre**. Hoy es opcional en `MessageThread`, pero la costumbre ya va
para ese lado — de los 27 hilos en producción, **26 tienen curso**. Exigirlo no cambia nada de lo
que se viene haciendo; sólo evita que entren hilos que después nadie sepa cuándo cerrar.

**Por qué P3.** El hilo más viejo en producción es del 2026-05-12 y son 27 en total. No hay volumen
de hilos viejos que moleste todavía. Se vuelve visible cuando termine el primer ciclo lectivo
completo con el canal de las familias abierto.

---

<a id="feat-24"></a>
## FEAT-24 · Buscar dentro del contenido de los mensajes · **P3**

**De dónde sale.** De la ronda de [FEAT-06](#feat-06) (2026-09-13). El buscador que entra en la
bandeja es **sólo por asunto** — un `contains` sobre una columna. Buscar dentro del cuerpo de los
mensajes se dejó explícitamente afuera.

**Por qué se cortó ahí.** Buscar por contenido en Postgres es índice de texto completo (`tsvector` +
índice GIN, o `pg_trgm` para búsquedas parciales). Eso se paga en almacenamiento y en cada escritura,
todos los meses, no una vez. Decisión del cliente: si el instituto lo pide, **se cotiza como
infraestructura adicional** — no es deuda técnica que arrastremos nosotros.

**Qué tan lejos está de hacer falta.** Hoy hay **61 mensajes en total** en producción. El asunto como
única clave de búsqueda va a alcanzar durante bastante tiempo: el modelo de un hilo por tema, que se
confirmó en FEAT-06, existe justamente para que el asunto sea suficiente.

**Cuándo mirarlo de nuevo.** Cuando alguien del instituto diga *"sé que me lo escribió pero no
encuentro en cuál"*. Ese reclamo es el que dice que el asunto dejó de alcanzar.

---

<a id="feat-25"></a>
## FEAT-25 · No se sabe quién de la administración contestó un hilo · **P3**

**Lo que pasa.** Del lado de la familia, quien escribe con rol ADMIN firma **"Administración"** y
quien escribe con rol SECRETARY firma **"Secretaría"**
([`messages.ts`](../src/app/actions/messages.ts)). El nombre propio no aparece nunca, y eso está
bien: del lado del instituto contesta el área, no la persona.

**El problema es que tampoco aparece del lado del instituto.** Si mañana hay tres personas con rol
ADMIN, las tres firman igual y en pantalla no hay manera de saber cuál contestó. El dato está
guardado (`Message.senderUserId`), simplemente no se muestra a nadie.

**Hoy no se da, y conviene decirlo.** En producción hay **un** usuario con rol ADMIN y **una** con
rol SECRETARY, y nadie tiene los dos. La ambigüedad es teórica: aparece cuando el instituto sume
gente a administración, o con el segundo instituto.

**Por qué igual se anota.** Por la decisión del 2026-09-13 en [FEAT-06](#feat-06): la administración
queda como **única supervisión** de lo que escriben los alumnos. El día que sean varias personas,
"quién intervino en este hilo" deja de ser un detalle.

**El arreglo es chico.** El armado del nombre ya tiene a la vista los roles de quien mira: alcanza
con mostrar el nombre propio cuando el que mira es staff, y seguir mostrando "Administración" a la
familia.

**De paso, un detalle vecino.** Los mensajes anteriores a que existiera `senderRole` no tienen rol
guardado y el nombre se deduce de los roles actuales, donde **ADMIN le gana a SECRETARY**. En
producción es **un solo mensaje**, del 2026-05-12, y nadie tiene los dos roles — así que hoy no
muestra mal a nadie.

---

<a id="feat-26"></a>
## FEAT-26 · Reponer una cuota eliminada sin pasar por un script · **P2**

**Origen.** El 2026-09-15 el instituto pasó una lista de **nueve cuotas que había eliminado por
error** y pidió recuperarlas. Se resolvió con
[`scripts/restore-deleted-fees.js`](../scripts/restore-deleted-fees.js), corrido a mano contra
producción. Que la única salida sea un script es el problema que anota esta ficha: borrar una cuota
lo puede hacer la secretaría desde la pantalla ([SEC-03](#sec-03)), pero deshacerlo no lo puede hacer
nadie sin nosotros.

**Por qué no alcanza con la generación que ya existe.** `generateMonthlyFeesAction` no sirve para
esto por dos razones independientes, y las dos son graves:

- Es **masiva**. Genera para toda inscripción activa sin cuota del período, así que correrla para
  recuperar el abril de un alumno le recrea la cuota a todos los demás — incluidos los becados a los
  que se les borró bien. Convierte un problema de nueve filas en uno de todo el padrón.
- Toma el **precio de hoy** del curso, no el que tenía la cuota. El abril que había que reponer valía
  $61.000 y su curso hoy está $69.000: repondría una deuda que el alumno nunca contrajo.

**Lo bueno es que el dato ya está.** [`FeeDeletion`](../prisma/schema.prisma) guarda la foto completa
—alumno, tipo, año, mes, importe, curso e instituto—, que es exactamente lo que hace falta para
volver a crear la fila. Restaurar es leer la foto, resolver la inscripción y un `create`. El script
ya hace eso; lo que falta es que lo haga el producto.

**Lo que hay que resolver, que es más que el botón:**

| | |
|---|---|
| **La foto queda** | Hoy `/payments/deletions` seguiría mostrando el borrado aunque la cuota exista de nuevo. La pantalla necesita distinguir una eliminación repuesta de una vigente — un `restoredAt` y un `restoredById`, y que la fila lo diga. **Borrar la foto no es opción:** es el registro de que esto pasó |
| **La cuota sin curso** | Si `courseName` es nulo la cuota no tenía inscripción, y no hay a qué colgarla. Crearla suelta es fabricar justo lo que duplica cuotas solo ([FIN-22](#fin-22)). Que la pantalla lo diga y no ofrezca reponerla |
| **Que ya exista** | Si alguien la volvió a generar por otro camino, reponer duplicaría. La restricción única de `Fee` lo frena, pero el error tiene que leerse como "esta cuota ya está", no como una falla |
| **Quién** | La pantalla ya es **sólo ADMIN**, y así debería quedar. La secretaría borra; deshacer un borrado es control del dueño |

**Lo que el script decidió y conviene sostener.** Dos cosas que ya se pensaron ahí y valen igual para
la pantalla: el importe sale **siempre** de la foto y nunca del precio vigente; y la cuota vuelve
`PENDING` con `paidAmount` en 0, que es lo único que puede ser — sólo se borran cuotas impagas.

**Relacionado.** [FEAT-10](#feat-10) construyó la pantalla y la tabla; esto es la acción que le
faltaba. [ARQ-10](#arq-10) (auditoría general) es el marco donde ese `restoredAt` debería terminar
viviendo si se encara.

---

<a id="feat-27"></a>
## FEAT-27 · 🗣️ La pantalla promete un boletín cuando el alumno no tiene ninguno · **P3**

**De dónde sale.** Pedido del cliente del 2026-09-15. Vino junto con otro —no mostrarle la sección de
tutores al alumno adulto—, que **no tiene ficha todavía**: el cliente lo sigue charlando y tiene
decisiones abiertas que no son de código (con qué edad, y qué pasa con el tutor que ya está cargado).

**Lo que se veía.** Con cero informes publicados, el hub del alumno y el del tutor cerraban con una
tarjeta del ancho de la pantalla: «Informe Trimestral», *«Actualmente no hay informes académicos
publicados para ti»* y, tras una línea divisoria, un candado con **«Próximamente disponible»**.

**Por qué es una promesa y no un vacío.** «Próximamente» afirma que el boletín viene, y el cartel no
tenía manera de dejar de afirmarlo: no dependía de ninguna fecha ni de que el curso tuviera plantilla
vinculada. Al alumno de un curso que no publica boletines, o al que se inscribió en agosto con el
primer período ya cerrado, le decía en diciembre exactamente lo mismo que en abril. Es la regla que
[BUG-18](#bug-18) ya usó para el botón del par —no ofrecer lo que no va a pasar—, acá aplicada a un
cartel en vez de a un enlace.

**Lo que se hizo.** Un `return null` cuando el alumno no tiene ningún informe
([`StudentReportViewer.tsx:123`](../src/components/reports/StudentReportViewer.tsx)): no se dibuja la
sección entera, en las dos pantallas que usan el componente
([`StudentAcademicsView.tsx:444`](../src/app/dashboard/components/StudentAcademicsView.tsx) y
[`GuardianAcademicsView.tsx:287`](../src/app/guardian/academics/components/GuardianAcademicsView.tsx)).
En las dos era la última fila, así que no queda un hueco en el medio.

**Lo que no se tocó, y por qué.** Tres cosas del mismo componente se parecen y no son lo mismo:

- **El selector de períodos con candado** —«2° Período 🔒»— se queda. Esos rótulos salen de la
  plantilla del curso del alumno: el boletín existe y ese período está declarado. Describe algo real.
- **«Calificación no provista para este período»** y **«El docente no ha registrado observaciones»**
  están dentro de un informe publicado y son el estado real de ese informe.
- **La rama «Selecciona un curso válido»** es otro caso: hay informes, pero no en el curso elegido.

**Lo que se pierde, y se acepta.** Esa tarjeta era la única señal del producto de que los boletines
existen. La familia a la que le dijeron «mirá el boletín en la plataforma» y entra antes de la primera
publicación ahora no encuentra rastro y llama al instituto. Se prefirió eso a un cartel que promete
sin fecha. Si el llamado aparece, la salida no es devolver el cartel sino avisar cuando el boletín se
publica: eso vive en [FEAT-08](#feat-08) (columna de novedades) y [FEAT-22](#feat-22) (push).

### Resuelto — 2026-09-15 en `ab1e02f` · verificado en stage el 2026-09-15

Mirado en pantalla sobre el deploy `675a626`, con los tres casos y la predicción escrita antes de
entrar:

- **Alumno sin informes** (Adults Level 2, cero informes): su Hub de Progreso termina en «Práctica
  con IA». No queda ni el cartel ni un hueco, y el resto de la página —rendimiento, docente, las 62
  clases con su historial de asistencia— sigue entero.
- **Su tutora**, sobre el mismo alumno: el Hub Académico termina en «Notas · Sin calificaciones».
- **Control, alumna con 2 informes publicados**: el boletín se ve completo — «Exportar PDF», el
  selector con el 1° y el 2° trimestre disponibles y el 3° con su candado, la grilla de conceptos,
  el comentario del docente y el pie de emisión oficial.

El tercero era el que podía delatar una rotura: confirma que lo que desapareció fue el cartel y no la
sección.

**Cómo se llegó a mirarlo, que costó más que el cambio.** Las cuentas de stage vienen del backup de
producción y no se sabía ninguna contraseña. Dos cosas que conviene tener anotadas para la próxima:

- **`hasDefaultPassword` está en `null` para las 422 cuentas de stage.** La marca no se calcula al
  leer: la escribe una pasada, y el restore trae los datos sin ella
  ([`defaultPasswords.ts`](../src/lib/defaultPasswords.ts), [SEC-06](#sec-06)). O sea que el panel de
  contraseñas no sirve para orientarse en una base clonada. Es la misma forma que
  [BUG-19](#bug-19): lo que no viaja con el backup. **No se miró si en producción está poblada.**
- **`crypt()` de Postgres no valida los hashes de la app.** bcryptjs escribe `$2b$` y pgcrypto sólo
  entiende `$2a$`: comparar por SQL da `false` para todo y parece que nadie conserva su contraseña.
  Verificado con un hash de control. Si hace falta responder «¿esta cuenta tiene la default?» hay que
  hacerlo con bcryptjs, no con SQL.

Para la prueba se les puso contraseña a cuatro cuentas **de stage** —el admin del instituto, los dos
alumnos y la tutora—; producción no se tocó. Se pierden solas en el próximo restore.

---

<a id="feat-28"></a>
## FEAT-28 · 🗣️ El alumno grande sin tutor cargado no lleva sección de tutores · **P3**

**De dónde sale.** Pedido del cliente del 2026-09-15, el que vino junto con
[FEAT-27](#feat-27); la regla se cerró con él el 2026-09-16.

**La regla, en una línea: se oculta sólo cuando no hay nada que mostrar.** Sin datos de contacto
cargados **y** sin ninguna cuenta de tutor vinculada, y con el alumno de 20 o más, la sección no se
dibuja. Con cualquiera de las dos cosas se dibuja igual, aunque el alumno tenga 60
([`tutores.ts`](../src/lib/tutores.ts)).

**Por qué no se oculta por edad sola.** Ocultar un dato cargado lo pierde de vista sin borrarlo; y
ocultar un vínculo activo es peor, porque esa cuenta sigue viendo notas, cuotas y mensajes desde una
pantalla a la que ya no se llega — la secretaría no tendría cómo enterarse ni cómo revocarla. Es el
mismo criterio con el que la ficha ya decide dibujar o no las aplicaciones de saldo
([`students/[id]/page.tsx`](../src/app/students/[id]/page.tsx)).

**Por qué el corte es 20 y no 18 ni 21.** 20 es `SELF_SIGNING_AGE`, la edad desde la que el alumno
firma su propio informe ([`signatures.ts:11`](../src/lib/reports/signatures.ts)). Con 18 habría un
tramo de dos años en el que la ficha esconde al tutor que el panel de firmas todavía está
persiguiendo; con 21 aparecería una segunda constante de edad para mantener sincronizada con la
primera. El cliente dice que los alumnos terminan a los 21 y que si siguen se los carga como adultos:
eso no obliga a mover el corte, porque el que siga teniendo tutor cargado va a ver la sección igual.

**Sin fecha de nacimiento se muestra**, que es la misma decisión prudente que toma la firma. Son 6
alumnos activos en producción.

**Dónde se aplicó.** En las dos pantallas donde la sección se *lee*: la ficha del alumno
([`StudentProfileView.tsx`](../src/app/students/[id]/StudentProfileView.tsx)) y el perfil propio del
alumno ([`ProfileForm.tsx`](../src/app/profile/ProfileForm.tsx)). El booleano lo resuelve el servidor
y baja como prop: la cadena de imports del helper termina en `crypto` y no puede entrar en un
componente de cliente — el mismo cuidado que ya está escrito en
[`defaultPasswords.ts`](../src/lib/defaultPasswords.ts).

**Dónde NO se aplicó, y por qué.** En los formularios de carga —edición y alta del alumno— los campos
siguen estando siempre:

- **Ocultarlos borraría datos.** `editStudentAction` escribe `guardian1Name: guardian1Name || null`
  sobre todo lo que el form no mande ([`actions.ts:105`](../src/app/students/[id]/actions.ts)), así
  que el primer guardado de un alumno grande le vaciaría la ficha del tutor. (La cuenta del tutor se
  salva: `updateGuardianEmail` corta si no viene correo nuevo.)
- **Y dejaría sin forma de cargar un contacto de emergencia** a un adulto que sí lo quiere dar.

La planilla del curso tampoco se tocó: ahí «Tutor Legal» es una columna de un listado, no una sección.

**Qué cuenta como «hay datos»: el nombre del tutor, o una cuenta vinculada.** El teléfono y el correo
**no** alcanzan, y eso se decidió verificando, no escribiendo: la tarjeta los dibuja *dentro* de la
rama del nombre, así que un tutor con teléfono y sin nombre no se ve igual. Contarlos dejaba la
sección dibujada y vacía —lo que el cliente pidió sacar— en 7 alumnos. Está desarrollado en
[BUG-20](#bug-20), y ahí queda anotado que **el día que la tarjeta dibuje ese teléfono, esta regla
tiene que volver a contarlo**.

**Lo que cambia en producción, medido el 2026-09-16.** De 362 alumnos activos, **30 dejan de ver la
sección** —**8** de ellos cursando— y **21 la siguen viendo porque tienen algo cargado**.

**El caso que el cliente imaginaba no existe todavía.** Alumnos de 22 o más con datos de tutor: 11 en
el padrón completo, **0 entre los que cursan**. Los adultos hacen cursos cortos, así que casi todos
quedan en cursos `FINISHED`. Lo que falta para limpiarlos está en [FEAT-29](#feat-29).

### Resuelto — 2026-09-16 · verificado en stage el 2026-09-16

**La primera versión de la regla la corrigió la pantalla**, que es exactamente lo que la verificación
tiene que hacer. Contaba teléfono y correo como datos, y la ficha de un alumno de **70 años** apareció
con la sección dibujada y los dos tutores diciendo «Sin datos registrados»: tenía `guardian1Phone`
cargado y nada más. De ahí salieron el arreglo (`60ac2b6`) y [BUG-20](#bug-20).

Los cinco casos sobre el deploy `60ac2b6`, cada uno con la predicción escrita antes de abrirlo:

| Alumno | Qué tiene | Sección |
|---|---|---|
| 69 años | Nada cargado | **No aparece** |
| 70 años | Sólo `guardian1Phone`, sin nombre | **No aparece** |
| 53 años | Tutora con nombre, sin cuenta | **Aparece**, con «Habilitar Acceso» |
| 12 años | Tutora con nombre y cuenta vinculada | **Aparece**, con el chip de la cuenta |
| Perfil propio, 69 años | Nada cargado | **No aparece**: del domicilio salta a «Información Académica» |

Los dos del medio son los que importaban: prueban que lo que desapareció fue la sección vacía y no la
sección.

---

<a id="feat-29"></a>
## FEAT-29 · Desvincular a un tutor de un alumno · **P3**

**De dónde sale.** De cerrar [FEAT-28](#feat-28) con el cliente el 2026-09-16. Su idea era «eliminar
esos datos y las cuentas» cuando un alumno se hace grande. La mitad ya se puede y la otra mitad no es
lo que parece.

**Los datos ya se limpian solos.** Nombre, celular y correo del tutor se vacían desde Editar Perfil, y
con FEAT-28 eso alcanza para que la sección desaparezca. No hace falta construir nada.

**Lo que falta es sacar el acceso, y no es «borrar la cuenta».** `GuardianStudentLink` es un permiso:
ese usuario entra al portal y ve notas, cuotas y mensajes del alumno. Borrar la **cuenta** para
limpiar a un alumno grande sería desastroso — **29 tutores tienen más de un hijo activo**, así que se
le sacaría el portal al hermano menor. La acción correcta es **desvincular a ese tutor de ese
alumno**, dejando la cuenta en pie.

**Dos cosas que hay que decidir antes de escribir una línea.**

1. **`GuardianStudentLink` no tiene columna de estado**, así que hoy desvincular sería un `DELETE`
   físico, contra la política de [ARQ-05](#arq-05). O se le agrega `status`, o se asume la excepción
   por escrito.
2. **El firmante huérfano.** Los firmantes de un informe se congelan al publicar
   ([`signatures.ts:78`](../src/lib/reports/signatures.ts)). Si a ese tutor le quedaba un informe ya
   publicado sin firmar, al perder el acceso el informe queda sin nadie que pueda firmarlo. Los
   futuros no son problema: al publicar, el alumno de 20+ ya se resuelve como su propio firmante.

**Hoy no hay ni un caso que la necesite.** De los alumnos de 20 o más que cursan, **uno solo** tiene
cuenta de tutor vinculada, y tiene 20 o 21 — está terminando, y ahí el tutor sigue siendo el contacto
correcto. Es una funcionalidad para el día que aparezca el caso, no para limpiar lo que hay.

---

<a id="feat-30"></a>
## FEAT-30 · Que la familia vea todas las clases del curso y en cuáles estuvo · **P3**

**De dónde sale.** Del 2026-09-17, de contestar la pregunta de la madre que originó
[BUG-21](#bug-21). La idea: una pantalla donde la familia vea **todas las clases dictadas del
curso** y, en cada una, si el alumno estuvo, llegó tarde o faltó.

**Lo que hay hoy son tres vistas parciales y ninguna completa.**

| Dónde | Qué muestra | Qué le falta |
|---|---|---|
| Portada del tutor | Anillo de las últimas 10 marcas + últimas 3 clases | Todo [BUG-21](#bug-21) |
| Hub Académico del tutor | «Progreso de Asistencia» (% sobre las últimas 30 marcas) y «Registro de Faltas» | El registro lista **sólo lo que no es `PRESENT`** ([`GuardianAcademicsView.tsx:219`](../src/app/guardian/academics/components/GuardianAcademicsView.tsx)): se ven las faltas, nunca sobre cuántas clases |
| Hub de Progreso del alumno | Cuatro contadores y las últimas 6 clases | [BUG-22](#bug-22); y no lo ve el tutor |

**Lo que falta, en una línea, es el denominador.** «Faltó 3 veces» no significa lo mismo si el curso
lleva 8 clases o 40, y ninguna pantalla de la familia dice sobre cuántas. Ésa es exactamente la
pregunta que hizo la madre.

**El número que decide el tamaño del pedido, medido en producción el 2026-09-17.** De las **438
clases dictadas** en cursos con inscriptos activos (`ACTIVE`, ya pasadas, tipos `CLASS`/`TP`/`EXAM`
— la misma definición que la métrica 1 del panel de uso, [FEAT-11](#feat-11)), **324 no tienen
ninguna marca de asistencia: el 74%**. Y de los 30 cursos involucrados, **13 no tienen una sola
marca en todo el curso**.

**O sea que la pantalla nacería casi vacía.** No es un argumento para no hacerla: es la decisión de
producto que hay que tomar **antes** de escribirla, porque define qué dice la fila de una clase
dictada sin parte. Y sería la primera vez que ese agujero se le muestra a las familias: hoy vive
sólo en el panel de uso —«Clases sin parte de asistencia»—, que lo mira el instituto.

**Las dos salidas. Queda abierta, no la decide esta ficha.**

- **Mostrar el hueco** («Sin registrar»). Es honesto y le pone al instituto una presión real para
  que el parte se tome. También le muestra a la familia que tres de cada cuatro clases no se
  registraron.
- **Listar sólo las clases con parte.** No expone nada, y devuelve el mismo problema que la tarjeta
  de hoy: un porcentaje sobre un denominador que la familia no puede ver.

Es la misma clase de decisión que [FEAT-27](#feat-27): no tapar con un cartel lo que el sistema
todavía no sabe.

**Lo que ya está listo para colgarse.** El dato está entero y no hay que migrar nada: `Lesson` tiene
fecha, tema, tipo y estado, y `Attendance` cuelga de la clase con su estado y su observación. La
consulta es «las clases `ACTIVE` del curso de la inscripción, con la marca de ese alumno si
existe» — el parte del docente dado vuelta.

**Alcance sugerido, para que no se vuelva un proyecto.** La misma pantalla sirve al alumno y al
tutor, como ya pasa con el boletín ([`StudentReportViewer`](../src/components/reports/StudentReportViewer.tsx),
usado por las dos). Y conviene que **reemplace** al «Registro de Faltas» del Hub Académico en vez de
sumarse: la lista completa lo contiene.

**Lo que el pedido pide y los datos no van a poder llenar.** «Tarde» y «Justificado» existen en el
parte ([`AttendanceForm.tsx:162`](../src/app/courses/[id]/lessons/[lessonId]/attendance/AttendanceForm.tsx))
y en producción tienen **0 y 1 marcas**. La pantalla los va a dibujar, pero mientras el parte se
tome sólo con presente y ausente, la distinción «a cuáles llegó tarde» no tiene con qué llenarse.

---

<a id="feat-31"></a>
## FEAT-31 · Ver los gastos cargados, filtrados por mes · **P2 · 🗣️ cliente**

**Pedido el 2026-09-22.** "¿Tiene alguna vista para ver los gastos que va cargando? ¿La puede filtrar
por mes? Este fin de semana estuvo cargando gastos y no ve un detalle de lo que va cargando."

**Lo que hay hoy, y por qué no alcanza.** Los gastos **sí se ven**, pero mezclados con los cobros en
la tabla «Movimientos Recientes» de [`/payments`](../src/app/payments/page.tsx), ordenados por fecha
y de a 20 por página. El selector de arriba dice **«Métricas de»** y es literal: mueve las tarjetas
de KPI y nada más — la tabla se trae el libro mayor entero
([`page.tsx:43`](../src/app/payments/page.tsx)) y lo único que la recorta es el buscador de texto,
que no filtra ni por fecha ni por tipo de movimiento.

**Por qué no los encontró, medido en producción el 2026-09-22.** No es una impresión suya: cargó
**104 gastos el 19, 20 y 21 de septiembre** —prácticamente el año entero; de los 106 que hay en la
base, 104 son de ese fin de semana—. Y **los 104 tienen fecha anterior al día en que los cargó**, del
8 de enero en adelante. La tabla ordena por **la fecha del gasto**, no por cuándo se cargó, así que
en vez de quedar juntos arriba se repartieron por todo el libro: **1673 asientos, 84 páginas de 20**.
En septiembre, que es donde más denso está, hay **216 movimientos y apenas 10 son gastos**. Pasó el
fin de semana cargando y el sistema no tenía dónde devolvérselo.

**Qué pantalla.** Una propia, `/payments/expenses`, del mismo molde que Deudores y Cuotas Eliminadas:
filtro de período y de categoría, el detalle, y **el total del período** — que es la parte que hoy no
existe en ningún lado en forma de lista.

**De dónde sale el número: de `Transaction`, no de `Expense`.** Es la misma fuente que la tarjeta
«Gastos Operativos» del mes, y montarla ahí obliga a que los dos números den igual. La diferencia no
es teórica: los **dos gastos de prueba del 27 de marzo** (categoría `NOMINA`, $299 y $200) **no
tienen asiento** —se crearon antes del libro—, así que no están ni en la tabla ni en la tarjeta. Una
pantalla armada sobre `Expense` los mostraría y quedaría **$499 por encima** de la tarjeta, sin que
nadie pueda explicar de dónde sale la diferencia.

**Los sueldos entran, y no es un detalle.** En producción son **39 asientos por $19.128.500**, contra
**$21.676.656,52 de los otros 65 gastos**: casi la mitad de lo que sale. Una pantalla de gastos que
los dejara afuera daría un "total del mes" que no es el gasto del mes, y otra vez no cerraría con la
tarjeta. Van adentro, y la categoría «Sueldos» los separa para el que quiera verlos aparte.

**Las categorías se leen de la base, no del formulario.** `Expense.category` es texto libre. El
formulario ofrece seis ([`RegisterExpenseForm.tsx:47`](../src/app/payments/components/RegisterExpenseForm.tsx)),
los sueldos entran con `Payroll` desde otras dos pantallas, y en la base ya hay además `NOMINA`.
Clavar la lista de seis en el filtro dejaría categorías cargadas sin forma de elegirlas.

**Arranca en el mes en curso**, al revés que Cuotas Eliminadas, que arranca sin filtro. Es la
diferencia entre las dos preguntas: borrar una cuota es raro y hay que poder ver todo, mientras que
acá la pregunta es «qué gasté este mes» y hay gastos todos los meses. Un mes vacío se dice con todas
las letras —"no hay gastos cargados en *mes*"— para que no se lea como una pantalla rota.

**Los anulados se listan tachados y no suman al total.** Hoy en producción **no hay ninguno**, así
que es un camino que nace sin datos; se sostiene igual porque el día que se anule un gasto, la
alternativa —que desaparezca— deja al dueño buscando algo que cargó y ya no está.

**Lo que esta ficha no resuelve.** La tabla del libro mayor sigue sin filtro de mes ni de tipo: la
pantalla nueva contesta por los gastos, no por los cobros. Y **los dos gastos huérfanos de marzo
siguen invisibles** en todo el módulo — son $499 de prueba, no se tocan acá, pero quedan anotados.

---

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

### Resuelto — 2026-09-13 en `b0303d8` · pendiente de verificar en stage

Cayó solo: [FEAT-06](#feat-06) reescribió el componente para que escuche el canal en vivo, y las
props sobrantes no sobrevivieron a la reescritura. Quedan `userId` —que ahora sí se usa, es el
nombre del canal— más las tres de presentación (`variant`, `isActive`, `label`). `Navbar` las
seguía calculando sólo para pasárselas, así que también se fueron de ahí.

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

<a id="arq-12"></a>
## ARQ-12 · Versionar el proyecto y mostrar la versión en la app · **P2**

**Pedido (2026-08-15).** Poder versionar el proyecto, y decidir dónde se muestra el número de versión
dentro de la aplicación.

**Estado actual.** `package.json` dice `"version": "1.0.2"` y **nada lo lee**: no aparece en ninguna
pantalla, no se registra en ningún lado y no se toca al desplegar. Es un número que quedó ahí. No hay
tags de git ni notas de release.

**Por qué esto no es cosmético, y cuál es su mejor argumento.** El 13/08, con producción caída, la
pregunta que había que contestar era *"¿qué código está sirviendo ahora mismo?"* — y la única forma de
contestarla era mirar commits en Vercel. Una versión visible en la app convierte esa pregunta en algo
que puede contestar **el cliente por teléfono**, sin acceso al dashboard. Con dos proyectos de Vercel
sobre el mismo repositorio y dos bases, saber qué está desplegado dónde no es un lujo.

**Tres decisiones, en orden:**

1. **Qué numera.** Semver a mano en `package.json` es lo más simple y lo que ya está empezado, pero
   se olvida. La alternativa es derivar la versión del despliegue: Vercel expone
   `VERCEL_GIT_COMMIT_SHA`, que no se olvida nunca pero no le dice nada a una persona. La combinación
   —versión semver para humanos, sha corto al lado para diagnóstico— es la que sirve para las dos
   cosas.
2. **Cuándo sube.** Si se numera a mano, hace falta el hábito o un paso en el flujo de promoción a
   `main`. Conviene atarlo a lo que ya existe: la promoción `stage` → `main` es el momento natural, y
   es el único release real que tiene el proyecto.
3. **Dónde se muestra.** Candidatos: el pie del panel, la pantalla de configuración del instituto, o
   sólo el panel del superadmin. Mostrarlo a todo el mundo tiene un costo bajo y una ventaja concreta
   —el cliente puede leerlo cuando reporta algo—, así que probablemente el pie del panel alcance, con
   el sha visible sólo para el superadmin.

**Nota técnica.** Leer `package.json` desde el código del cliente no funciona en Next; hay que
inyectarlo como variable de entorno en tiempo de build (`env` en `next.config`) o generar un módulo
con el valor. Es la parte fácil, pero conviene decidirlo antes para no leerlo de dos formas distintas.

**Relacionado.** [ARQ-13](#arq-13) es la continuación natural: una vez que existe el número, saber
quién lo está usando. Y esto es también lo que le falta a `tareas/config-pendiente.md` para poder
afirmar qué quedó desplegado después de cada incidente.

---

<a id="arq-13"></a>
## ARQ-13 · Saber qué versión está usando cada usuario · **P3**

**Pedido (2026-08-15).** Métricas de qué versión de la aplicación tienen los usuarios.

**Depende de [ARQ-12](#arq-12)**: sin número de versión no hay nada que medir.

**Ojo con la analogía móvil, porque acá la pregunta es otra.** En una app de celular tiene sentido
preguntar qué versión tiene instalada cada usuario, porque las instalaciones quedan atrás durante
meses. Esto es una aplicación web: en el próximo refresco, todos están en la última. La distribución
de versiones sería casi siempre una sola barra, y no vale un desarrollo.

**Corrección (2026-08-20): esto ya es una PWA, y el párrafo de arriba lo daba por sentado sin
mirarlo.** El proyecto tiene `@ducanh2912/next-pwa` y un service worker en `public/sw.js`, más
`@khmyznikov/pwa-install` para el prompt de instalación. Cambia el diagnóstico en dos sentidos:

- **El argumento "en el próximo refresco están todos en la última" se debilita.** Un service worker
  sirve de su caché y una app instalada no se refresca como una pestaña: un cliente puede quedar
  atrás bastante más que unas horas. La distribución de versiones sí puede tener más de una barra.
- **Y por eso la forma barata vale más, no menos.** El cliente rancio deja de ser el que no cerró la
  pestaña en tres días y pasa a ser cualquiera con la app instalada. Mandar la versión en una cabecera
  y avisar que recargue es lo primero a hacer.

**Sobre "cuántos tienen la app instalada" (pedido del 2026-08-20).** Hay un límite duro que conviene
saber antes de prometer el número: **el servidor no puede saber quién la tiene instalada**. No existe
registro de instalaciones; de un dispositivo te enterás sólo cuando se conecta, y las
desinstalaciones son invisibles siempre. Lo que sí se puede:

- Detectar en el cliente si corre instalada (`display-mode: standalone`) y mandarlo junto con el
  evento de ingreso. Eso da **ingresos desde la app instalada contra ingresos desde el navegador**,
  que es un dato honesto y probablemente más útil que un conteo de instalaciones.
- Contar instalaciones nuevas con el evento `appinstalled`.

Entonces la métrica real es *"cuántos entraron desde la app instalada en los últimos N días"*, no
*"cuántos la tienen instalada"*. Conviene que la pantalla la llame por lo que mide: si dice
"instalaciones: 47" y son 47 activos, alguien va a decidir algo con un número que significa otra cosa.

**Lo que sí tiene valor es la variante corta de esa pregunta: los clientes rancios.** Alguien con una
pestaña abierta desde antes del despliegue sigue ejecutando JavaScript viejo contra un servidor nuevo,
y eso **sí** produce errores reales — es primo del problema del 13/08, donde el desajuste fue entre
base y código. También es lo que explica el reporte "a mí no me anda" de la persona que no cerró el
navegador en tres días.

**Forma barata.** Que el cliente mande su versión en las peticiones (una cabecera) y que el servidor
compare con la suya; si no coinciden, avisarle al usuario que recargue. Eso resuelve el problema real
sin construir métricas, y es lo que conviene hacer primero.

**Forma cara.** Registrar la versión de cada sesión para poder graficar la distribución. Sólo tiene
sentido si antes existe [FEAT-11](#feat-11) o [ARQ-09](#arq-09), porque comparte las mismas
decisiones —dónde se guarda, cuánto tiempo, quién lo ve— y no vale la pena construir un registro
propio para un solo dato.

**Recomendación.** Hacer la forma barata como parte de ARQ-12, y dejar la métrica para cuando exista
un lugar donde ya se guarden métricas.

**Decisión (2026-08-22): esto no entra en el panel de uso.** Mostrarle al administrador qué versión
tiene cada usuario **no es un pedido del cliente** — salió de una idea nuestra. Sale del alcance de
[FEAT-11](#feat-11), y con eso [ARQ-12](#arq-12) deja de ser prerrequisito de ese panel. Lo que sí
conserva valor es la **forma barata** de arriba —la cabecera de versión y el aviso de recargar—, que
no depende de ninguna métrica y resuelve el problema del cliente rancio.

---

<a id="arq-14"></a>
## ARQ-14 · La purga de un alumno no puede borrar a ningún alumno real · **P3**

**Cómo apareció (2026-08-16).** Mirando las claves foráneas de verdad en la base de producción
mientras se analizaba [FIN-23](#fin-23). No lo reportó nadie, y es probable que nunca se haya
intentado usar.

[`hardDeleteStudentAction`](../src/app/students/[id]/actions.ts) es el borrado **físico** de un alumno, con
su propio permiso ("Sin permisos para eliminar permanentemente"). Borra en una transacción:

```ts
attendance → grade → enrollment → fee → student
```

**Falla con casi cualquier alumno real**, porque hay tres claves foráneas `RESTRICT` que esa lista no
contempla — verificadas sobre la base de producción, no leídas del schema:

| Tabla | Apunta a | Al borrar el padre | Consecuencia |
|---|---|---|---|
| `Payment` | `Fee` | **RESTRICT** | La transacción borra las cuotas pero **no los pagos**: un alumno que alguna vez pagó algo no se puede purgar |
| `GuardianStudentLink` | `Student` | **RESTRICT** | Un alumno con tutor vinculado tampoco |
| `PracticeSession` | `Student` | **RESTRICT** | Ni uno que haya practicado |

Sólo pasa un alumno sin ningún historial. Como la transacción se revierte entera, el operador ve
"Error al purgar los datos del estudiante" y nada más: ni qué lo impidió ni que en realidad no se
borró nada.

**Y hay una dependencia oculta con [FIN-23](#fin-23), que es por donde salió esto.** El paso que borra
las inscripciones funciona hoy **sólo porque** `Fee_enrollmentId_fkey` es `ON DELETE SET NULL`: en ese
momento las cuotas todavía existen y todavía apuntan a esas inscripciones, y Postgres las desvincula
sola antes de borrar. Es decir, **la purga se apoya en el mismo desprendimiento silencioso que FIN-23
quiere eliminar**. Si esa clave foránea pasa a `RESTRICT`, este paso empieza a fallar también, y el
arreglo es mover una línea: borrar las cuotas **antes** que las inscripciones.

**Qué decidir, y es antes de programar nada.** Desde que los borrados pasaron de físicos a lógicos
—para que lo que se borra sin querer se pueda recuperar—, esta función es la excepción, y hay que
decidir si sigue existiendo:

- **Sacarla.** Si la política es borrado lógico, un botón que borra de verdad y para siempre es
  justamente lo que se quiso evitar. El alumno ya se marca `DELETED` desde la ficha.
- **Arreglarla.** Si se quiere conservar para el caso real de tener que eliminar los datos de una
  persona —un pedido de baja de datos personales, por ejemplo—, hay que agregar los pagos y los
  vínculos que faltan, y decidir qué pasa con la plata: borrar los pagos de un alumno **cambia la
  caja histórica del instituto**, y eso no puede ser un efecto colateral silencioso de borrar una
  ficha.

---

<a id="arq-15"></a>
## ARQ-15 · La identidad está partida en dos tablas · **P2**

**Planteo (2026-08-20), y es la tercera vez.** El cliente ya había preguntado dos veces si tener
`User` y `Student` como tablas separadas era lo correcto, y las dos veces se le respondió que sí.
Vuelve a plantearlo ahora que los choques entre las dos aparecen seguido, y con un argumento de
oportunidad que es correcto: **con un solo cliente, el momento más barato para cambiarlo es ahora**.

**Pero la pregunta que se contestó "sí" probablemente no era esta.** Hay dos preguntas distintas
adentro:

1. *¿`Student` es una entidad propia?* **Sí, y sigue siendo sí.** Tiene inscripciones, cuotas, notas,
   asistencias, saldo a favor. Colapsarla contra los profesores y los administradores sería el error
   contrario.
2. *¿Hay dos tablas de identidad?* **Sí, y ahí está el roce.** Un alumno y un tutor se autentican por
   caminos distintos, y toda funcionalidad que cruce a los dos tiene que construirse dos veces.

Las dos veces que se respondió "sí" se estaba respondiendo la primera. La que duele es la segunda.

**Dónde duele, medido.** Hoy hay **tres modelos** con el par polimórfico `userId?` / `studentId?` —
[`Notification`](../prisma/schema.prisma), `ThreadParticipant` y `Message`, que hasta lo dice en un
comentario: *"Polimórfico: o un User (teacher, admin, guardian) o un Student"*. Con la firma de
[FEAT-09](#feat-09) y el evento de ingreso de [FEAT-11](#feat-11) serían **cinco**. El costo no crece
con el tamaño del negocio: crece con cada funcionalidad transversal que se agregue.

**El número grande engaña, y conviene mirarlo antes de asustarse.** Hay 271 usos de `studentId` en 50
archivos, pero la enorme mayoría son **de dominio** —una cuota es de un alumno, una nota es de un
alumno— y no cambiarían con ninguna de las opciones sanas.

**Tres opciones, no dos:**

| | Qué es | Qué cuesta |
|---|---|---|
| Dejarlo como está | Cada funcionalidad transversal se construye con el par | Se paga de a poco y para siempre, y ya son 5 lugares |
| Una sola tabla de usuarios con un tipo | Lo que plantea el cliente. Colapsa también la entidad de dominio | Toca los 271 usos, y `User` termina con las columnas de alumno —saldo a favor, tutores, nivel, fecha de ingreso— en nulo para cada profesor y cada admin |
| **Separar identidad de entidad de dominio** ← recomendada | Una tabla de cuentas con **sólo** credenciales, estado e instituto. `Student` sigue existiendo entero y **apunta** a una cuenta, opcionalmente | Toca los 3 modelos polimórficos y la autenticación. Los 271 usos de dominio quedan intactos |

La tercera es la que resuelve el problema real sin crear el opuesto: el par polimórfico desaparece
porque todo lo transversal apunta a una sola tabla, `Student` conserva lo suyo, y el alumno de 6 años
sin correo simplemente **no tiene cuenta** — que es lo que pasa hoy en la realidad y el schema ya
admite con `email` y `password` opcionales.

**Sobre el momento: el principio es correcto, el "ahora" tiene un pero concreto.** Este documento ya
sostiene que las migraciones son baratas con un cliente y sólo se encarecen. Pero esta no es
[FIN-05](#fin-05) (`Float` → `Decimal`): toca **autenticación**, que es justo donde acaba de aterrizar
todo [SEC-01](#sec-01)/[SEC-02](#sec-02)/[SEC-03](#sec-03). Y sobre todo, **no hay backups**, y el
`build` corre `migrate deploy` — la combinación que ya tumbó producción una vez. Hacer la migración
más grande del proyecto sin backups es el bloqueante real, y resolver los backups es muchísimo más
barato que la migración.

**Secuencia recomendada:**

1. **Backups primero.** No es una precaución genérica: es la condición para poder hacer esto.
2. **Como trabajo propio y dedicado**, no mezclada con funcionalidades. Es la única forma de que si
   sale mal se sepa qué la rompió.
3. **No mientras haya otra cosa en curso.** Con el panel de uso y la firma en vuelo, no.

**Qué hacer mientras tanto con lo que está en vuelo.** La firma y el evento de ingreso se construyen
igual, con el par. Los dos son chicos y de sólo agregar filas, así que migrarlos después es cambiar
una columna. No conviene frenar funcionalidades esperando esta decisión — pero sí conviene tenerla
tomada antes de que el par aparezca en algo caro de mover.

**Recomendación.** Sacarla, y si algún día hace falta la baja de datos personales, resolverla como lo
que es —anonimizar la ficha conservando los asientos contables—, que no es lo mismo que borrar filas.

### Decidido — 2026-08-16 · se saca

**Ningún alumno se borra de forma permanente. Todos los estados son lógicos.** La razón es la misma
que llevó a pasar los borrados físicos a lógicos: lo que se borra sin querer —o queriendo— tiene que
poder recuperarse, y esta función es la única que no lo permite.

Y el caso de negocio que parecía justificarla tampoco la necesita: el alumno que se va del instituto
**va a la papelera con su deuda intacta**, y si vuelve, se restaura y la deuda reaparece para que el
instituto decida (ver [FIN-09](#fin-09)). Borrarlo de verdad no resuelve nada de eso: lo rompe.

Queda entonces sacar `hardDeleteStudentAction` y su acceso en la interfaz, en vez de arreglar los
tres `RESTRICT` que hoy la hacen fallar. **La baja de datos personales, si alguna vez hace falta, es
otra cosa** —anonimizar la ficha conservando los asientos— y merece su propia ficha el día que se
pida.

**Ojo al sacarla:** es el único lugar del código que borra filas de `Fee` en masa. Conviene verificar
que ninguna pantalla dependa de ella antes de quitarla.

**Relacionado.** [FIN-23](#fin-23) (de donde salió, y de cuyo `SET NULL` depende hoy),
[ARQ-05](#arq-05) (la interfaz para restaurar lo borrado, que es el otro lado de la política de
borrado lógico).

---

<a id="arq-16"></a>
## ARQ-16 · Qué cuesta cada filtro del calendario · **P3 · sube con el número**

**Visto el 2026-09-02**, junto con [BUG-14](#bug-14): al encender *"Ver a mis pares"* el calendario
tarda lo suficiente como para que se note.

**Antes de optimizar hay que medir**, porque hay dos explicaciones y llevan a arreglos opuestos.

**Explicación 1: el interruptor ensancha las consultas.** `visibleCoursesFilter`
([`peers.ts:41`](../src/lib/peers.ts)) lleva el alcance de *"mis cursos"* a *"mis cursos + todos los
del mismo nivel"*, y ese alcance entra en las dos consultas grandes de la página: la de horarios y la
del desplegable de cursos. Con los pares encendidos entran más filas de `Schedule`, y **cada fila
arrastra su curso, su docente y las clases de la semana dos veces** — `schedule.lessons` y
`course.lessons` se superponen, porque la clase atada a un horario cae en las dos
([`schedule/page.tsx:182`](../src/app/schedule/page.tsx)). La segunda no está de más: es el respaldo
para la clase sin horario ([`:349`](../src/app/schedule/page.tsx)). Pero se paga completa.

**Explicación 2: es lo que cuesta cualquier clic de esa barra.** La página es dinámica y se rehace
entera en el servidor en cada navegación: sesión, rol, `requireRole` —que consulta la base por diseño
([SEC-02](#sec-02))—, `getPeerLevels`, las tres consultas de los desplegables y la de horarios. Nada
de eso está cacheado, y encima se paga la latencia contra Supabase sin pooling ([ARQ-02](#arq-02)).
Si es esto, prender y apagar los pares tarda lo mismo que cambiar de aula, y lo que se notó no es el
filtro sino **el silencio** de [BUG-14](#bug-14).

**La sospecha es la 2**, y hay un dato que la respalda: el instituto tiene **31 cursos activos**
—contados contra producción el 17/08 en [FIN-28](#fin-28)—, así que "todos los del mismo nivel" son
unos pocos cursos más, no un salto de escala. Con ese volumen ninguna de estas consultas debería
tardar de forma perceptible.

**Cómo medirlo, y alcanza con poco.** El tiempo está del lado del servidor, así que sale de la
duración de la función en Vercel o de un `console.time` alrededor de la consulta de horarios. Hay que
comparar dos cosas: la misma semana con `?pares=0` y con los pares encendidos, y **un filtro
cualquiera contra otro**. Si cambiar de aula tarda lo mismo, esta ficha se cierra contra
[ARQ-02](#arq-02) y [BUG-14](#bug-14), y no hay nada que optimizar acá.

**Si el número justifica tocar algo**, en orden de barato a caro: no traer `course.lessons` cuando
`schedule.lessons` alcanza; sacar del `include` los campos del curso y del docente que la grilla no
dibuja —hoy entran enteros—; y recién después mirar índices, que es [ARQ-01](#arq-01).

**Relacionado.** [BUG-14](#bug-14) (la otra mitad del mismo reporte, y va primero),
[ARQ-02](#arq-02) (pooling), [ARQ-11](#arq-11) (la otra pantalla que se midió por lo que costaba),
[FEAT-07](#feat-07).

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

### Resuelto — 2026-08-11 · **verificado en producción el 2026-08-14**

**Verificado por uso real, no por prueba.** El instituto trabajó con el botón y lo mencionó como algo
que les gustó. Nunca pasó por stage: llegó a producción con la promoción de emergencia del 13/08 y se
confirmó usándolo. Vale como cierre — es la evidencia más fuerte que hay, aunque haya llegado por el
camino equivocado.

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

<a id="ped-10"></a>
## PED-10 · Consumo de IA por instituto, visible para el superadmin · **P2**

**Pedido (2026-08-15).** Que el superadmin pueda ver cuántos tokens se gastan por instituto.

**Buena parte del andamiaje ya está**, y salió de [SEC-07](#sec-07): la tabla
[`AiUsage`](../prisma/schema.prisma) ya cuenta consumo por instituto y por usuario, en ventanas de
tiempo, y ya la escribe cada llamada a IA a través de
[`consumeAiQuota`](../src/lib/practice/quota.ts). Nadie la lee: `AiUsage` aparece en **un solo
archivo** de todo `src`, que es el que la escribe.

**Pero hay tres huecos entre lo que existe y lo que el pedido dice, y los tres importan:**

1. **Cuenta llamadas, no tokens.** `AiUsage.count` se incrementa de a uno por request, sin mirar el
   tamaño. Para el tope de cuota eso alcanza y es deliberado. Para "cuánto gasta este instituto" no:
   una evaluación de una frase y la generación de una práctica entera cuentan igual, y la factura no
   las cobra igual. Medir tokens de verdad requiere leer el uso que devuelve cada proveedor —Gemini
   lo trae en `usageMetadata`— y guardarlo aparte del contador de cuota.
2. **No hay historia.** `pruneOldWindows` borra las ventanas de más de **2 días**
   ([`quota.ts`](../src/lib/practice/quota.ts)), a propósito: es un contador de cuota, no un registro.
   Cualquier reporte mensual necesita una tabla o una agregación que sobreviva a la poda.
3. **Las filas de usuario no se pueden agregar por instituto.** `AiUsage` guarda `subjectId` sin
   `instituteId` y sin clave foránea, así que sólo agregan las filas `INSTITUTE`. Alcanza para el
   total del instituto; no para ver **quién** dentro del instituto consume.

**Camino sugerido, de menor a mayor.** Una pantalla en el panel del superadmin que muestre las filas
`INSTITUTE` de los últimos días es de horas y ya contesta "quién está usando esto". Recién si hace
falta el costo real conviene agregar el registro de tokens, que es donde está el trabajo.

**Decidir antes: qué pregunta se contesta.** No es lo mismo *controlar el gasto* (necesita tokens y
costo por proveedor), que *ver quién usa el módulo pedagógico* (alcanza con llamadas), que *cobrar por
consumo* (necesita las dos cosas y además ser exacto). La tercera es [PED-07](#ped-07).

**Relacionado.** [PED-07](#ped-07) (límites por plan) se apoya en la misma tabla y su ficha ya anota
que lo que falta ahí es la decisión comercial, no el mecanismo. Si el consumo se va a facturar, los
dos son el mismo trabajo y conviene mirarlos juntos. [FEAT-11](#feat-11) es la versión de esta
pregunta para el administrador del instituto en vez del superadmin.

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
