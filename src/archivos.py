from pathlib import Path

from cifrado import cifrar, descifrar
from validaciones import validar_archivo, MAX_BYTES


def _guardar_sin_sobrescribir(destino, contenido):
    candidato = destino
    intento = 0
    while True:
        try:
            with candidato.open("xb") as archivo:
                archivo.write(contenido)
            return candidato
        except FileExistsError:
            intento += 1
            sufijo = " (recuperado)" if intento == 1 else f" (recuperado {intento})"
            candidato = destino.with_name(
                f"{destino.stem}{sufijo}{destino.suffix}"
            )


def cifrar_archivo(ruta, password):
    archivo = Path(ruta)

    contenido = validar_archivo(archivo)

    resultado = cifrar(contenido, password)

    destino = archivo.with_name(archivo.name + ".enc")

    if destino.exists():
        raise FileExistsError(
            "Ya existe un archivo cifrado con ese nombre."
        )

    destino.write_bytes(resultado)

    return destino


def descifrar_archivo(ruta, password):
    archivo = Path(ruta)

    if not archivo.is_file():
        raise ValueError("No se encontró el archivo.")

    if archivo.suffix.lower() != ".enc":
        raise ValueError("Selecciona un archivo .enc.")

    if archivo.stat().st_size > MAX_BYTES + 64:
        raise ValueError("El archivo cifrado supera el tamaño permitido.")

    resultado = descifrar(archivo.read_bytes(), password)

    destino = archivo.with_name(archivo.stem)
    return _guardar_sin_sobrescribir(destino, resultado)