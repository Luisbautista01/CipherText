import base64
import http.cookiejar
import json
import tempfile
import threading
import unittest
import uuid
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from pathlib import Path
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen

from src import web
from src.web import WebHandler


class WebAPITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_directory = tempfile.TemporaryDirectory()
        web.DATABASE_PATH = Path(cls.temp_directory.name) / "ciphertext-test.sqlite3"
        web.initialize_database(web.DATABASE_PATH)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), WebHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        with web.SESSIONS_LOCK:
            web.SESSIONS.clear()
        cls.temp_directory.cleanup()

    def setUp(self):
        self.cookies = http.cookiejar.CookieJar()
        self.opener = build_opener(HTTPCookieProcessor(self.cookies))
        self.username = "test_" + uuid.uuid4().hex[:12]
        status, _ = self.post_json(
            "/api/auth/register",
            {"username": self.username, "password": "cuenta-segura"},
        )
        self.assertEqual(status, 200)

    def post_json(self, path, payload):
        request = Request(
            self.base_url + path,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            response = self.opener.open(request)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def get_json(self, path):
        try:
            response = self.opener.open(self.base_url + path)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def test_text_encrypt_and_decrypt(self):
        status, encrypted = self.post_json(
            "/api/text/encrypt",
            {"text": "Mensaje de prueba", "password": "secreto123"},
        )
        self.assertEqual(status, 200)

        status, decrypted = self.post_json(
            "/api/text/decrypt",
            {"text": encrypted["result"], "password": "secreto123"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(decrypted["result"], "Mensaje de prueba")

    def test_text_validation_messages(self):
        status, empty = self.post_json(
            "/api/text/encrypt", {"text": "", "password": "secreto123"}
        )
        self.assertEqual(status, 400)
        self.assertEqual(empty["error"], "Escribe un mensaje antes de continuar.")

        status, too_long = self.post_json(
            "/api/text/encrypt", {"text": "x" * 251, "password": "secreto123"}
        )
        self.assertEqual(status, 400)
        self.assertEqual(too_long["error"], "El mensaje supera el límite permitido.")

    def test_authentication_and_protected_operations(self):
        status, session = self.get_json("/api/auth/session")
        self.assertEqual(status, 200)
        self.assertEqual(session["user"]["username"], self.username)

        status, _ = self.post_json("/api/auth/logout", {})
        self.assertEqual(status, 200)

        status, response = self.post_json(
            "/api/text/encrypt",
            {"text": "No autorizado", "password": "cifrado123"},
        )
        self.assertEqual(status, 401)
        self.assertEqual(response["error"], "Inicia sesión para continuar.")

        status, login = self.post_json(
            "/api/auth/login",
            {"username": self.username, "password": "cuenta-segura"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(login["user"]["username"], self.username)

        status, duplicate = self.post_json(
            "/api/auth/register",
            {"username": self.username.upper(), "password": "cuenta-segura"},
        )
        self.assertEqual(status, 409)
        self.assertEqual(duplicate["error"], "Ese nombre de usuario ya está registrado.")

    def test_authentication_failures_return_a_generic_message(self):
        status, encrypted = self.post_json(
            "/api/text/encrypt",
            {"text": "Mensaje protegido", "password": "secreto123"},
        )
        self.assertEqual(status, 200)

        status, wrong_password = self.post_json(
            "/api/text/decrypt",
            {"text": encrypted["result"], "password": "incorrecta"},
        )
        self.assertEqual(status, 400)
        self.assertEqual(wrong_password["error"], "No fue posible verificar el contenido.")

        tampered_bytes = bytearray(base64.b64decode(encrypted["result"]))
        tampered_bytes[-1] ^= 1
        status, tampered_content = self.post_json(
            "/api/text/decrypt",
            {
                "text": base64.b64encode(tampered_bytes).decode("ascii"),
                "password": "secreto123",
            },
        )
        self.assertEqual(status, 400)
        self.assertEqual(tampered_content["error"], "No fue posible verificar el contenido.")

    def test_file_encrypt_and_decrypt(self):
        original = b"contenido de prueba"
        status, encrypted = self.post_json(
            "/api/files/encrypt",
            {
                "name": "nota.txt",
                "content": base64.b64encode(original).decode("ascii"),
                "password": "secreto123",
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(encrypted["name"], "nota.txt.enc")

        status, decrypted = self.post_json(
            "/api/files/decrypt",
            {
                "name": encrypted["name"],
                "content": encrypted["content"],
                "password": "secreto123",
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(decrypted["name"], "nota.txt")
        self.assertEqual(base64.b64decode(decrypted["content"]), original)

        status, unlocked = self.post_json(
            "/api/history/unlock", {"password": "cuenta-segura"}
        )
        self.assertEqual(status, 200)
        entry = unlocked["entries"][0]
        status, preview = self.post_json(
            f"/api/history/{entry['id']}/preview", {"password": "secreto123"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(preview["preview"], "contenido de prueba")
        self.assertEqual(base64.b64decode(preview["download"]), original)

    def test_file_validation_messages(self):
        status, invalid_format = self.post_json(
            "/api/files/encrypt",
            {"name": "nota.exe", "content": "", "password": "secreto123"},
        )
        self.assertEqual(status, 400)
        self.assertEqual(
            invalid_format["error"],
            "Selecciona un archivo PDF, DOCX, XLSX o TXT.",
        )

        status, too_large = self.post_json(
            "/api/files/encrypt",
            {
                "name": "grande.txt",
                "content": base64.b64encode(b"x" * (4 * 1024 * 1024 + 1)).decode("ascii"),
                "password": "secreto123",
            },
        )
        self.assertEqual(status, 400)
        self.assertEqual(too_large["error"], "El archivo supera el límite de 4 MB.")

    def test_file_decryption_reports_invalid_or_incomplete_ciphertext(self):
        invalid_content = base64.b64encode(b"not a CipherText file").decode("ascii")
        status, invalid = self.post_json(
            "/api/files/decrypt",
            {
                "name": "documento.enc",
                "content": invalid_content,
                "password": "secreto123",
            },
        )
        self.assertEqual(status, 400)
        self.assertEqual(
            invalid["error"],
            "El archivo no tiene un formato .enc válido de CipherText.",
        )

        truncated_content = base64.b64encode(b"CTXT1").decode("ascii")
        status, incomplete = self.post_json(
            "/api/files/decrypt",
            {
                "name": "documento.enc",
                "content": truncated_content,
                "password": "secreto123",
            },
        )
        self.assertEqual(status, 400)
        self.assertEqual(incomplete["error"], "El archivo cifrado está incompleto.")

    def test_history_requires_account_password_and_previews_encrypted_text(self):
        status, encrypted = self.post_json(
            "/api/text/encrypt",
            {"text": "Solo aparece con su contraseña.", "password": "cifrado123"},
        )
        self.assertEqual(status, 200)

        status, locked = self.get_json("/api/history")
        self.assertEqual(status, 403)
        self.assertIn("contraseña de tu cuenta", locked["error"])

        status, _ = self.post_json(
            "/api/history/unlock", {"password": "incorrecta"}
        )
        self.assertEqual(status, 401)

        status, unlocked = self.post_json(
            "/api/history/unlock", {"password": "cuenta-segura"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(len(unlocked["entries"]), 1)
        entry = unlocked["entries"][0]
        self.assertNotIn(encrypted["result"], json.dumps(entry))

        status, preview = self.post_json(
            f"/api/history/{entry['id']}/preview", {"password": "cifrado123"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(preview["preview"], "Solo aparece con su contraseña.")

    def test_history_is_isolated_between_users(self):
        status, _ = self.post_json(
            "/api/text/encrypt",
            {"text": "Privado para un usuario", "password": "cifrado123"},
        )
        self.assertEqual(status, 200)
        status, first_user_history = self.post_json(
            "/api/history/unlock", {"password": "cuenta-segura"}
        )
        self.assertEqual(status, 200)
        entry_id = first_user_history["entries"][0]["id"]

        other_cookies = http.cookiejar.CookieJar()
        other_opener = build_opener(HTTPCookieProcessor(other_cookies))
        other_username = "other_" + uuid.uuid4().hex[:12]
        request = Request(
            self.base_url + "/api/auth/register",
            data=json.dumps(
                {"username": other_username, "password": "otra-cuenta"}
            ).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with other_opener.open(request) as response:
            self.assertEqual(response.status, 200)

        unlock_request = Request(
            self.base_url + "/api/history/unlock",
            data=json.dumps({"password": "otra-cuenta"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with other_opener.open(unlock_request) as response:
            other_history = json.loads(response.read().decode("utf-8"))
            self.assertEqual(other_history["entries"], [])

        preview_request = Request(
            self.base_url + f"/api/history/{entry_id}/preview",
            data=json.dumps({"password": "cifrado123"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            other_opener.open(preview_request)
        except HTTPError as error:
            self.assertEqual(error.code, 404)
        else:
            self.fail("A user must not be able to access another user's history.")

    def test_frontend_is_served(self):
        with urlopen(self.base_url + "/") as response:
            self.assertEqual(response.status, 200)
            page = response.read()
            self.assertIn(b"Historial", page)
            self.assertIn(b"Crear cuenta", page)

        with urlopen(self.base_url + "/img/logo.jpg") as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers.get_content_type(), "image/jpeg")


if __name__ == "__main__":
    unittest.main()
