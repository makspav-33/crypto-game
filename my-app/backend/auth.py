import datetime
import hashlib
import os
import sqlite3
import warnings
from functools import wraps
from flask import Blueprint, jsonify, request
import jwt

# Suppress PyJWT warning regarding HMAC secret key length
warnings.filterwarnings('ignore', category=getattr(jwt, 'InsecureKeyLengthWarning', Warning))

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')
DEFAULT_JWT_SECRET = 'LastnameFirstname'
JWT_ALGORITHM = 'HS256'


def get_db_connection():
    """Establish connection to SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database and create/migrate Users table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            balance REAL DEFAULT 0.0,
            role TEXT DEFAULT 'user',
            jwt_secret TEXT DEFAULT 'LastnameFirstname'
        );
    ''')

    # Ensure jwt_secret column exists if table was created in earlier version
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'jwt_secret' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN jwt_secret TEXT DEFAULT 'LastnameFirstname'")

    conn.commit()
    conn.close()


def hash_password(password: str) -> str:
    """Hash password using SHA-256."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def generate_jwt(user_id: int, username: str, secret: str = DEFAULT_JWT_SECRET, role: str = 'user') -> str:
    """Generate JWT token signed with user-specific secret key."""
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': expiration
    }
    signing_secret = secret or DEFAULT_JWT_SECRET
    return jwt.encode(payload, signing_secret, algorithm=JWT_ALGORITHM)


def token_required(f):
    """Decorator to enforce and validate Bearer JWT token with user-specific secret."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'error': 'Access Denied: Authorization token missing',
                'code': 'TOKEN_MISSING'
            }), 401

        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        elif len(parts) == 1:
            token = parts[0]
        else:
            return jsonify({
                'error': 'Access Denied: Invalid Authorization header format. Expected Bearer <token>',
                'code': 'TOKEN_MALFORMED'
            }), 401

        try:
            # 1. Decode token payload without signature verification to identify the user
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            user_id = unverified_payload.get('user_id')

            if not user_id:
                return jsonify({
                    'error': 'Security Breach: Token missing user_id identifier',
                    'code': 'TOKEN_INVALID'
                }), 401

            # 2. Retrieve user record and their unique secret key from SQLite
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                'SELECT id, username, balance, role, jwt_secret FROM users WHERE id = ?',
                (user_id,)
            )
            user_row = cursor.fetchone()
            conn.close()

            if not user_row:
                return jsonify({
                    'error': 'Access Denied: Agent record not found in system',
                    'code': 'USER_NOT_FOUND'
                }), 401

            user_secret = user_row['jwt_secret'] or DEFAULT_JWT_SECRET

            # 3. Cryptographically verify signature and expiration using the user's specific secret
            verified_payload = jwt.decode(token, user_secret, algorithms=[JWT_ALGORITHM])

            current_user = dict(user_row)
        except jwt.ExpiredSignatureError:
            return jsonify({
                'error': 'Session Expired: Security token has expired',
                'code': 'TOKEN_EXPIRED'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'error': 'Security Breach: Invalid token signature or tampered payload',
                'code': 'TOKEN_INVALID'
            }), 401
        except Exception as e:
            return jsonify({
                'error': f'Authentication Failure: {str(e)}',
                'code': 'AUTH_FAILED'
            }), 401

        return f(current_user, *args, **kwargs)

    return decorated


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with default secret LastnameFirstname."""
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({
            'error': 'Validation Error: Username and password are required',
            'code': 'FIELDS_REQUIRED'
        }), 400

    if len(username) < 3:
        return jsonify({
            'error': 'Validation Error: Username must be at least 3 characters',
            'code': 'USERNAME_TOO_SHORT'
        }), 400

    if len(password) < 4:
        return jsonify({
            'error': 'Validation Error: Password must be at least 4 characters',
            'code': 'PASSWORD_TOO_SHORT'
        }), 400

    pwd_hash = hash_password(password)
    user_secret = DEFAULT_JWT_SECRET  # Default for all newly registered accounts: LastnameFirstname

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO users (username, password_hash, balance, role, jwt_secret) VALUES (?, ?, ?, ?, ?)',
            (username, pwd_hash, 0.0, 'user', user_secret)
        )
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({
            'error': f'Registration Failed: Agent "{username}" already exists in HackNet database',
            'code': 'USER_EXISTS'
        }), 409
    finally:
        conn.close()

    token = generate_jwt(user_id=user_id, username=username, secret=user_secret, role='user')

    return jsonify({
        'message': f'Agent {username} registered successfully into HackNet OS v1.0',
        'token': token,
        'user': {
            'id': user_id,
            'username': username,
            'balance': 0.0,
            'role': 'user',
            'jwt_secret': user_secret
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Verify password hash and issue JWT signed with user's specific secret."""
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({
            'error': 'Validation Error: Username and password are required',
            'code': 'FIELDS_REQUIRED'
        }), 400

    pwd_hash = hash_password(password)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, username, password_hash, balance, role, jwt_secret FROM users WHERE username = ?',
        (username,)
    )
    user_row = cursor.fetchone()
    conn.close()

    if not user_row or user_row['password_hash'] != pwd_hash:
        return jsonify({
            'error': 'Access Denied: Invalid credentials. Check your agent codename and passphrase.',
            'code': 'INVALID_CREDENTIALS'
        }), 401

    user_secret = user_row['jwt_secret'] or DEFAULT_JWT_SECRET

    token = generate_jwt(
        user_id=user_row['id'],
        username=user_row['username'],
        secret=user_secret,
        role=user_row['role']
    )

    return jsonify({
        'message': f'Access Granted: Welcome back, Agent {user_row["username"]}',
        'token': token,
        'user': {
            'id': user_row['id'],
            'username': user_row['username'],
            'balance': user_row['balance'],
            'role': user_row['role'],
            'jwt_secret': user_secret
        }
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Retrieve currently authenticated user profile."""
    return jsonify({
        'user': current_user
    }), 200
