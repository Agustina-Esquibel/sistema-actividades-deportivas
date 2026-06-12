from flask import Blueprint, jsonify
from database import get_connection

dashboard_bp = Blueprint('dashboard', __name__)


# Gráfico 1: inscriptos confirmados vs cupo máximo por actividad
@dashboard_bp.route('/dashboard/inscriptos-vs-cupo', methods=['GET'])
def inscriptos_vs_cupo():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad,
               a.cupo_maximo,
               COUNT(i.id_inscripcion) AS confirmados
        FROM actividad a
        LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                               AND i.estado = 'confirmada'
        GROUP BY a.id_actividad, a.nombre, a.cupo_maximo
        ORDER BY confirmados DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)


# Gráfico 2: porcentaje de asistencia por actividad
@dashboard_bp.route('/dashboard/asistencia-por-actividad', methods=['GET'])
def asistencia_por_actividad():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad,
               COALESCE(ROUND(
                   SUM(ast.presente) * 100.0 / NULLIF(COUNT(ast.id_asistencia), 0)
               , 1), 0) AS porcentaje_asistencia
        FROM actividad a
        LEFT JOIN inscripcion i  ON a.id_actividad   = i.id_actividad
                                AND i.estado         = 'confirmada'
        LEFT JOIN asistencia ast ON i.id_inscripcion = ast.id_inscripcion
        GROUP BY a.id_actividad, a.nombre
        ORDER BY porcentaje_asistencia DESC
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)


# Gauge: % de ocupación promedio de todas las actividades abiertas
@dashboard_bp.route('/dashboard/ocupacion-promedio', methods=['GET'])
def ocupacion_promedio():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT ROUND(AVG(confirmados * 100.0 / cupo_maximo), 1) AS porcentaje
        FROM (
            SELECT a.id_actividad, a.cupo_maximo,
                   COUNT(i.id_inscripcion) AS confirmados
            FROM actividad a
            LEFT JOIN inscripcion i ON a.id_actividad = i.id_actividad
                                   AND i.estado       = 'confirmada'
            WHERE a.estado = 'abierta'
            GROUP BY a.id_actividad, a.cupo_maximo
        ) sub
    """)
    resultado = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(resultado)


# Heatmap: % de asistencia por actividad y día de la semana (Lun–Sáb)
# DAYOFWEEK: 1=Dom, 2=Lun, 3=Mar, 4=Mié, 5=Jue, 6=Vie, 7=Sáb
@dashboard_bp.route('/dashboard/heatmap-asistencia', methods=['GET'])
def heatmap_asistencia():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.nombre AS actividad,
               ROUND(AVG(CASE WHEN DAYOFWEEK(ast.fecha) = 2 THEN ast.presente ELSE NULL END) * 100, 1) AS lunes,
               ROUND(AVG(CASE WHEN DAYOFWEEK(ast.fecha) = 3 THEN ast.presente ELSE NULL END) * 100, 1) AS martes,
               ROUND(AVG(CASE WHEN DAYOFWEEK(ast.fecha) = 4 THEN ast.presente ELSE NULL END) * 100, 1) AS miercoles,
               ROUND(AVG(CASE WHEN DAYOFWEEK(ast.fecha) = 5 THEN ast.presente ELSE NULL END) * 100, 1) AS jueves,
               ROUND(AVG(CASE WHEN DAYOFWEEK(ast.fecha) = 6 THEN ast.presente ELSE NULL END) * 100, 1) AS viernes,
               ROUND(AVG(CASE WHEN DAYOFWEEK(ast.fecha) = 7 THEN ast.presente ELSE NULL END) * 100, 1) AS sabado
        FROM actividad a
        LEFT JOIN inscripcion i  ON a.id_actividad   = i.id_actividad
                                AND i.estado         = 'confirmada'
        LEFT JOIN asistencia ast ON i.id_inscripcion = ast.id_inscripcion
        GROUP BY a.id_actividad, a.nombre
        ORDER BY a.nombre
    """)
    resultado = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resultado)
