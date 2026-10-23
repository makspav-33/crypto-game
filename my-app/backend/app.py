import os
from flask import Flask, jsonify
from flask_cors import CORS
from auth import auth_bp, init_db

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SQLite database tables
init_db()

# Register Authentication Blueprint
app.register_blueprint(auth_bp)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'system': 'HackNet OS v1.0',
        'tor_node': '#849'
    })


@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({'message': 'Hello from HackNet backend!'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
