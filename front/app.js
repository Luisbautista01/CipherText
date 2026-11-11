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
const selectedFile = document.querySelector("#selected-file");
const fileName = document.querySelector("#file-name");
const fileSize = document.querySelector("#file-size");
const filePassword = document.querySelector("#file-password");
const fileSubmit = document.querySelector("#file-submit");
const fileSubmitLabel = document.querySelector("#file-submit-label");
const fileFeedback = document.querySelector("#file-feedback");
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

function setFeedback(element, message, kind = "") {
  element.textContent = message;
  element.className = `inline-feedback${kind ? ` ${kind}` : ""}`;
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
}

messageInput.addEventListener("input", updateCharacterCount);

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

textSubmit.addEventListener("click", async () => {
  const text = messageInput.value;
  if (textMode === "encrypt" && !text) {
    setFeedback(textFeedback, "Escribe un mensaje antes de continuar.", "error");
    return;
  }
  if (textMode === "encrypt" && [...text].length > 250) {
    setFeedback(textFeedback, "El mensaje supera el límite permitido.", "error");
    return;
  }
  if (!textPassword.value) {
    setFeedback(textFeedback, "Ingresa una contraseña para continuar.", "error");
    return;
  }

  textSubmit.disabled = true;
  textSubmitLabel.textContent = textMode === "encrypt" ? "Cifrando..." : "Descifrando...";
  setFeedback(textFeedback, "");
  const password = textPassword.value;
  try {
    const result = await postJson(`/api/text/${textMode}`, {
      text,
      password,
    });
    textResultValue = result.result;
    textResult.textContent = result.result;
    textResultLabel.textContent = textMode === "encrypt" ? "Mensaje cifrado" : "Contenido original";
    textResultWrap.classList.remove("is-hidden");
    setFeedback(
      textFeedback,
      textMode === "encrypt"
        ? "El mensaje se cifró correctamente."
        : "El contenido original se recuperó correctamente.",
      "success",
    );
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
  button.addEventListener("click", () => updateFileMode(button.dataset.mode));
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
    clearSelectedFile();
    setFeedback(fileFeedback, "Selecciona un archivo PDF, DOCX, XLSX o TXT.", "error");
    return;
  }
  if (fileMode === "decrypt" && extension !== ".enc") {
    clearSelectedFile();
    setFeedback(fileFeedback, "Selecciona un archivo .enc.", "error");
    return;
  }
  if (fileMode === "encrypt" && file.size > MAX_FILE_BYTES) {
    clearSelectedFile();
    setFeedback(fileFeedback, "El archivo supera el límite de 4 MB.", "error");
    return;
  }
  selectedUpload = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  selectedFile.classList.remove("is-hidden");
  fileSubmit.disabled = false;
  setFeedback(fileFeedback, "");
}

function clearSelectedFile() {
  selectedUpload = null;
  fileInput.value = "";
  selectedFile.classList.add("is-hidden");
  fileSubmit.disabled = true;
}

fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));
document.querySelector("#remove-file").addEventListener("click", clearSelectedFile);

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
dropZone.addEventListener("drop", (event) => selectFile(event.dataTransfer.files[0]));

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

  fileSubmit.disabled = true;
  fileSubmitLabel.textContent = fileMode === "encrypt" ? "Cifrando..." : "Descifrando...";
  setFeedback(fileFeedback, "");
  const password = filePassword.value;
  try {
    const bytes = new Uint8Array(await selectedUpload.arrayBuffer());
    const result = await postJson(`/api/files/${fileMode}`, {
      name: selectedUpload.name,
      content: encodeBase64(bytes),
      password,
    });
    downloadBase64File(result.name, result.content);
    setFeedback(
      fileFeedback,
      fileMode === "encrypt"
        ? "Archivo cifrado correctamente. La descarga comenzó."
        : "El contenido original se recuperó correctamente. La descarga comenzó.",
      "success",
    );
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
