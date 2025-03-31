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

  // Count records by status for a specific date; action can be 'in', 'out', or empty
  async countByStatus(compCode, date, action = null) {
    let query = `
      SELECT COUNT(*) AS count
      FROM Record
      INNER JOIN Employee ON Record.empID = Employee.id
      WHERE Employee.compCode = ? AND Record.date = ?`

    if (action) {
      query += ` AND Record.act = ?`
    }

    const params = action ? [compCode, date, action] : [compCode, date]
    const rows = await this.executeQuery(query, params)
    return rows && rows.length > 0 ? rows[0].count : 0
  }

  // Get recent users (limit 5) by company code
  async getRecentUsers(compCode) {
    const query = `SELECT fname, lname FROM Employee WHERE compCode = ? ORDER BY createdAt DESC LIMIT 5`
    const rows = await this.executeQuery(query, [compCode])
    return rows || []
  }

  // Get login data for analytics
  async getLoginData(compCode) {
    const query = `
      SELECT 
        date,
        COUNT(DISTINCT CASE WHEN act = 'in' THEN Record.empID END) AS login_count,
        COUNT(DISTINCT CASE WHEN act = 'out' THEN Record.empID END) AS logout_count,
        MIN(CASE WHEN act = 'in' THEN time END) AS earliest_login_time,
        COALESCE(
            AVG(CASE WHEN act = 'in' THEN 
                UNIX_TIMESTAMP(
                    CASE 
                        WHEN time LIKE '%AM' THEN REPLACE(time, ' AM', '')
                        WHEN time LIKE '%PM' THEN REPLACE(time, ' PM', '')
                        ELSE time  
                    END
                ) END), 
            0) AS avg_login_seconds,
        COALESCE(
            AVG(CASE WHEN act = 'out' THEN 
                UNIX_TIMESTAMP(
                    CASE 
                        WHEN time LIKE '%AM' THEN REPLACE(time, ' AM', '')
                        WHEN time LIKE '%PM' THEN REPLACE(time, ' PM', '')
                        ELSE time  
                    END
                ) END), 
            0) AS avg_logout_seconds,
        COALESCE(
            MAX(CASE WHEN act = 'out' THEN time END),
            'No logout recorded'
        ) AS latest_out_time
      FROM 
        Record
      INNER JOIN 
        Employee ON Record.empID = Employee.id
      WHERE 
        Employee.compCode = ?
        AND date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
      GROUP BY 
        date
      ORDER BY 
        date ASC`

    const rows = await this.executeQuery(query, [compCode])
    return rows || []
  }

  // Get daily data for the current day
  async getDailyData(compCode) {
    const query = `
      SELECT 
        Record.empID, 
        MIN(CASE WHEN Record.act = 'in' THEN Record.time END) AS earliest_time, 
        MAX(CASE WHEN Record.act = 'out' THEN Record.time END) AS latest_out_time,
        Employee.fname, 
        Employee.lname
      FROM 
        Record
      INNER JOIN 
        Employee ON Record.empID = Employee.id
      WHERE 
        Employee.compCode = ? AND Record.date = CURDATE() 
      GROUP BY 
        Record.empID, Employee.fname, Employee.lname
      ORDER BY 
        earliest_time DESC`

    const rows = await this.executeQuery(query, [compCode])
    return rows || []
  }

  // Get active users for maps (today)
  async getMapsActiveUsersToday(compCode) {
    const query = `
      SELECT fname, lname, address, img, lat, \`long\`, time
      FROM Record
      INNER JOIN Employee e ON e.id = Record.empID
      WHERE e.compCode = ? AND Record.date = CURDATE() AND Record.act = 'in'`

    const rows = await this.executeQuery(query, [compCode])
    return rows || []
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
}

module.exports = new SupportRepository()

