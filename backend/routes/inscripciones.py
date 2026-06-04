from flask import Blueprint, jsonify, request
from database import get_connection

inscripciones_bp = Blueprint('inscripciones', __name__)

# GET - inscripciones de una actividad
@inscripciones_bp.route('/actividades/<int:id_actividad>/inscripciones', methods=['GET'])
def get_inscripciones(id_actividad):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT i.*, e.nombre, e.apellido, e.documento, e.email
        FROM inscripcion i
        JOIN estudiante e ON i.id_estudiante = e.id_estudiante
        WHERE i.id_actividad = %s
        ORDER BY i.estado, i.fecha_inscripcion
    """, (id_actividad,))
    inscripciones = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(inscripciones)

# GET - inscripciones de un estudiante
@inscripciones_bp.route('/estudiantes/<int:id_estudiante>/inscripciones', methods=['GET'])
def get_inscripciones_estudiante(id_estudiante):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT i.*, a.nombre AS actividad, a.dia, a.horario, a.estado AS estado_actividad
        FROM inscripcion i
        JOIN actividad a ON i.id_actividad = a.id_actividad
        WHERE i.id_estudiante = %s
        ORDER BY i.fecha_inscripcion DESC
    """, (id_estudiante,))
    inscripciones = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(inscripciones)

# POST - inscribir estudiante
@inscripciones_bp.route('/inscripciones', methods=['POST'])
def create_inscripcion():
    data = request.get_json()
    id_estudiante = data.get('id_estudiante')
    id_actividad  = data.get('id_actividad')

    if not id_estudiante or not id_actividad:
        return jsonify({'error': 'id_estudiante e id_actividad son obligatorios'}), 400

    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Regla 1 y 6: actividad debe estar abierta
    cursor.execute("SELECT * FROM actividad WHERE id_actividad = %s", (id_actividad,))
    actividad = cursor.fetchone()
    if not actividad:
        cursor.close(); conn.close()
        return jsonify({'error': 'Actividad no encontrada'}), 404
    if actividad['estado'] != 'abierta':
        cursor.close(); conn.close()
        return jsonify({'error': 'Solo se puede inscribir en actividades abiertas'}), 400

    # Regla 4: no inscribirse dos veces
    cursor.execute("""
        SELECT * FROM inscripcion
        WHERE id_estudiante = %s AND id_actividad = %s
    """, (id_estudiante, id_actividad))
    if cursor.fetchone():
        cursor.close(); conn.close()
        return jsonify({'error': 'El estudiante ya está inscripto en esta actividad'}), 400

    # Reglas 2 y 3: cupo disponible o lista de espera
    cursor.execute("""
        SELECT COUNT(*) AS confirmados FROM inscripcion
        WHERE id_actividad = %s AND estado = 'confirmada'
    """, (id_actividad,))
    confirmados = cursor.fetchone()['confirmados']
    estado = 'confirmada' if confirmados < actividad['cupo_maximo'] else 'en_espera'

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO inscripcion (id_estudiante, id_actividad, estado)
        VALUES (%s, %s, %s)
    """, (id_estudiante, id_actividad, estado))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'mensaje': f'Inscripción {estado}', 'estado': estado}), 201

# DELETE - cancelar inscripción y promover lista de espera
@inscripciones_bp.route('/inscripciones/<int:id>', methods=['DELETE'])
def delete_inscripcion(id):
    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Verificar que existe
        cursor.execute("SELECT * FROM inscripcion WHERE id_inscripcion = %s", (id,))
        inscripcion = cursor.fetchone()
        if not inscripcion:
            cursor.close(); conn.close()
            return jsonify({'error': 'Inscripción no encontrada'}), 404

        era_confirmada = inscripcion['estado'] == 'confirmada'
        id_actividad   = inscripcion['id_actividad']

        # Borrar
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inscripcion WHERE id_inscripcion = %s", (id,))
        conn.commit()

        # Si era confirmada, promover al primero en espera
        if era_confirmada:
            cursor.execute("""
                SELECT id_inscripcion FROM inscripcion
                WHERE id_actividad = %s AND estado = 'en_espera'
                ORDER BY fecha_inscripcion ASC
                LIMIT 1
            """, (id_actividad,))
            siguiente = cursor.fetchone()
            if siguiente:
                cursor.execute("""
                    UPDATE inscripcion SET estado = 'confirmada'
                    WHERE id_inscripcion = %s
                """, (siguiente[0],))
                conn.commit()

        cursor.close(); conn.close()
        return jsonify({'mensaje': 'Inscripción cancelada'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400