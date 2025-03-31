const express = require("express")
const router = express.Router()
const supportController = require("../controllers/supportController")
const { TokenAuthenticated} = require("../../frameworks/web/middleware/authMiddleware")

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

router.get("/", supportController.redirectToDashboard)
router.get("/dashboard", supportController.dashboard)

router.use(TokenAuthenticated)

module.exports = router