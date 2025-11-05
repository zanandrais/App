async function fetchData() {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error('Falha ao buscar dados');
  const json = await res.json();
  return json.data;
}

function populateTable(data) {
  const tbody = document.querySelector('#data-table tbody');
  tbody.innerHTML = '';
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.category}</td><td>${row.value}</td>`;
    tbody.appendChild(tr);
  });
}

function renderChart(data) {
  const ctx = document.getElementById('chart');
  const labels = data.map((d) => d.category);
  const values = data.map((d) => d.value);
  if (window._chart) window._chart.destroy();
  window._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Valor',
          data: values,
          backgroundColor: 'rgba(37, 99, 235, 0.5)',
          borderColor: 'rgb(37, 99, 235)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

async function init() {
  try {
    const data = await fetchData();
    populateTable(data);
    renderChart(data);
  } catch (err) {
    console.error(err);
    const container = document.querySelector('.container');
    container.innerHTML = `<p>Erro: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', init);

