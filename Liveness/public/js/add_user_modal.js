// Add User Modal Functionality with Password Toggle and Enhanced Feedback
document.addEventListener('DOMContentLoaded', function () {
    // Get modal elements
    const addUserModal = document.getElementById('addUserModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const closeBtn = addUserModal.querySelector('.add-user-modal-close-btn');
    const cancelBtn = addUserModal.querySelector('.add-user-btn-cancel');
    const addUserForm = document.getElementById('addUserForm');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordField = document.getElementById('password');
    
    // Feedback elements
    const feedbackContainer = document.createElement('div');
    feedbackContainer.classList.add('add-user-feedback');
    addUserModal.querySelector('.add-user-modal-body').prepend(feedbackContainer);
    
    // Function to show feedback message
    function showFeedback(message, isSuccess) {
        feedbackContainer.textContent = message;
        feedbackContainer.className = 'add-user-feedback';
        feedbackContainer.classList.add(isSuccess ? 'success' : 'error');
        feedbackContainer.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            feedbackContainer.style.display = 'none';
        }, 5000);
    }
    
    // Function to reset form and feedback
    function resetForm() {
        addUserForm.reset();
        feedbackContainer.style.display = 'none';
    }
 
    // Password toggle functionality
    passwordToggle.addEventListener('click', function() {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
       
        // Toggle icon between eye and eye-slash
        const toggleIcon = this.querySelector('i');
        if (type === 'password') {
            toggleIcon.classList.remove('bi-eye-slash');
            toggleIcon.classList.add('bi-eye');
        } else {
            toggleIcon.classList.remove('bi-eye');
            toggleIcon.classList.add('bi-eye-slash');
        }
    });
 
    // Open modal when Add User button is clicked
    addUserBtn.addEventListener('click', function () {
        resetForm();
        addUserModal.classList.add('show');
    });
 
    // Close modal when X button is clicked
    closeBtn.addEventListener('click', function () {
        addUserModal.classList.remove('show');
    });
 
    // Close modal when Cancel button is clicked
    cancelBtn.addEventListener('click', function () {
        addUserModal.classList.remove('show');
    });
 
    // Prevent closing when clicking inside the modal content
    const modalContainer = addUserModal.querySelector('.add-user-modal-container');
    modalContainer.addEventListener('click', function(event) {
        event.stopPropagation();
    });
 
    // Handle form submission
    addUserForm.addEventListener('submit', function (event) {
        event.preventDefault();
        
        // Get form data
        const formData = new FormData(addUserForm);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            compCode: formData.get('compCode')
        };
        
        // Validate password length
        if (userData.password.length < 8) {
            showFeedback('Password must be at least 8 characters long', false);
            return;
        }
        
        // Disable form controls during submission
        const submitBtn = addUserForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;
 
        // Send data to server using fetch API
        fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            // Re-enable form controls
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            
            if (data.success) {
                // Show success message
                showFeedback(`User ${userData.name} added successfully!`, true);
                
                // Reset form after short delay
                setTimeout(() => {
                    addUserForm.reset();
                    
                    // Option 1: Close modal and refresh page after success
                    //addUserModal.classList.remove('show');
                    //location.reload();
                    
                    // Option 2: Keep modal open with success message
                    // This allows adding multiple users consecutively
                }, 2000);
            } else {
                showFeedback(`Error: ${data.message}`, false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            showFeedback('Network error. Please try again.', false);
        });
    });
});