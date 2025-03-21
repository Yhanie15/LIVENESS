const db = require('../../infrastructure/database'); // Adjust path as needed

exports.reports_view = (req, res) => {
  console.log("Reports route accessed, user:", req.session.user);
  
  // Query to fetch transaction data using MySQL syntax
  const query = `
    SELECT id, transaction_no, company_code, employee_id, 
           status, score, timestamp, image_data
    FROM transactions
    ORDER BY timestamp DESC
  `;
  
  // Use the MySQL query method instead of SQLite's all method
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching transactions:", err.message);
      return renderReportsPage([]);
    }
    
    // Format the data for display
    const transactions = formatTransactions(results);
    renderReportsPage(transactions);
  });
  
  function formatTransactions(rows) {
    if (!rows || rows.length === 0) return [];
    
    return rows.map(transaction => {
      // Parse the timestamp to get date and time
      const date = new Date(transaction.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
      const formattedTime = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      });
      
      // Format the base64 image properly
      let imageSource = '/img/profile1.jpg'; // Default image
      if (transaction.image_data) {
        // Check if the string already contains the data URI prefix
        if (!transaction.image_data.startsWith('data:image')) {
          imageSource = `data:image/jpeg;base64,${transaction.image_data}`;
        } else {
          imageSource = transaction.image_data;
        }
      }
      
      return {
        id: transaction.transaction_no,
        company: transaction.company_code,
        employee: transaction.employee_id,
        activity: null, // No column for activity yet
        date: formattedDate,
        time: formattedTime,
        image: imageSource,
        status: transaction.status,
        score: transaction.score + ' %'
      };
    });
  }
  
  function renderReportsPage(transactions) {
    res.render("admin/layouts/reports_page", {
      title: "Reports",
      currentPage: "reports",
      pageTitle: "Reports",
      pageIcon: "bi bi-bar-chart-fill",
      user: req.session.user,
      transactions: transactions
    });
  }
};