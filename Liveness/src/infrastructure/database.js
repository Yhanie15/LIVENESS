const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: '192.168.100.36',
  user: 'lv_dev',
  password: 'liveness',
  database: 'liveness'
});

// Connect to MySQL
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create Admin table if it doesn't exist
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
`;

connection.query(createAdminTableQuery, (err) => {
  if (err) {
    console.error('Error creating Admin table:', err);
  } else {
    console.log('Admin table is ready');
  }
});

// Create transactions table if it doesn't exist
// const createTransactionsTableQuery = `
//   CREATE TABLE IF NOT EXISTS transactions (
//     id INT PRIMARY KEY AUTO_INCREMENT,
//     transaction_no VARCHAR(50) NOT NULL,
//     company_code VARCHAR(50) NOT NULL,
//     employee_id VARCHAR(50) NOT NULL,
//     status VARCHAR(20) NOT NULL,
//     score DECIMAL(5,2) NOT NULL,
//     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//     image_data LONGTEXT
//   )
// `;

// connection.query(createTransactionsTableQuery, (err) => {
//   if (err) {
//     console.error('Error creating transactions table:', err);
//   } else {
//     console.log('Transactions table is ready');
//   }
// });

module.exports = connection;