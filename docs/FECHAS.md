# Fechas en Lingua Campus

Todo lo de fechas vive en [`src/lib/dates.ts`](../src/lib/dates.ts). Esta nota explica por qué y
cómo usarlo. Se normalizó el 18/10/2026, con un solo cliente en producción, para no arrastrar el
problema a los siguientes.

## El problema

Vercel y Postgres corren en **UTC**; los institutos, en **Argentina (UTC−3)**. A partir de las 21
de Argentina, el servidor ya está en el día siguiente. Y es la hora en que más se carga: en
producción, una de cada cuatro asistencias (362 de 1444) se cargó después de las 21, alguna pasada
la medianoche.

Antes de normalizar, de noche el calendario abría en mañana, la clase de hoy desaparecía de
«próximas clases», los cumpleaños de mañana decían «Hoy», el último día del mes las cuotas del
siguiente contaban como vencidas, y un cobro de las 21:30 figuraba en la caja al día siguiente.
Aparte, las fechas sin hora se mostraban un día antes en el navegador, y los meses salían en inglés
o en castellano según qué pantallas se hubieran cargado.

## Dos clases de fecha

| Clase | Qué es | Cómo se guarda | Columnas |
|---|---|---|---|
| **Día** | Un día del calendario, sin hora | `@db.Date`, a medianoche UTC | `Lesson.date`, `Transaction.date` (día contable), `Expense.date`, `MiscellaneousIncome.date`, `Student.birthDate`, `Course.startDate`, `Course.endDate`, `Course.examDate`, `Institute.activityStartDate`, `ActivityDay.day` |
| **Momento** | Un instante | `DateTime` con hora | `Payment.date`, `createdAt`, `updatedAt`, `signedAt`, `publishedAt`, `joinDate`, `enrolledAt`, `datePaid`, etc. |

Un **día** se lee en UTC: guardado a medianoche UTC, leído en hora argentina cae a las 21 del día
anterior. Un **momento** se muestra en hora argentina.

## Cómo se usa

**Hoy, el mes y los períodos.** Nunca del reloj de quien corre el código.

```ts
instituteToday()        // hoy del instituto, como día: se compara con un @db.Date
instituteTodayKey()     // "2026-10-18": value de un <input type="date">, parámetro SQL
instituteMonth()        // { year, month } del mes en curso, month de 1 a 12 como Fee.month
addMonths(m, -1)        // el mes anterior
monthDays(m)            // { first, last, next } del mes, como días: { gte: first, lte: last }
yearDays(year)          // lo mismo para un año
instituteDayStart()     // el instante en que empezó hoy (03:00 UTC): para ventanas de tiempo
ageOn(birthDate)        // edad cumplida hoy en el instituto
```

**Escribir un día.** `instituteToday()` si es hoy, `dayFromKey("2026-10-18")` si viene de un
formulario. Las columnas de día no tienen `DEFAULT`: el `now()` de Postgres es el día de UTC.

**Mostrar.** `formatDate(valor, "day" | "moment", estilo)`, con los estilos `short` (20 oct 2026),
`long` (20 de octubre de 2026), `dayMonth`, `dayMonthLong`, `monthYear`, `weekdayDay`,
`weekdayDayMonth` (martes 20 de octubre), `weekdayDayMonthShort` (mar 20 oct), `month`,
`dayNumber`, `numericDayMonth`, `numeric` (20/10/26) y `numericFull` (20/10/2026). Los nombres
salen de listas propias: ni `dayjs.locale("es")`, que es global, ni `Intl` en castellano, que según
la versión da «oct» u «oct.».

## Lo que no se hace

Lo atrapa `npm run lint:fechas`, que corre **al principio del build**: si aparece, el deploy no sale
y, como va antes de `prisma migrate deploy`, tampoco toca la base.

- `new Date().getMonth()`, `.getFullYear()`, `.getDate()`, `.getDay()`, `.setHours(0…)`
- `new Date().toISOString().slice(0, 10)` (el día de hoy en UTC). Sin cortar, es un instante y está bien.
- `dayjs()` sin fecha, `startOf`/`endOf` de día, semana, mes o año
- `dayjs.locale(...)` y `format` con `MMM` o `ddd`
- `toLocaleDateString` y `toLocaleTimeString`, y `toLocaleString` sobre una fecha: salen en la zona y el
  idioma de quien corre el código. La hora de un momento es `formatTime`. Sobre un número,
  `toLocaleString("es-AR")` está bien
- `dayjs(x).format(...)`, por lo mismo: un momento de las 21 a las 24 dice el día siguiente si lo dibuja el
  servidor. `dayjs(x).fromNow()` está bien
- `Intl.DateTimeFormat` fuera de `dates.ts`
- `CURRENT_DATE` en SQL: se pasa `instituteTodayKey()` como parámetro

Las reglas están en [`eslint.fechas.config.mjs`](../eslint.fechas.config.mjs) y también corren con
`npm run lint`.

**Lo que el control no ve.** `fecha.toLocaleString("es-AR")` sobre una variable y sin opciones (puede ser un
número), `const d = dayjs(x); d.format(...)` en dos pasos, `format` de `date-fns` ([ARQ-18](BACKLOG-TECNICO.md#arq-18))
y `new Date("2026-06-22")`, que es medianoche UTC ([BUG-27](BACKLOG-TECNICO.md#bug-27)).

## Decisiones

Para que el día de mañana se sepa por qué está así. La más nueva arriba.

**24/11/2026 · Una sola puerta para mostrar, no una sola librería.** Mostrar una fecha o saber qué día es sale de
`dates.ts`. `date-fns` y `dayjs` quedan para **cuentas**: «hace 2 horas», minutos entre dos horarios, la semana
siguiente. Se descartó sacarlas del proyecto: eso no depende de la zona horaria, no falla, y en parte toca la
liquidación. La única excepción es la fecha del recibo: la arma el navegador, sale bien y el recibo no se toca por
esto. Falta pasar ocho archivos: [ARQ-18](BACKLOG-TECNICO.md#arq-18).

**24/11/2026 · El control frena también `toLocale…String`, `dayjs(x).format()` e `Intl.DateTimeFormat`.** El módulo
existía desde octubre y aun así quedaban 21 lugares sueltos, porque el control no miraba esos formatos. No era un
problema de que la gente no supiera: **lo que el build no frena, vuelve**. Por eso la regla no tiene excepciones, y
se pasaron también los pocos que andaban bien. Ver [BUG-30](BACKLOG-TECNICO.md#bug-30).

**24/11/2026 · La hora, en 24 horas.** «lun 23 nov, 23:12» y no «11:12 p. m.», como en el resto del campus.

**24/11/2026 · `suppressHydrationWarning` no arregla una fecha, la deja mal.** Le dice a React que no avise y
**que no corrija**: en la bandeja de mensajes un 29/10 a las 21:09 decía «30/10» para siempre, en 11 de 66 hilos
de producción. Sirve sólo para lo que cambia con el reloj, como «hace 1m».

**24/11/2026 · El avance de un curso se mide con sus fechas** (`periodProgress`), no con las clases cargadas: muchas
docentes cargan la clase recién al darla, y en 19 de 30 cursos daba 100%. Ver [BUG-29](BACKLOG-TECNICO.md#bug-29).

**18/10/2026 · Dos clases de fecha, día y momento, cada una con su lectura.** Guardar los días como `@db.Date` y
leerlos en UTC; mostrar los momentos en hora argentina. Se hizo con un solo cliente para no arrastrarlo.

**18/10/2026 · Los nombres de meses y días salen de listas propias.** Ni el idioma del navegador ni `Intl`: daban
textos distintos en el servidor y en el navegador.

**18/10/2026 · El control va primero en el build**, antes de `prisma migrate deploy`: si frena, no toca la base.

## Probar de noche

`.claude/launch.json` tiene `dev-utc`: el servidor local con el reloj en UTC, como Vercel. Después
de las 21 de Argentina, el servidor ya está en el día siguiente y se puede ver si algo se corre.

## La zona horaria

`INSTITUTE_TIME_ZONE` está fija en `America/Argentina/Buenos_Aires` porque hoy hay un solo
instituto. Si llega uno en otro huso, pasa a ser un campo de `Institute`, y como nada fuera de
`dates.ts` la nombra, se cambia en un solo lugar.
