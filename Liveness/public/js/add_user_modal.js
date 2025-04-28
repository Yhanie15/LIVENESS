// Add User Modal functionality
document.addEventListener('DOMContentLoaded', function () {
    // Get the add user button
    const addUserBtn = document.querySelector('.add-user-btn');
 
    // Add event listener to the button - using click instead of any other event
    if (addUserBtn) {
        // Remove any existing event listeners first (in case they're duplicated)
        addUserBtn.replaceWith(addUserBtn.cloneNode(true));
 
        // Get the fresh reference
        const freshAddUserBtn = document.querySelector('.add-user-btn');
 
        // Add a single click event listener
        freshAddUserBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
 
            // Initialize and show the modal using Bootstrap's modal API
            const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'), {
                backdrop: 'static', // Prevents closing when clicking outside
                keyboard: true // Allows ESC key to close
            });
 
            // Show the modal
            addUserModal.show();
        });
    }
 
    // Form submission handling
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', function (event) {
            event.preventDefault();
 
            // Get form data
            const formData = new FormData(addUserForm);
            const userData = Object.fromEntries(formData.entries());
 
            // Send form data to server using fetch API
            fetch('/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Network response was not ok');
                })
                .then(data => {
                    // Hide modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                    modal.hide();
 
                    // Refresh the page to show the new user
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error:', error);
                    // Display error message to user
                    alert('Failed to add user. Please try again.');
                });
        });
    }
});
 