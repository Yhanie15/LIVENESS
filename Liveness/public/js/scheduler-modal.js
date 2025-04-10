/**
 * Scheduler Modal JavaScript
 * Handles the functionality of the scheduler modal
 */
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const schedModalContainer = document.getElementById('sched-modal-container');
    const schedModalCloseBtn = document.getElementById('sched-modal-close-btn');
    const schedModalSaveBtn = document.getElementById('sched-modal-save-btn');
    const schedModalDateInput = document.getElementById('sched-modal-date-input');
    const schedModalHourInput = document.getElementById('sched-modal-hour-input');
    const schedModalMinuteInput = document.getElementById('sched-modal-minute-input');
    const schedModalAmPmBtn = document.getElementById('sched-modal-ampm-btn');
    const schedModalAmPmText = document.getElementById('sched-modal-ampm-text');
    const schedModalAmPmOptions = document.getElementById('sched-modal-ampm-options');
    const schedModalAmPmOptionElements = document.querySelectorAll('.sched-modal-ampm-option');
 
    // Initialize date picker with flatpickr (already included in your layout)
    if (schedModalDateInput) {
        flatpickr(schedModalDateInput, {
            dateFormat: "Y-m-d",
            minDate: "today",
            disableMobile: "true",
            clickOpens: true,     // Ensures clicking on the input opens the calendar
            closeOnSelect: true,  // Close the calendar when a date is selected
            allowInput: false,    // Don't allow manual input (forces calendar selection)
            static: false         // Allows clicks outside the calendar to close it
        });
    }
 
    // Open modal function - make it globally available
    window.openSchedulerModal = function () {
        // First close the threshold modal if it's open
        const threshModalContainer = document.getElementById('thresh-modal-container');
        if (threshModalContainer && !threshModalContainer.classList.contains('thresh-modal-hidden')) {
            threshModalContainer.classList.add('thresh-modal-hidden');
        }
 
        // Then open the scheduler modal
        if (schedModalContainer) {
            schedModalContainer.classList.remove('sched-modal-hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
 
    // Close modal function
    function closeSchedulerModal() {
        if (schedModalContainer) {
            schedModalContainer.classList.add('sched-modal-hidden');
            document.body.style.overflow = ''; // Restore background scrolling
        }
    }
 
    // Toggle AM/PM dropdown
    function toggleAmPmDropdown() {
        if (schedModalAmPmOptions) {
            schedModalAmPmOptions.classList.toggle('sched-modal-hidden');
        }
    }
 
    // Select AM/PM option
    function selectAmPmOption(option) {
        if (schedModalAmPmText) {
            schedModalAmPmText.textContent = option;
        }
        if (schedModalAmPmOptions) {
            schedModalAmPmOptions.classList.add('sched-modal-hidden');
        }
    }
 
    // Close AM/PM dropdown when clicking outside
    document.addEventListener('click', function (event) {
        if (schedModalAmPmOptions && !schedModalAmPmOptions.classList.contains('sched-modal-hidden')) {
            // Check if the click was outside the AM/PM dropdown and button
            if (!schedModalAmPmBtn.contains(event.target) && !schedModalAmPmOptions.contains(event.target)) {
                schedModalAmPmOptions.classList.add('sched-modal-hidden');
            }
        }
    });
 
    // Validate hour input (1-12)
    function validateHourInput() {
        if (!schedModalHourInput) return;
 
        let value = schedModalHourInput.value.trim();
 
        // Remove non-numeric characters
        value = value.replace(/[^0-9]/g, '');
 
        // Convert to number and validate range
        let hour = parseInt(value, 10);
 
        if (isNaN(hour)) {
            schedModalHourInput.value = '';
        } else if (hour < 1) {
            schedModalHourInput.value = '1';
        } else if (hour > 12) {
            schedModalHourInput.value = '12';
        } else {
            schedModalHourInput.value = hour.toString();
        }
    }
 
    // Validate minute input (0-59)
    function validateMinuteInput() {
        if (!schedModalMinuteInput) return;
 
        let value = schedModalMinuteInput.value.trim();
 
        // Remove non-numeric characters
        value = value.replace(/[^0-9]/g, '');
 
        // Convert to number and validate range
        let minute = parseInt(value, 10);
 
        if (isNaN(minute)) {
            schedModalMinuteInput.value = '00';
        } else if (minute < 0) {
            schedModalMinuteInput.value = '00';
        } else if (minute > 59) {
            schedModalMinuteInput.value = '59';
        } else {
            // Ensure two digits
            schedModalMinuteInput.value = minute.toString().padStart(2, '0');
        }
    }
 
    // Save schedule function
    function saveSchedule() {
        // Check if elements exist
        if (!schedModalDateInput || !schedModalHourInput || !schedModalMinuteInput || !schedModalAmPmText) {
            console.error("Required elements not found");
            return;
        }
 
        // Validate inputs
        if (!schedModalDateInput.value) {
            alert('Please select a date');
            return;
        }
 
        if (!schedModalHourInput.value) {
            alert('Please enter an hour');
            return;
        }
 
        if (!schedModalMinuteInput.value) {
            alert('Please enter minutes');
            return;
        }
 
        // Get the selected date and time
        const selectedDate = schedModalDateInput.value;
        const selectedHour = schedModalHourInput.value;
        const selectedMinute = schedModalMinuteInput.value;
        const selectedAmPm = schedModalAmPmText.textContent;
 
        // Format the schedule
        const scheduleData = {
            date: selectedDate,
            time: `${selectedHour}:${selectedMinute} ${selectedAmPm}`
        };
 
        // Here you would typically send this data to your server
        console.log('Schedule saved:', scheduleData);
 
        // You can emit a custom event for other parts of your application to listen for
        const scheduleEvent = new CustomEvent('scheduleSet', { detail: scheduleData });
        document.dispatchEvent(scheduleEvent);
 
        // Close the modal
        closeSchedulerModal();
    }
 
    // Add event listeners if elements exist
    if (schedModalCloseBtn) {
        schedModalCloseBtn.addEventListener('click', closeSchedulerModal);
    }
 
    // Removed the event listener for the overlay click
    // This ensures the modal can only be closed by the close button
 
    if (schedModalSaveBtn) {
        schedModalSaveBtn.addEventListener('click', saveSchedule);
    }
 
    if (schedModalAmPmBtn) {
        schedModalAmPmBtn.addEventListener('click', toggleAmPmDropdown);
    }
 
    if (schedModalAmPmOptionElements) {
        schedModalAmPmOptionElements.forEach(option => {
            option.addEventListener('click', function () {
                selectAmPmOption(this.dataset.value);
            });
        });
    }
 
    if (schedModalHourInput) {
        schedModalHourInput.addEventListener('blur', validateHourInput);
    }
 
    if (schedModalMinuteInput) {
        schedModalMinuteInput.addEventListener('blur', validateMinuteInput);
    }
 
    // Prevent form submission when pressing enter
    if (schedModalContainer) {
        schedModalContainer.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveSchedule();
            }
        });
    }
 
    // Also removed the Escape key event listener to close the modal
    // Now the modal can only be closed by clicking the close button
});
 
 