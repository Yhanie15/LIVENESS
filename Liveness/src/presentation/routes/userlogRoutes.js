// userlogRoutes.js
const express = require("express");
const router = express.Router();
const userlogController = require("../controllers/userlogController");
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware");

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

router.get("/userlogs", TokenAuthenticated, userlogController.userlog_view);

module.exports = router;