document.addEventListener('DOMContentLoaded', function() {
  // Daily Statistics Chart with responsive configuration
  const ctx = document.getElementById('dailyStatsChart').getContext('2d');
  
  // Chart data
  const labels = ['Mar 12', 'Mar 13', 'Mar 14', 'Mar 15', 'Mar 16', 'Mar 17', 'Mar 18'];
  const realData = [180, 190, 210, 200, 220, 210, 230];
  const fakeData = [30, 25, 35, 30, 25, 30, 35];
  
  // Create responsive chart
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Real Images',
          data: realData,
          backgroundColor: '#558b2f',
          borderColor: '#558b2f',
          tension: 0.4
        },
        {
          label: 'Fake Images',
          data: fakeData,
          backgroundColor: '#d32f2f',
          borderColor: '#d32f2f',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            // Make legend text smaller on mobile screens
            font: {
              size: function() {
                return window.innerWidth < 768 ? 10 : 12;
              }
            }
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(200, 200, 200, 0.1)'
          },
          ticks: {
            // Make y-axis labels smaller on mobile screens
            font: function(context) {
              const width = context.chart.width;
              const size = Math.min(Math.round(width / 32), 12);
              return {
                size: size
              };
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            // Make x-axis labels smaller on mobile screens
            font: function(context) {
              const width = context.chart.width;
              const size = Math.min(Math.round(width / 32), 12);
              return {
                size: size
              };
            },
            // Hide some labels on small screens
            callback: function(val, index) {
              // On small screens, show fewer labels
              if (window.innerWidth < 576) {
                return index % 2 === 0 ? this.getLabelForValue(val) : '';
              }
              return this.getLabelForValue(val);
            }
          }
        }
      }
    }
  });
  
  // Chart type toggle
  const chartBtns = document.querySelectorAll('.chart-btn');
  chartBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      chartBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const chartType = this.textContent.toLowerCase();
      chart.config.type = chartType;
      chart.update();
    });
  });

  // Pie Chart for Total Fake vs Real
  const pieCtx = document.getElementById('fakeRealPieChart').getContext('2d');
  const pieData = {
    labels: ['Fake', 'Real'],
    datasets: [{
      data: [169, 1124],
      backgroundColor: ['#d32f2f', '#558b2f'],
      borderColor: ['#fff', '#fff'],
      borderWidth: 2
    }]
  };

  const pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: pieData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 15,
            boxWidth: 12,
            font: {
              size: function() {
                return window.innerWidth < 768 ? 10 : 12;
              }
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  // Function to handle resize events for better performance
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      chart.resize();
      pieChart.resize();
    }, 250);
  });
  
  // Make tables responsive by wrapping in scrollable containers
  document.querySelectorAll('.data-table').forEach(table => {
    const wrapper = document.createElement('div');
    wrapper.className = 'data-table-container';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
});