/**
 * Herramientas externas de la página de recursos del docente (PED-09).
 *
 * Los límites de las versiones gratis (jugadores de Kahoot, actividades de
 * Wordwall, escenas de PlayPhrase, padlets activos…) se verificaron en el sitio
 * de cada herramienta el 27/09/2026. Cambian seguido: al tocar un texto que
 * afirme uno, volver a confirmarlo antes de publicarlo.
 *
 * Si cambia la cantidad de herramientas, cambia también «Nueve herramientas» en
 * el encabezado de `ResourcesView`.
 */

export type ToolGroupId = "jugar" | "escuchar" | "crear";

export type ToolId =
    | "kahoot"
    | "wordwall"
    | "quizlet"
    | "youglish"
    | "playphrase"
    | "lingoclip"
    | "canva"
    | "docs"
    | "padlet";

export type ToolChip = {
    text: string;
    /** Algo para revisar antes de mostrarlo en clase: se ve en ámbar, con un ojo. */
    caution?: boolean;
};

export type ToolGuide = {
    about: string;
    /** Cada paso arranca con una frase en negrita (`lead`) y sigue con `rest`. */
    steps: { lead: string; rest: string }[];
    goodToKnow: string[];
    idea: string;
};

export type Tool = {
    id: ToolId;
    group: ToolGroupId;
    name: string;
    domain: string;
    url: string;
    /** Va al lado del dominio en la guía: «tiene versión gratis» o «es gratis». */
    plan: string;
    description: string;
    chips: ToolChip[];
    /** Idea corta de la tarjeta; sigue a «Idea:», por eso arranca en minúscula. */
    idea: string;
    guide: ToolGuide;
};

export const TOOL_GROUPS: {
    id: ToolGroupId;
    title: string;
    /** Atajo de la barra de secciones en el celular. */
    shortTitle: string;
    description: string;
}[] = [
    {
        id: "jugar",
        title: "Repasar jugando",
        shortTitle: "Jugar",
        description: "Para que el vocabulario y la gramática vuelvan en forma de juego.",
    },
    {
        id: "escuchar",
        title: "Escuchar inglés real",
        shortTitle: "Escuchar",
        description: "Palabras y frases dichas por personas de verdad: en videos, películas y canciones.",
    },
    {
        id: "crear",
        title: "Crear y compartir",
        shortTitle: "Crear",
        description: "Material lindo para el aula, y espacios donde escriben y publican todos.",
    },
];

export const TOOLS: Tool[] = [
    {
        id: "kahoot",
        group: "jugar",
        name: "Kahoot",
        domain: "kahoot.com",
        url: "https://kahoot.com",
        plan: "tiene versión gratis",
        description: "Trivia en vivo: la pregunta va en la pantalla del aula y cada uno contesta desde un dispositivo.",
        chips: [{ text: "Alumnos sin cuenta" }, { text: "Gratis hasta 10 jugadores" }],
        idea: "arrancá con cinco preguntas de la clase anterior. En cinco minutos ves qué quedó.",
        guide: {
            about: "Una trivia en vivo. Vos proyectás la pregunta en la pantalla del aula y cada alumno contesta desde un celular, una tablet o una compu. Suma más puntos quien contesta bien y rápido, y al final aparece el podio.",
            steps: [
                { lead: "Creá tu cuenta gratis", rest: "en kahoot.com, como docente." },
                { lead: "Armá la trivia:", rest: "escribí cada pregunta con sus opciones y marcá la correcta." },
                { lead: "En clase, lanzala en vivo:", rest: "en la pantalla aparece un PIN, y los alumnos entran en kahoot.it con ese número y un apodo." },
            ],
            goodToKnow: [
                "Los alumnos no necesitan cuenta: entran con el PIN y un apodo.",
                "La versión gratis admite hasta 10 jugadores por partida. Si son más, jueguen en equipos, con un dispositivo por grupo.",
                "Gratis tenés preguntas de opción múltiple y de verdadero o falso.",
            ],
            idea: "Arrancá con cinco preguntas de la clase anterior. En cinco minutos ves qué quedó y qué conviene repasar.",
        },
    },
    {
        id: "wordwall",
        group: "jugar",
        name: "Wordwall",
        domain: "wordwall.net",
        url: "https://wordwall.net",
        plan: "tiene versión gratis",
        description: "Cargás las palabras una vez y salen varios juegos: ruleta, unir, anagrama, cuestionario, parejas.",
        chips: [{ text: "En clase o en casa" }, { text: "Se imprime" }],
        idea: "con los más chicos, unir palabra e imagen en la pantalla, pasando al frente de a uno.",
        guide: {
            about: "Cargás una lista de palabras una sola vez y Wordwall la convierte en juegos: ruleta, unir, anagrama, cuestionario y otros. Con un clic pasás de uno a otro, sin volver a cargar nada.",
            steps: [
                { lead: "Creá tu cuenta gratis", rest: "en wordwall.net. Podés entrar con tu cuenta de Google." },
                { lead: "Armá una actividad:", rest: "elegí un juego y escribí las palabras de la clase." },
                { lead: "Usala en el aula,", rest: "en la pantalla, o compartí el enlace para que jueguen en casa." },
            ],
            goodToKnow: [
                "Los alumnos juegan sin crear cuenta.",
                "La versión gratis deja crear 3 actividades propias, con 12 tipos de juego. Las que comparten otros docentes se juegan gratis.",
                "Cualquier actividad se imprime como ficha.",
            ],
            idea: "Una ruleta de preguntas para cerrar: cada alumno la gira y contesta en inglés. «What's your favourite animal?», «What did you do yesterday?».",
        },
    },
    {
        id: "quizlet",
        group: "jugar",
        name: "Quizlet",
        domain: "quizlet.com",
        url: "https://quizlet.com",
        plan: "tiene versión gratis",
        description: "Mazos de tarjetas, con la palabra de un lado y el significado del otro, y juegos para memorizarlas.",
        chips: [{ text: "En casa" }, { text: "Se arma pegando una lista" }],
        idea: "el vocabulario de la unidad en un mazo, para repasar la semana de la prueba.",
        guide: {
            about: "Mazos de tarjetas: la palabra de un lado y el significado del otro. Los alumnos las dan vuelta para repasar, y tienen juegos para memorizarlas.",
            steps: [
                { lead: "Creá tu cuenta gratis", rest: "en quizlet.com." },
                { lead: "Armá un mazo:", rest: "escribí cada palabra con su significado, o pegá la lista entera de una vez." },
                { lead: "Compartí el enlace", rest: "del mazo para que repasen en casa." },
            ],
            goodToKnow: [
                "Pegar la lista ahorra tiempo: un renglón por palabra, con su significado al lado.",
                "La versión gratis tiene publicidad, y algunos modos de estudio tienen un tope de uso.",
                "Rinde más para repasar en casa que para jugar en el aula.",
            ],
            idea: "El vocabulario de la unidad en un mazo, para que lo repasen la semana de la prueba.",
        },
    },
    {
        id: "youglish",
        group: "escuchar",
        name: "YouGlish",
        domain: "youglish.com",
        url: "https://youglish.com",
        plan: "es gratis",
        description: "Escribís una palabra y aparecen videos reales donde alguien la dice, con el subtítulo resaltado.",
        chips: [{ text: "Sin cuenta" }, { text: "Elegís el acento" }],
        idea: "¿dudan cómo se dice «thought»? Escúchenla en boca de cinco personas distintas.",
        guide: {
            about: "Un buscador de pronunciación. Escribís una palabra o una frase y aparecen videos reales de YouTube donde alguien la dice, con el subtítulo y la palabra resaltada.",
            steps: [
                { lead: "Entrá a youglish.com", rest: "y elegí inglés. No hace falta cuenta." },
                { lead: "Escribí la palabra", rest: "y buscala." },
                { lead: "Pasá de un video al siguiente:", rest: "la misma palabra en voces distintas. Podés elegir el acento: Estados Unidos, Reino Unido, Australia y otros." },
            ],
            goodToKnow: [
                "Es gratis y se usa sin registrarse.",
                "Podés bajar la velocidad del video para escuchar mejor.",
                "Los videos vienen de YouTube y no están pensados para chicos: miralos antes de proyectar.",
            ],
            idea: "¿Dudan cómo se dice «thought»? Escúchenla en boca de cinco personas distintas y repítanla después de cada una.",
        },
    },
    {
        id: "playphrase",
        group: "escuchar",
        name: "PlayPhrase",
        domain: "playphrase.me",
        url: "https://www.playphrase.me",
        plan: "tiene versión gratis",
        description: "Escribís una frase y se encadenan las escenas de películas y series donde alguien la dice.",
        chips: [{ text: "Para proyectar" }, { text: "Revisá las escenas antes", caution: true }],
        idea: "«How are you doing?» en cinco escenas: la misma frase con entonaciones distintas.",
        guide: {
            about: "Escribís una frase en inglés y se reproducen, una tras otra, las escenas de películas y series donde alguien la dice, con el subtítulo.",
            steps: [
                { lead: "Entrá a playphrase.me.", rest: "Para buscar no hace falta cuenta." },
                { lead: "Escribí la frase", rest: "y buscala." },
                { lead: "Mirá las escenas", rest: "en la pantalla del aula y pasá a la siguiente cuando quieras." },
            ],
            goodToKnow: [
                "La versión gratis muestra 5 escenas por búsqueda; para verlas todas hay un plan pago.",
                "Son escenas de películas y series para adultos: puede haber malas palabras o violencia. Revisalas antes de proyectar, y con chicos, mejor no.",
                "Funciona mejor con frases hechas que con palabras sueltas.",
            ],
            idea: "«How are you doing?» en cinco escenas: la misma frase con entonaciones distintas. Después la dicen ellos.",
        },
    },
    {
        id: "lingoclip",
        group: "escuchar",
        name: "LingoClip",
        domain: "lingoclip.com",
        url: "https://lingoclip.com",
        plan: "tiene versión gratis",
        description: "Elegís una canción y la completan mientras suena: faltan más o menos palabras según el nivel.",
        chips: [{ text: "En clase o en casa" }, { text: "Revisá la letra antes", caution: true }],
        idea: "cerrá la semana con una canción que les guste, en el nivel más fácil.",
        guide: {
            about: "Elegís una canción y se reproduce con la letra en pantalla. Faltan palabras, y los alumnos las eligen o las escriben mientras suena. Cuanto más alto el nivel, más huecos.",
            steps: [
                { lead: "Entrá a lingoclip.com", rest: "y buscá la canción por el nombre o el artista." },
                { lead: "Elegí el nivel y el modo:", rest: "elegir la palabra entre opciones es lo más fácil; escribirla, lo más difícil." },
                { lead: "Dale play", rest: "y completen los huecos mientras suena." },
            ],
            goodToKnow: [
                "Para jugar no hace falta cuenta; con cuenta se guarda el progreso.",
                "La versión gratis tiene un tope de canciones por día.",
                "Revisá la letra antes: muchas canciones populares no son para chicos.",
            ],
            idea: "Cerrá la semana con una canción que elijan ellos, en el nivel más fácil y con opciones.",
        },
    },
    {
        id: "canva",
        group: "crear",
        name: "Canva",
        domain: "canva.com",
        url: "https://www.canva.com",
        plan: "tiene versión gratis",
        description: "Plantillas para armar flashcards, fichas y carteles con buen diseño, aunque nunca hayas diseñado.",
        chips: [{ text: "La usás vos" }, { text: "Para imprimir o proyectar" }],
        idea: "las flashcards de la unidad con imágenes, para jugar al memotest en el aula.",
        guide: {
            about: "Un editor de diseño con plantillas listas: flashcards, fichas, carteles y presentaciones. Cambiás los textos y las imágenes, y queda prolijo aunque nunca hayas diseñado.",
            steps: [
                { lead: "Creá tu cuenta gratis", rest: "en canva.com." },
                { lead: "Buscá una plantilla", rest: "—por ejemplo, «flashcards»— y cambiá los textos y las imágenes." },
                { lead: "Descargala en PDF", rest: "para imprimir, o presentala desde Canva en la pantalla del aula." },
            ],
            goodToKnow: [
                "La usás vos para preparar material: los alumnos no necesitan entrar.",
                "Algunas plantillas e imágenes son pagas: vienen marcadas con una corona.",
                "Lo que armás se duplica y se adapta para la unidad siguiente.",
            ],
            idea: "Las flashcards de la unidad con imágenes, impresas de a pares, para jugar al memotest en el aula.",
        },
    },
    {
        id: "docs",
        group: "crear",
        name: "Google Docs",
        domain: "docs.google.com",
        url: "https://docs.google.com",
        plan: "es gratis",
        description: "Un documento que escriben todos a la vez: ves en vivo quién escribe qué y corregís con comentarios.",
        chips: [{ text: "En vivo" }, { text: "Sin cuenta, por enlace" }],
        idea: "un cuento entre todos: cada uno suma una oración con una palabra nueva de la clase.",
        guide: {
            about: "Un documento que escriben todos a la vez. Ves en vivo quién escribe qué, y corregís con comentarios o sugerencias sin borrar lo que escribieron.",
            steps: [
                { lead: "Entrá a docs.google.com", rest: "con tu cuenta de Google y creá un documento en blanco." },
                { lead: "Tocá «Compartir»", rest: "y dejá que cualquier persona con el enlace pueda editar." },
                { lead: "Pasales el enlace:", rest: "escriben todos a la vez, desde la compu o el celular." },
            ],
            goodToKnow: [
                "Si entran sin cuenta, aparecen como animales anónimos: pediles que firmen lo que escriben.",
                "Con el modo sugerencia corregís sin borrar lo que escribieron.",
                "El historial de versiones guarda todo, por si alguien borra algo sin querer.",
            ],
            idea: "Un cuento entre todos: cada uno suma una oración con una palabra nueva de la clase.",
        },
    },
    {
        id: "padlet",
        group: "crear",
        name: "Padlet",
        domain: "padlet.com",
        url: "https://padlet.com",
        plan: "tiene versión gratis",
        description: "Un muro en línea donde cada alumno pega su aporte: un texto, una foto, un audio o un video.",
        chips: [{ text: "Publican sin cuenta" }, { text: "Aprobás cada aporte" }],
        idea: "«My weekend»: cada uno sube una foto y la describe en dos oraciones.",
        guide: {
            about: "Un muro en línea. Vos escribís la consigna arriba y cada alumno pega su aporte: un texto, una foto, un audio o un video.",
            steps: [
                { lead: "Creá tu cuenta gratis", rest: "en padlet.com." },
                { lead: "Armá un padlet", rest: "—el formato muro es el más simple— y escribí la consigna." },
                { lead: "Compartí el enlace:", rest: "publican sin cuenta, desde el celular o la compu." },
            ],
            goodToKnow: [
                "Podés pedir que cada publicación espere tu aprobación antes de verse.",
                "Sin cuenta, publican como anónimos: pediles que pongan su nombre.",
                "La versión gratis deja tener 3 padlets activos a la vez.",
            ],
            idea: "«My weekend»: cada uno sube una foto y la describe en dos oraciones. Después comentan las de sus compañeros.",
        },
    },
];
