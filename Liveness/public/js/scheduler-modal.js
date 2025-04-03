document.addEventListener('DOMContentLoaded', function () {
    // Get modal elements
    const schedModal = document.getElementById('schedModal');
    const schedCloseBtn = document.querySelector('.sched-close-btn');
    const schedSaveBtn = document.getElementById('schedSaveButton');
 
    // Initialize flatpickr for date picker
    if (flatpickr) {
        flatpickr('#schedDatePicker', {
            dateFormat: 'Y-m-d',
            minDate: 'today'
        });
    }
 
    // Function to open modal
    function openSchedModal() {
        schedModal.style.display = 'block';
    }
 
    // Function to close modal
    function closeSchedModal() {
        schedModal.style.display = 'none';
    }
 
    // Add click event for scheduler menu item
    const schedTrigger = document.querySelector('.sched-trigger');
    if (schedTrigger) {
        schedTrigger.addEventListener('click', function (e) {
            e.preventDefault();
            openSchedModal();
        });
    }
 
    // Add click event for the Dashboard section scheduler button (if exists)
    const dashboardSchedBtn = document.querySelector('.scheduler-btn');
    if (dashboardSchedBtn) {
        dashboardSchedBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openSchedModal();
        });
    }
 
    // Close button event
    if (schedCloseBtn) {
        schedCloseBtn.addEventListener('click', closeSchedModal);
    }
 
    // Save button event
    if (schedSaveBtn) {
        schedSaveBtn.addEventListener('click', function () {
            // Get values
            const schedDate = document.getElementById('schedDatePicker').value;
            const schedHour = document.getElementById('schedHourInput').value;
            const schedMinute = document.getElementById('schedMinuteInput').value;
            const schedAmpm = document.getElementById('schedAmpmSelect').value;
 
            // Validate inputs
            if (!schedDate || !schedHour || !schedMinute) {
                alert('Please fill in all required fields');
                return;
            }
 
            // Process the form data (you can implement your saving logic here)
            console.log('Schedule saved:', {
                date: schedDate,
                time: `${schedHour}:${schedMinute} ${schedAmpm}`
            });
 
            // Close the modal
            closeSchedModal();
        });
    }
 
    // Close when clicking outside the modal
    window.addEventListener('click', function (e) {
        if (e.target === schedModal) {
            closeSchedModal();
        }
    });
});