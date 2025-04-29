// routes/api/apiRoutes.js
const express = require("express");
const router = express.Router();
const UserManagementService = require("../../application/services/UserManagementService");
const SupportService = require("../../application/services/SupportService");
const { TokenAuthenticated } = require("../../frameworks/web/middleware/authMiddleware");

// Apply auth middleware to protect API routes
router.use(TokenAuthenticated);

// User management API endpoints
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    
    // Call the service to update the user
    const updatedUser = await UserManagementService.updateUser(userId, userData);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('API Error updating user:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update user'
    });
  }
});

// Add new endpoint for creating support users
router.post('/support', async (req, res) => {
  try {
    const userData = req.body;
    
    // Call the support service to create the user
    const newSupportUser = await SupportService.createSupportUser(userData);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Support user created successfully',
      user: newSupportUser
    });
  } catch (error) {
    console.error('API Error creating support user:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create support user'
    });
  }
});

module.exports = router;