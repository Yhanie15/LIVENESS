// src/presentation/controllers/supportController.js
const SupportService = require("../../application/services/SupportService")
const SupportRepository = require("../../infrastructure/repositories/supportRepository")
const SupportEntity = require("../../entities/SupportEntity")

// Dashboard and redirection
exports.redirectToDashboard = (req, res) => {
  res.redirect("/dashboard")
}

exports.dashboard = (req, res) => {
  console.log("Dashboard route accessed, user:", req.session.user)
  res.render("support/layouts/dashboard_page", {
    title: "Dashboard",
    currentPage: "dashboard",
    pageTitle: "Dashboard",
    pageIcon: "bi-grid-1x2-fill",
    user: req.session.user,
  })
}

// --- Authentication Functions ---

// Login View
exports.login_view = (req, res) => {
  console.log("Login view accessed")

  // Use a fallback object if req.session is undefined
  const sessionData = req.session || {}
  const message = sessionData.message || null
  const error = sessionData.error || null

  // Only try to delete if req.session exists
  if (req.session) {
    delete req.session.message
    delete req.session.error
  }

  res.render("support/layouts/auth-layout", {
    title: "Login",
    pageTitle: "Login",
    message,
    error,
    layout: "support/layouts/auth-layout", // override default layout for auth pages
  })
}

// Login POST
exports.login_post = async (req, res) => {
  console.log("Login post received:", req.body)

  try {
    const { username, password } = req.body

    if (!username || !password) {
      console.log("Missing username or password")
      req.session.error = "Username and password are required"
      return res.redirect("/support/login")
    }

    console.log(`Attempting login for user: ${username}`)

    const { token, support, expirationTime } = await SupportService.login(username, password)

    console.log("Login successful, setting session data")

    // Set session data
    req.session.user = {
      id: support.id,
      username: support.username,
      compCode: support.compCode,
    }
    req.session.token = token
    req.session.expiration = expirationTime
    req.session.message = "Support logged in successfully"

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
        return res.redirect("/support/login")
      }

      console.log("Session saved successfully. Redirecting to dashboard.")
      return res.redirect("/dashboard")
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
      return res.redirect("/support/login")
    })
  }
}

// Forgot Password View
exports.forgotPassword_view = (req, res) => {
  const message = req.session.message || null
  const error = req.session.error || null
  delete req.session.message
  delete req.session.error

  res.render("support/layouts/auth-layout", {
    title: "Forgot Password",
    pageTitle: "Forgot Password",
    currentPage: "forgot password",
    message,
    error,
    layout: "support/layouts/auth-layout",
  })
}

// Forgot Password POST
exports.forgotPassword_post = async (req, res) => {
  try {
    const { username, email } = req.body

    if (!username || !email) {
      req.session.error = "Username and email are required"
      return res.redirect("/support/forgot-password")
    }

    await SupportService.forgotPassword(username, email)
    req.session.message = "Password reset link sent to your email."
    return res.redirect("/support/forgot-password")
  } catch (err) {
    console.error("Forgot password error:", err)
    req.session.error = err.message
    return res.redirect("/support/forgot-password")
  }
}

// Reset Password View
exports.resetPassword_view = async (req, res) => {
  const { token } = req.query
  if (!token) {
    return res.status(400).send("Token is missing.")
  }

  try {
    const support = await SupportRepository.findByResetToken(token)
    if (!support) {
      return res.status(400).send("Invalid or expired token.")
    }

    const message = req.session.message || null
    const error = req.session.error || null
    delete req.session.message
    delete req.session.error

    return res.render("support/layouts/auth-layout", {
      title: "Reset Password",
      pageTitle: "Reset Password",
      currentPage: "reset password",
      token,
      message,
      error,
      layout: "support/layouts/auth-layout",
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
      return res.redirect(`/support/reset-password?token=${token}`)
    }

    // Validate that both passwords match
    if (password !== confirmPassword) {
      req.session.error = "Passwords do not match."
      return res.redirect(`/support/reset-password?token=${token}`)
    }

    // Call the service with the actual password
    await SupportService.resetPassword(token, password)
    req.session.message = "Password reset successfully!"
    return res.redirect("/support/login")
  } catch (err) {
    console.error("Reset password error:", err)
    req.session.error = err.message
    return res.redirect(`/support/reset-password?token=${req.body.token}`)
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

  res.render("support/layouts/auth-layout", {
    title: "Register",
    pageTitle: "Register",
    message,
    error,
    layout: "support/layouts/auth-layout", // explicitly use the auth layout
  })
}

// Registration POST
exports.register_post = async (req, res) => {
  try {
    const { username, password, email, compCode } = req.body

    if (!username || !password || !email || !compCode) {
      req.session.error = "All fields are required"
      return res.redirect("/support/register")
    }

    const supportEntity = new SupportEntity({ username, password, email, compCode })
    await SupportService.register(supportEntity)
    req.session.message = "Registration successful! Please log in."
    res.redirect("/support/login")
  } catch (err) {
    console.error("Error registering support:", err)
    req.session.error = err.message
    res.redirect("/support/register")
  }
}

// Logout
exports.logout = (req, res) => {
  console.log("Logout requested")

  req.session.destroy((err) => {
    if (err) {
      console.error("Error during session destruction:", err)
      return res.redirect("/dashboard")
    }

    // Clear the session cookie
    res.clearCookie("connect.sid")
    console.log("Session destroyed and cookie cleared")
    return res.redirect("/support/login")
  })
}

