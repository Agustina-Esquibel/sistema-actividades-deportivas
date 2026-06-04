from flask import Blueprint, jsonify, request
from database import get_connection

estudiantes_bp = Blueprint('estudiantes', __name__)

# GET - obtener todos los estudiantes
@estudiantes_bp.route('/estudiantes', methods=['GET'])
def get_estudiantes():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM estudiante ORDER BY apellido, nombre")
    estudiantes = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(estudiantes)

# GET - obtener un estudiante por id
@estudiantes_bp.route('/estudiantes/<int:id>', methods=['GET'])
def get_estudiante(id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM estudiante WHERE id_estudiante = %s", (id,))
    estudiante = cursor.fetchone()
    cursor.close()
    conn.close()
    if not estudiante:
        return jsonify({'error': 'Estudiante no encontrado'}), 404
    return jsonify(estudiante)

# POST - crear un estudiante nuevo
@estudiantes_bp.route('/estudiantes', methods=['POST'])
def create_estudiante():
    data = request.get_json()

    # Validaciones
    campos = ['documento', 'nombre', 'apellido', 'email', 'carrera', 'facultad']
    for campo in campos:
        if not data.get(campo, '').strip():
            return jsonify({'error': f'El campo {campo} es obligatorio'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO estudiante (documento, nombre, apellido, email, carrera, facultad)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data['documento'].strip(),
            data['nombre'].strip(),
            data['apellido'].strip(),
            data['email'].strip(),
            data['carrera'].strip(),
            data['facultad'].strip()
        ))
        conn.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Estudiante creado', 'id': nuevo_id}), 201
    except Exception as e:
        # Si el documento o email ya existe, MySQL lanza un error de duplicado
        if 'Duplicate entry' in str(e):
            return jsonify({'error': 'El documento o email ya está registrado'}), 400
        return jsonify({'error': str(e)}), 400

# PUT - editar un estudiante
@estudiantes_bp.route('/estudiantes/<int:id>', methods=['PUT'])
def update_estudiante(id):
    data = request.get_json()

    campos = ['documento', 'nombre', 'apellido', 'email', 'carrera', 'facultad']
    for campo in campos:
        if not data.get(campo, '').strip():
            return jsonify({'error': f'El campo {campo} es obligatorio'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE estudiante
            SET documento = %s, nombre = %s, apellido = %s,
                email = %s, carrera = %s, facultad = %s
            WHERE id_estudiante = %s
        """, (
            data['documento'].strip(),
            data['nombre'].strip(),
            data['apellido'].strip(),
            data['email'].strip(),
            data['carrera'].strip(),
            data['facultad'].strip(),
            id
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Estudiante actualizado'})
    except Exception as e:
        if 'Duplicate entry' in str(e):
            return jsonify({'error': 'El documento o email ya está registrado'}), 400
        return jsonify({'error': str(e)}), 400

# DELETE - eliminar un estudiante
@estudiantes_bp.route('/estudiantes/<int:id>', methods=['DELETE'])
def delete_estudiante(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM estudiante WHERE id_estudiante = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'mensaje': 'Estudiante eliminado'})
    except Exception as e:
        return jsonify({'error': 'No se puede eliminar, tiene inscripciones asociadas'}), 400