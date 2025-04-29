// public/js/delete_user_modal.js
 
document.addEventListener('DOMContentLoaded', function () {
    // Modal elements
    const modal = document.getElementById('deleteUserModal');
    const closeBtn = modal.querySelector('.delete-user-modal-close-btn');
    const cancelBtn = document.getElementById('cancelDeleteUserBtn');
    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    const modalQuestion = modal.querySelector('.delete-user-modal-question');
 
    // Current user being deleted
    let currentUserId = null;
    let currentUserName = null;
 
    // Setup delete button listeners on all user cards
    function setupDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.btn-delete[data-user-id]');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Store the user ID to be deleted
                currentUserId = this.getAttribute('data-user-id');
 
                // Try to get the user name if possible (for a more personalized confirmation)
                const userCard = this.closest('.user-card');
                if (userCard) {
                    const nameElement = userCard.querySelector('.user-name');
                    if (nameElement) {
                        currentUserName = nameElement.textContent.trim();
                        // Update the modal question with the user's name
                        modalQuestion.textContent = `Are you sure you want to delete ${currentUserName}?`;
                    } else {
                        // Reset to default message
                        modalQuestion.textContent = "Are you sure you want to delete this user?";
                    }
                } else {
                    // Handle if we're in a table view instead of cards
                    const row = this.closest('tr');
                    if (row) {
                        const nameCell = row.querySelector('td.user-name') || row.cells[1]; // Adjust index based on your table structure
                        if (nameCell) {
                            currentUserName = nameCell.textContent.trim();
                            modalQuestion.textContent = `Are you sure you want to delete ${currentUserName}?`;
                        } else {
                            modalQuestion.textContent = "Are you sure you want to delete this user?";
                        }
                    }
                }
 
                // Show the modal
                modal.classList.remove('hidden');
 
                console.log('Delete modal opened for user ID:', currentUserId, 'Name:', currentUserName);
            });
        });
    }
 
    // Close modal function
    function closeModal() {
        modal.classList.add('hidden');
        modalQuestion.textContent = "Are you sure you want to delete this user?";
        currentUserId = null;
        currentUserName = null;
    }
 
    // Setup event listeners for modal buttons
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
 
    // Confirm delete action
    confirmBtn.addEventListener('click', function () {
        if (currentUserId) {
            console.log('Confirming delete for user ID:', currentUserId);
            
            // Show loading state
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
            
            // Make API request to delete the user
            fetch(`/admin/settings/user-management/delete/${currentUserId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                // First close the modal to ensure good UX
                closeModal();
                
                // Check if the request was successful
                if (response.redirected || response.ok) {
                    // Show success notification before refreshing
                    createNotificationBanner('User successfully deleted!', 'success');
                    
                    // Set a short timeout before refreshing to allow the notification to be seen
                    setTimeout(() => {
                        // Refresh the page to update the user list
                        window.location.reload();
                    }, 1000); // 1 second delay gives users time to see the notification
                } else {
                    // Error handling
                    console.error('Error response:', response.status);
                    createNotificationBanner('Failed to delete user. Please try again.', 'danger');
                    
                    // Reset button state on error
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = '<i class="bi bi-trash"></i> Delete';
                }
                
                return response.text();
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                
                // Close the modal even on error
                closeModal();
                
                // Show error notification banner
                createNotificationBanner('Failed to delete user. Please try again.', 'danger');
                
                // Reset button state on error
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="bi bi-trash"></i> Delete';
            });
        }
    });
 
    // Close modal if clicking outside of it
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Function to create and display notification banner at the top of the page
    function createNotificationBanner(message, type = 'success') {
        // Check if there's an existing banner and remove it
        const existingBanner = document.getElementById('notification-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Create the notification banner
        const banner = document.createElement('div');
        banner.id = 'notification-banner';
        banner.className = `alert alert-${type} alert-dismissible fade show notification-banner`;
        banner.setAttribute('role', 'alert');
        
        // Add content to the banner
        banner.innerHTML = `
            <div class="container d-flex align-items-center">
                <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
                <strong>${message}</strong>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Style the banner
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '9999';
        banner.style.borderRadius = '0';
        banner.style.margin = '0';
        
        // Add banner to the page
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Add event listener for close button
        const closeButton = banner.querySelector('.btn-close');
        closeButton.addEventListener('click', function() {
            banner.remove();
        });
    }
 
    // Initialize delete buttons
    setupDeleteButtons();
    
    // Re-initialize delete buttons when content changes
    // This helps when users are added or removed via AJAX
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                setupDeleteButtons();
            }
        });
    });
    
    // Target the container where user cards/rows are displayed
    const userContainer = document.querySelector('.users-container') || 
                          document.querySelector('.user-table-container') || 
                          document.querySelector('.user-list') ||
                          document.body; // Fallback
                          
    // Configure and start the observer
    observer.observe(userContainer, { childList: true, subtree: true });
});