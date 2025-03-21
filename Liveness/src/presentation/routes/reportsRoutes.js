const express = require("express")
const router = express.Router()
const reportsController = require("../controllers/reportsController")    
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware")

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

router.get("/reports", reportsController.reports_view)

router.use(TokenAuthenticated)

module.exports = router