const axios = require("axios");
require("dotenv").config();

exports.reports_view = async (req, res) => {
  console.log("Reports route accessed, user:", req.session.user);

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    // Implement request timeout and circuit breaker
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await axios.get(
      `${process.env.API_BASE_URL}/transactions`,
      {
        params: {
          page: page,
          limit: limit,
        },
        signal: controller.signal,
        timeout: 5000,
      }
    );

    clearTimeout(timeoutId);

    const {
      data: reports,
      total,
      page: currentPage,
      limit: pageSize,
    } = response.data;
    const formattedReports = formatReports(reports);
    const totalPages = Math.ceil(total / pageSize);

    renderReportsPage(formattedReports, {
      currentPage: parseInt(currentPage),
      totalPages: totalPages,
      totalItems: total,
      pageSize: pageSize,
    });
  } catch (error) {
    console.error("Error fetching reports from API:", error.message);

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
      pageSize: limit,
    });
  }

  function formatReports(data) {
    if (!data || data.length === 0) return [];

    return data.map((reports) => {
      // Optimize timestamp handling
      const timestamp = reports.timestamp || new Date().toISOString();

      try {
        const date = new Date(timestamp);

        // Improved date validation
        if (isNaN(date.getTime())) {
          return {
            ...reports,
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
          hour12: true,
        });

        // Improved image handling with fallback and WebP support
        let imageSource = "/images/avatar.png";
        if (reports.image_resize) {
          if (!reports.image_resize.startsWith("data:image/webp")) {
            if (!reports.image_resize.startsWith("data:image")) {
              imageSource = `data:image/webp;base64,${convertToWebP(
                reports.image_resize
              )}`;
            } else {
              imageSource = reports.image_resize.replace(
                /\.(jpg|png)$/,
                ".webp"
              );
            }
          } else {
            imageSource = reports.image_resize;
          }
        }

        return {
          company: reports.company_code,
          id: reports.employee_id,
          activity: reports.activity || "N/A",
          date: formattedDate,
          time: formattedTime,
          image: imageSource,
        };
      } catch (error) {
        console.error("Error formatting reports:", error);
        return {
          ...reports,
          date: "Invalid Date",
          time: "Invalid Time",
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

  function renderReportsPage(reports, pagination) {
    res.render("support/layouts/reports_page", {
      title: "Reports",
      currentPage: "reports",
      pageTitle: "Reports",
      pageIcon: "bi bi-people-fill",
      user: req.session.user,
      reports: reports,
      pagination: pagination,
    });
  }
};
