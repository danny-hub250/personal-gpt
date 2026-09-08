require("dotenv").config();

const express = require("express");
const path = require("path");
const { AzureOpenAI } = require("openai");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");

const PORT = process.env.PORT || 8080;
const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
const API_KEY = process.env.AZURE_OPENAI_API_KEY; // 로컬 개발용 대안. App Service에서는 Managed Identity 사용을 권장.
const DEPLOYMENTS = (process.env.AZURE_OPENAI_DEPLOYMENTS || "gpt-5.6-sol,gpt-6-astra")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

if (!ENDPOINT) {
  console.warn(
    "[personal-gpt] AZURE_OPENAI_ENDPOINT가 설정되지 않았습니다. .env 또는 App Service 설정을 확인하세요."
  );
}

function createClient() {
  if (API_KEY) {
    return new AzureOpenAI({ endpoint: ENDPOINT, apiVersion: API_VERSION, apiKey: API_KEY });
  }

  // Managed Identity(App Service) 또는 az login(로컬)을 통한 Entra ID 인증.
  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    "https://cognitiveservices.azure.com/.default"
  );
  return new AzureOpenAI({ endpoint: ENDPOINT, apiVersion: API_VERSION, azureADTokenProvider });
}

const client = createClient();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// 프런트엔드가 사용할 수 있는 모델(배포) 목록 제공.
app.get("/api/config", (_req, res) => {
  res.json({
    deployments: DEPLOYMENTS,
    defaultDeployment: DEPLOYMENTS[0] || null,
  });
});

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// 채팅 요청을 받아 Azure OpenAI 응답을 SSE(Server-Sent Events)로 스트리밍한다.
app.post("/api/chat", async (req, res) => {
  const { messages, deployment } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 배열이 필요합니다." });
  }

  const model = DEPLOYMENTS.includes(deployment) ? deployment : DEPLOYMENTS[0];
  if (!model) {
    return res.status(500).json({ error: "사용 가능한 모델 배포가 없습니다." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (err) {
    console.error("[personal-gpt] chat completion 오류:", err);
    res.write(`data: ${JSON.stringify({ error: err.message || "요청 처리 중 오류가 발생했습니다." })}\n\n`);
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`[personal-gpt] listening on port ${PORT}`);
});
