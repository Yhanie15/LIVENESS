/*
 * DASHBOARD.JS — uses /api/dashboard-stats (tiny payload)
 */
 
document.addEventListener('DOMContentLoaded', () => {
  /* ------------ CONFIG ------------ */
  const config = {
    apiUrl: 'http://192.168.100.152:5001/api/dashboard-stats',
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
          datasets: [{
            data: [fake, real],
            backgroundColor: ['#d32f2f', '#558b2f']
          }]
        },
        options: {
          responsive: false,  // Disable responsive sizing
          plugins: { legend: { display: false } }
        }
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
    },
 
    // New method to change chart type
    changeChartType(chart, type) {
      chart.config.type = type;
 
      // Adjust dataset configuration based on chart type
      if (type === 'bar') {
        chart.data.datasets.forEach((dataset, index) => {
          // For bar charts, we want to keep consistent colors but adjust opacity
          const color = index === 0 ? '#558b2f' : '#d32f2f';
          dataset.backgroundColor = index === 0 ? 'rgba(85,139,47,0.7)' : 'rgba(211,47,47,0.7)';
          dataset.borderColor = color;
          dataset.fill = false; // No fill for bar charts
        });
      } else if (type === 'line') {
        chart.data.datasets.forEach((dataset, index) => {
          const color = index === 0 ? '#558b2f' : '#d32f2f';
          dataset.backgroundColor = index === 0 ? 'rgba(85,139,47,.2)' : 'rgba(211,47,47,.2)';
          dataset.borderColor = color;
          dataset.fill = true; // Add fill for line charts
        });
      }
 
      chart.update();
    }
  };
 
  /* ------------ UI RENDERERS (with fixes for progress bar display and image conversion) ------------ */
  const ui = {
    counters(data) {
      utils.getElement('.transaction-count').textContent = data.total.toLocaleString();
 
      utils.getElement('.fake-value').textContent = data.today.fake;
      utils.getElement('.real-value').textContent = data.today.real;
 
      const todayTotal = Number(data.today.fake) + Number(data.today.real);
      utils.getElement('.total-processed strong').textContent = todayTotal.toLocaleString();
 
      utils.getElement('.fake-badge').textContent = `${utils.pct(data.today.fake, todayTotal)}%`;
      utils.getElement('.real-badge').textContent = `${utils.pct(data.today.real, todayTotal)}%`;
 
      utils.getElement('.fake-stat').innerHTML = `<span class="pie-dot fake-dot"></span> Fake : ${data.overall.fake.toLocaleString()} (${utils.pct(data.overall.fake, data.total)}%)`;
      utils.getElement('.real-stat').innerHTML = `<span class="pie-dot real-dot"></span> Real : ${data.overall.real.toLocaleString()} (${utils.pct(data.overall.real, data.total)}%)`;
    },
 
    // Updated recent function now renders an image element from the base64 string.
    recent(list) {
      const wrap = document.getElementById('recent-detections-list');
      wrap.innerHTML = '';
      if (!list.length) { 
        wrap.innerHTML = '<div class="no-data">No recent fake detections</div>'; 
        return; 
      }
 
      list.forEach((det, i) => {
        const ts = new Date(det.timestamp);
        const el = document.createElement('div');
        el.className = 'detection-item';
 
        // Prefix the base64 string with the proper data URI header.
        // (Change "image/jpeg" to "image/webp" if your image is in WebP format)
        const imageSrc = "data:image/jpeg;base64," + det.image_resize;
 
        el.innerHTML = `
          <div class="detection-image">
            <img src="${imageSrc}" alt="Fake Detection">
          </div>
          <div class="detection-info">
            <div class="detection-id">${det.employee_id}</div>
            <div class="detection-meta">${ts.toLocaleTimeString()} | ${det.company_code}</div>
            <div class="detection-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width:${det.confidence}%"></div>
              </div>
            </div>
            <div class="fake-percentage">Fake: ${det.confidence}%</div>
          </div>`;
 
        wrap.appendChild(el);
        if (i < list.length - 1) {
          const separator = document.createElement('div');
          separator.className = 'detection-separator';
          wrap.appendChild(separator);
        }
      });
    },
 
    top(list, sel, type) {
      const wrap = utils.getElement(sel);
      wrap.innerHTML = '';
      if (!list.length) { 
        wrap.innerHTML = `<div class="no-data">No ${type} data</div>`; 
        return; 
      }
 
      const max = list[0].cnt;
 
      list.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `${type}-item`;
 
        if (type === 'employee') {
          const identifier = item.employee_id || item.id;
          const name = item.name || `Employee ${identifier}`;
 
          div.innerHTML = `
            <div class="${type}-rank">${idx + 1}</div>
            <div class="${type}-info">
              <div class="${type}-id">${identifier}</div>
              <div class="${type}-name">${name}</div>
              <div class="${type}-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${item.cnt / max * 100}%"></div>
                </div>
              </div>
            </div>
            <div class="${type}-count">${item.cnt}</div>`;
        } else {
          const identifier = item.company_code || item.code || item.id;
          const name = item.name || `Company ${identifier}`;
 
          div.innerHTML = `
            <div class="${type}-rank">${idx + 1}</div>
            <div class="${type}-info">
              <div class="${type}-code">${identifier}</div>
              <div class="${type}-name">${name}</div>
              <div class="${type}-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${item.cnt / max * 100}%"></div>
                </div>
              </div>
            </div>
            <div class="${type}-count">${item.cnt}</div>`;
        }
 
        wrap.appendChild(div);
      });
    }
  };
 
  /* ------------ CHART TOGGLE BUTTONS ------------ */
  const initChartToggleButtons = () => {
    const lineBtn = document.querySelector('#daily-stats-card .chart-btn:nth-child(1)');
    const barBtn = document.querySelector('#daily-stats-card .chart-btn:nth-child(2)');
 
    if (lineBtn && barBtn) {
      lineBtn.addEventListener('click', () => {
        if (!lineBtn.classList.contains('active')) {
          lineBtn.classList.add('active');
          barBtn.classList.remove('active');
          charts.changeChartType(dailyChart, 'line');
        }
      });
 
      barBtn.addEventListener('click', () => {
        if (!barBtn.classList.contains('active')) {
          barBtn.classList.add('active');
          lineBtn.classList.remove('active');
          charts.changeChartType(dailyChart, 'bar');
        }
      });
    }
  };
 
  /* ------------ MAIN LOAD ------------ */
  let pieChart = charts.initPie(0, 0);
  let dailyChart = charts.initDaily(Array(7).fill(''), Array(7).fill(0), Array(7).fill(0));
 
  // Initialize chart toggle buttons
  initChartToggleButtons();
 
  async function refresh() {
    try {
      const stats = await fetch(config.apiUrl).then(r => r.json());
      console.log('Dashboard stats:', stats);
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
