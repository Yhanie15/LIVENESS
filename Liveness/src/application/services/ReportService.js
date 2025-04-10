const axios = require("axios");
require("dotenv").config();

class ReportService {
  /**
   * Get all transaction reports with pagination and search functionality
   * @param {number} page - Current page number
   * @param {number} limit - Number of items per page
   * @param {string} search - Optional search term to filter results
   * @returns {Promise<Object>} - Transactions and pagination data
   */
  async getAllReports(page = 1, limit = 10, search = '') {
    try {
      // Implement request timeout and circuit breaker
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Prepare request parameters
      const params = {
        page: page,
        limit: limit
      };
      
      // Only add search parameter if it's not empty
      if (search && search.trim() !== '') {
        params.search = search.trim();
      }

      const response = await axios.get(
        `${process.env.API_BASE_URL}/transactions`,
        {
          params: params,
          signal: controller.signal,
          timeout: 5000,
        }
      );

      clearTimeout(timeoutId);

      const {
        data: transactions,
        total,
        page: currentPage,
        limit: pageSize,
      } = response.data;
      const formattedTransactions = this.formatTransactions(transactions);
      const totalPages = Math.ceil(total / pageSize);

      return {
        transactions: formattedTransactions,
        pagination: {
          currentPage: parseInt(currentPage),
          totalPages: totalPages,
          totalItems: total,
          pageSize: parseInt(pageSize),
        },
        searchTerm: search // Return the search term for maintaining UI state
      };
    } catch (error) {
      console.error("Error fetching transactions from API:", error.message);

      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else if (error.request) {
        console.error("No response received from API");
      }

      // Return empty data with pagination
      return {
        transactions: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalItems: 0,
          pageSize: parseInt(limit),
        },
        searchTerm: search // Still return the search term even on error
      };
    }
  }

  /**
   * Get a single transaction by ID with its associated remarks
   * @param {string} transactionId - Transaction ID or number
   * @returns {Promise<Object>} - Transaction details and remarks
   */
  async getTransactionWithRemarks(transactionId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await axios.get(
        `${process.env.API_BASE_URL}/transactions-with-remarks`,
        {
          params: { transaction_id: transactionId },
          signal: controller.signal,
          timeout: 5000,
        }
      );

      clearTimeout(timeoutId);
      return response.data;
    } catch (error) {
      console.error("Error fetching transaction details:", error.message);
      throw error;
    }
  }

  /**
   * Format transaction data for display
   * @param {Array} data - Raw transaction data
   * @returns {Array} - Formatted transaction data
   */
  formatTransactions(data) {
    if (!data || data.length === 0) return [];

    return data.map((transaction) => {
      // Optimize timestamp handling
      const timestamp = transaction.timestamp || new Date().toISOString();

      try {
        const date = new Date(timestamp);

        // Improved date validation
        if (isNaN(date.getTime())) {
          return {
            ...transaction,
            date: "Invalid Date",
            time: "Invalid Time",
          };
        }

        // Optimize date formatting
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        const formattedTime = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
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

        // new property for the modal image using image_data
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
          date: formattedDate,
          time: formattedTime,
          image: imageSource, // For the thumbnail view
          originalImage: originalImage, // For the modal (full resolution)
          status: transaction.status,
          score: transaction.score + " %",
        };
      } catch (error) {
        console.error("Error formatting transaction:", error);
        return {
          ...transaction,
          date: "Invalid Date",
          time: "Invalid Time",
        };
      }
    });
  }
}

module.exports = new ReportService();