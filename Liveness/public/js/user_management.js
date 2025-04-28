// User Management page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any necessary components
    initializeUserCards();
  });
 
  function initializeUserCards() {
    // Add any initialization for user cards if needed
    console.log('User management page initialized');
  }
 
  // Function to open edit page for a user
  function editUser(userId) {
    window.location.href = `/admin/users/edit/${userId}`;
  }
 
  // Function to confirm deletion of a user
  function confirmDelete(userId, userName) {
    // Set the user name in the modal
    document.getElementById('deleteUserName').textContent = userName;
   
    // Set the form action URL
    document.getElementById('deleteUserForm').action = `/admin/users/delete/${userId}`;
   
    // Show the modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
    deleteModal.show();
  }
 