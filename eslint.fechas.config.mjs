import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";

/**
 * Fechas: «hoy», «este mes», los límites de un período y los nombres de meses y
 * días salen de `src/lib/dates.ts`, nunca del reloj o del idioma de quien corre el
 * código. Vercel y Postgres están en UTC: a partir de las 21 de Argentina el
 * servidor ya está en mañana, y una de cada cuatro asistencias de producción se
 * carga después de esa hora. Ver `docs/FECHAS.md`.
 */
const DATES_MESSAGE = "Las fechas salen de src/lib/dates.ts (ver docs/FECHAS.md).";

export const dateRules = [
    {
        selector: "CallExpression[callee.object.type='NewExpression'][callee.object.callee.name='Date'][callee.object.arguments.length=0][callee.property.name=/^(getFullYear|getMonth|getDate|getDay|setHours)$/]",
        message: `Hoy o este mes del reloj del servidor o del navegador: usá instituteToday(), instituteTodayKey() o instituteMonth(). ${DATES_MESSAGE}`,
    },
    {
        // `new Date().toISOString()` solo es un instante y está bien; cortado, es el día de UTC.
        selector: "CallExpression[callee.property.name=/^(slice|split|substring)$/][callee.object.callee.property.name='toISOString'][callee.object.callee.object.type='NewExpression'][callee.object.callee.object.arguments.length=0]",
        message: `El día de hoy en UTC (a partir de las 21 ya es mañana): usá instituteTodayKey(). ${DATES_MESSAGE}`,
    },
    {
        selector: "CallExpression[callee.property.name='setHours'][arguments.0.value=0]",
        message: `Medianoche en la zona de quien corre el código: usá instituteToday() o dayFromKey(). ${DATES_MESSAGE}`,
    },
    {
        selector: "CallExpression[callee.object.type='CallExpression'][callee.object.callee.name='dayjs'][callee.object.arguments.length=0]",
        message: `dayjs() sin fecha es el reloj de quien corre el código: usá instituteToday() o instituteMonth(). ${DATES_MESSAGE}`,
    },
    {
        selector: "CallExpression[callee.property.name=/^(startOf|endOf)$/][arguments.0.value=/^(day|week|month|year)$/]",
        message: `Límites de un período en la zona de quien corre el código: usá monthDays() o yearDays(). ${DATES_MESSAGE}`,
    },
    {
        selector: "CallExpression[callee.object.name='dayjs'][callee.property.name='locale']",
        message: `dayjs.locale() es global y cambia según qué pantallas se cargaron: usá formatDate() o .locale() en la llamada. ${DATES_MESSAGE}`,
    },
    {
        selector: "CallExpression[callee.property.name='format'][arguments.0.value=/MMM|ddd/]",
        message: `Nombres de meses o días de un idioma que depende del entorno: usá formatDate(). ${DATES_MESSAGE}`,
    },
    {
        selector: "TemplateElement[value.raw=/CURRENT_DATE/]",
        message: `CURRENT_DATE es el día de Postgres, en UTC: pasá instituteTodayKey() como parámetro. ${DATES_MESSAGE}`,
    },
];

/** Dónde valen: todo `src` menos el módulo que las implementa. */
export const dateRulesConfig = {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/dates.ts"],
    rules: {
        "no-restricted-syntax": ["error", ...dateRules],
    },
};

/**
 * Configuración que corre **solo** estas reglas, para `npm run lint:fechas`, que
 * va al principio del build. El lint completo arrastra errores viejos y no corre
 * en ningún lado; este sí: si alguien vuelve a calcular «hoy» con el reloj, el
 * deploy no sale, y como va antes de `prisma migrate deploy`, tampoco toca la
 * base. `noInlineConfig`: los comentarios `eslint-disable` del código nombran
 * reglas que acá no están cargadas.
 */
export default defineConfig([
    {
        ...dateRulesConfig,
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "off" },
    },
]);
