/*
 * DASHBOARD.JS — uses /api/dashboard-stats (tiny payload)
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ------------ CONFIG ------------ */
  const config = {
    apiUrl: 'http://192.168.6.93:5001/api/dashboard-stats',
    refreshInterval: 120_000  // 2‑minute refresh
  };

  /* ------------ HELPERS (same as before) ------------ */
  const utils = {
    getElement: sel => document.querySelector(sel),
    getChart: id => Chart.getChart(id),
    pct: (v, t) => (t > 0 ? (v / t * 100).toFixed(1) : 0)
  };

  /* ------------ CHART HANDLERS (unchanged code from earlier) ------------ */
  const charts = {
    initPie(fake, real) {
      const ctx = document.getElementById('fakeRealPieChart').getContext('2d');
      return new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Fake', 'Real'],
          datasets: [{ data: [fake, real], backgroundColor: ['#d32f2f', '#558b2f'] }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    },
    updatePie(chart, fake, real) {
      chart.data.datasets[0].data = [fake, real];
      chart.update();
    },
    initDaily(labels, fakeArr, realArr) {
      const ctx = document.getElementById('dailyStatsChart').getContext('2d');
      return new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Real', data: realArr, borderColor: '#558b2f', backgroundColor: 'rgba(85,139,47,.2)', fill: true },
            { label: 'Fake', data: fakeArr, borderColor: '#d32f2f', backgroundColor: 'rgba(211,47,47,.2)', fill: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    },
    updateDaily(chart, labels, fakeArr, realArr) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = realArr;
      chart.data.datasets[1].data = fakeArr;
      chart.update();
    }
  };

  /* ------------ UI RENDERERS (unchanged from earlier) ------------ */
  const ui = {
    counters(data) {
      utils.getElement('.transaction-count').textContent = data.total.toLocaleString();

      utils.getElement('.fake-value').textContent = data.today.fake;
      utils.getElement('.real-value').textContent = data.today.real;

      const todayTotal = data.today.fake + data.today.real;
      utils.getElement('.total-processed strong').textContent = todayTotal;

      utils.getElement('.fake-badge').textContent = `${utils.pct(data.today.fake, todayTotal)}%`;
      utils.getElement('.real-badge').textContent = `${utils.pct(data.today.real, todayTotal)}%`;

      utils.getElement('.fake-stat').innerHTML = `<span class="pie-dot fake-dot"></span> Fake : ${data.overall.fake.toLocaleString()} (${utils.pct(data.overall.fake, data.total)}%)`;
      utils.getElement('.real-stat').innerHTML = `<span class="pie-dot real-dot"></span> Real : ${data.overall.real.toLocaleString()} (${utils.pct(data.overall.real, data.total)}%)`;
    },

    recent(list) {
      const wrap = document.getElementById('recent-detections-list');
      wrap.innerHTML = '';
      if (!list.length) { wrap.innerHTML = '<div class="no-data">No recent fake detections</div>'; return; }

      list.forEach((det, i) => {
        const ts = new Date(det.timestamp);
        const el = document.createElement('div');
        el.className = 'detection-item';
        el.innerHTML = `
          <div class="detection-info">
            <div class="detection-id">${det.employee_id}</div>
            <div class="detection-meta">${ts.toLocaleTimeString()} | ${det.company_code}</div>
            <div class="fake-percentage">Fake: ${det.confidence}%</div>
          </div>`;
        wrap.appendChild(el);
        if (i < list.length - 1) wrap.appendChild(Object.assign(document.createElement('div'), { className: 'detection-separator' }));
      });
    },

    top(list, sel, type) {
      const wrap = utils.getElement(sel);
      wrap.innerHTML = '';
      if (!list.length) { wrap.innerHTML = `<div class="no-data">No ${type} data</div>`; return; }
      const max = list[0].cnt;
      list.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `${type}-item`;
        div.innerHTML = `
          <div class="${type}-rank">${idx + 1}</div>
          <div class="${type}-info">
            <div class="${type}-code">${item.code || item.id}</div>
            <div class="${type}-name">${item.name}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${item.cnt / max * 100}%"></div></div>
          </div>
          <div class="${type}-count">${item.cnt}</div>`;
        wrap.appendChild(div);
      });
    }
  };

  /* ------------ MAIN LOAD ------------ */
  let pieChart = charts.initPie(0, 0);
  let dailyChart = charts.initDaily(Array(7).fill(''), Array(7).fill(0), Array(7).fill(0));

  async function refresh() {
    try {
      const stats = await fetch(config.apiUrl).then(r => r.json());
      ui.counters(stats);
      ui.recent(stats.recentFake);
      ui.top(stats.topCompanies, '.companies-list', 'company');
      ui.top(stats.topEmployees, '.employees-list', 'employee');
      charts.updatePie(pieChart, stats.overall.fake, stats.overall.real);
      charts.updateDaily(dailyChart, stats.daily.labels, stats.daily.fake, stats.daily.real);
    } catch (err) {
      console.error('dashboard refresh failed', err);
    }
  }

  refresh();
  setInterval(refresh, config.refreshInterval);
});