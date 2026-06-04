import mysql.connector
import os

DB_CONFIG = {
    'host':     os.getenv('DB_HOST', 'localhost'),
    'user':     os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'actividades_deportivas')
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)