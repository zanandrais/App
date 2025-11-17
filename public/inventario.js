const headEl = document.getElementById('inventario-head');
const bodyEl = document.getElementById('inventario-body');
const emptyState = document.getElementById('empty-state');
const statusPill = document.getElementById('status-pill');
const syncLabel = document.getElementById('last-sync');

function setStatus(message, state) {
  statusPill.textContent = message;
  statusPill.dataset.state = state;
}

function buildHeaders(rawHeaders, rows) {
  const headers = Array.isArray(rawHeaders) ? rawHeaders : [];
  if (headers.length) {
    return headers.map((value, idx) => {
      const label = String(value ?? '').trim();
      return label || `Coluna ${idx + 1}`;
    });
  }
  if (Array.isArray(rows) && rows.length) {
    return rows[0].map((_, idx) => `Coluna ${idx + 1}`);
  }
  return [];
}

function normalizeRows(rows, width) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const line = Array.isArray(row) ? row.slice(0, width || row.length) : [];
    while (width && line.length < width) {
      line.push('');
    }
    return line;
  });
}

function dropHeaderRow(rows, headers) {
  if (!rows.length || !headers.length) return rows;
  const first = rows[0] || [];
  const matches = headers.length === first.length && headers.every((label, idx) => {
    return String(first[idx] ?? '').trim() === String(label ?? '').trim();
  });
  return matches ? rows.slice(1) : rows;
}

function isNumericCell(value) {
  if (value == null) return false;
  const cleaned = String(value).trim().replace(/\s+/g, '');
  if (!cleaned) return false;
  const normalized = cleaned.replace(/\./g, '').replace(',', '.').replace(/%/g, '');
  return normalized !== '' && Number.isFinite(Number(normalized));
}

function renderTable(headers, rows) {
  headEl.innerHTML = '';
  bodyEl.innerHTML = '';

  headers.forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headEl.appendChild(th);
  });

  const filledRows = rows.filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));
  filledRows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const td = document.createElement('td');
      const text = String(cell ?? '').trim();
      if (isNumericCell(text)) td.classList.add('numeric');
      td.textContent = text || '—';
      tr.appendChild(td);
    });
    bodyEl.appendChild(tr);
  });

  return filledRows.length;
}

async function loadInventario() {
  setStatus('Sincronizando inventario...', 'loading');
  emptyState.hidden = true;
  try {
    const response = await fetch('/api/inventory-range');
    if (!response.ok) throw new Error('Resposta invalida do servidor');
    const payload = await response.json();
    const headers = buildHeaders(payload.headers, payload.rows);
    let rows = normalizeRows(payload.rows || [], headers.length || undefined);
    rows = dropHeaderRow(rows, headers);
    const rendered = renderTable(headers, rows);

    if (!rendered) {
      emptyState.hidden = false;
      emptyState.textContent = 'Nenhuma linha preenchida no intervalo D4:U30.';
    }

    syncLabel.textContent = new Date().toLocaleString('pt-BR');
    setStatus('Inventario atualizado', 'ready');
  } catch (err) {
    console.error(err);
    setStatus('Erro ao carregar inventario', 'error');
    emptyState.hidden = false;
    emptyState.textContent = `Nao foi possivel carregar o inventario: ${err.message}`;
    headEl.innerHTML = '';
    bodyEl.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', loadInventario);
