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
  