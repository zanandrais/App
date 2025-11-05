async function init() {
  try {
    const res = await fetch('/api/sheet-range?start=C7&end=D11');
    if (!res.ok) throw new Error('Falha ao buscar intervalo do Sheets');
    const json = await res.json();
    const { headers = [], rows = [] } = json;

    // Cabeçalho
    const head = document.getElementById('range-head');
    head.innerHTML = '';
    headers.forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      head.appendChild(th);
    });

    // Corpo
    const body = document.getElementById('range-body');
    body.innerHTML = '';
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      r.forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = cell ?? '';
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    const container = document.querySelector('.container');
    container.innerHTML = `<p>Erro: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
