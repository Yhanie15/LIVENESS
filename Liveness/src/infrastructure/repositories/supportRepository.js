// src/infrastructure/repositories/supportRepository.js
const db = require("../database")
const Support = require("../../entities/SupportEntity")

class SupportRepository {
  // Helper function to execute queries and handle results
  async executeQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          console.error("Repository: Error executing query:", err)
          return reject(err)
        }
        resolve(results)
      })
    })
  }

  // Helper function to create Support entity from row data
  createSupportEntity(row) {
    return new Support({
      id: row.id,
      username: row.username,
      password: row.password,
      email: row.email || null,
      compCode: row.compCode,
      resetToken: row.resetToken || null,
      resetTokenExpiration: row.resetTokenExpiration || null,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString(),
    })
  }

  // Find a support by username
  async findByUsername(username) {
    const query = `SELECT * FROM Support WHERE username = ?`
    console.log(`Repository: Searching for support with username: ${username}`)
    const rows = await this.executeQuery(query, [username])

    if (rows && rows.length > 0) {
      console.log("Repository: Support search result: Found")
      return this.createSupportEntity(rows[0])
    } else {
      console.log("Repository: Support search result: Not found")
      return null
    }
  }

  // Save a new support record
  async save(supportEntity) {
    const { username, password, email, compCode, createdAt, updatedAt } = supportEntity
    const query = `
      INSERT INTO Support (username, password, email, compCode, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)`
  
    console.log(`Repository: Saving new support: ${username}`)
    return new Promise((resolve, reject) => {
      db.query(query, [username, password, email, compCode, createdAt, updatedAt], (err, result) => {
        if (err) {
          console.error("Repository: Error saving support:", err)
          return reject(err)
        }
        console.log(`Repository: Support saved with ID: ${result.insertId}`)
        resolve(result.insertId)
      })
    })
  }

  // Update an existing support record
  async update(supportEntity) {
    const { id, username, password, compCode, updatedAt } = supportEntity
    const query = `
      UPDATE Support 
      SET username = ?, password = ?, compCode = ?, updatedAt = ? 
      WHERE id = ?`
  
    console.log(`Repository: Updating support with ID: ${id}`)
    return new Promise((resolve, reject) => {
      db.query(query, [username, password, compCode, updatedAt, id], (err, result) => {
        if (err) {
          console.error("Repository: Error updating support:", err)
          return reject(err)
        }
        console.log(`Repository: Support updated, rows affected: ${result.affectedRows}`)
        resolve(result.affectedRows)
      })
    })
  }

  // Count employees by company code
  async count(compCode) {
    const query = `SELECT COUNT(*) AS count FROM Employee WHERE compCode = ?`
    const rows = await this.executeQuery(query, [compCode])
    return rows && rows.length > 0 ? rows[0].count : 0
  }

  // Count employees with a given status (e.g., Active, Inactive, Pending)
  async countStatus(compCode, empStat) {
    const query = `SELECT COUNT(*) AS count FROM Employee WHERE compCode = ? AND empStat = ?`
    const rows = await this.executeQuery(query, [compCode, empStat])
    return rows && rows.length > 0 ? rows[0].count : 0
  }

  // Store a reset token and its expiration for a support
  async storeResetToken(supportId, hashedToken, tokenExpiration) {
    const query = `UPDATE Support SET resetToken = ?, resetTokenExpiration = ? WHERE id = ?`
    console.log(`Repository: Storing reset token for support ID: ${supportId}`)
  
    return new Promise((resolve, reject) => {
      db.query(query, [hashedToken, tokenExpiration, supportId], (err, result) => {
        if (err) {
          console.error("Repository: Error storing reset token:", err)
          return reject(err)
        }
        console.log(`Repository: Reset token stored, rows affected: ${result.affectedRows}`)
        resolve(result.affectedRows)
      })
    })
  }
  
  // Find a support by reset token
  async findByResetToken(resetToken) {
    const query = `SELECT * FROM Support WHERE resetToken = ?`
    console.log("Repository: Searching for support by reset token")
    const rows = await this.executeQuery(query, [resetToken])
  
    if (rows && rows.length > 0) {
      return this.createSupportEntity(rows[0])
    } else {
      console.log("Repository: Support search by token result: Not found")
      return null
    }
  }
  
  // Update a support's password
  async updatePassword(supportId, newPassword) {
    const query = `UPDATE Support SET password = ? WHERE id = ?`
    console.log(`Repository: Updating password for support ID: ${supportId}`)
    return new Promise((resolve, reject) => {
      db.query(query, [newPassword, supportId], (err, result) => {
        if (err) {
          console.error("Repository: Error updating password:", err)
          return reject(err)
        }
        console.log(`Repository: Password updated, rows affected: ${result.affectedRows}`)
        resolve(result.affectedRows)
      })
    })
  }
  
  // Clear the reset token and its expiration
  async clearResetToken(supportId) {
    const query = `UPDATE Support SET resetToken = NULL, resetTokenExpiration = NULL WHERE id = ?`
    console.log(`Repository: Clearing reset token for support ID: ${supportId}`)
    return new Promise((resolve, reject) => {
      db.query(query, [supportId], (err, result) => {
        if (err) {
          console.error("Repository: Error clearing reset token:", err)
          return reject(err)
        }
        console.log(`Repository: Reset token cleared, rows affected: ${result.affectedRows}`)
        resolve(result.affectedRows)
      })
    })
  }
  
  // Find a support by id
  async findById(id) {
    const query = `SELECT * FROM Support WHERE id = ?`
    console.log(`Repository: Searching for support with id: ${id}`)
    const rows = await this.executeQuery(query, [id])
  
    if (rows && rows.length > 0) {
      return this.createSupportEntity(rows[0])
    } else {
      console.log("Repository: Support search result: Not found")
      return null
    }
  }
  
  // Add a new login activity record with employee_id support
async addLoginActivity(username, action, compCode, ipAddress, employee_id = null) {
  const currentDate = new Date();
  const time = currentDate.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" });
  const date = currentDate.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
  
  let query = '';
  let params = [];
  
  if (employee_id) {
    query = `
      INSERT INTO LoginActivity (username, action, time, date, ipAddress, compCode, employee_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    params = [username, action, time, date, ipAddress, compCode, employee_id];
  } else {
    query = `
      INSERT INTO LoginActivity (username, action, time, date, ipAddress, compCode)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    params = [username, action, time, date, ipAddress, compCode];
  }
  
  console.log(`Repository: Recording login activity for ${username}${employee_id ? ` (Employee ID: ${employee_id})` : ''}`);
  return this.executeQuery(query, params);
}

  // Get login history for a specific user based on username, compCode, and employee_id
async getLoginHistory(compCode, username, employee_id = null) {
  try {
    console.log(`Repository: Getting login history for user: ${username}, compCode: ${compCode}, employee_id: ${employee_id || 'Not provided'}`);
    
    // Build the query with parameters
    let query = `
      SELECT * FROM LoginActivity
      WHERE username = ? AND compCode = ?
    `;
    
    const params = [username, compCode];
    
    // Add employee_id filter if provided
    if (employee_id) {
      query += ` AND employee_id = ?`;
      params.push(employee_id);
    }
    
    // Finalize query with ordering and limit
    query += `
      ORDER BY createdAt DESC
      LIMIT 50
    `;
    
    const rows = await this.executeQuery(query, params);
    
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      employee_id: row.employee_id || null,
      action: row.action,
      time: new Date(row.createdAt).toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" }),
      date: new Date(row.createdAt).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }),
      ipAddress: row.ipAddress || '',
      compCode: row.compCode,
      createdAt: row.createdAt
    }));
  } catch (error) {
    console.error("Repository error fetching login history:", error);
    throw error;
  }
}
}

module.exports = new SupportRepository();
