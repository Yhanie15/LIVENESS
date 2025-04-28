const AdminRepository = require("../../infrastructure/repositories/adminRepository")
const db = require("../../infrastructure/database")

class UserManagementService {
  /**
   * Get all users with pagination
   * @param {number} page - Current page number
   * @param {number} limit - Number of items per page
   * @param {string} search - Search term for filtering users
   * @returns {Promise<Object>} - Users and pagination data
   */
  async getAllUsers(page = 1, limit = 10, search = '') {
    try {
      // Convert page and limit to integers
      page = parseInt(page, 10);
      limit = parseInt(limit, 10);
      
      // Calculate offset for SQL query
      const offset = (page - 1) * limit;
      
      // Build the base query
      let query = `
        SELECT id, username, email, compCode, 
               createdAt, updatedAt
        FROM support
      `;
      
      // Add search condition if search term is provided
      const params = [];
      if (search && search.trim() !== '') {
        query += ` WHERE username LIKE ? OR email LIKE ? OR compCode LIKE ?`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      
      // Count total records (for pagination)
      let countQuery = `SELECT COUNT(*) as total FROM support`;
      if (search && search.trim() !== '') {
        countQuery += ` WHERE username LIKE ? OR email LIKE ? OR compCode LIKE ?`;
      }
      
      // Add pagination to the main query
      query += ` ORDER BY username ASC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      // Execute the queries
      const users = await this.executeQuery(query, params);
      const countResult = await this.executeQuery(countQuery, 
        search && search.trim() !== '' ? 
        [`%${search}%`, `%${search}%`, `%${search}%`] : 
        []
      );
      
      const total = countResult[0].total;
      
      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  /**
   * Execute a database query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - Query results
   */
  executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(userData) {
    try {
      // Validate user data
      if (!userData.username || !userData.email || !userData.password || !userData.compCode) {
        throw new Error("Missing required fields");
      }

      // Check if email already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Create SQL query for inserting user
      const now = new Date().toISOString();
      const query = `
        INSERT INTO support
        (username, email, password, compCode, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        userData.username,
        userData.email,
        userData.password, // Note: In a production environment, this should be hashed
        userData.compCode,
        now,
        now
      ];

      // Execute query
      const result = await this.executeQuery(query, params);
      
      // Return the newly created user
      const newUser = {
        id: result.insertId,
        username: userData.username,
        email: userData.email,
        compCode: userData.compCode,
        createdAt: now,
        updatedAt: now
      };
      
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User or null if not found
   */
  async getUserByEmail(email) {
    const query = "SELECT * FROM support WHERE email = ?";
    const results = await this.executeQuery(query, [email]);
    return results.length > 0 ? results[0] : null;
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
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error("User not found");
      }

      // Prepare update fields
      const now = new Date().toISOString();
      let query = `UPDATE support SET updatedAt = ?`;
      let params = [now];

      // Only update provided fields
      if (userData.username) {
        query += ', username = ?';
        params.push(userData.username);
      }

      if (userData.email) {
        query += ', email = ?';
        params.push(userData.email);
      }

      if (userData.password) {
        query += ', password = ?';
        params.push(userData.password); // Note: In production, this should be hashed
      }

      if (userData.compCode) {
        query += ', compCode = ?';
        params.push(userData.compCode);
      }

      // Add WHERE clause
      query += ' WHERE id = ?';
      params.push(id);

      // Execute the query
      await this.executeQuery(query, params);
      
      // Get and return the updated user
      return await this.getUserById(id);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User or null if not found
   */
  async getUserById(id) {
    const query = "SELECT * FROM support WHERE id = ?";
    const results = await this.executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteUser(id) {
    try {
      // Check if user exists
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error("User not found");
      }

      // Delete user
      const query = "DELETE FROM support WHERE id = ?";
      await this.executeQuery(query, [id]);
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}

module.exports = new UserManagementService();