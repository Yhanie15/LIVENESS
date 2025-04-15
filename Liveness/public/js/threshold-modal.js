/**
 * threshold-modal.js
 * Handles the functionality of the threshold modal with API integration and notifications
 */
document.addEventListener('DOMContentLoaded', function () {
    // API Base URL
    const API_BASE_URL = 'http://192.168.100.152:5001';
    
    // DOM Elements
    const threshModalContainer = document.getElementById('thresh-modal-container');
    const threshModalCloseBtn = document.getElementById('thresh-modal-close-btn');
    const threshModalSaveBtn = document.getElementById('thresh-modal-save-btn');
    const threshModalValueInput = document.getElementById('thresh-modal-value-input');
 
    // Notification function
    function showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.position = 'fixed';
            container.style.top = '50px';
            container.style.right = '20px';
            container.style.zIndex = '1000';
            document.body.appendChild(container);
        }

        const note = document.createElement('div');
        note.className = `notification ${type}`;
        note.style.cssText = `
            padding:10px 20px;margin:5px 0;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.2);
            min-width:200px;transition:opacity .5s ease;
        `;
        if (type === 'error') {
            note.style.background = '#f8d7da';
            note.style.color = '#721c24';
            note.style.borderLeft = '4px solid #dc3545';
        } else if (type === 'success') {
            note.style.background = '#d4edda';
            note.style.color = '#155724';
            note.style.borderLeft = '4px solid #28a745';
        } else {
            note.style.background = '#d1ecf1';
            note.style.color = '#0c5460';
            note.style.borderLeft = '4px solid #17a2b8';
        }
        note.textContent = message;
        container.appendChild(note);

        setTimeout(() => {
            note.style.opacity = '0';
            setTimeout(() => {
                note.remove();
                if (!container.children.length) container.remove();
            }, 500);
        }, 5000);
    }
    
    // Open modal function - make it globally available
    window.openThresholdModal = function () {
        // First close the scheduler modal if it's open
        const schedModalContainer = document.getElementById('sched-modal-container');
        if (schedModalContainer && !schedModalContainer.classList.contains('sched-modal-hidden')) {
            schedModalContainer.classList.add('sched-modal-hidden');
        }
 
        // Fetch current threshold from API before opening modal
        fetchCurrentThreshold();
        
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
 
    // Fetch current threshold from API
    function fetchCurrentThreshold() {
        fetch(`${API_BASE_URL}/get_threshold`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Convert from API scale (0-1) to UI scale (0-100)
                const thresholdPercent = (data.threshold * 100).toFixed(2);
                
                // Update input field with current value
                if (threshModalValueInput) {
                    threshModalValueInput.value = thresholdPercent;
                }
            })
            .catch(error => {
                console.error('Error fetching threshold:', error);
                // Set a default value if fetch fails
                if (threshModalValueInput) {
                    threshModalValueInput.value = '65.00'; // Default based on your THRESHOLD = 0.65
                }
                showNotification('Could not fetch current threshold value', 'error');
            });
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
 
    // Save threshold function with API integration
    function saveThreshold() {
        // Check if element exists
        if (!threshModalValueInput) {
            console.error("Required element not found");
            showNotification('Input field not found', 'error');
            return;
        }
 
        // Validate input
        if (!threshModalValueInput.value) {
            showNotification('Please enter a threshold value', 'error');
            return;
        }
 
        // Get the threshold value
        const thresholdValue = parseFloat(threshModalValueInput.value);
 
        // Validate range
        if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
            showNotification('Please enter a valid threshold value between 0 and 100', 'error');
            return;
        }
        
        // Convert from UI scale (0-100) to API scale (0-1)
        const apiThresholdValue = thresholdValue / 100;
        
        // Send threshold to API
        fetch(`${API_BASE_URL}/update_threshold`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ threshold: apiThresholdValue })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Threshold updated successfully:', data);
            
            // Show success notification
            showNotification(`Threshold updated to ${thresholdValue}%`, 'success');
            
            // Format the threshold data
            const thresholdData = {
                value: thresholdValue
            };
            
            // Emit a custom event for other parts of the application
            const thresholdEvent = new CustomEvent('thresholdSet', { detail: thresholdData });
            document.dispatchEvent(thresholdEvent);
            
            // Close the modal
            closeThresholdModal();
        })
        .catch(error => {
            console.error('Error updating threshold:', error);
            showNotification('Failed to update threshold. Please try again.', 'error');
        });
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