import os
import hmac
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

from cryptography.hazmat.primitives.kdf.scrypt import Scrypt

DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "ciphertext.sqlite3"


@contextmanager
def connect(database_path=DATABASE_PATH):
    database_path = Path(database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database(database_path=DATABASE_PATH):
    with connect(database_path) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                password_salt BLOB NOT NULL,
                password_hash BLOB NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS history (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                kind TEXT NOT NULL CHECK (kind IN ('text', 'file')),
                name TEXT NOT NULL,
                encrypted_content BLOB NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS history_user_created
                ON history(user_id, created_at DESC);
            """
        )


def _password_hash(password, salt):
    return Scrypt(
        salt=salt,
        length=32,
        n=2**14,
        r=8,
        p=1,
    ).derive(password.encode("utf-8"))


def register_user(username, password, created_at, database_path=DATABASE_PATH):
    salt = os.urandom(16)
    password_hash = _password_hash(password, salt)
    with connect(database_path) as connection:
        cursor = connection.execute(
            """
            INSERT INTO users (username, password_salt, password_hash, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (username, salt, password_hash, created_at),
        )
        return {"id": cursor.lastrowid, "username": username}


def authenticate_user(username, password, database_path=DATABASE_PATH):
    with connect(database_path) as connection:
        user = connection.execute(
            """
            SELECT id, username, password_salt, password_hash
            FROM users WHERE username = ?
            """,
            (username,),
        ).fetchone()

    if user is None:
        return None

    candidate_hash = _password_hash(password, user["password_salt"])
    if not hmac.compare_digest(candidate_hash, user["password_hash"]):
        return None
    return {"id": user["id"], "username": user["username"]}


def verify_user_password(user_id, password, database_path=DATABASE_PATH):
    with connect(database_path) as connection:
        user = connection.execute(
            "SELECT password_salt, password_hash FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    if user is None:
        return False
    candidate_hash = _password_hash(password, user["password_salt"])
    return hmac.compare_digest(candidate_hash, user["password_hash"])


def add_history_entry(user_id, kind, name, encrypted_content, created_at, database_path=DATABASE_PATH):
    entry_id = uuid.uuid4().hex
    with connect(database_path) as connection:
        connection.execute(
            """
            INSERT INTO history (id, user_id, kind, name, encrypted_content, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (entry_id, user_id, kind, name, encrypted_content, created_at),
        )
    return entry_id


def list_history(user_id, database_path=DATABASE_PATH):
    with connect(database_path) as connection:
        entries = connection.execute(
            """
            SELECT id, kind, name, created_at
            FROM history
            WHERE user_id = ?
            ORDER BY created_at DESC, rowid DESC
            """,
            (user_id,),
        ).fetchall()
    return [dict(entry) for entry in entries]


def get_history_entry(user_id, entry_id, database_path=DATABASE_PATH):
    with connect(database_path) as connection:
        entry = connection.execute(
            """
            SELECT id, kind, name, encrypted_content, created_at
            FROM history
            WHERE id = ? AND user_id = ?
            """,
            (entry_id, user_id),
        ).fetchone()
    return dict(entry) if entry is not None else None
