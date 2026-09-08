const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const form = document.getElementById("chatForm");
const input = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");
const newChatBtn = document.getElementById("newChatBtn");

const instructionsBtn = document.getElementById("instructionsBtn");
const instructionsModal = document.getElementById("instructionsModal");
const instructionsInput = document.getElementById("instructionsInput");
const instructionsSaveBtn = document.getElementById("instructionsSaveBtn");
const instructionsCancelBtn = document.getElementById("instructionsCancelBtn");
const instructionsClearBtn = document.getElementById("instructionsClearBtn");

const INSTRUCTIONS_KEY = "personal-gpt:instructions";

let history = []; // { role: "user" | "assistant", content: string }[]

function loadInstructions() {
  try {
    return localStorage.getItem(INSTRUCTIONS_KEY) || "";
  } catch {
    return ""; // 프라이빗 브라우징 등으로 접근이 막힌 경우 지침 없이 동작.
  }
}

function saveInstructions(value) {
  try {
    if (value) {
      localStorage.setItem(INSTRUCTIONS_KEY, value);
    } else {
      localStorage.removeItem(INSTRUCTIONS_KEY);
    }
  } catch {
    // 저장 실패해도 현재 세션에서는 계속 사용 가능하도록 무시.
  }
}

function updateInstructionsBtnState() {
  instructionsBtn.classList.toggle("active", Boolean(loadInstructions()));
}

function openInstructionsModal() {
  instructionsInput.value = loadInstructions();
  instructionsModal.hidden = false;
  instructionsInput.focus();
}

function closeInstructionsModal() {
  instructionsModal.hidden = true;
}

instructionsBtn.addEventListener("click", openInstructionsModal);
instructionsCancelBtn.addEventListener("click", closeInstructionsModal);
instructionsClearBtn.addEventListener("click", () => {
  instructionsInput.value = "";
});
instructionsSaveBtn.addEventListener("click", () => {
  const value = instructionsInput.value.trim();
  saveInstructions(value);
  updateInstructionsBtnState();

  // localStorage에 실제로 반영됐는지 즉시 재확인 후 눈에 보이는 피드백을 준다.
  // (프라이빗 브라우징 등으로 저장이 조용히 실패하는 경우를 사용자가 알 수 있게 함)
  const savedOk = loadInstructions() === value;
  const originalLabel = instructionsSaveBtn.textContent;
  instructionsSaveBtn.textContent = savedOk ? "저장됨 ✓" : "저장 실패 ⚠";
  instructionsSaveBtn.disabled = true;

  setTimeout(() => {
    instructionsSaveBtn.textContent = originalLabel;
    instructionsSaveBtn.disabled = false;
    closeInstructionsModal();
  }, 700);
});
instructionsModal.addEventListener("click", (e) => {
  if (e.target === instructionsModal) closeInstructionsModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !instructionsModal.hidden) closeInstructionsModal();
});

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMessage(role, content) {
  emptyState.style.display = "none";

  const wrap = document.createElement("div");
  wrap.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "나" : "AI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = escapeHtml(content);

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return bubble;
}

async function loadConfig() {
  const res = await fetch("/api/config");
  const config = await res.json();

  modelSelect.innerHTML = "";
  for (const dep of config.deployments) {
    const opt = document.createElement("option");
    opt.value = dep;
    opt.textContent = dep;
    modelSelect.appendChild(opt);
  }
  if (config.defaultDeployment) {
    modelSelect.value = config.defaultDeployment;
  }
}

async function sendMessage(text) {
  history.push({ role: "user", content: text });
  renderMessage("user", text);

  const assistantBubble = renderMessage("assistant", "");
  let assistantText = "";

  sendBtn.disabled = true;
  try {
    const instructions = loadInstructions();
    const payloadMessages = instructions
      ? [{ role: "system", content: instructions }, ...history]
      : history;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payloadMessages, deployment: modelSelect.value }),
    });

    if (!res.ok || !res.body) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `요청 실패 (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;

        const json = JSON.parse(payload);
        if (json.error) throw new Error(json.error);
        if (json.delta) {
          assistantText += json.delta;
          assistantBubble.innerHTML = escapeHtml(assistantText);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }
    }

    history.push({ role: "assistant", content: assistantText });
  } catch (err) {
    assistantBubble.innerHTML = escapeHtml(`⚠️ ${err.message}`);
  } finally {
    sendBtn.disabled = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.style.height = "auto";
  sendMessage(text);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
});

newChatBtn.addEventListener("click", () => {
  history = [];
  messagesEl.innerHTML = "";
  messagesEl.appendChild(emptyState);
  emptyState.style.display = "flex";
});

loadConfig();
updateInstructionsBtnState();
