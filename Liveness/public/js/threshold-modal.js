/**
 * threshold-modal.js
 * Handles the functionality of the threshold modal
 */
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const threshModalContainer = document.getElementById('thresh-modal-container');
    const threshModalCloseBtn = document.getElementById('thresh-modal-close-btn');
    const threshModalSaveBtn = document.getElementById('thresh-modal-save-btn');
    const threshModalValueInput = document.getElementById('thresh-modal-value-input');
 
    // Open modal function - make it globally available
    window.openThresholdModal = function () {
        // First close the scheduler modal if it's open
        const schedModalContainer = document.getElementById('sched-modal-container');
        if (schedModalContainer && !schedModalContainer.classList.contains('sched-modal-hidden')) {
            schedModalContainer.classList.add('sched-modal-hidden');
        }
 
        // Then open the threshold modal
        if (threshModalContainer) {
            threshModalContainer.classList.remove('thresh-modal-hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
 
    // Close modal function
    function closeThresholdModal() {
        if (threshModalContainer) {
            threshModalContainer.classList.add('thresh-modal-hidden');
            document.body.style.overflow = ''; // Restore background scrolling
        }
    }
 
    // Validate threshold input (0-100)
    function validateThresholdInput() {
        if (!threshModalValueInput) return;
 
        let value = threshModalValueInput.value.trim();
 
        // Remove non-numeric characters except decimal point
        value = value.replace(/[^0-9.]/g, '');
 
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
 
        // Convert to number and validate range
        let threshold = parseFloat(value);
 
        if (isNaN(threshold)) {
            threshModalValueInput.value = '';
        } else if (threshold < 0) {
            threshModalValueInput.value = '0';
        } else if (threshold > 100) {
            threshModalValueInput.value = '100';
        } else {
            // Format to at most 2 decimal places
            threshModalValueInput.value = Math.round(threshold * 100) / 100;
        }
    }
 
    // Save threshold function
    function saveThreshold() {
        // Check if element exists
        if (!threshModalValueInput) {
            console.error("Required element not found");
            return;
        }
 
        // Validate input
        if (!threshModalValueInput.value) {
            alert('Please enter a threshold value');
            return;
        }
 
        // Get the threshold value
        const thresholdValue = parseFloat(threshModalValueInput.value);
 
        // Validate range
        if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
            alert('Please enter a valid threshold value between 0 and 100');
            return;
        }
 
        // Format the threshold data
        const thresholdData = {
            value: thresholdValue
        };
 
        // Here you would typically send this data to your server
        console.log('Threshold saved:', thresholdData);
 
        // You can emit a custom event for other parts of your application to listen for
        const thresholdEvent = new CustomEvent('thresholdSet', { detail: thresholdData });
        document.dispatchEvent(thresholdEvent);
 
        // Close the modal
        closeThresholdModal();
    }
 
    // Add event listeners if elements exist
    if (threshModalCloseBtn) {
        threshModalCloseBtn.addEventListener('click', closeThresholdModal);
    }
 
    if (threshModalSaveBtn) {
        threshModalSaveBtn.addEventListener('click', saveThreshold);
    }
 
    if (threshModalValueInput) {
        threshModalValueInput.addEventListener('blur', validateThresholdInput);
 
        // Also validate on input to provide immediate feedback
        threshModalValueInput.addEventListener('input', function () {
            // Allow typing but prevent non-numeric characters
            this.value = this.value.replace(/[^0-9.]/g, '');
 
            // Ensure only one decimal point
            const parts = this.value.split('.');
            if (parts.length > 2) {
                this.value = parts[0] + '.' + parts.slice(1).join('');
            }
        });
    }
 
    // Prevent form submission when pressing enter
    if (threshModalContainer) {
        threshModalContainer.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveThreshold();
            }
        });
    }
});