// src/presentation/routes/adminRoutes.js
const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const { TokenAuthenticated} = require("../../frameworks/web/middleware/authMiddleware")

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Public Authentication Routes
router.get("/admin/register", adminController.register_view)
router.post("/admin/register", adminController.register_post)
router.get("/admin/login", adminController.login_view)
router.post("/admin/login", adminController.login_post)
router.get("/admin/forgot-password", adminController.forgotPassword_view)
router.post("/admin/forgot-password", adminController.forgotPassword_post)
router.get("/admin/reset-password", adminController.resetPassword_view)
router.post("/admin/reset-password", adminController.resetPassword_post)
router.get("/logout", adminController.logout)

// Apply the TokenAuthenticated middleware for all subsequent routes
router.use(TokenAuthenticated)

// Protected Routes
router.get("/", adminController.redirectToDashboard)
router.get("/dashboard", adminController.dashboard)

// Reports
// router.get("/reports/dtrs", adminController.reportsDtrs)
// router.get("/reports/rejected", adminController.reportsRejected)
// router.get("/reports/start-day", adminController.reportsStartDay)
// router.get("/reports/end-day", adminController.reportsEndDay)

// Reviews
// router.get("/reviews/registration", adminController.reviewsRegistration)
// router.get("/reviews/mismatch", adminController.reviewsMismatch)
// router.get("/reviews/logs", adminController.reviewsLogs)

// Settings
// router.get("/settings/page", adminController.settingsPage)
// router.get("/settings/log", adminController.settingsLog)
// router.get("/settings/users", adminController.settingsUsers)
// router.get("/settings/location", adminController.settingsLocation)
// router.get("/settings/logs-display", adminController.settingsLogsDisplay)
// router.get("/settings/reports", adminController.settingsReports)

module.exports = router