const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for your SQLite database file
const dbPath = path.join(__dirname, 'database.sqlite');

// Open (or create) the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Create the Admin table
  db.run(`
    CREATE TABLE IF NOT EXISTS Admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      compCode TEXT,
      resetToken TEXT,
      resetTokenExpiration TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `, (err) => {
    if (err) console.error("Error creating Admin table:", err.message);
    else console.log("Admin table is ready.");
  });

  // Create the Employee table
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS Employee (
  //       id INTEGER PRIMARY KEY AUTOINCREMENT,
  //       compCode TEXT NOT NULL,
  //       empID TEXT NOT NULL UNIQUE,
  //       fname TEXT NOT NULL,
  //       mname TEXT,
  //       lname TEXT NOT NULL,
  //       dept TEXT NOT NULL,
  //       email TEXT NOT NULL,
  //       loc_assign INTEGER,
  //       empPic TEXT,
  //       regStat TEXT DEFAULT 'PRE-REGISTERED',
  //       empStat TEXT DEFAULT 'ACTIVE',
  //       createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  //       updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  //     )
  // `, (err) => {
  //   if (err) console.error("Error creating Employee table:", err.message);
  //   else console.log("Employee table is ready.");
  // });

  // Create the Record table
  // db.run(`
  //   CREATE TABLE IF NOT EXISTS Record (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     empID INTEGER,
  //     act TEXT,
  //     date TEXT,
  //     time TEXT,
  //     FOREIGN KEY(empID) REFERENCES Employee(id)
  //   )
  // `, (err) => {
  //   if (err) console.error("Error creating Record table:", err.message);
  //   else console.log("Record table is ready.");
  // });
});

module.exports = db;
