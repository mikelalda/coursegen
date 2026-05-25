# Chat Integration Fixes

## Objetivo

Corregir la integración entre Moodle y el backend AI sin tocar librerías internas de Moodle, dejando el flujo de chat y generación de curso alineado con lo que espera `local/coursegen`.

## Problemas detectados

1. El navegador abría los streams SSE directamente contra el backend AI.
2. El router de cursos del backend no seguía el contrato real que usa Moodle.
3. El stream SSE del diseñador no serializaba bien mensajes multilínea.
4. Algunos externals devolvían `data => null` en errores controlados, pero su contrato de retorno no permitía `null`, provocando `invalidparameter`.
5. El flujo de FP Designer guardaba el curso pero no reaparecía el chat al entrar al curso recién creado.
6. El archivo AMD cargado por `local_coursegen/designer_chat` estaba roto y Moodle no podía cargar el módulo del chat del diseñador.
7. El proxy SSE fallaba en este servidor porque llamaba a `apache_setenv()` sin comprobar si la función existía.
8. El backend leía algunos valores de `.env` con sufijo `\r`, lo que contaminaba configuración booleana y de modelos.
9. El flujo final del diseñador y el flujo `/course` usaban almacenes de sesión distintos, así que al aceptar el diseño se intentaba ejecutar un `session_id` que `/course/execute` no conocía.
10. Si el backend se recargaba o reiniciaba, las sesiones del diseñador solo existían en memoria y el export final volvía a fallar con `Session not found`.
11. El pipeline de planificación y ejecución de cursos seguía usando `Qwen/Qwen2.5-72B-Instruct`, demasiado lento para este flujo y propenso a bloqueos largos.
12. El segundo envío del modal del Designer todavía podía disparar un submit HTML nativo y navegar a `course/view.php` sin `id`, mostrando el error `unspecifycourseid` y reiniciando el chat.
13. El flujo "Crear con IA" generaba actividades de tipo `resource` sin `file_path`, pero Moodle las trataba como archivos descargables y acababa llamando a `/files/download?path=` vacío.
14. El FP Designer no cerraba nunca la conversación aunque el diseño ya estuviera completo, porque el frontend solo aceptaba `end` y el backend seguía devolviendo `human_feedback`.
15. Las respuestas de los chats se mostraban como texto plano o HTML crudo, sin detectar Markdown, por lo que listas, tablas o bloques de código quedaban poco legibles.
16. El flujo `/course/result` no devolvía exactamente el mismo contrato que `/resources/create-mod/result`: varios `mod_settings` venían solo a nivel superior y no dentro de `parameters`, así que Moodle podía no crear actividades y aun así devolver éxito.
17. Incluso con el contrato ya alineado, algunos módulos del flujo de curso seguían llegando sin los campos base que este Moodle necesita en `course_modules` y en tablas como `page` y `assign`, provocando `dml_write_exception` con valores `NULL` en `visible`, `contentformat` o `requireallteammemberssubmit`.

## Cambios realizados

### 1. Proxy same-origin para streaming en Moodle

Archivo añadido:
- `local/coursegen/stream.php`

### 2. URLs de streaming cambiadas al proxy de Moodle

Archivo modificado:
- `ai/provider/birtai/classes/httpclient/ai_course_api.php`

### 3. Router de cursos alineado con `local/coursegen`

Archivo modificado:
- `/home/birt/moodle-course-generator/app/routers/course.py`

### 4. SSE multilínea corregido en el diseñador

Archivo modificado:
- `/home/birt/moodle-course-generator/app/routers/designer.py`

### 5. Error real propagado al final de la creación en Moodle

Archivo modificado:
- `local/coursegen/classes/external/create_course.php`

### 6. Eliminado el popup `invalidparameter` en errores controlados

Archivos modificados:
- `local/coursegen/classes/external/designer_start.php`
- `local/coursegen/classes/external/designer_message.php`
- `local/coursegen/classes/external/plan_course_message.php`

### 7. Flujo de FP Designer mantenido como sesión de diseñador hasta completar el curso

Archivos modificados:
- `local/coursegen/classes/external/designer_start.php`
- `local/coursegen/classes/hook/chat_hook.php`
- `local/coursegen/classes/ai_course.php`

### 8. Auto-open del diseñador reforzado tras el redirect de creación

Archivo modificado:
- `local/coursegen/classes/hook/chat_hook.php`

Qué cambia:
- La reapertura automática del diseñador ya no depende solo de que la ruta sea exactamente `course/view.php`.
- Ahora se activa en cualquier contexto real de curso.
- El arranque del chat del diseñador se inyecta con un `require(...)` protegido por una guarda en `window.localCoursegenPendingDesigner`, para que la apertura ocurra tras la carga de la página y no se duplique.

### 9. Build AMD del diseñador reconstruido

Archivo modificado:
- `local/coursegen/amd/build/designer_chat.min.js`

Qué cambia:
- El artefacto servido por Moodle para `local_coursegen/designer_chat` no era un AMD válido para RequireJS y, además, estaba roto para este entorno.
- Se dejó un módulo AMD válido que exporta `init` correctamente y permite abrir el modal, iniciar la sesión del diseñador y continuar el chat.

### 10. Proxy SSE endurecido para PHP-FPM / entornos sin `apache_setenv`

Archivo modificado:
- `local/coursegen/stream.php`

Qué cambia:
- La llamada a `apache_setenv('no-gzip', '1')` ahora se ejecuta solo si la función existe.
- Con esto el stream del diseñador deja de romperse con la excepción `Call to undefined function apache_setenv()`.

### 11. Normalización de configuración del Designer frente a `.env` con CRLF

Archivo modificado:
- `/home/birt/moodle-course-generator/src/designer/llm_factory.py`

Qué cambia:
- Se limpian valores de proveedor, modelo, base URL y API key antes de construir los clientes LLM del Designer.
- Esto evita que cadenas como `openai_compatible\r` o booleans con `\r` rompan la resolución de proveedor o la validación de settings.

### 12. Bridge de exportación entre sesión del diseñador y sesión `/course`

Archivos modificados:
- `/home/birt/moodle-course-generator/app/routers/designer.py`
- `local/coursegen/classes/external/plan_course_execute.php`

Qué cambia:
- Se añadió `POST /designer/export-course-plan` para convertir una conversación del Designer en una sesión estándar del router `/course`.
- `plan_course_execute.php` detecta sesiones del diseñador (`status = 5`), exporta primero el plan al backend y reescribe la fila de Moodle con el nuevo `session_id` de `/course` antes de llamar a `/course/execute`.
- Con esto desaparece el fallo estructural en el que Moodle intentaba ejecutar un `designer session_id` contra un endpoint que solo conoce `course_sessions`.

### 13. Persistencia de snapshots del Designer para sobrevivir a reinicios

Archivo modificado:
- `/home/birt/moodle-course-generator/app/routers/designer.py`

Qué cambia:
- Cada sesión interactiva del Designer guarda un snapshot JSON en `app/output/designer_sessions/` con el estado exportable y el historial mínimo necesario.
- `GET /designer/status/{session_id}` y `POST /designer/export-course-plan` ya no dependen solo de memoria: si la sesión no está cargada, recuperan el snapshot persistido.
- Esto evita que un reload del backend deje al flujo final del diseñador en estado imposible de exportar.

### 14. Modelo HuggingFace ligero para planificación y ejecución de cursos

Archivo modificado:
- `/home/birt/moodle-course-generator/app/routers/course.py`

Qué cambia:
- El flujo de planificación y generación detallada del curso usa ahora un modelo más pequeño cuando el backend activo es HuggingFace.
- Por defecto se fuerza `Qwen/Qwen2.5-7B-Instruct` en las llamadas de `course.py`, con posibilidad de override vía `COURSEGEN_HF_TEXT_MODEL`.
- El objetivo es evitar los cuellos de botella que estaba provocando `Qwen/Qwen2.5-72B-Instruct` en el flujo real del Designer hacia creación de curso.

### 15. Blindaje del segundo envío en el modal del Designer

Archivos modificados:
- `/var/www/html/local/coursegen/amd/src/designer_chat.js`
- `/var/www/html/local/coursegen/amd/build/designer_chat.min.js`
- `local/coursegen/templates/designer_chat_modal.mustache`

Qué cambia:
- El botón de envío del chat deja de ser `type="submit"` y pasa a `type="button"`.
- El envío del mensaje se centraliza en una única función JS (`submitCurrentMessage`) usada tanto por el click como por la tecla Enter.
- Con esto se elimina la vía de submit HTML nativo que acababa navegando a `course/view.php` sin parámetro `id`, provocando la ventana con `Ikastaroaren ID-a, izen laburra edo ID zenbakia zehaztu behar da` y reiniciando el flujo del chat.

### 16. Normalización de recursos sin archivo en la ejecución del curso

Archivo modificado:
- `/home/birt/moodle-course-generator/app/routers/course.py`

Qué cambia:
- Se añade una normalización explícita de actividades generadas antes de devolver el resultado final a Moodle.
- Si una actividad llega como `resource` pero no trae `mod_settings.file_path`, se convierte automáticamente en `page` con el HTML/introducción generados.
- Con esto Moodle deja de intentar descargar un fichero inexistente mediante `/files/download?path=` y el curso puede crearse con contenido útil en lugar de quedarse vacío o con módulos fallidos.

### 17. Cierre utilizable del FP Designer cuando el diseño ya está aprobado

Archivo modificado:
- `/home/birt/moodle-course-generator/app/routers/designer.py`

Qué cambia:
- Se añade una heurística de `ready_to_generate` basada en dos señales combinadas: aprobación explícita del docente (`"me parece correcto"`, `"ahora crea el curso"`, etc.) y evidencia de que la conversación ya contiene un diseño de curso completo.
- Cuando se cumple esa condición, el backend emite `siguiente_agente = end` y expone `ready_to_generate = true` en el estado del Designer.
- Así el modal puede dejar de seguir preguntando y ofrecer directamente la generación del curso cuando la conversación ya ha terminado de forma práctica.

### 18. Render Markdown legible en los chats

Archivos modificados:
- `/var/www/html/local/coursegen/amd/src/designer_chat.js`
- `/var/www/html/local/coursegen/amd/src/course_streaming.js`
- `/var/www/html/local/coursegen/amd/build/designer_chat.min.js`
- `/var/www/html/local/coursegen/amd/build/course_streaming.min.js`
- `/var/www/html/local/coursegen/styles.css`

Qué cambia:
- Los chats ahora distinguen entre HTML estructurado generado por backend y respuestas en Markdown.
- Si la respuesta ya viene como HTML del plan del curso, se respeta tal cual.
- Si la respuesta viene en Markdown, el frontend la convierte a HTML legible con soporte para encabezados, listas, citas, tablas, enlaces y bloques de código.
- Se añaden estilos específicos para que el Markdown dentro de las burbujas sea legible y consistente.

### 19. Alineación del contrato de `Crear con IA` con `Add activity or resource with AI`

Archivos modificados:
- `/home/birt/moodle-course-generator/app/routers/course.py`
- `local/coursegen/classes/external/create_course.php`

Qué cambia:
- El backend de cursos normaliza ahora cada actividad generada al mismo contrato efectivo que ya consume bien el flujo individual de creación de actividad.
- Los `mod_settings` dejan de quedarse solo en el nivel superior del resultado y pasan a estar disponibles dentro de `parameters`, que es donde `mod_manager` y las clases `mod_parameters/*` los esperan realmente.
- Se adaptan formatos incompatibles de generadores como `forum`, `quiz`, `book`, `wiki`, `glossary`, `feedback` y módulos basados en fichero para que Moodle reciba la estructura que ya funciona en `create-mod`.
- Si una actividad basada en fichero (`resource`, `scorm`, `h5pactivity`) no trae un `file_path` real, se convierte a `page` para evitar creaciones vacías o descargas a `/files/download?path=`.
- `create_course.php` ya no devuelve éxito silencioso cuando en realidad no se ha podido crear ninguna actividad: ahora cuenta intentos, creadas y fallidas, y devuelve el error real si todo falla.

### 20. Normalización defensiva en `mod_manager` para módulos creados desde curso

Archivo modificado:
- `local/coursegen/classes/mod_manager.php`

Qué cambia:
- `mod_manager` aplica ahora los mismos defaults comunes que el flujo estable de `create-mod` cuando faltan en el payload: `visible`, `visibleoncoursepage`, `showdescription`, `introformat` y `mod_settings`.
- Si una `page` llega desde el flujo de curso con `content/contentformat`, se transforma automáticamente al formato que espera el formulario real de Moodle (`page.text` / `page.format`).
- Si una `assign` llega sin varios flags obligatorios de este entorno, se completan con defaults seguros (`requiresubmissionstatement`, `requireallteammemberssubmit`, `blindmarking`, `markingworkflow`, `markingallocation`, etc.).
- Con esto el consumidor común de Moodle deja de depender de que todos los productores externos reproduzcan exactamente cada campo base del formulario.

### 21. Handoff del Designer a generación aunque el cierre del chat sea breve

Archivo modificado:
- `/home/birt/moodle-course-generator/app/routers/designer.py`

Qué cambia:
- La heurística `ready_to_generate` ya no depende solo del último mensaje del usuario.
- Ahora recorre todo el historial de mensajes del docente y conserva señales previas como `"crea el curso entero"`, `"curso completo"`, `"genera todo"` o `"sin parar"`, incluso si el cierre final del chat es algo corto como `"OK"`, `"vale"` o `"finaliza la entrega"`.
- La generación sigue protegida por la comprobación de que el diseño ya está realmente completo, así que no se adelanta el handoff en fases tempranas del chat.
- Con esto el Designer deja de quedarse atrapado en la conversación final cuando la intención de generar el curso ya había sido expresada antes en el hilo.

### 22. Orquestador supervisor real y vista consolidada por bloques

Archivos modificados:
- `/home/birt/moodle-course-generator/src/designer/graph.py`
- `/home/birt/moodle-course-generator/src/designer/routes.py`
- `/home/birt/moodle-course-generator/src/designer/state.py`
- `/home/birt/moodle-course-generator/src/designer/agents/orquestador.py`
- `/home/birt/moodle-course-generator/src/designer/agents/planificador_didactico.py`
- `/home/birt/moodle-course-generator/src/designer/agents/disenador_actividades.py`
- `/home/birt/moodle-course-generator/src/designer/agents/analista_curricular.py`
- `/home/birt/moodle-course-generator/src/designer/agents/guionista_rise.py`
- `/home/birt/moodle-course-generator/src/designer/agents/calidad.py`
- `/home/birt/moodle-course-generator/src/designer/agents/generador_docs.py`
- `/home/birt/moodle-course-generator/src/designer/agents/generador_scorm.py`
- `/home/birt/moodle-course-generator/config/prompts/designer/orquestador.md`
- `/home/birt/moodle-course-generator/config/prompts/designer/planificador_didactico.md`
- `/home/birt/moodle-course-generator/config/prompts/designer/disenador_actividades.md`

Qué cambia:
- El grafo del Designer deja de encadenar especialistas con aristas fijas y pasa a un patrón de supervisor: cada agente vuelve al orquestador y es el orquestador quien decide el siguiente paso.
- Se añaden marcas de estado (`ultimo_agente`, `ultimo_agente_pendiente`, `fases_auditadas`, `fases_documentadas`, `estructura_preferida`) para que el orquestador sepa qué fase acaba de terminar, si ya se revisó calidad o documentación y si debe continuar o esperar al docente.
- El orquestador reconoce mejor órdenes globales como `crear todos los bloques`, `curso entero`, `genera todo` o `termina la creación del contenido en Moodle`, activando continuidad real del flujo en vez de volver a negociar bloque por bloque.
- Si el docente elige una estructura por bloques/hitos, el planificador la conserva y la devuelve en una sola tabla consolidada, sin reagruparla automáticamente en 4 unidades tradicionales.
- Los prompts de planificación y actividades se ajustan para que distingan las fases, pero muestren todos los bloques juntos cuando el docente pida una vista global o una generación completa.
- Se elimina la tendencia del orquestador a responder con descargos del tipo `no puedo entrar en Moodle` cuando en realidad debe decidir el siguiente agente o cerrar el diseño para que continúe la generación real.

### 23. Export del Designer alineado con `Create with AI`

Archivos modificados:
- `/home/birt/moodle-course-generator/app/routers/designer.py`
- `local/coursegen/classes/external/plan_course_execute.php`

Qué cambia:
- El puente `POST /designer/export-course-plan` deja de crear la sesión del curso con el flujo simplificado `/course/start` y pasa a usar el mismo pipeline `v2` que utiliza el botón `Create with AI`.
- `plan_course_execute.php` envía ahora al export del Designer la misma información estructural que usa el flujo estándar de Moodle: `course_id`, `site_id`, plantilla por defecto, `structure_type`, módulos disponibles en la instancia y `allowed_module_types` filtrados por plantilla.
- El backend del Designer convierte la conversación aprobada en un `CourseV2StartRequest`, de modo que la planificación derivada del chat ya no cae en la lista reducida de tipos por defecto ni pierde metadatos del curso.
- Con esto la creación lanzada desde el chat del Designer reutiliza la misma base de planificación que el botón `Create with AI`, por lo que la generación final en Moodle debería producir un curso completo y no una versión más pobre o simplificada.

## Validaciones realizadas

- `php -l /var/www/html/local/coursegen/classes/ai_course.php`
- `php -l /var/www/html/local/coursegen/classes/external/designer_start.php`
- `php -l /var/www/html/local/coursegen/classes/external/designer_message.php`
- `php -l /var/www/html/local/coursegen/classes/external/plan_course_message.php`
- `php -l /var/www/html/local/coursegen/classes/hook/chat_hook.php`
- `php -l /var/www/html/local/coursegen/stream.php`
- `php -l /var/www/html/local/coursegen/classes/external/plan_course_execute.php`
- `python -m py_compile /home/birt/moodle-course-generator/app/routers/designer.py`
- `python -m py_compile /home/birt/moodle-course-generator/app/routers/course.py`
- Reproducción local del caso `invalidparameter` usando `external_api::clean_returnvalue(...)` sobre `designer_start`.
- Validación directa de `designer_start` en un curso existente: devuelve una respuesta limpia y la sesión queda guardada con `status = 5`.
- Verificación de la sesión recién creada por el flujo del diseñador: `courseid = 396`, `session_id = designer_pending`, `status = 5`.
- Validación real en navegador sobre el curso recién creado `courseid = 398`: al pulsar `FP Euskadi Designer` se crea el curso, se redirige a `course/view.php?id=398`, se abre automáticamente el modal del diseñador y el primer intercambio de chat responde correctamente.
- Validación directa de `POST /designer/export-course-plan` con una sesión real del Designer: devuelve una nueva sesión `/course` planificada.
- Validación de persistencia: un snapshot de prueba solo en disco responde correctamente en `GET /designer/status/restart-check` y puede exportarse a una sesión `/course`.
- Validación del bridge desde Moodle: `planCourseExecute(398)` devuelve `success = true`, inicia la ejecución y reescribe la fila de Moodle desde la sesión del Designer a una sesión estándar `/course` (`status = 2`).
- Validación estática del fix del segundo mensaje: sin errores de editor en los tres archivos modificados y confirmación de que la plantilla ya no renderiza el botón como `submit`.
- Validación focalizada del backend de creación: una ejecución real de `_execute_course_generation()` con una actividad `resource` sin fichero ahora la devuelve como `page`, eliminando la ruta vacía `/files/download?path=` del resultado.
- Validación focalizada del contrato de curso: `_normalize_generated_activity_result()` ahora deja `forum`, `book`, `quiz` y `resource` en un formato compatible con `mod_manager`, incluyendo `parameters.mod_settings`.
- Validación focalizada del consumidor Moodle: `mod_manager::create_from_ai_result()` crea correctamente `page`, `assign`, `forum` y `url` con el payload real del flujo de curso.
- Validación focalizada del Designer: la nueva lógica marca `ready_to_generate` cuando hay aprobación del usuario y el transcript ya contiene un diseño completo.
- Validación focalizada del handoff: `_is_ready_to_generate()` devuelve `True` cuando una petición previa de `"crear el curso entero"` va seguida de un cierre final tipo `"OK"`, y sigue devolviendo `False` si el transcript aún no contiene un diseño completo.
- Validación focalizada de arquitectura agentica: `build_design_graph()` compila correctamente con el nuevo patrón supervisor y el orquestador decide el siguiente paso tras cada especialista.
- Validación focalizada del supervisor: una orden global tipo `"Crea todos los bloques y termina la creación del contenido en Moodle"` hace avanzar al orquestador hacia la siguiente fase (`guionista_rise` en el caso probado) con `auto_continuar = True`.
- Validación focalizada de consolidación por bloques: `planificador_didactico_node()` conserva una tabla de bloques propuesta por el docente, la devuelve en una sola vista consolidada y rellena `unidades_didacticas` con entradas estructuradas reutilizables por el resto del flujo.
- Validación focalizada anti-bucle del supervisor: el flag `ultimo_agente_pendiente` evita que el orquestador vuelva a reaccionar una y otra vez al mismo resultado del agente y permite que mensajes posteriores del docente entren por routing normal.
- `python -m py_compile /home/birt/moodle-course-generator/src/designer/state.py /home/birt/moodle-course-generator/src/designer/graph.py /home/birt/moodle-course-generator/src/designer/routes.py /home/birt/moodle-course-generator/src/designer/agents/orquestador.py /home/birt/moodle-course-generator/src/designer/agents/planificador_didactico.py /home/birt/moodle-course-generator/src/designer/agents/disenador_actividades.py /home/birt/moodle-course-generator/src/designer/agents/analista_curricular.py /home/birt/moodle-course-generator/src/designer/agents/guionista_rise.py /home/birt/moodle-course-generator/src/designer/agents/calidad.py /home/birt/moodle-course-generator/src/designer/agents/generador_docs.py /home/birt/moodle-course-generator/src/designer/agents/generador_scorm.py`
- `python -m py_compile /home/birt/moodle-course-generator/app/routers/designer.py`
- `php -l /var/www/html/local/coursegen/classes/external/plan_course_execute.php`
- Validación estática del render Markdown: sin errores en `src`, sin errores en `build`, y comprobación directa de que ambos AMD compilados contienen `renderAssistantContent` y la clase `local_coursegen_markdown`.
- Revisión de errores del editor en los archivos modificados: sin errores detectados.
- `php -l /var/www/html/local/coursegen/classes/external/create_course.php`
- `php -l /var/www/html/local/coursegen/classes/mod_manager.php`
- Validación end-to-end real del external `local_coursegen\external\create_course::execute()` sobre una sesión backend existente: éxito y 48 módulos creados en un curso temporal de prueba.

## Resultado esperado

1. Al pulsar `FP Designer` y llegar al curso, se vuelve a abrir la ventana/modal del chat del diseñador en vez de quedarse en el curso vacío.
2. El flujo del diseñador se mantiene como flujo de diseñador hasta que el curso termina de generarse.
3. Los errores controlados ya no aparecen como `invalidparameter` por culpa del contrato de retorno AJAX.
4. El paso final Designer -> export -> `/course/execute` sobrevive a reinicios del backend y deja de depender de sesiones efímeras en memoria.
5. La planificación y ejecución del curso usan un modelo más razonable para este entorno HuggingFace, reduciendo el riesgo de bloqueos por timeouts del 72B.
6. El segundo mensaje del chat ya no puede romper la sesión navegando a `course/view.php` sin `id` por culpa de un submit nativo del formulario.
7. El flujo "Crear con IA" deja de producir recursos rotos que Moodle intentaba descargar como ficheros inexistentes.
8. El FP Designer puede cerrar la conversación de forma útil y pasar a generación cuando el docente ya ha validado el diseño.
9. Los chats muestran Markdown de forma legible en lugar de dejarlo como texto plano o HTML sin formato adecuado.
10. El flujo completo de creación de curso deja de divergir del contrato que ya funcionaba en `Add activity or resource with AI`, y además deja de marcar éxito cuando realmente no se ha creado ninguna actividad.
11. El consumidor Moodle acepta ahora de forma robusta el payload real de `Crear con IA`, evitando errores de base de datos por campos comunes o específicos que llegaban a `NULL`.
