# Referencias

Productos, apps y material que miramos para sacar ideas para el campus: qué es cada uno, qué nos
gustó, dónde nos quedamos cortos o les ganamos, y qué ficha del backlog salió de ahí. Arriba va lo
que falta explorar.

Una idea que se decide pasa a ser una ficha en [`BACKLOG-TECNICO.md`](BACKLOG-TECNICO.md) y acá
queda el enlace. Las que no se decidieron quedan anotadas como **sin decidir**, para no
proponerlas dos veces.

Ninguna de estas referencias se nombra en textos públicos (landing, redes, correos).

## Por explorar

Nada pendiente por ahora.

## Exploradas

| Referencia | Qué es | Fecha | Qué salió |
|---|---|---|---|
| [Mercado Pago para plataformas](#mercado-pago-para-plataformas) | Cómo cobra una plataforma en nombre de cada instituto | 21/11/2026 | [FEAT-34](BACKLOG-TECNICO.md#feat-34) |
| [Read Along](#read-along) | Lectura en voz alta para chicos, de Google | 11/11/2026 | Corrección de a una palabra para el Speaking y [PED-14](BACKLOG-TECNICO.md#ped-14) |
| [Acadeu](#acadeu-términos-y-condiciones) | Gestión escolar de Educaria, argentina | 10/11/2026 | Borrador de términos y privacidad |
| [Duolingo](#duolingo) | App de idiomas con lecciones cortas | 03/11/2026 | Ideas sin decidir, para rediseñar la práctica |
| [Moodle](#moodle) | Aula virtual de código abierto | 25/10/2026 | Ideas sin decidir |
| [Langboost](#langboost) | Arma la clase con IA para el docente | 03/10/2026 | [PED-09](BACKLOG-TECNICO.md#ped-09) |
| [ClassesUp](#classesup) | Gestión de academias, argentina | 06/10 y 21/11/2026 | Ideas sin decidir |
| [Material de Cambridge](#material-de-cambridge-capacitación-de-patricia) | Capacitación de IA de Patricia | 17/10/2026 | Write & Improve en recursos, [PED-13](BACKLOG-TECNICO.md#ped-13) |
| [Trinity Phonics](#trinity-phonics) | Práctica de pronunciación con Azure | 19/10/2026 | Prueba para [PED-02](BACKLOG-TECNICO.md#ped-02) y [PED-03](BACKLOG-TECNICO.md#ped-03) |
| [Quinttos](#quinttos) | Gestión de institutos, argentina | 19/10/2026 | Contexto comercial |
| [Mondly](#mondly-cem-english) | App de práctica de Pearson | 29/09/2026 | Vara para los precios |
| [Gestión comparada por precio](#gestión-comparada-por-precio) | Cinco sistemas de gestión | 28/09/2026 | Tabla de precios |

### Mercado Pago para plataformas

La documentación para desarrolladores de Mercado Pago (OAuth y «Split de Pagos 1:1»), leída el
21/11/2026 para ver cómo podría cada instituto conectar su cuenta al campus y cobrar ahí las cuotas.
Solo se leyó la documentación: no se creó ninguna aplicación ni se conectó ninguna cuenta.

- **Cómo se conecta un instituto (OAuth):**
  - **La autorización:** el campus lo manda a una página de Mercado Pago
    (`auth.mercadopago.com.ar/authorization`), donde entra con su cuenta y autoriza. Vuelve al campus
    con un código que dura 10 minutos.
  - **Las credenciales:** con ese código, el servidor del campus pide las del instituto. Llegan un
    `access_token` para cobrar en su nombre, un `refresh_token` para renovarlo y su `user_id`, que es
    el que figura como cobrador.
  - **El vencimiento:** las credenciales duran 6 meses. Hay que renovarlas antes con el
    `refresh_token`; si no, el instituto tiene que volver a conectar.
  - **La seguridad:** se recomienda un `state` distinto en cada intento y PKCE, y hacer todo del lado
    del servidor.
  - **Las pruebas:** hay credenciales de prueba (`test_token`) y cuentas de prueba, para probar sin
    plata real.
- **Cómo se cobra:** con Checkout Pro, donde la familia paga en una página de Mercado Pago, o con
  Checkout API, donde paga dentro del campus. Las dos usan el `access_token` de cada instituto, y la
  plata va a su cuenta.
- **Las comisiones:** Mercado Pago le descuenta la suya al instituto. El campus puede sumar una propia
  (`marketplace_fee` o `application_fee`) o no cobrar nada, como ClassesUp.
- **Los reembolsos:** se descuentan de las dos partes en proporción. Si el instituto no tiene saldo,
  la plataforma no puede devolver el total.
- **Lo que nos pide a nosotros:**
  - una cuenta de vendedor de Mercado Pago con la identidad verificada (nivel KYC 6);
  - una aplicación creada en «Tus integraciones», con el modelo Marketplace y la dirección de vuelta
    configurada.

  Origen MdP es un nombre comercial sin figura jurídica, así que hay que decidir a nombre de quién va
  esa cuenta.
- **Para confirmar:**
  - La guía dice que el modelo 1:1 «sólo permite realizar pagos con dinero en cuenta entre cuentas
    de Mercado Pago». Hay que ver si eso deja afuera la tarjeta o el efectivo, que ClassesUp sí
    promete.
  - Si sin comisión propia hace falta el split, o alcanza con OAuth y un Checkout Pro común.
  - Los avisos de pago (webhooks), para que la cuota se marque sola.
- **Cómo lo resuelve ClassesUp:** en [su sección](#classesup).
- **Lo que hoy tiene el campus:** el cobro se registra en el mostrador, y «MercadoPago» es uno de los
  medios que se anotan (`RegisterFeeForm`).
- **Qué salió (21/11/2026):** la ficha [FEAT-34](BACKLOG-TECNICO.md#feat-34), para que cada instituto
  conecte su Mercado Pago y la familia pague la cuota desde el campus.

### Read Along

[readalong.google.com](https://readalong.google.com) · relevada el 11/11/2026 en la web, con la cuenta
de Google de Origen MdP (se aceptó el aviso para padres y se creó un perfil), para ver la lectura en
voz alta pensando en el speaking y en los chicos de Children. Sin micrófono, así que la corrección de
la lectura queda sin ver, como en Duolingo. Lo que dice «según Google» sale de su blog y su centro de
ayuda, no de la pantalla.

- **Qué es:** app gratis de Google para chicos que aprenden a leer, desde los 5 años, sin publicidad
  ni compras. Cuentos ilustrados por nivel; el chico lee en voz alta y una ayudante, Diya, lo
  escucha y le da una devolución que corrige y alienta. Según Google, la voz se reconoce en el
  navegador y no sale a sus servidores; al abrir baja un módulo WebAssembly de casi 6 MB, que sería
  el reconocedor. La versión publicada es del 26/10/2026: sigue activa.
- **Cómo es la entrada:** se elige el idioma («Español + English»), tres pantallas de presentación y
  un aviso para padres y docentes con un solo botón, «Entendido». El perfil se crea solo, con un
  animal y sin nombre: «Presiona tu perfil».
- **Cómo es la lectura:**
  - Pantalla limpia: barra de avance arriba, el dibujo a la izquierda, el texto muy grande a la
    derecha, flechas a los costados y un solo botón de micrófono abajo al medio, con un halo que
    invita a tocarlo.
  - La palabra que toca leer va en azul.
  - Tocar una palabra la marca en azul; según Google, Diya la lee, y con otro toque la deletrea.
    Tocar una oración la lee entera. Con dos idiomas, traduce al castellano cada oración leída.
  - La tapa trae el título en inglés y en castellano.
  - Se puede pasar de página sin leer; terminado así, vuelve a la biblioteca sin cierre ni estrellas.
  - En una ventana chica, la ayudante tapa el final del texto.
- **Biblioteca:** «Para ti», colecciones por tema y cuentos de canales de dibujos, cada tapa con su
  nivel en una esquina. Una pestaña de premios con regalos que se desbloquean con estrellas.
- **Según Google, solo en Android:** grupos de lectura donde el docente ve la actividad de sus
  alumnos, y juegos (armar palabras con letras mezcladas, leer todas las palabras posibles en 20
  segundos, reventar globos con letras de cierto sonido). En la web, «Códigos de socio» deja que la
  familia comparta los datos de uso con una organización. Recomienda el nivel según cómo lee cada
  chico.
- **Dónde les ganamos:** los cuentos son los suyos; la práctica del campus sale de lo que se vio en
  clase. El chico entra con su DNI, sin que la familia arme una cuenta.
- **Dónde nos quedamos cortos:** el speaking evalúa la frase entera y falla con toda frase que no sea
  idéntica; Read Along va de a una palabra, deja escuchar la que no sale y no castiga saltear. Y no
  tenemos práctica pensada para quien todavía no lee solo.
- **Qué salió (11/11/2026):**
  - Para el Speaking, pedido al rediseño de la práctica (`feat/rediseno-practica`): comparar lo que
    reconoce el navegador contra el texto, de a una palabra y en el campus mismo; marcar la palabra
    que toca leer; tocar una palabra para escucharla sin restar; regrabar y saltear. Hoy el campus
    resuelve solo la frase idéntica y cualquier otra va a Gemini (`evaluatePronunciation`), que es
    donde salen el JSON cortado y los 503.
  - Un cuento corto de la clase para leer en voz alta, con el mismo motor:
    [PED-14](BACKLOG-TECNICO.md#ped-14).
- **Ideas sin decidir:**
  - Para Children: texto grande, un dibujo y un solo botón.
  - La traducción de cada oración al castellano, para los que recién empiezan.
- **No sirve para nosotros:** estrellas, regalos para desbloquear e insignias: a Patricia la
  gamificación no la entusiasma. El perfil por animal tampoco: el chico entra con su DNI.
- **Falta ver:** la lectura con micrófono, sobre todo qué hace Diya cuando el chico se equivoca o se
  traba. Queda para probarla con alguien que lea en voz alta.

### Acadeu (términos y condiciones)

Los términos y condiciones de Acadeu, la plataforma de gestión escolar de Educaria en Argentina
S.A. (versión 2.1 del 19/05/2023) · relevados el 10/11/2026 con capturas de las secciones 1 a 7,
10 y 11, para sumar términos y privacidad al campus, que no tenía ninguno de los dos. Faltan la 8
(«Operatividad de la Plataforma») y la 9, y la 11 está cortada.

- **Qué nos sirvió:**
  - El instituto acepta por su gente y consigue la autorización de las familias para los menores.
  - La plataforma procesa los datos por cuenta del instituto, y los pedidos de acceso van al
    instituto.
  - La versión y la fecha arriba del texto.
  - Los avisos por correo y dentro de la plataforma valen como comunicación.
  - Los requisitos técnicos. En el campus pesan por el speaking, que necesita micrófono y un
    navegador que reconozca la voz.
  - La prohibición de extraer el contenido en forma automática.
- **Qué no tomamos:** que la plataforma no trata datos personales (en el campus sería falso), que
  toda acción hecha con un usuario se le imputa a su dueño (no sirve para un chico que entra con su
  DNI), la aceptación por el solo hecho de entrar, cambiar los términos sin avisar, quedarse con una
  licencia perpetua sobre lo que el instituto personaliza y el tono.
- **Para el abogado:** el instituto como responsable solidario de los daños que causen sus usuarios.
- **Qué salió:** un borrador propio, sin nada copiado, que describe lo que hace el campus:
  [Términos y privacidad de Lingua Campus](https://claude.ai/artifact/1mozvoUUg1qpPh7qv7QENC), en
  Claude Docs. Lo revisa un abogado antes de publicarse.

### Duolingo

[duolingo.com](https://www.duolingo.com) · relevada el 03/11/2026 sin cuenta, en computadora y en
tamaño de celular, para mejorar la estética y la experiencia de las prácticas que ya tenemos: la
primera lección de inglés para hispanohablantes y parte de la práctica de sonidos. No llegamos a
ejercicios con micrófono, así que su corrección oral queda sin ver.

- **Cómo es la lección:**
  - Pantalla completa con la barra de avance, salir y una sola consigna. Nada más alrededor.
  - Abajo hay un solo botón, que queda en el mismo lugar para comprobar y para seguir. En el
    celular, al alcance del pulgar.
  - La respuesta elegida queda en azul hasta comprobar; recién ahí aparece el verde o el rojo.
  - La corrección sale en una banda abajo, con la respuesta correcta en una línea. Un aviso que no
    es error («Ejercicios de audio deshabilitados») usa un tercer color.
  - Lo errado vuelve al final, con el aviso «¡Repasemos el ejercicio incorrecto!» y marcado
    «Error anterior». En la práctica de sonidos, el par errado vuelve con las opciones invertidas.
  - Al terminar: un festejo, dos datos (puntos y 94 % de aciertos), seguir o repasar la lección.
- **Ejercicios vistos:** elegir entre tarjetas con imagen, armar la traducción tocando palabras,
  elegir entre opciones, completar un diálogo con opciones y escuchar y tocar las palabras.
- **Pronunciación:** pares mínimos («¿Qué escuchas?», dock o deck), «¿la misma palabra o dos
  distintas?» y una tabla de sonidos con el símbolo IPA, una palabra de ejemplo y el avance de cada
  uno.
- **Audio:** botón grande, otro aparte para escuchar lento y «No puedo escuchar ahora», que apaga
  los ejercicios de audio por 15 minutos sin restar.
- **Dónde les ganamos:** el contenido es su curso; la práctica del campus sale de lo que se vio en
  clase.
- **Dónde nos quedamos cortos:** la experiencia. Según el código, en la práctica hay varias cosas a
  la vez en pantalla, los botones cambian de lugar y lo errado no vuelve.
- **Ideas sin decidir** (también en el registro de prácticas):
  - Lo que salió mal vuelve al final de la práctica, para intentarlo de nuevo.
  - Un botón aparte para escuchar el audio más lento.
  - «No puedo hablar ahora» y «No puedo escuchar ahora»: seguir sin micrófono o sin audio, sin
    penalidad.
  - Un diálogo para completar con opciones, para quien todavía no escribe solo.
- **No sirve para nosotros:** rachas, vidas, puntos, ligas y la serie de pantallas de logros al
  terminar: a Patricia la gamificación no la entusiasma. Tampoco se toman su personaje ni su aspecto.

### Moodle

Sitio de demostración (school.moodledemo.net, Moodle 5.3) · relevado el 25/10/2026 con la cuenta de
docente, sobre el curso «Moodle Quiz example», que trae un cuestionario con todos los tipos de
pregunta estándar, y el curso «Celebrating Cultures», recorrido también con el rol de alumno. El código está en [github.com/moodle/moodle](https://github.com/moodle/moodle)
(los tipos de pregunta, en `question/type/`); no hizo falta leerlo ni instalarlo en local. Está en
PHP y con licencia GPL: se miran las ideas, no se copia código.

- **Qué es:** la plataforma de aula virtual más usada del mundo, gratuita, desde 2002. Solo lo
  pedagógico: lo único con plata es cobrar la inscripción a un curso, sin cuotas, caja ni deudores.
  Por eso se la combina con un sistema de gestión (Quinttos la conecta como aula virtual).
- **Cuestionarios que se corrigen solos.** Unos veinte tipos de pregunta. Los que sirven para
  idiomas: opción múltiple (una o varias), verdadero o falso, emparejar, respuesta corta (con
  comodines y varias respuestas aceptadas), **completar huecos** de tres maneras (escribiendo,
  eligiendo de una lista o arrastrando palabras al texto), **ordenar** (el ejemplo es un diálogo
  desordenado), arrastrar sobre una imagen y redacción, que corrige el docente a mano.
- **Cómo se comporta la pregunta.** Se elige por cuestionario: devolución al final, inmediata, o
  **interactiva con varios intentos**: la respuesta mal devuelve una pista escrita por el docente y
  deja volver a probar, con menos puntaje en cada intento.
- **Configuración del cuestionario:** apertura, vencimiento (nuevo en 5.3) y cierre, límite de
  tiempo, cantidad de intentos y qué intento cuenta, navegación libre o en orden, mezclar las
  opciones, excepciones por alumno o grupo, demora entre intentos, y una matriz de qué ve el alumno
  al revisar (su respuesta, si estaba bien, el puntaje, la respuesta correcta) y cuándo. Devolución
  general según la nota («repasá la unidad 3» por debajo de tanto).
- **Banco de preguntas.** Separado del cuestionario: categorías, etiquetas, versiones, estado
  borrador o listo, dónde se usó cada pregunta y **estadística por pregunta** (cuántos la aciertan y
  si separa a los que saben de los que no). Se importa desde texto (GIFT, Aiken, Moodle XML). Una
  «pregunta al azar» toma de una categoría o etiqueta, así que cada alumno recibe otro examen.
- **Lo que ve el alumno al entregar:** nota, puntaje parcial por hueco («acertaste 3»), el mensaje
  que escribió el docente y la respuesta correcta, según lo que el docente habilitó. En un celular
  entra, pero apretado y con desplazamiento horizontal.
- **Estadística del cuestionario:** promedio, mediana y, por pregunta, cuánto pesó y cuánto
  discrimina. Se descarga en planilla.
- **Tareas** (el alumno entrega texto o archivos): apertura, vencimiento, fecha límite y
  «recordarme corregir»; límite de palabras; varios intentos hasta aprobar. El docente corrige con
  nota directa, **rúbrica** (criterios por niveles con puntos: se cliquea el nivel y suma; la del
  demo hasta tiene un criterio sobre el uso de IA) o guía de corrección con comentarios por
  criterio. Anota sobre el PDF, puede corregir en anónimo, tiene estados (sin corregir, en
  corrección, lista para publicar, publicada) y varios correctores.
- **Taller:** cada alumno entrega y corrige a compañeros con un formulario; recibe una nota por su
  trabajo y otra por lo bien que corrigió. Va por cinco fases que abre el docente.
- **Lección:** páginas de contenido intercaladas con preguntas; según la respuesta, el alumno salta
  a otra página (repaso o avance).
- **Calificaciones:** la nota de cada actividad pasa sola a la libreta del curso, con categorías,
  ponderaciones, escalas propias (el demo tiene «Deficiente/Regular/Excelente»), letras y, desde
  5.3, resultados de aprendizaje por curso. Informe por alumno con el peso de cada actividad.
- **Seguimiento:** cada actividad puede marcarse como completada (a mano o por condición: vio,
  entregó, aprobó), y una actividad puede quedar **bloqueada hasta cumplir otra** (fecha, nota,
  grupo). Informes de finalización, participación y registros. Insignias por criterios.
- **Otras actividades:** glosario, wiki, base de datos, foro, encuesta, elección y H5P (tarjetas,
  arrastrar palabras, presentaciones interactivas). La IA existe pero viene apagada y es genérica
  (Claude es proveedor desde 5.3).
- **Dónde les ganamos:**
  - La práctica sale de la clase que dio el docente; en Moodle todo se escribe a mano.
  - Pronunciación, listening y conversación con IA: Moodle no corrige lo oral.
  - Está pensado para universidades: cada alumno necesita cuenta con correo, y la pantalla es
    densa para un chico de 8 años.
  - Gestión, familias, boletines firmados: no tiene nada parecido.
- **Dónde nos quedamos cortos:** la práctica escrita. De lo escrito, el campus corrige solo las
  preguntas del listening (verdadero o falso); no hay ejercicios de gramática o vocabulario que se corrijan solos, ni un banco que se
  reutilice, ni exámenes con tiempo e intentos, ni estadística por pregunta. Las notas por clase y
  los boletines se cargan a mano.
- **Ideas sin decidir:**
  - Práctica escrita generada desde la clase, corregida sola: completar huecos, ordenar un diálogo
    y emparejar (la primera recomendada; es el mismo circuito de [PED-01](BACKLOG-TECNICO.md#ped-01)).
  - Pista del docente y nuevo intento ante la respuesta mal, en lugar de mostrar la correcta.
  - Estadística por pregunta para el docente: qué ítem falla el grupo (se suma a
    [PED-02](BACKLOG-TECNICO.md#ped-02)).
  - Banco de preguntas por nivel, reutilizable entre cursos, con examen al azar.
  - Examen con apertura, cierre, tiempo e intentos, con la nota pasando sola.
  - Importar preguntas desde texto (el formato Aiken es una lista simple).
  - Rúbrica para corregir la escritura y lo oral, con criterios y niveles que define el instituto.
  - Un camino que muestra qué hizo y qué le falta, con todo abierto (desbloquear de a pasos
    frena al que se traba en una parte), y en qué mejoró, para el alumno y el docente. Sin
    premios por constancia ni medallas: a Patricia la gamificación no la entusiasma.
  - La estadística por pregunta abarca toda la práctica (listening, speaking y escritos), y
    pide guardar cada respuesta: hoy `PracticeSession` guarda solo los totales.
  - La rúbrica usa las categorías y escalas del boletín de cada curso (`ReportCategory`) y no
    calcula nota: en prod, Children 1 a 3 tienen escala conceptual y de Children 4 en adelante
    van de 1 a 10. Lo marcado queda en la clase, a mano para completar el boletín.
  - **Decidido el 25/10/2026 (falta el visto bueno de Patricia):** la rúbrica no va suelta; es la
    parte del repaso integrador que el campus no puede corregir, el oral y el writing, tomada por
    el docente en clase. Una por curso y período, que se completa de a poco (hoy 4 alumnos, la
    semana que viene otros 4) y muestra cuántos faltan. El campus todavía no recibe trabajos de
    los alumnos; recibirlos sería otra propuesta, cerca de [PED-13](BACKLOG-TECNICO.md#ped-13).
    El flujo: se crea el repaso del período, se toma en clase, se ve el avance y se usa en el
    boletín. La rúbrica no se arma: sale de la plantilla de boletín del curso. En prod, al
    25/10/2026, de 30 cursos activos 26 tienen plantilla, 4 ninguna y 1 tiene dos. Abierto, y
    preguntado a Patricia: quién crea el repaso, cada docente o la dirección para todos.
  - **Decidido el 25/10/2026 (falta el visto bueno de Patricia):** la evaluación pasa a ser un
    «repaso integrador», mensual o bimestral, con los temas de las clases del período. Es un
    complemento del examen que toman y califican las docentes, nunca su reemplazo, y no pone
    nota.
- **No sirve para nosotros:** el taller entre pares (para chicos y grupos chicos es más carga que
  ayuda) y las preguntas de cálculo.
- **Ventana al cliente:** las propuestas se le muestran a Patricia en un artifact, una por tarjeta,
  para que dé el visto bueno antes de construir. Sin nombrar a Moodle ni a las otras referencias.
  Son ocho: seis de acá y dos de [Trinity Phonics](#trinity-phonics).

### Langboost

[langboost.app](https://langboost.app) · relevada el 03/10/2026 con una cuenta gratis (una clase por
mes; la de octubre ya se usó).

- **Qué hace:** con tema, nivel, duración y foco, sugiere vocabulario y objetivos, y arma la clase
  en cuatro momentos (Inicio, Actividad principal, Cierre, Tarea), con tres ideas por momento para
  que el docente elija una. Cada idea trae herramienta, minutos y contenido listo para copiar.
  Exporta a Word.
- **Lo que nos gustó:** los momentos con opciones («vos decidís»); que una de las ideas sea siempre
  el material de siempre (el libro); el contenido listo para pegar.
- **Dónde les ganamos:** está pensada para un alumno particular, no para grupos ni chicos sin
  cuenta. El nivel y la duración se cargan a mano (el campus ya los tiene en el curso y el horario).
  El botón «Abrir» lleva a la portada de la herramienta, sin el contenido puesto. En el plan gratis
  la clase no se guarda.
- **Qué salió:** el armado de la clase de [PED-09](BACKLOG-TECNICO.md#ped-09), con la decisión de
  que lo que arma el docente queda guardado en la clase.

### ClassesUp

[classesup.com](https://classesup.com) · su Instagram (@classes.up), relevado el 06/10/2026, y el
producto por dentro el 21/11/2026. Para eso, el usuario abrió una cuenta gratis con su cuenta
personal de Google y le puso a la academia un nombre genérico. La cuenta nueva trae datos de ejemplo
(un curso, una comisión, 15 alumnos y una docente), así que se recorrió sin cargar nada.

- **Qué es:** gestión de academias, generalista, aunque sus ejemplos son de inglés. Tiene:
  - cursos en vivo y asincrónicos;
  - cobros: Mercado Pago, transferencia y pagos que informa el alumno y la academia aprueba (por
    dentro aparece PayPal; Stripe, que anunciaban en Instagram, no);
  - asistencia, evaluaciones y chat;
  - certificados con la marca de la academia;
  - reportes;
  - dos asistentes de IA, uno de los cuales marca riesgo de abandono.

  Gratis hasta 25 alumnos activos, sin tarjeta.
- **Su contenido:** tres publicaciones por día con muy poca respuesta; las de tono de anuncio
  rendían más. Para @somoslinguacampus sirve el formato de consejo útil para el director, no el
  volumen.
- **Por dentro (21/11/2026):**
  - **El menú:** Inicio, Foro, Cursos y Comisiones, Lecciones, Cobros y su configuración, Usuarios,
    Alumnos, Docentes, Cuestionarios, Certificados y Evaluaciones. No hay familias ni tutores, y el
    alumno se registra con su correo.
  - **El inicio:** lo que falta para dejar la academia lista, accesos rápidos, el calendario de la
    semana y las comisiones en curso con su avance. Abajo, reportes:
    - alumnos nuevos;
    - ingresos por día;
    - los alumnos más comprometidos por tiempo de visualización;
    - quién sube o baja en las últimas ocho semanas.
  - **Datos de ejemplo:** todo lo de prueba lleva «(ejemplo)» en el nombre, y un solo botón lo borra
    junto para empezar de cero.
- **Cobros por dentro:**
  - **El precio va en cada curso:**
    - gratis o pago;
    - pago único o en cuotas mensuales;
    - cuándo le llega el cobro al alumno: al inscribirlo, un día fijo del mes o a mano.

    Antes de guardar muestra el plan que se va a generar, cuota por cuota y con su vencimiento. Al
    guardar emite las cuotas a los inscriptos; los que ya tenían cuotas conservan su precio.
  - **Monedas:** pesos, dólares o las dos por curso.
  - **Medios del alumno:**
    - transferencia: el alumno ve los datos de la cuenta al elegirla, y puede haber una en dólares;
    - Mercado Pago y PayPal, que la academia conecta y que marcan la cuota sola al pagar;
    - efectivo u otros, que se registran a mano.

    No cobran comisión: la plata va directo a la academia.
  - **Pagos:**
    - arriba, lo cobrado, lo que falta cobrar y lo vencido;
    - pestañas Todos, Por revisar, Vencidos, Por vencer, Cobrados y Dadas de baja;
    - un botón para exportar.
  - **Cobro suelto:** un cargo fuera del plan de cuotas, con importe y vencimiento. Trae conceptos
    sugeridos: certificado impreso y envío, material complementario, examen recuperatorio y recargo
    por pago fuera de término.
  - **El recibo:** sale con el logo de la academia.
- **Mercado Pago:** el botón «Conectar con Mercado Pago» lleva a su propio `/mercadopago/conectar` y
  vuelve con un aviso (conectada, cancelada o error). Ya conectada, la cuenta muestra el ID de
  vendedor y se puede desconectar. Al pagar, la cuota se marca sola y queda el número de operación
  para conciliar. Se puede dejar en modo de prueba. PayPal, en cambio, pide pegar el Client ID y el
  Secret. Cómo funciona del lado de Mercado Pago:
  [Mercado Pago para plataformas](#mercado-pago-para-plataformas).
- **Asistencia:** por fecha, cada alumno queda Presente, Ausente o Justificado. Tiene «Marcar todos
  presentes», el historial de cada uno y un reporte para bajar.
- **Certificados:**
  - **El editor:** A4 horizontal, con datos que se completan solos (alumno, curso, fecha e
    instructor), texto e imágenes libres, logo, color, fondo e íconos de insignia, medalla o trofeo.
    Exporta a PDF.
  - **El envío:** cada certificado se asigna a un curso. En la comisión se manda a cada alumno o a
    todos juntos, y queda pendiente o enviado.
  - **Nosotros:** no tenemos certificados. Hoy la familia los pide por mensaje, porque
    «Certificado» es uno de los temas de administración.
- **El asistente de IA del alumno:**
  - **Qué muestra:** en la ficha y solo para el equipo docente, un resumen, el estado, un índice de
    compromiso de 0 a 100, el riesgo y un perfil en seis ejes. También acciones recomendadas, que
    después sigue para ver si funcionaron, y hallazgos.
  - **Lo bueno:** avisa cuando no le alcanzan los datos («riesgo no evaluable aún»).
  - **Se contradijo con los datos de ejemplo:** en la misma ficha dice «se sumó hoy, todavía sin
    ingresos», mientras muestra 14 ingresos y el 100 % de las lecciones. Además, el resumen pone el
    último acceso un día antes de la inscripción.
- **Ejercicios:**
  - **Diapositivas:** todo es una diapositiva dentro de la lección, elegida entre 80 formatos, y la
    IA completa el formato con el tema de la lección. Cada comisión puede sumar contenido propio sin
    tocar el curso.
  - **Los 12 evaluativos:** opción única, selección múltiple, verdadero o falso, palabras que faltan,
    reordenar, emparejar, seleccionar imagen, deslizador, tachar, puntuación, respuesta abierta y
    encuesta.
  - **Los interactivos:** tarjetas que giran, arrastrar y soltar, revelar, línea de tiempo y
    pestañas, entre otros.
  - **«Palabras que faltan», probado el 21/11:** se sumó una diapositiva a la lección 3 del curso de
    ejemplo, solo para esa comisión, con «Can I have a _ of water, please? How _ is it?».
    - **Al armarla:** el docente escribe la frase con un `_` por hueco, carga la palabra correcta de
      cada uno y abajo ve cómo le va a quedar al alumno. Se guarda sola.
    - **El alumno:** escribe cada palabra en su hueco y toca «Verificar». No hay lista de palabras
      para elegir.
    - **La corrección:** cada hueco queda en verde o en rojo, con «1 de 2 correctas». Acepta
      mayúsculas y espacios de más («Glass», « much »), pero no un error de tipeo («glas»).
    - **Después de errar:** no muestra la respuesta correcta ni da pista. «Reintentar» borra los dos
      huecos, también el que estaba bien, y se puede reintentar sin límite.
- **Dónde les ganamos:**
  - Está hecho para cursos online, con el alumno registrado por correo. En el campus el chico entra
    con su DNI y la familia tiene su panel.
  - La asistencia también se toma con QR.
  - En el cobro del mostrador, el descuento y el recargo se cargan al cobrar, hay una página de
    deudores y sale un comprobante.
- **Dónde nos quedamos cortos:**
  - La familia no puede pagar desde el campus: todo pago se registra en el mostrador, y «Mercado
    Pago» es solo el medio que se anota.
  - No se ve el plan de cuotas antes de ponerle precio al curso.
  - En ejercicios tenemos speaking, listening y conversación; ellos tienen doce formatos de
    evaluación.
- **Ideas sin decidir:**
  - Aviso del alumno que empieza a faltar (la primera recomendada).
  - Recordar la cuota desde Deudores con el mensaje de WhatsApp armado.
  - Que la familia informe el pago con el comprobante.
  - Ideas para pasar lista y para el cierre de la clase.
  - Constancias con la marca del instituto.
  - Del 21/11:
    - que la familia pague la cuota desde el campus y se marque sola (pasó a
      [FEAT-34](BACKLOG-TECNICO.md#feat-34));
    - ver el plan de cuotas antes de guardar el precio;
    - sumar a la práctica palabras que faltan, reordenar la frase y emparejar;
    - que una cuenta nueva arranque con datos de ejemplo y un botón para borrarlos, como el
      Instituto Demo.
- **No sirve para nosotros:** un índice de compromiso con número cuando todavía no hay datos que lo
  sostengan.
- **Falta ver:**
  - El pago del lado del alumno y qué cae en «Por revisar».
  - El asistente de la academia («Agente Director»): cada pregunta gasta su IA.
  - Los doce reportes por comisión.

### Material de Cambridge (capacitación de Patricia)

PDFs de una capacitación de IA para enseñar idiomas que hizo Patricia. Dos leídos el 17/10/2026;
quedan más por leer.

- **«Generative AI Idea Pack» (2024):** unas 45 actividades con IA para docentes de inglés, por edad.
  Sus tres principios: el docente revisa todo, nunca datos personales en las instrucciones, la IA
  inventa.
  - Salió: Write & Improve como herramienta de recursos y [PED-13](BACKLOG-TECNICO.md#ped-13)
    (escritura que marca sin corregir).
  - Sin decidir: trabalenguas con el sonido que más falla el grupo, actividad en tres niveles
    dentro del armado, personajes para el chat.
- **«Ethical AI for language learning and assessment» (2025):** seis principios (validez, equidad,
  privacidad, transparencia, responsabilidad humana, proporcionalidad), pensados para exámenes. El
  campus ya cumple varios por diseño.
  - Sin decidir: retitular la «Precisión» del speaking, que mide cuánto entendió el reconocedor de
    voz y no la pronunciación; un texto para familias sobre qué recibe la IA y qué no; que la
    devolución de pronunciación apunte a que se entienda, no a sonar nativo.

### Trinity Phonics

[7612.com.ar/holy](https://7612.com.ar/holy/) · app de pronunciación del Holy Trinity College (Mar
del Plata), relevada el 19/10/2026 leyendo su código público y con una prueba de micrófono.

- **Qué hace:**
  - Corrige la pronunciación con Azure: puntaje por fonema. La nota mezcla el promedio con el peor
    fonema, así que es estricta.
  - Un tutor explica la nota en castellano rioplatense y festeja cuando un sonido mejora.
  - Ejercicios sin micrófono (pares mínimos, dictado) y con micrófono (frase que crece,
    mini-diálogo con formato de oral de Cambridge).
  - Práctica de los sonidos pendientes según los errores anteriores; racha, estrellas y medallas.
  - Modo prueba con un código de la docente: a toda la clase le toca la misma serie.
- **Lo que no nos convenció:** contradicciones entre el resumen y la tabla de puntajes. La prueba
  hecha no alcanza para saber si Azure es generoso con algunos sonidos: falta una prueba
  controlada, idealmente con Patricia.
- **Qué salió:** sirve de prueba concreta para [PED-03](BACKLOG-TECNICO.md#ped-03) (validez de la
  evaluación de pronunciación) y [PED-02](BACKLOG-TECNICO.md#ped-02). El 25/10/2026 dos ideas
  pasaron a la página de propuestas para Patricia (ver [Moodle](#moodle)): el speaking corregido
  sonido por sonido, con los sonidos pendientes de cada alumno, condicionado a probarlo antes
  con alumnos reales; y una práctica sin micrófono de pares mínimos y dictado. La app muestra los
  sonidos con su símbolo IPA (/θ/, /ð/); se le pregunta a Patricia en qué niveles mostrarlo
  (la propuesta: la letra siempre, el símbolo para los más grandes y para el docente). Rachas y medallas
  quedan afuera: a Patricia no la entusiasman.

### Quinttos

[quinttos.com](https://www.quinttos.com) · relevado el 19/10/2026, desde afuera (no vimos el sistema
por dentro). Apareció porque es lo que usa el Instituto Lenguas Vivas de Mar del Plata para la
gestión y el campus.

- **Qué es:** gestión de institutos y colegios, argentina, con más de 10 años en el mercado y unas
  150 instituciones. Inscripciones, notas, asistencia, certificados, cuotas y morosos (Mercado
  Pago, factura electrónica de AFIP), mensajes por correo, apps propias y un aula virtual que
  conecta Moodle o Classroom. No publica precios.
- **Frente al campus:** compite con Gestión y con la App. No tiene nada parecido al Pedagógico ni
  práctica con IA. Con un instituto que ya lo usa, la entrada es el Pedagógico.

### Mondly (CEM English)

App de práctica de idiomas de Pearson, con IA y práctica oral. Apareció el 29/09/2026 porque CEM
English (Mar del Plata) la ofrece a sus alumnos con su marca («MONDLY by CEM English») y la usa
para captar alumnos.

- **Lo que muestra:** un instituto paga por una app de práctica para sus alumnos. Mondly for
  Business cuesta desde USD 7,99 por usuario por mes; el precio institucional no es público.
- **Dónde les ganamos:** el contenido es el curso propio de Mondly, no la clase del instituto. La
  práctica del campus sale de lo que se vio en clase.
- **Qué salió:** la vara de los precios es «gestión + app de práctica», no gestión sola.

### Gestión comparada por precio

Relevados el 28 y 29/09/2026 para armar la tabla de precios, todos a tamaño de un instituto de unos
200 alumnos:

- **EDUV.AR**: el único argentino con precio público, fijo.
- **Aprendesk**: el paquete más parecido (familias, IA, dominio propio).
- **Plataforma Academia** (Colombia).
- **Teachworks** (Estados Unidos).
- **Jackrabbit** (Estados Unidos).

Ninguno tiene práctica con IA. Acadesoft, Acadeu, Englody y los de ComparaSoftware no publican
precio.
