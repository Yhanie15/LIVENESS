// User Management page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize any necessary components
  initializeUserCards();
  
  // Initialize search form
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      // Form submission is handled by the form action
    });
  }
  
  // Check for any messages or errors in the URL
  displayMessageFromUrl();

  // Initialize add user form if exists
  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) {
    addUserForm.addEventListener('submit', validateUserForm);
  }

  // Initialize edit user form if exists
  const editUserForm = document.getElementById('editUserForm');
  if (editUserForm) {
    editUserForm.addEventListener('submit', validateUserForm);
  }
});

function validateUserForm(e) {
  const usernameField = this.querySelector('[name="username"]');
  const emailField = this.querySelector('[name="email"]');
  const passwordField = this.querySelector('[name="password"]');
  const compCodeField = this.querySelector('[name="compCode"]');
  
  let isValid = true;
  
  // Check username
  if (!usernameField.value.trim()) {
    showFieldError(usernameField, 'Username is required');
    isValid = false;
  } else {
    clearFieldError(usernameField);
  }
  
  // Check email
  if (!emailField.value.trim()) {
    showFieldError(emailField, 'Email is required');
    isValid = false;
  } else if (!isValidEmail(emailField.value)) {
    showFieldError(emailField, 'Please enter a valid email');
    isValid = false;
  } else {
    clearFieldError(emailField);
  }
  
  // Check password for new users
  if (this.id === 'addUserForm' && (!passwordField || !passwordField.value.trim())) {
    showFieldError(passwordField, 'Password is required');
    isValid = false;
  } else if (passwordField && passwordField.value) {
    clearFieldError(passwordField);
  }
  
  // Check company code
  if (!compCodeField.value.trim()) {
    showFieldError(compCodeField, 'Company Code is required');
    isValid = false;
  } else {
    clearFieldError(compCodeField);
  }
  
  if (!isValid) {
    e.preventDefault();
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

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

function clearFieldError(field) {
  // Remove any existing error message
  const errorElement = field.nextElementSibling;
  if (errorElement && errorElement.className.includes('field-error')) {
    errorElement.remove();
  }
  
  // Remove error class
  field.classList.remove('is-invalid');
}

function initializeUserCards() {
  // Add hover effects or other interactions to user cards
  const userCards = document.querySelectorAll('.user-card');
  userCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.classList.add('card-hover');
    });
    
    card.addEventListener('mouseleave', function() {
      this.classList.remove('card-hover');
    });
  });
  
  console.log('User management page initialized');
}

// Function to display success or error messages from URL parameters
function displayMessageFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  const error = urlParams.get('error');
  
  if (message) {
    showNotification(message, 'success');
  }
  
  if (error) {
    showNotification(error, 'error');
  }
}

// Function to show notifications
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

// Function to open edit page for a user
function editUser(userId) {
  window.location.href = `/admin/settings/user-management/edit/${userId}`;
}
