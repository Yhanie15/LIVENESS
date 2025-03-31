const mysql = require("mysql2")

// Create a connection to the database
const connection = mysql.createConnection({
  host: "192.168.100.36",
  user: "lv_dev",
  password: "liveness",
  database: "liveness",
})

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err)
    return
  }
  console.log("Connected to MySQL database")
})

// Keep the existing Admin table
const createAdminTableQuery = `
  CREATE TABLE IF NOT EXISTS Admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    email VARCHAR(255),
    compCode VARCHAR(255),
    resetToken VARCHAR(255),
    resetTokenExpiration VARCHAR(255),
    createdAt VARCHAR(255),
    updatedAt VARCHAR(255)
  )
`

connection.query(createAdminTableQuery, (err) => {
  if (err) {
    console.error("Error creating Admin table:", err)
  } else {
    console.log("Admin table is ready")
  }
})

// Create a new Support table with the same structure
const createSupportTableQuery = `
  CREATE TABLE IF NOT EXISTS Support (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    email VARCHAR(255),
    compCode VARCHAR(255),
    resetToken VARCHAR(255),
    resetTokenExpiration VARCHAR(255),
    createdAt VARCHAR(255),
    updatedAt VARCHAR(255)
  )
`

connection.query(createSupportTableQuery, (err) => {
  if (err) {
    console.error("Error creating Support table:", err)
  } else {
    console.log("Support table is ready")
  }
})

module.exports = connection

