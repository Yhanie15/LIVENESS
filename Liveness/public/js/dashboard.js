document.addEventListener('DOMContentLoaded', function() {
  // API URL
  const API_URL = 'http://192.168.6.93:5000/api/transactions';
  
  // Fetch data from API
  async function fetchTransactions(page = 1, limit = 1000000) {
    try {
      const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('API request failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      return { data: [], total: 0 };
    }
  }
  
  // Update the pie chart with new data
  function updatePieChart(fakeCount, realCount) {
    const pieChart = Chart.getChart('fakeRealPieChart');
    if (pieChart) {
      pieChart.data.datasets[0].data = [fakeCount, realCount];
      pieChart.update();
    }
  }
  
  // Process data and update dashboard
  async function updateDashboard() {
    const data = await fetchTransactions();
    
    // Count FAKE vs REAL images (total across all transactions)
    const counts = {
      fake: 0,
      real: 0,
      total: data.total || 0
    };
    
    // todays-images-card's date for filtering today's images
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Today's counts
    const todayCounts = {
      fake: 0,
      real: 0
    };
    
    // Process transaction data
    data.data.forEach(transaction => {
      // Count overall fake vs real
      if (transaction.status === 'FAKE') {
        counts.fake++;
      } else if (transaction.status === 'REAL') {
        counts.real++;
      }
      
      // Count today's transactions
      const txDate = new Date(transaction.timestamp);
      if (txDate >= today) {
        if (transaction.status === 'FAKE') {
          todayCounts.fake++;
        } else if (transaction.status === 'REAL') {
          todayCounts.real++;
        }
      }
    });
    
    // Update Total Transactions Card
    document.querySelector('.transaction-count').textContent = counts.total;
    
    // Update Today's Images Card
    document.querySelector('.stat-value-fake').textContent = todayCounts.fake;
    document.querySelector('.stat-value-real').textContent = todayCounts.real;
    
    // Calculate today's percentages
    const todayTotal = todayCounts.fake + todayCounts.real;
    const fakePercentage = todayTotal > 0 ? (todayCounts.fake / todayTotal * 100).toFixed(1) : 0;
    const realPercentage = todayTotal > 0 ? (todayCounts.real / todayTotal * 100).toFixed(1) : 0;
    
    // Update progress bars
    document.querySelector('.fake-progress').style.width = `${fakePercentage}%`;
    document.querySelector('.real-progress').style.width = `${realPercentage}%`;
    document.querySelector('.fake-percentage').textContent = `${fakePercentage}%`;
    document.querySelector('.real-percentage').textContent = `${realPercentage}%`;
    
    // Update pie chart with TOTAL fake and real counts (not just today's)
    updatePieChart(counts.fake, counts.real);
    
    // Update daily stats chart
    updateDailyStats(data.data);
    
    // Update tables
    updateCompanyTable(data.data);
    updateEmployeeTable(data.data);
  }
  
  // Update daily stats chart
  function updateDailyStats(transactions) {
    // Generate labels for the current week (Sunday to Saturday)
    const labels = [];
    const dailyData = {};
    
    // Find the most recent Sunday
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDay);
    
    // Create labels and initialize data for the current week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateString = currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
      
      labels.push(dateString);
      dailyData[dateString] = { fake: 0, real: 0 };
    }
    
    // Process transactions
    transactions.forEach(tx => {
      const txDate = new Date(tx.timestamp);
      const dateString = txDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
      
      // Only count transactions within the current week
      if (labels.includes(dateString)) {
        if (tx.status === 'FAKE') {
          dailyData[dateString].fake++;
        } else if (tx.status === 'REAL') {
          dailyData[dateString].real++;
        }
      }
    });
    
    // Convert to chart data, maintaining the current week's order
    const realData = labels.map(date => dailyData[date].real);
    const fakeData = labels.map(date => dailyData[date].fake);
    
    // Update the chart
    const chart = Chart.getChart('dailyStatsChart');
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = realData;
      chart.data.datasets[1].data = fakeData;
      chart.update();
    }
  }
  
  // Update company table with fake detections
  function updateCompanyTable(transactions) {
    // Count fake detections by company
    const companyFakeDetections = {};
    
    transactions.forEach(tx => {
      if (tx.status === 'FAKE' && tx.company_code) {
        if (!companyFakeDetections[tx.company_code]) {
          companyFakeDetections[tx.company_code] = {
            code: tx.company_code,
            count: 0,
            // In a real app, you might want to fetch company names from another API
            name: `Company ${tx.company_code}`
          };
        }
        companyFakeDetections[tx.company_code].count++;
      }
    });
    
    // Convert to array and sort by count
    const companiesArray = Object.values(companyFakeDetections)
      .sort((a, b) => b.count - a.count);
    
    // Get table body
    const tableBody = document.querySelector('#top-companies-card .data-table tbody');
    tableBody.innerHTML = '';
    
    // Add rows
    companiesArray.slice(0, 5).forEach((company, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${company.code}</td>
        <td>${company.name}</td>
        <td>${company.count}</td>
      `;
      tableBody.appendChild(row);
    });
    
    // Add placeholder if no data
    if (companiesArray.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4" class="no-data">No fake detections found</td>';
      tableBody.appendChild(row);
    }
  }
  
  // Update employee table with fake detections
  function updateEmployeeTable(transactions) {
    // Count fake detections by employee
    const employeeFakeDetections = {};
    
    transactions.forEach(tx => {
      if (tx.status === 'FAKE' && tx.employee_id) {
        if (!employeeFakeDetections[tx.employee_id]) {
          employeeFakeDetections[tx.employee_id] = {
            id: tx.employee_id,
            count: 0,
            // In a real app, you might want to fetch employee details from another API
            name: `Employee ${tx.employee_id}`,
            department: 'Unknown'
          };
        }
        employeeFakeDetections[tx.employee_id].count++;
      }
    });
    
    // Convert to array and sort by count
    const employeesArray = Object.values(employeeFakeDetections)
      .sort((a, b) => b.count - a.count);
    
    // Get table body
    const tableBody = document.querySelector('#employee-detections-card .data-table tbody');
    tableBody.innerHTML = '';
    
    // Add rows
    employeesArray.slice(0, 5).forEach(employee => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${employee.id}</td>
        <td>${employee.name}</td>
        <td>${employee.department}</td>
        <td>${employee.count}</td>
      `;
      tableBody.appendChild(row);
    });
    
    // Add placeholder if no data
    if (employeesArray.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4" class="no-data">No fake detections found</td>';
      tableBody.appendChild(row);
    }
  }
  
  // Update active users section (mock data for now)
  const activeEmployeesBtn = document.getElementById('btn-active-employees');
  const userActivityBtn = document.getElementById('btn-user-activity');
  const userListContainer = document.getElementById('active-users-list');
  const activeUserCount = document.getElementById('active-user-count');
 
  // Mock Data
  const activeEmployees = [
    { id: 'EMP001', name: 'Alice Brown', role: 'Admin', lastLogin: '5 minutes ago' },
    { id: 'EMP002', name: 'Bob White', role: 'Admin', lastLogin: '20 minutes ago' }
  ];
 
  const userActivity = [
    { admin: 'Admin1', action: 'Deleted an employee', timestamp: '10 minutes ago' },
    { admin: 'Admin2', action: 'Updated permissions', timestamp: '1 hour ago' }
  ];
 
  function displayActiveEmployees() {
    userListContainer.innerHTML = '';
    activeEmployees.forEach(user => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-name">${user.name} (${user.role})</div>
          <div class="user-id">${user.id}</div>
        </div>
        <div class="user-status">
          <div class="login-time">${user.lastLogin}</div>
          <div class="status-indicator online"></div>
        </div>
      `;
      userListContainer.appendChild(userItem);
    });
 
    // Update active user count
    activeUserCount.textContent = activeEmployees.length;
 
    // Toggle active button styles
    activeEmployeesBtn.classList.add('active');
    userActivityBtn.classList.remove('active');
  }
 
  function displayUserActivity() {
    userListContainer.innerHTML = '';
    userActivity.forEach(activity => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-info">
          <strong>${activity.admin}</strong> ${activity.action}
        </div>
        <div class="activity-time">${activity.timestamp}</div>
      `;
      userListContainer.appendChild(activityItem);
    });
 
    // Toggle active button styles
    activeEmployeesBtn.classList.remove('active');
    userActivityBtn.classList.add('active');
  }
 
  // Initial display
  displayActiveEmployees();
 
  // Event listeners
  activeEmployeesBtn.addEventListener('click', displayActiveEmployees);
  userActivityBtn.addEventListener('click', displayUserActivity);
  
  // Initialize charts as in your original code
  // Daily Statistics Chart with responsive configuration
  const ctx = document.getElementById('dailyStatsChart').getContext('2d');
  
  // Chart data (initial placeholder data to avoid empty chart)
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  const realData = new Array(7).fill(0);
  const fakeData = new Array(7).fill(0);
  
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
            font: function(context) {
              const width = context.chart.width;
              const size = Math.min(Math.round(width / 32), 12);
              return {
                size: size
              };
            },
            callback: function(val, index) {
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
  
  // Initial data load
  updateDashboard();
  
  // Set up auto-refresh every 30 seconds
  // setInterval(updateDashboard, 30000);
});