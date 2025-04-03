const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware")

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Public Authentication Routes - remove the /admin prefix since we're mounting at /admin
router.get("/register", adminController.register_view)
router.post("/register", adminController.register_post)
router.get("/login", adminController.login_view)
router.post("/login", adminController.login_post)
router.get("/forgot-password", adminController.forgotPassword_view)
router.post("/forgot-password", adminController.forgotPassword_post)
router.get("/reset-password", adminController.resetPassword_view)
router.post("/reset-password", adminController.resetPassword_post)
router.get("/logout", adminController.logout)

// Apply the TokenAuthenticated middleware for all subsequent routes
router.use(TokenAuthenticated)

// Protected Routes
router.get("/", adminController.redirectToDashboard) // Root route for /admin
router.get("/dashboard", adminController.dashboard) // This is the correct path
router.get("/transactionlog", adminController.transactionlog) // This is the correct path
router.get("/reports", adminController.reports) // This is the correct path
router.get("/settings/user-management", adminController.userManagement) // This is the correct path

module.exports = router

