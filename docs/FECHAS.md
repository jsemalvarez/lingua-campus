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
`long` (20 de octubre de 2026), `dayMonth`, `dayMonthLong`, `monthYear`, `weekdayDay`, `month`,
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
- `CURRENT_DATE` en SQL: se pasa `instituteTodayKey()` como parámetro

Las reglas están en [`eslint.fechas.config.mjs`](../eslint.fechas.config.mjs) y también corren con
`npm run lint`.

## Probar de noche

`.claude/launch.json` tiene `dev-utc`: el servidor local con el reloj en UTC, como Vercel. Después
de las 21 de Argentina, el servidor ya está en el día siguiente y se puede ver si algo se corre.

## La zona horaria

`INSTITUTE_TIME_ZONE` está fija en `America/Argentina/Buenos_Aires` porque hoy hay un solo
instituto. Si llega uno en otro huso, pasa a ser un campo de `Institute`, y como nada fuera de
`dates.ts` la nombra, se cambia en un solo lugar.
