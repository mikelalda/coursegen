Necesito que me ayudes a desarrollar el contenido, los proyectos y las tareas para un curso 100% ONLINE de 140 horas en total (estimado en 5 horas de dedicación semanal por parte del alumno durante 28 semanas).

La metodología será "aprender haciendo" (Aprendizaje Basado en Proyectos) adaptada al aprendizaje asíncrono. Toda la implementación técnica y los proyectos se ejecutarán utilizando el framework **Angular** (TypeScript, HTML, CSS/SCSS). 

A continuación, te presento los 8 Resultados de Aprendizaje (RA) oficiales y cómo debemos enfocarlos en nuestro ecosistema Angular y entorno virtual:

* **RA 1. Genera interfaces gráficos mediante editores visuales...** (Enfoque Angular: Uso de librerías de componentes UI como Angular Material o PrimeNG. El alumno aprenderá a maquetar visualmente y adaptar el código generado).
* **RA 2. Genera interfaces gráficos basados en XML...** (Enfoque Angular: Diseño estructural con plantillas HTML estrictas, directivas estructurales, Data Binding y consumo de APIs REST/JSON o XML para popular la interfaz).
* **RA 3. Crea componentes visuales...** (Enfoque Angular: Arquitectura basada en componentes, @Input(), @Output(), standalone components, ciclo de vida. Entrega asíncrona del código para su revisión).
* **RA 4. Diseña interfaces gráficos, aplicando criterios de usabilidad.** (Enfoque Angular: Diseño responsive, enrutamiento, gestión de errores en formularios reactivos y feedback visual. Se evaluará mediante la grabación de un breve vídeo demostrativo por parte del alumno).
* **RA 5. Crea informes...** (Enfoque Angular: Visualización de datos dinámicos, librerías como Chart.js y exportación a PDF. Retos de visualización de datos).
* **RA 6. Documenta aplicaciones...** (Enfoque Angular: Autogeneración de documentación con Compodoc o Storybook y su publicación en GitHub Pages u otro hosting estático para su corrección).
* **RA 7. Prepara aplicaciones para su distribución...** (Enfoque Angular: Optimización con `ng build`, despliegues automatizados (CI/CD) en Vercel, Netlify o Firebase Hosting, y opcionalmente empaquetado con Electron/Capacitor).
* **RA 8. Evalúa el funcionamiento, diseñando y ejecutando pruebas.** (Enfoque Angular: Testing con Jasmine/Karma o Jest, y Cypress para E2E. El alumno deberá entregar repositorios con pipelines que pasen los tests).


------------------------------------------------------

Propuesta global del curso

Título del curso:
Desarrollo de Interfaces

Duración: 140 horas
Ritmo: 5 horas semanales durante 28 semanas
Modalidad: 100% online, asíncrona
Metodología: Aprendizaje Basado en Proyectos
Producto final: una aplicación Angular completa, publicada, documentada y probada.

Proyecto vertebrador

El alumnado desarrollará progresivamente una aplicación llamada:

“Panel de Gestión Profesional”

Puede adaptarse al contexto del ciclo: gestión de clientes, inventario, incidencias, reservas, empleados, pedidos, informes o seguimiento de proyectos.

La aplicación final deberá incluir:

Interfaz visual creada con Angular Material o PrimeNG.
Arquitectura basada en componentes.
Formularios reactivos con validación y feedback visual.
Consumo de datos desde API REST/JSON.
Visualización de datos mediante gráficos.
Generación o exportación de informes.
Documentación técnica publicada.
Despliegue en hosting estático.
Pruebas unitarias, de componentes y/o E2E.

Angular Material es una librería oficial de componentes UI para Angular, adecuada para trabajar interfaces profesionales, accesibles y responsivas. Angular recomienda los formularios reactivos cuando se necesitan soluciones más robustas, escalables, reutilizables y testeables, por lo que encajan especialmente bien con este curso.

Estructura por bloques y RA
Bloque	Semanas	Horas	RA principal	Proyecto / hito
1. Arranque del ecosistema Angular	1-2	10 h	Introducción transversal	Creación del repositorio, app base y entorno de trabajo
2. Interfaces con librerías visuales	3-5	15 h	RA1	Maquetación inicial del panel con Angular Material o PrimeNG
3. Plantillas, datos y binding	6-8	15 h	RA2	Vistas dinámicas alimentadas por JSON/API
4. Arquitectura de componentes	9-12	20 h	RA3	Biblioteca de componentes reutilizables
5. Usabilidad, formularios y navegación	13-16	20 h	RA4	Flujo funcional completo con rutas, formularios y validación
6. Informes y visualización de datos	17-19	15 h	RA5	Dashboard con gráficos y exportación de informe
7. Documentación técnica	20-21	10 h	RA6	Documentación con Compodoc o Storybook publicada
8. Distribución y despliegue	22-24	15 h	RA7	Build optimizada y despliegue en Vercel, Netlify o Firebase
9. Testing y calidad	25-28	20 h	RA8	Suite de pruebas y pipeline de validación
Proyectos y tareas por Resultado de Aprendizaje
RA1. Genera interfaces gráficos mediante editores visuales

Enfoque Angular: creación rápida de interfaces mediante Angular Material o PrimeNG, adaptación del código generado y personalización visual.

Mini-proyecto:
“Construcción visual del panel base”

Tareas:

Crear un proyecto Angular y configurar estilos globales.
Instalar y configurar una librería UI.
Crear una estructura visual inicial: toolbar, sidenav, tarjetas, tablas y botones.
Adaptar componentes predefinidos a una identidad visual concreta.
Publicar una primera captura o vídeo corto explicando la composición de la interfaz.

Evidencia:
Repositorio con la app inicial y captura comentada de la interfaz.

Criterios didácticos:
Se evalúa que el alumnado no solo inserte componentes, sino que entienda su función, los adapte y mantenga una estructura limpia.

RA2. Genera interfaces gráficos basados en XML / estructuras de datos

Enfoque Angular: plantillas HTML, directivas estructurales, data binding y consumo de datos JSON o XML transformado.

Mini-proyecto:
“Interfaz dinámica conectada a datos”

Tareas:

Crear modelos TypeScript para representar entidades.
Renderizar listados mediante *ngFor o sintaxis equivalente actual.
Mostrar estados condicionales con directivas.
Consumir datos desde un fichero JSON o API simulada.
Transformar los datos en tarjetas, tablas y vistas de detalle.

Evidencia:
Vista dinámica funcional con datos externos y explicación breve del flujo de datos.

Criterios didácticos:
El foco está en que el alumnado comprenda la relación entre estructura de datos, plantilla y representación visual.

RA3. Crea componentes visuales

Enfoque Angular: arquitectura basada en componentes, standalone components, comunicación mediante @Input() y @Output(), ciclo de vida y reutilización.

Mini-proyecto:
“Biblioteca de componentes reutilizables”

Tareas:

Identificar partes repetibles de la interfaz.
Crear componentes independientes: tarjeta de entidad, tabla reutilizable, filtro, selector, formulario parcial.
Comunicar componentes padre-hijo mediante propiedades y eventos.
Aplicar estilos encapsulados.
Refactorizar vistas anteriores para usar los nuevos componentes.

Evidencia:
Pull request o entrega donde se vea la evolución desde una interfaz monolítica hacia una arquitectura modular.

Criterios didácticos:
Se valorará especialmente la reutilización, la claridad de responsabilidades y la limpieza de la estructura del proyecto.

RA4. Diseña interfaces gráficos aplicando criterios de usabilidad

Enfoque Angular: responsive design, rutas, formularios reactivos, validación, mensajes de error, feedback visual y accesibilidad básica.

Mini-proyecto:
“Flujo usable de gestión”

Tareas:

Diseñar un flujo completo: listado → detalle → edición → confirmación.
Configurar rutas y navegación.
Crear formularios reactivos con validaciones.
Incorporar mensajes de error comprensibles.
Añadir feedback visual: carga, éxito, error, confirmación.
Grabar un vídeo corto demostrando la experiencia de usuario.

Evidencia:
Vídeo demostrativo de 3-5 minutos y repositorio actualizado.

Criterios didácticos:
Se evaluará que la aplicación sea comprensible, navegable, coherente y usable para una persona usuaria real.

RA5. Crea informes

Enfoque Angular: dashboards, visualización de datos, Chart.js u otra librería similar, generación/exportación a PDF o vista imprimible.

Mini-proyecto:
“Dashboard e informe profesional”

Tareas:

Definir indicadores relevantes del dominio elegido.
Crear una vista de resumen con tarjetas de métricas.
Incorporar gráficos dinámicos.
Añadir filtros por fecha, categoría o estado.
Crear una vista de informe exportable o imprimible.
Entregar una breve interpretación de los datos.

Evidencia:
Dashboard funcional e informe exportable o vista preparada para impresión/PDF.

Criterios didácticos:
No basta con mostrar gráficos; se debe justificar qué información aportan y cómo ayudan a la toma de decisiones.

RA6. Documenta aplicaciones

Enfoque Angular: documentación técnica con Compodoc o Storybook, comentarios relevantes, guía de instalación y publicación en GitHub Pages u otro hosting estático.

Mini-proyecto:
“Documentación técnica del proyecto Angular”

Tareas:

Crear un README profesional.
Documentar instalación, ejecución, build y testing.
Añadir comentarios técnicos donde sean necesarios.
Generar documentación con Compodoc o Storybook.
Publicar la documentación.
Incluir capturas o ejemplos de uso.

Evidencia:
Documentación publicada y enlazada desde el repositorio.

Compodoc permite generar documentación de proyectos Angular y se puede ejecutar localmente sin subir el código fuente a servidores externos, lo que lo hace adecuado para entregas educativas y revisión técnica.

RA7. Prepara aplicaciones para su distribución

Enfoque Angular: ng build, configuración de entornos, optimización, despliegue automatizado y publicación en Vercel, Netlify o Firebase Hosting.

Mini-proyecto:
“Publicación profesional de la aplicación”

Tareas:

Revisar configuración de entornos.
Ejecutar build de producción.
Corregir errores de compilación.
Configurar despliegue en hosting estático.
Automatizar despliegue desde el repositorio.
Verificar la aplicación publicada en una URL accesible.

Evidencia:
URL pública de la aplicación, repositorio y breve informe de despliegue.

Criterios didácticos:
Se valorará que el alumnado entienda la diferencia entre desarrollo local, build de producción y aplicación desplegada.

RA8. Evalúa el funcionamiento diseñando y ejecutando pruebas

Enfoque Angular: pruebas unitarias con Jasmine/Karma o Jest, pruebas de componentes y pruebas E2E con Cypress.

Mini-proyecto:
“Calidad automatizada del proyecto”

Tareas:

Identificar funciones, servicios o componentes críticos.
Crear pruebas unitarias básicas.
Crear pruebas de componentes.
Diseñar una prueba E2E de un flujo principal.
Configurar pipeline para ejecutar pruebas automáticamente.
Corregir errores detectados por los tests.

Evidencia:
Repositorio con pruebas ejecutables y pipeline en verde.

Cypress mantiene documentación específica para pruebas de componentes en Angular, por lo que encaja bien para evaluar componentes y flujos de interfaz dentro de este itinerario.

Secuencia semanal resumida
Semana	Foco	Entrega semanal
1	Presentación del reto, Git, entorno Angular	Repositorio creado
2	Estructura del proyecto y primera app	App base funcional
3	Librería UI	Angular Material/PrimeNG instalado
4	Layout profesional	Panel visual inicial
5	Personalización visual	Primera entrega RA1
6	Modelos TypeScript	Datos modelados
7	Data binding y directivas	Listado dinámico
8	Consumo JSON/API	Entrega RA2
9	Componentes standalone	Primer componente reutilizable
10	@Input() y @Output()	Comunicación entre componentes
11	Ciclo de vida y refactorización	Componentes mejorados
12	Biblioteca visual	Entrega RA3
13	Routing	Navegación completa
14	Formularios reactivos	Formulario funcional
15	Validaciones y feedback	UX mejorada
16	Vídeo demostrativo	Entrega RA4
17	Indicadores	Métricas definidas
18	Gráficos	Dashboard funcional
19	Informe/exportación	Entrega RA5
20	README y documentación	Documentación inicial
21	Compodoc/Storybook publicado	Entrega RA6
22	Build producción	App compilada
23	Hosting	App desplegada
24	CI/CD básico	Entrega RA7
25	Pruebas unitarias	Tests iniciales
26	Pruebas unitarias	Tests iniciales
27	Pruebas de componentes/E2E	Flujo probado
28	Pipeline de calidad	Entrega RA8

Evaluación propuesta
Elemento evaluable	Peso
RA1. Interfaz visual base	10%
RA2. Interfaz dinámica con datos	10%
RA3. Componentes reutilizables	15%
RA4. Usabilidad, navegación y formularios	15%
RA5. Informes y visualización de datos	10%
RA6. Documentación	10%
RA7. Distribución y despliegue	10%
RA8. Testing y calidad	15%
Portfolio final y reflexión técnica	5%
Total	100%
Estructura tipo de cada semana en Moodle

Cada semana debería tener una estructura repetible para facilitar el aprendizaje asíncrono:

Reto de la semana
Qué parte del proyecto se va a construir.
Microcontenido guiado
Vídeo breve, lectura o recurso interactivo.
Demostración técnica
Ejemplo resuelto o plantilla parcial.
Tarea práctica
Implementación en el proyecto Angular.
Entrega
Repositorio, captura, vídeo, URL o documentación.
Autoevaluación
Checklist de calidad.
Foro técnico
Dudas, errores frecuentes y soluciones compartidas.
Ejemplo de tarea ABP

Semana 14 – Formularios reactivos

Reto:
Crear el formulario de alta o edición de una entidad principal del proyecto.

Contexto profesional:
Una empresa necesita registrar correctamente sus datos para evitar errores posteriores en informes y procesos internos.

Tarea:
Implementar un formulario reactivo en Angular con validaciones obligatorias, mensajes de error comprensibles y estado visual de los campos.

Entrega:

Código subido al repositorio.
Captura del formulario con errores de validación.
Captura del formulario completado correctamente.
Breve explicación en Moodle: “Qué validaciones he aplicado y por qué”.

Checklist de calidad:

El formulario impide enviar datos incompletos.
Los mensajes de error son claros.
La estructura del código es comprensible.
La experiencia de usuario es coherente.
El componente puede mantenerse o ampliarse.
Recomendación metodológica

Para que el curso funcione bien en modalidad 100% online, conviene que cada RA no sea una práctica aislada, sino una evolución del mismo proyecto. Así el alumnado adulto percibe utilidad inmediata, mantiene continuidad y construye un portfolio profesional al finalizar.

La siguiente salida más útil sería transformar esta propuesta en una secuenciación formal de actividades en formato tabla, con columnas de unidad didáctica, RA, criterios, actividad, horas, peso y evidencia.


----------------------------------------------------------------------------------------

(.venv) birt@ikastaroak:~/moodle-course-generator$ python -m uvicorn app.main:app --reload --port 8001
INFO:     Will watch for changes in these directories: ['/home/birt/moodle-course-generator']
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [25008] using WatchFiles
2026-04-24 08:43:36.406 | INFO     | app.services.huggingface_service:__init__:99 - HuggingFace Service inicializado. Modo: API, Dispositivo: cpu
2026-04-24 08:43:36.406 | INFO     | app.services.huggingface_service:__init__:101 - Text generation habilitado con modelo: google/gemma-4-26B-A4B-it
INFO:     Started server process [25010]
INFO:     Waiting for application startup.
2026-04-24 08:43:36 | INFO     | app.main:lifespan:51 - 🚀 Iniciando Moodle AI Provider...
2026-04-24 08:43:36 | ERROR    | app.services.ollama_service:check_health:30 - Error verificando Ollama: All connection attempts failed
2026-04-24 08:43:36 | INFO     | app.services.huggingface_service:__init__:99 - HuggingFace Service inicializado. Modo: API, Dispositivo: cpu
2026-04-24 08:43:36 | INFO     | app.services.huggingface_service:__init__:101 - Text generation habilitado con modelo: google/gemma-4-26B-A4B-it
2026-04-24 08:43:37 | INFO     | app.services.ai_service:initialize:78 - ✅ HuggingFace está disponible
2026-04-24 08:43:37 | INFO     | app.services.ai_service:initialize:98 - 🤖 Backend activo: huggingface
2026-04-24 08:43:37 | INFO     | app.main:lifespan:56 - 🔧 Backend configurado: auto
2026-04-24 08:43:37 | INFO     | app.main:lifespan:57 - 🤖 Backend activo: huggingface
2026-04-24 08:43:37 | WARNING  | app.main:lifespan:62 - ⚠️ Ollama no está disponible
2026-04-24 08:43:37 | INFO     | app.main:lifespan:65 - ✅ HuggingFace disponible - Text generation: True
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: standard (Curso Estándar)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:38 - 📋 Plantilla por defecto: standard
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: scorm_based (Curso basado en SCORM)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: interactive (Curso Interactivo)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: collaborative (Curso Colaborativo)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: assessment (Curso de Evaluación)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: full (Curso Completo)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: programming (Curso de Programación)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register:34 - 📋 Plantilla registrada: blended (Curso Blended / Híbrido)
2026-04-24 08:43:37 | INFO     | app.templates.template_registry:register_default_templates:204 - 📋 8 plantillas registradas
2026-04-24 08:43:37 | INFO     | app.generators.generator_factory:initialize_generators:259 - 🔧 GeneratorFactory inicializada con 36 generadores
INFO:     Application startup complete.
INFO:     127.0.0.1:56716 - "POST /designer/chat/start HTTP/1.1" 200 OK
INFO:     127.0.0.1:56722 - "GET /designer/chat/stream?session_id=5c896f82-4310-4ae4-85ff-c7195ed7b36d HTTP/1.1" 200 OK
INFO:     127.0.0.1:53064 - "POST /designer/chat/message HTTP/1.1" 200 OK
INFO:     127.0.0.1:53080 - "GET /designer/chat/stream?session_id=5c896f82-4310-4ae4-85ff-c7195ed7b36d HTTP/1.1" 200 OK
INFO:     127.0.0.1:34852 - "POST /designer/chat/start HTTP/1.1" 200 OK
INFO:     127.0.0.1:34858 - "GET /designer/chat/stream?session_id=7078693b-292c-46a0-87ae-13bf052ed228 HTTP/1.1" 200 OK
INFO:     127.0.0.1:58618 - "POST /designer/chat/message HTTP/1.1" 200 OK
INFO:     127.0.0.1:58626 - "GET /designer/chat/stream?session_id=7078693b-292c-46a0-87ae-13bf052ed228 HTTP/1.1" 200 OK
INFO:     127.0.0.1:44602 - "POST /designer/chat/start HTTP/1.1" 200 OK
INFO:     127.0.0.1:44616 - "GET /designer/chat/stream?session_id=af7b1133-f409-45ef-9c83-bd5f6deccfea HTTP/1.1" 200 OK
2026-04-24 08:57:20 | INFO     | app.routers.course:start_course_planning_v2:403 - V2 course planning: course_id=%s, name=%s, context_type=%s, lang=%s
2026-04-24 08:57:20 | INFO     | app.routers.course:start_course_planning:258 - Starting course planning: Desarrollo de Interfaces, backend: huggingface
2026-04-24 08:57:20 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
INFO:     127.0.0.1:59778 - "POST /course/v2/start HTTP/1.1" 200 OK
INFO:     127.0.0.1:39292 - "GET /course/stream?session_id=393edf1d-3ebb-42db-8f5f-a9beb42f7c53 HTTP/1.1" 200 OK
2026-04-24 08:59:36 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
INFO:     127.0.0.1:44736 - "POST /course/message HTTP/1.1" 200 OK
INFO:     127.0.0.1:40532 - "GET /course/stream?session_id=393edf1d-3ebb-42db-8f5f-a9beb42f7c53 HTTP/1.1" 200 OK
INFO:     127.0.0.1:52268 - "POST /course/execute HTTP/1.1" 200 OK
2026-04-24 09:00:03 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 1: Arranque del Ecosistema Angular
2026-04-24 09:00:03 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Introducción a Angular
2026-04-24 09:00:03 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
INFO:     127.0.0.1:52270 - "GET /course/stream?session_id=393edf1d-3ebb-42db-8f5f-a9beb42f7c53 HTTP/1.1" 200 OK
2026-04-24 09:00:05 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1991ms
2026-04-24 09:00:05 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Introducción a Angular' generada con PageGenerator (page)
2026-04-24 09:00:05 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 2: Interfaces con librerías visuales
2026-04-24 09:00:05 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando resource: Angular Material y PrimeNG
2026-04-24 09:00:05 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:07 | INFO     | app.generators.base_generator:generate:179 - ✅ resource generado en 2538ms
2026-04-24 09:00:07 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Angular Material y PrimeNG' generada con ResourceGenerator (resource)
2026-04-24 09:00:07 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Maquetación del Panel Base
2026-04-24 09:00:07 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:09 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1816ms
2026-04-24 09:00:09 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Maquetación del Panel Base' generada con PageGenerator (page)
2026-04-24 09:00:09 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 3: Plantillas, datos y binding
2026-04-24 09:00:09 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Plantillas y Data Binding
2026-04-24 09:00:09 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:11 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 2233ms
2026-04-24 09:00:11 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Plantillas y Data Binding' generada con PageGenerator (page)
2026-04-24 09:00:11 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando assign: Interfaz Dinámica Conectada a Datos
2026-04-24 09:00:11 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:18 | INFO     | app.generators.base_generator:generate:179 - ✅ assign generado en 6841ms
2026-04-24 09:00:18 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Interfaz Dinámica Conectada a Datos' generada con AssignmentGenerator (assign)
2026-04-24 09:00:18 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 4: Arquitectura de componentes
2026-04-24 09:00:18 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando resource: Arquitectura Modular en Angular
2026-04-24 09:00:18 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:20 | INFO     | app.generators.base_generator:generate:179 - ✅ resource generado en 1805ms
2026-04-24 09:00:20 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Arquitectura Modular en Angular' generada con ResourceGenerator (resource)
2026-04-24 09:00:20 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Desarrollo de Componentes Reutilizables
2026-04-24 09:00:20 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:22 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1794ms
2026-04-24 09:00:22 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Desarrollo de Componentes Reutilizables' generada con PageGenerator (page)
2026-04-24 09:00:22 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando assign: Biblioteca de Componentes Reutilizables
2026-04-24 09:00:22 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:29 | INFO     | app.generators.base_generator:generate:179 - ✅ assign generado en 7099ms
2026-04-24 09:00:29 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Biblioteca de Componentes Reutilizables' generada con AssignmentGenerator (assign)
2026-04-24 09:00:29 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 5: Usabilidad, formularios y navegación
2026-04-24 09:00:29 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando resource: Usabilidad y Formularios Reactivos
2026-04-24 09:00:29 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:31 | INFO     | app.generators.base_generator:generate:179 - ✅ resource generado en 2196ms
2026-04-24 09:00:31 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Usabilidad y Formularios Reactivos' generada con ResourceGenerator (resource)
2026-04-24 09:00:31 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Flujo Funcional Completo
2026-04-24 09:00:31 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:33 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1995ms
2026-04-24 09:00:33 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Flujo Funcional Completo' generada con PageGenerator (page)
2026-04-24 09:00:33 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando assign: Flujo Usable de Gestión
2026-04-24 09:00:33 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:39 | INFO     | app.generators.base_generator:generate:179 - ✅ assign generado en 5718ms
2026-04-24 09:00:39 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Flujo Usable de Gestión' generada con AssignmentGenerator (assign)
2026-04-24 09:00:39 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 6: Informes y visualización de datos
2026-04-24 09:00:39 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando resource: Informes y Visualización de Datos
2026-04-24 09:00:39 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:41 | INFO     | app.generators.base_generator:generate:179 - ✅ resource generado en 2381ms
2026-04-24 09:00:41 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Informes y Visualización de Datos' generada con ResourceGenerator (resource)
2026-04-24 09:00:41 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Dashboard con Gráficos
2026-04-24 09:00:41 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:43 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1782ms
2026-04-24 09:00:43 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Dashboard con Gráficos' generada con PageGenerator (page)
2026-04-24 09:00:43 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando assign: Exportación de Informe
2026-04-24 09:00:43 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:49 | INFO     | app.generators.base_generator:generate:179 - ✅ assign generado en 6474ms
2026-04-24 09:00:49 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Exportación de Informe' generada con AssignmentGenerator (assign)
2026-04-24 09:00:49 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 7: Documentación técnica
2026-04-24 09:00:49 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando resource: Documentación Técnica
2026-04-24 09:00:49 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:52 | INFO     | app.generators.base_generator:generate:179 - ✅ resource generado en 2783ms
2026-04-24 09:00:52 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Documentación Técnica' generada con ResourceGenerator (resource)
2026-04-24 09:00:52 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Documentación con Compodoc o Storybook
2026-04-24 09:00:52 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:54 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1638ms
2026-04-24 09:00:54 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Documentación con Compodoc o Storybook' generada con PageGenerator (page)
2026-04-24 09:00:54 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 8: Distribución y despliegue
2026-04-24 09:00:54 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando resource: Distribución y Despliegue
2026-04-24 09:00:54 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:57 | INFO     | app.generators.base_generator:generate:179 - ✅ resource generado en 2938ms
2026-04-24 09:00:57 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Distribución y Despliegue' generada con ResourceGenerator (resource)
2026-04-24 09:00:57 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Build Optimizada y Despliegue
2026-04-24 09:00:57 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:00:58 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1635ms
2026-04-24 09:00:58 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Build Optimizada y Despliegue' generada con PageGenerator (page)
2026-04-24 09:00:58 | INFO     | app.routers.course:_execute_course_generation:824 - Generando contenido para sección 9: Testing y calidad
2026-04-24 09:00:58 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando resource: Pruebas Unitarias y E2E
2026-04-24 09:00:58 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:01:02 | INFO     | app.generators.base_generator:generate:179 - ✅ resource generado en 3455ms
2026-04-24 09:01:02 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Pruebas Unitarias y E2E' generada con ResourceGenerator (resource)
2026-04-24 09:01:02 | INFO     | app.generators.base_generator:generate:157 - 🔧 Generando page: Suite de Pruebas y Pipeline de Validación
2026-04-24 09:01:02 | INFO     | app.services.huggingface_service:generate_text:177 - Generando texto con HF modelo: Qwen/Qwen2.5-7B-Instruct (modo chat)
2026-04-24 09:01:04 | INFO     | app.generators.base_generator:generate:179 - ✅ page generado en 1999ms
2026-04-24 09:01:04 | INFO     | app.routers.course:generate_activity_content:751 - ✅ Actividad 'Suite de Pruebas y Pipeline de Validación' generada con PageGenerator (page)
INFO:     127.0.0.1:58262 - "GET /course/result?session_id=393edf1d-3ebb-42db-8f5f-a9beb42f7c53 HTTP/1.1" 200 OK
2026-04-24 09:01:08 | WARNING  | app.main:download_file:317 - File not found: /home/birt/moodle-course-generator/output
INFO:     127.0.0.1:44466 - "GET /files/download?path= HTTP/1.1" 404 Not Found
2026-04-24 09:01:08 | WARNING  | app.main:download_file:317 - File not found: /home/birt/moodle-course-generator/output
INFO:     127.0.0.1:44480 - "GET /files/download?path= HTTP/1.1" 404 Not Found
2026-04-24 09:01:08 | WARNING  | app.main:download_file:317 - File not found: /home/birt/moodle-course-generator/output
INFO:     127.0.0.1:44490 - "GET /files/download?path= HTTP/1.1" 404 Not Found
2026-04-24 09:01:08 | WARNING  | app.main:download_file:317 - File not found: /home/birt/moodle-course-generator/output
INFO:     127.0.0.1:44502 - "GET /files/download?path= HTTP/1.1" 404 Not Found
2026-04-24 09:01:08 | WARNING  | app.main:download_file:317 - File not found: /home/birt/moodle-course-generator/output
INFO:     127.0.0.1:44516 - "GET /files/download?path= HTTP/1.1" 404 Not Found
2026-04-24 09:01:08 | WARNING  | app.main:download_file:317 - File not found: /home/birt/moodle-course-generator/output
INFO:     127.0.0.1:44532 - "GET /files/download?path= HTTP/1.1" 404 Not Found
2026-04-24 09:01:08 | WARNING  | app.main:download_file:317 - File not found: /home/birt/moodle-course-generator/output
INFO:     127.0.0.1:44536 - "GET /files/download?path= HTTP/1.1" 404 Not Found