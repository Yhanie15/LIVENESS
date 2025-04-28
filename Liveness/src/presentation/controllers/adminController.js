const AdminService = require("../../application/services/AdminService")
const AdminRepository = require("../../infrastructure/repositories/adminRepository")
const AdminEntity = require("../../entities/AdminEntity")
const ReportsService = require("../../application/services/ReportsService")
const TransactionlogsService = require("../../application/services/TransactionlogsService")
const UserManagementService = require("../../application/services/UserManagementService")
const path = require("path")

// Dashboard and redirection
exports.redirectToDashboard = (req, res) => {
  res.redirect("/admin/dashboard")
}

exports.dashboard = (req, res) => {
  console.log("Admin Dashboard route accessed, user:", req.session.user)
  res.render("admin/layouts/admin_dashboard_page", {
    title: "Admin Dashboard",
    currentPage: "dashboard",
    pageTitle: "Admin Dashboard",
    pageIcon: "bi-grid-1x2-fill",
    user: req.session.user,
    layout: "admin/layouts/admin-main-layout",
  })
}

exports.reports = async (req, res) => {
  console.log("Reports route accessed, user:", req.session.user)

  try {
    // Get page and limit from query parameters
    const page = req.query.page || 1
    const limit = req.query.limit || 10

    // Fetch transaction logs using the ReportsService
    const { logs, pagination } = await ReportsService.getAllLogs(page, limit)

    res.render("admin/layouts/admin_reports_page", {
      title: "Reports",
      currentPage: "reports",
      pageTitle: "Reports",
      pageIcon: "bi bi-bar-chart-fill",
      user: req.session.user,
      reports: logs,
      pagination: pagination,
      layout: "admin/layouts/admin-main-layout",
    })
  } catch (error) {
    console.error("Error fetching transaction logs:", error)
    res.status(500).send("Error loading transaction logs")
  }
}

// Update the transactionlogs function to use the TransactionlogsService
exports.transactionlogs = async (req, res) => {
  console.log("Admin transactionlogs route accessed, user:", req.session.user)

  try {
    // Get page, limit, and search from query parameters
    const page = req.query.page || 1
    const limit = req.query.limit || 10
    const search = req.query.search || ''  // Add this line to capture search parameter

    // Use the TransactionlogsService to fetch and format the data (now including search parameter)
    const { transactions, pagination } = await TransactionlogsService.getAllTransactionlogs(page, limit, search)

    res.render("admin/layouts/admin_transactionlogs_page", {
      title: "Transactionlogs",
      currentPage: "Transactionlogs",
      pageTitle: "Admin Transactionlogs",
      pageIcon: "bi bi-bar-chart-fill",
      user: req.session.user,
      layout: "admin/layouts/admin-main-layout",
      transactions: transactions,
      pagination: pagination,
      searchTerm: search,  // Pass the search term to the view for display
    })
  } catch (error) {
    console.error("Error in transactionlogs controller:", error)

    // Handle the error gracefully
    res.render("admin/layouts/admin_transactionlogs_page", {
      title: "Transactionlogs",
      currentPage: "Transactionlogs",
      pageTitle: "Admin Transactionlogs",
      pageIcon: "bi bi-bar-chart-fill",
      user: req.session.user,
      layout: "admin/layouts/admin-main-layout",
      transactions: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 10,
      },
      searchTerm: req.query.search || '',  // Include search term even in error state
    })
  }
}

exports.userManagement = async (req, res) => {
  console.log("Admin User Management route accessed, user:", req.session.user);
  
  try {
    // Get page, limit, and search parameters from query string
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const search = req.query.search || '';
    
    // Get users from the UserManagementService
    const { users, pagination } = await UserManagementService.getAllUsers(page, limit, search);
    
    // Map users to match the expected format in the template
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.username, // Using username as name for display
      email: user.email,
      compCode: user.compCode, // Use compCode instead of company_code
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.render("admin/layouts/admin_user_management", {
      title: "User Management",
      currentPage: "user-management",
      pageTitle: "User Management",
      pageIcon: "bi bi-people-fill",
      user: req.session.user,
      layout: "admin/layouts/admin-main-layout",
      users: formattedUsers, // Pass formatted users to the template
      pagination: pagination, // Pass pagination data
      searchTerm: search // Pass search term for form persistence
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    
    // Render the page with an error but empty users array
    res.render("admin/layouts/admin_user_management", {
      title: "User Management",
      currentPage: "user-management",
      pageTitle: "User Management",
      pageIcon: "bi bi-people-fill",
      user: req.session.user,
      layout: "admin/layouts/admin-main-layout",
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 10
      },
      searchTerm: req.query.search || '',
      error: "Failed to fetch users. Please try again."
    });
  }
};

// --- Authentication Functions ---

// Login View
exports.login_view = (req, res) => {
  console.log("Admin Login view accessed")

  // Use a fallback object if req.session is undefined
  const sessionData = req.session || {}
  const message = sessionData.message || null
  const error = sessionData.error || null

  // Only try to delete if req.session exists
  if (req.session) {
    delete req.session.message
    delete req.session.error
  }

  // Use the admin's auth layout consistently
  res.render("admin/layouts/auth-layout", {
    title: "Admin Login",
    pageTitle: "Admin Login",
    currentPage: "login",
    userType: "admin",
    message,
    error,
    layout: "admin/layouts/auth-layout", // Use admin's own layout
  })
}

// Login POST
exports.login_post = async (req, res) => {
  console.log("Admin Login post received:", req.body)

  try {
    const { username, password } = req.body

    if (!username || !password) {
      console.log("Missing username or password")
      req.session.error = "Username and password are required"
      return res.redirect("/admin/login")
    }

    console.log(`Attempting login for admin: ${username}`)

    const { token, admin, expirationTime } = await AdminService.login(username, password)

    console.log("Login successful, setting session data")

    // Set session data
    req.session.user = {
      id: admin.id,
      username: admin.username,
      compCode: admin.compCode,
      role: "admin", // Add role to distinguish from support users
    }
    req.session.token = token
    req.session.expiration = expirationTime
    req.session.message = "Admin logged in successfully"

    console.log("Session data set:", {
      user: req.session.user,
      tokenExists: !!req.session.token,
      expiration: req.session.expiration,
    })

    // Explicitly save the session and handle the callback properly
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err)
        req.session.error = "Session error. Please try again."
        return res.redirect("/admin/login")
      }

      console.log("Session saved successfully. Redirecting to admin dashboard.")
      return res.redirect("/admin/dashboard")
    })
  } catch (error) {
    console.error("Login error:", error.message, error.stack)

    // Set specific error message based on the error type
    if (error.message === "Username Not Found" || error.message === "Incorrect Password") {
      req.session.error = error.message
    } else {
      req.session.error = "Something went wrong! Please try again."
    }

    console.log("Setting error in session:", req.session.error)

    // Save session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session after login error:", err)
      }
      return res.redirect("/admin/login")
    })
  }
}

// Forgot Password View
exports.forgotPassword_view = (req, res) => {
  const message = req.session.message || null
  const error = req.session.error || null
  delete req.session.message
  delete req.session.error

  res.render("admin/layouts/auth-layout", {
    title: "Admin Forgot Password",
    pageTitle: "Admin Forgot Password",
    currentPage: "forgot password",
    message,
    error,
    layout: "admin/layouts/auth-layout", // Use admin's own layout
  })
}

// Forgot Password POST
exports.forgotPassword_post = async (req, res) => {
  try {
    const { username, email } = req.body

    if (!username || !email) {
      req.session.error = "Username and email are required"
      return res.redirect("/admin/forgot-password")
    }

    await AdminService.forgotPassword(username, email)
    req.session.message = "Password reset link sent to your email."
    return res.redirect("/admin/forgot-password")
  } catch (err) {
    console.error("Forgot password error:", err)
    req.session.error = err.message
    return res.redirect("/admin/forgot-password")
  }
}

// Reset Password View
exports.resetPassword_view = async (req, res) => {
  const { token } = req.query
  if (!token) {
    return res.status(400).send("Token is missing.")
  }

  try {
    const admin = await AdminRepository.findByResetToken(token)
    if (!admin) {
      return res.status(400).send("Invalid or expired token.")
    }

    const message = req.session.message || null
    const error = req.session.error || null
    delete req.session.message
    delete req.session.error

    return res.render("admin/layouts/auth-layout", {
      title: "Admin Reset Password",
      pageTitle: "Admin Reset Password",
      currentPage: "reset password",
      token,
      message,
      error,
      layout: "admin/layouts/auth-layout", // Use admin's own layout
    })
  } catch (error) {
    console.error("Reset password view error:", error)
    return res.status(500).send("An error occurred.")
  }
}

// Reset Password POST
exports.resetPassword_post = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body

    if (!token || !password || !confirmPassword) {
      req.session.error = "All fields are required"
      return res.redirect(`/admin/reset-password?token=${token}`)
    }

    // Validate that both passwords match
    if (password !== confirmPassword) {
      req.session.error = "Passwords do not match."
      return res.redirect(`/admin/reset-password?token=${token}`)
    }

    // Call the service with the actual password
    await AdminService.resetPassword(token, password)
    req.session.message = "Password reset successfully!"
    return res.redirect("/admin/login")
  } catch (err) {
    console.error("Reset password error:", err)
    req.session.error = err.message
    return res.redirect(`/admin/reset-password?token=${req.body.token}`)
  }
}

// Registration View
exports.register_view = (req, res) => {
  // Retrieve messages from the session (if any)
  const message = req.session.message || null
  const error = req.session.error || null

  if (req.session) {
    delete req.session.message
    delete req.session.error
  }

  res.render("admin/layouts/auth-layout", {
    title: "Admin Register",
    pageTitle: "Admin Register",
    currentPage: "register",
    message,
    error,
    layout: "admin/layouts/auth-layout", // Use admin's own layout
  })
}

// Registration POST
exports.register_post = async (req, res) => {
  try {
    const { username, password, email, compCode } = req.body

    if (!username || !password || !email || !compCode) {
      req.session.error = "All fields are required"
      return res.redirect("/admin/register")
    }

    const adminEntity = new AdminEntity({ username, password, email, compCode })
    await AdminService.register(adminEntity)
    req.session.message = "Registration successful! Please log in."
    res.redirect("/admin/login")
  } catch (err) {
    console.error("Error registering admin:", err)
    req.session.error = err.message
    res.redirect("/admin/register")
  }
}

// Logout
exports.logout = (req, res) => {
  console.log("Admin Logout requested")

  // Store the redirect URL before destroying the session
  const redirectUrl = "/admin/login"

  req.session.destroy((err) => {
    if (err) {
      console.error("Error during session destruction:", err)
      return res.redirect("/admin/dashboard")
    }

    // Clear the session cookie
    res.clearCookie("connect.sid")
    console.log("Session destroyed and cookie cleared")

    // Use a direct response instead of a redirect to break potential redirect loops
    return res.status(200).send(`
      <html>
        <head>
          <title>Logged Out</title>
          <script>
            // Use window.location for client-side redirect to avoid server redirect loops
            window.location.href = "${redirectUrl}";
          </script>
        </head>
        <body>
          <p>You have been logged out. Redirecting to login page...</p>
        </body>
      </html>
    `)
  })
}

