# Flex Table + Chart Service

Aplicação Node.js com Express que expõe uma API (`/api/data`) e uma interface web (Flexbox + HTML/CSS) que renderiza uma tabela e um gráfico de barras (Chart.js) com os mesmos dados. Preparada para deploy no Render.com.

## Requisitos

- Node.js 18+ (ou compatível com o Render)

## Rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
3. Abra no navegador: `http://localhost:3000`

- API: `http://localhost:3000/api/data`
- Healthcheck: `http://localhost:3000/healthz`

## Estrutura

- `server.js`: Servidor Express (API + estáticos)
- `public/index.html`: UI com Flexbox
- `public/styles.css`: Estilos (layout e tabela)
- `public/app.js`: Lógica para buscar dados e renderizar tabela + gráfico
- `render.yaml`: Configuração para Render.com
- `package.json`: Scripts e dependências

## Deploy no Render.com

Opção 1: Usar `render.yaml`
- Crie um novo repositório Git com estes arquivos
- Faça push para GitHub/GitLab
- No Render, escolha "New +" → "Blueprint" → aponte para o repositório
- O Render lerá `render.yaml` e criará o serviço web automaticamente

Opção 2: Criar manualmente
- Crie "New +" → "Web Service"
- Conecte ao repositório
- Defina:
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Environment: `Node`

## Personalizar dados

### Usando Google Sheets como fonte

Você pode apontar a API para uma planilha do Google (CSV) sem autenticação, desde que esteja pública ou "Publicada na Web".

Opção A — URL CSV direto
- No Google Sheets: Arquivo → Compartilhar → Publicar na Web → selecione a aba desejada e formato CSV.
- Copie a URL gerada e defina como `SHEET_CSV_URL`.

Opção B — Via ID e GID
- Obtenha o `SHEET_ID` da URL do Google Sheets (`/spreadsheets/d/{SHEET_ID}/edit`).
- Obtenha o `gid` da aba (aparece como `gid=123456789` na URL).
- Defina `SHEET_ID` e `SHEET_GID` que o app monta a URL `export?format=csv` automaticamente.

Cache
- `CACHE_TTL_SECONDS` controla o cache em memória (padrão 60s).

Formatação esperada
- A API tenta mapear colunas por nomes comuns: `Categoria`/`Categoria` ou `Category` para a categoria, e `Valor`/`Value` para o valor. Caso diferente, usa as duas primeiras colunas.

Sem Google Sheets
- Se nenhuma variável for definida, a API usa um conjunto de dados de exemplo embutido.

## Licença

Uso livre para fins de exemplo.
