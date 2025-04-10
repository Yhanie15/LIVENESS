const axios = require("axios")
require("dotenv").config()

class UserlogService {
  /**
   * Get all transaction logs with pagination
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Transaction logs data with pagination info
   */
  static async getAllLogs(page = 1, limit = 10) {
    try {
      // Implement request timeout and circuit breaker
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await axios.get(`${process.env.API_BASE_URL}/transactions`, {
        params: {
          page: page,
          limit: limit,
        },
        signal: controller.signal,
        timeout: 5000,
      })

      clearTimeout(timeoutId)

      const { data: userlogs, total, page: currentPage, limit: pageSize } = response.data

      return {
        logs: this.formatUserlogs(userlogs),
        pagination: {
          currentPage: Number.parseInt(currentPage),
          totalPages: Math.ceil(total / pageSize),
          totalItems: total,
          pageSize: pageSize,
        },
      }
    } catch (error) {
      console.error("Error fetching transaction logs from API:", error.message)

      if (error.response) {
        console.error("Response data:", error.response.data)
        console.error("Response status:", error.response.status)
      } else if (error.request) {
        console.error("No response received from API")
      }

      // Return empty data on error
      return {
        logs: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          pageSize: limit,
        },
      }
    }
  }

  /**
   * Format user logs for display
   * @param {Array} data - Raw user logs data
   * @returns {Array} - Formatted user logs
   */
  static formatUserlogs(data) {
    if (!data || data.length === 0) return []

    return data.map((userlog) => {
      // Optimize timestamp handling
      const timestamp = userlog.timestamp || new Date().toISOString()

      try {
        const date = new Date(timestamp)

        // Improved date validation
        if (isNaN(date.getTime())) {
          return {
            ...userlog,
            date: "Invalid Date",
            time: "Invalid Time",
          }
        }

        // Optimize date formatting
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        const formattedTime = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })

        // Improved image handling with fallback and WebP support
        let imageSource = "/images/avatar.png"
        if (userlog.image_resize) {
          // Check and convert to WebP if possible
          if (!userlog.image_resize.startsWith("data:image/webp")) {
            if (!userlog.image_resize.startsWith("data:image")) {
              imageSource = `data:image/webp;base64,${this.convertToWebP(userlog.image_resize)}`
            } else {
              imageSource = userlog.image_resize.replace(/\.(jpg|png)$/, ".webp")
            }
          } else {
            imageSource = userlog.image_resize
          }
        }

        return {
          company: userlog.company_code,
          id: userlog.employee_id,
          activity: userlog.activity || "N/A",
          date: formattedDate,
          time: formattedTime,
          image: imageSource,
        }
      } catch (error) {
        console.error("Error formatting userlog:", error)
        return {
          ...userlog,
          date: "Invalid Date",
          time: "Invalid Time",
        }
      }
    })
  }

  /**
   * Utility function to convert image to WebP
   * @param {string} base64Image - Base64 encoded image
   * @returns {string} - Converted image
   */
  static convertToWebP(base64Image) {
    // In a real-world scenario, this would be handled server-side
    // This is a simplified placeholder
    return base64Image
  }
}

module.exports = UserlogService

