import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from auth import auth_bp, init_db
from lab1_routes import lab1_bp, init_lab1_db
from crypto_logic.transposition import transpose_cipher

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SQLite database tables
init_db()
init_lab1_db()

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(lab1_bp)


@app.route('/api/sandbox/transpose', methods=['POST'])
def sandbox_transpose():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '')
    mode = data.get('mode', 'vertical')
    key = data.get('key', 'KEY')
    result = transpose_cipher(text, mode, key)
    return jsonify(result)


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
