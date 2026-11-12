import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from archivos import descifrar_archivo
from cifrado import cifrar


class FileDecryptionTests(unittest.TestCase):
    def test_existing_original_is_preserved_and_recovered_copy_gets_unique_name(self):
        original_content = b"contenido recuperado"
        password = "contrasena-segura"

        with tempfile.TemporaryDirectory() as directory:
            encrypted_path = Path(directory) / "informe.txt.enc"
            original_path = Path(directory) / "informe.txt"
            encrypted_path.write_bytes(cifrar(original_content, password))
            original_path.write_bytes(b"contenido original existente")

            recovered_path = descifrar_archivo(encrypted_path, password)

            self.assertEqual(recovered_path.name, "informe (recuperado).txt")
            self.assertEqual(original_path.read_bytes(), b"contenido original existente")
            self.assertEqual(recovered_path.read_bytes(), original_content)

            second_recovered_path = descifrar_archivo(encrypted_path, password)
            self.assertEqual(second_recovered_path.name, "informe (recuperado 2).txt")
            self.assertEqual(second_recovered_path.read_bytes(), original_content)


if __name__ == "__main__":
    unittest.main()
