// user-activity-modal.js
document.addEventListener('DOMContentLoaded', function () {
    console.log('User Activity Modal JS loaded');

    // Get modal element
    const modal = document.getElementById('userActivityModal');
    if (!modal) {
        console.error('Modal element not found! Ensure userActivityModal exists in the DOM.');
        return;
    }

    const closeBtn = document.getElementById('closeActivityModal');
    if (!closeBtn) {
        console.error('Close button not found! Ensure closeActivityModal exists in the DOM.');
    }

    // Function to fetch login activity history from the server
    async function fetchLoginHistory() {
        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = '<div class="loading-spinner">Loading activity data...</div>';
        
        try {
            // Fetch entire login history without any filtering or pagination parameters
            const response = await fetch(`/support/login-history`);
            if (!response.ok) {
                throw new Error(`Failed to fetch login history: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Expected an array of login history items');
            }
            displayActivities(data);
        } catch (error) {
            console.error('Error fetching login history:', error);
            activityList.innerHTML = `<div class="no-activity-message">Error loading activity data: ${error.message}. Please try again.</div>`;
        }
    }

    // Function to display activities in the modal
    function displayActivities(activities) {
        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = ''; // Clear any existing items

        if (!activities || activities.length === 0) {
            const noActivity = document.createElement('div');
            noActivity.className = 'no-activity-message';
            noActivity.textContent = 'No activity records found.';
            activityList.appendChild(noActivity);
            return;
        }

        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';

            // Use default messages if any field is missing
            const actionText = activity.action || 'Unknown action';
            const ipText = activity.ipAddress ? ` from ${activity.ipAddress}` : '';
            const timeText = activity.time || 'Unknown time';
            const dateText = activity.date || 'Unknown date';

            activityItem.innerHTML = `
                <div class="activity-avatar">
                    <img src="/images/avatar.png" alt="User Avatar">
                </div>
                <div class="activity-details">
                    <p class="activity-description">${actionText}${ipText}</p>
                </div>
                <div class="activity-time">
                    <span class="time">${timeText}</span>
                    <span class="date">${dateText}</span>
                </div>
            `;
            activityList.appendChild(activityItem);
        });
    }

    // Function to open the modal and fetch login activity
    function openModal() {
        console.log('Opening modal');

        // Optionally add the initial login activity from the server-side injection (if provided)
        // For example, you could check window.loginActivity here and prepend it to the list.

        // Fetch fresh login activity data
        fetchLoginHistory();

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close the modal
    function closeModal() {
        console.log('Closing modal');
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Event listeners

    // Find the "User Activity" dropdown item (ensure it contains the text "User Activity")
    const userActivityItems = document.querySelectorAll('.dropdown-item');
    let userActivityOption = null;
    userActivityItems.forEach(item => {
        if (item.textContent.trim().includes('User Activity')) {
            userActivityOption = item;
        }
    });

    if (userActivityOption) {
        userActivityOption.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });
    } else {
        console.error('User Activity dropdown item not found!');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key press
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Expose a global function for testing if needed
    window.openUserActivityModal = openModal;
    console.log('Global openUserActivityModal function added for testing');
});
