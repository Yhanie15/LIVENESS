// src/presentation/controllers/supportController.js
const SupportService = require("../../application/services/SupportService");
const SupportRepository = require("../../infrastructure/repositories/supportRepository");
const SupportEntity = require("../../entities/SupportEntity");

// Dashboard and redirection
exports.redirectToDashboard = (req, res) => {
  res.redirect("/dashboard");
};

exports.dashboard = (req, res) => {
  console.log("Dashboard route accessed, user:", req.session.user);
  // Retrieve the dynamic login activity from the session (if any)
  const loginActivity = req.session.loginActivity || null;
  // Clear the loginActivity from session after retrieval
  if (req.session.loginActivity) {
    delete req.session.loginActivity;
  }
  res.render("support/layouts/dashboard_page", {
    title: "Dashboard",
    currentPage: "dashboard",
    pageTitle: "Dashboard",
    pageIcon: "bi-grid-1x2-fill",
    user: req.session.user,
    // Pass the loginActivity to the view
    loginActivity: loginActivity,
  });
};

// --- Authentication Functions ---

// Login View
exports.login_view = (req, res) => {
  console.log("Login view accessed");

  const sessionData = req.session || {};
  const message = sessionData.message || null;
  const error = sessionData.error || null;

  if (req.session) {
    delete req.session.message;
    delete req.session.error;
  }

  res.render("support/layouts/auth-layout", {
    title: "Login",
    pageTitle: "Login",
    message,
    error,
    layout: "support/layouts/auth-layout",
  });
};

// Login POST with improved activity tracking and employee_id handling
exports.login_post = async (req, res) => {
  console.log("Login post received:", req.body);

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("Missing username or password");
      req.session.error = "Username and password are required";
      return res.redirect("/support/login");
    }

    console.log(`Attempting login for user: ${username}`);

    const { token, support, expirationTime } = await SupportService.login(
      username,
      password
    );

    console.log("Login successful, setting session data");

    req.session.user = {
      id: support.id,
      username: support.username,
      compCode: support.compCode,
      employee_id: support.employee_id || null,  // Include employee_id if available
    };
    req.session.token = token;
    req.session.expiration = expirationTime;
    req.session.message = "Support logged in successfully";

    // Record login activity with improved error handling and employee_id inclusion
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP";
    
    try {
      await SupportRepository.addLoginActivity(
        support.username,
        "Logged in",
        support.compCode,
        ipAddress,
        support.employee_id  // Pass employee_id to the repository
      );
      
      // Store current login for immediate display
      req.session.loginActivity = {
        username: support.username,
        employee_id: support.employee_id || null,
        action: "Logged in",
        time: new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" }),
        date: new Date().toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }),
        ipAddress: ipAddress,
      };
      
      console.log("Login activity recorded successfully");
    } catch (activityError) {
      console.error("Error recording login activity:", activityError);
      // Continue with login even if activity recording fails
    }

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        req.session.error = "Session error. Please try again.";
        return res.redirect("/support/login");
      }

      console.log("Session saved. Redirecting to dashboard.");
      return res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Login error:", error.message, error.stack);
    req.session.error =
      error.message === "Username Not Found" || error.message === "Incorrect Password"
        ? error.message
        : "Something went wrong! Please try again.";
    req.session.save((err) => {
      if (err) console.error("Error saving session after login error:", err);
      return res.redirect("/support/login");
    });
  }
};

// Forgot Password View
exports.forgotPassword_view = (req, res) => {
  const message = req.session.message || null;
  const error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;

  res.render("support/layouts/auth-layout", {
    title: "Forgot Password",
    pageTitle: "Forgot Password",
    currentPage: "forgot password",
    message,
    error,
    layout: "support/layouts/auth-layout",
  });
};

// Forgot Password POST
exports.forgotPassword_post = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      req.session.error = "Username and email are required";
      return res.redirect("/support/forgot-password");
    }

    await SupportService.forgotPassword(username, email);
    req.session.message = "Password reset link sent to your email.";
    return res.redirect("/support/forgot-password");
  } catch (err) {
    console.error("Forgot password error:", err);
    req.session.error = err.message;
    return res.redirect("/support/forgot-password");
  }
};

// Reset Password View
exports.resetPassword_view = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send("Token is missing.");
  }

  try {
    const support = await SupportRepository.findByResetToken(token);
    if (!support) {
      return res.status(400).send("Invalid or expired token.");
    }

    const message = req.session.message || null;
    const error = req.session.error || null;
    delete req.session.message;
    delete req.session.error;

    return res.render("support/layouts/auth-layout", {
      title: "Reset Password",
      pageTitle: "Reset Password",
      currentPage: "reset password",
      token,
      message,
      error,
      layout: "support/layouts/auth-layout",
    });
  } catch (error) {
    console.error("Reset password view error:", error);
    return res.status(500).send("An error occurred.");
  }
};

// Reset Password POST
exports.resetPassword_post = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      req.session.error = "All fields are required";
      return res.redirect(`/support/reset-password?token=${token}`);
    }

    if (password !== confirmPassword) {
      req.session.error = "Passwords do not match.";
      return res.redirect(`/support/reset-password?token=${token}`);
    }

    await SupportService.resetPassword(token, password);
    req.session.message = "Password reset successfully!";
    return res.redirect("/support/login");
  } catch (err) {
    console.error("Reset password error:", err);
    req.session.error = err.message;
    return res.redirect(`/support/reset-password?token=${req.body.token}`);
  }
};

// Registration View
exports.register_view = (req, res) => {
  const message = req.session.message || null;
  const error = req.session.error || null;

  if (req.session) {
    delete req.session.message;
    delete req.session.error;
  }

  res.render("support/layouts/auth-layout", {
    title: "Register",
    pageTitle: "Register",
    message,
    error,
    layout: "support/layouts/auth-layout",
  });
};

// Registration POST
exports.register_post = async (req, res) => {
  try {
    const { username, password, email, compCode } = req.body;

    if (!username || !password || !email || !compCode) {
      req.session.error = "All fields are required";
      return res.redirect("/support/register");
    }

    const supportEntity = new SupportEntity({
      username,
      password,
      email,
      compCode,
    });
    await SupportService.register(supportEntity);
    req.session.message = "Registration successful! Please log in.";
    res.redirect("/support/login");
  } catch (err) {
    console.error("Error registering support:", err);
    req.session.error = err.message;
    res.redirect("/support/register");
  }
};

// Logout with improved activity tracking including employee_id
exports.logout = async (req, res) => {
  console.log("Logout requested");

  // Save user info before destroying session
  const userData = req.session.user ? { ...req.session.user } : null;
  
  if (userData) {
    const ipAddress = req.headers["x-forwarded-for"] || 
                     req.socket.remoteAddress || 
                     "Unknown IP";
    try {
      await SupportRepository.addLoginActivity(
        userData.username,
        "Logged out",
        userData.compCode,
        ipAddress,
        userData.employee_id  // Include employee_id in logout activity
      );
      console.log("Logout activity recorded for", userData.username, userData.employee_id ? `(Employee ID: ${userData.employee_id})` : '');
    } catch (error) {
      console.error("Error recording logout activity:", error);
      // Continue with logout even if activity recording fails
    }
  }

  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    res.clearCookie("connect.sid");
    console.log("Session destroyed and cookie cleared");
    return res.redirect("/support/login");
  } catch (err) {
    console.error("Error during session destruction:", err);
    return res.redirect("/dashboard");
  }
};

// Updated endpoint to return the current user's history with employee_id filtering
exports.getLoginHistory = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { username, compCode, employee_id } = req.session.user;
    
    console.log(`Fetching login history for user: ${username}, compCode: ${compCode}, employee_id: ${employee_id || 'Not provided'}`);
    
    if (!username || !compCode) {
      return res.status(400).json({ 
        error: "Missing required user data", 
        message: "Username or company code is missing from session" 
      });
    }
    
    const loginHistory = await SupportRepository.getLoginHistory(compCode, username, employee_id);
    
    if (!Array.isArray(loginHistory)) {
      console.error("Login history is not an array:", loginHistory);
      return res.status(500).json({ error: "Invalid login history format" });
    }
    
    console.log(`Found ${loginHistory.length} login history records`);
    
    return res.status(200).json(loginHistory);
  } catch (error) {
    console.error("Error fetching login history:", error);
    return res.status(500).json({ 
      error: "Failed to fetch login history", 
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    console.log("API Register user request received:", req.body);
    
    const { name, email, password, compCode } = req.body;

    // Validate required fields
    if (!name || !password || !email || !compCode) {
      console.log("Missing required fields");
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }
    
    // Call the service to create the user
    const userData = {
      name,      // This is the username from the form
      email,
      password,
      compCode
    };
    
    const newUser = await SupportService.createSupportUser(userData);
    
    console.log("User created successfully:", newUser.username);
    
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        compCode: newUser.compCode
      }
    });
  } catch (error) {
    console.error("API Error registering user:", error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || "Error creating user" 
    });
  }
};