// src/infrastructure/repositories/adminRepository.js
const db = require("../database");
const Admin = require("../../entities/AdminEntity");

class AdminRepository {
  // Helper function to execute queries and handle results
  async executeQuery(query, params) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          console.error("Repository: Error executing query:", err);
          return reject(err);
        }
        resolve(results);
      });
    });
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
    });
  }

  // Find an admin by username
  async findByUsername(username) {
    const query = `SELECT * FROM Admin WHERE username = ?`;
    console.log(`Repository: Searching for admin with username: ${username}`);
    const rows = await this.executeQuery(query, [username]);

    if (rows && rows.length > 0) {
      console.log("Repository: Admin search result: Found");
      return this.createAdminEntity(rows[0]);
    } else {
      console.log("Repository: Admin search result: Not found");
      return null;
    }
  }

  // Save a new admin record
  async save(adminEntity) {
    const { username, password, email, compCode, createdAt, updatedAt } = adminEntity;
    const query = `
      INSERT INTO Admin (username, password, email, compCode, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)`;

    console.log(`Repository: Saving new admin: ${username}`);
    return new Promise((resolve, reject) => {
      db.query(query, [username, password, email, compCode, createdAt, updatedAt], function (err, result) {
        if (err) {
          console.error("Repository: Error saving admin:", err);
          return reject(err);
        }
        console.log(`Repository: Admin saved with ID: ${result.insertId}`);
        resolve(result.insertId);
      });
    });
  }

  // Update an existing admin record
  async update(adminEntity) {
    const { id, username, password, compCode, updatedAt } = adminEntity;
    const query = `
      UPDATE Admin 
      SET username = ?, password = ?, compCode = ?, updatedAt = ? 
      WHERE id = ?`;

    console.log(`Repository: Updating admin with ID: ${id}`);
    return new Promise((resolve, reject) => {
      db.query(query, [username, password, compCode, updatedAt, id], function (err, result) {
        if (err) {
          console.error("Repository: Error updating admin:", err);
          return reject(err);
        }
        console.log(`Repository: Admin updated, rows affected: ${result.affectedRows}`);
        resolve(result.affectedRows);
      });
    });
  }

  // Count employees by company code
  async count(compCode) {
    const query = `SELECT COUNT(*) AS count FROM Employee WHERE compCode = ?`;
    const rows = await this.executeQuery(query, [compCode]);
    return rows && rows.length > 0 ? rows[0].count : 0;
  }

  // Count employees with a given status (e.g., Active, Inactive, Pending)
  async countStatus(compCode, empStat) {
    const query = `SELECT COUNT(*) AS count FROM Employee WHERE compCode = ? AND empStat = ?`;
    const rows = await this.executeQuery(query, [compCode, empStat]);
    return rows && rows.length > 0 ? rows[0].count : 0;
  }

  // Count records by status for a specific date; action can be 'in', 'out', or empty
  async countByStatus(compCode, date, action = null) {
    let query = `
      SELECT COUNT(*) AS count
      FROM Record
      INNER JOIN Employee ON Record.empID = Employee.id
      WHERE Employee.compCode = ? AND Record.date = ?`;

    if (action) {
      query += ` AND Record.act = ?`;
    }

    const params = action ? [compCode, date, action] : [compCode, date];
    const rows = await this.executeQuery(query, params);
    return rows && rows.length > 0 ? rows[0].count : 0;
  }

  // Get recent users (limit 5) by company code
  async getRecentUsers(compCode) {
    const query = `SELECT fname, lname FROM Employee WHERE compCode = ? ORDER BY createdAt DESC LIMIT 5`;
    const rows = await this.executeQuery(query, [compCode]);
    return rows || [];
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
        date ASC`;

    const rows = await this.executeQuery(query, [compCode]);
    return rows || [];
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
        earliest_time DESC`;

    const rows = await this.executeQuery(query, [compCode]);
    return rows || [];
  }

  // Get active users for maps (today)
  async getMapsActiveUsersToday(compCode) {
    const query = `
      SELECT fname, lname, address, img, lat, \`long\`, time
      FROM Record
      INNER JOIN Employee e ON e.id = Record.empID
      WHERE e.compCode = ? AND Record.date = CURDATE() AND Record.act = 'in'`;

    const rows = await this.executeQuery(query, [compCode]);
    return rows || [];
  }

  // Store a reset token and its expiration for an admin
  async storeResetToken(adminId, hashedToken, tokenExpiration) {
    const query = `UPDATE Admin SET resetToken = ?, resetTokenExpiration = ? WHERE id = ?`;
    console.log(`Repository: Storing reset token for admin ID: ${adminId}`);

    return new Promise((resolve, reject) => {
      db.query(query, [hashedToken, tokenExpiration, adminId], function (err, result) {
        if (err) {
          console.error("Repository: Error storing reset token:", err);
          return reject(err);
        }
        console.log(`Repository: Reset token stored, rows affected: ${result.affectedRows}`);
        resolve(result.affectedRows);
      });
    });
  }

  // Find an admin by reset token
  async findByResetToken(resetToken) {
    const query = `SELECT * FROM Admin WHERE resetToken = ?`;
    console.log("Repository: Searching for admin by reset token");
    const rows = await this.executeQuery(query, [resetToken]);

    if (rows && rows.length > 0) {
      return this.createAdminEntity(rows[0]);
    } else {
      console.log("Repository: Admin search by token result: Not found");
      return null;
    }
  }

  // Update an admin's password
  async updatePassword(adminId, newPassword) {
    const query = `UPDATE Admin SET password = ? WHERE id = ?`;
    console.log(`Repository: Updating password for admin ID: ${adminId}`);
    return new Promise((resolve, reject) => {
      db.query(query, [newPassword, adminId], function (err, result) {
        if (err) {
          console.error("Repository: Error updating password:", err);
          return reject(err);
        }
        console.log(`Repository: Password updated, rows affected: ${result.affectedRows}`);
        resolve(result.affectedRows);
      });
    });
  }

  // Clear the reset token and its expiration
  async clearResetToken(adminId) {
    const query = `UPDATE Admin SET resetToken = NULL, resetTokenExpiration = NULL WHERE id = ?`;
    console.log(`Repository: Clearing reset token for admin ID: ${adminId}`);
    return new Promise((resolve, reject) => {
      db.query(query, [adminId], function (err, result) {
        if (err) {
          console.error("Repository: Error clearing reset token:", err);
          return reject(err);
        }
        console.log(`Repository: Reset token cleared, rows affected: ${result.affectedRows}`);
        resolve(result.affectedRows);
      });
    });
  }

  // Find an admin by id
  async findById(id) {
    const query = `SELECT * FROM Admin WHERE id = ?`;
    console.log(`Repository: Searching for admin with id: ${id}`);
    const rows = await this.executeQuery(query, [id]);

    if (rows && rows.length > 0) {
      return this.createAdminEntity(rows[0]);
    } else {
      console.log("Repository: Admin search result: Not found");
      return null;
    }
  }
}

module.exports = new AdminRepository();