import os
import base64

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt

MAGIC = b"CTXT1"
SALT_SIZE = 16
NONCE_SIZE = 12

def derivar_clave(password, salt):
    kdf = Scrypt(
        salt=salt,
        length=32,
        n=2**14,
        r=8,
        p=1
    )
    return kdf.derive(password.encode("utf-8"))


def cifrar(datos, password):
    salt = os.urandom(SALT_SIZE)
    nonce = os.urandom(NONCE_SIZE)

    clave = derivar_clave(password, salt)
    aes = AESGCM(clave)

    contenido = aes.encrypt(nonce, datos, MAGIC)

    return MAGIC + salt + nonce + contenido


def descifrar(datos, password):
    if not datos.startswith(MAGIC):
        raise ValueError("El archivo cifrado no es válido.")

    inicio = len(MAGIC)

    salt = datos[inicio:inicio + SALT_SIZE]
    inicio += SALT_SIZE

    nonce = datos[inicio:inicio + NONCE_SIZE]
    inicio += NONCE_SIZE

    contenido = datos[inicio:]

    if len(salt) != SALT_SIZE or len(nonce) != NONCE_SIZE:
        raise ValueError("El contenido está incompleto.")

    clave = derivar_clave(password, salt)
    aes = AESGCM(clave)

    return aes.decrypt(nonce, contenido, MAGIC)


def cifrar_texto(texto, password):
    if not texto or len(texto) > 250:
        raise ValueError(
            "El mensaje debe tener entre 1 y 250 caracteres."
        )

    resultado = cifrar(texto.encode("utf-8"), password)

    return base64.b64encode(resultado).decode("ascii")


def descifrar_texto(texto_cifrado, password):
    try:
        datos = base64.b64decode(
            texto_cifrado,
            validate=True
        )

        resultado = descifrar(datos, password)
        texto = resultado.decode("utf-8")

        if len(texto) > 250:
            raise ValueError("El mensaje recuperado supera 250 caracteres.")

        return texto

    except (ValueError, UnicodeDecodeError):
        raise ValueError(
            "No se pudo descifrar. Verifica la clave y el contenido."
        )