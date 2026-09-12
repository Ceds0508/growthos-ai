import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

/**
 * Único endpoint de IA usado pelo frontend. Recebe { system, messages } e
 * repassa para a API da Anthropic usando a chave guardada no servidor.
 * A chave NUNCA é enviada ao navegador.
 */
app.post("/api/chat", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error:
          "ANTHROPIC_API_KEY não configurada no servidor. Copie .env.example para .env e cole sua chave.",
      });
    }
    const { system, messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Nenhuma mensagem enviada." });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: system || undefined,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error("Erro da Anthropic:", data);
      return res
        .status(anthropicRes.status)
        .json({ error: data?.error?.message || "Erro ao chamar a API da Anthropic." });
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.json({ text });
  } catch (err) {
    console.error("Erro interno em /api/chat:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, aiConfigured: !!ANTHROPIC_API_KEY });
});

// Em produção, o build do frontend (client/dist) é servido pelo mesmo
// processo Node — assim você publica UM único serviço web.
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(404).send("Build do frontend não encontrado. Rode `npm run build` na pasta client.");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GrowthOS AI rodando em http://localhost:${PORT}`);
  console.log(ANTHROPIC_API_KEY ? "Chave de IA detectada." : "AVISO: ANTHROPIC_API_KEY não definida — o Diretor IA não vai funcionar.");
});
