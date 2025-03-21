// search-filter.js - Functionality for search and filter operations

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const searchInput = document.querySelector('.search-input');
    const filterBtn = document.querySelector('.filter-btn');
    const exportBtn = document.querySelector('.export-btn');
    
    // Initialize filter modal
    let filterModal = null;
    let dateRangePicker = null;
    let companyDropdown = null;
    let employeeDropdown = null;
    let statusDropdown = null;
    let activityDropdown = null;
    
    // Filter state
    const filterState = {
      startDate: null,
      endDate: null,
      companyCode: null,
      employeeId: null,
      status: null,
      activity: null
    };
    
    // Sample data for dropdowns (replace with your actual data sources)
    const companies = [
      { id: 'LILO-001', name: 'LILO Company' },
      { id: 'ACME-002', name: 'ACME Inc' },
      { id: 'ZTECH-003', name: 'Z-Technology' }
    ];
    
    const employees = [
      { id: 'OJT-2421', name: 'John Doe' },
      { id: 'OJT-2450', name: 'Jane Smith' },
      { id: 'OJT-2480', name: 'Alex Johnson' }
    ];
    
    const statuses = ['REAL', 'FAKE'];
    const activities = ['IN', 'OUT'];
    
    // Enhanced search function that searches across all columns
    function initSearch() {
      searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        // Get all table rows except header
        const rows = document.querySelectorAll('.report-table tbody tr');
        
        rows.forEach(row => {
          let rowText = '';
          
          // Get text from all cells in the row (except the image column)
          for (let i = 0; i < row.cells.length; i++) {
            // Skip the image cell (index 6)
            if (i !== 6) {
              // For status column, get text from the status badge
              if (i === 7) {
                const statusBadge = row.cells[i].querySelector('.status-badge');
                if (statusBadge) {
                  rowText += statusBadge.textContent.toLowerCase() + ' ';
                }
              } else {
                rowText += row.cells[i].textContent.toLowerCase() + ' ';
              }
            }
          }
          
          // Show row if any cell contains the search term
          if (rowText.includes(searchTerm)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    }
    
    // Create and show filter modal
    function showFilterModal() {
      // Create modal container if it doesn't exist
      if (!filterModal) {
        filterModal = document.createElement('div');
        filterModal.className = 'filter-modal-overlay';
        
        // Get the HTML content from the template
        const template = document.getElementById('filter-modal-template');
        if (template) {
          filterModal.innerHTML = template.innerHTML;
          document.body.appendChild(filterModal);
          
          // Initialize date picker
          initDatePicker();
          
          // Initialize dropdown components
          initCompanyDropdown();
          initStatusDropdown();
          initActivityDropdown();
          
          // Add event listeners for modal buttons
          const closeBtn = filterModal.querySelector('.close-modal-btn');
          if (closeBtn) {
            closeBtn.addEventListener('click', hideFilterModal);
          }
          
          const clearAllBtn = filterModal.querySelector('.clear-all-btn');
          if (clearAllBtn) {
            clearAllBtn.addEventListener('click', clearAllFilters);
          }
          
          const applyBtn = filterModal.querySelector('.apply-filters-btn');
          if (applyBtn) {
            applyBtn.addEventListener('click', applyFilters);
          }
        } else {
          console.error('Filter modal template not found');
          return;
        }
      }
      
      // Show the modal
      filterModal.style.display = 'flex';
    }
    
    // Hide filter modal
    function hideFilterModal() {
      if (filterModal) {
        filterModal.style.display = 'none';
      }
    }
    
// Replace the initDatePicker function with this one
function initDatePicker() {
    const startDateInput = filterModal.querySelector('#start-date');
    const endDateInput = filterModal.querySelector('#end-date');
    
    if (!startDateInput || !endDateInput) {
        console.error('Date picker inputs not found');
        return;
    }
    
    // Set default dates (optional)
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    // Format date to YYYY-MM-DD for HTML date input
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Optional: Set default date range
    startDateInput.value = formatDateForInput(oneWeekAgo);
    endDateInput.value = formatDateForInput(today);
    
    // Add event listeners
    startDateInput.addEventListener('change', function() {
        filterState.startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        
        // Ensure end date is not before start date
        if (filterState.startDate && endDateInput.value) {
            const endDate = new Date(endDateInput.value);
            if (endDate < filterState.startDate) {
                endDateInput.value = startDateInput.value;
                filterState.endDate = new Date(filterState.startDate);
            }
        }
    });
    
    endDateInput.addEventListener('change', function() {
        filterState.endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        
        // Ensure start date is not after end date
        if (filterState.endDate && startDateInput.value) {
            const startDate = new Date(startDateInput.value);
            if (startDate > filterState.endDate) {
                startDateInput.value = endDateInput.value;
                filterState.startDate = new Date(filterState.endDate);
            }
        }
    });
    
    // Store references to update/clear them later
    dateRangePicker = {
        startInput: startDateInput,
        endInput: endDateInput,
        clear: function() {
            startDateInput.value = '';
            endDateInput.value = '';
            filterState.startDate = null;
            filterState.endDate = null;
        }
    };
    
    return dateRangePicker;
}
    
    // Initialize Company Code dropdown with search
    function initCompanyDropdown() {
      const container = filterModal.querySelector('.company-dropdown');
      if (!container) {
        console.error('Company dropdown container not found');
        return;
      }
      
      const input = container.querySelector('.dropdown-input');
      const list = container.querySelector('.dropdown-list');
      
      // Set up the dropdown list
      updateDropdownList(list, companies, 'company', input.value);
      
      // Handle input for search/filter
      input.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        updateDropdownList(list, companies, 'company', searchTerm);
        list.style.display = 'block';
      });
      
      // Show dropdown on focus
      input.addEventListener('focus', function() {
        updateDropdownList(list, companies, 'company', input.value);
        list.style.display = 'block';
      });
      
      // Hide dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
          list.style.display = 'none';
        }
      });
      
      companyDropdown = { input, list };
    }
    
    
    // Initialize Status dropdown with search
    function initStatusDropdown() {
      const container = filterModal.querySelector('.status-dropdown');
      if (!container) {
        console.error('Status dropdown container not found');
        return;
      }
      
      const input = container.querySelector('.dropdown-input');
      const list = container.querySelector('.dropdown-list');
      
      // Convert status array to format compatible with updateDropdownList
      const statusData = statuses.map(status => ({ id: status, name: status }));
      
      // Set up the dropdown list
      updateDropdownList(list, statusData, 'status', input.value);
      
      // Handle input for search/filter
      input.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        updateDropdownList(list, statusData, 'status', searchTerm);
        list.style.display = 'block';
      });
      
      // Show dropdown on focus
      input.addEventListener('focus', function() {
        updateDropdownList(list, statusData, 'status', input.value);
        list.style.display = 'block';
      });
      
      // Hide dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
          list.style.display = 'none';
        }
      });
      
      statusDropdown = { input, list };
    }
    
    // Initialize Activity dropdown with search
    function initActivityDropdown() {
      const container = filterModal.querySelector('.activity-dropdown');
      if (!container) {
        console.error('Activity dropdown container not found');
        return;
      }
      
      const input = container.querySelector('.dropdown-input');
      const list = container.querySelector('.dropdown-list');
      
      // Convert activity array to format compatible with updateDropdownList
      const activityData = activities.map(activity => ({ id: activity, name: activity }));
      
      // Set up the dropdown list
      updateDropdownList(list, activityData, 'activity', input.value);
      
      // Handle input for search/filter
      input.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        updateDropdownList(list, activityData, 'activity', searchTerm);
        list.style.display = 'block';
      });
      
      // Show dropdown on focus
      input.addEventListener('focus', function() {
        updateDropdownList(list, activityData, 'activity', input.value);
        list.style.display = 'block';
      });
      
      // Hide dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
          list.style.display = 'none';
        }
      });
      
      activityDropdown = { input, list };
    }
    
    // Update dropdown list based on search term
    function updateDropdownList(listElement, data, type, searchTerm = '') {
      // Clear previous list
      listElement.innerHTML = '';
      
      // Filter data based on search term
      const filteredData = data.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Create and append list items
      filteredData.forEach(item => {
        const listItem = document.createElement('div');
        listItem.className = 'dropdown-item';
        listItem.innerHTML = `<strong>${item.id}</strong>: ${item.name}`;
        
        // Handle item selection
        listItem.addEventListener('click', function() {
          // Update the input field
          const inputField = listItem.closest('.dropdown-container').querySelector('.dropdown-input');
          inputField.value = item.id;
          
          // Update filter state
          switch(type) {
            case 'company':
              filterState.companyCode = item.id;
              break;
            case 'employee':
              filterState.employeeId = item.id;
              break;
            case 'status':
              filterState.status = item.id;
              break;
            case 'activity':
              filterState.activity = item.id;
              break;
          }
          
          // Hide the dropdown
          listElement.style.display = 'none';
        });
        
        listElement.appendChild(listItem);
      });
      
      // Add "no results" message if needed
      if (filteredData.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'dropdown-no-results';
        noResults.textContent = 'No results found';
        listElement.appendChild(noResults);
      }
    }
    
    // Clear all filters
    function clearAllFilters() {
      // Reset filter state
      filterState.startDate = null;
      filterState.endDate = null;
      filterState.companyCode = null;
      filterState.employeeId = null;
      filterState.status = null;
      filterState.activity = null;
      
      // Clear input fields
      filterModal.querySelectorAll('.dropdown-input').forEach(input => {
        input.value = '';
      });
      
      // Reset date picker if it exists
      if (dateRangePicker && typeof dateRangePicker.clear === 'function') {
        dateRangePicker.clear();
      }
    }
    
    // Apply filters to the table
    function applyFilters() {
      // Get all table rows except header
      const rows = document.querySelectorAll('.report-table tbody tr');
      
      rows.forEach(row => {
        let showRow = true;
        
        // Company code filter
        if (filterState.companyCode && row.cells[1].textContent !== filterState.companyCode) {
          showRow = false;
        }
        
        // Employee ID filter
        if (showRow && filterState.employeeId && row.cells[2].textContent !== filterState.employeeId) {
          showRow = false;
        }
        
        // Activity filter
        if (showRow && filterState.activity && row.cells[3].textContent !== filterState.activity) {
          showRow = false;
        }
        
        // Status filter
        if (showRow && filterState.status) {
          const statusElement = row.cells[7].querySelector('.status-badge');
          if (statusElement && statusElement.textContent.trim() !== filterState.status) {
            showRow = false;
          }
        }
        
        // Date range filter (if implemented)
        if (showRow && (filterState.startDate || filterState.endDate)) {
          const dateText = row.cells[4].textContent;
          const rowDate = parseDate(dateText);
          
          if (filterState.startDate && rowDate < filterState.startDate) {
            showRow = false;
          }
          
          if (filterState.endDate && rowDate > filterState.endDate) {
            showRow = false;
          }
        }
        
        // Update row visibility
        row.style.display = showRow ? '' : 'none';
      });
      
      // Hide the modal after applying filters
      hideFilterModal();
    }
    
    // Helper function to parse dates (adjust as needed based on your date format)
    function parseDate(dateString) {
      // Example format: "Feb 14, 2025"
      const parts = dateString.split(' ');
      const month = getMonthNumber(parts[0]);
      const day = parseInt(parts[1].replace(',', ''));
      const year = parseInt(parts[2]);
      
      return new Date(year, month, day);
    }
    
    // Helper function to convert month name to number
    function getMonthNumber(monthName) {
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      return months[monthName];
    }
    
    // Export functionality (placeholder)
    // Export functionality with dropdown menu
function initExport() {
    if (!exportBtn) {
      console.warn('Export button not found');
      return;
    }
    
    // Create dropdown menu elements
    const exportDropdown = document.createElement('div');
    exportDropdown.className = 'export-dropdown';
    exportDropdown.style.display = 'none';
    exportDropdown.style.position = 'absolute';
    exportDropdown.style.backgroundColor = 'white';
    exportDropdown.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    exportDropdown.style.zIndex = '1000';
    exportDropdown.style.borderRadius = '4px';
    
    // Add PDF option
    const pdfOption = document.createElement('div');
    pdfOption.className = 'export-option';
    pdfOption.innerHTML = '<i class="bi bi-file-pdf"></i> Export to PDF';
    pdfOption.style.padding = '10px 15px';
    pdfOption.style.cursor = 'pointer';
    
    // Add Excel option
    const excelOption = document.createElement('div');
    excelOption.className = 'export-option';
    excelOption.innerHTML = '<i class="bi bi-file-excel"></i> Export to Excel';
    excelOption.style.padding = '10px 15px';
    excelOption.style.cursor = 'pointer';
    
    // Add hover effect for options
    const options = [pdfOption, excelOption];
    options.forEach(option => {
      option.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#f0f0f0';
      });
      option.addEventListener('mouseout', function() {
        this.style.backgroundColor = 'white';
      });
    });
    
    // Add options to dropdown
    exportDropdown.appendChild(pdfOption);
    exportDropdown.appendChild(excelOption);
    
    // Add dropdown to the document
    document.body.appendChild(exportDropdown);
    
    // Toggle dropdown on button click
    exportBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Position the dropdown below the button
      const buttonRect = exportBtn.getBoundingClientRect();
      exportDropdown.style.top = (buttonRect.bottom + window.scrollY) + 'px';
      exportDropdown.style.left = (buttonRect.left + window.scrollX) + 'px';
      
      // Toggle display
      if (exportDropdown.style.display === 'none') {
        exportDropdown.style.display = 'block';
      } else {
        exportDropdown.style.display = 'none';
      }
    });
    
    // Handle export options
    pdfOption.addEventListener('click', function() {
      exportToPDF();
      exportDropdown.style.display = 'none';
    });
    
    excelOption.addEventListener('click', function() {
      exportToExcel();
      exportDropdown.style.display = 'none';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      exportDropdown.style.display = 'none';
    });
    
    // Placeholder functions for actual export functionality
    function exportToPDF() {
      alert('Exporting to PDF...');
      // Implement actual PDF export logic here
    }
    
    function exportToExcel() {
      alert('Exporting to Excel...');
      // Implement actual Excel export logic here
    }
  }
    
    // Initialize all components
    function init() {
      if (!searchInput) {
        console.warn('Search input not found');
      } else {
        initSearch();
      }
      
      if (!filterBtn) {
        console.warn('Filter button not found');
      } else {
        filterBtn.addEventListener('click', showFilterModal);
      }
      
      initExport();
    }
    
    // Start the initialization
    init();
});