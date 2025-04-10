const axios = require('axios');
require('dotenv').config(); 

exports.reports_view = async (req, res) => {
  console.log("Reports route accessed, user:", req.session.user);
  
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const search = req.query.search || '';  // Add this line to capture search parameter
  
  try {
    // Implement request timeout and circuit breaker
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await axios.get(`${process.env.API_BASE_URL}/transactions`, {
      params: {
        page: page,
        limit: limit,
        search: search  // Add this line to pass search parameter to API
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
    }, search);  // Pass search term to the render function
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
        let imageSource = "/images/avatar.png";
        if (transaction.image_resize) {
          // Existing processing for resized image
          if (!transaction.image_resize.startsWith("data:image/webp")) {
            if (!transaction.image_resize.startsWith("data:image")) {
              imageSource = `data:image/webp;base64,${transaction.image_resize}`;
            } else {
              imageSource = transaction.image_resize;
            }
          } else {
            imageSource = transaction.image_resize;
          }
        }

        // Add a new property for the modal image using image_data
        let originalImage = "/images/avatar.png";
        if (transaction.image_data) {
          if (!transaction.image_data.startsWith("data:image/")) {
            // Change "jpeg" to "png" if you expect PNG images or adjust accordingly.
            originalImage = `data:image/jpeg;base64,${transaction.image_data}`;
          } else {
            originalImage = transaction.image_data;
          }
        }

        return {
          id: transaction.transaction_no,
          company: transaction.company_code,
          employee: transaction.employee_id,
          activity: transaction.activity || "N/A",
          date: formattedDate, // assumed formatted date from previous logic
          time: formattedTime, // assumed formatted time from previous logic
          image: imageSource, // For the list view thumbnail
          originalImage: originalImage, // For the modal display
          status: transaction.status,
          score: transaction.score + " %",
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
  
  function renderReportsPage(transactions, pagination, searchTerm = '') {
    res.render("support/layouts/reports_page", {
      title: "Reports",
      currentPage: "reports",
      pageTitle: "Reports",
      pageIcon: "bi bi-bar-chart-fill",
      user: req.session.user,
      transactions: transactions,
      pagination: pagination,
      searchTerm: searchTerm  // Pass the search term to the template
    });
  }
};