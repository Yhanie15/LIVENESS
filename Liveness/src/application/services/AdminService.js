const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const moment = require("moment")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const AdminRepository = require("../../infrastructure/repositories/adminRepository")
const AdminEntity = require("../../entities/AdminEntity")

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

class AdminService {
  constructor(adminRepository) {
    this.adminRepository = adminRepository
  }

  async validatePassword(admin, password) {
    console.log("Validating password")
    try {
      const result = await bcrypt.compare(password, admin.password)
      console.log("Password validation result:", result)
      return result
    } catch (error) {
      console.error("Error validating password:", error)
      throw new Error("Password validation failed")
    }
  }

  async generateToken(admin) {
    console.log("Generating token for admin:", admin.username)

    if (!process.env.JWT_SECRET_ADMIN) {
      console.error("JWT_SECRET_ADMIN environment variable is not set")
      throw new Error("Server configuration error")
    }

    try {
      const token = jwt.sign(
        {
          id: admin.id,
          username: admin.username,
          compCode: admin.compCode,
          role: "admin",
        },
        process.env.JWT_SECRET_ADMIN,
        { expiresIn: "8h" }, // Token valid for 8 hours
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

        // Find admin by ID to refresh the token
        const admin = await this.adminRepository.findById(decoded.id)
        if (!admin) return { needsRefresh: false, token }

        // Generate fresh token
        const newToken = await this.generateToken(admin)
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
      // Find admin by username
      const admin = await this.adminRepository.findByUsername(username)

      if (!admin) {
        console.log(`Admin not found with username: ${username}`)
        throw new Error("Username Not Found")
      }

      console.log(`Admin found: ${admin.username}, validating password`)

      const isPasswordValid = await this.validatePassword(admin, password)

      if (!isPasswordValid) {
        console.log("Password validation failed")
        throw new Error("Incorrect Password")
      }

      console.log("Password validated, generating token")
      const token = await this.generateToken(admin)
      const decoded = jwt.decode(token)

      if (!decoded || !decoded.exp) {
        console.error("Token decoding failed")
        throw new Error("Token expiration decoding failed")
      }

      const expirationTime = new Date(decoded.exp * 1000).toLocaleString("en-PH", { timeZone: "Asia/Manila" })

      console.log(`Login successful for: ${username}, token expires: ${expirationTime}`)

      return {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          compCode: admin.compCode,
          email: admin.email,
        },
        expirationTime,
      }
    } catch (error) {
      console.error(`Login error for ${username}:`, error)
      throw error
    }
  }

  async register(adminEntity) {
    console.log("Register service called for username:", adminEntity.username)

    try {
      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString("en-GB")
      const formattedTime = currentDate.toLocaleTimeString("en-GB", { hour12: false })
      const formattedDateTime = `${formattedDate} ${formattedTime}`

      adminEntity.createdAt = formattedDateTime
      adminEntity.updatedAt = formattedDateTime

      adminEntity.validate()

      const existingAdmin = await this.adminRepository.findByUsername(adminEntity.username)

      if (existingAdmin) {
        console.log(`Username ${adminEntity.username} already exists`)
        throw new Error("Username already exists")
      }
      const hashedPassword = await bcrypt.hash(adminEntity.password, 10)
      adminEntity.password = hashedPassword

      await this.adminRepository.save(adminEntity)
      console.log(`Admin ${adminEntity.username} registered successfully`)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  async forgotPassword(username, email) {
    console.log(`Forgot password requested for username: ${username}, email: ${email}`)

    try {
      const admin = await this.adminRepository.findByUsername(username)

      if (!admin || admin.email !== email) {
        console.log("Admin not found or email does not match")
        throw new Error("Admin not found or email does not match.")
      }

      const resetToken = crypto.randomBytes(32).toString("hex")
      const expirationTime = new Date(Date.now() + 3600000) // 1 hour from now

      const resetURL = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`
        : `http://localhost:3000/admin/reset-password?token=${resetToken}`

      const mailOptions = {
        to: admin.email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Use the following link to reset your password: ${resetURL}. This link is valid for 1 hour.`,
      }

      await transporter.sendMail(mailOptions)
      await this.adminRepository.storeResetToken(admin.id, resetToken, expirationTime)

      console.log(`Reset token generated and email sent to ${admin.email}`)
      return { message: "EMAIL SENT" }
    } catch (error) {
      console.error("Forgot password error:", error)
      throw error
    }
  }

  async resetPassword(resetToken, newPassword) {
    console.log("Reset password requested with token")

    try {
      const admin = await this.adminRepository.findByResetToken(resetToken)

      if (!admin || new Date(admin.resetTokenExpiration) < new Date()) {
        console.log("Invalid or expired reset token")
        throw new Error("Invalid or expired reset token.")
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await this.adminRepository.updatePassword(admin.id, hashedPassword)
      await this.adminRepository.clearResetToken(admin.id)

      console.log(`Password reset successful for admin: ${admin.username}`)
      return { message: "Password reset successfully." }
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }
}

module.exports = new AdminService(AdminRepository)

