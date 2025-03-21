exports.reports_view = (req, res) => {
    console.log("Dashboard route accessed, user:", req.session.user)
    res.render("admin/layouts/reports_page", {
      title: "Reports",
      currentPage: "reports",
      pageTitle: "Reports",
      pageIcon: "bi bi-bar-chart-fill",
      user: req.session.user,
    })
  }