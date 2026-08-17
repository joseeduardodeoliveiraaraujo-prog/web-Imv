# Gerenciamento de Certificados

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Express-5.2.1-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Firebase-Auth+Admin-FFCA28?logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white" alt="Vite">
</p>

## Sobre o projeto

Sistema web full stack para criação, customização e gerenciamento de certificados em lote. O projeto foi desenvolvido para resolver o problema de emissão manual de certificados — uma tarefa repetitiva e propensa a erros quando aplicada a eventos com grande número de participantes.

Com este sistema, o usuário faz upload de um modelo de certificado (imagem), define os textos, estilos e posições de forma visual através de um editor interativo baseado em Canvas, e gera automaticamente certificados individualizados para uma lista de nomes.

## Objetivo

O objetivo do projeto é demonstrar competências em desenvolvimento full stack com foco em aplicações reais, integrando autenticação segura, armazenamento de arquivos na nuvem, banco de dados relacional e processamento de imagens no client-side.

## Funcionalidades

- **Autenticação de usuários** com e-mail e senha via Firebase Authentication
- **Upload de modelos de certificado** (imagens PNG/JPEG) com geração automática de thumbnail otimizada (WebP)
- **Editor visual interativo** com canvas de arrastar e soltar (drag-and-drop) para posicionar nome e texto
- **Customização de estilos**: seleção de fontes (13 opções entre Sans-Serif e Serif), cores e tamanhos
- **Edição individual por certificado**: possibilidade de texto personalizado por participante sem afetar a configuração global
- **Geração em lote** com três opções de exportação:
  - PDF único (todos os certificados em um arquivo)
  - PDFs individuais compactados em ZIP
  - Imagens JPEG individuais compactadas em ZIP
- **Barra de progresso** com mensagens de status durante a geração dos arquivos
- **Salvamento de projetos** com persistência no banco de dados (máximo 3 projetos recentes por usuário)
- **Listagem de modelos** e projetos editados recentemente na dashboard
- **Alinhamento magnético** ao centro do canvas durante o arraste dos elementos
- **Linhas guia visuais** indicando alinhamento central

## Tecnologias utilizadas

### Frontend

- **React 19** com hooks (useState, useEffect, useRef, useMemo)
- **Vite 7** como bundler e dev server
- **React Router DOM 7** para roteamento SPA
- **Canvas API** para renderização interativa dos certificados
- **jsPDF** para geração de PDFs no client-side
- **JSZip** para compactação de arquivos
- **file-saver** para disparo de downloads
- **react-select** para seleção de fontes com interface estilizada
- **Google Fonts** com 13 fontes carregadas via link preload

### Backend

- **Node.js** com ES Modules
- **Express 5** como framework HTTP
- **pg (node-postgres)** com pool de conexões para PostgreSQL
- **Supabase Storage** para armazenamento de imagens (bucket `certificates`)
- **Sharp** para processamento e compressão de thumbnails (WebP)
- **Multer** com memoryStorage para uploads multipart
- **Helmet** para headers de segurança HTTP
- **express-rate-limit** para rate limiting nas rotas da API
- **Zod** para validação de entrada com schemas tipados

### Banco de dados

- **PostgreSQL** hospedado no Supabase (via pooler)
- 3 tabelas: `users`, `certificates`, `projects`
- Chaves estrangeiras com `ON DELETE CASCADE`
- Índices otimizados nas colunas de foreign key

### Autenticação

- **Firebase Authentication** (client SDK) para login com e-mail/senha
- **Firebase Admin SDK** (backend) para validação de tokens Bearer
- Middleware customizado de autenticação em todas as rotas protegidas

### Outras tecnologias

- **dotenv** para variáveis de ambiente
- **CORS** configurado com origem específica
- **Vitest** + **Supertest** para testes automatizados

## Estrutura do projeto

```
├── backend/
│   ├── database/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_certificates.sql
│   │   └── 003_create_projects.sql
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   ├── tests/
│   │   ├── setup.js
│   │   ├── routes.test.js
│   │   └── validate.test.js
│   ├── db.js
│   ├── firebaseAdmin.js
│   ├── server.js
│   ├── vitest.config.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── img1.jpg
│   │   └── img2.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/
│   │   │   └── Login/
│   │   ├── Pages/
│   │   │   ├── Home.jsx
│   │   │   └── Editor.jsx
│   │   ├── services/
│   │   │   └── firebase.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
└── .gitignore
```

## Como funciona

### Fluxo principal

1. O usuário acessa o sistema e faz login com e-mail e senha (Firebase Authentication)
2. Na dashboard, pode visualizar os modelos de certificado já cadastrados ou fazer upload de um novo modelo
3. Ao clicar em um modelo, abre o editor visual com o certificado carregado no canvas
4. O usuário insere uma lista de nomes (um por linha) e define o texto do corpo do certificado
5. Através do canvas, pode arrastar e posicionar livremente os campos de nome e texto
6. Pode customizar fontes, cores e tamanhos — tanto globalmente quanto individualmente por certificado
7. Para gerar os arquivos, o usuário escolhe entre PDF único, PDFs individuais em ZIP ou imagens JPEG em ZIP
8. O sistema renderiza cada certificado no canvas, aplica os estilos e gera o arquivo para download
9. O projeto pode ser salvo e reaberto posteriormente (máximo 3 projetos recentes)

### Arquitetura

O sistema segue uma arquitetura client-server com separação clara de responsabilidades:

- **Frontend (React + Vite)**: Responsável pela interface, renderização no canvas e geração de arquivos PDF/ZIP no client-side
- **Backend (Express)**: Expõe uma API REST, valida tokens de autenticação, gerencia uploads para o Supabase Storage e persiste dados no PostgreSQL
- **Infraestrutura**: Firebase para autenticação, Supabase para banco de dados e armazenamento de arquivos

## Como executar o projeto

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm
- Conta no Firebase (com projeto criado e Authentication habilitado)
- Conta no Supabase (com banco PostgreSQL e bucket de Storage)

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/web-imv.git
cd web-imv
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` na pasta `backend/` com as seguintes variáveis (ou copie o `.env.example`):

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_da_chave_de_servico_firebase
SUPABASE_URL=https://seu_projeto.supabase.co
SUPABASE_KEY=sua_chave_supabase
FRONTEND_URL=http://localhost:5173
PORT=3000
```

> **Nota:** A variável `FIREBASE_SERVICE_ACCOUNT_BASE64` deve conter o conteúdo do arquivo `serviceAccountKey.json` do Firebase convertido para Base64.

```bash
# Exemplo de como converter (Linux/Mac):
base64 -i serviceAccountKey.json

# Exemplo Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))
```

### 3. Configurar o Frontend

```bash
cd ../frontend
npm install
```

Crie o arquivo `.env` na pasta `frontend/` com as variáveis de ambiente (ou copie o `.env.example`):

```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000
```

> **Nota:** Essas variáveis Firebase são obtidas no console do Firebase em *Project Settings > General > Your apps*. Elas são públicas por natureza no client SDK, mas mantê-las em `.env` facilita a configuração entre ambientes.

### 4. Criar as tabelas no banco de dados

Execute os scripts SQL na pasta `backend/database/` na ordem numérica:

1. `001_create_users.sql`
2. `002_create_certificates.sql`
3. `003_create_projects.sql`

### 5. Iniciar o servidor

Em dois terminais separados:

```bash
# Terminal 1 — Backend
cd backend
npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:5173` e o backend em `http://localhost:3000`.

### 6. Executar os testes (backend)

```bash
cd backend
npm test          # execução única
npm run test:watch  # modo watch
```

## Scripts disponíveis

### Backend

| Script | Descrição |
|--------|-----------|
| `npm start` | Inicia o servidor de produção |
| `npm test` | Executa a suíte de testes (Vitest) |
| `npm run test:watch` | Executa testes em modo watch |

### Frontend

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o dev server (Vite) |
| `npm run build` | Gera build de produção |
| `npm run lint` | Verifica código com ESLint |
| `npm run preview` | Preview da build de produção |

## Principais aprendizados

- **Autenticação completa com Firebase**: implementação do fluxo de login no client com Bearer Token e validação no server com Firebase Admin SDK
- **API REST com Express**: construção de endpoints CRUD com validação de entrada, tratamento de erros e middlewares customizados
- **Canvas API**: renderização dinâmica de imagem + texto com posicionamento livre, detecção de colisão (hit testing) e drag-and-drop
- **Processamento de imagens no client-side**: geração de PDFs e imagens JPEG a partir do conteúdo do canvas
- **Upload de arquivos**: tratamento multipart com Multer, sanitização de nomes e upload para bucket na nuvem (Supabase Storage)
- **Geração de thumbnails**: compressão e redimensionamento de imagens com Sharp antes do upload
- **Banco de dados relacional**: modelagem com chaves estrangeiras, índices, serialização JSONB e limpeza automática de registros (FIFO)
- **Rollback manual em operações distribuídas**: remoção de arquivos do storage em caso de falha na persistência do banco
- **Arquitetura frontend/backend desacoplada**: comunicação via API REST com token de autenticação em todas as rotas
- **Segurança e boas práticas**: rate limiting, validação de entrada com Zod, headers HTTP com Helmet e variáveis de ambiente para configuração
- **Testes automatizados**: suite de testes com Vitest e Supertest cobrindo rotas e validação

## Melhorias futuras

**Alta prioridade**

- ~~Adicionar testes automatizados (unitários e de integração)~~ ✅
- ~~Implementar rate limiting nas rotas da API~~ ✅
- ~~Adicionar validação de entrada com biblioteca como Zod ou Joi~~ ✅
- Implementar paginação na listagem de certificados

**Média prioridade**

- Adicionar suporte a mais formatos de upload (SVG, PDF como modelo)
- Implementar sistema de permissões com múltiplos tipos de usuário (admin, usuário comum)
- Adicionar notificações de feedback (toast) em vez de alerts nativos do navegador
- Implementar busca e filtragem de certificados

**Baixa prioridade**

- Adicionar modo escuro na interface
- Implementar exportação para outros formatos (PNG de alta resolução)
- Criar dashboard com métricas de uso (quantidade de certificados gerados)
- Adicionar suporte a idiomas (internacionalização)

---

**Autor**

Eduardo — Desenvolvedor Full Stack

