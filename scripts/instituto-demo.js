#!/usr/bin/env node
/**
 * Arma —o rearma desde cero— el Instituto Demo: un instituto con datos
 * inventados para mostrarle el campus a quien lo está evaluando, sin mostrar
 * nunca los datos de un cliente.
 *
 *   node scripts/instituto-demo.js
 *
 * **Se corre antes de cada demo.** Las fechas salen de hoy: la última clase, la
 * cuota del mes, los informes del trimestre y las firmas quedan al día, y lo que
 * se haya tocado en la demo anterior —un pago, una asistencia— vuelve a como era.
 * El azar tiene semilla fija, así que dos corridas el mismo día dan lo mismo.
 *
 * Seguridad, porque borra un instituto entero:
 *   - Sólo toca el instituto con subdominio `demo`, y sólo si su descripción es
 *     la marca de abajo. Si el subdominio lo tiene otro instituto, no hace nada.
 *   - Si ese instituto tiene más de `TOPE_DE_ALUMNOS`, tampoco: no es el demo.
 *   - Contra una base que no es la local pide `DEMO_REMOTO=si`.
 *
 * Las cuentas para entrar quedan en `tareas/credenciales-demo.txt`, que no se
 * versiona. Los correos van al buzón del proyecto con un alias (`+demo-…`): lo
 * que el campus mande durante una demo llega ahí y no rebota.
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const SUBDOMINIO = "demo";
const MARCA =
    "Instituto de demostración: todos los datos son inventados. Se borra y se vuelve a armar con scripts/instituto-demo.js.";
const TOPE_DE_ALUMNOS = 120;
const ZONA = "America/Argentina/Buenos_Aires";
const RAIZ = path.join(__dirname, "..");
const ARCHIVO_CREDENCIALES = path.join(RAIZ, "tareas", "credenciales-demo.txt");

const correo = (alias) => `somoslinguacampus+demo-${alias}@gmail.com`;

// ─── La base ─────────────────────────────────────────────────────────────────

/** La URL de la base sin depender de que Prisma ya haya leído el `.env`. */
function urlDeLaBase() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    try {
        const env = fs.readFileSync(path.join(RAIZ, ".env"), "utf8");
        const linea = env.split(/\r?\n/).find((l) => /^\s*DATABASE_URL\s*=/.test(l));
        if (!linea) return "";
        return linea.replace(/^\s*DATABASE_URL\s*=\s*/, "").replace(/^["']|["']$/g, "");
    } catch {
        return "";
    }
}

function hostDeLaBase() {
    try {
        return new URL(urlDeLaBase()).hostname;
    } catch {
        return "";
    }
}

const prisma = new PrismaClient();

// ─── Azar con semilla ────────────────────────────────────────────────────────

function mulberry32(semilla) {
    let a = semilla;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const azar = mulberry32(20261110);
const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
const chance = (p) => azar() < p;

function nuevoId() {
    return "demo" + crypto.randomBytes(10).toString("hex");
}

/**
 * El mismo id en cada corrida, para las cuentas con las que se entra. La sesión
 * guarda el id: con uno nuevo, quien ya había entrado sigue adentro pero el
 * campus no lo encuentra, y el portal de la familia dice que no tiene alumnos.
 */
function idEstable(clave) {
    return "demo" + crypto.createHash("sha256").update(`instituto-demo:${clave}`).digest("hex").slice(0, 20);
}

// ─── Fechas ──────────────────────────────────────────────────────────────────
// Los días van como fechas UTC a las 00:00, que es como Prisma escribe un
// `@db.Date`. Las horas, en el horario de Argentina (UTC−3, sin verano).

function dia(anio, mes, d) {
    return new Date(Date.UTC(anio, mes - 1, d));
}

function sumarDias(fecha, n) {
    return new Date(fecha.getTime() + n * 86400000);
}

function aLaHora(fecha, hhmm, minutosExtra = 0) {
    const [h, m] = hhmm.split(":").map(Number);
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), h + 3, m + minutosExtra));
}

function hoyEnElInstituto() {
    const partes = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" })
        .format(new Date())
        .split("-")
        .map(Number);
    return dia(partes[0], partes[1], partes[2]);
}

function minutosDe(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

const AHORA = new Date();
const HOY = hoyEnElInstituto();
const MES_HOY = HOY.getUTCMonth() + 1;
// El ciclo lectivo va de marzo a diciembre. En enero y febrero se muestra el
// año que terminó.
const ANIO = MES_HOY >= 3 ? HOY.getUTCFullYear() : HOY.getUTCFullYear() - 1;
const FIN_DEL_CICLO = dia(ANIO, 12, 12);
const ULTIMO_DIA = HOY < FIN_DEL_CICLO ? HOY : FIN_DEL_CICLO;
const MES_FINAL = ULTIMO_DIA.getUTCFullYear() === ANIO ? ULTIMO_DIA.getUTCMonth() + 1 : 12;
const DIA_DEL_MES = HOY.getUTCFullYear() === ANIO && HOY.getUTCMonth() + 1 === MES_FINAL ? HOY.getUTCDate() : 31;

/** El lunes de la semana del 9 de marzo: arranque de clases. */
const INICIO = (() => {
    const base = dia(ANIO, 3, 9);
    const corrimiento = (base.getUTCDay() + 6) % 7;
    return sumarDias(base, -corrimiento);
})();

const VACACIONES = [dia(ANIO, 7, 13), dia(ANIO, 7, 24)];

function enVacaciones(fecha) {
    return fecha >= VACACIONES[0] && fecha <= VACACIONES[1];
}

/** Si ese día del mes ya pasó: lo que se fecha más adelante todavía no ocurrió. */
function yaPaso(mes, d) {
    return mes < MES_FINAL || d <= DIA_DEL_MES;
}

const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// ─── El elenco ───────────────────────────────────────────────────────────────

const PERSONAL = {
    direccion: { name: "Marina Ríos", roles: ["ADMIN"], alias: "direccion" },
    secretaria: { name: "Paula Acosta", roles: ["SECRETARY"], alias: "secretaria" },
    laura: { name: "Laura Gómez", roles: ["TEACHER"], alias: "laura", hourlyRate: 18000 },
    diego: { name: "Diego Fernández", roles: ["TEACHER"], alias: "diego", hourlyRate: 20000 },
};

const CURSOS = [
    {
        clave: "teens2",
        name: "Teens 2",
        level: "A2",
        color: "#4b3ef0",
        docente: "laura",
        aula: "Aula 2",
        cuota: 48000,
        matricula: 30000,
        edad: [13, 15],
        horarios: [
            { dayOfWeek: 2, startTime: "18:00", endTime: "19:00" },
            { dayOfWeek: 4, startTime: "18:00", endTime: "19:00" },
        ],
        unidades: [
            ["Unit 1 · All about me", ["Presentarse y hablar de uno", "Verb to be y preguntas personales"]],
            ["Unit 2 · School life", ["Materias y horarios", "Present simple: rutinas"]],
            ["Unit 3 · Free time", ["Hobbies y deportes", "Like / love / hate + -ing"]],
            ["Unit 4 · At home", ["Partes de la casa", "There is / there are"]],
            ["Unit 5 · Amazing animals", ["Animales y hábitats", "Comparativos"]],
            ["Unit 6 · Travel plans", ["Medios de transporte", "Going to para planes"]],
            ["Unit 7 · Ordering food", ["Comidas y bebidas", "Pedir en un café: I'd like / Could I have…?"]],
        ],
        alumnos: [
            "Sofía Romero", "Joaquín Méndez", "Valentina Sosa", "Mateo Ruiz", "Lucía Paz", "Benjamín Castro",
            "Catalina Vega", "Tomás Aguirre", "Martina Silva", "Facundo Molina", "Abril Domínguez", "Santino Giménez",
            "Julieta Navarro", "Lautaro Medina", "Emma Cabrera", "Thiago Ortiz", "Delfina Suárez", "Bautista Peralta",
        ],
        informes: true,
        qr: true,
    },
    {
        clave: "kids3",
        name: "Kids 3",
        level: "Kids",
        color: "#ff6b4a",
        docente: "laura",
        aula: "Aula 1",
        cuota: 45000,
        matricula: 30000,
        edad: [9, 10],
        horarios: [
            { dayOfWeek: 1, startTime: "17:00", endTime: "18:00" },
            { dayOfWeek: 3, startTime: "17:00", endTime: "18:00" },
        ],
        unidades: [
            ["Unit 1 · Hello again!", ["Saludos y colores", "Números del 1 al 100"]],
            ["Unit 2 · My family", ["La familia", "Have got / has got"]],
            ["Unit 3 · My day", ["La hora y la rutina", "Present simple"]],
            ["Unit 4 · Let's play", ["Juegos y juguetes", "Can / can't"]],
            ["Unit 5 · Food I like", ["Comidas", "Like / don't like"]],
            ["Unit 6 · At the zoo", ["Animales", "Is it…? / Does it…?"]],
        ],
        alumnos: [
            "Martina López", "Felipe Correa", "Isabella Ramos", "Joaquina Vera", "Benicio Ojeda", "Olivia Paredes",
            "Lorenzo Sánchez", "Mía Benítez", "Valentino Ferrari", "Alma Rojas", "Ciro Quiroga", "Jazmín Acosta",
        ],
        informes: true,
        qr: true,
    },
    {
        clave: "adultsB1",
        name: "Adults B1",
        level: "B1",
        color: "#2db88a",
        docente: "diego",
        aula: "Aula 3",
        cuota: 52000,
        matricula: 30000,
        edad: [26, 55],
        horarios: [
            { dayOfWeek: 1, startTime: "19:30", endTime: "21:00" },
            { dayOfWeek: 3, startTime: "19:30", endTime: "21:00" },
        ],
        unidades: [
            ["Unit 1 · First impressions", ["Hablar de uno mismo", "Present simple y continuous"]],
            ["Unit 2 · Work and careers", ["El trabajo", "Present perfect"]],
            ["Unit 3 · City life", ["La ciudad", "Comparativos y superlativos"]],
            ["Unit 4 · Stories", ["Contar una anécdota", "Past simple y continuous"]],
            ["Unit 5 · Health", ["Hábitos saludables", "Should / have to"]],
            ["Unit 6 · Job interviews", ["La entrevista", "Preguntas indirectas"]],
        ],
        alumnos: ["Bruno Díaz", "Florencia Ibarra", "Gustavo Pereyra", "Natalia Campos", "Hernán Villalba", "Romina Toledo", "Sebastián Godoy", "Carla Maidana"],
        informes: false,
        qr: false,
    },
    {
        clave: "fce",
        name: "First Certificate",
        level: "B2",
        color: "#ffc53d",
        docente: "diego",
        aula: "Aula 2",
        cuota: 60000,
        matricula: 30000,
        examen: 120000,
        fechaDeExamen: dia(ANIO, 12, 5),
        edad: [16, 17],
        horarios: [{ dayOfWeek: 5, startTime: "17:30", endTime: "19:30" }],
        unidades: [
            ["Reading and Use of English", ["Part 1: multiple-choice cloze", "Part 3: word formation"]],
            ["Writing · Essays", ["Estructura del essay", "Conectores"]],
            ["Listening · Part 1 to 4", ["Estrategias", "Práctica con audios del examen"]],
            ["Speaking · Parts 1 to 4", ["Interview y long turn", "Collaborative task"]],
            ["Mock exam", ["Simulacro completo", "Corrección del simulacro"]],
        ],
        alumnos: ["Lucas Herrera", "Agustina Prieto", "Nicolás Ledesma", "Camila Ponce", "Ignacio Arias", "Micaela Funes", "Franco Bustos"],
        informes: false,
        qr: true,
    },
];

const PREINSCRIPTOS = [
    { name: "Tomás Ferreyra", registeredLevel: "Kids 2", edad: 7, tutor: "Carolina Ferreyra", relacion: "Madre", diasAtras: 0 },
    { name: "Renata Luna", registeredLevel: "Teens 1", edad: 12, tutor: "Pablo Luna", relacion: "Padre", diasAtras: 1 },
];

const NOMBRES_DE_ADULTOS = [
    "Carolina", "Mariana", "Gabriela", "Andrea", "Silvina", "Lorena", "Verónica", "Paula", "Natalia", "Laura",
    "Martín", "Pablo", "Diego", "Javier", "Sergio", "Fernando", "Gustavo", "Ricardo", "Alejandro", "Marcelo",
];

const COMENTARIOS = [
    "{n} participa mucho y ya se anima a hablar sin leer.",
    "{n} trabaja con constancia y mejoró mucho la escritura.",
    "{n} entiende muy bien los audios. Tiene que animarse más a hablar.",
    "Muy buen trimestre de {n}: cumple con las tareas y ayuda a sus compañeros.",
    "{n} avanzó mucho en vocabulario. A seguir practicando la pronunciación.",
    "{n} está muy atento en clase y se nota el trabajo en casa.",
];

const NOTAS = ["Excellent", "Very good", "Good", "Needs improvement"];

// ─── El armado y la práctica de la última clase de Teens 2 ───────────────────

const PALABRAS = [
    { text: "menu", on: true },
    { text: "waiter", on: true },
    { text: "bill", on: true },
    { text: "to order", on: true },
    { text: "I'd like…", on: true },
    { text: "dessert", on: true },
    { text: "tip", on: false },
];

const PARES = [
    { left: "menu", right: "the list of food and drinks" },
    { left: "bill", right: "the paper that says how much you pay" },
    { left: "waiter", right: "the person who brings your food" },
    { left: "to order", right: "to ask for food in a restaurant" },
    { left: "tip", right: "extra money for good service" },
    { left: "dessert", right: "something sweet after the main course" },
];

const MOMENTOS = {
    inicio: {
        selectedId: "inicio-1",
        ideas: [
            {
                id: "inicio-1",
                title: "Trivia: ¿qué se dice en el café?",
                description: "Seis preguntas rápidas con las palabras de hoy, para entrar en tema.",
                tool: "kahoot",
                minutes: 10,
                grouping: "Toda la clase",
                steps: [
                    "Proyectá el Kahoot y que entren desde el celular con el PIN.",
                    "Después de cada pregunta, pedí que alguien diga la respuesta en voz alta.",
                ],
                lines: [],
                questions: [
                    { question: "How do you ask for the bill?", options: ["Could we have the bill, please?", "Give me the menu.", "I'd like a table.", "Where is the waiter?"], answer: 0 },
                    { question: "What does a waiter do?", options: ["Brings your food", "Cooks the dessert", "Pays the bill", "Writes the menu"], answer: 0 },
                    { question: "Choose the polite way to order:", options: ["I want chicken.", "I'd like the chicken, please.", "Chicken now.", "Give me chicken."], answer: 1 },
                    { question: "What do you read to choose your food?", options: ["The bill", "The tip", "The menu", "The table"], answer: 2 },
                    { question: "“Are you ready to order?” — the best answer is…", options: ["Yes, I'd like a salad, please.", "No, I'm a waiter.", "The bill is here.", "It's delicious."], answer: 0 },
                    { question: "Something sweet after the main course is…", options: ["a starter", "a dessert", "a drink", "a tip"], answer: 1 },
                ],
            },
            {
                id: "inicio-2",
                title: "Role play: el mozo y el turista",
                description: "De a dos, uno atiende y el otro pide, con la carta en el pizarrón.",
                tool: "none",
                minutes: 8,
                grouping: "De a dos",
                lines: [
                    "Waiter: Good afternoon! Are you ready to order?",
                    "Tourist: Yes, I'd like a white coffee, please.",
                    "Waiter: Anything to eat?",
                    "Tourist: Could I have a cheese toastie, please?",
                ],
            },
            {
                id: "inicio-3",
                title: "Wordwall: uní la palabra",
                description: "Cada palabra con su definición, para repasar el vocabulario de la unidad.",
                tool: "wordwall",
                minutes: 8,
                grouping: "Cada uno",
                lines: [],
                pairs: PARES,
            },
        ],
    },
    principal: {
        selectedId: "principal-2",
        ideas: [
            {
                id: "principal-1",
                title: "Seguir con tu material",
                description: "El libro, las fotocopias o lo que ya tenías preparado, con las palabras de hoy en los ejemplos.",
                tool: "material",
                minutes: 20,
                grouping: "Toda la clase",
                lines: [
                    "Antes de la clase, elegí de tu material el ejercicio que mejor use las palabras de hoy.",
                    "Hacelo primero y usá sus respuestas como ejemplos para hablar.",
                ],
            },
            {
                id: "principal-2",
                title: "El café de la clase",
                description: "Arman un café en el aula: unos atienden y otros piden con la carta del día.",
                tool: "canva",
                minutes: 25,
                grouping: "Grupos de 3",
                steps: [
                    "Armá la carta en Canva y proyectala o imprimí una por grupo.",
                    "En cada grupo, uno atiende y dos piden. A los cinco minutos rotan.",
                    "Al final, cada grupo cuenta qué pidió y cuánto pagó.",
                ],
                lines: ["Una carta con seis comidas y cuatro bebidas, con precios en libras.", "Título: “The Class Café”."],
            },
            {
                id: "principal-3",
                title: "¿Qué pedirías?",
                description: "Cada uno lee la carta, escribe qué pediría y después lo cuenta.",
                tool: "none",
                minutes: 20,
                grouping: "Cada uno",
                lines: ["Look at the menu. What would you like to eat? Why?", "Write two sentences with “I'd like…” and one with “Could I have…?”."],
            },
        ],
    },
    cierre: {
        selectedId: "cierre-1",
        ideas: [
            {
                id: "cierre-1",
                title: "Una frase para irse",
                description: "Antes de salir, cada uno dice cómo pediría la cuenta.",
                tool: "none",
                minutes: 5,
                grouping: "Cada uno",
                lines: ["Before you leave: how do you ask for the bill?"],
            },
            {
                id: "cierre-2",
                title: "Quizlet: las palabras de hoy",
                description: "Tarjetas con las palabras de la clase para repasar en casa.",
                tool: "quizlet",
                minutes: 10,
                grouping: "Cada uno",
                lines: [],
                pairs: PARES,
            },
            {
                id: "cierre-3",
                title: "El pedido que viaja",
                description: "Teléfono descompuesto con un pedido largo: gana el equipo que lo trae entero.",
                tool: "none",
                minutes: 8,
                grouping: "Equipos",
                lines: ["“I'd like a tomato soup, a cheese toastie, an orange juice and a chocolate cake, please.”"],
            },
        ],
    },
    tarea: {
        selectedId: "campus",
        ideas: [
            {
                id: "campus",
                title: "La práctica del campus",
                description: "Pronunciación, escucha y chat con las palabras de hoy. La hacen desde su cuenta y se arma en la parte 4.",
                tool: "campus",
                minutes: 15,
                grouping: "Cada uno",
                lines: [
                    "Las frases, el texto y la conversación salen de las mismas palabras de la clase.",
                    "Los alumnos la ven en su campus cuando la publicás.",
                ],
            },
            {
                id: "tarea-2",
                title: "Mi menú ideal",
                description: "Escriben en un documento compartido la carta de su restaurante ideal.",
                tool: "docs",
                minutes: 20,
                grouping: "Cada uno",
                lines: ["Create the menu for your ideal restaurant: three starters, three main courses and two desserts."],
            },
        ],
    },
};

const PRACTICAS = [
    {
        speakingPhrases: [
            "Could I see the menu, please?",
            "I'd like a white coffee, please.",
            "Could we have the bill, please?",
            "Is there anything without meat?",
            "I'll have the chicken salad.",
            "Could we have some more water, please?",
        ],
        listeningText:
            "Waiter: Good afternoon! Here's the menu. Are you ready to order? Customer: Yes, please. I'd like the tomato soup and a cheese toastie. Waiter: Anything to drink? Customer: An orange juice, please. Waiter: Great. Would you like a dessert? Customer: Not now, thanks. Could we have the bill later? Waiter: Of course. Enjoy your meal!",
        chatScenario:
            "Sos un mozo en un café de Londres. El alumno es un turista que quiere desayunar. Ofrecele la carta, tomá el pedido y al final traele la cuenta. Usá frases simples, de nivel A2.",
    },
    {
        speakingPhrases: [
            "The soup of the day is tomato.",
            "I'd like a burger with chips.",
            "Can I have a glass of water?",
            "This chocolate cake is delicious.",
            "The waiter brings the menu.",
            "How much is the salad?",
        ],
        listeningText:
            "It's Saturday and the Taylor family is at a small restaurant. Dad orders fish and chips. Mum wants a vegetable soup. Emma, their daughter, can't decide, so the waiter recommends the pasta. For dessert, they share a big chocolate cake. The bill is thirty-two pounds, and Dad leaves a tip.",
        chatScenario:
            "Sos el dueño de un restaurante chico. El alumno quiere saber qué hay en la carta. Contale los platos del día y respondé sus preguntas sobre precios. Nivel A2.",
    },
];

const PUNTOS_DEBILES = ["th fricative", "short vowels", "word stress", "final -ed", "linking sounds"];

// ─── Firmas dibujadas ────────────────────────────────────────────────────────

/** Un trazo con forma de firma, distinto para cada semilla. */
function trazo(semilla) {
    const r = mulberry32(semilla);
    const width = 300;
    const height = 100;
    const cantidad = 2 + Math.floor(r() * 2);
    const largo = 240 / cantidad;
    const strokes = [];
    let x0 = 20 + r() * 15;
    let t = 0;
    for (let s = 0; s < cantidad; s++) {
        const puntos = [];
        const amplitud = 12 + r() * 18;
        const frecuencia = 0.06 + r() * 0.08;
        const fase = r() * 6;
        const tramo = largo * (0.8 + r() * 0.2);
        for (let i = 0; i <= 28; i++) {
            const x = x0 + (tramo * i) / 28;
            const y = 52 + amplitud * Math.sin(fase + x * frecuencia) + (r() - 0.5) * 5;
            puntos.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, t });
            t += 8 + Math.floor(r() * 6);
        }
        strokes.push(puntos);
        x0 += tramo + 8;
        t += 140;
    }
    return { strokes, width, height };
}

/** El mismo cálculo que `reportContentHash` de `src/lib/reports/signatures.ts`. */
function hashDelInforme(teacherComments, entries) {
    const ordenadas = [...entries]
        .sort((a, b) => a.categoryId.localeCompare(b.categoryId))
        .map((e) => `${e.categoryId}=${e.value ?? ""}`)
        .join("|");
    return crypto.createHash("sha256").update(`${ordenadas}::${teacherComments ?? ""}`).digest("hex");
}

// ─── Credenciales ────────────────────────────────────────────────────────────

function contrasenaDeLaDemo() {
    if (process.env.DEMO_PASSWORD) return process.env.DEMO_PASSWORD;
    try {
        const previa = fs.readFileSync(ARCHIVO_CREDENCIALES, "utf8").match(/^Contraseña: (.+)$/m);
        if (previa) return previa[1].trim();
    } catch {
        // Primera vez: se inventa una.
    }
    return "Demo-" + crypto.randomBytes(6).toString("base64url");
}

function escribirCredenciales(contrasena, sofia) {
    const local = ["127.0.0.1", "localhost"].includes(hostDeLaBase());
    const texto = [
        "Instituto Demo — cuentas para entrar",
        "",
        `Dirección: ${local ? "http://demo.localhost:3000" : "https://demo.lingua-campus.com.ar"}`,
        `Contraseña: ${contrasena}`,
        "",
        `Dirección (ADMIN):       ${correo(PERSONAL.direccion.alias)}`,
        `Secretaría:              ${correo(PERSONAL.secretaria.alias)}`,
        `Docente (Laura Gómez):   ${correo(PERSONAL.laura.alias)}`,
        `Docente (Diego Fernández): ${correo(PERSONAL.diego.alias)}`,
        `Familia de Sofía Romero: ${correo("familia")}`,
        `Alumna Sofía Romero:     DNI ${sofia.dni} (la contraseña es el DNI)`,
        "",
        `Base: ${hostDeLaBase()} · armado el ${new Date().toISOString()}`,
        "",
    ].join("\n");
    fs.mkdirSync(path.dirname(ARCHIVO_CREDENCIALES), { recursive: true });
    fs.writeFileSync(ARCHIVO_CREDENCIALES, texto, "utf8");
}

// ─── Borrar lo anterior ──────────────────────────────────────────────────────

async function borrarDatosDelDemo(instituteId) {
    const del = (modelo, where) => prisma[modelo].deleteMany({ where });
    // El orden importa: primero lo que apunta, después lo apuntado.
    await del("signature", { instituteId });
    await del("reportBatchSignature", { instituteId });
    await del("signatureReference", { instituteId });
    await del("reportTemplate", { instituteId });
    await del("studentReport", { course: { instituteId } });
    await del("messageThread", { instituteId });
    await del("notification", { instituteId });
    await del("transaction", { instituteId });
    await del("payment", { fee: { instituteId } });
    await del("fee", { instituteId });
    await del("feeDeletion", { instituteId });
    await del("practiceSession", { lesson: { course: { instituteId } } });
    await del("lesson", { course: { instituteId } });
    await del("expense", { instituteId });
    await del("miscellaneousIncome", { instituteId });
    await del("schedule", { course: { instituteId } });
    await del("enrollment", { course: { instituteId } });
    await del("course", { instituteId });
    await del("guardianStudentLink", { student: { instituteId } });
    await del("guardianStudentLink", { guardian: { instituteId } });
    await del("student", { instituteId });
    await del("passwordResetToken", { instituteId });
    await del("activityDay", { instituteId });
    await del("user", { instituteId });
    await del("classroom", { instituteId });
    await del("level", { instituteId });
}

async function crearEnTandas(modelo, filas, tamano = 500) {
    for (let i = 0; i < filas.length; i += tamano) {
        await prisma[modelo].createMany({ data: filas.slice(i, i + tamano) });
    }
}

// ─── Armado ──────────────────────────────────────────────────────────────────

async function main() {
    const host = hostDeLaBase();
    const esLocal = host === "127.0.0.1" || host === "localhost";
    if (!esLocal && process.env.DEMO_REMOTO !== "si") {
        console.error(`La base es ${host || "desconocida"}, no la local. Para armar el demo ahí: DEMO_REMOTO=si node scripts/instituto-demo.js`);
        process.exit(1);
    }

    const existente = await prisma.institute.findUnique({ where: { subdomain: SUBDOMINIO } });
    if (existente) {
        if (existente.description !== MARCA) {
            console.error(`El subdominio «${SUBDOMINIO}» lo tiene «${existente.name}», que no es el instituto demo. No se toca nada.`);
            process.exit(1);
        }
        const alumnos = await prisma.student.count({ where: { instituteId: existente.id } });
        if (alumnos > TOPE_DE_ALUMNOS) {
            console.error(`El instituto «${existente.name}» tiene ${alumnos} alumnos: no parece el demo. No se toca nada.`);
            process.exit(1);
        }
    }

    const contrasena = contrasenaDeLaDemo();
    const hashDelPersonal = await bcrypt.hash(contrasena, 10);
    const hashSinUso = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

    let instituteId;
    const datosDelInstituto = {
        name: "Instituto Demo",
        plan: "PREMIUM",
        status: "ACTIVE",
        description: MARCA,
        email: correo("instituto"),
        address: null,
        phone: null,
        senderEmail: null,
    };
    if (existente) {
        instituteId = existente.id;
        console.log("Borrando el demo anterior…");
        await borrarDatosDelDemo(instituteId);
        await prisma.institute.update({ where: { id: instituteId }, data: datosDelInstituto });
    } else {
        const creado = await prisma.institute.create({ data: { ...datosDelInstituto, subdomain: SUBDOMINIO } });
        instituteId = creado.id;
    }

    console.log(`Armando el ciclo ${ANIO}, del ${INICIO.toISOString().slice(0, 10)} al ${ULTIMO_DIA.toISOString().slice(0, 10)}…`);

    // Personal
    const personal = {};
    for (const [clave, p] of Object.entries(PERSONAL)) {
        personal[clave] = {
            id: idEstable(`usuario:${p.alias}`),
            name: p.name,
            email: correo(p.alias),
            password: hashDelPersonal,
            hasDefaultPassword: false,
            roles: p.roles,
            hourlyRate: p.hourlyRate ?? 0,
            phone: null,
            status: "ACTIVE",
            instituteId,
            createdAt: sumarDias(INICIO, -60),
        };
    }
    await crearEnTandas("user", Object.values(personal));
    const operador = personal.direccion.id;

    // Aulas y niveles
    const aulas = {};
    for (const nombre of ["Aula 1", "Aula 2", "Aula 3"]) aulas[nombre] = { id: nuevoId(), name: nombre, capacity: 20, instituteId };
    await crearEnTandas("classroom", Object.values(aulas));
    await crearEnTandas("level", CURSOS.map((c) => ({ id: nuevoId(), name: c.name, instituteId })));

    // DNIs que empiezan en 7: hoy no los tiene nadie, así que no coinciden con
    // los de una persona real.
    const dnisUsados = new Set();
    const nuevoDni = () => {
        let dni;
        do dni = "7" + String(entre(0, 9999999)).padStart(7, "0");
        while (dnisUsados.has(dni));
        dnisUsados.add(dni);
        return dni;
    };
    const telefono = () => `+54 9 223 000-${String(entre(0, 9999)).padStart(4, "0")}`;

    const filas = {
        students: [],
        guardians: [],
        links: [],
        courses: [],
        schedules: [],
        enrollments: [],
        lessons: [],
        attendances: [],
        grades: [],
        fees: [],
        payments: [],
        transactions: [],
        expenses: [],
        misc: [],
    };
    const porNombre = {};
    let indiceDeTutor = 0;

    for (const curso of CURSOS) {
        const courseId = nuevoId();
        curso.id = courseId;
        filas.courses.push({
            id: courseId,
            name: curso.name,
            level: curso.level,
            color: curso.color,
            status: "ACTIVE",
            teacherId: personal[curso.docente].id,
            classroomId: aulas[curso.aula].id,
            instituteId,
            startDate: INICIO,
            endDate: FIN_DEL_CICLO,
            monthlyPrice: curso.cuota,
            enrollmentPrice: curso.matricula,
            examPrice: curso.examen ?? 0,
            examDate: curso.fechaDeExamen ?? null,
            createdAt: sumarDias(INICIO, -30),
        });

        curso.horarioIds = curso.horarios.map((h) => {
            const id = nuevoId();
            filas.schedules.push({ id, courseId, ...h, room: curso.aula });
            return id;
        });

        curso.inscriptos = [];
        for (const nombre of curso.alumnos) {
            const dni = nuevoDni();
            const edad = entre(curso.edad[0], curso.edad[1]);
            const nacimiento = dia(ANIO - edad, entre(1, 12), entre(1, 28));
            const apellido = nombre.split(" ").slice(1).join(" ");
            const menor = edad < 18;
            const studentId = idEstable(`alumno:${nombre}`);
            const alumno = {
                id: studentId,
                name: nombre,
                dni,
                birthDate: nacimiento,
                phone: menor ? null : telefono(),
                status: "ACTIVE",
                registeredLevel: curso.name,
                joinDate: sumarDias(INICIO, -entre(7, 400)),
                password: await bcrypt.hash(dni, 8),
                hasDefaultPassword: true,
                instituteId,
                createdAt: sumarDias(INICIO, -10),
            };

            if (menor) {
                const esSofia = nombre === "Sofía Romero";
                const nombreTutor = esSofia ? "Carolina" : NOMBRES_DE_ADULTOS[indiceDeTutor % NOMBRES_DE_ADULTOS.length];
                const relacion = esSofia || indiceDeTutor % 3 !== 2 ? "Madre" : "Padre";
                const email = esSofia ? correo("familia") : correo(`tutor-${String(indiceDeTutor + 1).padStart(2, "0")}`);
                const tutorId = idEstable(`usuario:${email}`);
                const tutor = {
                    id: tutorId,
                    name: `${nombreTutor} ${apellido}`,
                    email,
                    password: esSofia ? hashDelPersonal : hashSinUso,
                    hasDefaultPassword: false,
                    roles: ["GUARDIAN"],
                    phone: telefono(),
                    status: "ACTIVE",
                    instituteId,
                    createdAt: alumno.joinDate,
                };
                indiceDeTutor++;
                filas.guardians.push(tutor);
                filas.links.push({ id: nuevoId(), guardianId: tutorId, studentId, relation: relacion });
                Object.assign(alumno, {
                    guardian1Name: tutor.name,
                    guardian1Relation: relacion,
                    guardian1Phone: tutor.phone,
                    guardian1Email: tutor.email,
                });
                alumno.tutorId = tutorId;
            }

            filas.students.push(alumno);
            porNombre[nombre] = alumno;

            const beca = { "Valentina Sosa": 0.5, "Alma Rojas": 0.7 }[nombre];
            const enrollmentId = nuevoId();
            filas.enrollments.push({
                id: enrollmentId,
                studentId,
                courseId,
                enrolledAt: sumarDias(INICIO, -entre(3, 20)),
                status: "ACTIVE",
                billingMode: "MONTHLY",
                customMonthlyPrice: beca ? Math.round(curso.cuota * beca) : null,
                takesExam: Boolean(curso.examen),
            });
            curso.inscriptos.push({ alumno, enrollmentId, cuota: beca ? Math.round(curso.cuota * beca) : curso.cuota });
        }
    }

    // Pre-inscriptos del formulario web
    const preinscriptos = PREINSCRIPTOS.map((p) => {
        const dni = nuevoDni();
        const apellido = p.name.split(" ").slice(1).join(" ");
        const llego = aLaHora(sumarDias(HOY, -p.diasAtras), "10:00", entre(0, 300));
        return {
            id: nuevoId(),
            name: p.name,
            dni,
            birthDate: dia(ANIO - p.edad, entre(1, 12), entre(1, 28)),
            status: "PRE_INSCRIBED",
            registeredLevel: p.registeredLevel,
            password: hashSinUso,
            hasDefaultPassword: true,
            guardian1Name: p.tutor,
            guardian1Relation: p.relacion,
            guardian1Phone: telefono(),
            guardian1Email: correo(`preinscripcion-${apellido.toLowerCase()}`),
            joinDate: llego < AHORA ? llego : AHORA,
            instituteId,
            createdAt: llego < AHORA ? llego : AHORA,
        };
    });

    await crearEnTandas("user", filas.guardians);
    await crearEnTandas(
        "student",
        [...filas.students, ...preinscriptos].map(({ tutorId, ...resto }) => resto)
    );
    await crearEnTandas("guardianStudentLink", filas.links);
    await crearEnTandas("course", filas.courses);
    await crearEnTandas("schedule", filas.schedules);
    await crearEnTandas("enrollment", filas.enrollments);

    // ─── Clases, asistencia y notas ──────────────────────────────────────────
    const horaAhora = minutosDe(
        new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).format(AHORA)
    );

    for (const curso of CURSOS) {
        const clases = [];
        // Las que faltan hasta fin de año, como las deja `generateLessonsAction`:
        // generadas en tanda desde el horario, con «Clase Programada» de tema y
        // sin contenidos. Sin ellas, el portal de la familia y el inicio del
        // docente dicen que no hay próximas clases.
        const futuras = [];
        for (let d = INICIO; d <= FIN_DEL_CICLO; d = sumarDias(d, 1)) {
            if (enVacaciones(d)) continue;
            curso.horarios.forEach((h, i) => {
                if (h.dayOfWeek !== d.getUTCDay()) return;
                // La de hoy es de las dadas sólo si ya empezó.
                const yaEmpezo = d < HOY || (d.getTime() === HOY.getTime() && horaAhora >= minutosDe(h.startTime));
                (yaEmpezo ? clases : futuras).push({ date: d, horario: h, scheduleId: curso.horarioIds[i] });
            });
        }
        curso.futuras = futuras.map((c) => ({
            id: nuevoId(),
            courseId: curso.id,
            type: "CLASS",
            status: "ACTIVE",
            date: c.date,
            topic: "Clase Programada",
            content: null,
            scheduleId: c.scheduleId,
            createdAt: aLaHora(sumarDias(INICIO, -3), "10:00"),
            horario: c.horario,
        }));

        const N = clases.length;
        const examenes = new Set([Math.round(N * 0.35), Math.round(N * 0.7)]);
        curso.clases = clases.map((c, i) => {
            const [titulo, temas] = curso.unidades[Math.min(curso.unidades.length - 1, Math.floor((i * curso.unidades.length) / N))];
            const esExamen = examenes.has(i);
            const numeroDeExamen = [...examenes].indexOf(i) + 1;
            const leccion = {
                id: nuevoId(),
                courseId: curso.id,
                type: esExamen ? "EXAM" : "CLASS",
                status: "ACTIVE",
                date: c.date,
                topic: esExamen ? `Progress test ${numeroDeExamen}` : titulo,
                content: esExamen ? `Evaluación escrita y oral de las unidades vistas.` : temas[i % temas.length],
                scheduleId: c.scheduleId,
                createdAt: aLaHora(c.date, c.horario.startTime),
                horario: c.horario,
            };
            return leccion;
        });

        const ultima = curso.clases[curso.clases.length - 1];
        for (const leccion of curso.clases) {
            const desde = sumarDias(INICIO, 56);
            for (const { alumno } of curso.inscriptos) {
                let status = "PRESENT";
                const r = azar();
                if (r > 0.97) status = "JUSTIFIED";
                else if (r > 0.91) status = "ABSENT";
                else if (r > 0.86) status = "LATE";
                const presente = status === "PRESENT" || status === "LATE";
                let source = curso.qr && presente && leccion.date >= desde && chance(0.6) ? "QR" : "MANUAL";

                if (leccion === ultima && curso.clave === "teens2") {
                    const fijo = { "Sofía Romero": ["PRESENT", "QR"], "Joaquín Méndez": ["PRESENT", "QR"], "Valentina Sosa": ["LATE", "MANUAL"], "Mateo Ruiz": ["ABSENT", "MANUAL"], "Lucía Paz": ["JUSTIFIED", "MANUAL"] }[alumno.name];
                    if (fijo) [status, source] = fijo;
                }

                const llegada = aLaHora(leccion.date, leccion.horario.startTime, status === "LATE" ? entre(8, 20) : entre(-6, 2));
                filas.attendances.push({
                    id: nuevoId(),
                    studentId: alumno.id,
                    lessonId: leccion.id,
                    status,
                    source,
                    notes: null,
                    createdAt: llegada < AHORA ? llegada : AHORA,
                });
            }

            if (leccion.type === "EXAM") {
                for (const { alumno } of curso.inscriptos) {
                    filas.grades.push({
                        id: nuevoId(),
                        studentId: alumno.id,
                        lessonId: leccion.id,
                        score: String(entre(12, 20) / 2),
                        feedback: null,
                        createdAt: sumarDias(leccion.createdAt, 3),
                    });
                }
            }
        }
        curso.ultima = ultima;
    }

    // ─── Sueldos: las clases de cada mes cerrado, pagadas a principio del siguiente
    const sueldos = [];
    for (const clave of ["laura", "diego"]) {
        const docente = personal[clave];
        for (let mes = 3; mes < MES_FINAL; mes++) {
            const pago = mes === 12 ? null : dia(ANIO, mes + 1, 5);
            if (!pago || !yaPaso(mes + 1, 5)) continue;
            const clases = CURSOS.filter((c) => c.docente === clave)
                .flatMap((c) => c.clases)
                .filter((l) => l.date.getUTCMonth() + 1 === mes);
            if (clases.length === 0) continue;
            const horas = clases.reduce((t, l) => t + (minutosDe(l.horario.endTime) - minutosDe(l.horario.startTime)) / 60, 0);
            const expenseId = nuevoId();
            const monto = Math.round(horas * docente.hourlyRate);
            sueldos.push({ expenseId, clases });
            filas.expenses.push({
                id: expenseId,
                description: `Sueldo de ${docente.name} · ${MESES[mes]} (${horas} h)`,
                amount: monto,
                date: pago,
                category: "Payroll",
                status: "VALID",
                instituteId,
                recipientId: docente.id,
                createdAt: aLaHora(pago, "11:00"),
            });
            filas.transactions.push({
                id: nuevoId(),
                instituteId,
                amount: -monto,
                type: "PAYROLL",
                method: "TRANSFERENCIA",
                date: pago,
                status: "VALID",
                description: `Sueldo de ${docente.name} · ${MESES[mes]} (${horas} h)`,
                expenseId,
                operatorId: operador,
                createdAt: aLaHora(pago, "11:00"),
            });
        }
    }
    const pagadaCon = new Map();
    for (const s of sueldos) for (const l of s.clases) pagadaCon.set(l.id, s.expenseId);

    const lecciones = CURSOS.flatMap((c) => [...c.clases, ...c.futuras]).map(({ horario, ...l }) => ({ ...l, expenseId: pagadaCon.get(l.id) ?? null }));

    // ─── Gastos fijos y otros ingresos ───────────────────────────────────────
    const gasto = (mes, d, category, description, amount) => {
        if (!yaPaso(mes, d)) return;
        const fecha = dia(ANIO, mes, d);
        const expenseId = nuevoId();
        filas.expenses.push({ id: expenseId, description, amount, date: fecha, category, status: "VALID", instituteId, createdAt: aLaHora(fecha, "12:00") });
        filas.transactions.push({
            id: nuevoId(),
            instituteId,
            amount: -amount,
            type: "EXPENSE",
            method: category === "ALQUILER" ? "TRANSFERENCIA" : "EFECTIVO",
            date: fecha,
            status: "VALID",
            description: `Gasto: ${category}`,
            expenseId,
            operatorId: operador,
            createdAt: aLaHora(fecha, "12:00"),
        });
    };
    for (let mes = 3; mes <= MES_FINAL; mes++) {
        gasto(mes, 5, "ALQUILER", "Alquiler del local", 650000);
        gasto(mes, 12, "SERVICIOS", "Luz", entre(52, 74) * 1000);
        gasto(mes, 15, "SERVICIOS", "Internet", 28000);
        gasto(mes, 26, "MANTENIMIENTO", "Limpieza", 90000);
    }
    gasto(3, 2, "MATERIALES", "Libros y fotocopias para el año", 180000);
    gasto(3, 4, "PUBLICIDAD", "Publicidad en redes · inscripciones", 45000);
    gasto(8, 3, "MATERIALES", "Fotocopias del segundo semestre", 38000);

    const ingreso = (mes, d, category, description, amount, method) => {
        if (!yaPaso(mes, d)) return;
        const fecha = dia(ANIO, mes, d);
        const miscIncomeId = nuevoId();
        filas.misc.push({ id: miscIncomeId, description, amount, date: fecha, category, method, status: "VALID", instituteId, createdAt: aLaHora(fecha, "16:00") });
        filas.transactions.push({ id: nuevoId(), instituteId, amount, type: "MISC_INCOME", method, date: fecha, status: "VALID", description, miscIncomeId, operatorId: operador, createdAt: aLaHora(fecha, "16:00") });
    };
    ingreso(3, 10, "VENTA_LIBROS", "Libros de Teens 2", 18 * 32000, "TRANSFERENCIA");
    ingreso(3, 11, "VENTA_LIBROS", "Libros de Kids 3", 12 * 28000, "EFECTIVO");
    ingreso(9, 20, "TALLER", "Taller de conversación de primavera", 9 * 15000, "MERCADOPAGO");

    // ─── Cuotas y pagos ──────────────────────────────────────────────────────
    const METODOS = ["EFECTIVO", "EFECTIVO", "TRANSFERENCIA", "TRANSFERENCIA", "TRANSFERENCIA", "MERCADOPAGO"];
    const deudas = {
        "Martina López": [MES_FINAL, MES_FINAL - 1],
        "Ciro Quiroga": [MES_FINAL, MES_FINAL - 1, MES_FINAL - 2],
        "Mateo Ruiz": [MES_FINAL],
        "Bruno Díaz": [MES_FINAL],
        "Gustavo Pereyra": [MES_FINAL],
    };
    const parciales = { "Joaquín Méndez": { [MES_FINAL]: 20000 }, "Gustavo Pereyra": { [MES_FINAL - 1]: 26000 } };

    const cobrar = ({ fee, monto, recargo = 0, fecha, metodo, anulado = false, motivo }) => {
        const paymentId = nuevoId();
        const cuando = aLaHora(fecha, `${entre(9, 19)}:${String(entre(0, 59)).padStart(2, "0")}`);
        filas.payments.push({
            id: paymentId,
            feeId: fee.id,
            amount: monto + recargo,
            surcharge: recargo,
            discount: 0,
            method: metodo,
            date: cuando,
            notes: null,
            status: anulado ? "VOIDED" : "VALID",
            createdAt: cuando,
        });
        filas.transactions.push({
            id: nuevoId(),
            instituteId,
            amount: monto + recargo,
            type: "PAYMENT",
            method: metodo,
            date: fecha,
            status: anulado ? "VOIDED" : "VALID",
            description: `Pago Cuota/Matrícula - Estudiante ID: ${fee.studentId}`,
            paymentId,
            operatorId: operador,
            createdAt: cuando,
        });
        if (anulado) {
            filas.transactions.push({
                id: nuevoId(),
                instituteId,
                amount: -(monto + recargo),
                type: "REFUND",
                method: metodo,
                date: fecha,
                status: "VALID",
                description: `Anulación de Pago de Cuota #${paymentId.slice(-6)} - Motivo: ${motivo}`,
                paymentId,
                operatorId: operador,
                createdAt: new Date(cuando.getTime() + 25 * 60000),
            });
        }
        return cuando;
    };

    for (const curso of CURSOS) {
        for (const { alumno, enrollmentId, cuota } of curso.inscriptos) {
            const metodoHabitual = elegir(METODOS);

            // Matrícula del año, pagada al arrancar.
            const matricula = {
                id: nuevoId(),
                studentId: alumno.id,
                enrollmentId,
                type: "ENROLLMENT",
                originalAmount: curso.matricula,
                paidAmount: curso.matricula,
                year: ANIO,
                month: 0,
                status: "PAID",
                instituteId,
                createdAt: aLaHora(sumarDias(INICIO, -14), "09:00"),
            };
            matricula.datePaid = cobrar({ fee: matricula, monto: curso.matricula, fecha: sumarDias(INICIO, -entre(2, 12)), metodo: metodoHabitual });
            filas.fees.push(matricula);

            for (let mes = 3; mes <= MES_FINAL; mes++) {
                const fee = {
                    id: nuevoId(),
                    studentId: alumno.id,
                    enrollmentId,
                    type: "MONTHLY",
                    originalAmount: cuota,
                    paidAmount: 0,
                    year: ANIO,
                    month: mes,
                    status: "PENDING",
                    datePaid: null,
                    instituteId,
                    createdAt: aLaHora(dia(ANIO, mes, 1), "08:00"),
                };
                filas.fees.push(fee);
                if ((deudas[alumno.name] ?? []).includes(mes) && !parciales[alumno.name]?.[mes]) continue;

                const parcial = parciales[alumno.name]?.[mes];
                const diaDePago = chance(0.82) ? entre(1, 10) : entre(11, 20);
                if (parcial) {
                    const d = Math.min(entre(3, 9), mes === MES_FINAL ? DIA_DEL_MES : 28);
                    cobrar({ fee, monto: parcial, fecha: dia(ANIO, mes, d), metodo: "EFECTIVO" });
                    Object.assign(fee, { paidAmount: parcial, status: "PARTIAL" });
                    continue;
                }
                if (!yaPaso(mes, diaDePago)) continue;

                const fecha = dia(ANIO, mes, diaDePago);
                // Después del 10, con el recargo del 10 %.
                const recargo = diaDePago > 10 ? Math.round(cuota * 0.1) : 0;
                const metodo = chance(0.85) ? metodoHabitual : elegir(METODOS);

                // Joaquín: el mes pasado la secretaría cargó dos veces el mismo pago
                // en efectivo, y uno se anuló.
                if (alumno.name === "Joaquín Méndez" && mes === MES_FINAL - 1) {
                    cobrar({ fee, monto: cuota, fecha, metodo: "EFECTIVO", anulado: true, motivo: "Cargado dos veces" });
                    fee.datePaid = cobrar({ fee, monto: cuota, fecha, metodo: "EFECTIVO" });
                } else {
                    fee.datePaid = cobrar({ fee, monto: cuota, recargo, fecha, metodo });
                }
                Object.assign(fee, { paidAmount: cuota, status: "PAID" });
            }

            // Derecho de examen: se paga en cuotas durante el segundo semestre.
            if (curso.examen) {
                const fee = {
                    id: nuevoId(),
                    studentId: alumno.id,
                    enrollmentId,
                    type: "EXAM",
                    originalAmount: curso.examen,
                    paidAmount: 0,
                    year: ANIO,
                    month: 0,
                    status: "PENDING",
                    datePaid: null,
                    instituteId,
                    createdAt: aLaHora(dia(ANIO, 8, 1), "08:00"),
                };
                const cuotas = entre(1, 3);
                for (let k = 0; k < cuotas; k++) {
                    const mes = 8 + k;
                    const d = entre(4, 12);
                    if (!yaPaso(mes, d)) break;
                    const ultimaVez = cobrar({ fee, monto: curso.examen / 3, fecha: dia(ANIO, mes, d), metodo: "TRANSFERENCIA" });
                    fee.paidAmount += curso.examen / 3;
                    if (fee.paidAmount >= curso.examen - 0.005) fee.datePaid = ultimaVez;
                }
                fee.status = fee.paidAmount >= curso.examen - 0.005 ? "PAID" : fee.paidAmount > 0 ? "PARTIAL" : "PENDING";
                filas.fees.push(fee);
            }
        }
    }

    await crearEnTandas("expense", filas.expenses);
    await crearEnTandas("lesson", lecciones);
    await crearEnTandas("attendance", filas.attendances, 1000);
    await crearEnTandas("grade", filas.grades);
    await crearEnTandas("miscellaneousIncome", filas.misc);
    await crearEnTandas("fee", filas.fees);
    await crearEnTandas("payment", filas.payments);
    await crearEnTandas("transaction", filas.transactions, 1000);

    // ─── El armado y la práctica de Teens 2 ──────────────────────────────────
    const teens = CURSOS.find((c) => c.clave === "teens2");
    const clasesTeens = teens.clases.filter((l) => l.type === "CLASS");
    const ultimaTeens = clasesTeens[clasesTeens.length - 1];
    const anteriorTeens = clasesTeens[clasesTeens.length - 3];

    const seleccionadas = PALABRAS.filter((p) => p.on).map((p) => p.text.toLowerCase()).sort();
    await prisma.lessonPlan.create({
        data: {
            lessonId: ultimaTeens.id,
            focus: "Conversación",
            words: PALABRAS,
            moments: MOMENTOS,
            ideasBasis: JSON.stringify({ focus: "Conversación", words: seleccionadas }),
            chosen: 4,
            createdAt: sumarDias(ultimaTeens.createdAt, -1),
        },
    });

    const practicas = [];
    for (const [leccion, contenido] of [
        [ultimaTeens, PRACTICAS[0]],
        [anteriorTeens, PRACTICAS[1]],
    ]) {
        const practica = await prisma.lessonPractice.create({
            data: { lessonId: leccion.id, ...contenido, isPublished: true, createdAt: sumarDias(leccion.createdAt, -1) },
        });
        practicas.push({ practica, leccion });
    }

    const sesiones = [];
    for (const { practica, leccion } of practicas) {
        const finDeClase = aLaHora(leccion.date, leccion.horario.endTime);
        if (finDeClase > AHORA) continue;
        const margen = Math.min(AHORA.getTime() - finDeClase.getTime(), 4 * 86400000);
        const quienes = teens.inscriptos.filter(({ alumno }) => alumno.name === "Sofía Romero" || chance(0.5));
        for (const { alumno } of quienes) {
            const cuando = new Date(finDeClase.getTime() + Math.floor(azar() * margen));
            const correctas = entre(4, 6);
            sesiones.push({
                id: nuevoId(), studentId: alumno.id, lessonId: leccion.id, lessonPracticeId: practica.id, type: "SPEAKING",
                phrasesAttempted: 6, phrasesCorrect: correctas, accuracyPct: Math.round((correctas / 6) * 1000) / 10,
                weakArea: correctas < 6 ? elegir(PUNTOS_DEBILES) : null, durationSeconds: entre(240, 540), completedAt: cuando,
            });
            if (chance(0.8)) {
                const bien = entre(3, 5);
                sesiones.push({
                    id: nuevoId(), studentId: alumno.id, lessonId: leccion.id, lessonPracticeId: practica.id, type: "LISTENING",
                    phrasesAttempted: 5, phrasesCorrect: bien, accuracyPct: bien * 20, weakArea: null,
                    durationSeconds: entre(180, 420), completedAt: new Date(cuando.getTime() + 9 * 60000),
                });
            }
            if (chance(0.6)) {
                sesiones.push({
                    id: nuevoId(), studentId: alumno.id, lessonId: leccion.id, lessonPracticeId: practica.id, type: "CHAT",
                    phrasesAttempted: 0, phrasesCorrect: 0, accuracyPct: 0, weakArea: null,
                    durationSeconds: entre(300, 720), completedAt: new Date(cuando.getTime() + 20 * 60000),
                });
            }
        }
    }
    await crearEnTandas("practiceSession", sesiones.filter((s) => s.completedAt <= AHORA));

    // ─── Boletín con firmas ──────────────────────────────────────────────────
    const plantilla = await prisma.reportTemplate.create({
        data: {
            instituteId,
            name: "Boletín trimestral",
            isActive: true,
            periodType: "QUARTERLY",
            periodCount: 3,
            periodLabels: ["1.º trimestre", "2.º trimestre", "3.º trimestre"],
            specialFields: { teacherComments: true, teacherSignature: true, parentSignature: true, studentSignature: false },
            categories: {
                create: ["Speaking", "Listening", "Reading", "Writing"].map((name, order) => ({
                    name,
                    order,
                    scaleType: "CONCEPTUAL",
                    scaleOptions: NOTAS.map((n) => ({ label: n, value: n })),
                })),
            },
        },
        include: { categories: true },
    });

    const periodos = [
        { periodIndex: 0, publicado: dia(ANIO, 6, 6), firmaron: 1 },
        { periodIndex: 1, publicado: dia(ANIO, 9, 5), firmaron: { teens2: 14, kids3: 10 } },
        { periodIndex: 2, publicado: dia(ANIO, 12, 4), firmaron: { teens2: 6, kids3: 4 } },
    ].filter((p) => p.publicado <= sumarDias(HOY, -2));

    const referencias = new Map();
    for (const curso of CURSOS.filter((c) => c.informes)) {
        await prisma.courseReportTemplate.create({ data: { courseId: curso.id, templateId: plantilla.id, isActive: true } });

        for (const periodo of periodos) {
            const publicado = aLaHora(periodo.publicado, "10:00");
            const hashes = {};
            const cuantosFirman = periodo.firmaron === 1 ? curso.inscriptos.length : periodo.firmaron[curso.clave];
            // Sofía va última: en el trimestre que no firmaron todos, la suya queda
            // pendiente, para firmarla en vivo desde la cuenta de la familia.
            const orden = [...curso.inscriptos].sort((a, b) => (a.alumno.name === "Sofía Romero" ? 1 : b.alumno.name === "Sofía Romero" ? -1 : 0));

            for (const [i, { alumno }] of orden.entries()) {
                const nombre = alumno.name.split(" ")[0];
                const comentario = elegir(COMENTARIOS).replace("{n}", nombre);
                const entradas = plantilla.categories.map((c) => ({ categoryId: c.id, value: elegir(NOTAS.slice(0, chance(0.85) ? 3 : 4)) }));
                const contentHash = hashDelInforme(comentario, entradas);
                hashes[alumno.id] = contentHash;

                const reporte = await prisma.studentReport.create({
                    data: {
                        templateId: plantilla.id,
                        studentId: alumno.id,
                        courseId: curso.id,
                        year: ANIO,
                        periodIndex: periodo.periodIndex,
                        teacherComments: comentario,
                        publishedAt: publicado,
                        contentHash,
                        entries: { create: entradas },
                        signers: alumno.tutorId ? { create: [{ userId: alumno.tutorId }] } : undefined,
                    },
                });

                const firma = alumno.tutorId && i < cuantosFirman;
                if (firma) {
                    const semilla = parseInt(crypto.createHash("md5").update(alumno.tutorId).digest("hex").slice(0, 8), 16);
                    const strokeData = trazo(semilla);
                    const firmado = new Date(publicado.getTime() + entre(2, 240) * 3600000);
                    await prisma.signature.create({
                        data: {
                            instituteId,
                            reportId: reporte.id,
                            userId: alumno.tutorId,
                            signedAt: firmado < AHORA ? firmado : AHORA,
                            contentHash,
                            strokeData,
                            similarityScore: referencias.has(alumno.tutorId) ? entre(72, 96) : null,
                        },
                    });
                    referencias.set(alumno.tutorId, strokeData);
                }
            }

            for (const [signerRole, quien, horasAntes] of [
                ["TEACHER", personal[curso.docente], 48],
                ["ADMIN", personal.direccion, 20],
            ]) {
                const semilla = parseInt(crypto.createHash("md5").update(quien.id).digest("hex").slice(0, 8), 16);
                await prisma.reportBatchSignature.create({
                    data: {
                        instituteId,
                        courseId: curso.id,
                        templateId: plantilla.id,
                        year: ANIO,
                        periodIndex: periodo.periodIndex,
                        signerRole,
                        userId: quien.id,
                        signerName: quien.name,
                        signedAt: new Date(publicado.getTime() - horasAntes * 3600000),
                        contentHashes: hashes,
                        strokeData: trazo(semilla),
                    },
                });
            }
        }
    }
    for (const [userId, strokeData] of referencias) {
        await prisma.signatureReference.create({ data: { instituteId, userId, strokeData } });
    }

    // ─── Mensajes y avisos ───────────────────────────────────────────────────
    const sofia = porNombre["Sofía Romero"];
    const laura = personal.laura;
    const ayer = aLaHora(sumarDias(HOY, -1), "19:20");
    await prisma.messageThread.create({
        data: {
            instituteId,
            subject: "Repaso para la prueba oral",
            type: "COURSE_BLAST",
            courseId: teens.id,
            createdAt: ayer,
            updatedAt: ayer,
            participants: {
                create: [
                    { userId: laura.id, isAuthor: true, lastReadAt: ayer, actingRole: "TEACHER" },
                    ...teens.inscriptos.filter(({ alumno }) => alumno.tutorId).map(({ alumno }) => ({ userId: alumno.tutorId, isAuthor: false })),
                    ...teens.inscriptos.map(({ alumno }) => ({ studentId: alumno.id, isAuthor: false })),
                ],
            },
            messages: {
                create: {
                    senderUserId: laura.id,
                    senderRole: "TEACHER",
                    body: "Hola, familias. En la próxima clase repasamos para la prueba oral. Pueden practicar las frases de la unidad desde el campus.",
                    createdAt: ayer,
                },
            },
        },
    });

    const finUltima = aLaHora(ultimaTeens.date, "19:15");
    const mensajeDirecto = finUltima < AHORA ? finUltima : ayer;
    await prisma.messageThread.create({
        data: {
            instituteId,
            subject: "Sofía en la clase",
            type: "DIRECT",
            studentId: sofia.id,
            createdAt: mensajeDirecto,
            updatedAt: mensajeDirecto,
            participants: {
                create: [
                    { userId: laura.id, isAuthor: true, lastReadAt: mensajeDirecto, actingRole: "TEACHER" },
                    { userId: sofia.tutorId, isAuthor: false },
                ],
            },
            messages: {
                create: {
                    senderUserId: laura.id,
                    senderRole: "TEACHER",
                    body: "Hola, Carolina. Sofía estuvo genial en el role play del café: pidió todo en inglés y sin leer. ¡Felicitaciones!",
                    createdAt: mensajeDirecto,
                },
            },
        },
    });

    const avisos = [];
    for (const p of preinscriptos) {
        for (const destino of [personal.direccion, personal.secretaria]) {
            avisos.push({
                id: nuevoId(),
                instituteId,
                userId: destino.id,
                type: "NEW_ENROLLMENT",
                title: "Nueva pre-inscripción recibida",
                body: `${p.name} — Nivel: ${p.registeredLevel} se pre-inscribió al instituto`,
                link: "/students?tab=pre-enrolled",
                read: false,
                createdAt: p.createdAt,
            });
        }
    }
    await crearEnTandas("notification", avisos);

    escribirCredenciales(contrasena, sofia);

    const cuenta = await prisma.$transaction([
        prisma.student.count({ where: { instituteId, status: "ACTIVE" } }),
        prisma.lesson.count({ where: { course: { instituteId }, topic: { not: "Clase Programada" } } }),
        prisma.lesson.count({ where: { course: { instituteId }, topic: "Clase Programada" } }),
        prisma.fee.count({ where: { instituteId, status: { in: ["PENDING", "PARTIAL"] } } }),
        prisma.signature.count({ where: { instituteId } }),
    ]);
    console.log(
        `Listo: ${cuenta[0]} alumnos, ${preinscriptos.length} pre-inscriptos, ${cuenta[1]} clases dadas y ${cuenta[2]} por venir, ${cuenta[3]} cuotas impagas o parciales, ${cuenta[4]} firmas de familias.`
    );
    console.log(`Última clase de Teens 2: ${ultimaTeens.date.toISOString().slice(0, 10)} · ${ultimaTeens.topic}`);
    console.log(`Cuentas para entrar: ${path.relative(RAIZ, ARCHIVO_CREDENCIALES)}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
