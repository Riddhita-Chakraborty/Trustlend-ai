from flask import Flask
from flask_cors import CORS
from app.config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    CORS(app)

    # Existing blueprint
    from app.routes.analyze import analyze_bp
    app.register_blueprint(analyze_bp, url_prefix='/api')

    # New: comparison blueprint
    from app.routes.compare import compare_bp
    app.register_blueprint(compare_bp, url_prefix='/api')

    @app.route('/health')
    def health_check():
        return {"status": "healthy"}, 200

    @app.route('/')
    def index():
        return "TrustLend Backend is Running!", 200

    return app