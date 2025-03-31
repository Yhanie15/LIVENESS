const axios = require('axios');
require('dotenv').config(); 

exports.reports_view = async (req, res) => {
  console.log("Reports route accessed, user:", req.session.user);
  
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  
  try {
    // Implement request timeout and circuit breaker
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await axios.get(`${process.env.API_BASE_URL}/transactions`, {
      params: {
        page: page,
        limit: limit
      },
      signal: controller.signal,
      timeout: 5000
    });
    
    clearTimeout(timeoutId);
    
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
      // Optimize timestamp handling
      const timestamp = transaction.timestamp || new Date().toISOString();
      
      try {
        const date = new Date(timestamp);
        
        // Improved date validation
        if (isNaN(date.getTime())) {
          return {
            ...transaction,
            date: 'Invalid Date',
            time: 'Invalid Time'
          };
        }
        
        // Optimize date formatting
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        const formattedTime = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        
        // Improved image handling with fallback and WebP support
        let imageSource = '/img/profile1.jpg'; 
        if (transaction.image_data) {
          // Check and convert to WebP if possible
          if (!transaction.image_data.startsWith('data:image/webp')) {
            if (!transaction.image_data.startsWith('data:image')) {
              imageSource = `data:image/webp;base64,${convertToWebP(transaction.image_data)}`;
            } else {
              imageSource = transaction.image_data.replace(/\.(jpg|png)$/, '.webp');
            }
          } else {
            imageSource = transaction.image_data;
          }
        }
        
        return {
          id: transaction.transaction_no,
          company: transaction.company_code,
          employee: transaction.employee_id,
          activity: transaction.activity || 'N/A', 
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
 
  function convertToWebP(base64Image) {
    
    return base64Image;
  }
  
  function renderReportsPage(transactions, pagination) {
    res.render("support/layouts/reports_page", {
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