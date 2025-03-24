const axios = require('axios');

exports.reports_view = async (req, res) => {
  console.log("Reports route accessed, user:", req.session.user);
  
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  
  try {
    // Fetch data from the API with pagination parameters
    const response = await axios.get('http://192.168.6.93:5000/api/transactions', {
      params: {
        page: page,
        limit: limit
      }
    });
    const { data: transactions, total, page: currentPage, limit: pageSize } = response.data;
    const formattedTransactions = formatTransactions(transactions);
    const totalPages = Math.ceil(total / pageSize);
    
    renderReportsPage(formattedTransactions, {
      currentPage: parseInt(currentPage),
      totalPages: totalPages,
      totalItems: total,
      pageSize: pageSize
    });
  } catch (error) {
    console.error("Error fetching transactions from API:", error.message);
    
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      console.error("No response received from API");
    }
    
    renderReportsPage([], {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: limit
    });
  }
  
  function formatTransactions(data) {
    if (!data || data.length === 0) return [];
    
    return data.map(transaction => {
      const timestamp = transaction.timestamp || new Date().toISOString();
      const date = new Date(timestamp);
      
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
      // Updated to display time in 24-hour format (military time)
      const formattedTime = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      });
      let imageSource = '/img/profile1.jpg'; 
      if (transaction.image_data) {
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
        activity: null, 
        date: formattedDate,
        time: formattedTime,
        image: imageSource,
        status: transaction.status,
        score: transaction.score + ' %'
      };
    });
  }
  
  function renderReportsPage(transactions, pagination) {
    res.render("admin/layouts/reports_page", {
      title: "Reports",
      currentPage: "reports",
      pageTitle: "Reports",
      pageIcon: "bi bi-bar-chart-fill",
      user: req.session.user,
      transactions: transactions,
      pagination: pagination
    });
  }
};