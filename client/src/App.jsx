import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Building2, MessageSquare, Compass, Megaphone, Handshake,
  Radar, Users2, Rocket, FlaskConical, LineChart, ScrollText, ListChecks,
  FileText, Settings, Menu, X, ArrowRight, ArrowUpRight, Send, Plus, Trash2,
  Pencil, ChevronRight, ChevronDown, Check, AlertTriangle, TrendingUp,
  TrendingDown, Sparkles, Lock, Mail, Eye, EyeOff, Loader2, Circle,
  CheckCircle2, Link2, Unlink, RefreshCw, Search, Filter, Download,
  BookOpen, Target, ShieldAlert, Gauge, ClipboardList, Layers, Sun, Moon,
  LogOut, ChevronLeft, Info, DollarSign, Percent, Clock3, Trophy
} from "lucide-react";

/* =========================================================================
   GrowthOS AI
   Diretor de Marketing, Vendas e Growth baseado em IA — SaaS shell
   ---------------------------------------------------------------------
   Notas de arquitetura (para quem for evoluir isto):
   - Não há backend real neste ambiente. Persistência é feita via
     window.storage (chave/valor), escopada por usuário (shared:false).
   - "Autenticação" aqui é uma simulação local para fins de demonstração
     de fluxo — não é segura e não deve ser usada em produção.
   - O chat do Diretor IA chama a API real da Anthropic (claude-sonnet-4-6)
     através de fetch, com um system prompt de negócio + contexto da
     empresa injetado dinamicamente. Isso é IA real, não mock.
   - Módulos que dependeriam de integrações externas (Google Ads, GA4,
     CRM, pesquisa de mercado ao vivo, WhatsApp API) estão desenhados
     como pontos de integração com estado explícito: Conectado /
     Não conectado / Configuração necessária — nunca fingindo dados reais.
   ========================================================================= */

/* ---------------------------- Design tokens ---------------------------- */
const T = {
  bg: "#0A0D16",
  bgElevated: "#0D111C",
  panel: "#12172400",
  panelSolid: "#121724",
  panel2: "#171D2E",
  border: "#232B40",
  borderSoft: "#1A2135",
  text: "#E9ECF5",
  textDim: "#9AA3BC",
  textFaint: "#5E6784",
  accent: "#5B6EF5",
  accentSoft: "#5B6EF522",
  accent2: "#8B7CF6",
  good: "#34D399",
  goodSoft: "#34D39922",
  warn: "#F4B740",
  warnSoft: "#F4B74022",
  bad: "#F1685E",
  badSoft: "#F1685E22",
};

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";
const FONT_BODY = "'Inter', 'Segoe UI', sans-serif";

const FONT_LINK = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #0A0D16; }
    .gos-grid-bg {
      background-image:
        radial-gradient(circle at 18% -10%, #5B6EF52a 0%, transparent 42%),
        radial-gradient(circle at 88% 10%, #8B7CF61c 0%, transparent 38%),
        linear-gradient(#0A0D16, #0A0D16);
      background-attachment: fixed;
    }
    ::selection { background: ${T.accent}55; }
    .gos-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .gos-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
    .gos-scroll::-webkit-scrollbar-track { background: transparent; }
    @keyframes gosFadeIn { from { opacity: 0; transform: translateY(4px);} to { opacity:1; transform:none;} }
    .gos-fade { animation: gosFadeIn .25s ease; }
    @keyframes gosPulse { 0%,100%{opacity:.35} 50%{opacity:1} }
    .gos-pulse { animation: gosPulse 1.2s ease-in-out infinite; }
    input::placeholder, textarea::placeholder { color: ${T.textFaint}; }
    input, textarea, select, button { font-family: ${FONT_BODY}; }
    a { color: inherit; }
  `}</style>
);

/* ------------------------------ Storage ---------------------------------
   Versão web: usa localStorage do navegador (por domínio/dispositivo).
   Mesma interface assíncrona do storage usado no protótipo, para não exigir
   mudanças no resto do código.
   ------------------------------------------------------------------------ */
const STORAGE_PREFIX = "growthos:";
const store = {
  async get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("storage set failed", key, e);
      return false;
    }
  },
  async del(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {}
  },
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const nowISO = () => new Date().toISOString();
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

/* ------------------------------ Default data ----------------------------- */
const emptyCompany = () => ({
  onboardingComplete: false,
  info: {
    nome: "", segmento: "", pais: "Brasil", regiao: "", cidade: "",
    site: "", descricao: "", modeloNegocio: "",
  },
  produtos: [],
  audiencia: {
    publicoAlvo: "", clienteIdeal: "", segmentos: "", regiaoAtuacao: "",
    decisores: "", dores: "", concorrentesConhecidos: "", alternativas: "",
  },
  marketingVendas: {
    canaisAtuais: "", investimentoMensal: "", equipeComercial: "",
    processoVendas: "", cicloMedioVendas: "", taxaConversao: "",
    ticketMedio: "", fontesClientes: "", dificuldades: "",
  },
  objetivos: {
    principais: [], objetivoPrincipal: "", meta: "", prazo: "",
    orcamento: "", restricoes: "",
  },
});

const OBJETIVOS_OPCOES = [
  "Aumentar receita", "Aumentar lucro", "Reduzir CAC", "Melhorar conversão",
  "Gerar mais leads", "Melhorar retenção", "Aumentar ticket médio",
  "Expandir mercado", "Lançar produto", "Melhorar posicionamento",
  "Estruturar vendas", "Outro",
];

const MODELOS_NEGOCIO = ["B2B", "B2C", "B2B2C", "Marketplace", "SaaS", "E-commerce", "Serviços", "Indústria", "Outro"];

const INTEGRATIONS = [
  { id: "ga4", name: "Google Analytics", desc: "Tráfego, comportamento e conversões do site.", status: "not_connected" },
  { id: "gads", name: "Google Ads", desc: "Investimento, cliques e conversões de mídia paga.", status: "not_connected" },
  { id: "meta", name: "Meta Ads", desc: "Campanhas no Instagram e Facebook.", status: "not_connected" },
  { id: "crm", name: "CRM", desc: "Pipeline, oportunidades e histórico comercial.", status: "not_connected" },
  { id: "sheets", name: "Google Sheets", desc: "Importar planilhas de métricas e listas.", status: "not_connected" },
  { id: "whatsapp", name: "WhatsApp Business API", desc: "Envio de mensagens comerciais (com aprovação).", status: "not_connected" },
  { id: "trends", name: "Google Trends", desc: "Tendências de busca por termo e região.", status: "not_connected" },
  { id: "seo", name: "Ferramenta de SEO", desc: "Palavras-chave, backlinks e posições.", status: "not_connected" },
];

/* ------------------------------ Small UI kit ----------------------------- */
function Panel({ children, style, className = "", ...rest }) {
  return (
    <div
      className={className}
      style={{
        background: T.panelSolid,
        border: `1px solid ${T.borderSoft}`,
        borderRadius: 14,
        boxShadow: "0 14px 28px -22px rgba(0,0,0,0.55)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const map = {
    neutral: { c: T.textDim, bg: "transparent", bd: "transparent" },
    good: { c: T.good, bg: T.goodSoft, bd: "transparent" },
    warn: { c: T.warn, bg: T.warnSoft, bd: "transparent" },
    bad: { c: T.bad, bg: T.badSoft, bd: "transparent" },
    accent: { c: T.accent2, bg: T.accentSoft, bd: "transparent" },
  };
  const s = map[tone] || map.neutral;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, padding: tone === "neutral" ? "3px 0" : "3px 8px", borderRadius: 6,
        color: s.c, background: s.bg, border: `1px solid ${s.bd}`,
        whiteSpace: "nowrap", letterSpacing: 0.1,
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, variant = "primary", size = "md", icon: Icon, style, ...rest }) {
  const sizes = { sm: { pad: "6px 10px", fs: 13 }, md: { pad: "9px 14px", fs: 14 }, lg: { pad: "12px 20px", fs: 15 } };
  const sz = sizes[size];
  const variants = {
    primary: { bg: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, c: "#fff", bd: "transparent" },
    ghost: { bg: "transparent", c: T.text, bd: T.border },
    subtle: { bg: T.panel2, c: T.text, bd: T.border },
    danger: { bg: "transparent", c: T.bad, bd: T.bad + "55" },
  };
  const v = variants[variant];
  return (
    <button
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: sz.pad, fontSize: sz.fs, fontWeight: 600, borderRadius: 8,
        background: v.bg, color: v.c, border: `1px solid ${v.bd}`, cursor: "pointer",
        boxShadow: variant === "primary" ? `0 10px 24px -10px ${T.accent}99` : "none",
        transition: "filter .12s ease, transform .12s ease", ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
      {...rest}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textDim, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 12, color: T.textFaint, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

const inputStyle = {
  width: "100%", background: T.bgElevated, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 14, outline: "none",
};

function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Textarea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 80, ...(props.style || {}) }} />;
}
function Select({ options, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      <option value="">Selecione…</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function EmptyState({ icon: Icon = Info, title, desc, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: T.textDim }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: T.panel2, border: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
      }}>
        <Icon size={20} color={T.textFaint} />
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: T.text, marginBottom: 6, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 13.5, maxWidth: 420, margin: "0 auto 16px", lineHeight: 1.6 }}>{desc}</div>
      {action}
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 30 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11.5, fontWeight: 600, color: T.textFaint, marginBottom: 8, letterSpacing: 0.4 }}>{eyebrow}</div>}
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 25, fontWeight: 600, color: T.text, margin: 0, letterSpacing: -0.3 }}>{title}</h1>
        {desc && <p style={{ color: T.textDim, fontSize: 14, marginTop: 8, maxWidth: 620, lineHeight: 1.55 }}>{desc}</p>}
      </div>
      {right}
    </div>
  );
}

function ConfidenceDot({ level }) {
  const c = level === "high" ? T.good : level === "low" ? T.bad : T.warn;
  return <span style={{ width: 7, height: 7, borderRadius: 99, background: c, display: "inline-block" }} />;
}

/* =========================================================================
   LANDING PAGE
   ========================================================================= */
function Landing({ onStart, onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);

  const features = [
    { icon: MessageSquare, title: "Diretor IA", text: "Converse com um agente que conhece sua empresa e raciocina como um diretor de growth." },
    { icon: Compass, title: "Diagnóstico estratégico", text: "Forças, fraquezas, gargalos e prioridades — com evidência, não achismo." },
    { icon: Radar, title: "Inteligência de mercado", text: "Estrutura para reunir estudos, tendências e concorrência num só lugar." },
    { icon: Megaphone, title: "Marketing", text: "Planos de conteúdo, campanhas e ofertas organizados por objetivo." },
    { icon: Handshake, title: "Vendas", text: "ICP, cadências, scripts e pipeline num fluxo comercial único." },
    { icon: LineChart, title: "Analytics", text: "CAC, LTV, conversão e receita — só o que você realmente mediu." },
    { icon: FlaskConical, title: "Experimentos", text: "Hipóteses testáveis com critério de sucesso definido antes de começar." },
    { icon: Layers, title: "Memória empresarial", text: "Cada decisão fica registrada e alimenta as próximas recomendações." },
  ];

  const problems = [
    "Decisões importantes tomadas no achismo",
    "Dados de marketing, vendas e produto espalhados",
    "Pouca clareza sobre o que a concorrência está fazendo",
    "Marketing sem mensuração de retorno",
    "Vendas sem previsibilidade de receita",
    "Excesso de ideias, falta de prioridade",
  ];

  return (
    <div className="gos-grid-bg" style={{ minHeight: "100vh", color: T.text, fontFamily: FONT_BODY }}>
      {FONT_LINK}
      {/* Nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, background: scrolled ? "#0A0D16EE" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none", borderBottom: scrolled ? `1px solid ${T.borderSoft}` : "1px solid transparent",
        transition: "all .2s ease",
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})` }} />
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17 }}>GrowthOS <span style={{ color: T.accent2 }}>AI</span></span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={onLogin} style={{ background: "none", border: "none", color: T.textDim, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Entrar</button>
            <Button onClick={onStart} size="sm">Começar gratuitamente</Button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 40px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 48, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 20, background: T.accentSoft, border: `1px solid ${T.accent}44`, fontSize: 12.5, fontWeight: 600, color: T.accent2, marginBottom: 20 }}>
            <Sparkles size={13} /> Inteligência estratégica para negócios reais
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 48, lineHeight: 1.1, fontWeight: 600, margin: "0 0 18px", letterSpacing: -0.6 }}>
            Seu próximo{" "}
            <span style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              diretor de marketing e vendas
            </span>{" "}
            está aqui.
          </h1>
          <p style={{ fontSize: 17, color: T.textDim, lineHeight: 1.65, maxWidth: 480, marginBottom: 30 }}>
            Transforme dados de mercado, contexto empresarial e IA em decisões estratégicas que ajudam sua empresa a crescer — com prioridade, evidência e um plano de execução.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button size="lg" onClick={onStart} icon={ArrowRight}>Começar gratuitamente</Button>
            <Button size="lg" variant="ghost" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>Conhecer a plataforma</Button>
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 34, color: T.textFaint, fontSize: 12.5 }}>
            <span>Sem cartão de crédito</span>
            <span>·</span>
            <span>Comece com dados vazios</span>
          </div>
        </div>

        <Panel style={{ padding: 18, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, color: T.textFaint, fontWeight: 600 }}>Painel · Empresa Demo</div>
            <Badge tone="accent">Diretor IA online</Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { l: "Receita", v: "R$ 84,2k", d: "+12%", tone: "good" },
              { l: "CAC", v: "R$ 312", d: "-6%", tone: "good" },
              { l: "Conversão", v: "3,8%", d: "-0,4pp", tone: "bad" },
            ].map((k) => (
              <div key={k.l} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, color: T.textFaint }}>{k.l}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, margin: "4px 0 2px" }}>{k.v}</div>
                <div style={{ fontSize: 11, color: k.tone === "good" ? T.good : T.bad }}>{k.d}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 6, fontWeight: 600 }}>PRIORIDADE 01 · Recomendada</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Validar o principal canal de aquisição</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Badge tone="accent">Impacto alto</Badge>
              <Badge>Esforço médio</Badge>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, padding: 10 }}>
            <MessageSquare size={15} color={T.accent2} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5 }}>
              "Antes de escalar mídia paga, sua conversão de topo de funil precisa subir. Recomendo testar a oferta primeiro."
            </div>
          </div>
        </Panel>
      </div>

      {/* Problem */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 48 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.accent2, marginBottom: 10 }}>O problema</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, margin: 0, lineHeight: 1.25 }}>
              Crescer sem clareza custa caro.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {problems.map((p) => (
              <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 0", borderTop: `1px solid ${T.borderSoft}` }}>
                <AlertTriangle size={15} color={T.warn} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 14.5, color: T.textDim }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 72px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.accent2, marginBottom: 10 }}>A plataforma</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, margin: "0 0 32px" }}>Tudo que um diretor de growth faria — num só lugar.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: T.border, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: T.panelSolid, padding: 22 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <f.icon size={17} color={T.accent2} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div id="como-funciona" style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 80px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.accent2, marginBottom: 10 }}>Como funciona</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, margin: "0 0 32px" }}>Da primeira conversa ao plano de execução.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {[
            "Cadastre sua empresa",
            "Conte sobre produto, público e objetivos",
            "Converse com seu Diretor IA",
            "Receba recomendações priorizadas",
            "Execute e acompanhe resultados",
          ].map((s, i) => (
            <div key={s}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: T.textFaint, marginBottom: 10 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.5, fontWeight: 500 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "72px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, margin: "0 0 24px" }}>Pare de tomar decisões importantes no escuro.</h2>
        <Button size="lg" onClick={onStart} icon={ArrowRight}>Começar agora</Button>
      </div>

      <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "24px", textAlign: "center", color: T.textFaint, fontSize: 12.5 }}>
        GrowthOS AI · Inteligência estratégica para decisões que geram crescimento.
      </div>
    </div>
  );
}

/* =========================================================================
   AUTH
   ========================================================================= */
function AuthScreen({ mode, setMode, onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !password || (mode === "register" && !name)) {
      setErr("Preencha os campos obrigatórios.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        // Demo simplification: se já existir uma conta neste navegador com o
        // mesmo e-mail, apenas atualizamos os dados em vez de bloquear o
        // cadastro — evita travar o usuário numa mensagem de erro confusa.
        const user = { id: uid(), name, email, createdAt: nowISO() };
        const okUser = await store.set("auth:user", user);
        const okPw = await store.set("auth:pw", password); // demo only — never do this in production
        const okSession = await store.set("auth:session", true);
        if (!okUser || !okPw || !okSession) {
          throw new Error("Não foi possível salvar os dados de acesso neste navegador (armazenamento local indisponível).");
        }
        if (company) {
          const c = emptyCompany();
          c.info.nome = company;
          await store.set("company", c);
        }
        onAuth(user);
      } else {
        const user = await store.get("auth:user");
        const pw = await store.get("auth:pw");
        if (!user || user.email !== email || pw !== password) {
          setErr("E-mail ou senha inválidos, ou ainda não há conta neste navegador. Se for seu primeiro acesso, use \"Cadastre-se\".");
          setBusy(false);
          return;
        }
        await store.set("auth:session", true);
        onAuth(user);
      }
    } catch (e2) {
      console.error("Erro no fluxo de autenticação:", e2);
      setErr(e2.message || "Algo deu errado ao processar sua conta. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const resetLocalData = async () => {
    await store.del("auth:user");
    await store.del("auth:pw");
    await store.del("auth:session");
    await store.del("company");
    setErr("");
    window.location.reload();
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BODY, padding: 20 }}>
      {FONT_LINK}
      <Panel style={{ width: 400, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})` }} />
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15 }}>GrowthOS AI</span>
        </div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600, margin: "0 0 4px" }}>
          {mode === "register" ? "Crie sua conta" : "Bem-vindo de volta"}
        </h2>
        <p style={{ color: T.textDim, fontSize: 13.5, margin: "0 0 22px" }}>
          {mode === "register" ? "Leva menos de um minuto." : "Entre para continuar sua estratégia."}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </Field>
          )}
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
          </Field>
          <Field label="Senha">
            <div style={{ position: "relative" }}>
              <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPw((s) => !s)} style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", cursor: "pointer", color: T.textFaint }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          {mode === "register" && (
            <Field label="Nome da empresa" hint="Opcional agora — você poderá detalhar tudo no onboarding.">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex.: Acme Ltda." />
            </Field>
          )}
          {err && (
            <div style={{ background: T.badSoft, border: `1px solid ${T.bad}44`, color: T.bad, borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>
              {err}
              <div style={{ marginTop: 6 }}>
                <button type="button" onClick={resetLocalData} style={{ background: "none", border: "none", padding: 0, color: T.bad, textDecoration: "underline", fontSize: 12.5, cursor: "pointer" }}>
                  Limpar dados salvos neste navegador e recomeçar
                </button>
              </div>
            </div>
          )}
          <Button type="submit" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} size="lg" disabled={busy}>
            {busy ? <Loader2 size={16} className="gos-pulse" /> : mode === "register" ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: T.textDim }}>
          {mode === "register" ? (
            <>Já tem conta? <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: T.accent2, fontWeight: 600, cursor: "pointer" }}>Entrar</button></>
          ) : (
            <>Ainda não tem conta? <button onClick={() => setMode("register")} style={{ background: "none", border: "none", color: T.accent2, fontWeight: 600, cursor: "pointer" }}>Cadastre-se</button></>
          )}
        </div>
        <div style={{ marginTop: 18, fontSize: 11.5, color: T.textFaint, lineHeight: 1.5, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 14 }}>
          Autenticação de demonstração: os dados ficam salvos apenas neste navegador, não em um servidor de produção.
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   ONBOARDING
   ========================================================================= */
function Onboarding({ company, setCompany, onFinish }) {
  const [step, setStep] = useState(0);
  const steps = ["Empresa", "Produtos", "Público & mercado", "Marketing & vendas", "Objetivos"];
  const c = company;

  const update = (section, field, value) => {
    setCompany((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const addProduto = () => {
    setCompany((prev) => ({
      ...prev,
      produtos: [...prev.produtos, { id: uid(), nome: "", descricao: "", problema: "", diferenciais: "", preco: "", cobranca: "", ticket: "" }],
    }));
  };
  const updateProduto = (id, field, value) => {
    setCompany((prev) => ({
      ...prev,
      produtos: prev.produtos.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };
  const removeProduto = (id) => {
    setCompany((prev) => ({ ...prev, produtos: prev.produtos.filter((p) => p.id !== id) }));
  };

  const toggleObjetivo = (o) => {
    setCompany((prev) => {
      const has = prev.objetivos.principais.includes(o);
      return {
        ...prev,
        objetivos: {
          ...prev.objetivos,
          principais: has ? prev.objetivos.principais.filter((x) => x !== o) : [...prev.objetivos.principais, o],
        },
      };
    });
  };

  const canNext = () => {
    if (step === 0) return c.info.nome.trim().length > 0;
    return true;
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: FONT_BODY }}>
      {FONT_LINK}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 30 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})` }} />
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14 }}>GrowthOS AI</span>
        </div>

        {/* progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? T.accent : T.borderSoft }} />
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: T.textFaint, marginBottom: 30 }}>Etapa {step + 1} de {steps.length} · {steps[step]}</div>

        <Panel style={{ padding: 28 }}>
          {step === 0 && (
            <div className="gos-fade">
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "0 0 4px" }}>Sobre a empresa</h2>
              <p style={{ color: T.textDim, fontSize: 13.5, margin: "0 0 22px" }}>Isso monta o contexto que o Diretor IA vai usar em todas as análises.</p>
              <Field label="Nome da empresa *"><Input value={c.info.nome} onChange={(e) => update("info", "nome", e.target.value)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Segmento"><Input value={c.info.segmento} onChange={(e) => update("info", "segmento", e.target.value)} placeholder="Ex.: SaaS de RH" /></Field>
                <Field label="Modelo de negócio"><Select options={MODELOS_NEGOCIO} value={c.info.modeloNegocio} onChange={(e) => update("info", "modeloNegocio", e.target.value)} /></Field>
                <Field label="País"><Input value={c.info.pais} onChange={(e) => update("info", "pais", e.target.value)} /></Field>
                <Field label="Estado/região"><Input value={c.info.regiao} onChange={(e) => update("info", "regiao", e.target.value)} /></Field>
                <Field label="Cidade (opcional)"><Input value={c.info.cidade} onChange={(e) => update("info", "cidade", e.target.value)} /></Field>
                <Field label="Site (opcional)"><Input value={c.info.site} onChange={(e) => update("info", "site", e.target.value)} placeholder="https://" /></Field>
              </div>
              <Field label="Descrição do negócio"><Textarea value={c.info.descricao} onChange={(e) => update("info", "descricao", e.target.value)} placeholder="O que a empresa faz, para quem e como gera receita." /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="gos-fade">
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "0 0 4px" }}>Produtos e serviços</h2>
              <p style={{ color: T.textDim, fontSize: 13.5, margin: "0 0 20px" }}>Adicione ao menos um produto ou serviço que a empresa vende.</p>
              {c.produtos.map((p, i) => (
                <div key={p.id} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12, position: "relative" }}>
                  <button onClick={() => removeProduto(p.id)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><Trash2 size={15} /></button>
                  <div style={{ fontSize: 12, color: T.textFaint, marginBottom: 10, fontWeight: 600 }}>PRODUTO {i + 1}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Nome"><Input value={p.nome} onChange={(e) => updateProduto(p.id, "nome", e.target.value)} /></Field>
                    <Field label="Preço / faixa"><Input value={p.preco} onChange={(e) => updateProduto(p.id, "preco", e.target.value)} placeholder="Ex.: R$ 199/mês" /></Field>
                  </div>
                  <Field label="Descrição"><Textarea value={p.descricao} onChange={(e) => updateProduto(p.id, "descricao", e.target.value)} /></Field>
                  <Field label="Principal problema que resolve"><Input value={p.problema} onChange={(e) => updateProduto(p.id, "problema", e.target.value)} /></Field>
                  <Field label="Diferenciais"><Input value={p.diferenciais} onChange={(e) => updateProduto(p.id, "diferenciais", e.target.value)} /></Field>
                </div>
              ))}
              <Button variant="subtle" icon={Plus} onClick={addProduto}>Adicionar produto</Button>
            </div>
          )}

          {step === 2 && (
            <div className="gos-fade">
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "0 0 4px" }}>Público e mercado</h2>
              <p style={{ color: T.textDim, fontSize: 13.5, margin: "0 0 20px" }}>Quem a empresa atende e quem mais disputa esse cliente.</p>
              <Field label="Público-alvo"><Textarea value={c.audiencia.publicoAlvo} onChange={(e) => update("audiencia", "publicoAlvo", e.target.value)} /></Field>
              <Field label="Cliente ideal (ICP)"><Textarea value={c.audiencia.clienteIdeal} onChange={(e) => update("audiencia", "clienteIdeal", e.target.value)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Segmentos atendidos"><Input value={c.audiencia.segmentos} onChange={(e) => update("audiencia", "segmentos", e.target.value)} /></Field>
                <Field label="Região de atuação"><Input value={c.audiencia.regiaoAtuacao} onChange={(e) => update("audiencia", "regiaoAtuacao", e.target.value)} /></Field>
              </div>
              <Field label="Principais decisores de compra"><Input value={c.audiencia.decisores} onChange={(e) => update("audiencia", "decisores", e.target.value)} /></Field>
              <Field label="Principais dores"><Textarea value={c.audiencia.dores} onChange={(e) => update("audiencia", "dores", e.target.value)} /></Field>
              <Field label="Concorrentes conhecidos"><Input value={c.audiencia.concorrentesConhecidos} onChange={(e) => update("audiencia", "concorrentesConhecidos", e.target.value)} /></Field>
              <Field label="Alternativas ao produto (inclusive não fazer nada)"><Input value={c.audiencia.alternativas} onChange={(e) => update("audiencia", "alternativas", e.target.value)} /></Field>
            </div>
          )}

          {step === 3 && (
            <div className="gos-fade">
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "0 0 4px" }}>Marketing e vendas</h2>
              <p style={{ color: T.textDim, fontSize: 13.5, margin: "0 0 20px" }}>Como a empresa gera demanda e converte hoje.</p>
              <Field label="Canais atuais"><Input value={c.marketingVendas.canaisAtuais} onChange={(e) => update("marketingVendas", "canaisAtuais", e.target.value)} placeholder="Ex.: Instagram, indicação, outbound" /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Investimento mensal em marketing"><Input value={c.marketingVendas.investimentoMensal} onChange={(e) => update("marketingVendas", "investimentoMensal", e.target.value)} /></Field>
                <Field label="Equipe comercial"><Input value={c.marketingVendas.equipeComercial} onChange={(e) => update("marketingVendas", "equipeComercial", e.target.value)} placeholder="Ex.: 2 SDRs, 1 closer" /></Field>
                <Field label="Ciclo médio de vendas"><Input value={c.marketingVendas.cicloMedioVendas} onChange={(e) => update("marketingVendas", "cicloMedioVendas", e.target.value)} placeholder="Ex.: 21 dias" /></Field>
                <Field label="Taxa de conversão (se souber)"><Input value={c.marketingVendas.taxaConversao} onChange={(e) => update("marketingVendas", "taxaConversao", e.target.value)} placeholder="Ex.: 4%" /></Field>
                <Field label="Ticket médio"><Input value={c.marketingVendas.ticketMedio} onChange={(e) => update("marketingVendas", "ticketMedio", e.target.value)} /></Field>
                <Field label="Principal fonte de clientes"><Input value={c.marketingVendas.fontesClientes} onChange={(e) => update("marketingVendas", "fontesClientes", e.target.value)} /></Field>
              </div>
              <Field label="Processo de vendas (resumo)"><Textarea value={c.marketingVendas.processoVendas} onChange={(e) => update("marketingVendas", "processoVendas", e.target.value)} /></Field>
              <Field label="Principais dificuldades comerciais"><Textarea value={c.marketingVendas.dificuldades} onChange={(e) => update("marketingVendas", "dificuldades", e.target.value)} /></Field>
            </div>
          )}

          {step === 4 && (
            <div className="gos-fade">
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, margin: "0 0 4px" }}>Objetivos</h2>
              <p style={{ color: T.textDim, fontSize: 13.5, margin: "0 0 20px" }}>O que priorizar nos próximos meses.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {OBJETIVOS_OPCOES.map((o) => {
                  const active = c.objetivos.principais.includes(o);
                  return (
                    <button key={o} onClick={() => toggleObjetivo(o)} style={{
                      padding: "7px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                      background: active ? T.accentSoft : T.panel2, color: active ? T.accent2 : T.textDim,
                      border: `1px solid ${active ? T.accent + "66" : T.border}`, fontWeight: 500,
                    }}>{active && <Check size={12} style={{ marginRight: 4, verticalAlign: -1 }} />}{o}</button>
                  );
                })}
              </div>
              <Field label="Objetivo principal (em uma frase)"><Input value={c.objetivos.objetivoPrincipal} onChange={(e) => update("objetivos", "objetivoPrincipal", e.target.value)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Meta"><Input value={c.objetivos.meta} onChange={(e) => update("objetivos", "meta", e.target.value)} placeholder="Ex.: R$ 150k MRR" /></Field>
                <Field label="Prazo"><Input value={c.objetivos.prazo} onChange={(e) => update("objetivos", "prazo", e.target.value)} placeholder="Ex.: 6 meses" /></Field>
                <Field label="Orçamento disponível"><Input value={c.objetivos.orcamento} onChange={(e) => update("objetivos", "orcamento", e.target.value)} /></Field>
                <Field label="Principais restrições"><Input value={c.objetivos.restricoes} onChange={(e) => update("objetivos", "restricoes", e.target.value)} placeholder="Ex.: sem equipe de conteúdo" /></Field>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, paddingTop: 20, borderTop: `1px solid ${T.borderSoft}` }}>
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} style={{ visibility: step === 0 ? "hidden" : "visible" }} icon={ChevronLeft}>Voltar</Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => canNext() && setStep((s) => s + 1)} icon={ChevronRight}>Continuar</Button>
            ) : (
              <Button onClick={onFinish} icon={Sparkles}>Gerar diagnóstico inicial</Button>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================================
   COMPLETENESS CALC
   ========================================================================= */
function completeness(c) {
  const fields = [
    c.info.nome, c.info.segmento, c.info.pais, c.info.descricao, c.info.modeloNegocio,
    c.audiencia.publicoAlvo, c.audiencia.clienteIdeal, c.audiencia.dores, c.audiencia.concorrentesConhecidos,
    c.marketingVendas.canaisAtuais, c.marketingVendas.processoVendas, c.marketingVendas.ticketMedio,
    c.objetivos.objetivoPrincipal, c.objetivos.meta, c.objetivos.prazo,
  ];
  const filled = fields.filter((f) => f && String(f).trim().length > 0).length;
  const produtosScore = c.produtos.length > 0 ? 1 : 0;
  const total = fields.length + 1;
  return Math.round(((filled + produtosScore) / total) * 100);
}

/* =========================================================================
   AI SERVICE — real call to Anthropic API with business system prompt
   ========================================================================= */

/* Repertório de frameworks consolidados de mercado. Isso não é "opinião" da
   IA — é o conhecimento profissional comum a qualquer CMO/CRO sênior, que a
   IA deve aplicar nomeando o framework usado, em vez de dar conselho
   genérico solto. */
const STRATEGY_PLAYBOOK = `
REPERTÓRIO DE FRAMEWORKS A APLICAR (cite o framework pelo nome quando usar um):

1. DIAGNÓSTICO E COMPETITIVIDADE
   - SWOT para situar forças/fraquezas internas e oportunidades/ameaças externas.
   - 5 Forças de Porter para avaliar intensidade competitiva e poder de barganha.
   - Compare capacidade operacional real da empresa com o que o mercado exige antes de recomendar expansão.

2. POSICIONAMENTO E MARCA
   - Mapa de posicionamento (2 eixos relevantes para o ICP) para achar diferenciação real.
   - Proposta de valor no formato Job-to-be-Done: "quando [situação], o cliente quer [motivação], para [resultado]".
   - Só recomende reposicionamento quando houver gap claro entre percepção atual e desejada — nunca como resposta padrão para toda queda de receita.

3. SEGMENTAÇÃO, ICP E PERSONAS
   - STP (Segmentação, Targeting, Positioning).
   - ICP com critérios firmográficos + comportamentais + sinais de intenção de compra, nunca apenas um adjetivo vago.

4. GO-TO-MARKET E CANAIS
   - Escolha de canal por fit com ciclo de vendas, ticket médio e complexidade da oferta (motion self-service vs. sales-led vs. product-led).
   - Priorize canal por CAC estimado, tempo até resultado e dependência de terceiros.

5. FUNIL, MÉTRICAS E UNIT ECONOMICS
   - AARRR (Aquisição, Ativação, Retenção, Receita, Indicação) para localizar o gargalo real antes de recomendar mais investimento.
   - Relação LTV:CAC (referência saudável próxima de 3:1) e payback de CAC como critério de decisão.
   - Pense em termos de coorte, não de médias soltas, antes de recomendar "escalar".

6. PRIORIZAÇÃO DE INICIATIVAS
   - ICE (Impacto, Confiança, Facilidade) ou RICE (+ Alcance) para ordenar iniciativas de forma defensável.
   - Nunca recomende "fazer tudo" — force uma ordem de prioridade com trade-off explícito.

7. VENDAS CONSULTIVAS E COMPLEXAS
   - SPIN Selling (Situação, Problema, Implicação, Necessidade de solução) para estruturar discovery.
   - MEDDIC/MEDDPICC (Métricas, Comprador Econômico, Critérios de Decisão, Processo de Decisão, Dor, Campeão) para qualificar oportunidades B2B.
   - Challenger Sale quando o ciclo de vendas exige ensinar algo novo ao cliente sobre o próprio problema.

8. PRICING E OFERTA
   - Precificação por valor percebido (não apenas custo+margem) quando a diferenciação sustenta isso.
   - Sugira testar elasticidade/ancoragem antes de recomendar mudança de preço.

9. EXPERIMENTAÇÃO (GROWTH)
   - Toda hipótese precisa de variável testada, métrica primária, critério de sucesso E critério de interrupção definidos ANTES de rodar.
   - Prefira o menor experimento que já responde à pergunta, antes de comprometer orçamento maior.

10. METAS
    - Traduza objetivos vagos ("crescer mais") em Objetivo + Key Results mensuráveis e datados (OKRs).

Nomeie o framework que sustenta cada recomendação relevante (ex.: "pelo LTV:CAC atual...", "aplicando ICE, essa iniciativa fica em segundo lugar porque..."). Isso é o que diferencia uma resposta de diretor sênior de um conselho genérico.
`.trim();

/* Monta o bloco extra de contexto (memória empresarial) a partir do que já
   está registrado na plataforma — decisões, métricas, tarefas e documentos.
   Sem isso, a IA só enxergava o cadastro inicial da empresa. */
function buildContextExtras(context) {
  const { decisions = [], metrics = {}, documents = [], tasks = [] } = context || {};
  const parts = [];

  const hasMetrics = metrics && Object.values(metrics).some((v) => v && String(v).trim().length > 0);
  if (hasMetrics) {
    parts.push(`MÉTRICAS REGISTRADAS PELO USUÁRIO (dados reais informados manualmente — use exatamente estes, não invente outros):\n${JSON.stringify(metrics, null, 2)}`);
  }

  if (decisions && decisions.length > 0) {
    const recent = decisions.slice(0, 8).map((d) => `- ${d.title} (impacto: ${d.impact}, confiança: ${d.confidence}, status: ${d.status})`).join("\n");
    parts.push(`DECISÕES ESTRATÉGICAS JÁ TOMADAS (histórico real — dê continuidade e não contradiga sem justificar por quê):\n${recent}`);
  }

  const openTasks = (tasks || []).filter((t) => t.status !== "concluida").slice(0, 10);
  if (openTasks.length > 0) {
    const list = openTasks.map((t) => `- ${t.title} (prioridade: ${t.priority}, status: ${t.status})`).join("\n");
    parts.push(`TAREFAS EM ABERTO:\n${list}`);
  }

  if (documents && documents.length > 0) {
    const docs = documents.slice(0, 6).map((d) => {
      const trecho = (d.conteudo || "").slice(0, 240);
      return `- [${d.categoria}] ${d.titulo}: ${trecho}${(d.conteudo || "").length > 240 ? "…" : ""}`;
    }).join("\n");
    parts.push(`DOCUMENTOS E NOTAS CADASTRADOS PELA EMPRESA:\n${docs}`);
  }

  return parts.length ? "\n\n" + parts.join("\n\n") : "";
}

const SYSTEM_PROMPT = (company, context) => `Você é o Diretor de Marketing, Vendas, Growth e Estratégia Empresarial da plataforma GrowthOS AI — um profissional sênior com décadas equivalentes de repertório em diagnóstico de competitividade, reposicionamento de marca, go-to-market, sales enablement e estruturação de funis de geração de demanda.

Sua missão é ajudar empresas a tomar decisões melhores para aumentar receita, lucro, margem, aquisição, conversão, retenção e crescimento sustentável.

Você atua como uma combinação de CMO, CRO, CGO, Diretor Comercial, estrategista de negócios, pesquisador de mercado, analista de dados, especialista em comportamento do consumidor, especialista em performance, especialista em vendas, especialista em ofertas e consultor de crescimento.

Você NÃO deve agir como um chatbot genérico. Antes de recomendar algo importante, considere objetivo, contexto empresarial, produto, público, ICP, mercado, concorrentes, oferta, preço, margem, CAC, LTV, funil, capacidade operacional, orçamento, riscos e dados disponíveis.

${STRATEGY_PLAYBOOK}

Sempre que possível, siga este processo: entender o objetivo, diagnosticar o cenário, identificar o gargalo, consultar dados relevantes, gerar alternativas, comparar alternativas, recomendar uma prioridade, propor plano de execução, definir métricas e critérios de sucesso/interrupção.

Diferencie sempre: dado confirmado, evidência externa, benchmark, inferência, hipótese, estimativa e opinião estratégica. NUNCA invente estudos, estatísticas, preços, resultados ou fontes — se não tiver dados suficientes, diga isso claramente e ofereça uma hipótese provisória rotulada como tal.

Não trate métricas de vaidade como sucesso. Priorize impacto financeiro, eficiência, qualidade dos clientes, margem e sustentabilidade. Seja crítico: se uma ideia for ruim, explique por quê e ofereça alternativa — nunca concorde automaticamente só para agradar.

Use Markdown com títulos curtos, listas e negrito com moderação. Seja direto, denso em conteúdo útil e específico ao contexto da empresa abaixo — nunca genérico, nunca enrolado.

CONTEXTO DA EMPRESA (dados fornecidos pelo usuário; não invente o que estiver faltando):
${JSON.stringify(company, null, 2)}${buildContextExtras(context)}`;

/* Versão web: o navegador NUNCA chama api.anthropic.com diretamente (isso
   exporia a chave de API a qualquer visitante do site). Em vez disso, ele
   chama o backend deste mesmo projeto (pasta /server), que guarda a chave
   em variável de ambiente e repassa a chamada para a Anthropic. */
const API_BASE = import.meta.env.VITE_API_BASE || "";

async function callBackendChat(system, messages) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages: messages.map((m) => ({ role: m.role, content: m.content })) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Falha na chamada da IA (${res.status})`);
  return data.text || "Não consegui gerar uma resposta agora. Tente novamente.";
}

async function callDirectorAI(company, messages, context) {
  return callBackendChat(SYSTEM_PROMPT(company, context), messages);
}

async function callStructuredDiagnosis(company, context) {
  const prompt = `Com base no contexto de empresa fornecido (incluindo decisões, métricas e documentos já registrados, se houver), gere um diagnóstico estratégico aplicando o repertório de frameworks descrito nas suas instruções (cite o framework usado em cada recomendação, quando fizer sentido).
Responda APENAS com um JSON válido (sem markdown, sem crases, sem texto antes ou depois), no formato:
{
  "summary": "resumo executivo em 2-3 frases",
  "forcas": ["..."],
  "fraquezas": ["..."],
  "oportunidades": ["..."],
  "ameacas": ["..."],
  "gargalos": ["..."],
  "recomendacoes": [
    {"titulo": "...", "descricao": "...", "justificativa": "...", "impacto": "alto|medio|baixo", "esforco": "alto|medio|baixo", "confianca": "alta|media|baixa"}
  ]
}
Se faltarem dados no contexto para alguma seção, diga isso dentro do próprio texto da seção (ex.: "Dados insuficientes para avaliar X") em vez de inventar. Baseie-se apenas no contexto fornecido, sem inventar estatísticas externas.`;
  const text = await callBackendChat(
    SYSTEM_PROMPT(company, context) + "\n\nResponda somente com JSON puro, sem texto adicional.",
    [{ role: "user", content: prompt }]
  );
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error("Não foi possível interpretar a resposta da IA.");
  }
}

/* =========================================================================
   SIDEBAR / APP SHELL
   ========================================================================= */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "negocio", label: "Meu Negócio", icon: Building2 },
  { id: "diretor", label: "Diretor IA", icon: MessageSquare },
  { id: "estrategia", label: "Estratégia", icon: Compass },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "vendas", label: "Vendas", icon: Handshake },
  { id: "mercado", label: "Inteligência de Mercado", icon: Radar },
  { id: "concorrentes", label: "Concorrentes", icon: Users2 },
  { id: "campanhas", label: "Campanhas", icon: Rocket },
  { id: "experimentos", label: "Experimentos", icon: FlaskConical },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "decisoes", label: "Decisões", icon: ScrollText },
  { id: "tarefas", label: "Tarefas", icon: ListChecks },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "config", label: "Configurações", icon: Settings },
];

function Sidebar({ current, setCurrent, collapsed, setCollapsed, user, onLogout, companyName }) {
  return (
    <div style={{
      width: collapsed ? 64 : 236, flexShrink: 0, background: T.bgElevated, borderRight: `1px solid ${T.borderSoft}`,
      display: "flex", flexDirection: "column", transition: "width .16s ease", height: "100vh", position: "sticky", top: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "18px 16px", borderBottom: `1px solid ${T.borderSoft}`, minHeight: 58 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, flexShrink: 0 }} />
        {!collapsed && <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>GrowthOS AI</span>}
        <button onClick={() => setCollapsed((c) => !c)} style={{ marginLeft: "auto", background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}>
          <Menu size={16} />
        </button>
      </div>
      <div className="gos-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {NAV.map((n) => {
          const active = current === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setCurrent(n.id)}
              title={collapsed ? n.label : undefined}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 2,
                borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
                background: active ? T.accentSoft : "transparent", color: active ? T.text : T.textDim,
                fontSize: 13.3, fontWeight: active ? 600 : 500, borderLeft: active ? `2px solid ${T.accent}` : "2px solid transparent",
              }}
            >
              <n.icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${T.borderSoft}` }}>
        {!collapsed && (
          <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 8, padding: "0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {companyName || "Empresa sem nome"}
          </div>
        )}
        <button onClick={onLogout} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 7,
          border: "none", cursor: "pointer", background: "transparent", color: T.textFaint, fontSize: 13,
        }}>
          <LogOut size={15} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </div>
  );
}

function Topbar({ user, companyName, onAskDirector }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderBottom: `1px solid ${T.borderSoft}` }}>
      <div>
        <div style={{ fontSize: 13, color: T.textFaint }}>{greet}, {user?.name?.split(" ")[0] || "estrategista"}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600 }}>{companyName || "Sua empresa"}</div>
      </div>
      <Button size="sm" icon={MessageSquare} onClick={onAskDirector}>Perguntar ao Diretor IA</Button>
    </div>
  );
}

/* =========================================================================
   DASHBOARD
   ========================================================================= */
function MetricCard({ label, value, hasData, icon: Icon, delta }) {
  return (
    <Panel style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12.5, color: T.textFaint, fontWeight: 600 }}>{label}</div>
        <Icon size={15} color={T.textFaint} />
      </div>
      {hasData ? (
        <>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, margin: "8px 0 2px" }}>{value}</div>
          {delta && <div style={{ fontSize: 12, color: delta.startsWith("-") ? T.bad : T.good }}>{delta}</div>}
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: T.textFaint, marginTop: 12, lineHeight: 1.5 }}>Configure seus dados para visualizar este indicador.</div>
      )}
    </Panel>
  );
}

function Dashboard({ company, metrics, tasks, decisions, setView, diagnosis }) {
  const comp = completeness(company);
  const recs = (diagnosis?.recomendacoes || []).slice(0, 3);
  const pendingTasks = tasks.filter((t) => t.status !== "concluida").slice(0, 5);

  return (
    <div className="gos-fade">
      <SectionHeader
        eyebrow="VISÃO GERAL"
        title="Dashboard"
        desc="Panorama executivo do seu negócio, prioridades e o que o Diretor IA está observando."
      />

      {comp < 100 && (
        <Panel style={{ padding: 14, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: T.accent + "44" }}>
          <div style={{ fontSize: 13.5 }}>
            <strong style={{ color: T.accent2 }}>Contexto empresarial {comp}% completo.</strong>{" "}
            <span style={{ color: T.textDim }}>Quanto mais completo, mais precisas as recomendações do Diretor IA.</span>
          </div>
          <Button size="sm" variant="subtle" onClick={() => setView("negocio")}>Completar perfil</Button>
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <MetricCard label="Receita" hasData={!!metrics.receita} value={metrics.receita} icon={DollarSign} delta={metrics.receitaDelta} />
        <MetricCard label="Meta de receita" hasData={!!company.objetivos.meta} value={company.objetivos.meta} icon={Target} />
        <MetricCard label="Conversão" hasData={!!metrics.conversao} value={metrics.conversao} icon={Percent} delta={metrics.conversaoDelta} />
        <MetricCard label="CAC" hasData={!!metrics.cac} value={metrics.cac} icon={Gauge} delta={metrics.cacDelta} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, margin: 0 }}>Prioridades estratégicas</h3>
            {!diagnosis && <Badge tone="warn">Sem diagnóstico ainda</Badge>}
          </div>
          {recs.length === 0 ? (
            <Panel style={{ padding: 0 }}>
              <EmptyState
                icon={Compass}
                title="Nenhuma prioridade gerada ainda"
                desc="Rode um diagnóstico estratégico com o Diretor IA para receber prioridades com impacto, esforço e confiança estimados."
                action={<Button size="sm" onClick={() => setView("estrategia")} icon={Sparkles}>Gerar diagnóstico</Button>}
              />
            </Panel>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recs.map((r, i) => (
                <Panel key={i} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 11.5, color: T.textFaint, fontWeight: 700, letterSpacing: 0.4 }}>PRIORIDADE {String(i + 1).padStart(2, "0")}</div>
                    <Badge tone="accent">Recomendada</Badge>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, margin: "6px 0 8px" }}>{r.titulo}</div>
                  <div style={{ fontSize: 13, color: T.textDim, marginBottom: 10, lineHeight: 1.55 }}>{r.descricao}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Badge tone={r.impacto === "alto" ? "good" : r.impacto === "baixo" ? "bad" : "warn"}>Impacto {r.impacto}</Badge>
                    <Badge>Esforço {r.esforco}</Badge>
                    <Badge>Confiança {r.confianca}</Badge>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, margin: "0 0 12px" }}>Próximas ações</h3>
          <Panel style={{ padding: pendingTasks.length ? 8 : 0 }}>
            {pendingTasks.length === 0 ? (
              <EmptyState icon={ListChecks} title="Nenhuma tarefa pendente" desc="Crie tarefas a partir de recomendações estratégicas ou manualmente." action={<Button size="sm" variant="subtle" onClick={() => setView("tarefas")}>Ir para Tarefas</Button>} />
            ) : (
              pendingTasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderBottom: `1px solid ${T.borderSoft}` }}>
                  <Circle size={13} color={T.textFaint} />
                  <div style={{ flex: 1, fontSize: 13 }}>{t.title}</div>
                  <Badge tone={t.priority === "alta" ? "bad" : t.priority === "media" ? "warn" : "neutral"}>{t.priority}</Badge>
                </div>
              ))
            )}
          </Panel>

          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, margin: "22px 0 12px" }}>Decisões recentes</h3>
          <Panel style={{ padding: decisions.length ? 8 : 0 }}>
            {decisions.length === 0 ? (
              <EmptyState icon={ScrollText} title="Nenhuma decisão registrada" desc="Decisões salvas a partir do Diretor IA aparecem aqui." />
            ) : (
              decisions.slice(0, 4).map((d) => (
                <div key={d.id} style={{ padding: "9px 8px", borderBottom: `1px solid ${T.borderSoft}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
                  <div style={{ fontSize: 11.5, color: T.textFaint }}>{fmtDate(d.date)}</div>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   MEU NEGÓCIO
   ========================================================================= */
function MeuNegocio({ company, setCompany, saveCompany }) {
  const [tab, setTab] = useState("visao");
  const tabs = [
    { id: "visao", label: "Visão geral" },
    { id: "empresa", label: "Empresa" },
    { id: "produtos", label: "Produtos" },
    { id: "publico", label: "Público e ICP" },
    { id: "marketing", label: "Marketing e vendas" },
    { id: "objetivos", label: "Objetivos" },
  ];
  const comp = completeness(company);
  const update = (section, field, value) => setCompany((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const addProduto = () => setCompany((prev) => ({ ...prev, produtos: [...prev.produtos, { id: uid(), nome: "", descricao: "", problema: "", diferenciais: "", preco: "" }] }));
  const updateProduto = (id, field, value) => setCompany((prev) => ({ ...prev, produtos: prev.produtos.map((p) => (p.id === id ? { ...p, [field]: value } : p)) }));
  const removeProduto = (id) => setCompany((prev) => ({ ...prev, produtos: prev.produtos.filter((p) => p.id !== id) }));

  return (
    <div className="gos-fade">
      <SectionHeader
        eyebrow="CONTEXTO EMPRESARIAL"
        title="Meu Negócio"
        desc="Tudo que o Diretor IA sabe sobre sua empresa. Mantenha atualizado para recomendações mais precisas."
        right={
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12.5, color: T.textFaint, marginBottom: 4 }}>Contexto empresarial</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 100, height: 6, borderRadius: 4, background: T.borderSoft, overflow: "hidden" }}>
                <div style={{ width: `${comp}%`, height: "100%", background: comp > 70 ? T.good : comp > 35 ? T.warn : T.bad }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{comp}%</span>
            </div>
          </div>
        }
      />
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 22, overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 14px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? T.accent : "transparent"}`,
            color: tab === t.id ? T.text : T.textDim, fontSize: 13.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "visao" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, color: T.textFaint, marginBottom: 8, fontWeight: 600 }}>EMPRESA</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{company.info.nome || "Sem nome definido"}</div>
            <div style={{ fontSize: 13, color: T.textDim }}>{company.info.segmento || "Segmento não definido"} · {company.info.modeloNegocio || "modelo não definido"}</div>
            <div style={{ fontSize: 13, color: T.textDim, marginTop: 10, lineHeight: 1.6 }}>{company.info.descricao || "Nenhuma descrição cadastrada."}</div>
          </Panel>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, color: T.textFaint, marginBottom: 8, fontWeight: 600 }}>OBJETIVO PRINCIPAL</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{company.objetivos.objetivoPrincipal || "Não definido"}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: T.textDim }}>
              <span>Meta: {company.objetivos.meta || "—"}</span>
              <span>Prazo: {company.objetivos.prazo || "—"}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {company.objetivos.principais.map((o) => <Badge key={o} tone="accent">{o}</Badge>)}
            </div>
          </Panel>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, color: T.textFaint, marginBottom: 8, fontWeight: 600 }}>PRODUTOS ({company.produtos.length})</div>
            {company.produtos.length === 0 ? <div style={{ fontSize: 13, color: T.textFaint }}>Nenhum produto cadastrado.</div> : (
              company.produtos.map((p) => <div key={p.id} style={{ fontSize: 13.5, padding: "6px 0", borderBottom: `1px solid ${T.borderSoft}` }}>{p.nome || "(sem nome)"} — {p.preco || "preço não definido"}</div>)
            )}
          </Panel>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, color: T.textFaint, marginBottom: 8, fontWeight: 600 }}>PÚBLICO-ALVO</div>
            <div style={{ fontSize: 13.5, color: T.textDim, lineHeight: 1.6 }}>{company.audiencia.publicoAlvo || "Não definido."}</div>
          </Panel>
        </div>
      )}

      {tab === "empresa" && (
        <Panel style={{ padding: 20, maxWidth: 640 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Nome"><Input value={company.info.nome} onChange={(e) => update("info", "nome", e.target.value)} /></Field>
            <Field label="Segmento"><Input value={company.info.segmento} onChange={(e) => update("info", "segmento", e.target.value)} /></Field>
            <Field label="Modelo de negócio"><Select options={MODELOS_NEGOCIO} value={company.info.modeloNegocio} onChange={(e) => update("info", "modeloNegocio", e.target.value)} /></Field>
            <Field label="Site"><Input value={company.info.site} onChange={(e) => update("info", "site", e.target.value)} /></Field>
            <Field label="País"><Input value={company.info.pais} onChange={(e) => update("info", "pais", e.target.value)} /></Field>
            <Field label="Região/cidade"><Input value={company.info.regiao} onChange={(e) => update("info", "regiao", e.target.value)} /></Field>
          </div>
          <Field label="Descrição"><Textarea value={company.info.descricao} onChange={(e) => update("info", "descricao", e.target.value)} /></Field>
          <Button onClick={saveCompany} icon={Check}>Salvar alterações</Button>
        </Panel>
      )}

      {tab === "produtos" && (
        <div>
          {company.produtos.map((p, i) => (
            <Panel key={p.id} style={{ padding: 16, marginBottom: 12, maxWidth: 640, position: "relative" }}>
              <button onClick={() => removeProduto(p.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><Trash2 size={15} /></button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Nome"><Input value={p.nome} onChange={(e) => updateProduto(p.id, "nome", e.target.value)} /></Field>
                <Field label="Preço"><Input value={p.preco} onChange={(e) => updateProduto(p.id, "preco", e.target.value)} /></Field>
              </div>
              <Field label="Descrição"><Textarea value={p.descricao} onChange={(e) => updateProduto(p.id, "descricao", e.target.value)} /></Field>
              <Field label="Diferenciais"><Input value={p.diferenciais} onChange={(e) => updateProduto(p.id, "diferenciais", e.target.value)} /></Field>
            </Panel>
          ))}
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="subtle" icon={Plus} onClick={addProduto}>Adicionar produto</Button>
            <Button onClick={saveCompany} icon={Check}>Salvar</Button>
          </div>
        </div>
      )}

      {tab === "publico" && (
        <Panel style={{ padding: 20, maxWidth: 640 }}>
          <Field label="Público-alvo"><Textarea value={company.audiencia.publicoAlvo} onChange={(e) => update("audiencia", "publicoAlvo", e.target.value)} /></Field>
          <Field label="Cliente ideal (ICP)"><Textarea value={company.audiencia.clienteIdeal} onChange={(e) => update("audiencia", "clienteIdeal", e.target.value)} /></Field>
          <Field label="Principais dores"><Textarea value={company.audiencia.dores} onChange={(e) => update("audiencia", "dores", e.target.value)} /></Field>
          <Field label="Concorrentes conhecidos"><Input value={company.audiencia.concorrentesConhecidos} onChange={(e) => update("audiencia", "concorrentesConhecidos", e.target.value)} /></Field>
          <Button onClick={saveCompany} icon={Check}>Salvar alterações</Button>
        </Panel>
      )}

      {tab === "marketing" && (
        <Panel style={{ padding: 20, maxWidth: 640 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Canais atuais"><Input value={company.marketingVendas.canaisAtuais} onChange={(e) => update("marketingVendas", "canaisAtuais", e.target.value)} /></Field>
            <Field label="Investimento mensal"><Input value={company.marketingVendas.investimentoMensal} onChange={(e) => update("marketingVendas", "investimentoMensal", e.target.value)} /></Field>
            <Field label="Ciclo médio de vendas"><Input value={company.marketingVendas.cicloMedioVendas} onChange={(e) => update("marketingVendas", "cicloMedioVendas", e.target.value)} /></Field>
            <Field label="Ticket médio"><Input value={company.marketingVendas.ticketMedio} onChange={(e) => update("marketingVendas", "ticketMedio", e.target.value)} /></Field>
          </div>
          <Field label="Processo de vendas"><Textarea value={company.marketingVendas.processoVendas} onChange={(e) => update("marketingVendas", "processoVendas", e.target.value)} /></Field>
          <Button onClick={saveCompany} icon={Check}>Salvar alterações</Button>
        </Panel>
      )}

      {tab === "objetivos" && (
        <Panel style={{ padding: 20, maxWidth: 640 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {OBJETIVOS_OPCOES.map((o) => {
              const active = company.objetivos.principais.includes(o);
              return (
                <button key={o} onClick={() => setCompany((prev) => ({ ...prev, objetivos: { ...prev.objetivos, principais: active ? prev.objetivos.principais.filter((x) => x !== o) : [...prev.objetivos.principais, o] } }))} style={{
                  padding: "7px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                  background: active ? T.accentSoft : T.panel2, color: active ? T.accent2 : T.textDim,
                  border: `1px solid ${active ? T.accent + "66" : T.border}`, fontWeight: 500,
                }}>{o}</button>
              );
            })}
          </div>
          <Field label="Objetivo principal"><Input value={company.objetivos.objetivoPrincipal} onChange={(e) => update("objetivos", "objetivoPrincipal", e.target.value)} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Meta"><Input value={company.objetivos.meta} onChange={(e) => update("objetivos", "meta", e.target.value)} /></Field>
            <Field label="Prazo"><Input value={company.objetivos.prazo} onChange={(e) => update("objetivos", "prazo", e.target.value)} /></Field>
          </div>
          <Button onClick={saveCompany} icon={Check}>Salvar alterações</Button>
        </Panel>
      )}
    </div>
  );
}

/* =========================================================================
   DIRETOR IA — chat
   ========================================================================= */
function DiretorIA({ company, conversations, setConversations, activeConvId, setActiveConvId, addTask, addDecision, context }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const active = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages?.length, loading]);

  const newConversation = () => {
    const conv = { id: uid(), title: "Nova conversa", messages: [], createdAt: nowISO() };
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
  };

  useEffect(() => {
    if (conversations.length === 0) newConversation();
    else if (!activeConvId) setActiveConvId(conversations[0].id);
    // eslint-disable-next-line
  }, []);

  const send = async (text) => {
    const msg = text ?? input;
    if (!msg.trim() || loading) return;
    setError("");
    let convId = activeConvId;
    let conv = conversations.find((c) => c.id === convId);
    if (!conv) {
      conv = { id: uid(), title: msg.slice(0, 40), messages: [], createdAt: nowISO() };
      convId = conv.id;
      setActiveConvId(convId);
    }
    const userMsg = { role: "user", content: msg, id: uid() };
    const updatedMessages = [...conv.messages, userMsg];
    const title = conv.messages.length === 0 ? msg.slice(0, 42) : conv.title;
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === convId);
      if (exists) return prev.map((c) => (c.id === convId ? { ...c, messages: updatedMessages, title } : c));
      return [{ ...conv, messages: updatedMessages, title }, ...prev];
    });
    setInput("");
    setLoading(true);
    try {
      const reply = await callDirectorAI(company, updatedMessages, context);
      const aiMsg = { role: "assistant", content: reply, id: uid() };
      setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, messages: [...updatedMessages, aiMsg] } : c)));
    } catch (e) {
      setError(e.message || "Erro ao consultar a IA.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Qual deveria ser nossa prioridade de crescimento?",
    "Analise nosso posicionamento.",
    "Como podemos vender mais?",
    "Crie um plano de marketing para os próximos 90 dias.",
    "Como reduzir nosso CAC?",
    "Analise nossos principais concorrentes.",
  ];

  return (
    <div className="gos-fade" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, height: "calc(100vh - 90px)", margin: "-24px -28px", border: `1px solid ${T.borderSoft}`, borderRadius: 0 }}>
      {/* Sidebar conversas */}
      <div style={{ borderRight: `1px solid ${T.borderSoft}`, display: "flex", flexDirection: "column", background: T.bgElevated }}>
        <div style={{ padding: 14 }}>
          <Button size="sm" icon={Plus} style={{ width: "100%", justifyContent: "center" }} onClick={newConversation}>Nova conversa</Button>
        </div>
        <div className="gos-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveConvId(c.id)} style={{
              width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 7, border: "none", cursor: "pointer",
              background: c.id === activeConvId ? T.panel2 : "transparent", color: c.id === activeConvId ? T.text : T.textDim,
              fontSize: 13, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{c.title || "Conversa"}</button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ display: "flex", flexDirection: "column", background: T.bg }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={16} color={T.accent2} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Diretor IA</span>
          </div>
          <Badge tone="good">IA real conectada</Badge>
        </div>

        <div ref={scrollRef} className="gos-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {(!active || active.messages.length === 0) && (
            <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
              <Sparkles size={26} color={T.accent2} style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, marginBottom: 8 }}>Em que posso ajudar a estratégia hoje?</div>
              <div style={{ fontSize: 13.5, color: T.textDim, marginBottom: 20 }}>Uso o contexto cadastrado em "Meu Negócio" para responder de forma específica — não genérica.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} style={{
                    padding: "8px 12px", borderRadius: 20, background: T.panel2, border: `1px solid ${T.border}`,
                    color: T.textDim, fontSize: 12.5, cursor: "pointer",
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {active?.messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
              <div style={{
                maxWidth: "72%", padding: "11px 14px", borderRadius: 12,
                background: m.role === "user" ? T.accentSoft : T.panelSolid,
                border: `1px solid ${m.role === "user" ? T.accent + "44" : T.border}`,
                fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", color: T.text,
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", color: T.textFaint, fontSize: 13 }}>
              <Loader2 size={14} className="gos-pulse" /> Analisando contexto empresarial…
            </div>
          )}
          {error && <div style={{ color: T.bad, fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderSoft}` }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Pergunte ao Diretor IA sobre estratégia, marketing, vendas ou métricas…"
              style={{ flex: 1 }}
            />
            <Button icon={Send} onClick={() => send()} disabled={loading}>Enviar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ESTRATÉGIA
   ========================================================================= */
function Estrategia({ company, diagnosis, setDiagnosis, addTask, addDecision, context }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await callStructuredDiagnosis(company, context);
      setDiagnosis(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const swotBlock = (title, items, tone) => (
    <Panel style={{ padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T[tone], marginBottom: 10 }}>{title.toUpperCase()}</div>
      {(items || []).length === 0 ? <div style={{ fontSize: 13, color: T.textFaint }}>Sem itens.</div> : (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: T.textDim, lineHeight: 1.7 }}>
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </Panel>
  );

  return (
    <div className="gos-fade">
      <SectionHeader
        eyebrow="ESTRATÉGIA"
        title="Diagnóstico estratégico"
        desc="Análise SWOT, gargalos e prioridades geradas a partir do contexto real da sua empresa."
        right={<Button icon={Sparkles} onClick={run} disabled={loading}>{loading ? "Gerando…" : diagnosis ? "Atualizar diagnóstico" : "Gerar diagnóstico"}</Button>}
      />

      {error && <div style={{ color: T.bad, fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {!diagnosis && !loading && (
        <Panel style={{ padding: 0 }}>
          <EmptyState icon={Compass} title="Nenhum diagnóstico gerado" desc="Clique em “Gerar diagnóstico” para que o Diretor IA analise o contexto cadastrado em Meu Negócio e produza forças, fraquezas, gargalos e recomendações priorizadas." />
        </Panel>
      )}

      {loading && (
        <Panel style={{ padding: 40, textAlign: "center", color: T.textDim }}>
          <Loader2 size={20} className="gos-pulse" style={{ marginBottom: 10 }} />
          <div>Analisando contexto empresarial e estruturando recomendações…</div>
        </Panel>
      )}

      {diagnosis && !loading && (
        <div>
          <Panel style={{ padding: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: T.textFaint, fontWeight: 700, marginBottom: 8 }}>RESUMO EXECUTIVO</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>{diagnosis.summary}</div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            {swotBlock("Forças", diagnosis.forcas, "good")}
            {swotBlock("Fraquezas", diagnosis.fraquezas, "bad")}
            {swotBlock("Oportunidades", diagnosis.oportunidades, "accent")}
            {swotBlock("Ameaças", diagnosis.ameacas, "warn")}
          </div>

          <Panel style={{ padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.warn, marginBottom: 10 }}>GARGALOS IDENTIFICADOS</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: T.textDim, lineHeight: 1.7 }}>
              {(diagnosis.gargalos || []).map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </Panel>

          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, margin: "0 0 12px" }}>Recomendações</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(diagnosis.recomendacoes || []).map((r, i) => (
              <Panel key={i} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{r.titulo}</div>
                    <div style={{ fontSize: 13.5, color: T.textDim, marginBottom: 8, lineHeight: 1.6 }}>{r.descricao}</div>
                    <div style={{ fontSize: 12.5, color: T.textFaint, marginBottom: 10 }}><strong style={{ color: T.textDim }}>Justificativa:</strong> {r.justificativa}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Badge tone={r.impacto === "alto" ? "good" : r.impacto === "baixo" ? "bad" : "warn"}>Impacto {r.impacto}</Badge>
                      <Badge>Esforço {r.esforco}</Badge>
                      <Badge>Confiança {r.confianca}</Badge>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Button size="sm" variant="subtle" icon={ListChecks} onClick={() => addTask({ title: r.titulo, priority: r.impacto === "alto" ? "alta" : r.impacto === "baixo" ? "baixa" : "media", origin: "Estratégia" })}>Criar tarefa</Button>
                    <Button size="sm" variant="subtle" icon={ScrollText} onClick={() => addDecision({ title: r.titulo, justification: r.justificativa, confidence: r.confianca, impact: r.impacto })}>Salvar decisão</Button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   GENERIC CRUD LIST MODULE (used for competitors, campaigns, experiments, tasks, decisions)
   ========================================================================= */
function useCrud(key, initial = []) {
  const [items, setItems] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      const data = await store.get(key, initial);
      setItems(data);
      setLoaded(true);
    })();
    // eslint-disable-next-line
  }, [key]);
  useEffect(() => {
    if (loaded) store.set(key, items);
    // eslint-disable-next-line
  }, [items]);
  return [items, setItems, loaded];
}

/* -------- Concorrentes -------- */
function Concorrentes({ items, setItems }) {
  const [editing, setEditing] = useState(null);

  const blank = () => ({ id: uid(), nome: "", site: "", segmento: "", publico: "", preco: "", diferenciais: "", canais: "", observacoes: "" });
  const save = (item) => {
    setItems((prev) => (prev.find((p) => p.id === item.id) ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item]));
    setEditing(null);
  };

  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="INTELIGÊNCIA COMPETITIVA" title="Concorrentes" desc="Cadastre concorrentes reais para comparar posicionamento — nenhum dado é inventado pela plataforma." right={<Button icon={Plus} onClick={() => setEditing(blank())}>Adicionar concorrente</Button>} />
      {items.length === 0 ? (
        <Panel style={{ padding: 0 }}><EmptyState icon={Users2} title="Nenhum concorrente cadastrado" desc="Adicione concorrentes conhecidos para montar comparações e identificar oportunidades de diferenciação." action={<Button size="sm" onClick={() => setEditing(blank())} icon={Plus}>Adicionar</Button>} /></Panel>
      ) : (
        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.panel2 }}>
                  {["Nome", "Segmento", "Preço", "Diferenciais", "Canais", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: T.textFaint, fontWeight: 600, fontSize: 11.5, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{c.nome}</td>
                    <td style={{ padding: "10px 14px", color: T.textDim }}>{c.segmento || "—"}</td>
                    <td style={{ padding: "10px 14px", color: T.textDim }}>{c.preco || "—"}</td>
                    <td style={{ padding: "10px 14px", color: T.textDim, maxWidth: 220 }}>{c.diferenciais || "—"}</td>
                    <td style={{ padding: "10px 14px", color: T.textDim }}>{c.canais || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => setEditing(c)} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", marginRight: 8 }}><Pencil size={14} /></button>
                      <button onClick={() => setItems((prev) => prev.filter((p) => p.id !== c.id))} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title="Concorrente">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nome"><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></Field>
            <Field label="Site"><Input value={editing.site} onChange={(e) => setEditing({ ...editing, site: e.target.value })} /></Field>
            <Field label="Segmento"><Input value={editing.segmento} onChange={(e) => setEditing({ ...editing, segmento: e.target.value })} /></Field>
            <Field label="Preço"><Input value={editing.preco} onChange={(e) => setEditing({ ...editing, preco: e.target.value })} /></Field>
          </div>
          <Field label="Público"><Input value={editing.publico} onChange={(e) => setEditing({ ...editing, publico: e.target.value })} /></Field>
          <Field label="Diferenciais"><Textarea value={editing.diferenciais} onChange={(e) => setEditing({ ...editing, diferenciais: e.target.value })} /></Field>
          <Field label="Canais"><Input value={editing.canais} onChange={(e) => setEditing({ ...editing, canais: e.target.value })} /></Field>
          <Field label="Observações"><Textarea value={editing.observacoes} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} /></Field>
          <Button style={{ width: "100%", justifyContent: "center" }} onClick={() => save(editing)} icon={Check}>Salvar</Button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, width: 520, maxHeight: "85vh", overflowY: "auto" }} className="gos-scroll gos-fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* -------- Campanhas -------- */
const CAMPAIGN_STATUS = ["Planejada", "Em validação", "Ativa", "Pausada", "Concluída", "Cancelada"];
function Campanhas({ items, setItems }) {
  const [editing, setEditing] = useState(null);
  const blank = () => ({ id: uid(), nome: "", objetivo: "", canal: "", publico: "", oferta: "", orcamento: "", dataInicio: "", dataFim: "", status: "Planejada", metrica: "", observacoes: "" });
  const save = (item) => { setItems((prev) => (prev.find((p) => p.id === item.id) ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item])); setEditing(null); };
  const statusTone = { "Planejada": "neutral", "Em validação": "warn", "Ativa": "good", "Pausada": "warn", "Concluída": "accent", "Cancelada": "bad" };

  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="EXECUÇÃO" title="Campanhas" desc="Gerencie campanhas de marketing com objetivo, oferta e métrica claros antes de rodar." right={<Button icon={Plus} onClick={() => setEditing(blank())}>Nova campanha</Button>} />
      {items.length === 0 ? (
        <Panel style={{ padding: 0 }}><EmptyState icon={Rocket} title="Nenhuma campanha criada" desc="Crie uma campanha com objetivo, público, oferta, canal e métrica principal antes de veicular." action={<Button size="sm" onClick={() => setEditing(blank())} icon={Plus}>Nova campanha</Button>} /></Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {items.map((c) => (
            <Panel key={c.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                <div>
                  <button onClick={() => setEditing(c)} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", marginRight: 6 }}><Pencil size={13} /></button>
                  <button onClick={() => setItems((prev) => prev.filter((p) => p.id !== c.id))} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 6 }}>{c.nome || "(sem nome)"}</div>
              <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 4 }}>Objetivo: {c.objetivo || "—"}</div>
              <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 4 }}>Canal: {c.canal || "—"} · Orçamento: {c.orcamento || "—"}</div>
              <div style={{ fontSize: 12.5, color: T.textFaint }}>Métrica: {c.metrica || "—"}</div>
            </Panel>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Campanha">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nome"><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></Field>
            <Field label="Status"><Select options={CAMPAIGN_STATUS} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} /></Field>
            <Field label="Objetivo"><Input value={editing.objetivo} onChange={(e) => setEditing({ ...editing, objetivo: e.target.value })} /></Field>
            <Field label="Canal"><Input value={editing.canal} onChange={(e) => setEditing({ ...editing, canal: e.target.value })} /></Field>
            <Field label="Orçamento"><Input value={editing.orcamento} onChange={(e) => setEditing({ ...editing, orcamento: e.target.value })} /></Field>
            <Field label="Métrica principal"><Input value={editing.metrica} onChange={(e) => setEditing({ ...editing, metrica: e.target.value })} /></Field>
            <Field label="Data início"><Input type="date" value={editing.dataInicio} onChange={(e) => setEditing({ ...editing, dataInicio: e.target.value })} /></Field>
            <Field label="Data fim"><Input type="date" value={editing.dataFim} onChange={(e) => setEditing({ ...editing, dataFim: e.target.value })} /></Field>
          </div>
          <Field label="Público"><Input value={editing.publico} onChange={(e) => setEditing({ ...editing, publico: e.target.value })} /></Field>
          <Field label="Oferta"><Input value={editing.oferta} onChange={(e) => setEditing({ ...editing, oferta: e.target.value })} /></Field>
          <Button style={{ width: "100%", justifyContent: "center" }} onClick={() => save(editing)} icon={Check}>Salvar</Button>
        </Modal>
      )}
    </div>
  );
}

/* -------- Experimentos -------- */
const EXP_STATUS = ["Ideia", "Planejado", "Em execução", "Analisando", "Validado", "Rejeitado", "Encerrado"];
function Experimentos({ items, setItems }) {
  const [editing, setEditing] = useState(null);
  const blank = () => ({ id: uid(), nome: "", hipotese: "", problema: "", publico: "", variavel: "", canal: "", metrica: "", criterioSucesso: "", criterioInterrupcao: "", resultado: "", aprendizado: "", status: "Ideia" });
  const save = (item) => { setItems((prev) => (prev.find((p) => p.id === item.id) ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item])); setEditing(null); };
  const statusTone = { Ideia: "neutral", Planejado: "warn", "Em execução": "accent", Analisando: "warn", Validado: "good", Rejeitado: "bad", Encerrado: "neutral" };

  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="EXPERIMENTAÇÃO" title="Experimentos" desc="Toda hipótese testável precisa de um critério de sucesso definido antes de começar." right={<Button icon={Plus} onClick={() => setEditing(blank())}>Novo experimento</Button>} />
      {items.length === 0 ? (
        <Panel style={{ padding: 0 }}><EmptyState icon={FlaskConical} title="Nenhum experimento registrado" desc="Registre uma hipótese, o teste, a métrica principal e o critério de sucesso antes de rodar." action={<Button size="sm" onClick={() => setEditing(blank())} icon={Plus}>Novo experimento</Button>} /></Panel>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((e) => (
            <Panel key={e.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Badge tone={statusTone[e.status]}>{e.status}</Badge>
                  <div style={{ fontWeight: 600, fontSize: 15, margin: "8px 0 4px" }}>{e.nome || "(sem nome)"}</div>
                </div>
                <div>
                  <button onClick={() => setEditing(e)} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", marginRight: 6 }}><Pencil size={14} /></button>
                  <button onClick={() => setItems((prev) => prev.filter((p) => p.id !== e.id))} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textDim, marginBottom: 8, lineHeight: 1.6 }}><strong style={{ color: T.text }}>Hipótese:</strong> {e.hipotese || "—"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5, color: T.textFaint }}>
                <div><strong style={{ color: T.textDim }}>Métrica:</strong> {e.metrica || "—"}</div>
                <div><strong style={{ color: T.textDim }}>Critério de sucesso:</strong> {e.criterioSucesso || "—"}</div>
              </div>
            </Panel>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Experimento">
          <Field label="Nome"><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></Field>
          <Field label="Hipótese"><Textarea value={editing.hipotese} onChange={(e) => setEditing({ ...editing, hipotese: e.target.value })} /></Field>
          <Field label="Problema"><Input value={editing.problema} onChange={(e) => setEditing({ ...editing, problema: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Variável testada"><Input value={editing.variavel} onChange={(e) => setEditing({ ...editing, variavel: e.target.value })} /></Field>
            <Field label="Canal"><Input value={editing.canal} onChange={(e) => setEditing({ ...editing, canal: e.target.value })} /></Field>
            <Field label="Métrica principal"><Input value={editing.metrica} onChange={(e) => setEditing({ ...editing, metrica: e.target.value })} /></Field>
            <Field label="Status"><Select options={EXP_STATUS} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} /></Field>
          </div>
          <Field label="Critério de sucesso"><Input value={editing.criterioSucesso} onChange={(e) => setEditing({ ...editing, criterioSucesso: e.target.value })} /></Field>
          <Field label="Critério de interrupção"><Input value={editing.criterioInterrupcao} onChange={(e) => setEditing({ ...editing, criterioInterrupcao: e.target.value })} /></Field>
          <Field label="Resultado / aprendizado"><Textarea value={editing.aprendizado} onChange={(e) => setEditing({ ...editing, aprendizado: e.target.value })} /></Field>
          <Button style={{ width: "100%", justifyContent: "center" }} onClick={() => save(editing)} icon={Check}>Salvar</Button>
        </Modal>
      )}
    </div>
  );
}

/* -------- Tarefas -------- */
function Tarefas({ items, setItems }) {
  const [editing, setEditing] = useState(null);
  const blank = () => ({ id: uid(), title: "", description: "", responsavel: "", priority: "media", prazo: "", status: "a_fazer", origin: "Manual" });
  const save = (item) => { setItems((prev) => (prev.find((p) => p.id === item.id) ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev])); setEditing(null); };
  const cols = [
    { id: "a_fazer", label: "A fazer" },
    { id: "em_andamento", label: "Em andamento" },
    { id: "concluida", label: "Concluída" },
  ];
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="EXECUÇÃO" title="Tarefas" desc="Tarefas manuais ou geradas a partir de estratégia, campanhas e experimentos." right={<Button icon={Plus} onClick={() => setEditing(blank())}>Nova tarefa</Button>} />
      {items.length === 0 ? (
        <Panel style={{ padding: 0 }}><EmptyState icon={ListChecks} title="Nenhuma tarefa criada" desc="Crie tarefas manualmente ou a partir de recomendações do Diretor IA em Estratégia." action={<Button size="sm" onClick={() => setEditing(blank())} icon={Plus}>Nova tarefa</Button>} /></Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {cols.map((col) => (
            <div key={col.id}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.textFaint, marginBottom: 10 }}>{col.label.toUpperCase()} · {items.filter((t) => t.status === col.id).length}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.filter((t) => t.status === col.id).map((t) => (
                  <Panel key={t.id} style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Badge tone={t.priority === "alta" ? "bad" : t.priority === "media" ? "warn" : "neutral"}>{t.priority}</Badge>
                      <button onClick={() => setItems((prev) => prev.filter((p) => p.id !== t.id))} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><Trash2 size={13} /></button>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, margin: "8px 0 6px" }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 8 }}>Origem: {t.origin}</div>
                    <select value={t.status} onChange={(e) => setItems((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: e.target.value } : p)))} style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }}>
                      {cols.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Panel>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Tarefa">
          <Field label="Título"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
          <Field label="Descrição"><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Prioridade"><Select options={["baixa", "media", "alta"]} value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value })} /></Field>
            <Field label="Prazo"><Input type="date" value={editing.prazo} onChange={(e) => setEditing({ ...editing, prazo: e.target.value })} /></Field>
          </div>
          <Button style={{ width: "100%", justifyContent: "center" }} onClick={() => save(editing)} icon={Check}>Salvar</Button>
        </Modal>
      )}
    </div>
  );
}

/* -------- Decisões -------- */
function Decisoes({ items }) {
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="MEMÓRIA EMPRESARIAL" title="Decisões" desc="Histórico de decisões estratégicas salvas — a base para o sistema aprender com o negócio ao longo do tempo." />
      {items.length === 0 ? (
        <Panel style={{ padding: 0 }}><EmptyState icon={ScrollText} title="Nenhuma decisão registrada" desc="Salve recomendações do módulo Estratégia para começar seu histórico de decisões." /></Panel>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((d) => (
            <Panel key={d.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.title}</div>
                <Badge tone={d.impact === "alto" ? "good" : d.impact === "baixo" ? "bad" : "warn"}>Impacto {d.impact}</Badge>
              </div>
              <div style={{ fontSize: 13, color: T.textDim, margin: "8px 0" }}>{d.justification}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.textFaint }}>
                <span>Confiança: {d.confidence}</span>
                <span>{fmtDate(d.date)}</span>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------- Documentos -------- */
const DOC_CATEGORIES = ["Estudos de mercado", "Concorrentes", "Playbooks", "Documentos internos", "Pesquisas", "Marketing", "Vendas", "Financeiro", "Produtos"];
function Documentos({ items, setItems }) {
  const [editing, setEditing] = useState(null);
  const blank = () => ({ id: uid(), titulo: "", categoria: "Documentos internos", conteudo: "", tags: "", createdAt: nowISO() });
  const save = (item) => { setItems((prev) => (prev.find((p) => p.id === item.id) ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev])); setEditing(null); };
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="BASE DE CONHECIMENTO" title="Documentos" desc="Notas e estudos em texto que alimentam o contexto usado pelo Diretor IA. Upload de PDF/DOCX é um ponto de integração futura (pipeline de chunking + embeddings)." right={<Button icon={Plus} onClick={() => setEditing(blank())}>Novo documento</Button>} />
      <Panel style={{ padding: 12, marginBottom: 18, borderStyle: "dashed" }}>
        <div style={{ fontSize: 12.5, color: T.textFaint, display: "flex", alignItems: "center", gap: 8 }}>
          <Info size={14} /> Upload de arquivos (PDF, DOCX, CSV) requer integração de storage + extração de texto — arquitetura preparada, não conectada nesta versão.
        </div>
      </Panel>
      {items.length === 0 ? (
        <Panel style={{ padding: 0 }}><EmptyState icon={FileText} title="Nenhum documento cadastrado" desc="Adicione notas, estudos ou playbooks em texto para consulta futura." action={<Button size="sm" onClick={() => setEditing(blank())} icon={Plus}>Novo documento</Button>} /></Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
          {items.map((d) => (
            <Panel key={d.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Badge>{d.categoria}</Badge>
                <div>
                  <button onClick={() => setEditing(d)} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", marginRight: 6 }}><Pencil size={13} /></button>
                  <button onClick={() => setItems((prev) => prev.filter((p) => p.id !== d.id))} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, margin: "8px 0 6px" }}>{d.titulo || "(sem título)"}</div>
              <div style={{ fontSize: 12.5, color: T.textDim, maxHeight: 60, overflow: "hidden" }}>{d.conteudo}</div>
              <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8 }}>{fmtDate(d.createdAt)}</div>
            </Panel>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Documento">
          <Field label="Título"><Input value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} /></Field>
          <Field label="Categoria"><Select options={DOC_CATEGORIES} value={editing.categoria} onChange={(e) => setEditing({ ...editing, categoria: e.target.value })} /></Field>
          <Field label="Conteúdo"><Textarea style={{ minHeight: 160 }} value={editing.conteudo} onChange={(e) => setEditing({ ...editing, conteudo: e.target.value })} /></Field>
          <Field label="Tags (separadas por vírgula)"><Input value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} /></Field>
          <Button style={{ width: "100%", justifyContent: "center" }} onClick={() => save(editing)} icon={Check}>Salvar</Button>
        </Modal>
      )}
    </div>
  );
}

/* -------- Marketing / Vendas / Mercado (workspaces with AI actions) -------- */
function AIActionCard({ icon: Icon, title, desc, onRun, loading }) {
  return (
    <Panel style={{ padding: 16 }}>
      <Icon size={17} color={T.accent2} style={{ marginBottom: 10 }} />
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 12, lineHeight: 1.5 }}>{desc}</div>
      <Button size="sm" variant="subtle" onClick={onRun} disabled={loading} icon={Sparkles}>{loading ? "Gerando…" : "Gerar com IA"}</Button>
    </Panel>
  );
}

function AIResultPanel({ result, onClear }) {
  if (!result) return null;
  return (
    <Panel style={{ padding: 18, marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={15} color={T.accent2} /> Resultado do Diretor IA</div>
        <button onClick={onClear} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer" }}><X size={15} /></button>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap", color: T.text }}>{result}</div>
    </Panel>
  );
}

function MarketingModule({ company, context }) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState("");
  const run = async (key, prompt) => {
    setLoading(key);
    setResult("");
    try {
      const r = await callDirectorAI(company, [{ role: "user", content: prompt }], context);
      setResult(r);
    } catch (e) {
      setResult("Erro: " + e.message);
    } finally {
      setLoading("");
    }
  };
  const actions = [
    { key: "plano", icon: Compass, title: "Plano de marketing 90 dias", desc: "Plano priorizado com canais, mensagem e métricas.", prompt: "Crie um plano de marketing para os próximos 90 dias, priorizado por impacto, com canais recomendados, mensagem central e métrica por fase." },
    { key: "conteudo", icon: BookOpen, title: "Calendário de conteúdo", desc: "Pauta de conteúdo alinhada ao público e objetivo.", prompt: "Crie uma proposta de calendário de conteúdo para as próximas 4 semanas, alinhada ao público-alvo e ao objetivo principal da empresa." },
    { key: "oferta", icon: Target, title: "Análise de oferta", desc: "Avalia clareza, diferenciação e risco da oferta atual.", prompt: "Analise criticamente a oferta atual da empresa (produto, preço, proposta de valor) e aponte riscos, lacunas e como fortalecê-la." },
    { key: "copy", icon: Megaphone, title: "Copy para campanha", desc: "Gera mensagens de anúncio para o público definido.", prompt: "Crie 3 variações de copy para anúncio, com headline e corpo, alinhadas ao ICP e à oferta cadastrados." },
    { key: "email", icon: Mail, title: "Sequência de e-mails", desc: "Sequência de nutrição para leads.", prompt: "Crie uma sequência de 4 e-mails de nutrição de leads, com objetivo, assunto e resumo de cada e-mail." },
    { key: "canais", icon: Radar, title: "Estratégia de canais", desc: "Prioriza canais de aquisição por fit e custo.", prompt: "Recomende e priorize os canais de aquisição mais adequados ao modelo de negócio e orçamento disponível, explicando o porquê de cada prioridade." },
  ];
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="MARKETING" title="Central de Marketing" desc="Peça ao Diretor IA para gerar planos, copies e calendários com base no contexto real da empresa." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {actions.map((a) => <AIActionCard key={a.key} icon={a.icon} title={a.title} desc={a.desc} loading={loading === a.key} onRun={() => run(a.key, a.prompt)} />)}
      </div>
      <AIResultPanel result={result} onClear={() => setResult("")} />
    </div>
  );
}

function VendasModule({ company, context }) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState("");
  const run = async (key, prompt) => {
    setLoading(key); setResult("");
    try { setResult(await callDirectorAI(company, [{ role: "user", content: prompt }], context)); }
    catch (e) { setResult("Erro: " + e.message); }
    finally { setLoading(""); }
  };
  const actions = [
    { key: "icp", icon: Target, title: "Refinar ICP", desc: "Define o cliente ideal com critérios objetivos.", prompt: "Refine o perfil de cliente ideal (ICP) com critérios firmográficos e comportamentais objetivos, com base no público e produto cadastrados." },
    { key: "cadencia", icon: Clock3, title: "Cadência de prospecção", desc: "Sequência de contatos multicanal.", prompt: "Crie uma cadência de prospecção outbound de 5 toques, multicanal (e-mail, ligação, LinkedIn/WhatsApp), com objetivo de cada toque." },
    { key: "script", icon: MessageSquare, title: "Script de ligação", desc: "Abertura, descoberta e próximos passos.", prompt: "Crie um script de ligação de prospecção com abertura, perguntas de discovery e como encaminhar o próximo passo." },
    { key: "objecoes", icon: ShieldAlert, title: "Respostas a objeções", desc: "Lida com as objeções mais comuns do ICP.", prompt: "Liste as objeções comerciais mais prováveis para este ICP e sugira como respondê-las sem ser insistente." },
    { key: "proposta", icon: FileText, title: "Estrutura de proposta", desc: "Esqueleto de proposta comercial.", prompt: "Sugira a estrutura de uma proposta comercial eficaz para este produto e ICP, seção por seção." },
    { key: "forecast", icon: TrendingUp, title: "Leitura de forecast", desc: "O que observar para prever receita.", prompt: "Explique quais sinais e métricas a empresa deveria acompanhar para montar um forecast de vendas confiável, dado o contexto atual." },
  ];
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="VENDAS" title="Central Comercial" desc="ICP, prospecção, scripts e propostas gerados a partir do seu contexto comercial." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {actions.map((a) => <AIActionCard key={a.key} icon={a.icon} title={a.title} desc={a.desc} loading={loading === a.key} onRun={() => run(a.key, a.prompt)} />)}
      </div>
      <AIResultPanel result={result} onClear={() => setResult("")} />
      <Panel style={{ padding: 14, marginTop: 18, borderStyle: "dashed" }}>
        <div style={{ fontSize: 12.5, color: T.textFaint, display: "flex", gap: 8 }}><Info size={14} style={{ flexShrink: 0, marginTop: 1 }} /> Nenhuma mensagem é enviada automaticamente. Scripts e cadências são sugestões para revisão e aprovação humana.</div>
      </Panel>
    </div>
  );
}

function MercadoModule({ company, context }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult("");
    try {
      const r = await callDirectorAI(company, [{ role: "user", content: `Pesquisa de mercado solicitada: "${query}". Responda com o que você sabe do seu conhecimento geral, deixando claro que não há acesso a busca ao vivo nesta versão, separando fatos amplamente conhecidos de estimativas, e evitando inventar estatísticas específicas sem fonte.` }], context);
      setResult(r);
    } catch (e) { setResult("Erro: " + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="PESQUISA" title="Inteligência de Mercado" desc="Central de pesquisa de tendências, concorrência e comportamento do consumidor." />
      <Panel style={{ padding: 14, marginBottom: 18, borderColor: T.warn + "44" }}>
        <div style={{ fontSize: 12.5, color: T.warn, display: "flex", gap: 8, fontWeight: 600 }}><AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> Configuração necessária: integração de busca web em tempo real não está conectada. As respostas abaixo usam apenas o conhecimento geral do modelo — trate como ponto de partida, não como dado verificado.</div>
      </Panel>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: tendências de vendas B2B para SaaS em 2026" onKeyDown={(e) => e.key === "Enter" && run()} />
        <Button icon={Search} onClick={run} disabled={loading}>{loading ? "Buscando…" : "Pesquisar"}</Button>
      </div>
      {loading && <Panel style={{ padding: 30, textAlign: "center", color: T.textDim }}><Loader2 className="gos-pulse" size={18} /></Panel>}
      <AIResultPanel result={result} onClear={() => setResult("")} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 24 }}>
        {INTEGRATIONS.filter((i) => ["trends", "seo"].includes(i.id)).map((i) => (
          <Panel key={i.id} style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{i.name}</div>
            <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 10 }}>{i.desc}</div>
            <Badge tone="warn">Configuração necessária</Badge>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* -------- Analytics -------- */
function Analytics({ metrics, setMetrics }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(metrics);
  useEffect(() => setForm(metrics), [metrics]);
  const fields = [
    { k: "receita", l: "Receita", icon: DollarSign },
    { k: "cac", l: "CAC", icon: Gauge },
    { k: "ltv", l: "LTV", icon: TrendingUp },
    { k: "conversao", l: "Conversão", icon: Percent },
    { k: "ticketMedio", l: "Ticket médio", icon: DollarSign },
    { k: "churn", l: "Churn", icon: TrendingDown },
    { k: "pipeline", l: "Pipeline", icon: Layers },
    { k: "winRate", l: "Win rate", icon: Trophy },
  ];
  const hasAny = fields.some((f) => metrics[f.k]);
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="MEDIÇÃO" title="Analytics" desc="Indicadores inseridos manualmente. Nenhum número aqui é inventado — apenas o que você registrar." right={<Button icon={Pencil} variant="subtle" onClick={() => setEditing(true)}>Atualizar métricas</Button>} />
      {!hasAny ? (
        <Panel style={{ padding: 0 }}><EmptyState icon={LineChart} title="Sem dados ainda" desc="Registre suas métricas principais para acompanhar evolução ao longo do tempo. Importação de planilhas é um ponto de integração futuro." action={<Button size="sm" onClick={() => setEditing(true)} icon={Plus}>Adicionar métricas</Button>} /></Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {fields.map((f) => (
            <MetricCard key={f.k} label={f.l} hasData={!!metrics[f.k]} value={metrics[f.k]} icon={f.icon} />
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(false)} title="Atualizar métricas">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map((f) => (
              <Field key={f.k} label={f.l}><Input value={form[f.k] || ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} /></Field>
            ))}
          </div>
          <Button style={{ width: "100%", justifyContent: "center" }} onClick={() => { setMetrics(form); setEditing(false); }} icon={Check}>Salvar métricas</Button>
        </Modal>
      )}
    </div>
  );
}

/* -------- Configurações -------- */
function Configuracoes({ user, integrations, company }) {
  const [tab, setTab] = useState("perfil");
  return (
    <div className="gos-fade">
      <SectionHeader eyebrow="CONFIGURAÇÕES" title="Configurações" desc="Perfil, empresa e integrações externas." />
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 22 }}>
        {[{ id: "perfil", label: "Perfil" }, { id: "integracoes", label: "Integrações" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? T.accent : "transparent"}`, color: tab === t.id ? T.text : T.textDim, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>
        ))}
      </div>
      {tab === "perfil" && (
        <Panel style={{ padding: 20, maxWidth: 480 }}>
          <Field label="Nome"><Input value={user?.name || ""} disabled /></Field>
          <Field label="E-mail"><Input value={user?.email || ""} disabled /></Field>
          <div style={{ fontSize: 12, color: T.textFaint }}>Edição de perfil será liberada em versão futura.</div>
        </Panel>
      )}
      {tab === "integracoes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {INTEGRATIONS.map((i) => (
            <Panel key={i.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{i.name}</div>
                  <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 10 }}>{i.desc}</div>
                </div>
                <Unlink size={15} color={T.textFaint} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Badge tone="warn">Configuração necessária</Badge>
                <Button size="sm" variant="subtle" disabled icon={Link2}>Conectar</Button>
              </div>
              <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8 }}>Última sincronização: nunca</div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */
export default function GrowthOSApp() {
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState("landing"); // landing | login | register | onboarding | app
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(emptyCompany());
  const [view, setView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [competitors, setCompetitors, competitorsLoaded] = useCrud("competitors", []);
  const [campaigns, setCampaigns] = useCrud("campaigns", []);
  const [experiments, setExperiments] = useCrud("experiments", []);
  const [tasks, setTasks] = useCrud("tasks", []);
  const [decisions, setDecisions] = useCrud("decisions", []);
  const [documents, setDocuments] = useCrud("documents", []);
  const [metrics, setMetricsState] = useState({});

  // boot: load session
  useEffect(() => {
    (async () => {
      const session = await store.get("auth:session");
      const savedUser = await store.get("auth:user");
      const savedCompany = await store.get("company");
      const savedConvs = await store.get("conversations", []);
      const savedDiagnosis = await store.get("diagnosis");
      const savedMetrics = await store.get("metrics", {});
      if (savedCompany) setCompany({ ...emptyCompany(), ...savedCompany });
      if (savedConvs) setConversations(savedConvs);
      if (savedDiagnosis) setDiagnosis(savedDiagnosis);
      if (savedMetrics) setMetricsState(savedMetrics);
      if (session && savedUser) {
        setUser(savedUser);
        setScreen((savedCompany && savedCompany.onboardingComplete) ? "app" : "onboarding");
      }
      setBooting(false);
    })();
  }, []);

  // persist company / conversations / diagnosis / metrics
  useEffect(() => { if (!booting) store.set("company", company); }, [company, booting]);
  useEffect(() => { if (!booting) store.set("conversations", conversations); }, [conversations, booting]);
  useEffect(() => { if (!booting) store.set("diagnosis", diagnosis); }, [diagnosis, booting]);
  useEffect(() => { if (!booting) store.set("metrics", metrics); }, [metrics, booting]);

  const setMetrics = (m) => setMetricsState(m);

  const addTask = ({ title, priority = "media", origin = "Manual" }) => {
    setTasks((prev) => [{ id: uid(), title, description: "", priority, prazo: "", status: "a_fazer", origin }, ...prev]);
  };
  const addDecision = ({ title, justification, confidence, impact }) => {
    setDecisions((prev) => [{ id: uid(), title, justification, confidence, impact, status: "Recomendada", date: nowISO() }, ...prev]);
  };

  const handleAuth = async (u) => {
    setUser(u);
    const c = await store.get("company");
    if (c && c.onboardingComplete) {
      setCompany({ ...emptyCompany(), ...c });
      setScreen("app");
    } else {
      if (c) setCompany({ ...emptyCompany(), ...c });
      setScreen("onboarding");
    }
  };

  const finishOnboarding = async () => {
    const updated = { ...company, onboardingComplete: true };
    setCompany(updated);
    await store.set("company", updated);
    setScreen("app");
    setView("estrategia");
  };

  const logout = async () => {
    await store.set("auth:session", false);
    setUser(null);
    setScreen("landing");
  };

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.textDim }}>
        {FONT_LINK}
        <Loader2 className="gos-pulse" size={22} />
      </div>
    );
  }

  if (screen === "landing") return <Landing onStart={() => setScreen("register")} onLogin={() => setScreen("login")} />;
  if (screen === "login" || screen === "register") {
    return <AuthScreen mode={screen} setMode={setScreen} onAuth={handleAuth} />;
  }
  if (screen === "onboarding") {
    return <Onboarding company={company} setCompany={setCompany} onFinish={finishOnboarding} />;
  }

  // Memória empresarial que alimenta o Diretor IA além do cadastro inicial:
  // decisões já tomadas, métricas reais, tarefas em aberto e documentos.
  const aiContext = { decisions, metrics, tasks, documents };

  // Authenticated app
  return (
    <div style={{ display: "flex", background: T.bg, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      {FONT_LINK}
      <Sidebar current={view} setCurrent={setView} collapsed={collapsed} setCollapsed={setCollapsed} user={user} onLogout={logout} companyName={company.info.nome} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Topbar user={user} companyName={company.info.nome} onAskDirector={() => setView("diretor")} />
        <div style={{ padding: "32px 36px", maxWidth: view === "diretor" ? "none" : 1180 }}>
          {view === "dashboard" && <Dashboard company={company} metrics={metrics} tasks={tasks} decisions={decisions} setView={setView} diagnosis={diagnosis} />}
          {view === "negocio" && <MeuNegocio company={company} setCompany={setCompany} saveCompany={() => store.set("company", company)} />}
          {view === "diretor" && (
            <DiretorIA
              company={company}
              conversations={conversations}
              setConversations={setConversations}
              activeConvId={activeConvId}
              setActiveConvId={setActiveConvId}
              addTask={addTask}
              addDecision={addDecision}
              context={aiContext}
            />
          )}
          {view === "estrategia" && <Estrategia company={company} diagnosis={diagnosis} setDiagnosis={setDiagnosis} addTask={addTask} addDecision={addDecision} context={aiContext} />}
          {view === "marketing" && <MarketingModule company={company} context={aiContext} />}
          {view === "vendas" && <VendasModule company={company} context={aiContext} />}
          {view === "mercado" && <MercadoModule company={company} context={aiContext} />}
          {view === "concorrentes" && <Concorrentes items={competitors} setItems={setCompetitors} />}
          {view === "campanhas" && <Campanhas items={campaigns} setItems={setCampaigns} />}
          {view === "experimentos" && <Experimentos items={experiments} setItems={setExperiments} />}
          {view === "analytics" && <Analytics metrics={metrics} setMetrics={setMetrics} />}
          {view === "decisoes" && <Decisoes items={decisions} />}
          {view === "tarefas" && <Tarefas items={tasks} setItems={setTasks} />}
          {view === "documentos" && <Documentos items={documents} setItems={setDocuments} />}
          {view === "config" && <Configuracoes user={user} integrations={INTEGRATIONS} company={company} />}
        </div>
      </div>
    </div>
  );
}
