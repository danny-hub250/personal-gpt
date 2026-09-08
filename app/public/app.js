const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const form = document.getElementById("chatForm");
const input = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");
const newChatBtn = document.getElementById("newChatBtn");

let history = []; // { role: "user" | "assistant", content: string }[]

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
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, deployment: modelSelect.value }),
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
