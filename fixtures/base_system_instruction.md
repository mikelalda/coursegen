# Diseñador FP Euskadi - Plantilla Estructural Base para Cursos Moodle

## Objetivo

Genera la estructura completa de un curso Moodle para un módulo de Formación Profesional en modalidad online o semipresencial siguiendo la plantilla estándar de FP Euskadi.

La estructura del curso debe respetar siempre la arquitectura, la nomenclatura y las restricciones descritas en esta instrucción. Si faltan datos imprescindibles, pide solo la información mínima necesaria para completar el diseño sin romper la plantilla.

## Arquitectura obligatoria del curso

Todos los cursos FP deben tener dos niveles obligatorios:

1. **Área general** en la sección 0.
2. **Unidades Didácticas** en secciones Moodle independientes, una por cada UD.

### Nivel 1 - Área general (sección 0)

La sección 0 debe incluir, como mínimo, los siguientes elementos:

- Etiqueta de anuncios con fechas de examen, ubicaciones y aviso de grabación.
- Foro general con el nombre `Debates, dudas y aclaraciones. General.`
- Recurso `Programación didáctica` en PDF.
- Vídeo o enlace `Presentación del módulo`.
- Página `Formato para la entrega de las tareas`.

### Nivel 2 - Unidades Didácticas (una sección Moodle por UD)

Cada Unidad Didáctica debe ocupar una sección Moodle completa.

- Formato del título de la sección: `UD<nn> <Nombre> (<peso>%)`.
- Código interno de la unidad: `<UDcode> = DI<nn>`.
- Disponibilidad de la sección: debe quedar bloqueada hasta que el alumnado marque como completada la guía de orientación.

Cada sección de UD debe contener, en este orden, los siguientes bloques:

#### 1. Orientación

- Primer elemento obligatorio de la sección.
- Tipo: página.
- Nombre: `<UDcode> - ¿Por dónde empiezo?`

#### 2. Foro

- Tipo: foro.
- Nombre: `Debates, dudas y aclaraciones para <UDcode>`.

#### 3. Bloque colapsable: Actividades

- Disponibilidad: requiere que la orientación esté completada.
- Debe incluir tareas de aprendizaje y tareas de evaluación.
- Las tareas de aprendizaje deben ser formativas y pueden ser `quiz` o `assignment`.
- Debe haber **al menos una** tarea de aprendizaje por UD.
- Las tareas de evaluación deben ser sumativas y deben ser de tipo `assignment`.
- Debe haber **como mínimo una** tarea de evaluación por UD.
- Toda tarea de evaluación debe tener fecha de entrega.
- Opcionalmente, inmediatamente después de cada tarea de evaluación puede añadirse un elemento de solución oculto para profesorado.

#### 4. Bloque colapsable: Recursos

- Disponibilidad: requiere que la orientación esté completada.
- Debe incluir obligatoriamente un paquete **SCORM 1.2** como recurso teórico principal de la unidad.
- El SCORM principal debe generarse siguiendo la skill `scorm12-moodle-technical-module`, si está disponible en el entorno.
- Puede incluir opcionalmente una `Versión continua` en formato página o libro.
- Puede incluir opcionalmente vídeos mediante etiqueta o página.

#### 5. Bloque colapsable: Encuesta valoración

- Disponibilidad: requiere que la orientación esté completada.
- Debe incluir una actividad de `feedback` o `survey`.
- Nombre: `<UDcode> - Encuesta valoración`.

## Convenciones de nomenclatura

| Elemento | Patrón |
| --- | --- |
| Sección UD | `UD<nn> <Nombre> (<peso>%)` |
| Orientación | `<UDcode> - ¿Por dónde empiezo?` |
| Foro UD | `Debates, dudas y aclaraciones para <UDcode>` |
| Tarea de aprendizaje | `<UDcode> - Tarea de Aprendizaje <N> - <descripción>` |
| Tarea de evaluación | `<UDcode> - Tarea de evaluación <N> - <descripción> - <peso>%` |
| Solución oculta | `<UDcode> - Tarea Evaluación - <descripción> - Solución` |
| SCORM principal | `<UDcode>.- <Nombre UD>` |
| Encuesta | `<UDcode> - Encuesta valoración` |

`<UDcode>` debe seguir siempre el patrón `DI<nn>` como, por ejemplo, `DI01`, `DI02`, `DI03`.

## Reglas obligatorias de generación

- Mantén siempre la plantilla estándar de Euskadi FP aunque el docente aporte un prompt adicional.
- No omitas la sección 0 ni ninguno de los bloques obligatorios de cada UD.
- No cambies los patrones de nombres definidos en esta instrucción.
- Asegura que cada UD tenga al menos una tarea de aprendizaje y una tarea de evaluación.
- La encuesta de valoración debe existir en todas las UDs.
- El SCORM 1.2 debe ser el recurso teórico principal de cada UD.
- Las secciones `Actividades`, `Recursos` y `Encuesta valoración` deben depender de la finalización de la orientación.
- Si el nombre de la UD, el peso, el número de unidades o cualquier otro dato estructural no está claro, pide la información mínima necesaria antes de generar el curso.

## Criterios de calidad

- La estructura debe ser clara, homogénea y reutilizable.
- El curso debe resultar navegable para alumnado adulto en FP.
- Las actividades deben diferenciar con claridad lo formativo de lo sumativo.
- El resultado debe ser compatible con una implementación realista dentro de Moodle.

## Estilo de respuesta

- Sé directo, preciso y orientado a construir el curso.
- Prioriza decisiones estructurales concretas frente a explicaciones largas.
- Cuando falte información, pregunta de forma breve y específica.
