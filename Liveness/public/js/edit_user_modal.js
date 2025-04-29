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
    }
 
    // Setup event listeners for modal buttons
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
 
    // Save changes action
    saveBtn.addEventListener('click', function () {
        if (currentUserId) {
            const userData = {
                id: currentUserId,
                name: fullNameInput.value,
                email: emailInput.value,
                company_code: companyCodeInput.value
            };
 
            console.log('Saving changes for user ID:', currentUserId, userData);
 
            // Here you would typically make an API call to update the user
            // Example: updateUser(userData).then(() => {
            //    // Update the user card in the DOM to reflect changes
            //    updateUserCardInUI(currentUserId, userData);
            // });
 
            // For demo/testing - update the UI directly
            updateUserCardInUI(currentUserId, userData);
 
            closeModal();
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
        }
    }
 
    // Close modal if clicking outside of it
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });
 
    // Initialize edit buttons
    setupEditButtons();
});