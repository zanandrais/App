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

No arquivo `server.js`, altere o array `data` conforme necessário (buscar de banco, arquivo, etc.). A UI se atualiza automaticamente a partir da API.

## Licença

Uso livre para fins de exemplo.
