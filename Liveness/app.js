// app.js - Updated with proper session configuration
require("dotenv").config()
const express = require("express")
const path = require("path")
const ejsLayouts = require("express-ejs-layouts")
const session = require("express-session")
const SQLiteStore = require("connect-sqlite3")(session)
const port = process.env.PORT || 3000
// const employeeRoutes = require("./src/presentation/routes/employeeRoutes")
const supportRoutes = require("./src/presentation/routes/supportRoutes")
const adminRoutes = require("./src/presentation/routes/adminRoutes")
const reportsRoutes = require("./src/presentation/routes/reportsRoutes")
const transactionlogsRoutes = require("./src/presentation/routes/transactionlogsRoutes")
const dashboardRoutes = require("./src/presentation/routes/dashboardRoutes")

const app = express()

// Setup session middleware with proper configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      rolling: true,
    },
    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: path.join(__dirname),
      table: "sessions",
      ttl: 24 * 60 * 60, // 1 day
    }),
  })
);

// Add session debugging middleware
// app.use((req, res, next) => {
//   console.log("Session ID:", req.session.id)
//   console.log("Session User:", req.session.user ? JSON.stringify(req.session.user) : "Not set")
//   console.log("Session Token:", req.session.token ? "Exists" : "Not set")
//   next()
// })

// ** Add Body Parsing Middleware **
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Set view engine & views path using .env settings
app.set("view engine", process.env.VIEW_ENGINE || "ejs")
app.set("views", path.join(__dirname, process.env.VIEWS_DIR || "src/presentation/views"))

// Set up the layout engine.
app.use(ejsLayouts)
app.set("layout", process.env.LAYOUT || "support/layouts/main-layout")

// Serve static files from the public directory.
app.use(express.static(path.join(__dirname, process.env.PUBLIC_DIR || "public")))

// Setup database
// const setupDatabase = require("./src/infrastructure/database/setupDatabase")
// setupDatabase()

// Run infrastructure tasks (e.g., setup images)
// require("./src/infrastructure/setupImages")()

app.use("/admin",adminRoutes)
app.use("/",supportRoutes)
app.use("/", reportsRoutes) 
app.use("/", transactionlogsRoutes)
app.use("/", dashboardRoutes)
// app.use("/", employeeRoutes)

// Start the server.
app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`)
})