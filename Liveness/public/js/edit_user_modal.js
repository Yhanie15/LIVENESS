// public/js/edit_user_modal.js
 
document.addEventListener('DOMContentLoaded', function () {
    console.log('Edit user modal script loaded');
 
    // Modal elements
    const modal = document.getElementById('editUserModal');
 
    // Exit if modal doesn't exist on this page
    if (!modal) {
        console.log('Edit user modal not found on this page');
        return;
    }
 
    const closeBtn = modal.querySelector('.edit-user-modal-close-btn');
    const cancelBtn = document.getElementById('cancelEditUserBtn');
    const saveBtn = document.getElementById('confirmEditUserBtn');
 
    // Form fields
    const fullNameInput = document.getElementById('editFullName');
    const emailInput = document.getElementById('editEmail');
    const companyCodeInput = document.getElementById('editCompanyCode');
    const formFields = [fullNameInput, emailInput, companyCodeInput];
 
    // Current user being edited
    let currentUserId = null;
 
    // Setup edit button listeners on all user cards
    function setupEditButtons() {
        const editButtons = document.querySelectorAll('.btn-edit[data-user-id]');
        console.log('Found', editButtons.length, 'edit buttons');
 
        editButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                // Prevent default behavior
                e.preventDefault();
                e.stopPropagation();
 
                // Store the user ID to be edited
                currentUserId = this.getAttribute('data-user-id');
 
                // Get the user data from the card
                const userCard = this.closest('.user-card');
                if (userCard) {
                    // Get user data from the card - using correct selectors that match the HTML structure
                    const userName = userCard.querySelector('.user-name').textContent;
                    
                    // Fix: Get the correct elements from the user card
                    const userDetails = userCard.querySelectorAll('.user-detail .detail-text');
                    const userEmail = userDetails[0].textContent.trim();
                    const userCompanyCode = userDetails[1].textContent.trim();
 
                    // Set form values
                    fullNameInput.value = userName;
                    emailInput.value = userEmail;
                    companyCodeInput.value = userCompanyCode;
                    
                    // Clear any existing errors
                    formFields.forEach(field => clearFieldError(field));
                }
 
                // Show the modal
                modal.classList.remove('hidden');
 
                console.log('Edit modal opened for user ID:', currentUserId);
            });
        });
    }
 
    // Close modal function
    function closeModal() {
        modal.classList.add('hidden');
        currentUserId = null;
 
        // Clear form fields
        fullNameInput.value = '';
        emailInput.value = '';
        companyCodeInput.value = '';
        
        // Clear any field errors
        formFields.forEach(field => clearFieldError(field));
    }
 
    // Setup event listeners for modal buttons
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
 
    // Function to validate form inputs
    function validateFormInputs() {
        let isValid = true;
        
        // Validate name
        if (!fullNameInput.value.trim()) {
            showFieldError(fullNameInput, 'Full name is required');
            isValid = false;
        } else {
            clearFieldError(fullNameInput);
        }
        
        // Validate email
        if (!emailInput.value.trim()) {
            showFieldError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
            showFieldError(emailInput, 'Please enter a valid email');
            isValid = false;
        } else {
            clearFieldError(emailInput);
        }
        
        // Validate company code
        if (!companyCodeInput.value.trim()) {
            showFieldError(companyCodeInput, 'Company code is required');
            isValid = false;
        } else {
            clearFieldError(companyCodeInput);
        }
        
        return isValid;
    }
    
    // Function to show field error
    function showFieldError(field, message) {
        // Clear any existing error
        clearFieldError(field);
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-danger mt-1';
        errorElement.textContent = message;
        
        // Insert after the field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
        
        // Add error class to the field
        field.classList.add('is-invalid');
    }
    
    // Function to clear field error
    function clearFieldError(field) {
        // Remove any existing error message
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.className.includes('field-error')) {
            errorElement.remove();
        }
        
        // Remove error class
        field.classList.remove('is-invalid');
    }
    
    // Function to validate email format
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Function to show notification banner
    function showNotification(message, type) {
        // Check if notification container exists, create if not
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() {
            notification.remove();
        };
        notification.appendChild(closeBtn);
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    // Function to update user via API
    async function updateUserAPI(userId, userData) {
        try {
            // Generate CSRF token from cookies if needed
            // const csrfToken = document.cookie.split('; ').find(row => row.startsWith('CSRF-TOKEN=')).split('=')[1];
            
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Include CSRF token if your app uses it
                    // 'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    username: userData.name,
                    email: userData.email,
                    compCode: userData.company_code
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
 
    // Save changes action
    saveBtn.addEventListener('click', async function () {
        if (!currentUserId) {
            console.error('No user ID found for update');
            showNotification('Error: No user selected for update', 'error');
            return;
        }
        
        // Validate form inputs
        if (!validateFormInputs()) {
            console.log('Form validation failed');
            return;
        }
        
        // Show loading state
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        const userData = {
            id: currentUserId,
            name: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            company_code: companyCodeInput.value.trim()
        };
 
        console.log('Saving changes for user ID:', currentUserId, userData);
 
        try {
            // Make API call to update the user
            const result = await updateUserAPI(currentUserId, userData);
            
            // Update the user card in the UI
            updateUserCardInUI(currentUserId, userData);
            
            // Show success notification
            showNotification(result.message || 'User updated successfully', 'success');
            
            // Close the modal
            closeModal();
        } catch (error) {
            // Show error notification
            showNotification(error.message || 'Failed to update user', 'error');
            console.error('Error saving user:', error);
        } finally {
            // Reset button state
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    });
 
    // Function to update the user card in the UI with new data
    function updateUserCardInUI(userId, userData) {
        const userCard = document.querySelector(`.user-card .btn-edit[data-user-id="${userId}"]`).closest('.user-card');
 
        if (userCard) {
            userCard.querySelector('.user-name').textContent = userData.name;
            const userDetails = userCard.querySelectorAll('.user-detail .detail-text');
            userDetails[0].textContent = userData.email;
            userDetails[0].setAttribute('title', userData.email);
            userDetails[1].textContent = userData.company_code;
 
            console.log('User card updated in UI');
        } else {
            console.error('User card not found in the DOM');
        }
    }
 
    // Close modal if clicking outside of it
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });
 
    // Add keyboard handler for the modal (Escape key closes it)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
 
    // Initialize edit buttons
    setupEditButtons();
});