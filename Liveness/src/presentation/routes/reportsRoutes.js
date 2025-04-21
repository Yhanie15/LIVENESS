const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware");

// Performance optimization middleware
router.use((req, res, next) => {
  // Add cache control headers
  res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  
  // Performance logging
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${duration}ms`);
  });
  
  next();
});

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add performance monitoring to reports route
router.get("/reports", (req, res, next) => {
  // Additional performance headers
  res.set('X-Performance-Marker', 'reports-page');
  next();
}, TokenAuthenticated, reportsController.reports_view);

module.exports = router;