// src/presentation/routes/supportRoutes.js
const express = require("express")
const router = express.Router()
const supportController = require("../controllers/supportController")
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware")

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Public Authentication Routes
router.get("/support/register", supportController.register_view)
router.post("/support/register", supportController.register_post)
router.get("/support/login", supportController.login_view)
router.post("/support/login", supportController.login_post)
router.get("/support/forgot-password", supportController.forgotPassword_view)
router.post("/support/forgot-password", supportController.forgotPassword_post)
router.get("/support/reset-password", supportController.resetPassword_view)
router.post("/support/reset-password", supportController.resetPassword_post)
router.get("/logout", supportController.logout)

// Apply the TokenAuthenticated middleware for all subsequent routes
router.use(TokenAuthenticated)

// Protected Routes
// router.get("/", supportController.redirectToDashboard)
// router.get("/dashboard", supportController.dashboard)

module.exports = router

