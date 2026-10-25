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
| [Moodle](#moodle) | Aula virtual de código abierto | 25/10/2026 | Ideas sin decidir |
| [Langboost](#langboost) | Arma la clase con IA para el docente | 03/10/2026 | [PED-09](BACKLOG-TECNICO.md#ped-09) |
| [ClassesUp](#classesup) | Gestión de academias, argentina | 06/10/2026 | Ideas sin decidir |
| [Material de Cambridge](#material-de-cambridge-capacitación-de-patricia) | Capacitación de IA de Patricia | 17/10/2026 | Write & Improve en recursos, [PED-13](BACKLOG-TECNICO.md#ped-13) |
| [Trinity Phonics](#trinity-phonics) | Práctica de pronunciación con Azure | 19/10/2026 | Prueba para [PED-02](BACKLOG-TECNICO.md#ped-02) y [PED-03](BACKLOG-TECNICO.md#ped-03) |
| [Quinttos](#quinttos) | Gestión de institutos, argentina | 19/10/2026 | Contexto comercial |
| [Mondly](#mondly-cem-english) | App de práctica de Pearson | 29/09/2026 | Vara para los precios |
| [Gestión comparada por precio](#gestión-comparada-por-precio) | Cinco sistemas de gestión | 28/09/2026 | Tabla de precios |

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
    frena al que se traba en una parte), y logros por constancia y por mejora.
  - La estadística por pregunta abarca toda la práctica (listening, speaking y escritos), y
    pide guardar cada respuesta: hoy `PracticeSession` guarda solo los totales.
  - La rúbrica usa las categorías y escalas del boletín de cada curso (`ReportCategory`) y no
    calcula nota: en prod, Children 1 a 3 tienen escala conceptual y de Children 4 en adelante
    van de 1 a 10. Lo marcado queda en la clase, a mano para completar el boletín.
  - **Decidido el 25/10/2026 (falta el visto bueno de Patricia):** la evaluación pasa a ser un
    «repaso integrador», mensual o bimestral, con los temas de las clases del período. Es un
    complemento del examen que toman y califican las docentes, nunca su reemplazo, y no pone
    nota.
- **No sirve para nosotros:** el taller entre pares (para chicos y grupos chicos es más carga que
  ayuda) y las preguntas de cálculo.
- **Ventana al cliente:** las propuestas se le muestran a Patricia en un artifact, una por tarjeta,
  para que dé el visto bueno antes de construir. Sin nombrar a Moodle.

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

[classesup.com](https://classesup.com) · su Instagram (@classes.up), relevado el 06/10/2026.

- **Qué es:** gestión de academias, generalista, aunque sus ejemplos son de inglés. Cursos en vivo y
  asincrónicos, cobros (Mercado Pago, Stripe, transferencia, y pagos que informa el alumno y la
  academia aprueba), asistencia, evaluaciones, chat, certificados con la marca de la academia,
  reportes y dos asistentes de IA (uno marca riesgo de abandono). Gratis hasta 25 alumnos.
- **Su contenido:** tres publicaciones por día con muy poca respuesta; las de tono de anuncio
  rendían más. Para @somoslinguacampus sirve el formato de consejo útil para el director, no el
  volumen.
- **Ideas sin decidir:**
  - Aviso del alumno que empieza a faltar (la primera recomendada).
  - Recordar la cuota desde Deudores con el mensaje de WhatsApp armado.
  - Que la familia informe el pago con el comprobante.
  - Ideas para pasar lista y para el cierre de la clase.
  - Constancias con la marca del instituto.

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
  evaluación de pronunciación) y [PED-02](BACKLOG-TECNICO.md#ped-02). Las ideas quedaron sin decidir.

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
