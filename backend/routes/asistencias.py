from flask import Blueprint, jsonify, request
from database import get_connection

asistencias_bp = Blueprint('asistencias', __name__)

# GET - obtener asistencias de una actividad en una fecha
@asistencias_bp.route('/actividades/<int:id_actividad>/asistencias', methods=['GET'])
def get_asistencias(id_actividad):
    fecha = request.args.get('fecha')
    if not fecha:
        return jsonify({'error': 'La fecha es obligatoria'}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.id_asistencia, a.fecha, a.presente,
               e.nombre, e.apellido, e.documento,
               i.id_inscripcion, i.estado AS estado_inscripcion
        FROM inscripcion i
        JOIN estudiante e  ON i.id_estudiante  = e.id_estudiante
        LEFT JOIN asistencia a ON i.id_inscripcion = a.id_inscripcion
                              AND a.fecha = %s
        WHERE i.id_actividad = %s
          AND i.estado = 'confirmada'
        ORDER BY e.apellido, e.nombre
    """, (fecha, id_actividad))
    asistencias = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(asistencias)

# POST - registrar asistencia
@asistencias_bp.route('/asistencias', methods=['POST'])
def registrar_asistencia():
    data = request.get_json()
    id_inscripcion = data.get('id_inscripcion')
    fecha          = data.get('fecha')
    presente       = data.get('presente', False)

    if not id_inscripcion or not fecha:
        return jsonify({'error': 'id_inscripcion y fecha son obligatorios'}), 400

    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Regla 5: verificar que la inscripción esté confirmada
    cursor.execute("""
        SELECT * FROM inscripcion WHERE id_inscripcion = %s
    """, (id_inscripcion,))
    inscripcion = cursor.fetchone()

    if not inscripcion:
        cursor.close(); conn.close()
        return jsonify({'error': 'Inscripción no encontrada'}), 404

    if inscripcion['estado'] != 'confirmada':
        cursor.close(); conn.close()
        return jsonify({'error': 'Solo se puede registrar asistencia de estudiantes confirmados'}), 400

    try:
        # INSERT OR UPDATE — si ya existe la asistencia ese día, la actualiza
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO asistencia (id_inscripcion, fecha, presente)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE presente = %s
        """, (id_inscripcion, fecha, presente, presente))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Asistencia registrada'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400