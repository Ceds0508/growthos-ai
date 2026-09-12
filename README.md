# GrowthOS AI — projeto web completo

Este pacote contém um site real (frontend + backend) pronto para publicar
na internet:

```
growthos-ai/
├── client/     → site (React + Vite) — a interface que o visitante vê
└── server/     → backend (Node + Express) — guarda a chave de IA e serve o site
```

Por que existem duas pastas? Porque a chave da API da Anthropic **nunca**
pode ficar no navegador (qualquer visitante conseguiria copiá-la e usar por
sua conta). O backend guarda a chave em segredo e repassa as chamadas.

---

## 1. Rodar no seu computador (antes de publicar)

Pré-requisito: ter o [Node.js](https://nodejs.org) instalado (versão 18 ou
mais recente). Para conferir: `node -v` no terminal.

### 1.1 Configurar o backend

```bash
cd server
npm install
cp .env.example .env
```

Abra o arquivo `.env` e cole sua chave real:

```
ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui
```

(Você gera uma chave em https://console.anthropic.com/ → API Keys.)

Rode o backend:

```bash
npm run dev
```

Deve aparecer `GrowthOS AI rodando em http://localhost:3000`.

### 1.2 Configurar o frontend

Em **outro terminal** (deixe o backend rodando no primeiro):

```bash
cd client
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador — esse é o site funcionando
localmente, já conversando com a IA de verdade através do seu backend.

---

## 2. Publicar de verdade na internet

A forma mais simples é publicar backend e frontend juntos, como **um único
serviço**, já que o `server/index.js` foi feito para servir o site depois
de compilado (`client/dist`).

### Opção recomendada: Render.com (tem plano gratuito, sem cartão)

1. Crie uma conta em https://render.com e conecte seu GitHub (suba esta
   pasta para um repositório no GitHub primeiro — pode ser privado).
2. No Render, clique em **New → Web Service** e aponte para o repositório.
3. Em **Build Command**, coloque:
   ```
   cd client && npm install && npm run build && cd ../server && npm install
   ```
4. Em **Start Command**, coloque:
   ```
   node server/index.js
   ```
5. Em **Environment Variables**, adicione `ANTHROPIC_API_KEY` com sua chave
   real (nunca suba o arquivo `.env` para o GitHub — o `.gitignore` já
   evita isso).
6. Clique em **Deploy**. Em alguns minutos o Render te dá uma URL pública
   tipo `https://growthos-ai.onrender.com` — pronto, é o seu site no ar.

### Alternativas equivalentes
- **Railway.app** — fluxo quase idêntico ao Render.
- **Fly.io** — mais controle, exige `flyctl` no terminal.
- **VPS próprio** (DigitalOcean, Hetzner etc.) — rode `npm run build` no
  client, depois `node server/index.js` atrás de um Nginx + PM2 para manter
  o processo no ar.

### Domínio próprio
Qualquer uma dessas plataformas permite apontar um domínio seu (ex.:
`growthos.suaempresa.com.br`) nas configurações de "Custom Domain" —
normalmente basta criar um registro CNAME no seu provedor de domínio.

---

## 3. O que ainda é simulado (para não fingir mais do que existe)

- **Autenticação**: usa `localStorage` do navegador — funciona por
  dispositivo/navegador, não é uma conta na nuvem nem é segura para dados
  sensíveis. Para autenticação de produção real, o próximo passo seria
  adicionar um banco de dados (Postgres) + hashing de senha (bcrypt) no
  backend.
- **Inteligência de Mercado**: usa apenas o conhecimento geral do modelo,
  sem busca ao vivo na web.
- **Documentos**: aceita apenas texto colado, não upload de PDF/DOCX.
- **Integrações** (Google Ads, GA4, CRM etc.): pontos de integração
  desenhados na tela de Configurações, mas não conectados.

Essas são exatamente as próximas fases naturais de evolução do produto.
