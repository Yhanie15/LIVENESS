const express = require("express")
const router = express.Router()
const transactionlogsController = require("../controllers/transactionlogsController")    
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware")

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
})

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Add performance monitoring to transactionlogs route
router.get("/transactionlogs", (req, res, next) => {
  // Additional performance headers
  res.set('X-Performance-Marker', 'transactionlogs-page');
  next();
}, transactionlogsController.transactionlogs_view)

router.use(TokenAuthenticated)

module.exports = router