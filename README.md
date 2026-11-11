# Informe del proyecto CipherText

## Resumen

CipherText es una plataforma para cifrar y recuperar mensajes y documentos con una contraseña elegida por el usuario. La aplicación reúne una interfaz web, una API local, una base de datos SQLite para las cuentas y el historial, y un módulo de consola para las operaciones principales. El contenido se protege con AES-256-GCM; las claves se derivan con Scrypt. La plataforma acepta mensajes de hasta 250 caracteres y archivos PDF, DOCX, XLSX y TXT de hasta 4 MB.

## 1. Introducción

Los mensajes y documentos digitales suelen contener información personal, académica o laboral. Si se comparten o almacenan sin protección, pueden quedar expuestos a personas que no deberían consultarlos. CipherText se desarrolló como una herramienta sencilla para cifrar este tipo de información y recuperarla posteriormente con la contraseña correspondiente.

El proyecto utiliza AES-256-GCM, un modo de cifrado autenticado. Además de ocultar el contenido, permite detectar si los datos cifrados fueron modificados o si se intenta recuperarlos con una contraseña incorrecta. Las contraseñas de cifrado no se guardan en la aplicación.

## 2. Descripción general del proyecto

La aplicación ofrece registro e inicio de sesión, herramientas para cifrar y descifrar textos y archivos, y un historial privado por cuenta. El usuario escribe o selecciona el contenido, ingresa una contraseña de cifrado y solicita la operación. En el caso de los archivos, el resultado cifrado se descarga con la extensión `.enc`.

El historial conserva el contenido cifrado y sus metadatos. Para consultarlo, se confirma la contraseña de la cuenta. Cada elemento requiere además la contraseña con la que fue cifrado para mostrar una vista previa o recuperar el original.

La interfaz web presenta un video introductorio sobre el cifrado. El video se aloja en YouTube y requiere conexión a Internet; cuando no hay conexión, la pantalla muestra una explicación breve del proceso. También existe un menú de consola para cifrar y descifrar textos y archivos.

## 3. Problema y formulación

Una necesidad frecuente es proteger mensajes y documentos sin utilizar herramientas distintas para cada formato. Sin una solución que facilite estas operaciones, el usuario puede compartir información sensible sin cifrarla o no contar con una forma clara de recuperarla.

La pregunta que orientó el proyecto fue: **¿cómo desarrollar una aplicación informática que permita cifrar y descifrar mensajes y archivos de distintos formatos, utilizando AES-256-GCM, con validaciones claras y un uso comprensible?**

## 4. Justificación

CipherText reúne en una sola plataforma la protección de mensajes y archivos habituales. El cifrado autenticado aporta confidencialidad e integridad, mientras que las validaciones de longitud, formato, tamaño y contraseña ayudan a prevenir errores de uso.

El historial facilita volver a consultar elementos previamente cifrados sin guardar las contraseñas de cifrado. La contraseña de cuenta y la contraseña de cifrado tienen propósitos distintos: la primera controla el acceso a la plataforma y al historial; la segunda protege el contenido.

## 5. Objetivos

### Objetivo general

Desarrollar CipherText, una aplicación informática para cifrar y descifrar mensajes y archivos con AES-256-GCM, con una interfaz de uso sencillo y controles para proteger la información.

### Objetivos específicos

- Implementar el cifrado y descifrado de mensajes con claves derivadas de contraseñas mediante Scrypt.
- Incorporar el procesamiento de archivos PDF, DOCX, XLSX y TXT de hasta 4 MB.
- Validar las entradas, las contraseñas y la autenticidad del contenido cifrado.
- Proporcionar registro, inicio de sesión y acceso individual al historial.
- Diseñar una interfaz que permita ejecutar las operaciones y presentar resultados y errores comprensibles.
- Verificar las funciones principales mediante pruebas de integración.

## 6. Alcance y límites

CipherText permite crear cuentas, iniciar y cerrar sesión, cifrar y descifrar textos y archivos, y consultar el historial propio. Los textos tienen un límite de 250 caracteres. Los archivos admitidos son PDF, DOCX, XLSX y TXT de hasta 4 MB. Los archivos cifrados se descargan como `.enc`.

La plataforma no almacena las contraseñas de cifrado ni ofrece recuperación de una contraseña olvidada. Si se pierde la contraseña usada para cifrar un elemento, CipherText no puede recuperar su contenido. El video introductorio depende de YouTube y de la conexión del navegador.

## 7. Partes interesadas

- **Usuarios:** crean una cuenta, protegen sus mensajes y documentos y consultan su propio historial.
- **Equipo de desarrollo:** mantiene la interfaz, la API, el cifrado, las validaciones y la persistencia.
- **Docente o evaluador del proyecto:** revisa los objetivos, las decisiones técnicas, el funcionamiento y las evidencias de las pruebas.
- **Responsable de la información:** el usuario que decide qué contenido procesar y conserva las contraseñas necesarias para recuperarlo.

## 8. Requisitos

### Requisitos funcionales

- **RF01. Registro:** permitir crear una cuenta con un nombre de usuario válido y una contraseña de cuenta.
- **RF02. Inicio y cierre de sesión:** permitir el acceso a la plataforma y finalizar la sesión de forma explícita.
- **RF03. Cifrado de texto:** aceptar mensajes de 1 a 250 caracteres y devolver su representación cifrada.
- **RF04. Descifrado de texto:** recuperar el mensaje original al proporcionar el contenido cifrado y la contraseña correcta.
- **RF05. Cifrado de archivos:** aceptar PDF, DOCX, XLSX y TXT de hasta 4 MB.
- **RF06. Descifrado de archivos:** recuperar un archivo `.enc` con la contraseña correspondiente.
- **RF07. Descarga:** permitir descargar el resultado cifrado con extensión `.enc` y el original al recuperarlo.
- **RF08. Historial:** guardar el contenido cifrado y los metadatos asociados a la cuenta que realizó la operación.
- **RF09. Protección del historial:** requerir la contraseña de cuenta para desbloquearlo y la contraseña de cifrado para ver cada elemento.
- **RF10. Retroalimentación:** informar el resultado de las operaciones y explicar los errores de entrada o de autenticación.
- **RF11. Cierre del historial:** bloquear nuevamente el acceso al historial después de cinco minutos.

### Requisitos no funcionales

- **Seguridad:** utilizar AES-256-GCM para confidencialidad y autenticidad, y Scrypt para derivar claves a partir de contraseñas.
- **Protección de contraseñas:** no almacenar contraseñas de cifrado; guardar la contraseña de cuenta únicamente como hash derivado con salt.
- **Integridad:** detectar claves incorrectas, contenido incompleto y modificaciones del contenido cifrado.
- **Usabilidad:** presentar controles identificables, mensajes de retroalimentación y una interfaz adaptable a escritorio y móvil.
- **Compatibilidad de datos:** procesar textos en UTF-8 y archivos dentro de los formatos admitidos.
- **Protección de archivos originales:** no sobrescribir archivos existentes durante las operaciones locales de archivo.
- **Privacidad del historial:** asociar cada elemento a su usuario y restringir la consulta a esa cuenta.

## 9. Metodología de trabajo

Se trabajó de manera incremental: cada parte se implementó y verificó antes de integrarla con las demás. El proceso comprendió las siguientes etapas:

1. **Análisis:** se definieron los tipos de contenido, las restricciones, las necesidades de acceso y los mensajes de error.
2. **Diseño técnico:** se separaron la interfaz, la API, el cifrado, el procesamiento de archivos y el almacenamiento.
3. **Implementación criptográfica:** se implementaron la derivación de claves con Scrypt, el cifrado AES-GCM y la validación de autenticidad al descifrar.
4. **Procesamiento de archivos:** se añadieron controles de formato, tamaño y estructura para los documentos admitidos, junto con la generación y recuperación de `.enc`.
5. **Interfaz y cuentas:** se conectaron registro, inicio de sesión, cifrado, descifrado, mensajes de estado e historial con la API.
6. **Pruebas y ajustes:** se probaron los flujos principales, las entradas inválidas, contraseñas incorrectas, archivos no admitidos y el aislamiento de datos entre cuentas.
7. **Documentación:** se prepararon la descripción del proyecto y las indicaciones para recopilar evidencias de uso.

## 10. Herramientas y tecnologías utilizadas

- **Python:** lenguaje del backend, las operaciones criptográficas, el procesamiento de archivos y el módulo de consola.
- **HTML:** estructura de la interfaz web.
- **CSS:** presentación visual y adaptación a diferentes tamaños de pantalla.
- **JavaScript:** interacción de la interfaz y comunicación con la API.
- **SQLite:** almacenamiento local de cuentas y elementos cifrados del historial.
- **Biblioteca `cryptography`:** implementación de AES-GCM y Scrypt.
- **`http.server` de Python:** servidor HTTP local que sirve la interfaz y atiende las solicitudes de la API.
- **`unittest`:** ejecución de las pruebas automatizadas.
- **Visual Studio Code:** entorno de edición y revisión del proyecto.

## 11. Arquitectura y estructura del proyecto

La aplicación se organiza en módulos. La interfaz web envía sus solicitudes al servidor HTTP local. La API valida los datos, requiere una sesión para las operaciones protegidas y delega el cifrado y el almacenamiento en sus módulos correspondientes.

```text
CipherText/
├── front/
│   ├── index.html       Interfaz y formularios
│   ├── styles.css       Estilos y diseño adaptable
│   └── app.js           Interacción y solicitudes a la API
├── src/
│   ├── web.py           Servidor web y API
│   ├── cifrado.py       AES-256-GCM, Scrypt y manejo de textos
│   ├── archivos.py      Cifrado y descifrado de archivos locales
│   ├── validaciones.py  Reglas de contraseña, formato y tamaño
│   ├── storage.py       Persistencia de cuentas e historial
│   └── main.py          Menú de consola
├── data/
│   └── ciphertext.sqlite3  Base de datos local
├── img/
│   └── logo.jpg         Logo de CipherText
├── pruebas/
│   └── test_web.py      Pruebas de integración de la API
├── archivos_prueba/     Archivos disponibles para ensayos
├── resultados/          Carpeta de resultados del proyecto
└── requirements.txt     Dependencias de Python
```

La carpeta `venv/`, si está presente en el equipo, corresponde al entorno local de ejecución y no forma parte de los módulos funcionales de la aplicación.

## 12. Cifrado y manejo de datos

### Derivación de claves y AES-256-GCM

La contraseña de cifrado se convierte en una clave de 32 bytes mediante Scrypt. Para cada operación se genera una salt aleatoria de 16 bytes y un nonce aleatorio de 12 bytes. AES-GCM cifra los datos y produce información de autenticación que se verifica al descifrarlos.

El contenido binario cifrado utiliza el encabezado `CTXT1`, seguido de la salt, el nonce y el contenido cifrado autenticado. En el caso de los textos, esa estructura se codifica en Base64 para presentarla en el campo de resultado. Si se proporciona una contraseña incorrecta o se altera el contenido, la verificación falla y el texto original no se devuelve.

### Contraseñas y sesión

La contraseña de cuenta se almacena como un hash derivado mediante Scrypt con una salt aleatoria. No se guarda en texto plano. La contraseña de cifrado se solicita para cada operación y la interfaz la borra al finalizar el intento.

Las sesiones web se mantienen en memoria y tienen una duración máxima de ocho horas. La cookie de sesión se configura como `HttpOnly` y `SameSite=Strict`. El permiso temporal para consultar el historial vence a los cinco minutos.

### Base de datos

CipherText utiliza SQLite en `data/ciphertext.sqlite3`. La tabla `users` guarda el identificador, nombre de usuario, salt, hash de contraseña de cuenta y fecha de creación. La tabla `history` guarda el identificador del elemento, el usuario propietario, el tipo de contenido, su nombre, el contenido cifrado y la fecha. Una clave foránea vincula el historial con su cuenta y un índice facilita su ordenamiento por usuario y fecha.

El historial no guarda la contraseña de cifrado ni el texto plano original. El contenido se almacena cifrado y solo se interpreta al proporcionar la contraseña correspondiente.

## 13. Pruebas y resultados

Las pruebas de integración cubren el registro e inicio de sesión, el acceso a operaciones protegidas, el cifrado y descifrado de textos, mensajes vacíos o demasiado largos, claves incorrectas, modificaciones del contenido cifrado, cifrado y recuperación de archivos, validaciones de formato y tamaño, consulta del historial y aislamiento entre usuarios.

En la última ejecución de la suite disponible durante la elaboración de este informe se completaron **9 pruebas con resultado satisfactorio**. También se verificó la sintaxis de JavaScript. Estos resultados confirman los casos cubiertos por las pruebas; no representan una auditoría de seguridad ni una certificación criptográfica.

## 14. Conclusiones

CipherText integra en una sola aplicación el cifrado de mensajes y archivos, la gestión de cuentas y el historial privado. AES-256-GCM permite detectar intentos de descifrado con una contraseña incorrecta y alteraciones del contenido. Las validaciones y pruebas respaldan los flujos principales y hacen explícitos los límites de uso.

El proyecto puede ampliarse con nuevos formatos, mecanismos de recuperación definidos por el usuario o una estrategia distinta de despliegue. Cualquier ampliación debe mantener la protección de las contraseñas y la verificación de autenticidad.