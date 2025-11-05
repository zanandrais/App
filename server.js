import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Exemplo de dados tabulares (poderia vir de BD)
const data = [
  { category: 'A', value: 12 },
  { category: 'B', value: 19 },
  { category: 'C', value: 3 },
  { category: 'D', value: 5 },
  { category: 'E', value: 2 },
  { category: 'F', value: 3 }
];

// API que expõe os dados para a UI
app.get('/api/data', (req, res) => {
  res.json({ data });
});

// Healthcheck simples
app.get('/healthz', (req, res) => res.send('ok'));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});

