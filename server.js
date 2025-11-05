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
const SHEET_CATEGORY_COLUMN = process.env.SHEET_CATEGORY_COLUMN || null; // nome do cabeçalho ou índice (1-based)
const SHEET_VALUE_COLUMN = process.env.SHEET_VALUE_COLUMN || null; // nome do cabeçalho ou índice (1-based)

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

    const headers = records.length ? Object.keys(records[0]) : [];

    // Utilitário para pegar coluna por nome (case-insensitive) ou índice 1-based
    const getColumnKey = (hint) => {
      if (!hint) return null;
      const idx = Number(hint);
      if (Number.isInteger(idx) && idx >= 1 && idx <= headers.length) return headers[idx - 1];
      const lower = String(hint).toLowerCase();
      return headers.find((h) => h.toLowerCase() === lower) || null;
    };

    // Parse numérico robusto, ignorando datas/horas
    const isTime = (s) => /^(\d{1,2}:\d{2})(:\d{2})?$/.test(s);
    const isDateLike = (s) => /\d\/\d|\d-\d/.test(s);
    const toNumber = (s) => {
      if (s == null) return NaN;
      const str = String(s).trim();
      if (!str || isTime(str) || isDateLike(str)) return NaN;
      const cleaned = str.replace(/\s/g, '').replace(/%/g, '').replace(/\./g, '').replace(',', '.');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : NaN;
    };

    // 1) Overrides por env
    let catKey = getColumnKey(SHEET_CATEGORY_COLUMN);
    let valKey = getColumnKey(SHEET_VALUE_COLUMN);

    // 2) Heurística se não houver override
    if (!catKey || (!valKey && headers.length > 1)) {
      // Avalia colunas por predominância numérica
      const stats = headers.map((h) => {
        let numeric = 0; let total = 0;
        for (const r of records) {
          if (r[h] !== undefined && String(r[h]).trim() !== '') {
            total++;
            if (Number.isFinite(toNumber(r[h]))) numeric++;
          }
        }
        return { header: h, numeric, total };
      });

      // Categoria: primeira coluna majoritariamente não numérica
      if (!catKey) {
        const nonNumericFirst = stats.find((s) => s.total > 0 && s.numeric / Math.max(1, s.total) < 0.5);
        catKey = nonNumericFirst ? nonNumericFirst.header : headers[0];
      }

      // Valor: coluna mais numérica
      if (!valKey && headers.length > 1) {
        const numericBest = stats
          .filter((s) => s.header !== catKey)
          .sort((a, b) => b.numeric - a.numeric)[0];
        if (numericBest && numericBest.numeric > 0) valKey = numericBest.header;
      }
    }

    let output;
    if (valKey) {
      // Mapear categoria/valor diretamente
      output = records.map((row) => ({
        category: String(row[catKey]),
        value: Number.isFinite(toNumber(row[valKey])) ? toNumber(row[valKey]) : 0,
      }));
    } else {
      // Sem coluna numérica: agregamos contagem por categoria
      const counts = new Map();
      for (const r of records) {
        const k = String(r[catKey] ?? '').trim();
        if (!k) continue;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      output = Array.from(counts.entries()).map(([k, v]) => ({ category: k, value: v }));
    }

    cache = { data: output, at: now };
    return output;
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
