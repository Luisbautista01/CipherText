from getpass import getpass

from cifrado import cifrar_texto, descifrar_texto
from archivos import cifrar_archivo, descifrar_archivo
from validaciones import validar_password


def menu():
    print("\n========== CIPHERTEXT ==========")
    print("1. Cifrar mensaje")
    print("2. Descifrar mensaje")
    print("3. Cifrar archivo")
    print("4. Descifrar archivo")
    print("5. Salir")
    print("================================")


def ejecutar():
    while True:
        menu()

        opcion = input("Selecciona una opción: ").strip()

        try:
            if opcion == "1":
                texto = input("Escribe el mensaje: ")

                if not texto or len(texto) > 250:
                    raise ValueError(
                        "El mensaje debe tener entre 1 y 250 caracteres."
                    )

                password = getpass("Contraseña: ")
                validar_password(password)

                resultado = cifrar_texto(texto, password)

                print("\n[OK] Mensaje cifrado correctamente.")
                print("\nResultado:")
                print(resultado)

            elif opcion == "2":
                texto = input("Pega el mensaje cifrado: ")
                password = getpass("Contraseña: ")

                resultado = descifrar_texto(texto, password)

                print("\n[OK] Mensaje recuperado:")
                print(resultado)

            elif opcion == "3":
                ruta = input("Ruta del archivo: ")
                password = getpass("Contraseña: ")
                validar_password(password)

                destino = cifrar_archivo(ruta, password)

                print("\n[OK] Archivo cifrado correctamente.")
                print("Guardado en:", destino)

            elif opcion == "4":
                ruta = input("Ruta del archivo .enc: ")
                password = getpass("Contraseña: ")

                destino = descifrar_archivo(ruta, password)

                print("\n[OK] Archivo recuperado correctamente.")
                print("Guardado en:", destino)

            elif opcion == "5":
                print("Gracias por utilizar CipherText.")
                break

            else:
                print("[ERROR] Selecciona una opción entre 1 y 5.")

        except Exception as error:
            print("\n[ERROR]", str(error))


if __name__ == "__main__":
    ejecutar()
