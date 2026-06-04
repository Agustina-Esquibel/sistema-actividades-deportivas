from flask import Blueprint, jsonify, request
from database import get_connection

espacios_bp = Blueprint('espacios', __name__)

# GET - obtener todos los espacios
@espacios_bp.route('/espacios', methods=['GET'])
def get_espacios():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM espacio ORDER BY nombre")
    espacios = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(espacios)

# POST - crear un espacio nuevo
@espacios_bp.route('/espacios', methods=['POST'])
def create_espacio():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    ubicacion = data.get('ubicacion', '').strip()

    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO espacio (nombre, ubicacion) VALUES (%s, %s)",
            (nombre, ubicacion)
        )
        conn.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Espacio creado', 'id': nuevo_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# PUT - editar un espacio
@espacios_bp.route('/espacios/<int:id>', methods=['PUT'])
def update_espacio(id):
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    ubicacion = data.get('ubicacion', '').strip()

    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE espacio SET nombre = %s, ubicacion = %s WHERE id_espacio = %s",
        (nombre, ubicacion, id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'mensaje': 'Espacio actualizado'})

# DELETE - eliminar un espacio
@espacios_bp.route('/espacios/<int:id>', methods=['DELETE'])
def delete_espacio(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM espacio WHERE id_espacio = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Espacio eliminado'})
    except Exception as e:
        return jsonify({'error': 'No se puede eliminar, tiene actividades asociadas'}), 400