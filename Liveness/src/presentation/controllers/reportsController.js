const axios = require('axios');
require('dotenv').config(); 
exports.reports_view = async (req, res) => {
  console.log("Reports route accessed, user:", req.session.user);
  
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  
  try {
    const response = await axios.get(`${process.env.API_BASE_URL}/transactions`, {
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
      // Ensure timestamp is a valid datetime string
      const timestamp = transaction.timestamp || new Date().toISOString();
      
      try {
        // Parse the datetime string
        const date = new Date(timestamp);
        
        // Validate the date
        if (isNaN(date.getTime())) {
          return {
            ...transaction,
            date: 'Invalid Date',
            time: 'Invalid Time'
          };
        }
        
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric' 
        });
        
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
          activity: transaction.activity, 
          date: formattedDate,
          time: formattedTime,
          image: imageSource,
          status: transaction.status,
          score: transaction.score + ' %'
        };
      } catch (error) {
        console.error('Error formatting transaction:', error);
        return {
          ...transaction,
          date: 'Invalid Date',
          time: 'Invalid Time'
        };
      }
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