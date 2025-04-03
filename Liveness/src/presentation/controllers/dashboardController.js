// src/controllers/dashboardController.js
const axios = require('axios');

class DashboardController {
  /**
   * Render the dashboard page
   */
  async renderDashboard(req, res) {
    try {
      res.render("support/layouts/dashboard_page", {
        title: "Dashboard",
        currentPage: "dashboard",
        pageTitle: "Dashboard",
        pageIcon: "bi-grid-1x2-fill",
        user: req.session.user,
      });
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      res.status(500).send('Error loading dashboard');
    }
  }

  /**
   * Fetch transactions data from the API
   */
  async getTransactions(req, res) {
    try {
      const apiUrl = process.env.API_URL || 'http://192.168.6.93:5001/api/transactions';
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      
      const response = await axios.get(`${apiUrl}?page=${page}&limit=${limit}`);
      
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch transactions',
        message: error.message
      });
    }
  }
}

module.exports = new DashboardController();