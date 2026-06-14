-- Sistema de Gestión de Actividades Deportivas Universitarias
-- Consultas SQL requeridas y propuestas por el equipo


-- Consulta 1: Actividades con mayor cantidad de inscriptos confirmados
-- Muestra todas las actividades ordenadas de mayor a menor según la cantidad de estudiantes con inscripción confirmada.
SELECT a.nombre AS actividad,
       COUNT(i.id_inscripcion) AS total_confirmados
FROM actividad a
LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                       AND i.estado = 'confirmada'
GROUP BY a.id_actividad, a.nombre
ORDER BY total_confirmados DESC;


-- Consulta 2: Actividades abiertas con cupos disponibles
-- Muestra únicamente actividades en estado 'abierta' que aún tienen lugares libres, junto con la cantidad de cupos restantes.
SELECT a.nombre AS actividad,
       a.cupo_maximo,
       COUNT(i.id_inscripcion) AS confirmados,
       a.cupo_maximo - COUNT(i.id_inscripcion) AS cupos_disponibles
FROM actividad a
LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                       AND i.estado = 'confirmada'
WHERE a.estado = 'abierta'
GROUP BY a.id_actividad, a.nombre, a.cupo_maximo
HAVING cupos_disponibles > 0
ORDER BY cupos_disponibles DESC;


-- Consulta 3: Cantidad de inscriptos confirmados por disciplina
-- Agrupa los inscriptos según el tipo de deporte, incluyendo disciplinas sin inscriptos con total 0.
SELECT d.nombre AS disciplina,
       COUNT(i.id_inscripcion) AS total_inscriptos
FROM disciplina d
LEFT JOIN actividad a   ON d.id_disciplina = a.id_disciplina
LEFT JOIN inscripcion i ON a.id_actividad  = i.id_actividad
                       AND i.estado = 'confirmada'
GROUP BY d.id_disciplina, d.nombre
ORDER BY total_inscriptos DESC;


-- Consulta 4: Cantidad de inscriptos confirmados por carrera y facultad
-- Permite identificar qué áreas de la universidad tienen mayor participación en las actividades deportivas.
SELECT e.facultad,
       e.carrera,
       COUNT(i.id_inscripcion) AS total_inscriptos
FROM estudiante e
LEFT JOIN inscripcion i ON e.id_estudiante = i.id_estudiante
                       AND i.estado = 'confirmada'
GROUP BY e.facultad, e.carrera
ORDER BY e.facultad, total_inscriptos DESC;


-- Consulta 5: Porcentaje de ocupación de cada actividad
-- Calcula qué porcentaje del cupo máximo está ocupado por inscripciones confirmadas.
SELECT a.nombre AS actividad,
       a.cupo_maximo,
       COUNT(i.id_inscripcion) AS confirmados,
       ROUND(COUNT(i.id_inscripcion) * 100.0 / a.cupo_maximo, 1) AS porcentaje_ocupacion
FROM actividad a
LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                       AND i.estado = 'confirmada'
GROUP BY a.id_actividad, a.nombre, a.cupo_maximo
ORDER BY porcentaje_ocupacion DESC;


-- Consulta 6: Porcentaje de asistencia por actividad
-- Calcula el porcentaje de presencia sobre el total de registros. Las actividades sin registros aparecen con 0%.
SELECT a.nombre AS actividad,
       COUNT(ast.id_asistencia) AS clases_registradas,
       COALESCE(SUM(ast.presente), 0) AS presentes,
       COALESCE(ROUND(SUM(ast.presente) * 100.0 / NULLIF(COUNT(ast.id_asistencia), 0), 1), 0) AS porcentaje_asistencia
FROM actividad a
LEFT JOIN inscripcion i  ON a.id_actividad   = i.id_actividad
                        AND i.estado         = 'confirmada'
LEFT JOIN asistencia ast ON i.id_inscripcion = ast.id_inscripcion
GROUP BY a.id_actividad, a.nombre
ORDER BY porcentaje_asistencia DESC;


-- Consulta 7: Estudiantes con tres o más inasistencias registradas
-- Muestra los estudiantes que acumularon 3 o más ausencias en una misma actividad.
SELECT e.nombre,
       e.apellido,
       a.nombre AS actividad,
       COUNT(ast.id_asistencia) AS total_inasistencias
FROM estudiante e
JOIN inscripcion i  ON e.id_estudiante  = i.id_estudiante
JOIN actividad a    ON i.id_actividad   = a.id_actividad
JOIN asistencia ast ON i.id_inscripcion = ast.id_inscripcion
WHERE ast.presente = FALSE
GROUP BY e.id_estudiante, e.nombre, e.apellido, a.id_actividad, a.nombre
HAVING total_inasistencias >= 3
ORDER BY total_inasistencias DESC;


-- Consultas adicionales propuestas por el equipo


-- Consulta 8: Lista de espera por actividad
-- Muestra qué estudiantes están esperando un cupo en cada actividad y desde qué fecha, ordenados cronológicamente.
SELECT a.nombre AS actividad,
       e.nombre,
       e.apellido,
       i.fecha_inscripcion AS fecha_en_espera
FROM inscripcion i
JOIN estudiante e ON i.id_estudiante = e.id_estudiante
JOIN actividad  a ON i.id_actividad  = a.id_actividad
WHERE i.estado = 'en_espera'
ORDER BY a.nombre, i.fecha_inscripcion ASC;


-- Consulta 9: Ranking de estudiantes más activos
-- Identifica los estudiantes con mayor cantidad de actividades confirmadas.
SELECT e.nombre,
       e.apellido,
       e.carrera,
       COUNT(i.id_inscripcion) AS actividades_confirmadas
FROM estudiante e
JOIN inscripcion i ON e.id_estudiante = i.id_estudiante
                  AND i.estado = 'confirmada'
GROUP BY e.id_estudiante, e.nombre, e.apellido, e.carrera
ORDER BY actividades_confirmadas DESC;


-- Consulta 10: Actividades sin inscriptos confirmados
-- Lista las actividades sin ningún inscripto confirmado para detectar actividades sin demanda real.
SELECT a.nombre AS actividad,
       d.nombre AS disciplina,
       a.estado,
       a.dia,
       a.horario
FROM actividad a
JOIN disciplina d ON a.id_disciplina = d.id_disciplina
WHERE a.id_actividad NOT IN (
    SELECT DISTINCT id_actividad
    FROM inscripcion
    WHERE estado = 'confirmada'
)
ORDER BY a.nombre;


-- Consultas de validación de negocio


-- Consulta 11: Verificar conflicto de espacio al crear una actividad
-- Detecta si ya existe una actividad que usa el mismo espacio físico en el mismo día y horario.
-- Se utiliza antes de insertar una nueva actividad para evitar solapamientos de espacio.
SELECT nombre
FROM actividad
WHERE id_espacio = :id_espacio
  AND dia        = :dia
  AND horario    = :horario;


-- Consulta 12: Verificar conflicto de horario de un estudiante al inscribirse
-- Detecta si el estudiante ya tiene una inscripción confirmada en otra actividad
-- que coincida en día y horario con la actividad a la que intenta inscribirse.
-- Se utiliza antes de confirmar una inscripción para evitar superposición de horarios.
SELECT a.nombre AS actividad_conflicto
FROM inscripcion i
JOIN actividad a ON i.id_actividad = a.id_actividad
WHERE i.id_estudiante = :id_estudiante
  AND i.estado        = 'confirmada'
  AND a.dia           = :dia
  AND a.horario       = :horario
  AND i.id_actividad != :id_actividad;