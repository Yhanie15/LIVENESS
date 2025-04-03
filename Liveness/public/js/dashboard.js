document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const config = {
    apiUrl: 'http://192.168.6.93:5001/api/transactions',
    refreshInterval: 30000, // 30 seconds
    maxRecentDetections: 3,
    maxTopItems: 10 // Changed from 5 to 10
  };

  // Utility functions
  const utils = {
    formatDate: (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    formatTime: (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    minutesAgo: (date) => Math.floor((new Date() - date) / 60000),
    getElement: (selector) => document.querySelector(selector),
    getChart: (id) => Chart.getChart(id),
    calculatePercentage: (value, total) => total > 0 ? (value / total * 100).toFixed(1) : 0
  };

  // Dashboard controller
  const dashboard = {
    // Data fetching
    async fetchData(page = 1, limit = 1000000) {
      try {
        window.loadingScreen.setProgress(30);
        const response = await fetch(`${config.apiUrl}?page=${page}&limit=${limit}`);
        window.loadingScreen.setProgress(60);

        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        
        const data = await response.json();
        window.loadingScreen.setProgress(80);
        return data;
      } catch (error) {
        console.error('Error fetching data:', error);
        return { data: [], total: 0 };
      }
    },

    // Data processing
    processData(transactions) {
      if (!transactions || !transactions.length) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = {
        counts: { fake: 0, real: 0, total: transactions.length },
        todayCounts: { fake: 0, real: 0 },
        recentFakeDetections: [],
        companyStats: {},
        employeeStats: {}
      };
      
      transactions.forEach(tx => {
        // Overall counts
        if (tx.status === 'FAKE') {
          result.counts.fake++;
          
          // Recent fake detections
          if (result.recentFakeDetections.length < config.maxRecentDetections) {
            result.recentFakeDetections.push(tx);
          }
          
          // Company stats
          if (tx.company_code) {
            if (!result.companyStats[tx.company_code]) {
              result.companyStats[tx.company_code] = {
                code: tx.company_code,
                name: tx.company_name || `Company ${tx.company_code}`,
                count: 0
              };
            }
            result.companyStats[tx.company_code].count++;
          }
          
          // Employee stats
          if (tx.employee_id) {
            if (!result.employeeStats[tx.employee_id]) {
              result.employeeStats[tx.employee_id] = {
                id: tx.employee_id,
                name: tx.employee_name || `Employee ${tx.employee_id}`,
                count: 0
              };
            }
            result.employeeStats[tx.employee_id].count++;
          }
        } else if (tx.status === 'REAL') {
          result.counts.real++;
        }
        
        // Today's counts
        const txDate = new Date(tx.timestamp);
        if (txDate >= today) {
          if (tx.status === 'FAKE') {
            result.todayCounts.fake++;
          } else if (tx.status === 'REAL') {
            result.todayCounts.real++;
          }
        }
      });
      
      // Sort recent fake detections
      result.recentFakeDetections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return result;
    },

    // Chart management
    charts: {
      initializePieChart(fakeCount, realCount) {
        const pieCtx = document.getElementById('fakeRealPieChart')?.getContext('2d');
        if (!pieCtx) return null;
        
        return new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: ['Fake', 'Real'],
            datasets: [{
              data: [fakeCount || 0, realCount || 0],
              backgroundColor: ['#d32f2f', '#558b2f'],
              borderColor: ['#fff', '#fff'],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                    const percentage = utils.calculatePercentage(value, total);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      },
      
      updatePieChart(fakeCount, realCount) {
        const pieChart = utils.getChart('fakeRealPieChart');
        if (pieChart) {
          pieChart.data.datasets[0].data = [fakeCount, realCount];
          pieChart.update();
        } else {
          this.initializePieChart(fakeCount, realCount);
        }
      },
      
      initializeDailyStatsChart(labels, realData, fakeData) {
        const ctx = document.getElementById('dailyStatsChart')?.getContext('2d');
        if (!ctx) return null;
        
        return new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Real Images',
                data: realData,
                backgroundColor: 'rgba(85, 139, 47, 0.2)',
                borderColor: '#558b2f',
                fill: true,
                tension: 0.4
              },
              {
                label: 'Fake Images',
                data: fakeData,
                backgroundColor: 'rgba(211, 47, 47, 0.2)',
                borderColor: '#d32f2f',
                fill: true,
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
                position: 'top',
                labels: { boxWidth: 12, padding: 15, font: { size: 12 } }
              },
              tooltip: { enabled: true, mode: 'index', intersect: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(200, 200, 200, 0.1)' },
                ticks: { font: { size: 12 } }
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 12 } }
              }
            }
          }
        });
      },
      
      updateDailyStats(transactions) {
        // Generate labels for the last 7 days
        const labels = [];
        const dailyData = {};
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = utils.formatDate(date);
          
          labels.push(dateString);
          dailyData[dateString] = { fake: 0, real: 0 };
        }
        
        // Process transactions
        transactions.forEach(tx => {
          if (!tx.timestamp) return;
          
          try {
            const txDate = new Date(tx.timestamp);
            const dateString = utils.formatDate(txDate);
            
            if (dailyData[dateString]) {
              if (tx.status === 'FAKE') {
                dailyData[dateString].fake++;
              } else if (tx.status === 'REAL') {
                dailyData[dateString].real++;
              }
            }
          } catch (error) {
            console.error('Error processing transaction date:', error);
          }
        });
        
        // Convert to chart data
        const realData = labels.map(date => dailyData[date].real);
        const fakeData = labels.map(date => dailyData[date].fake);
        
        // Update the chart
        const chart = utils.getChart('dailyStatsChart');
        if (chart) {
          chart.data.labels = labels;
          chart.data.datasets[0].data = realData;
          chart.data.datasets[1].data = fakeData;
          chart.update();
        } else {
          this.initializeDailyStatsChart(labels, realData, fakeData);
        }
      }
    },
    
    // UI updates
    ui: {
      updateCounters(data) {
        // Update transaction count
        const transactionCountEl = utils.getElement('.transaction-count');
        if (transactionCountEl) transactionCountEl.textContent = data.counts.total;
        
        // Update today's counts
        const fakeValueEl = utils.getElement('.fake-value');
        const realValueEl = utils.getElement('.real-value');
        if (fakeValueEl) fakeValueEl.textContent = data.todayCounts.fake;
        if (realValueEl) realValueEl.textContent = data.todayCounts.real;
        
        // Calculate today's percentages
        const todayTotal = data.todayCounts.fake + data.todayCounts.real;
        const fakePercentage = utils.calculatePercentage(data.todayCounts.fake, todayTotal);
        const realPercentage = utils.calculatePercentage(data.todayCounts.real, todayTotal);
        
        // Update percentage badges
        const fakeBadgeEl = utils.getElement('.fake-badge');
        const realBadgeEl = utils.getElement('.real-badge');
        if (fakeBadgeEl) fakeBadgeEl.textContent = `${fakePercentage}%`;
        if (realBadgeEl) realBadgeEl.textContent = `${realPercentage}%`;
        
        // Update total processed
        const totalProcessedEl = utils.getElement('.total-processed strong');
        if (totalProcessedEl) totalProcessedEl.textContent = todayTotal;
        
        // Update pie stats text
        const totalImages = data.counts.fake + data.counts.real;
        const fakePiePercentage = utils.calculatePercentage(data.counts.fake, totalImages);
        const realPiePercentage = utils.calculatePercentage(data.counts.real, totalImages);
        
        const fakeStatEl = utils.getElement('.fake-stat');
        const realStatEl = utils.getElement('.real-stat');
        
        if (fakeStatEl) {
          fakeStatEl.innerHTML = `<span class="pie-dot fake-dot"></span> Fake : ${data.counts.fake.toLocaleString()} (${fakePiePercentage}%)`;
        }
        
        if (realStatEl) {
          realStatEl.innerHTML = `<span class="pie-dot real-dot"></span> Real : ${data.counts.real.toLocaleString()} (${realPiePercentage}%)`;
        }
      },
      
      updateRecentDetections(detections) {
        const container = document.getElementById('recent-detections-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!detections || detections.length === 0) {
          container.innerHTML = '<div class="no-data">No recent fake detections</div>';
          return;
        }
        
        detections.forEach((detection, index) => {
          try {
            const timestamp = new Date(detection.timestamp);
            const timeString = utils.formatTime(timestamp);
            const dateString = utils.formatDate(timestamp);
            const minutesAgo = utils.minutesAgo(timestamp);
            
            const employeeId = detection.employee_id || 'EMP1098';
            const companyCode = detection.company_code || 'COMP26';
            const confidenceScore = detection.confidence || 14.5;
            
            let imgSrc = '/images/avatar.png'; // Default image
            if (detection.image_base64) {
              imgSrc = `data:image/jpeg;base64,${detection.image_base64}`;
            }
            
            const detectionEl = document.createElement('div');
            detectionEl.className = 'detection-item';
            
            detectionEl.innerHTML = `
              <div class="detection-image">
                <img src="${imgSrc}" alt="Detection">
              </div>
              <div class="detection-info">
                <div class="detection-id">${employeeId}</div>
                <div class="detection-meta">${minutesAgo} min ago | ${companyCode}</div>
                <div class="detection-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${confidenceScore}%"></div>
                  </div>
                </div>
                <div class="fake-percentage">Fake: ${confidenceScore.toFixed(1)} %</div>
              </div>
              <div class="detection-time">
                <div class="time">${timeString}</div>
                <div class="date">${dateString}</div>
              </div>
            `;
            
            container.appendChild(detectionEl);
            
            if (index < detections.length - 1) {
              const separator = document.createElement('div');
              separator.className = 'detection-separator';
              container.appendChild(separator);
            }
          } catch (error) {
            console.error('Error creating detection item:', error);
          }
        });
      },
      
      updateTopList(data, containerSelector, type) {
        const container = utils.getElement(containerSelector);
        if (!container) return;
        
        container.innerHTML = '';
        
        const items = Object.values(data)
          .sort((a, b) => b.count - a.count)
          .slice(0, config.maxTopItems); // Changed from 5 to config.maxTopItems
        
        if (items.length === 0) {
          container.innerHTML = `<div class="no-data">No ${type} data available</div>`;
          return;
        }
        
        const maxCount = items[0].count;
        
        items.forEach((item, index) => {
          const percentageFill = maxCount > 0 ? (item.count / maxCount * 100) : 0;
          
          const itemEl = document.createElement('div');
          itemEl.className = `${type}-item`;
          
          if (type === 'company') {
            itemEl.innerHTML = `
              <div class="${type}-rank">${index + 1}</div>
              <div class="${type}-info">
                <div class="${type}-code">${item.code}</div>
                <div class="${type}-name">${item.name}</div>
                <div class="${type}-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentageFill}%"></div>
                  </div>
                </div>
              </div>
              <div class="${type}-count">${item.count}</div>
            `;
          } else { // employee
            itemEl.innerHTML = `
              <div class="${type}-avatar">
                <div class="avatar-icon"></div>
              </div>
              <div class="${type}-info">
                <div class="${type}-id">${item.id}</div>
                <div class="${type}-name">${item.name}</div>
                <div class="${type}-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentageFill}%"></div>
                  </div>
                </div>
              </div>
              <div class="${type}-count">${item.count}</div>
            `;
          }
          
          container.appendChild(itemEl);
        });
      }
    },
    
    // Main update function
    async updateDashboard() {
      try {
        window.loadingScreen.show();
        window.loadingScreen.setProgress(10);
        
        const rawData = await this.fetchData();
        if (!rawData || !rawData.data) {
          console.error('Invalid data structure returned from API');
          window.loadingScreen.hide();
          return;
        }
        
        const data = this.processData(rawData.data);
        if (!data) {
          console.error('Failed to process data');
          window.loadingScreen.hide();
          return;
        }
        
        // Update UI components
        this.ui.updateCounters(data);
        this.ui.updateRecentDetections(data.recentFakeDetections);
        this.ui.updateTopList(data.companyStats, '.companies-list', 'company');
        this.ui.updateTopList(data.employeeStats, '.employees-list', 'employee');
        
        // Update charts
        this.charts.updatePieChart(data.counts.fake, data.counts.real);
        this.charts.updateDailyStats(rawData.data);
        
        // Complete loading
        window.loadingScreen.setProgress(100);
        setTimeout(() => window.loadingScreen.hide(), 300);
        
        console.log('Dashboard updated successfully');
      } catch (error) {
        console.error('Error updating dashboard:', error);
        window.loadingScreen.hide();
      }
    },
    
    // Setup functions
    setupChartTypeToggle() {
      const chartBtns = document.querySelectorAll('.chart-btn');
      chartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          chartBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          
          const chartType = this.textContent.toLowerCase();
          const chart = utils.getChart('dailyStatsChart');
          if (chart) {
            chart.config.type = chartType;
            chart.update();
          }
        });
      });
    },
    
    setupResizeHandler() {
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const pieChart = utils.getChart('fakeRealPieChart');
          const dailyChart = utils.getChart('dailyStatsChart');
          
          if (pieChart) pieChart.resize();
          if (dailyChart) dailyChart.resize();
        }, 250);
      });
    },
    
    // Initialize dashboard
    init() {
      console.log('Initializing dashboard...');
      
      // Initialize charts
      this.charts.initializePieChart(0, 0);
      
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(utils.formatDate(date));
      }
      this.charts.initializeDailyStatsChart(labels, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
      
      // Setup event handlers
      this.setupChartTypeToggle();
      this.setupResizeHandler();
      
      // Initial data load
      this.updateDashboard();
      
      // Set up auto-refresh
      // setInterval(() => this.updateDashboard(), config.refreshInterval);
    }
  };
  
  // Start the dashboard
  dashboard.init();
});

// This is just to show the code is running in the Node.js environment
console.log("Dashboard code optimized successfully!");