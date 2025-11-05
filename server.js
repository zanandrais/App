import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { parse as parseCsv } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Fonte de dados: Google Sheets via CSV (config por env)
// Use SHEET_CSV_URL diretamente OU SHEET_ID + SHEET_GID para montar a URL.
const SHEET_ID = process.env.SHEET_ID;
const SHEET_GID = process.env.SHEET_GID;
const SHEET_CSV_URL = process.env.SHEET_CSV_URL || (
  SHEET_ID && SHEET_GID
    ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&id=${SHEET_ID}&gid=${SHEET_GID}`
    : null
);

// Cache simples em memória para reduzir chamadas
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 60);
let cache = { data: null, at: 0 };

// Fallback local (caso variáveis não estejam setadas ou ocorra erro)
const fallbackData = [
  { category: 'A', value: 12 },
  { category: 'B', value: 19 },
  { category: 'C', value: 3 },
  { category: 'D', value: 5 },
  { category: 'E', value: 2 },
  { category: 'F', value: 3 }
];

async function fetchSheetData() {
  // Respeita cache
  const now = Date.now();
  if (cache.data && (now - cache.at) / 1000 < CACHE_TTL_SECONDS) {
    return cache.data;
  }

  if (!SHEET_CSV_URL) {
    cache = { data: fallbackData, at: now };
    return fallbackData;
  }

  try {
    const res = await fetch(SHEET_CSV_URL, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) throw new Error(`Falha ao buscar CSV: ${res.status}`);
    const csvText = await res.text();
    const records = parseCsv(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Tenta mapear colunas por nomes comuns (categoria/valor ou category/value)
    const normalized = records.map((row) => {
      const keys = Object.keys(row).reduce((acc, k) => {
        acc[k.toLowerCase()] = k;
        return acc;
      }, {});
      const catKey = keys['categoria'] || keys['category'] || keys['nome'] || Object.keys(row)[0];
      const valKey = keys['valor'] || keys['value'] || keys['quantidade'] || Object.keys(row)[1];
      const valueNum = Number(String(row[valKey]).replace(',', '.'));
      return { category: String(row[catKey]), value: Number.isFinite(valueNum) ? valueNum : 0 };
    });

    cache = { data: normalized, at: now };
    return normalized;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro buscando Google Sheets:', err.message);
    cache = { data: fallbackData, at: now };
    return fallbackData;
  }
}

// API que expõe os dados para a UI
app.get('/api/data', async (req, res) => {
  const data = await fetchSheetData();
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
