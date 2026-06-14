from flask import Blueprint, jsonify, request
from database import get_connection

actividades_bp = Blueprint('actividades', __name__)

def formatear_actividad(a):
    """Convierte timedelta a string legible en el campo horario"""
    if a and 'horario' in a:
        h = a['horario']
        if hasattr(h, 'seconds'):
            total = h.seconds
            horas   = total // 3600
            minutos = (total % 3600) // 60
            a['horario'] = f"{horas:02d}:{minutos:02d}"
    return a

# GET - obtener todas las actividades
@actividades_bp.route('/actividades', methods=['GET'])
def get_actividades():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.*, d.nombre AS disciplina, e.nombre AS espacio
        FROM actividad a
        JOIN disciplina d ON a.id_disciplina = d.id_disciplina
        JOIN espacio e    ON a.id_espacio    = e.id_espacio
        ORDER BY a.nombre
    """)
    actividades = [formatear_actividad(a) for a in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(actividades)

# GET - obtener una actividad por id
@actividades_bp.route('/actividades/<int:id>', methods=['GET'])
def get_actividad(id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.*, d.nombre AS disciplina, e.nombre AS espacio
        FROM actividad a
        JOIN disciplina d ON a.id_disciplina = d.id_disciplina
        JOIN espacio e    ON a.id_espacio    = e.id_espacio
        WHERE a.id_actividad = %s
    """, (id,))
    actividad = formatear_actividad(cursor.fetchone())
    cursor.close()
    conn.close()
    if not actividad:
        return jsonify({'error': 'Actividad no encontrada'}), 404
    return jsonify(actividad)

# POST - crear una actividad nueva
@actividades_bp.route('/actividades', methods=['POST'])
def create_actividad():
    data = request.get_json()

    campos = ['nombre', 'id_disciplina', 'id_espacio', 'cupo_maximo', 'dia', 'horario']
    for campo in campos:
        if not data.get(campo):
            return jsonify({'error': f'El campo {campo} es obligatorio'}), 400

    if int(data['cupo_maximo']) <= 0:
        return jsonify({'error': 'El cupo máximo debe ser mayor a cero'}), 400

    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Conflicto de espacio: mismo espacio, día y horario
        cursor.execute("""
            SELECT nombre FROM actividad
            WHERE id_espacio = %s AND dia = %s AND horario = %s
        """, (data['id_espacio'], data['dia'].strip(), data['horario']))
        conflicto = cursor.fetchone()
        if conflicto:
            cursor.close(); conn.close()
            return jsonify({'error': f"El espacio ya está ocupado por \"{conflicto['nombre']}\" ese día y horario"}), 409

        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO actividad (nombre, id_disciplina, id_espacio, cupo_maximo, dia, horario, estado)
            VALUES (%s, %s, %s, %s, %s, %s, 'abierta')
        """, (
            data['nombre'].strip(),
            data['id_disciplina'],
            data['id_espacio'],
            data['cupo_maximo'],
            data['dia'].strip(),
            data['horario']
        ))
        conn.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Actividad creada', 'id': nuevo_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# PUT - editar una actividad
@actividades_bp.route('/actividades/<int:id>', methods=['PUT'])
def update_actividad(id):
    data = request.get_json()

    campos = ['nombre', 'id_disciplina', 'id_espacio', 'cupo_maximo', 'dia', 'horario', 'estado']
    for campo in campos:
        if not data.get(campo):
            return jsonify({'error': f'El campo {campo} es obligatorio'}), 400

    estados_validos = ['abierta', 'cerrada', 'finalizada', 'cancelada']
    if data['estado'] not in estados_validos:
        return jsonify({'error': 'Estado no válido'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE actividad
            SET nombre = %s, id_disciplina = %s, id_espacio = %s,
                cupo_maximo = %s, dia = %s, horario = %s, estado = %s
            WHERE id_actividad = %s
        """, (
            data['nombre'].strip(),
            data['id_disciplina'],
            data['id_espacio'],
            data['cupo_maximo'],
            data['dia'].strip(),
            data['horario'],
            data['estado'],
            id
        ))
        conn.commit()
        if cursor.rowcount == 0:
            cursor.close(); conn.close()
            return jsonify({'error': 'Actividad no encontrada'}), 404
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Actividad actualizada'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# DELETE - eliminar una actividad
@actividades_bp.route('/actividades/<int:id>', methods=['DELETE'])
def delete_actividad(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM actividad WHERE id_actividad = %s", (id,))
        conn.commit()
        if cursor.rowcount == 0:
            cursor.close(); conn.close()
            return jsonify({'error': 'Actividad no encontrada'}), 404
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Actividad eliminada'})
    except Exception as e:
        return jsonify({'error': 'No se puede eliminar, tiene inscripciones asociadas'}), 400