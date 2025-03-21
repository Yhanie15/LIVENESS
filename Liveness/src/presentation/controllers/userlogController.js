exports.userlog_view = (req, res) => {
  // Define columns for the userlog table
  const columns = [
    { header: 'COMPANY CODE', key: 'company' },
    { header: 'EMPLOYEE ID', key: 'id' },
    { header: 'DEPARTMENT', key: 'department' },
    { header: 'ACTIVITY', key: 'activity' },
    { header: 'IMAGE', key: 'image' , type: 'image' },
    { header: 'DATE', key: 'date' },
    { header: 'TIME', key: 'time' },
  ];
  
  // Sample data for user logs (you would replace this with database queries)
  const dataItems = [
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM'},
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' },
    { company: 'LOG-001', id: 'USR-101', department: 'admin', activity: 'LOGIN', image:  '/img/profile1.jpg', date: 'Feb 14, 2025', time: '8:30 AM' }
  ];
  
  res.render("admin/layouts/userlog_page", {
    title: "User Logs",
    currentPage: "userlogs",
    pageTitle: "Userlog",
    pageIcon: "bi bi-people-fill",
    user: req.session.user,
    columns: columns,
    dataItems: dataItems
  });
}
