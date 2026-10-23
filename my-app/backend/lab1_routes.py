from flask import Blueprint, jsonify, request
from auth import token_required, get_db_connection
from crypto_logic.lab1_caesar import (
    CONTRACT_TASKS,
    EN_REFERENCE_FREQ,
    UA_REFERENCE_FREQ,
    caesar_decrypt,
    calculate_frequencies,
    verify_decryption
)

lab1_bp = Blueprint('lab1', __name__, url_prefix='/api/lab1')


def init_lab1_db():
    """Ensure completed_contracts table exists."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS completed_contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            contract_id TEXT NOT NULL,
            reward REAL NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    ''')
    conn.commit()
    conn.close()


@lab1_bp.route('/tasks', methods=['GET'])
def get_tasks():
    """Return available Lab 1 contract tasks and reference linguistic frequencies."""
    tasks_list = []
    for tid, t in CONTRACT_TASKS.items():
        tasks_list.append({
            'id': t['id'],
            'name': t['name'],
            'lang': t['lang'],
            'ciphertext': t['ciphertext'],
            'difficulty': t['difficulty'],
            'reward': t['reward'],
            'description': t['description']
        })

    return jsonify({
        'tasks': tasks_list,
        'reference_frequencies': {
            'en': EN_REFERENCE_FREQ,
            'ua': UA_REFERENCE_FREQ
        }
    }), 200


@lab1_bp.route('/decrypt', methods=['POST'])
def test_decrypt():
    """Helper route to decrypt text using Caesar shift on the server."""
    data = request.get_json(silent=True) or {}
    text = data.get('text', '')
    key = int(data.get('key', 0))
    lang = data.get('lang', 'en')

    decrypted = caesar_decrypt(text, key, lang)
    frequencies = calculate_frequencies(decrypted, lang)

    return jsonify({
        'decrypted_text': decrypted,
        'frequencies': frequencies
    }), 200


@lab1_bp.route('/verify', methods=['POST'])
@token_required
def verify_contract(current_user):
    """
    Verify submitted decryption text and/or key.
    On success: awards balance and persists in database.
    On failure: returns error.
    """
    data = request.get_json(silent=True) or {}
    decrypted_text = data.get('decrypted_text', '')
    key = data.get('key')
    task_id = data.get('task_id')

    if key is None and not decrypted_text:
        return jsonify({
            'status': 'error',
            'message': 'INVALID DECRYPTION KEY OR TEXT'
        }), 400

    try:
        numeric_key = int(key) if key is not None else -1
    except (ValueError, TypeError):
        numeric_key = -1

    is_valid, matched_task_id = verify_decryption(decrypted_text, numeric_key, task_id)

    if not is_valid:
        return jsonify({
            'status': 'error',
            'message': 'INVALID DECRYPTION KEY OR TEXT'
        }), 400

    # Retrieve task reward (default 1500)
    reward_amount = 1500.0
    if matched_task_id and matched_task_id in CONTRACT_TASKS:
        reward_amount = float(CONTRACT_TASKS[matched_task_id].get('reward', 1500))

    # Update user's balance in SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Credit user's vault balance
        cursor.execute(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            (reward_amount, current_user['id'])
        )

        # Log completion
        cursor.execute(
            'INSERT INTO completed_contracts (user_id, contract_id, reward) VALUES (?, ?, ?)',
            (current_user['id'], matched_task_id or 'lab1_caesar', reward_amount)
        )

        conn.commit()

        # Fetch updated balance
        cursor.execute('SELECT balance FROM users WHERE id = ?', (current_user['id'],))
        row = cursor.fetchone()
        new_balance = row['balance'] if row else current_user['balance'] + reward_amount
    except Exception as e:
        conn.rollback()
        return jsonify({
            'status': 'error',
            'message': f'DATABASE ERROR CREDITING REWARD: {str(e)}'
        }), 500
    finally:
        conn.close()

    return jsonify({
        'status': 'success',
        'reward': reward_amount,
        'new_balance': new_balance,
        'task_id': matched_task_id,
        'message': f'CONTRACT VERIFIED. +{int(reward_amount)} BTC CREDITED TO VAULT.'
    }), 200
