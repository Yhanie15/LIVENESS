// src/entities/SupportEntity.js
class SupportEntity {
  constructor({ id, compCode, username, password, email, resetToken, resetTokenExpiration, createdAt, updatedAt }) {
    this.id = id
    this.compCode = compCode
    this.username = username
    this.password = password
    this.email = email || null
    this.resetToken = resetToken || null
    this.resetTokenExpiration = resetTokenExpiration || null
    this.createdAt = createdAt || new Date().toISOString()
    this.updatedAt = updatedAt || new Date().toISOString()
  }

  // Validates support data
  validate() {
    if (!this.username) {
      throw new Error("Username is required")
    }

    if (!this.password) {
      throw new Error("Password is required")
    }

    if (this.password.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }

    if (!this.compCode) {
      throw new Error("Company code is required")
    }

    if (!this.email) {
      throw new Error("Email is required")
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(this.email)) {
      throw new Error("Invalid email format")
    }

    return true
  }

  // Sets a password reset token and its expiration time
  setResetToken(token, expiration) {
    this.resetToken = token
    this.resetTokenExpiration = expiration
  }

  // Clears the reset token and expiration
  clearResetToken() {
    this.resetToken = null
    this.resetTokenExpiration = null
  }
}

module.exports = SupportEntity

