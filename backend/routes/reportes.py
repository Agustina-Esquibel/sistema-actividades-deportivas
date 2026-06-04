from flask import Blueprint, jsonify
from database import get_connection

reportes_bp = Blueprint('reportes', __name__)

# 1. Actividades con mayor cantidad de inscriptos confirmados
@reportes_bp.route('/reportes/inscriptos-por-actividad', methods=['GET'])
def inscriptos_por_actividad():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad,
               COUNT(i.id_inscripcion) AS total_confirmados
        FROM actividad a
        LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                               AND i.estado = 'confirmada'
        GROUP BY a.id_actividad, a.nombre
        ORDER BY total_confirmados DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 2. Actividades con cupos disponibles
@reportes_bp.route('/reportes/cupos-disponibles', methods=['GET'])
def cupos_disponibles():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad, a.cupo_maximo,
               COUNT(i.id_inscripcion) AS confirmados,
               a.cupo_maximo - COUNT(i.id_inscripcion) AS cupos_disponibles
        FROM actividad a
        LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                               AND i.estado = 'confirmada'
        WHERE a.estado = 'abierta'
        GROUP BY a.id_actividad, a.nombre, a.cupo_maximo
        HAVING cupos_disponibles > 0
        ORDER BY cupos_disponibles DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 3. Cantidad de inscriptos por disciplina
@reportes_bp.route('/reportes/inscriptos-por-disciplina', methods=['GET'])
def inscriptos_por_disciplina():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT d.nombre AS disciplina,
               COUNT(i.id_inscripcion) AS total_inscriptos
        FROM disciplina d
        LEFT JOIN actividad a   ON d.id_disciplina = a.id_disciplina
        LEFT JOIN inscripcion i ON a.id_actividad  = i.id_actividad
                               AND i.estado = 'confirmada'
        GROUP BY d.id_disciplina, d.nombre
        ORDER BY total_inscriptos DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 4. Cantidad de inscriptos por carrera y facultad
@reportes_bp.route('/reportes/inscriptos-por-carrera', methods=['GET'])
def inscriptos_por_carrera():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.facultad, e.carrera,
               COUNT(i.id_inscripcion) AS total_inscriptos
        FROM estudiante e
        LEFT JOIN inscripcion i ON e.id_estudiante = i.id_estudiante
                               AND i.estado = 'confirmada'
        GROUP BY e.facultad, e.carrera
        ORDER BY e.facultad, total_inscriptos DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 5. Porcentaje de ocupación por actividad
@reportes_bp.route('/reportes/ocupacion', methods=['GET'])
def ocupacion():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.id_actividad, a.nombre AS actividad, a.cupo_maximo,
               COUNT(i.id_inscripcion) AS confirmados,
               ROUND(COUNT(i.id_inscripcion) * 100.0 / a.cupo_maximo, 1) AS porcentaje_ocupacion
        FROM actividad a
        LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                               AND i.estado = 'confirmada'
        GROUP BY a.id_actividad, a.nombre, a.cupo_maximo
        ORDER BY porcentaje_ocupacion DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 6. Porcentaje de asistencia por actividad
@reportes_bp.route('/reportes/asistencia', methods=['GET'])
def asistencia():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad,
               COUNT(ast.id_asistencia) AS clases_registradas,
               SUM(ast.presente) AS presentes,
               ROUND(SUM(ast.presente) * 100.0 / NULLIF(COUNT(ast.id_asistencia), 0), 1) AS porcentaje_asistencia
        FROM actividad a
        JOIN inscripcion i  ON a.id_actividad   = i.id_actividad
                           AND i.estado         = 'confirmada'
        JOIN asistencia ast ON i.id_inscripcion = ast.id_inscripcion
        GROUP BY a.id_actividad, a.nombre
        ORDER BY porcentaje_asistencia DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 7. Estudiantes con 3 o más inasistencias
@reportes_bp.route('/reportes/inasistencias', methods=['GET'])
def inasistencias():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.nombre, e.apellido, a.nombre AS actividad,
               COUNT(ast.id_asistencia) AS total_inasistencias
        FROM estudiante e
        JOIN inscripcion i  ON e.id_estudiante  = i.id_estudiante
        JOIN actividad a    ON i.id_actividad   = a.id_actividad
        JOIN asistencia ast ON i.id_inscripcion = ast.id_inscripcion
        WHERE ast.presente = FALSE
        GROUP BY e.id_estudiante, e.nombre, e.apellido, a.id_actividad, a.nombre
        HAVING total_inasistencias >= 3
        ORDER BY total_inasistencias DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 8. Estudiantes en lista de espera por actividad
@reportes_bp.route('/reportes/lista-espera', methods=['GET'])
def lista_espera():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad, e.nombre, e.apellido,
               i.fecha_inscripcion AS fecha_en_espera
        FROM inscripcion i
        JOIN estudiante e ON i.id_estudiante = e.id_estudiante
        JOIN actividad  a ON i.id_actividad  = a.id_actividad
        WHERE i.estado = 'en_espera'
        ORDER BY a.nombre, i.fecha_inscripcion ASC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 9. Ranking de estudiantes más activos
@reportes_bp.route('/reportes/estudiantes-activos', methods=['GET'])
def estudiantes_activos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.nombre, e.apellido, e.carrera,
               COUNT(i.id_inscripcion) AS actividades_confirmadas
        FROM estudiante e
        JOIN inscripcion i ON e.id_estudiante = i.id_estudiante
                          AND i.estado = 'confirmada'
        GROUP BY e.id_estudiante, e.nombre, e.apellido, e.carrera
        ORDER BY actividades_confirmadas DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)

# 10. Actividades sin inscriptos confirmados
@reportes_bp.route('/reportes/actividades-vacias', methods=['GET'])
def actividades_vacias():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad, d.nombre AS disciplina,
               a.estado, a.dia, a.horario
        FROM actividad a
        JOIN disciplina d ON a.id_disciplina = d.id_disciplina
        WHERE a.id_actividad NOT IN (
            SELECT DISTINCT id_actividad FROM inscripcion
            WHERE estado = 'confirmada'
        )
        ORDER BY a.nombre
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)