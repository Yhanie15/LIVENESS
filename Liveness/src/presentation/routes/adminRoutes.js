const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware");
const UserManagementService = require("../../application/services/UserManagementService");

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Public Authentication Routes - remove the /admin prefix since we're mounting at /admin
router.get("/register", adminController.register_view);
router.post("/register", adminController.register_post);
router.get("/login", adminController.login_view);
router.post("/login", adminController.login_post);
router.get("/forgot-password", adminController.forgotPassword_view);
router.post("/forgot-password", adminController.forgotPassword_post);
router.get("/reset-password", adminController.resetPassword_view);
router.post("/reset-password", adminController.resetPassword_post);
router.get("/logout", adminController.logout);

// Apply the TokenAuthenticated middleware for all subsequent routes
router.use(TokenAuthenticated);

// Protected Routes
router.get("/", adminController.redirectToDashboard); // Root route for /admin
router.get("/dashboard", adminController.dashboard);
router.get("/transactionlogs", adminController.transactionlogs);
router.get("/reports", adminController.reports);

// User Management Routes - consolidated to single path
router.get("/settings/user-management", adminController.userManagement);

// CRUD operations for user management - consolidated routes
router.post("/settings/user-management/create", async (req, res) => {
  try {
    await UserManagementService.createUser(req.body);
    res.redirect("/admin/settings/user-management?message=User created successfully");
  } catch (error) {
    res.redirect(`/admin/settings/user-management?error=${encodeURIComponent(error.message)}`);
  }
});

router.post("/settings/user-management/update/:id", async (req, res) => {
  try {
    await UserManagementService.updateUser(req.params.id, req.body);
    res.redirect("/admin/settings/user-management?message=User updated successfully");
  } catch (error) {
    res.redirect(`/admin/settings/user-management?error=${encodeURIComponent(error.message)}`);
  }
});

router.delete("/settings/user-management/delete/:id", async (req, res) => {
  try {
    await UserManagementService.deleteUser(req.params.id);
    res.redirect("/admin/settings/user-management?message=User deleted successfully");
  } catch (error) {
    res.redirect(`/admin/settings/user-management?error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;