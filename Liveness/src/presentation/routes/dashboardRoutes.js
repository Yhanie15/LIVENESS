const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const { TokenAuthenticated} = require("../../frameworks/web/middleware/authMiddleware")

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

router.get("/", adminController.redirectToDashboard)
router.get("/dashboard", adminController.dashboard)

router.use(TokenAuthenticated)

module.exports = router