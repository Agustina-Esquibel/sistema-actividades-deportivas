from flask import Blueprint, jsonify, request
from database import get_connection

disciplinas_bp = Blueprint('disciplinas', __name__)

# GET - obtener todas las disciplinas
@disciplinas_bp.route('/disciplinas', methods=['GET'])
def get_disciplinas():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM disciplina ORDER BY nombre")
    disciplinas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(disciplinas)

# POST - crear una disciplina nueva
@disciplinas_bp.route('/disciplinas', methods=['POST'])
def create_disciplina():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()

    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO disciplina (nombre) VALUES (%s)", (nombre,))
        conn.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Disciplina creada', 'id': nuevo_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# PUT - editar una disciplina
@disciplinas_bp.route('/disciplinas/<int:id>', methods=['PUT'])
def update_disciplina(id):
    data = request.get_json()
    nombre = data.get('nombre', '').strip()

    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE disciplina SET nombre = %s WHERE id_disciplina = %s", (nombre, id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'mensaje': 'Disciplina actualizada'})

# DELETE - eliminar una disciplina
@disciplinas_bp.route('/disciplinas/<int:id>', methods=['DELETE'])
def delete_disciplina(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM disciplina WHERE id_disciplina = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Disciplina eliminada'})
    except Exception as e:
        return jsonify({'error': 'No se puede eliminar, tiene actividades asociadas'}), 400