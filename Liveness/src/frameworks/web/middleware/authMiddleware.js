// src/frameworks/web/middleware/authMiddleware.js
const jwt = require("jsonwebtoken")

exports.TokenAuthenticated = (req, res, next) => {
  // console.log("=== Authentication Check ===")
  // console.log("Session exists:", !!req.session)
  // console.log("Session user:", req.session.user ? JSON.stringify(req.session.user) : "Not set")
  // console.log("Session token:", req.session.token ? "Exists" : "Not set")

  // Check if session exists
  if (!req.session) {
    console.log("No session found. Redirecting to login.")
    return res.redirect("/support/login")
  }

  // Check if user and token exist in session
  if (!req.session.user || !req.session.token) {
    console.log("No user or token in session. Redirecting to login.")
    return res.redirect("/support/login")
  }

  try {
    // Check if JWT_SECRET_ADMIN is set
    if (!process.env.JWT_SECRET_ADMIN) {
      console.error("JWT_SECRET_ADMIN environment variable is not set")
      req.session.error = "Server configuration error"
      return res.redirect("/support/login")
    }

    // Verify the token
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET_ADMIN)
    console.log("Token verified successfully. Decoded payload:", JSON.stringify(decoded))

    // Check if token is about to expire (less than 5 minutes remaining)
    const currentTime = Math.floor(Date.now() / 1000)
    const timeRemaining = decoded.exp - currentTime
    console.log(`Token expires in ${timeRemaining} seconds`)

    // Only refresh the session if the expiration is close
    if (timeRemaining < 300) {
      console.log("Token is about to expire. Refreshing...")
      // Create a new token with a new expiration time
      const newToken = jwt.sign(
        { 
          username: decoded.username, 
          compCode: decoded.compCode || req.session.user.compCode 
        },
        process.env.JWT_SECRET_ADMIN,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
      );
      
      // Update the token in the session
      req.session.token = newToken;
      
      // Touch the session to reset its expiration
      req.session.touch();
      
      console.log("Token refreshed successfully");
    }

    // Check if the token username matches the session username
    if (decoded.username !== req.session.user.username) {
      console.log("Token username does not match session username. Redirecting to login.")
      req.session.error = "Session mismatch. Please log in again."
      return res.redirect("/support/login")
    }

    // Token is valid, proceed
    console.log("Authentication successful. Proceeding to route handler.")
    next()
  } catch (error) {
    console.error("Token verification error:", error)

    // Handle different JWT errors
    if (error.name === "TokenExpiredError") {
      req.session.error = "Your session has expired. Please log in again."
    } else if (error.name === "JsonWebTokenError") {
      req.session.error = "Invalid session. Please log in again."
    } else {
      req.session.error = "Authentication error. Please log in again."
    }

    // Clear the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session after auth failure:", err)
      }
      res.redirect("/support/login")
    })
  }
}

// For API requests - returns JSON instead of redirecting
exports.ApiAuthenticated = (req, res, next) => {
  console.log("=== API Authentication Check ===")

  // Check if session exists
  if (!req.session || !req.session.user || !req.session.token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please log in again."
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET_ADMIN)
    
    // Refresh token if needed (similar to above)
    const currentTime = Math.floor(Date.now() / 1000)
    const timeRemaining = decoded.exp - currentTime
    
    if (timeRemaining < 300) {
      const newToken = jwt.sign(
        { 
          username: decoded.username, 
          compCode: decoded.compCode || req.session.user.compCode 
        },
        process.env.JWT_SECRET_ADMIN,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
      );
      
      req.session.token = newToken;
      req.session.touch();
    }

    // Token is valid, proceed
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed. Please log in again."
    });
  }
}