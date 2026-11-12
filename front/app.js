const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".xlsx", ".txt"]);

const textTab = document.querySelector("#text-tab");
const fileTab = document.querySelector("#file-tab");
const textPanel = document.querySelector("#text-panel");
const filePanel = document.querySelector("#file-panel");
const messageInput = document.querySelector("#message");
const characterCount = document.querySelector("#character-count");
const textPassword = document.querySelector("#text-password");
const textSubmit = document.querySelector("#text-submit");
const textSubmitLabel = document.querySelector("#text-submit-label");
const textFeedback = document.querySelector("#text-feedback");
const textResultWrap = document.querySelector("#text-result-wrap");
const textResult = document.querySelector("#text-result");
const textResultLabel = document.querySelector("#text-result-label");
const copyResult = document.querySelector("#copy-result");
const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const dropInstructions = document.querySelector("#drop-instructions");
const selectFileButton = document.querySelector("#select-file-button");
const selectedFile = document.querySelector("#selected-file");
const fileName = document.querySelector("#file-name");
const fileSize = document.querySelector("#file-size");
const previewFile = document.querySelector("#preview-file");
const filePreviewDialog = document.querySelector("#file-preview-dialog");
const filePreviewTitle = document.querySelector("#file-preview-title");
const filePreviewDescription = document.querySelector("#file-preview-description");
const filePreviewContent = document.querySelector("#file-preview-content");
const closeFilePreview = document.querySelector("#close-file-preview");
const operationConfirmDialog = document.querySelector("#operation-confirm-dialog");
const operationConfirmTitle = document.querySelector("#operation-confirm-title");
const operationConfirmDescription = document.querySelector("#operation-confirm-description");
const operationConfirmPreview = document.querySelector("#operation-confirm-preview");
const operationConfirmNote = document.querySelector("#operation-confirm-note");
const cancelOperation = document.querySelector("#cancel-operation");
const acceptOperation = document.querySelector("#accept-operation");
const toastRegion = document.querySelector("#toast-region");
const filePassword = document.querySelector("#file-password");
const fileSubmit = document.querySelector("#file-submit");
const fileSubmitLabel = document.querySelector("#file-submit-label");
const fileFeedback = document.querySelector("#file-feedback");
const changeFile = document.querySelector("#change-file");
const removeFile = document.querySelector("#remove-file");
const authView = document.querySelector("#auth-view");
const platformView = document.querySelector("#platform-view");
const authForm = document.querySelector("#auth-form");
const authUsername = document.querySelector("#auth-username");
const authPassword = document.querySelector("#auth-password");
const authSubmit = document.querySelector("#auth-submit");
const authFeedback = document.querySelector("#auth-feedback");
const topbarActions = document.querySelector("#topbar-actions");
const accountName = document.querySelector("#account-name");
const menuToggle = document.querySelector("#menu-toggle");
const navigationMenu = document.querySelector("#navigation-menu");
const logoutDialog = document.querySelector("#logout-dialog");
const logoutFeedback = document.querySelector("#logout-feedback");
const confirmLogout = document.querySelector("#confirm-logout");
const cancelLogout = document.querySelector("#cancel-logout");
const encryptView = document.querySelector("#encrypt-view");
const historyView = document.querySelector("#history-view");
const faqSection = document.querySelector("#faq-section");
const historyUnlockForm = document.querySelector("#history-unlock-form");
const historyAccountPassword = document.querySelector("#history-account-password");
const historyFeedback = document.querySelector("#history-feedback");
const historyResults = document.querySelector("#history-results");
const historyList = document.querySelector("#history-list");
const historyPreview = document.querySelector("#history-preview");
const videoStage = document.querySelector("#video-stage");
const videoPlay = document.querySelector("#video-play");
const guideOffline = document.querySelector("#guide-offline");
const videoThumbnail = videoPlay.querySelector("img");

let textMode = "encrypt";
let fileMode = "encrypt";
let authMode = "login";
let selectedUpload = null;
let textResultValue = "";
let filePreviewUrl = "";
let toastTimeout;
let textLimitToastShown = false;

function setFeedback(element, message, kind = "") {
  element.textContent = message;
  element.className = `inline-feedback${kind ? ` ${kind}` : ""}`;
}

function showToast(message, kind = "success") {
  window.clearTimeout(toastTimeout);
  const toast = document.createElement("div");
  toast.className = `toast${kind === "error" ? " toast-error" : ""}`;
  toast.textContent = message;
  toastRegion.replaceChildren(toast);
  toastTimeout = window.setTimeout(() => {
    toast.classList.add("toast-hiding");
    window.setTimeout(() => {
      if (toast.parentElement === toastRegion) toastRegion.replaceChildren();
    }, 250);
  }, 3200);
}

function showSignedOut() {
  document.body.classList.add("auth-page");
  authView.classList.remove("is-hidden");
  platformView.classList.add("is-hidden");
  topbarActions.classList.add("is-hidden");
  navigationMenu.classList.add("is-hidden");
  menuToggle.setAttribute("aria-expanded", "false");
  authPassword.value = "";
  textPassword.value = "";
  filePassword.value = "";
  historyAccountPassword.value = "";
}

function showSignedIn(user) {
  document.body.classList.remove("auth-page");
  authView.classList.add("is-hidden");
  platformView.classList.remove("is-hidden");
  topbarActions.classList.remove("is-hidden");
  accountName.textContent = user.username;
  showView("encrypt");
}

function showVideoFallback() {
  videoStage.replaceChildren(videoPlay);
  videoStage.classList.add("is-hidden");
  guideOffline.classList.remove("is-hidden");
}

function updateVideoAvailability() {
  const isOnline = navigator.onLine;
  videoStage.classList.toggle("is-hidden", !isOnline);
  guideOffline.classList.toggle("is-hidden", isOnline);
  if (!isOnline && videoStage.querySelector("iframe")) {
    showVideoFallback();
  }
}

videoPlay.addEventListener("click", () => {
  if (!navigator.onLine) {
    updateVideoAvailability();
    return;
  }

  const player = document.createElement("iframe");
  player.src = "https://www.youtube-nocookie.com/embed/pwpcgl0AzM4?autoplay=1&rel=0";
  player.title = "¿Qué es el Cifrado? Seguridad de Datos Explicada";
  player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  player.referrerPolicy = "strict-origin-when-cross-origin";
  player.allowFullscreen = true;
  player.addEventListener("error", showVideoFallback, { once: true });
  videoStage.replaceChildren(player);
});

videoThumbnail.addEventListener("error", showVideoFallback, { once: true });
window.addEventListener("online", updateVideoAvailability);
window.addEventListener("offline", updateVideoAvailability);
updateVideoAvailability();

function showView(view) {
  const isHistory = view === "history";
  encryptView.classList.toggle("is-hidden", isHistory);
  historyView.classList.toggle("is-hidden", !isHistory);
  faqSection.classList.toggle("is-hidden", isHistory);
  document.querySelector("#intro-section").classList.toggle("is-hidden", isHistory);
  navigationMenu.classList.add("is-hidden");
  menuToggle.setAttribute("aria-expanded", "false");
  if (isHistory) {
    historyAccountPassword.value = "";
    historyResults.classList.add("is-hidden");
    historyPreview.classList.add("is-hidden");
    setFeedback(historyFeedback, "");
  }
}

document.querySelectorAll("[data-auth-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    authMode = button.dataset.authMode;
    document.querySelectorAll("[data-auth-mode]").forEach((tab) => {
      tab.classList.toggle("is-active", tab === button);
    });
    const registering = authMode === "register";
    authSubmit.textContent = registering ? "Crear cuenta" : "Iniciar sesión";
    authPassword.autocomplete = registering ? "new-password" : "current-password";
    document.querySelector("#auth-password-note").textContent = registering
      ? "La contraseña de cuenta es distinta a las contraseñas de cifrado."
      : "Esta contraseña protege tu cuenta y el acceso al historial.";
    setFeedback(authFeedback, "");
  });
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = authUsername.value.trim();
  const password = authPassword.value;
  authSubmit.disabled = true;
  setFeedback(authFeedback, "");
  try {
    const result = await postJson(`/api/auth/${authMode}`, { username, password });
    authPassword.value = "";
    showSignedIn(result.user);
    showToast(authMode === "register" ? "Cuenta creada correctamente." : "Sesión iniciada.");
  } catch (error) {
    setFeedback(authFeedback, error.message, "error");
  } finally {
    authPassword.value = "";
    authSubmit.disabled = false;
  }
});

menuToggle.addEventListener("click", () => {
  const isOpen = !navigationMenu.classList.contains("is-hidden");
  navigationMenu.classList.toggle("is-hidden", isOpen);
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

document.querySelector("#logout-button").addEventListener("click", () => {
  navigationMenu.classList.add("is-hidden");
  menuToggle.setAttribute("aria-expanded", "false");
  setFeedback(logoutFeedback, "");
  logoutDialog.showModal();
});

cancelLogout.addEventListener("click", () => {
  logoutDialog.close();
});

confirmLogout.addEventListener("click", async () => {
  confirmLogout.disabled = true;
  cancelLogout.disabled = true;
  setFeedback(logoutFeedback, "");
  try {
    await postJson("/api/auth/logout", {});
    logoutDialog.close();
    showSignedOut();
    showToast("Sesión cerrada correctamente.");
  } catch (error) {
    setFeedback(logoutFeedback, error.message, "error");
  } finally {
    confirmLogout.disabled = false;
    cancelLogout.disabled = false;
  }
});

fetch("/api/auth/session")
  .then((response) => response.json())
  .then((result) => {
    if (result.user) showSignedIn(result.user);
    else showSignedOut();
  })
  .catch(() => {
    setFeedback(authFeedback, "No fue posible verificar la sesión.", "error");
  });

function showPanel(panel) {
  const isText = panel === "text";
  textTab.classList.toggle("is-active", isText);
  fileTab.classList.toggle("is-active", !isText);
  textTab.setAttribute("aria-selected", String(isText));
  fileTab.setAttribute("aria-selected", String(!isText));
  textPanel.classList.toggle("is-hidden", !isText);
  filePanel.classList.toggle("is-hidden", isText);
  textPanel.setAttribute("aria-hidden", String(!isText));
  filePanel.setAttribute("aria-hidden", String(isText));
}

textTab.addEventListener("click", () => showPanel("text"));
fileTab.addEventListener("click", () => showPanel("file"));

function updateTextMode(mode) {
  textMode = mode;
  textLimitToastShown = false;
  document.querySelectorAll("#text-panel .mode-button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.mode === mode);
  });
  const encrypting = mode === "encrypt";
  textSubmitLabel.textContent = encrypting ? "Cifrar mensaje" : "Descifrar mensaje";
  messageInput.placeholder = encrypting
    ? "Escribe el mensaje que quieres proteger..."
    : "Pega aquí el mensaje cifrado...";
  document.querySelector("#message-hint").textContent = encrypting
    ? "Hasta 250 caracteres"
    : "Pega el contenido cifrado";
  document.querySelector("#character-count").classList.toggle("is-hidden", !encrypting);
  document.querySelector("#text-password-hint").textContent = encrypting
    ? "Usa al menos 8 caracteres para cifrar."
    : "Ingresa la contraseña con la que se cifró el mensaje.";
  messageInput.maxLength = encrypting ? 500 : 100000;
  textResultWrap.classList.add("is-hidden");
  setFeedback(textFeedback, "");
}

document.querySelectorAll("#text-panel .mode-button").forEach((button) => {
  button.addEventListener("click", () => updateTextMode(button.dataset.mode));
});

function updateCharacterCount() {
  const count = [...messageInput.value].length;
  characterCount.textContent = `${count} / 250`;
  characterCount.classList.toggle("over-limit", count > 250);
  if (count <= 250) textLimitToastShown = false;
}

messageInput.addEventListener("input", updateCharacterCount);
textPassword.addEventListener("input", () => {
  if (
    textMode === "encrypt"
    && textPassword.value
    && [...messageInput.value].length > 250
    && !textLimitToastShown
  ) {
    showToast("El mensaje supera el límite permitido de 250 caracteres.", "error");
    textLimitToastShown = true;
  }
});

async function postJson(path, payload) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("No fue posible conectar con CipherText.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("No fue posible completar la operación.");
  }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/api/auth/")) {
      showSignedOut();
    }
    throw new Error(result.error || "No fue posible completar la operación.");
  }
  return result;
}

function confirmOperation({
  title,
  description,
  preview,
  note,
  cancelLabel = "No, revisar",
  acceptLabel = "Sí, no hay problema",
}) {
  operationConfirmTitle.textContent = title;
  operationConfirmDescription.textContent = description;
  operationConfirmPreview.textContent = preview;
  operationConfirmPreview.classList.toggle("is-hidden", !preview);
  operationConfirmNote.textContent = note || "";
  operationConfirmNote.classList.toggle("is-hidden", !note);
  cancelOperation.textContent = cancelLabel;
  acceptOperation.textContent = acceptLabel;

  return new Promise((resolve) => {
    operationConfirmDialog.addEventListener(
      "close",
      () => resolve(operationConfirmDialog.returnValue === "confirm"),
      { once: true },
    );
    operationConfirmDialog.showModal();
  });
}

cancelOperation.addEventListener("click", () => operationConfirmDialog.close("cancel"));
acceptOperation.addEventListener("click", () => operationConfirmDialog.close("confirm"));

textSubmit.addEventListener("click", async () => {
  const text = messageInput.value;
  if (!text) {
    setFeedback(textFeedback, "Escribe un mensaje antes de continuar.", "error");
    return;
  }
  if (textMode === "encrypt" && [...text].length > 250) {
    const message = "El mensaje supera el límite permitido de 250 caracteres.";
    setFeedback(textFeedback, message, "error");
    showToast(message, "error");
    textLimitToastShown = true;
    return;
  }
  if (!textPassword.value) {
    setFeedback(textFeedback, "Ingresa una contraseña para continuar.", "error");
    return;
  }

  const mode = textMode;
  const visibleText = text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
  const confirmed = await confirmOperation({
    title: `¿Confirmas ${mode === "encrypt" ? "cifrar" : "descifrar"} este texto?`,
    description: "Revisa el contenido antes de continuar.",
    preview: visibleText,
    note: text.length > 1200
      ? "Se muestra solo el inicio. La operación incluirá el texto completo."
      : "",
    cancelLabel: "No, revisar texto",
  });
  if (!confirmed) return;

  textSubmit.disabled = true;
  textSubmitLabel.textContent = mode === "encrypt" ? "Cifrando..." : "Descifrando...";
  setFeedback(textFeedback, "");
  const password = textPassword.value;
  try {
    const result = await postJson(`/api/text/${mode}`, {
      text,
      password,
    });
    textResultValue = result.result;
    textResult.textContent = result.result;
    textResultLabel.textContent = mode === "encrypt" ? "Mensaje cifrado" : "Contenido original";
    textResultWrap.classList.remove("is-hidden");
    setFeedback(
      textFeedback,
      mode === "encrypt"
        ? "El mensaje se cifró correctamente."
        : "El contenido original se recuperó correctamente.",
      "success",
    );
    showToast(mode === "encrypt"
      ? "El mensaje se cifró correctamente."
      : "El contenido original se recuperó correctamente.");
  } catch (error) {
    setFeedback(textFeedback, error.message, "error");
  } finally {
    textPassword.value = "";
    textSubmit.disabled = false;
    textSubmitLabel.textContent = textMode === "encrypt" ? "Cifrar mensaje" : "Descifrar mensaje";
  }
});

copyResult.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(textResultValue);
    copyResult.textContent = "Copiado";
    showToast("Resultado copiado.");
    window.setTimeout(() => { copyResult.textContent = "Copiar"; }, 1500);
  } catch {
    setFeedback(textFeedback, "No fue posible copiar el resultado.", "error");
  }
});

function updateFileMode(mode) {
  fileMode = mode;
  document.querySelectorAll("#file-panel .mode-button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.mode === mode);
  });
  const encrypting = mode === "encrypt";
  fileSubmitLabel.textContent = encrypting ? "Cifrar archivo" : "Descifrar archivo";
  document.querySelector("#file-types").textContent = encrypting
    ? "PDF, DOCX, XLSX o TXT · Máximo 4 MB"
    : "Selecciona un archivo .enc para recuperar el original";
  document.querySelector("#file-password-hint").textContent = encrypting
    ? "Usa al menos 8 caracteres para cifrar."
    : "Ingresa la contraseña con la que se cifró el archivo.";
  fileInput.accept = encrypting ? ".pdf,.docx,.xlsx,.txt" : ".enc";
  clearSelectedFile();
  setFeedback(fileFeedback, "");
}

document.querySelectorAll("#file-panel .mode-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const nextMode = button.dataset.mode;
    if (nextMode === fileMode) return;
    if (selectedUpload) {
      const confirmed = await confirmOperation({
        title: "¿Cambiar operación y quitar el archivo?",
        description: "Al cambiar entre cifrado y descifrado se quitará el archivo seleccionado.",
        preview: `Archivo actual: ${selectedUpload.name}`,
        cancelLabel: "No, conservar archivo",
        acceptLabel: "Cambiar operación",
      });
      if (!confirmed) return;
    }
    updateFileMode(nextMode);
    showToast(nextMode === "encrypt" ? "Modo de cifrado seleccionado." : "Modo de descifrado seleccionado.");
  });
});

function formatBytes(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function selectFile(file) {
  if (!file) return;
  const extension = `.${file.name.split(".").pop().toLowerCase()}`;
  if (fileMode === "encrypt" && !ALLOWED_EXTENSIONS.has(extension)) {
    fileInput.value = "";
    setFeedback(fileFeedback, "Selecciona un archivo PDF, DOCX, XLSX o TXT.", "error");
    showToast("Formato de archivo no permitido.", "error");
    return;
  }
  if (fileMode === "decrypt" && extension !== ".enc") {
    fileInput.value = "";
    setFeedback(fileFeedback, "Selecciona un archivo .enc.", "error");
    showToast("Para descifrar, selecciona un archivo .enc.", "error");
    return;
  }
  if (fileMode === "encrypt" && file.size > MAX_FILE_BYTES) {
    fileInput.value = "";
    setFeedback(fileFeedback, "El archivo supera el límite de 4 MB.", "error");
    showToast("El archivo supera el límite de 4 MB.", "error");
    return;
  }
  const replacing = Boolean(selectedUpload);
  selectedUpload = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  dropInstructions.classList.add("is-hidden");
  selectFileButton.classList.add("is-hidden");
  selectedFile.classList.remove("is-hidden");
  dropZone.classList.add("has-file");
  fileSubmit.disabled = false;
  setFeedback(fileFeedback, "");
  showToast(
    replacing
      ? "Archivo cambiado. El formato está permitido y no supera los 4 MB."
      : "Archivo válido: formato permitido y tamaño dentro del límite de 4 MB.",
  );
}

function clearSelectedFile() {
  selectedUpload = null;
  fileInput.value = "";
  dropInstructions.classList.remove("is-hidden");
  selectFileButton.classList.remove("is-hidden");
  selectedFile.classList.add("is-hidden");
  dropZone.classList.remove("has-file");
  fileSubmit.disabled = true;
}

fileInput.addEventListener("click", () => {
  fileInput.value = "";
});
fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));

changeFile.addEventListener("click", async () => {
  if (!selectedUpload) return;
  const confirmed = await confirmOperation({
    title: "¿Cambiar el archivo seleccionado?",
    description: "Se abrirá el selector para elegir otro archivo. Si cancelas, se conservará el actual.",
    preview: `Archivo actual: ${selectedUpload.name}`,
    cancelLabel: "No, conservar archivo",
    acceptLabel: "Elegir otro archivo",
  });
  if (confirmed) fileInput.click();
});

removeFile.addEventListener("click", async () => {
  if (!selectedUpload) return;
  const file = selectedUpload;
  const confirmed = await confirmOperation({
    title: "¿Eliminar el archivo seleccionado?",
    description: "El archivo se quitará del área de trabajo. El original en tu equipo no se eliminará.",
    preview: `Archivo: ${file.name}\nTamaño: ${formatBytes(file.size)}`,
    cancelLabel: "No, conservar archivo",
    acceptLabel: "Sí, quitar archivo",
  });
  if (!confirmed) return;
  clearSelectedFile();
  setFeedback(fileFeedback, "");
  showToast("Archivo quitado del área de trabajo.");
});

function showFilePreviewNotice(title, message) {
  const notice = document.createElement("div");
  notice.className = "file-preview-notice";
  notice.innerHTML = `
    <span class="file-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6 3.8h7l5 5v11.4H6V3.8Z" stroke="currentColor" stroke-width="1.7"
          stroke-linejoin="round" />
        <path d="M13 3.8v5h5M9 13h6m-6 3h6" stroke="currentColor" stroke-width="1.7"
          stroke-linecap="round" />
      </svg>
    </span>
    <strong></strong>
    <p></p>
  `;
  notice.querySelector("strong").textContent = title;
  notice.querySelector("p").textContent = message;
  filePreviewContent.replaceChildren(notice);
}

function closePreviewUrl() {
  if (filePreviewUrl) {
    URL.revokeObjectURL(filePreviewUrl);
    filePreviewUrl = "";
  }
}

function findZipEntry(bytes, entryName) {
  const view = new DataView(bytes);
  const minimumEnd = Math.max(0, bytes.byteLength - 65_557);
  let endOffset = -1;
  for (let offset = bytes.byteLength - 22; offset >= minimumEnd; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new Error("El documento no tiene una estructura ZIP válida.");

  const entryCount = view.getUint16(endOffset + 10, true);
  let offset = view.getUint32(endOffset + 16, true);
  const decoder = new TextDecoder();
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("No se pudo leer la estructura del documento.");
    }
    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const nameStart = offset + 46;
    const name = decoder.decode(new Uint8Array(bytes, nameStart, nameLength));

    if (name === entryName) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      return {
        compression,
        content: new Uint8Array(bytes, dataOffset, compressedSize),
      };
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

async function readZipText(bytes, entryName) {
  const entry = findZipEntry(bytes, entryName);
  if (!entry) return null;
  if (entry.compression === 0) return new TextDecoder().decode(entry.content);
  if (entry.compression !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador no permite descomprimir este documento para la vista previa.");
  }
  const stream = new Blob([entry.content]).stream().pipeThrough(
    new DecompressionStream("deflate-raw"),
  );
  return new Response(stream).text();
}

function parseOfficeXml(xml, description) {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.querySelector("parsererror")) {
    throw new Error(`No fue posible leer el contenido XML del ${description}.`);
  }
  return parsed;
}

async function previewDocx(file) {
  const bytes = await file.arrayBuffer();
  const xml = await readZipText(bytes, "word/document.xml");
  if (!xml) throw new Error("No se encontró el contenido principal del documento.");
  const documentXml = parseOfficeXml(xml, "documento");
  const paragraphs = [...documentXml.getElementsByTagNameNS("*", "p")].map((paragraph) =>
    [...paragraph.getElementsByTagNameNS("*", "t")]
      .map((text) => text.textContent)
      .join(""),
  );
  return paragraphs.filter(Boolean).join("\n") || "El documento no contiene texto para mostrar.";
}

async function previewXlsx(file) {
  const bytes = await file.arrayBuffer();
  const workbookXml = await readZipText(bytes, "xl/workbook.xml");
  const relationXml = await readZipText(bytes, "xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relationXml) {
    throw new Error("No se encontró la estructura de hojas de cálculo.");
  }

  const workbook = parseOfficeXml(workbookXml, "hoja de cálculo");
  const relations = parseOfficeXml(relationXml, "relaciones del libro");
  const firstSheet = workbook.getElementsByTagNameNS("*", "sheet")[0];
  if (!firstSheet) return "El libro no contiene hojas para mostrar.";

  const relationId = firstSheet.getAttributeNS(
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "id",
  );
  const relation = [...relations.getElementsByTagNameNS("*", "Relationship")]
    .find((item) => item.getAttribute("Id") === relationId);
  if (!relation) throw new Error("No se pudo localizar la primera hoja.");
  const sheetPath = `xl/${relation.getAttribute("Target").replace(/^\/?xl\//, "")}`;
  const sheetXml = await readZipText(bytes, sheetPath);
  if (!sheetXml) throw new Error("No se encontró el contenido de la primera hoja.");

  const sharedStringsXml = await readZipText(bytes, "xl/sharedStrings.xml");
  const sharedStrings = sharedStringsXml
    ? [...parseOfficeXml(sharedStringsXml, "cadenas compartidas")
      .getElementsByTagNameNS("*", "si")]
      .map((item) => [...item.getElementsByTagNameNS("*", "t")]
        .map((text) => text.textContent)
        .join(""))
    : [];
  const sheet = parseOfficeXml(sheetXml, "primera hoja");
  const rows = [...sheet.getElementsByTagNameNS("*", "row")].slice(0, 100).map((row) =>
    [...row.getElementsByTagNameNS("*", "c")].slice(0, 20).map((cell) => {
      const type = cell.getAttribute("t");
      if (type === "inlineStr") {
        return [...cell.getElementsByTagNameNS("*", "t")]
          .map((text) => text.textContent)
          .join("");
      }
      const value = cell.getElementsByTagNameNS("*", "v")[0]?.textContent ?? "";
      return type === "s" ? sharedStrings[Number(value)] ?? "" : value;
    }).join("\t"),
  );
  return rows.join("\n").trim() || "La primera hoja no contiene celdas para mostrar.";
}

async function openFilePreview() {
  if (!selectedUpload) return;
  closePreviewUrl();
  filePreviewContent.replaceChildren();
  filePreviewTitle.textContent = selectedUpload.name;
  filePreviewDescription.textContent =
    `${formatBytes(selectedUpload.size)} · ${selectedUpload.type || "Archivo local"}`;
  filePreviewDialog.showModal();
  showToast("Vista previa abierta.");

  const extension = `.${selectedUpload.name.split(".").pop().toLowerCase()}`;
  if (extension === ".enc") {
    showFilePreviewNotice(
      "Archivo cifrado",
      "El contenido está protegido y no puede previsualizarse antes de descifrarlo.",
    );
    return;
  }

  try {
    if (extension === ".pdf") {
      filePreviewUrl = URL.createObjectURL(
        new Blob([await selectedUpload.arrayBuffer()], { type: "application/pdf" }),
      );
      const frame = document.createElement("iframe");
      frame.title = `Vista previa de ${selectedUpload.name}`;
      frame.src = filePreviewUrl;
      filePreviewContent.replaceChildren(frame);
      return;
    }

    let content;
    if (extension === ".txt") {
      content = await selectedUpload.text();
    } else if (extension === ".docx") {
      content = await previewDocx(selectedUpload);
    } else if (extension === ".xlsx") {
      content = await previewXlsx(selectedUpload);
    }

    const preview = document.createElement("pre");
    preview.className = "file-preview-text";
    preview.textContent = content.slice(0, 50_000);
    filePreviewContent.replaceChildren(preview);
  } catch (error) {
    showFilePreviewNotice(
      "No se pudo generar la vista previa",
      error.message || "El navegador no pudo leer el contenido de este archivo.",
    );
  }
}

previewFile.addEventListener("click", openFilePreview);
closeFilePreview.addEventListener("click", () => filePreviewDialog.close());
filePreviewDialog.addEventListener("close", closePreviewUrl);
filePreviewDialog.addEventListener("click", (event) => {
  if (event.target === filePreviewDialog) filePreviewDialog.close();
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
}
dropZone.addEventListener("drop", async (event) => {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (selectedUpload) {
    const confirmed = await confirmOperation({
      title: "¿Reemplazar el archivo seleccionado?",
      description: "El archivo actual se sustituirá por el que acabas de arrastrar.",
      preview: `Actual: ${selectedUpload.name}\nNuevo: ${file.name}`,
      cancelLabel: "No, conservar archivo",
      acceptLabel: "Reemplazar archivo",
    });
    if (!confirmed) return;
  }
  selectFile(file);
});

function encodeBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function downloadBase64File(name, content) {
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const url = URL.createObjectURL(new Blob([bytes]));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

fileSubmit.addEventListener("click", async () => {
  if (!selectedUpload) return;
  if (!filePassword.value) {
    setFeedback(fileFeedback, "Ingresa una contraseña para continuar.", "error");
    return;
  }

  const file = selectedUpload;
  const mode = fileMode;
  const confirmed = await confirmOperation({
    title: `¿Confirmas ${mode === "encrypt" ? "cifrar" : "descifrar"} este archivo?`,
    description: "Verifica que hayas seleccionado el documento correcto.",
    preview: `Archivo: ${file.name}\nTamaño: ${formatBytes(file.size)}`,
    cancelLabel: "No, revisar archivo",
  });
  if (!confirmed) return;

  fileSubmit.disabled = true;
  fileSubmitLabel.textContent = mode === "encrypt" ? "Cifrando..." : "Descifrando...";
  setFeedback(fileFeedback, "");
  const password = filePassword.value;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await postJson(`/api/files/${mode}`, {
      name: file.name,
      content: encodeBase64(bytes),
      password,
    });
    downloadBase64File(result.name, result.content);
    setFeedback(
      fileFeedback,
      mode === "encrypt"
        ? "Archivo cifrado correctamente. La descarga comenzó."
        : "El contenido original se recuperó correctamente. La descarga comenzó.",
      "success",
    );
    showToast(mode === "encrypt"
      ? "Archivo cifrado. La descarga comenzó."
      : "Archivo descifrado. La descarga comenzó.");
  } catch (error) {
    setFeedback(fileFeedback, error.message, "error");
  } finally {
    filePassword.value = "";
    fileSubmit.disabled = !selectedUpload;
    fileSubmitLabel.textContent = fileMode === "encrypt" ? "Cifrar archivo" : "Descifrar archivo";
  }
});

function displayHistory(entries) {
  historyList.replaceChildren();
  historyPreview.replaceChildren();
  historyPreview.classList.add("is-hidden");
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "Todavía no tienes elementos cifrados en tu historial.";
    historyList.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "history-item";
    const icon = document.createElement("span");
    icon.className = "history-item-icon";
    icon.textContent = entry.kind === "text" ? "TXT" : entry.name.split(".").pop().toUpperCase();
    const info = document.createElement("span");
    info.className = "history-item-info";
    const name = document.createElement("strong");
    name.textContent = entry.name;
    const created = document.createElement("small");
    created.textContent = new Date(entry.created_at).toLocaleString();
    info.append(name, created);
    const previewButton = document.createElement("button");
    previewButton.className = "history-preview-button";
    previewButton.type = "button";
    previewButton.textContent = "Vista previa";
    previewButton.addEventListener("click", () => showHistoryPreview(entry));
    item.append(icon, info, previewButton);
    historyList.append(item);
  });
}

historyUnlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = historyAccountPassword.value;
  const submitButton = historyUnlockForm.querySelector("button[type=submit]");
  submitButton.disabled = true;
  setFeedback(historyFeedback, "");
  try {
    const result = await postJson("/api/history/unlock", { password });
    displayHistory(result.entries);
    historyResults.classList.remove("is-hidden");
    setFeedback(historyFeedback, "Historial desbloqueado.", "success");
    showToast("Historial desbloqueado.");
  } catch (error) {
    setFeedback(historyFeedback, error.message, "error");
  } finally {
    historyAccountPassword.value = "";
    submitButton.disabled = false;
  }
});

function showHistoryPreview(entry) {
  historyPreview.replaceChildren();
  historyPreview.classList.remove("is-hidden");

  const heading = document.createElement("h3");
  heading.textContent = entry.name;
  const description = document.createElement("p");
  description.textContent = "Ingresa la contraseña con la que cifraste este elemento para ver su contenido.";
  const form = document.createElement("form");
  form.className = "history-preview-form";
  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.autocomplete = "off";
  passwordInput.required = true;
  passwordInput.placeholder = "Contraseña de cifrado";
  const submitButton = document.createElement("button");
  submitButton.className = "primary-button";
  submitButton.type = "submit";
  submitButton.textContent = "Mostrar vista previa";
  const feedback = document.createElement("p");
  feedback.className = "inline-feedback";
  const content = document.createElement("pre");
  content.classList.add("is-hidden");
  form.append(passwordInput, submitButton);
  historyPreview.append(heading, description, form, feedback, content);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = passwordInput.value;
    submitButton.disabled = true;
    setFeedback(feedback, "");
    try {
      const result = await postJson(`/api/history/${entry.id}/preview`, { password });
      content.textContent = result.preview;
      content.classList.remove("is-hidden");
      if (result.kind === "file") {
        const download = document.createElement("a");
        download.className = "primary-button history-download";
        download.textContent = "Descargar original";
        download.href = `data:application/octet-stream;base64,${result.download}`;
        download.download = result.name;
        historyPreview.append(download);
      }
      setFeedback(feedback, "Contenido original recuperado correctamente.", "success");
      showToast("Vista previa recuperada correctamente.");
    } catch (error) {
      setFeedback(feedback, error.message, "error");
      content.classList.add("is-hidden");
    } finally {
      passwordInput.value = "";
      submitButton.disabled = false;
    }
  });
}

document.querySelector("[data-view=history]").addEventListener("click", () => {
  historyAccountPassword.focus();
});
