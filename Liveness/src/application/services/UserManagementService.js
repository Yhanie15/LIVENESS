const AdminRepository = require("../../infrastructure/repositories/adminRepository")

class UserManagementService {
  /**
   * Get all users with pagination
   * @param {number} page - Current page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Users and pagination data
   */
  async getAllUsers(page = 1, limit = 10) {
    try {
      // This is a placeholder. Replace with actual implementation
      // that fetches users from your database
      const users = await AdminRepository.findAll(page, limit)
      const total = await AdminRepository.count()

      return {
        users,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          pageSize: Number.parseInt(limit),
        },
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(userData) {
    try {
      // Validate user data
      if (!userData.username || !userData.password || !userData.email || !userData.compCode) {
        throw new Error("Missing required fields")
      }

      // Check if username already exists
      const existingUser = await AdminRepository.findByUsername(userData.username)
      if (existingUser) {
        throw new Error("Username already exists")
      }

      // Create user
      const newUser = await AdminRepository.create(userData)
      return newUser
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  /**
   * Update an existing user
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, userData) {
    try {
      // Check if user exists
      const existingUser = await AdminRepository.findById(id)
      if (!existingUser) {
        throw new Error("User not found")
      }

      // Update user
      const updatedUser = await AdminRepository.update(id, userData)
      return updatedUser
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteUser(id) {
    try {
      // Check if user exists
      const existingUser = await AdminRepository.findById(id)
      if (!existingUser) {
        throw new Error("User not found")
      }

      // Delete user
      await AdminRepository.delete(id)
      return true
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }
}

module.exports = new UserManagementService()

