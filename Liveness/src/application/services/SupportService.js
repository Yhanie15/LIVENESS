// src/application/services/SupportService.js
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const moment = require("moment")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const SupportRepository = require("../../infrastructure/repositories/supportRepository")
const SupportEntity = require("../../entities/SupportEntity")

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

class SupportService {
  constructor(supportRepository) {
    this.supportRepository = supportRepository
  }

  async validatePassword(support, password) {
    console.log("Validating password")
    try {
      const result = await bcrypt.compare(password, support.password)
      console.log("Password validation result:", result)
      return result
    } catch (error) {
      console.error("Error validating password:", error)
      throw new Error("Password validation failed")
    }
  }

  async generateToken(support) {
    console.log("Generating token for support:", support.username)

    if (!process.env.JWT_SECRET_SUPPORT) {
      console.error("JWT_SECRET_SUPPORT environment variable is not set")
      throw new Error("Server configuration error")
    }

    try {
      const token = jwt.sign(
        {
          id: support.id,
          username: support.username,
          compCode: support.compCode,
          role: "support",
        },
        process.env.JWT_SECRET_SUPPORT,
        { expiresIn: "8h" }, // Extend token validity from 1h to 8h
      )
      console.log("Token generated successfully")
      return token
    } catch (error) {
      console.error("Error generating token:", error)
      throw new Error("Token generation failed")
    }
  }

  async refreshTokenIfNeeded(token) {
    try {
      const decoded = jwt.decode(token)
      if (!decoded) return { needsRefresh: false, token }

      // If token will expire in next 30 minutes, refresh it
      const expiryThreshold = Math.floor(Date.now() / 1000) + 30 * 60
      if (decoded.exp < expiryThreshold) {
        console.log("Token expiring soon, refreshing...")

        // Find support by ID to refresh the token
        const support = await this.supportRepository.findById(decoded.id)
        if (!support) return { needsRefresh: false, token }

        // Generate fresh token
        const newToken = await this.generateToken(support)
        return { needsRefresh: true, token: newToken }
      }

      return { needsRefresh: false, token }
    } catch (error) {
      console.error("Error refreshing token:", error)
      return { needsRefresh: false, token }
    }
  }

  async login(username, password) {
    console.log(`Login service called for username: ${username}`)

    try {
      // Find support by username
      const support = await this.supportRepository.findByUsername(username)

      if (!support) {
        console.log(`Support not found with username: ${username}`)
        throw new Error("Username Not Found")
      }

      console.log(`Support found: ${support.username}, validating password`)

      const isPasswordValid = await this.validatePassword(support, password)

      if (!isPasswordValid) {
        console.log("Password validation failed")
        throw new Error("Incorrect Password")
      }

      console.log("Password validated, generating token")
      const token = await this.generateToken(support)
      const decoded = jwt.decode(token)

      if (!decoded || !decoded.exp) {
        console.error("Token decoding failed")
        throw new Error("Token expiration decoding failed")
      }

      const expirationTime = new Date(decoded.exp * 1000).toLocaleString("en-PH", { timeZone: "Asia/Manila" })

      console.log(`Login successful for: ${username}, token expires: ${expirationTime}`)

      return {
        token,
        support: {
          id: support.id,
          username: support.username,
          compCode: support.compCode,
          email: support.email,
        },
        expirationTime,
      }
    } catch (error) {
      console.error(`Login error for ${username}:`, error)
      throw error
    }
  }

  async createSupportUser(userData) {
    console.log("Creating support user:", userData.name)
    
    try {
      // Create current date and time
      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString("en-GB")
      const formattedTime = currentDate.toLocaleTimeString("en-GB", { hour12: false })
      const formattedDateTime = `${formattedDate} ${formattedTime}`
      
      // Create Support Entity
      const supportEntity = new SupportEntity({
        username: userData.name,
        email: userData.email,
        password: userData.password,
        compCode: userData.compCode,
        createdAt: formattedDateTime,
        updatedAt: formattedDateTime
      })
      
      // Validate the entity
      supportEntity.validate()
      
      // Check if username already exists
      const existingSupport = await this.supportRepository.findByUsername(supportEntity.username)
      if (existingSupport) {
        console.log(`Username ${supportEntity.username} already exists`)
        throw new Error("Username already exists")
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(supportEntity.password, 10)
      supportEntity.password = hashedPassword
      
      // Save to database
      const savedSupport = await this.supportRepository.save(supportEntity)
      console.log(`Support user ${supportEntity.username} created successfully`)
      
      return {
        id: savedSupport.id,
        username: savedSupport.username,
        email: savedSupport.email,
        compCode: savedSupport.compCode
      }
    } catch (error) {
      console.error("Error creating support user:", error)
      throw error
    }
  }

  async register(supportEntity) {
    console.log("Register service called for username:", supportEntity.username)

    try {
      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString("en-GB")
      const formattedTime = currentDate.toLocaleTimeString("en-GB", { hour12: false })
      const formattedDateTime = `${formattedDate} ${formattedTime}`

      supportEntity.createdAt = formattedDateTime
      supportEntity.updatedAt = formattedDateTime

      supportEntity.validate()

      const existingSupport = await this.supportRepository.findByUsername(supportEntity.username)

      if (existingSupport) {
        console.log(`Username ${supportEntity.username} already exists`)
        throw new Error("Username already exists")
      }
      const hashedPassword = await bcrypt.hash(supportEntity.password, 10)
      supportEntity.password = hashedPassword

      await this.supportRepository.save(supportEntity)
      console.log(`Support ${supportEntity.username} registered successfully`)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  async forgotPassword(username, email) {
    console.log(`Forgot password requested for username: ${username}, email: ${email}`)

    try {
      const support = await this.supportRepository.findByUsername(username)

      if (!support || support.email !== email) {
        console.log("Support not found or email does not match")
        throw new Error("Support not found or email does not match.")
      }

      const resetToken = crypto.randomBytes(32).toString("hex")
      const expirationTime = new Date(Date.now() + 3600000) // 1 hour from now

      const resetURL = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/support/reset-password?token=${resetToken}`
        : `http://localhost:3005/support/reset-password?token=${resetToken}`

      const mailOptions = {
        to: support.email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Use the following link to reset your password: ${resetURL}. This link is valid for 1 hour.`,
      }

      await transporter.sendMail(mailOptions)
      await this.supportRepository.storeResetToken(support.id, resetToken, expirationTime)

      console.log(`Reset token generated and email sent to ${support.email}`)
      return { message: "EMAIL SENT" }
    } catch (error) {
      console.error("Forgot password error:", error)
      throw error
    }
  }

  async resetPassword(resetToken, newPassword) {
    console.log("Reset password requested with token")

    try {
      const support = await this.supportRepository.findByResetToken(resetToken)

      if (!support || new Date(support.resetTokenExpiration) < new Date()) {
        console.log("Invalid or expired reset token")
        throw new Error("Invalid or expired reset token.")
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await this.supportRepository.updatePassword(support.id, hashedPassword)
      await this.supportRepository.clearResetToken(support.id)

      console.log(`Password reset successful for support: ${support.username}`)
      return { message: "Password reset successfully." }
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }
}

module.exports = new SupportService(SupportRepository)