from flask import Flask
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from dotenv import load_dotenv
import datetime

load_dotenv()

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, datetime.timedelta):
            total = int(o.total_seconds())
            horas   = total // 3600
            minutos = (total % 3600) // 60
            return f"{horas:02d}:{minutos:02d}"
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        return super().default(o)

from routes.estudiantes   import estudiantes_bp
from routes.disciplinas   import disciplinas_bp
from routes.espacios      import espacios_bp
from routes.actividades   import actividades_bp
from routes.inscripciones import inscripciones_bp
from routes.asistencias   import asistencias_bp
from routes.reportes      import reportes_bp
from routes.dashboard     import dashboard_bp

app = Flask(__name__)
app.json_provider_class = CustomJSONProvider
app.json = CustomJSONProvider(app)
CORS(app)

app.register_blueprint(estudiantes_bp)
app.register_blueprint(disciplinas_bp)
app.register_blueprint(espacios_bp)
app.register_blueprint(actividades_bp)
app.register_blueprint(inscripciones_bp)
app.register_blueprint(asistencias_bp)
app.register_blueprint(reportes_bp)
app.register_blueprint(dashboard_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
