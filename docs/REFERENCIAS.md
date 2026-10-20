# Referencias

Productos, apps y material que miramos para sacar ideas para el campus: qué es cada uno, qué nos
gustó, dónde nos quedamos cortos o les ganamos, y qué ficha del backlog salió de ahí. Arriba va lo
que falta explorar.

Una idea que se decide pasa a ser una ficha en [`BACKLOG-TECNICO.md`](BACKLOG-TECNICO.md) y acá
queda el enlace. Las que no se decidieron quedan anotadas como **sin decidir**, para no
proponerlas dos veces.

Ninguna de estas referencias se nombra en textos públicos (landing, redes, correos).

## Por explorar

### Moodle

- **Qué es:** la plataforma de aula virtual más usada del mundo. Es gratuita y de código abierto,
  existe desde 2002 y la usan universidades, terciarios y colegios. No gestiona el instituto (ni
  cuotas, ni caja, ni sueldos): sistemas como Quinttos se encargan de eso y la conectan como aula
  virtual.
- **Por qué mirarla:** compite con el módulo Pedagógico, y tiene algo que el campus todavía no:
  **cuestionarios que se corrigen solos**, con banco de preguntas. Para alumnos a distancia pesa.
- **Qué mirar:**
  - Los tipos de pregunta (opción múltiple, completar, emparejar, arrastrar, respuesta corta) y
    cómo corrige cada uno.
  - El banco de preguntas: cómo se reutilizan entre cursos y cómo se arma un examen al azar.
  - Los intentos, el tiempo límite y la devolución por respuesta.
  - Cómo pasa la nota al libro de calificaciones.
  - Las actividades H5P (interactivas, también de código abierto).
- **Dónde:** el sitio de demostración (school.moodledemo.net, se reinicia cada hora) y el código en
  [github.com/moodle/moodle](https://github.com/moodle/moodle) (los tipos de pregunta están en
  `question/type/`).
- **Ojo:** sirve para mirar cómo resolvieron las cosas, no para copiar código: está en PHP y su
  licencia (GPL) trae condiciones para quien lo reutiliza. Las ideas son libres.

## Exploradas

| Referencia | Qué es | Fecha | Qué salió |
|---|---|---|---|
| [Langboost](#langboost) | Arma la clase con IA para el docente | 03/10/2026 | [PED-09](BACKLOG-TECNICO.md#ped-09) |
| [ClassesUp](#classesup) | Gestión de academias, argentina | 06/10/2026 | Ideas sin decidir |
| [Material de Cambridge](#material-de-cambridge-capacitación-de-patricia) | Capacitación de IA de Patricia | 17/10/2026 | Write & Improve en recursos, [PED-13](BACKLOG-TECNICO.md#ped-13) |
| [Trinity Phonics](#trinity-phonics) | Práctica de pronunciación con Azure | 19/10/2026 | Prueba para [PED-02](BACKLOG-TECNICO.md#ped-02) y [PED-03](BACKLOG-TECNICO.md#ped-03) |
| [Quinttos](#quinttos) | Gestión de institutos, argentina | 19/10/2026 | Contexto comercial |
| [Mondly](#mondly-cem-english) | App de práctica de Pearson | 29/09/2026 | Vara para los precios |
| [Gestión comparada por precio](#gestión-comparada-por-precio) | Cinco sistemas de gestión | 28/09/2026 | Tabla de precios |

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
