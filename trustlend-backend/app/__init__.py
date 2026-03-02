from flask import Flask
from flask_cors import CORS
from app.config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    
    # Register Blueprints
    from app.routes.analyze import analyze_bp
    app.register_blueprint(analyze_bp, url_prefix='/api')
    
    # Health check route
    @app.route('/health')
    def health_check():
        return {"status": "healthy"}, 200

    # Root route
    @app.route('/')
    def index():
        return "TrustLend Backend is Running! Use POST /api/analyze to analyze documents.", 200
        
    return app
