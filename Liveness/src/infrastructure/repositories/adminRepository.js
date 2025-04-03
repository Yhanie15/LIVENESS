const db = require("../database")
const Admin = require("../../entities/AdminEntity")

class AdminRepository {
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

  // Helper function to create Admin entity from row data
  createAdminEntity(row) {
    return new Admin({
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

  // Find an admin by username
  async findByUsername(username) {
    const query = `SELECT * FROM Admin WHERE username = ?`
    console.log(`Repository: Searching for admin with username: ${username}`)
    const rows = await this.executeQuery(query, [username])

    if (rows && rows.length > 0) {
      console.log("Repository: Admin search result: Found")
      return this.createAdminEntity(rows[0])
    } else {
      console.log("Repository: Admin search result: Not found")
      return null
    }
  }

  // Save a new admin record
  async save(adminEntity) {
    const { username, password, email, compCode, createdAt, updatedAt } = adminEntity
    const query = `
      INSERT INTO Admin (username, password, email, compCode, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)`

    console.log(`Repository: Saving new admin: ${username}`)
    return new Promise((resolve, reject) => {
      db.query(query, [username, password, email, compCode, createdAt, updatedAt], (err, result) => {
        if (err) {
          console.error("Repository: Error saving admin:", err)
          return reject(err)
        }
        console.log(`Repository: Admin saved with ID: ${result.insertId}`)
        resolve(result.insertId)
      })
    })
  }

  // Update an existing admin record
  async update(adminEntity) {
    const { id, username, password, compCode, updatedAt } = adminEntity
    const query = `
      UPDATE Admin 
      SET username = ?, password = ?, compCode = ?, updatedAt = ? 
      WHERE id = ?`

    console.log(`Repository: Updating admin with ID: ${id}`)
    return new Promise((resolve, reject) => {
      db.query(query, [username, password, compCode, updatedAt, id], (err, result) => {
        if (err) {
          console.error("Repository: Error updating admin:", err)
          return reject(err)
        }
        console.log(`Repository: Admin updated, rows affected: ${result.affectedRows}`)
        resolve(result.affectedRows)
      })
    })
  }

  // Store a reset token and its expiration for an admin
  async storeResetToken(adminId, hashedToken, tokenExpiration) {
    const query = `UPDATE Admin SET resetToken = ?, resetTokenExpiration = ? WHERE id = ?`
    console.log(`Repository: Storing reset token for admin ID: ${adminId}`)

    return new Promise((resolve, reject) => {
      db.query(query, [hashedToken, tokenExpiration, adminId], (err, result) => {
        if (err) {
          console.error("Repository: Error storing reset token:", err)
          return reject(err)
        }
        console.log(`Repository: Reset token stored, rows affected: ${result.affectedRows}`)
        resolve(result.affectedRows)
      })
    })
  }

  // Find an admin by reset token
  async findByResetToken(resetToken) {
    const query = `SELECT * FROM Admin WHERE resetToken = ?`
    console.log("Repository: Searching for admin by reset token")
    const rows = await this.executeQuery(query, [resetToken])

    if (rows && rows.length > 0) {
      return this.createAdminEntity(rows[0])
    } else {
      console.log("Repository: Admin search by token result: Not found")
      return null
    }
  }

  // Update an admin's password
  async updatePassword(adminId, newPassword) {
    const query = `UPDATE Admin SET password = ? WHERE id = ?`
    console.log(`Repository: Updating password for admin ID: ${adminId}`)
    return new Promise((resolve, reject) => {
      db.query(query, [newPassword, adminId], (err, result) => {
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
  async clearResetToken(adminId) {
    const query = `UPDATE Admin SET resetToken = NULL, resetTokenExpiration = NULL WHERE id = ?`
    console.log(`Repository: Clearing reset token for admin ID: ${adminId}`)
    return new Promise((resolve, reject) => {
      db.query(query, [adminId], (err, result) => {
        if (err) {
          console.error("Repository: Error clearing reset token:", err)
          return reject(err)
        }
        console.log(`Repository: Reset token cleared, rows affected: ${result.affectedRows}`)
        resolve(result.affectedRows)
      })
    })
  }

  // Find an admin by id
  async findById(id) {
    const query = `SELECT * FROM Admin WHERE id = ?`
    console.log(`Repository: Searching for admin with id: ${id}`)
    const rows = await this.executeQuery(query, [id])

    if (rows && rows.length > 0) {
      return this.createAdminEntity(rows[0])
    } else {
      console.log("Repository: Admin search result: Not found")
      return null
    }
  }
}

module.exports = new AdminRepository()

