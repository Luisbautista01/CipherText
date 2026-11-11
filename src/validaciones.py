from io import BytesIO
from pathlib import Path
import zipfile

MAX_BYTES = 4 * 1024 * 1024

FORMATOS = {".pdf", ".docx", ".xlsx", ".txt"}


def validar_password(password):
    if len(password) < 8:
        raise ValueError(
            "La contraseña debe tener al menos 8 caracteres."
        )


def validar_archivo(ruta):
    archivo = Path(ruta)

    if not archivo.is_file():
        raise ValueError("El archivo no existe.")

    if archivo.suffix.lower() not in FORMATOS:
        raise ValueError(
            "Formato no permitido. Usa PDF, DOCX, XLSX o TXT."
        )

    if archivo.stat().st_size > MAX_BYTES:
        raise ValueError("El archivo supera el límite de 4 MB.")

    return validar_contenido_archivo(archivo.name, archivo.read_bytes())


def validar_contenido_archivo(nombre, contenido):
    extension = Path(nombre).suffix.lower()

    if extension not in FORMATOS:
        raise ValueError(
            "Formato no permitido. Usa PDF, DOCX, XLSX o TXT."
        )

    if len(contenido) > MAX_BYTES:
        raise ValueError("El archivo supera el límite de 4 MB.")

    if extension == ".pdf":
        if not contenido.startswith(b"%PDF-"):
            raise ValueError("El archivo no parece ser un PDF válido.")

    elif extension in (".docx", ".xlsx"):
        archivo_en_memoria = BytesIO(contenido)
        if not zipfile.is_zipfile(archivo_en_memoria):
            raise ValueError("El documento no tiene una estructura válida.")

        with zipfile.ZipFile(BytesIO(contenido)) as documento:
            archivos = documento.namelist()

            if extension == ".docx" and "word/document.xml" not in archivos:
                raise ValueError("El DOCX no tiene la estructura esperada.")

            if extension == ".xlsx" and "xl/workbook.xml" not in archivos:
                raise ValueError("El XLSX no tiene la estructura esperada.")

    elif extension == ".txt":
        try:
            contenido.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ValueError("El TXT debe utilizar codificación UTF-8.")

    return contenido