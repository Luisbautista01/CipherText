import base64
import binascii
import json
import re
import secrets
import sqlite3
import sys
import time
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from threading import RLock
from urllib.parse import urlsplit

from cryptography.exceptions import InvalidTag

FRONT_DIR = Path(__file__).resolve().parent.parent / "front"
PROJECT_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from archivos import MAX_BYTES
from cifrado import (
    MAGIC,
    NONCE_SIZE,
    SALT_SIZE,
    cifrar,
    cifrar_texto,
    descifrar,
    descifrar_texto,
)
from storage import (
    DATABASE_PATH,
    add_history_entry,
    authenticate_user,
    get_history_entry,
    initialize_database,
    list_history,
    register_user,
    verify_user_password,
)
from validaciones import validar_contenido_archivo, validar_password

MAX_REQUEST_BYTES = 8 * 1024 * 1024
SESSION_MAX_AGE = 8 * 60 * 60
HISTORY_UNLOCK_SECONDS = 5 * 60
MESSAGE_AUTH_ERROR = "No fue posible verificar el contenido."
MESSAGE_FILE_FORMAT_ERROR = "Selecciona un archivo PDF, DOCX, XLSX o TXT."
SESSION_COOKIE = "ciphertext_session"
SESSION_COOKIE_ATTRIBUTES = (
    f"; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_MAX_AGE}"
)
SESSIONS = {}
SESSIONS_LOCK = RLock()


class APIError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


class WebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONT_DIR), **kwargs)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/auth/session":
            session = self._current_session()
            user = (
                {"username": session["username"]}
                if session is not None
                else None
            )
            self._send_json(200, {"user": user})
            return

        if path == "/api/history":
            try:
                session = self._require_session()
                self._require_history_unlock(session)
                self._send_json(
                    200,
                    {"entries": list_history(session["user_id"], DATABASE_PATH)},
                )
            except APIError as error:
                self._send_json(error.status, {"error": error.message})
            return

        if path == "/img/logo.jpg":
            self._send_logo()
            return

        super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path
        try:
            self._validate_origin()
            payload = self._read_payload()

            if path in {"/api/auth/register", "/api/auth/login"}:
                result, cookie = self._authenticate(path, payload)
                self._send_json(200, result, {"Set-Cookie": cookie})
                return

            if path == "/api/auth/logout":
                self._logout()
                self._send_json(
                    200,
                    {"ok": True},
                    {
                        "Set-Cookie": (
                            f"{SESSION_COOKIE}=; HttpOnly; SameSite=Strict; "
                            "Path=/; Max-Age=0"
                        )
                    },
                )
                return

            session = self._require_session()
            if path == "/api/history/unlock":
                self._unlock_history(session, payload)
                return
            if path.startswith("/api/history/") and path.endswith("/preview"):
                result = self._preview_history(session, path, payload)
                self._send_json(200, result)
                return

            result = self._dispatch(path, payload, session)
        except APIError as error:
            self._send_json(error.status, {"error": error.message})
            return
        except InvalidTag:
            self._send_json(400, {"error": MESSAGE_AUTH_ERROR})
            return
        except (binascii.Error, UnicodeDecodeError, ValueError):
            self._send_json(400, {"error": MESSAGE_AUTH_ERROR})
            return

        self._send_json(200, result)

    def _authenticate(self, path, payload):
        username = self._required_string(payload, "username").strip()
        password = self._required_string(payload, "password")
        if not re.fullmatch(r"[A-Za-z0-9._-]{3,32}", username):
            raise APIError(
                400,
                "El usuario debe tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.",
            )
        if len(password) < 8 or len(password) > 256:
            raise APIError(400, "La contraseña debe tener entre 8 y 256 caracteres.")

        if path == "/api/auth/register":
            try:
                user = register_user(
                    username,
                    password,
                    datetime.now(timezone.utc).isoformat(),
                    DATABASE_PATH,
                )
            except sqlite3.IntegrityError as error:
                raise APIError(409, "Ese nombre de usuario ya está registrado.") from error
        else:
            user = authenticate_user(username, password, DATABASE_PATH)
            if user is None:
                raise APIError(401, "Usuario o contraseña incorrectos.")

        token = secrets.token_urlsafe(32)
        with SESSIONS_LOCK:
            old_token = self._session_token()
            if old_token:
                SESSIONS.pop(old_token, None)
            SESSIONS[token] = {
                "user_id": user["id"],
                "username": user["username"],
                "expires_at": time.monotonic() + SESSION_MAX_AGE,
                "history_unlocked_until": 0,
            }
        return (
            {"user": {"username": user["username"]}},
            f"{SESSION_COOKIE}={token}{SESSION_COOKIE_ATTRIBUTES}",
        )

    def _logout(self):
        token = self._session_token()
        if token:
            with SESSIONS_LOCK:
                SESSIONS.pop(token, None)

    def _session_token(self):
        cookie = SimpleCookie()
        cookie.load(self.headers.get("Cookie", ""))
        morsel = cookie.get(SESSION_COOKIE)
        return morsel.value if morsel is not None else None

    def _current_session(self):
        token = self._session_token()
        if not token:
            return None

        with SESSIONS_LOCK:
            session = SESSIONS.get(token)
            if session is None:
                return None
            if session["expires_at"] <= time.monotonic():
                SESSIONS.pop(token, None)
                return None
            return session

    def _require_session(self):
        session = self._current_session()
        if session is None:
            raise APIError(401, "Inicia sesión para continuar.")
        return session

    @staticmethod
    def _require_history_unlock(session):
        if session["history_unlocked_until"] <= time.monotonic():
            raise APIError(403, "Ingresa la contraseña de tu cuenta para abrir el historial.")

    def _unlock_history(self, session, payload):
        password = self._required_string(payload, "password")
        if not verify_user_password(session["user_id"], password, DATABASE_PATH):
            raise APIError(401, "La contraseña de la cuenta no es correcta.")
        session["history_unlocked_until"] = time.monotonic() + HISTORY_UNLOCK_SECONDS
        self._send_json(
            200,
            {"entries": list_history(session["user_id"], DATABASE_PATH)},
        )

    def _preview_history(self, session, path, payload):
        self._require_history_unlock(session)
        match = re.fullmatch(r"/api/history/([a-f0-9]{32})/preview", path)
        if match is None:
            raise APIError(404, "No se encontró el elemento del historial.")
        entry = get_history_entry(session["user_id"], match.group(1), DATABASE_PATH)
        if entry is None:
            raise APIError(404, "No se encontró el elemento del historial.")

        password = self._required_string(payload, "password")
        content = descifrar(entry["encrypted_content"], password)
        if entry["kind"] == "text":
            preview = content.decode("utf-8")
            return {
                "name": entry["name"],
                "kind": "text",
                "preview": preview,
            }

        preview = self._extract_file_preview(entry["name"], content)
        return {
            "name": entry["name"],
            "kind": "file",
            "preview": preview,
            "download": base64.b64encode(content).decode("ascii"),
        }

    @staticmethod
    def _extract_file_preview(name, content):
        extension = Path(name).suffix.lower()
        if extension == ".txt":
            return content.decode("utf-8-sig")[:5000]
        if extension == ".pdf":
            from pypdf import PdfReader
            from pypdf.errors import PdfReadError

            try:
                reader = PdfReader(BytesIO(content), strict=True)
                return "\n\n".join(
                    (page.extract_text() or "") for page in reader.pages[:2]
                )[:5000] or "No se encontró texto seleccionable en las primeras páginas."
            except PdfReadError as error:
                raise APIError(400, "El archivo se descifró, pero no fue posible generar la vista previa.") from error
        if extension == ".docx":
            from docx import Document
            from docx.opc.exceptions import PackageNotFoundError

            try:
                document = Document(BytesIO(content))
            except PackageNotFoundError as error:
                raise APIError(400, "El archivo se descifró, pero no fue posible generar la vista previa.") from error
            return "\n".join(
                paragraph.text for paragraph in document.paragraphs[:60]
            )[:5000] or "El documento no contiene texto para mostrar."
        if extension == ".xlsx":
            from openpyxl import load_workbook
            from openpyxl.utils.exceptions import InvalidFileException

            try:
                workbook = load_workbook(BytesIO(content), read_only=True, data_only=True)
                worksheet = workbook.active
                rows = [
                    "\t".join("" if value is None else str(value) for value in row)
                    for row in worksheet.iter_rows(
                        min_row=1,
                        max_row=30,
                        max_col=12,
                        values_only=True,
                    )
                ]
                workbook.close()
            except (InvalidFileException, ValueError) as error:
                raise APIError(400, "El archivo se descifró, pero no fue posible generar la vista previa.") from error
            return "\n".join(rows)[:5000] or "La hoja no contiene celdas para mostrar."
        raise APIError(400, "No hay una vista previa disponible para este archivo.")

    def _dispatch(self, path, payload, session):
        if path == "/api/text/encrypt":
            text = self._required_string(payload, "text")
            if not text:
                raise APIError(400, "Escribe un mensaje antes de continuar.")
            if len(text) > 250:
                raise APIError(400, "El mensaje supera el límite permitido.")

            password = self._required_string(payload, "password")
            try:
                validar_password(password)
            except ValueError as error:
                raise APIError(400, str(error)) from error
            result = cifrar_texto(text, password)
            add_history_entry(
                session["user_id"],
                "text",
                "Mensaje cifrado",
                base64.b64decode(result, validate=True),
                datetime.now(timezone.utc).isoformat(),
                DATABASE_PATH,
            )
            return {"result": result}

        if path == "/api/text/decrypt":
            text = self._required_string(payload, "text")
            if not text:
                raise APIError(400, "Escribe un mensaje antes de continuar.")
            password = self._required_string(payload, "password")
            return {"result": descifrar_texto(text, password)}

        if path == "/api/files/encrypt":
            name = self._safe_filename(self._required_string(payload, "name"))
            content = self._decode_content(payload)
            password = self._required_string(payload, "password")
            try:
                validar_password(password)
                contenido_validado = validar_contenido_archivo(name, content)
            except ValueError as error:
                raise APIError(400, self._file_error_message(str(error))) from error

            encrypted = cifrar(contenido_validado, password)
            encrypted_name = name + ".enc"
            add_history_entry(
                session["user_id"],
                "file",
                name,
                encrypted,
                datetime.now(timezone.utc).isoformat(),
                DATABASE_PATH,
            )
            return {
                "name": encrypted_name,
                "content": base64.b64encode(encrypted).decode("ascii"),
            }

        if path == "/api/files/decrypt":
            name = self._safe_filename(self._required_string(payload, "name"))
            if not name.lower().endswith(".enc"):
                raise APIError(400, "Selecciona un archivo .enc.")

            encrypted = self._decode_content(payload)
            if len(encrypted) > MAX_BYTES + 64:
                raise APIError(400, "El archivo cifrado supera el tamaño permitido.")
            if not encrypted.startswith(MAGIC):
                raise APIError(400, "El archivo no tiene un formato .enc válido de CipherText.")
            minimum_size = len(MAGIC) + SALT_SIZE + NONCE_SIZE + 16
            if len(encrypted) < minimum_size:
                raise APIError(400, "El archivo cifrado está incompleto.")

            original = descifrar(encrypted, self._required_string(payload, "password"))
            return {
                "name": name[:-4],
                "content": base64.b64encode(original).decode("ascii"),
            }

        raise APIError(404, "No se encontró la operación.")

    def _read_payload(self):
        try:
            content_length = int(self.headers.get("Content-Length", ""))
        except ValueError as error:
            raise APIError(400, "La solicitud no es válida.") from error

        if content_length < 0:
            raise APIError(400, "La solicitud no es válida.")
        if content_length > MAX_REQUEST_BYTES:
            raise APIError(413, "La solicitud supera el tamaño permitido.")

        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise APIError(400, "La solicitud no es válida.") from error

        if not isinstance(payload, dict):
            raise APIError(400, "La solicitud no es válida.")
        return payload

    def _validate_origin(self):
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != self.headers.get("Host"):
            raise APIError(403, "La solicitud no es válida.")

    @staticmethod
    def _required_string(payload, key):
        value = payload.get(key)
        if not isinstance(value, str):
            raise APIError(400, "La solicitud no es válida.")
        return value

    @staticmethod
    def _safe_filename(name):
        return name.replace("\\", "/").rsplit("/", 1)[-1]

    @staticmethod
    def _decode_content(payload):
        encoded = WebHandler._required_string(payload, "content")
        try:
            return base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError) as error:
            raise APIError(400, "El contenido del archivo no es válido.") from error

    @staticmethod
    def _file_error_message(message):
        if "supera el límite de 4 MB" in message:
            return "El archivo supera el límite de 4 MB."
        return MESSAGE_FILE_FORMAT_ERROR

    def _send_logo(self):
        logo_path = PROJECT_DIR / "img" / "logo.jpg"
        try:
            content = logo_path.read_bytes()
        except OSError:
            self._send_json(404, {"error": "No se encontró el logo de CipherText."})
            return

        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(content)

    def _send_json(self, status, payload, headers=None):
        response = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response)))
        self.send_header("Cache-Control", "no-store")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(response)


def serve():
    initialize_database(DATABASE_PATH)
    address = ("127.0.0.1", 8765)
    server = ThreadingHTTPServer(address, WebHandler)
    print(f"CipherText disponible en http://{address[0]}:{address[1]}")
    print(f"Base de datos local: {DATABASE_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    serve()
