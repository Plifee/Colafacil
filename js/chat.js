// ========================================
// COLAFÁCIL - CHAT EM TEMPO REAL
// ========================================

import {
    database,
    auth,
    ref,
    push,
    onChildAdded,
    serverTimestamp,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "./firebase.js";


// ========================================
// ELEMENTOS HTML
// ========================================

const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");

const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

const logoutBtn = document.getElementById("logout-btn");

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");

const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");

const imagePreview = document.getElementById("image-preview");
const previewImg = document.getElementById("preview-img");
const removeImageBtn = document.getElementById("remove-image");

const statusText = document.getElementById("status-text");
const statusDot = document.querySelector(".status-dot");


// ========================================
// VARIÁVEIS
// ========================================

let usuarioAtual = null;

let selectedImage = null;
let previewUrl = null;

let cancelarMensagens = null;
let bancoDisponivel = false;

const mensagensRef = ref(database, "colafacil/mensagens");


// ========================================
// ATUALIZAR STATUS
// ========================================

function atualizarStatus(texto, cor) {

    statusText.textContent = texto;
    statusDot.style.background = cor;

}


// ========================================
// LIMPAR MENSAGENS DA TELA
// ========================================

function limparMensagensDaTela() {

    chatMessages.querySelectorAll(".message")
        .forEach(message => message.remove());

}


// ========================================
// MONITORAR AUTENTICAÇÃO
// ========================================

onAuthStateChanged(auth, (user) => {

    // ENCERRAR LISTENER ANTERIOR

    if (cancelarMensagens) {

        cancelarMensagens();
        cancelarMensagens = null;

    }

    usuarioAtual = user;
    bancoDisponivel = false;

    limparMensagensDaTela();

    if (user) {

        console.log("Usuário autenticado:", user.uid);

        loginContainer.hidden = true;
        chatContainer.hidden = false;

        atualizarStatus(
            "Conectando...",
            "#eab308"
        );

        iniciarMensagens(user.uid);

    } else {

        loginContainer.hidden = false;
        chatContainer.hidden = true;

        messageInput.value = "";
        limparImagem();

        atualizarStatus(
            "Desconectado",
            "#64748b"
        );

    }

});


// ========================================
// REALIZAR LOGIN
// ========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = loginEmail.value.trim();
    const senha = loginPassword.value;

    loginError.textContent = "";

    loginBtn.disabled = true;
    loginBtn.textContent = "ENTRANDO...";

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        loginPassword.value = "";

    } catch (error) {

        console.error("Erro no login:", error.code);

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {

            loginError.textContent =
                "E-mail ou senha incorretos.";

        } else if (
            error.code === "auth/too-many-requests"
        ) {

            loginError.textContent =
                "Muitas tentativas. Aguarde e tente novamente.";

        } else if (
            error.code === "auth/network-request-failed"
        ) {

            loginError.textContent =
                "Erro de conexão com a internet.";

        } else {

            loginError.textContent =
                "Não foi possível entrar. Tente novamente.";

        }

    } finally {

        loginBtn.disabled = false;
        loginBtn.textContent = "ENTRAR";

    }

});


// ========================================
// SAIR DA CONTA
// ========================================

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

    } catch (error) {

        console.error("Erro ao sair:", error);

        alert("Não foi possível sair da conta.");

    }

});


// ========================================
// RECEBER MENSAGENS DO FIREBASE
// ========================================

function iniciarMensagens(uidDaSessao) {

    bancoDisponivel = true;

    cancelarMensagens = onChildAdded(

        mensagensRef,

        (snapshot) => {

            // EVITAR MENSAGENS DE SESSÕES ANTIGAS

            if (usuarioAtual?.uid !== uidDaSessao) {
                return;
            }

            const mensagem = snapshot.val();

            if (!mensagem) return;

            const enviadaPorMim =
                mensagem.uid === uidDaSessao;

            adicionarMensagem(
                mensagem.texto || "",
                enviadaPorMim,
                mensagem.imagem || null
            );

            atualizarStatus(
                "Conectado",
                "#22c55e"
            );

        },

        (error) => {

            console.error(
                "Erro ao receber mensagens:",
                error
            );

            bancoDisponivel = false;

            atualizarStatus(
                "Sem acesso ao banco",
                "#ef4444"
            );

        }

    );

}


// ========================================
// ADICIONAR MENSAGEM NA INTERFACE
// ========================================

function adicionarMensagem(texto, enviadaPorMim, imagemBase64 = null) {

    const message = document.createElement("div");

    message.classList.add("message");

    if (enviadaPorMim) {
        message.classList.add("sent");
    } else {
        message.classList.add("received");
    }

    // Texto (se existir)
    if (texto) {
        const paragraph = document.createElement("p");
        paragraph.textContent = texto;
        message.appendChild(paragraph);
    }

    // Imagem (se existir)
    if (imagemBase64) {
        const img = document.createElement("img");
        img.src = imagemBase64;
        img.alt = "Print";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.marginTop = texto ? "8px" : "0";
        img.style.cursor = "pointer";

        // Clique para abrir em tamanho maior
        img.addEventListener("click", () => {
            window.open(imagemBase64, "_blank");
        });

        message.appendChild(img);
    }

    chatMessages.appendChild(message);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


// ========================================
// ENVIAR MENSAGEM AO FIREBASE
// ========================================

async function enviarMensagem() {

    if (!usuarioAtual) {

        alert("Você precisa estar conectado.");

        return;

    }

    if (!bancoDisponivel) {

        alert("O banco de dados não está disponível.");

        return;

    }

    const texto = messageInput.value.trim();

    if (!texto && !selectedImage) return;

    if (texto.length > 5000) {

        alert("A mensagem deve ter no máximo 5000 caracteres.");

        return;

    }

    sendBtn.disabled = true;

    try {

        let imagemBase64 = null;

        // Converte a imagem selecionada (ou colada) para base64
        if (selectedImage) {
            imagemBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(selectedImage);
            });
        }

        await push(mensagensRef, {

            uid: usuarioAtual.uid,

            texto: texto || "",

            imagem: imagemBase64,

            criadoEm: serverTimestamp()

        });

        // Limpa tudo após enviar
        messageInput.value = "";
        limparImagem();

    } catch (error) {

        console.error(
            "Erro ao enviar mensagem:",
            error
        );

        alert(
            "Não foi possível enviar a mensagem. Verifique as regras do Firebase."
        );

    } finally {

        sendBtn.disabled = false;

    }

}


// ========================================
// BOTÃO ENVIAR
// ========================================

sendBtn.addEventListener("click", enviarMensagem);


// ========================================
// ENTER PARA ENVIAR
// SHIFT + ENTER PARA QUEBRAR LINHA
// ========================================

messageInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        enviarMensagem();

    }

});


// ========================================
// ANEXAR IMAGEM
// ========================================

attachBtn.addEventListener("click", () => {

    fileInput.click();

});

fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];

    if (file) {

        selecionarImagem(file);

    }

});


// ========================================
// COLAR PRINT COM CTRL + V
// ========================================

document.addEventListener("paste", (event) => {

    if (!usuarioAtual) return;

    const items = event.clipboardData?.items;

    if (!items) return;

    for (const item of items) {

        if (item.type.startsWith("image/")) {

            const file = item.getAsFile();

            if (file) {

                event.preventDefault();

                selecionarImagem(file);

            }

            break;

        }

    }

});


// ========================================
// PRÉ-VISUALIZAÇÃO DA IMAGEM
// ========================================

function selecionarImagem(file) {

    if (!file.type.startsWith("image/")) {

        alert("Selecione uma imagem válida.");

        return;

    }

    if (file.size > 10 * 1024 * 1024) {

        alert("A imagem deve ter no máximo 10 MB.");

        return;

    }

    limparImagem();

    selectedImage = file;

    previewUrl = URL.createObjectURL(file);

    previewImg.src = previewUrl;

    imagePreview.style.display = "block";

}


// ========================================
// LIMPAR IMAGEM SELECIONADA
// ========================================

function limparImagem() {

    selectedImage = null;

    if (previewUrl) {

        URL.revokeObjectURL(previewUrl);

        previewUrl = null;

    }

    previewImg.removeAttribute("src");

    imagePreview.style.display = "none";

    fileInput.value = "";

}

removeImageBtn.addEventListener(
    "click",
    limparImagem
);