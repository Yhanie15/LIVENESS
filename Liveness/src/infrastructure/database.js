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

// Create LoginActivity table
const createLoginActivityTableQuery = `
 CREATE TABLE IF NOT EXISTS LoginActivity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  time VARCHAR(50),
  date VARCHAR(50),
  ipAddress VARCHAR(50),
  compCode VARCHAR(50) NOT NULL,
  employee_id VARCHAR(50) DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
`

connection.query(createLoginActivityTableQuery, (err) => {
  if (err) {
    console.error("Error creating LoginActivity table:", err)
  } else {
    console.log("LoginActivity table is ready")
  }
})

module.exports = connection

