document.addEventListener('DOMContentLoaded', function () {
    console.log('User Activity Modal JS loaded');
 
    // Get modal elements
    const modal = document.getElementById('userActivityModal');
    if (!modal) {
        console.error('Modal element not found! Make sure userActivityModal exists in the DOM');
        return;
    }
 
    const closeBtn = document.getElementById('closeActivityModal');
    if (!closeBtn) {
        console.error('Close button not found! Make sure closeActivityModal exists in the DOM');
    }
 
    // Get the User Activity dropdown item - using multiple methods to ensure we find it
    const userActivityItems = document.querySelectorAll('.dropdown-item');
    let userActivityOption = null;
 
    console.log('Found dropdown items:', userActivityItems.length);
 
    userActivityItems.forEach(item => {
        console.log('Dropdown item text:', item.textContent.trim());
        if (item.textContent.trim().includes('User Activity')) {
            userActivityOption = item;
            console.log('Found User Activity dropdown item');
        }
    });
 
    if (!userActivityOption) {
        console.error('User Activity dropdown item not found!');
    }
 
    // Sample activity data
    const activityData = [
        {
            user: "Alex Thompson",
            action: "Download transaction report",
            time: "3:07 PM",
            date: "Mar 15"
        },
        {
            user: "Alex Thompson",
            action: "Logged in",
            time: "8:07 AM",
            date: "Mar 18"
        },
        {
            user: "Alex Thompson",
            action: "Download transaction report",
            time: "3:07 PM",
            date: "Mar 24"
        },
        {
            user: "Alex Thompson",
            action: "Delete user",
            time: "3:07 PM",
            date: "Feb 14"
        },
        {
            user: "Alex Thompson",
            action: "Download transaction report",
            time: "3:07 PM",
            date: "Feb 01"
        },
        {
            user: "Alex Thompson",
            action: "Download transaction report",
            time: "3:07 PM",
            date: "Jan 18"
        }
    ];
 
    // Function to open modal
    function openModal() {
        console.log('Opening modal');
        populateActivityList();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }
 
    // Function to close modal
    function closeModal() {
        console.log('Closing modal');
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
 
    // Function to populate activity list
    function populateActivityList() {
        console.log('Populating activity list');
        const activityList = document.querySelector('.activity-list');
        if (!activityList) {
            console.error('Activity list element not found!');
            return;
        }
 
        activityList.innerHTML = ''; // Clear existing items
 
        activityData.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
 
            activityItem.innerHTML = `
          <div class="activity-avatar">
            <img src="/images/avatar.png" alt="${activity.user}">
          </div>
          <div class="activity-details">
            <h3 class="activity-user">${activity.user}</h3>
            <p class="activity-description">${activity.action}</p>
          </div>
          <div class="activity-time">
            <span class="time">${activity.time}</span>
            <span class="date">${activity.date}</span>
          </div>
        `;
 
            activityList.appendChild(activityItem);
        });
    }
 
    // Event listeners
    if (userActivityOption) {
        console.log('Adding click event listener to User Activity option');
        userActivityOption.addEventListener('click', function (e) {
            console.log('User Activity clicked');
            e.preventDefault();
            openModal();
        });
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
 
    // Close modal with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
 
    // Direct method to test modal
    window.openUserActivityModal = openModal;
    console.log('Added global openUserActivityModal function for testing');
});