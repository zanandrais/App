async function init() {
  try {
    const res = await fetch('/api/sheet-range?start=C7&end=D11');
    if (!res.ok) throw new Error('Falha ao buscar intervalo do Sheets');
    const json = await res.json();
    const { rows = [] } = json;

    // Cabeçalho
    const head = document.getElementById('range-head');
    head.innerHTML = '';
    ['Série', 'DPC'].forEach((label) => {
      const th = document.createElement('th');
      th.textContent = label;
      head.appendChild(th);
    });

    // Corpo
    const body = document.getElementById('range-body');
    body.innerHTML = '';
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const c1 = r[0] ?? '';
      const c2 = r[1] ?? '';
      const td1 = document.createElement('td');
      const td2 = document.createElement('td');
      td1.textContent = String(c1).trim();
      td2.textContent = String(c2).trim();
      tr.appendChild(td1);
      tr.appendChild(td2);
      body.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    const container = document.querySelector('.container');
    container.innerHTML = `<p>Erro: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
