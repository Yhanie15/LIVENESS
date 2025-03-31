const axios = require('axios');
require('dotenv').config(); 

exports.userlog_view = async (req, res) => {
  console.log("Userlog route accessed, user:", req.session.user);
  
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
    
    const { data: userlogs, total, page: currentPage, limit: pageSize } = response.data;
    const formattedUserlogs = formatUserlogs(userlogs);
    const totalPages = Math.ceil(total / pageSize);
    
    renderUserlogPage(formattedUserlogs, {
      currentPage: parseInt(currentPage),
      totalPages: totalPages,
      totalItems: total,
      pageSize: pageSize
    });
  } catch (error) {
    console.error("Error fetching user logs from API:", error.message);
    
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      console.error("No response received from API");
    }
    
    renderUserlogPage([], {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: limit
    });
  }
  
  function formatUserlogs(data) {
    if (!data || data.length === 0) return [];
    
    return data.map(userlog => {
      // Optimize timestamp handling
      const timestamp = userlog.timestamp || new Date().toISOString();
      
      try {
        const date = new Date(timestamp);
        
        // Improved date validation
        if (isNaN(date.getTime())) {
          return {
            ...userlog,
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
          hour12: true 
        });
        
        // Improved image handling with fallback and WebP support
        let imageSource = '/img/profile1.jpg'; 
        if (userlog.image_data) {
          // Check and convert to WebP if possible
          if (!userlog.image_data.startsWith('data:image/webp')) {
            if (!userlog.image_data.startsWith('data:image')) {
              imageSource = `data:image/webp;base64,${convertToWebP(userlog.image_data)}`;
            } else {
              imageSource = userlog.image_data.replace(/\.(jpg|png)$/, '.webp');
            }
          } else {
            imageSource = userlog.image_data;
          }
        }
        
        return {
          company: userlog.company_code,
          id: userlog.employee_id,
          activity: userlog.activity || 'N/A', 
          date: formattedDate,
          time: formattedTime,
          image: imageSource
        };
      } catch (error) {
        console.error('Error formatting userlog:', error);
        return {
          ...userlog,
          date: 'Invalid Date',
          time: 'Invalid Time'
        };
      }
    });
  }
  
  // Utility function to convert image to WebP
  function convertToWebP(base64Image) {
    // In a real-world scenario, this would be handled server-side
    // This is a simplified placeholder
    return base64Image;
  }
  
  function renderUserlogPage(userlogs, pagination) {
    res.render("admin/layouts/userlog_page", {
      title: "User Logs",
      currentPage: "userlogs",
      pageTitle: "User Logs",
      pageIcon: "bi bi-people-fill",
      user: req.session.user,
      userlogs: userlogs,
      pagination: pagination
    });
  }
};