# AGENTS.md

Documento de orientação para agentes de IA que forem trabalhar no repositório `web-imv`.
Baseado na análise do código atual. Em caso de divergência entre este documento e o código, considere o código como fonte da verdade e atualize este arquivo.

## Visão geral

Sistema web full stack para criação, customização e gerenciamento de certificados em lote.

Principais funcionalidades confirmadas no código:

- Login com e-mail e senha via Firebase Authentication.
- Sincronização do usuário autenticado com a tabela `users` do PostgreSQL.
- Upload de modelos de certificado em PNG/JPEG.
- Geração automática de thumbnail WebP (largura de 300 px) com Sharp.
- Armazenamento das imagens no Supabase Storage, bucket `certificates`.
- Dashboard com modelos do usuário e até 3 projetos editados recentemente.
- Editor visual em Canvas com arraste dos campos de nome e corpo do certificado.
- Lista de nomes em lote (um nome por linha).
- Texto global do certificado e texto individual por participante.
- Ajuste de fonte, cor e tamanho para nome e corpo.
- Exportação em PDF único, PDFs individuais em ZIP e imagens JPEG em ZIP.
- Salvamento e atualização de projetos no banco.
- Exclusão de modelos de certificado, incluindo os arquivos do Supabase Storage.

## Tecnologias

### Frontend (`frontend/`)

- React 19 com hooks.
- Vite 7 como bundler e dev server.
- React Router DOM 7 (`BrowserRouter`, `Routes`, `Route`, `Navigate`).
- Canvas API para pré-visualização e renderização dos certificados.
- jsPDF para geração de PDFs no cliente.
- JSZip para compactação dos arquivos.
- file-saver para download dos arquivos gerados.
- react-select para seleção de fontes.
- react-icons e SVGs inline para ícones.
- CSS puro, sem Tailwind, CSS Modules ou biblioteca de componentes.
- Firebase Web SDK para autenticação.

### Backend (`backend/`)

- Node.js com ES Modules (`"type": "module"`).
- Express 5.
- PostgreSQL via `pg` com pool de conexões.
- Supabase (`@supabase/supabase-js`) para Storage.
- Firebase Admin SDK para validar tokens Bearer.
- Multer com `memoryStorage` para upload multipart.
- Sharp para thumbnails.
- Zod para validação de entrada.
- Helmet para headers de segurança.
- express-rate-limit para rate limiting.
- dotenv para variáveis de ambiente.
- Vitest + Supertest para testes.

### Serviços externos

- Firebase Authentication: login no frontend e validação de token no backend.
- Supabase: banco PostgreSQL e bucket de Storage `certificates`.

## Arquitetura

Separação cliente-servidor:

- **Frontend**: SPA React responsável pela interface, estado do editor, renderização em Canvas e geração de arquivos no navegador. Não gera PDF/ZIP no backend.
- **Backend**: API REST Express organizada em rotas, controllers, services e repositories. Valida o token Firebase, valida payloads com Zod, acessa PostgreSQL com SQL parametrizado, processa thumbnails com Sharp e gerencia arquivos no Supabase Storage. `server.js` é apenas o bootstrap HTTP; `src/app.js` monta a aplicação.
- **Banco**: PostgreSQL hospedado no Supabase, acessado pelo backend via `DATABASE_URL`.
- **Storage**: Supabase Storage, bucket público `certificates`, com imagem original e thumbnail.
- **Autenticação**: o frontend obtém o ID token via Firebase e envia `Authorization: Bearer <token>`; o middleware do backend valida com Firebase Admin.

O frontend nunca acessa o banco diretamente. Toda persistência passa pela API.

## Estrutura de pastas

```
web-imv/
├── AGENTS.md
├── README.md
├── backend/
│   ├── database/            # Scripts SQL de criação das tabelas
│   ├── middleware/          # auth.js, errorHandler.js, rateLimiter.js, upload.js, validate.js
│   ├── src/
│   │   ├── config/          # database.js, firebase.js, supabase.js
│   │   ├── controllers/     # users, certificates, projects
│   │   ├── repositories/    # users, certificates, projects
│   │   ├── routes/          # health, users, certificates, projects
│   │   ├── schemas/         # common, users, certificates, projects
│   │   ├── services/        # users, certificates, certificate-storage, projects
│   │   └── app.js           # Composição do Express e montagem dos routers
│   ├── tests/               # Testes Vitest/Supertest e setup de mocks
│   ├── uploads/             # Diretório local legado (ignorado pelo Git; uploads reais vão para o Supabase)
│   ├── db.js                # Shim de compatibilidade para src/config/database.js
│   ├── firebaseAdmin.js     # Shim de compatibilidade para src/config/firebase.js
│   ├── server.js            # Bootstrap HTTP (listen fora de NODE_ENV=test)
│   ├── vitest.config.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/              # Arquivos estáticos (inclui imagens de exemplo)
    ├── src/
    │   ├── components/
    │   │   ├── Header/      # Header.jsx + Header.css
    │   │   └── Login/       # Login.jsx + Login.css
    │   ├── Pages/
    │   │   ├── Home.jsx     # Dashboard de modelos e projetos recentes
    │   │   ├── Home.css
    │   │   └── Editor/
    │   │       ├── EditorPage.jsx
    │   │       ├── Editor.css
    │   │       ├── components/ # Canvas, sidebar, painéis, menu de download
    │   │       ├── constants/  # Fontes, textos padrão, estilos do react-select
    │   │       ├── hooks/      # Estado, dados, interação, exportação, salvamento
    │   │       ├── services/   # Geração de PDF/ZIP
    │   │       ├── styles/     # CSS do editor, agregado por Editor.css
    │   │       └── utils/      # Canvas, geometria, nomes
    │   ├── services/        # api.js, firebase.js, certificatesApi.js, projectsApi.js, usersApi.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── App.css
    │   └── index.css
    ├── index.html           # Inclui Google Fonts usadas pelo editor
    ├── eslint.config.js
    ├── vite.config.js
    ├── vercel.json
    ├── .env.example
    └── package.json
```

## Rotas do frontend

Definidas em `frontend/src/App.jsx`:

- `/` → `Home`, quando há usuário autenticado.
- `/editor/:id` → `EditorPage` para editar um modelo de certificado.
- `/project/:id` → `EditorPage` para abrir um projeto salvo.
- `*` → redireciona para `/`.
- Sem usuário autenticado, o componente `Login` é renderizado no lugar das rotas. Não existe rota `/login` registrada.

## API do backend

As rotas são registradas em módulos de `backend/src/routes/` e montadas em `backend/src/app.js`.

Públicas:

- `GET /` → texto `Backend funcionando`.
- `GET /test-db` → executa `SELECT NOW()` e retorna o resultado.
- `GET /ping` → `{ ok: true }`.

Protegidas por `authMiddleware`:

- `POST /users` → cria ou retorna usuário pelo `firebase_uid`. Body: `{ name }`; e-mail e UID vêm do token.
- `POST /certificates` → upload multipart (campo `file`) + campo `name`. Limite de 5 MB, apenas `image/png`, `image/jpeg` e `image/jpg`. Gera thumbnail WebP e envia ambos ao Supabase. Rate limit de upload.
- `GET /certificates` → lista modelos do usuário em ordem decrescente de ID.
- `GET /certificates/:id` → retorna modelo do usuário.
- `DELETE /certificates/:id` → remove arquivos do Storage e o registro do banco.
- `POST /projects` → cria projeto. Mantém no máximo 3 projetos por usuário, removendo os mais antigos por `updated_at`.
- `GET /projects` → lista até 3 projetos recentes com `title` e `thumbnail_path` do certificado.
- `GET /projects/:id` → retorna projeto do usuário com dados do certificado.
- `PUT /projects/:id` → atualiza dados do projeto e `updated_at`.

Observações:

- Não existe rota para deletar projetos.
- Os IDs são validados como inteiros positivos por `idParamSchema`.
- Todas as consultas usam parâmetros (`$1`, `$2`, ...). Preserve esse padrão.
- Erros são tratados por `backend/middleware/errorHandler.js`, montado no final de `src/app.js`.
- `NODE_ENV=test` impede o `app.listen`; os testes importam `app` diretamente.

## Fluxos principais

### Login e sincronização

1. `Login.jsx` chama `signInWithEmailAndPassword` do Firebase.
2. `App.jsx` observa `onAuthStateChanged` e chama `syncUser(currentUser)`.
3. `usersApi.js` obtém o ID token e faz `POST /users`.
4. O backend valida o token, extrai `email` e `uid` e insere/retorna o usuário.
5. As rotas do frontend passam a ser renderizadas.

### Upload e armazenamento de modelos

1. `Home.jsx` dispara o input de arquivo e chama `uploadCertificate`.
2. `certificatesApi.js` monta `FormData` com `file` e `name`.
3. Backend valida o nome, localiza o usuário por e-mail, gera nome seguro e thumbnail WebP.
4. Original e thumbnail são enviados ao bucket `certificates` do Supabase.
5. URLs públicas são obtidas e o registro é inserido em `certificates`.
6. Em caso de falha no banco, os arquivos enviados são removidos como rollback.

### Editor de certificados

1. `useCertificateData` carrega um certificado (`/editor/:id`) ou projeto (`/project/:id`) usando o token atual.
2. `useEditorModel` mantém nomes, texto global, estilos, posições, índices e overrides.
3. `CertificatePreviewList` renderiza até 20 canvases (`MAX_PREVIEW_ITEMS`).
4. `useCanvasInteraction` faz hit testing, arraste e alinhamento magnético ao centro.
5. `CertificateCanvas` desenha imagem, textos, caixas de seleção e linha-guia central.
6. `StylePanel` e `TextInputsPanel` alteram o modelo. A edição individual disponível na interface é do texto do corpo; o modelo também possui estrutura de `overrides`.

### Exportação

1. `useCertificateExport` valida se há nomes e texto global.
2. A imagem do certificado é pré-carregada com `crossOrigin = "anonymous"`.
3. `certificateExport.js` carrega as fontes com `document.fonts.load`.
4. Cada certificado é renderizado em um canvas temporário por `renderCertificateForExport`.
5. O resultado é salvo com jsPDF/JSZip/file-saver:
   - PDF único `todos-os-certificados.pdf`.
   - ZIP de PDFs `certificados-pdf-separados.zip`.
   - ZIP de JPEGs `certificados-individuais.zip`.
6. O progresso é controlado em `useCertificateExport` e exibido em `EditorPage`.

### Salvamento de projetos

1. `useSaveProject` exige usuário, certificado e ao menos um nome válido.
2. `useEditorModel.buildProjectPayload` monta `nomesLista`, `textoCorpo`, `estilos`, `posicoes` e `certificadoId`.
3. Se já houver `projectId`, usa `PUT /projects/:id`; caso contrário, `POST /projects`.
4. O ID retornado é armazenado para atualizações posteriores.

## Frontend: organização e convenções

- Componentes em PascalCase; hooks com prefixo `use`; utilitários em camelCase.
- Páginas ficam em `src/Pages/`; componentes reutilizáveis em `src/components/`; partes específicas do editor em `src/Pages/Editor/`.
- CSS fica ao lado do componente (`Header.css`, `Login.css`, `Home.css`) ou em `Editor/styles/`, agregado por `Editor.css` via `@import`.
- Não há CSS Modules, Tailwind, Redux, Zustand ou Context API. O estado é local com `useState`, `useMemo`, `useCallback` e `useRef`, passado por props.
- Toda chamada HTTP deve passar por `src/services/api.js` e por um serviço específico (`certificatesApi.js`, `projectsApi.js`, `usersApi.js`).
- O token é obtido com `user.getIdToken()` ou `auth.currentUser?.getIdToken()` e repassado explicitamente aos serviços.
- `apiRequest` trata `FormData` sem definir `Content-Type` manualmente; `apiJson` lança erro quando a resposta não é `ok`.
- Novos textos de interface estão em português do Brasil. O código mistura nomes em português e inglês; preserve o padrão do arquivo em edição.
- Fontes disponíveis estão em `Pages/Editor/constants/editor.js` e devem existir também no link do Google Fonts em `index.html`.
- A exportação depende de `crossOrigin = "anonymous"` na imagem; o bucket do Supabase precisa permitir CORS para o domínio do frontend.

## Backend: organização e convenções

- ES Modules em todo o projeto. Use `import`/`export`.
- `server.js` é apenas bootstrap: importa `src/app.js`, inicia `app.listen` fora de `NODE_ENV=test` e exporta o app.
- `src/app.js` é o composition root: middlewares globais, montagem dos routers e registro do error handler.
- Cada recurso segue o fluxo `routes/` → `controllers/` → `services/` → `repositories/`.
- Schemas Zod ficam em `src/schemas/`. O helper `validate` permanece em `middleware/validate.js`, que também reexporta os schemas existentes para compatibilidade.
- Conexões e clients externos ficam em `src/config/`. `db.js` e `firebaseAdmin.js` são shims de compatibilidade usados por imports legados e mocks de teste.
- Middlewares compartilhados ficam em `middleware/`: `auth.js`, `errorHandler.js`, `rateLimiter.js`, `upload.js` e `validate.js`.
- Toda rota protegida usa `authMiddleware` e busca o usuário pelo e-mail do token.
- Use SQL parametrizado. Não interpole valores de usuário em queries.
- Uploads usam Multer em memória (`middleware/upload.js`) e Sharp; não grave arquivos locais em `backend/uploads/`.
- O bucket usado é sempre `certificates`.
- Respostas de erro devem seguir o padrão `{ error: "mensagem em português" }`.
- Adicione logs de erro com `console.error` seguindo o padrão `[ERROR] MÉTODO /rota:`.
- Testes backend ficam em `backend/tests/` e usam mocks de `db.js`, `firebaseAdmin.js`, `@supabase/supabase-js` e `sharp` definidos em `tests/setup.js` e no próprio teste.

## Banco de dados

Scripts em `backend/database/`, executados na ordem numérica:

- `001_create_users.sql`: `users` com `id`, `name`, `email` único, `firebase_uid` único e `created_at`.
- `002_create_certificates.sql`: `certificates` com `id`, `title`, `image_path`, `user_id` (FK para `users`, `ON DELETE CASCADE`) e `created_at`.
- `003_create_projects.sql`: `projects` com `id`, `user_id`, `certificate_id` (ambas FKs com `ON DELETE CASCADE`), `nomes_lista` JSONB, `texto_corpo`, colunas de estilo do nome e do corpo, `created_at` e `updated_at`. Cria índices em `projects.user_id`, `projects.certificate_id` e `certificates.user_id`.

Relacionamentos:

- Um usuário possui muitos certificados.
- Um usuário possui muitos projetos.
- Um projeto pertence a um certificado.
- Excluir usuário ou certificado remove projetos em cascata.

Importante: os scripts SQL atuais estão desatualizados em relação ao código do backend. Veja "Problemas conhecidos".

## Comandos úteis

Execute a partir da raiz do repositório, usando `workdir` ou entrando na pasta indicada.

### Backend

```bash
cd backend
npm install
npm start          # inicia a API (PORT padrão 3000)
npm test           # Vitest, execução única
npm run test:watch # Vitest em modo watch
```

Não há scripts de lint ou build no backend.

### Frontend

```bash
cd frontend
npm install
npm run dev      # Vite em http://localhost:5173
npm run build    # build de produção em dist/
npm run lint     # ESLint
npm run preview  # preview da build
```

Não há script de testes no frontend.

### Banco

Execute os arquivos de `backend/database/` na ordem em um banco PostgreSQL/Supabase, pelo SQL Editor do Supabase ou via `psql`.

## Configuração e deploy

### Variáveis de ambiente

Use os arquivos `.env.example` como referência. Nunca copie valores reais para este documento ou para o código.

Backend (`backend/.env`):

- `DATABASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_BASE64` (JSON da service account em Base64)
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `FRONTEND_URL` (aceita lista separada por vírgula para CORS)
- `PORT`

Frontend (`frontend/.env`):

- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

`backend/src/config/firebase.js` interrompe a inicialização se `FIREBASE_SERVICE_ACCOUNT_BASE64` não existir. Ele também corrige `\n` literais na `private_key`, necessário em alguns provedores de hospedagem. `backend/firebaseAdmin.js` apenas reexporta essa configuração para compatibilidade.

### Deploy identificado

- Frontend: `frontend/vercel.json` reescreve todas as rotas para `/index.html`, configurando SPA na Vercel.
- Backend: não há `Dockerfile`, `render.yaml` ou outro arquivo de deploy no repositório. Comentários no código citam Render/Supabase, mas isso não é uma configuração versionada. O servidor escuta em `0.0.0.0` na porta `PORT` (padrão 3000).
- Build do frontend: `npm run build` gera `frontend/dist/`, que é ignorado pelo Git.

## Convenções de código

- Preserve a organização atual por responsabilidade: componentes visuais, hooks de estado/comportamento, serviços de API/exportação, utilitários puros e constantes.
- Componentes novos devem ser pequenos e receber dados por props; evite acoplar componentes visuais diretamente a `fetch`.
- Reutilize `apiRequest`/`apiJson` em vez de criar `fetch` avulso.
- Reutilize `getTextBoxSize`, `drawWrappedText`, `getBoxRect`, `isInsideRect` e os helpers de `utils/names.js` antes de duplicar lógica de canvas ou nomes.
- Mantenha as posições e estilos no formato esperado pela API (`estilos`, `posicoes`, `nomesLista`).
- Não renomeie colunas, campos de payload ou rotas sem atualizar frontend, backend, validação, testes e migrations em conjunto.
- Siga o estilo existente de aspas, ponto e vírgula e indentação de cada arquivo.
- Não adicione comentários novos sem necessidade; o código atual usa comentários de bloco em alguns arquivos, mas não é obrigatório.
- Não instale dependências sem justificar a necessidade e verificar se já existe alternativa no projeto.

## Padrão de redesign visual (Web IMV)

Aplicado em Home e Editor com glassmorphism sóbrio mantendo a identidade da Home/Login.

### Direção geral
- Fundo com imagem + overlay neutro escuro.
- Superfícies translúcidas: `rgba(255,255,255,0.04 ~ 0.12)` com `backdrop-filter: blur(12px ~ 18px)`.
- Bordas finas: `1px solid rgba(255,255,255,0.10 ~ 0.18)`.
- Sem excesso de gradientes, glow neon ou tons azuis arroxeados pesados.

### Home
- Header fixo em vidro compacto.
- Cards de modelos com `aspect-ratio: 1.414/1`, padding `8px`, imagem `object-fit: contain`.
- Seção "Editados recentemente" no mesmo padrão glass.
- Modal com ações flutuantes discretas.

### Editor (Canvas-Centric + Inspector)
- Canvas em destaque com sombra projetada limpa.
- Header unificado: nome do projeto à esquerda, ações `Salvar Projeto` / `Exportar` (dropdown) e navegação à direita.
- Sidebar "Inspector" com abas `Conteúdo | Tipografia | Aparência` (mostra apenas o necessário).
- Campos com fundo `rgba(0,0,0,0.30)`, foco com borda/brilho branco/prata discreto.
- Dropdowns (react-select) via portal para `document.body` com `z-index` alto.
- Botão "Editar texto individual" no fluxo abaixo do canvas.
- Exportação/salvar movidos para o header quando aplicável.

## Regras para futuras refatorações

- Preserve todas as funcionalidades existentes.
- Entenda o código e suas dependências antes de modificar.
- Evite reescrever arquivos ou funcionalidades inteiras sem necessidade.
- Use aproximadamente 200 linhas como referência para avaliar a complexidade de um arquivo, sem tratar esse número como limite obrigatório.
- Divida arquivos grandes em componentes, hooks, serviços e utilitários quando isso melhorar a organização real.
- Não crie arquivos desnecessários apenas para reduzir a contagem de linhas.
- Centralize funcionalidades compartilhadas quando isso reduzir duplicação.
- Faça refatorações pequenas e incrementais, mantendo o projeto funcional entre etapas.
- Quando a tarefa for apenas refatoração estrutural, não altere comportamento visual ou funcional sem autorização.
- Execute as verificações disponíveis após alterações (`npm run lint`, `npm run build`, `npm test`) e informe os resultados.
- Se a tarefa estiver limitada ao frontend, não modifique backend, banco, migrations ou configurações externas.
- Não instale dependências sem justificar.
- Nunca exponha credenciais, tokens, chaves privadas ou dados sensíveis em documentação, logs ou commits.
- Ao alterar payloads ou contratos da API, atualize os dois lados e os testes.
- Ao alterar migrations, crie um novo script incremental em vez de editar um script já aplicado, salvo se o projeto ainda não tiver sido implantado e isso for explicitamente autorizado.

## Git

- Verifique a branch atual e o estado do repositório com `git status` antes de começar.
- Preserve alterações locais existentes. Não descarte trabalho de terceiros.
- Não execute `reset --hard`, `clean`, `rebase`, `merge`, `checkout` ou outros comandos que possam descartar alterações ou alterar o histórico sem autorização explícita.
- Não execute `commit`, `push` ou `pull` sem solicitação explícita.
- Não presuma que `main` e `dev` estão sincronizadas; verifique quando isso for relevante.
- Evite alterações na branch `main` sem autorização.
- O repositório possui branches locais `dev`, `main` e `master`, e remotos `origin` e `portfolio`. Confirme o estado atual antes de qualquer operação.
- Não registre estados temporários do Git (branch atual, commits pendentes, arquivos não rastreados) como se fossem permanentes.

## Problemas conhecidos (confirmados no código)

1. **Migrations desatualizadas em relação ao backend.**
   - `backend/database/002_create_certificates.sql` não cria `thumbnail_path`, mas `backend/src/repositories/certificates.repository.js` insere e consulta essa coluna.
   - `backend/database/003_create_projects.sql` não cria `posicao_nome` nem `posicao_corpo`, mas `backend/src/repositories/projects.repository.js` insere e atualiza essas colunas.
   - Um banco criado apenas pelos scripts atuais tende a falhar nas operações de certificados e projetos. Corrija com um novo script incremental quando autorizado.

2. **`frontend/README.md` contém marcadores de conflito de merge** (`<<<<<<<`, `=======`, `>>>>>>>`) e conteúdo duplicado.

3. **`authLimiter` está definido, mas não é usado** em `backend/middleware/rateLimiter.js` nem em nenhuma rota.

4. **Rota `/login` inexistente.** `useCertificateData.js` chama `navigate("/login")`, mas `App.jsx` não registra essa rota. Sem usuário, o `Login` é renderizado fora do roteador.

5. **Edição individual de estilos limitada.** `StylePanel.jsx` usa os setters globais (`setCorNome`, `setFonteNome`, etc.), portanto cores/fontes/tamanhos alterados ali afetam o modelo global. O suporte a `overrides` existe no modelo e é usado para `textoCorpo`, mas não para os estilos no fluxo atual da interface.

6. **`backend/uploads/` é legado.** Há arquivos locais nesse diretório, mas o código atual faz upload apenas no Supabase Storage. O diretório é ignorado pelo `.gitignore`.

7. **Cobertura de verificações incompleta.** Não há lint/build no backend nem testes automatizados no frontend.

## Possíveis melhorias (não são bugs confirmados)

- Dividir `frontend/src/Pages/Home.jsx` (323 linhas) e `CertificateCanvas.jsx` (~239 linhas).
- Substituir `alert`/`console.log` por feedback visual e logging consistente.
- Adicionar paginação e busca na listagem de certificados.
- Adicionar endpoint e interface para excluir projetos.
- Criar testes de componentes/hooks no frontend.
- Adicionar script de lint no backend.
- Revisar a estratégia de rate limiting para o fluxo de autenticação, que ocorre no cliente Firebase.
