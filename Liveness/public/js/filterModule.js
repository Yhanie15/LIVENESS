const API_BASE_URL = "http://192.168.6.93:5001/api";
const FILTER_OPTIONS = {
  status: ["REAL", "FAKE"].map((id) => ({ id, name: id })),
  activity: ["in", "out"].map((id) => ({ id, name: id })),
};

// Filter state
export const filterState = {
  startDate: null,
  endDate: null,
  companyCode: null,
  status: null,
  activity: null,
};


let filterModal = null;
let companyCodesCache = null;

// Initialize filter functionality
export function initFilter(filterBtn) {
  if (!filterBtn) return console.warn("Filter button not found");

  filterBtn.addEventListener("click", showFilterModal);

  // Initialize pagination links if they exist
  initPaginationLinks();

  // Fetch company codes for dropdown
  fetchCompanyCodes();
}

// Initialize pagination links
function initPaginationLinks() {
  const paginationLinks = document.querySelectorAll(".pagination .page-link");
  paginationLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = parseInt(this.getAttribute("data-page"));
      if (isNaN(page)) return;

      // Get current filters and update page
      const currentFilters = { ...getCurrentFilters(), page };
      fetchAndUpdateTable(currentFilters);      
    });
  });
}

// Create and show filter modal
export function showFilterModal() {
  if (!filterModal) {
    const template = document.getElementById("filter-modal-template");
    if (!template) return console.error("Filter modal template not found");

    filterModal = document.createElement("div");
    filterModal.className = "filter-modal-overlay";
    filterModal.innerHTML = template.innerHTML;
    document.body.appendChild(filterModal);

    // Initialize components
    initDatePicker();
    initDropdowns();

    // Add event listeners for buttons
    setupModalButtons();
  }

  filterModal.style.display = "flex";
}

// Setup modal buttons
function setupModalButtons() {
  const buttons = {
    ".close-modal-btn": hideFilterModal,
    ".clear-all-btn": clearAllFilters,
    ".apply-filters-btn": applyFilters,
  };

  Object.entries(buttons).forEach(([selector, handler]) => {
    const btn = filterModal.querySelector(selector);
    if (btn) btn.addEventListener("click", handler);
  });
}

// Hide filter modal
function hideFilterModal() {
  if (filterModal) filterModal.style.display = "none";
}

// Initialize all dropdowns
function initDropdowns() {
  // Initialize company dropdown
  initCompanyDropdown();

  // Initialize status and activity dropdowns
  ["status", "activity"].forEach((type) => {
    initFilterDropdown(type, FILTER_OPTIONS[type]);
  });
}

// Generic dropdown initializer
function initFilterDropdown(type, data) {
  const container = filterModal.querySelector(`.${type}-dropdown`);
  if (!container) return console.error(`${type} dropdown container not found`);

  const input = container.querySelector(".dropdown-input");
  const list = container.querySelector(".dropdown-list");

  // Set up the dropdown list
  updateDropdownList(list, data, type, input.value);

  // Setup event listeners
  setupDropdownEvents(container, input, list, data, type);
}

// Setup dropdown event listeners
function setupDropdownEvents(container, input, list, data, type) {
  // Handle input for search/filter
  input.addEventListener("input", (e) => {
    updateDropdownList(list, data, type, e.target.value.toLowerCase());
    list.style.display = "block";
  });

  // Show dropdown on focus
  input.addEventListener("focus", () => {
    updateDropdownList(list, data, type, input.value);
    list.style.display = "block";
  });

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) list.style.display = "none";
  });
}

// Initialize company dropdown with data from API
async function initCompanyDropdown() {
  try {
    const container = filterModal.querySelector(".company-dropdown");
    if (!container)
      return console.error("Company dropdown container not found");

    const input = container.querySelector(".dropdown-input");
    const list = container.querySelector(".dropdown-list");

    input.placeholder = "Loading company codes...";

    const companies = await fetchCompanyCodes();
    input.placeholder = "Search by company code";

    updateDropdownList(list, companies, "companyCode", input.value);
    setupDropdownEvents(container, input, list, companies, "companyCode");
  } catch (error) {
    console.error("Error initializing company dropdown:", error);
    const input = filterModal.querySelector(
      ".company-dropdown .dropdown-input"
    );
    if (input) input.placeholder = "Error loading companies";
  }
}

// Fetch company codes from API
async function fetchCompanyCodes() {
  try {
    if (companyCodesCache) return companyCodesCache;

    const response = await fetch(`${API_BASE_URL}/transactions?limit=100`);
    if (!response.ok)
      throw new Error(`API request failed with status ${response.status}`);

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data))
      throw new Error("Invalid data format received from API");

    // Extract unique company codes and format for dropdown
    const companyCodes = [
      ...new Set(data.data.map((item) => item.company_code)),
    ];
    companyCodesCache = companyCodes.map((code) => ({
      id: code,
      name: `Company ${code}`,
    }));

    return companyCodesCache;
  } catch (error) {
    console.error("Error fetching company codes:", error);
    return [];
  }
}

// Initialize date picker
function initDatePicker() {
  const startDateInput = filterModal.querySelector("#start-date");
  const endDateInput = filterModal.querySelector("#end-date");

  if (!startDateInput || !endDateInput)
    return console.error("Date picker inputs not found");

  // Set default dates
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  // Format date helper
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Set default values
  startDateInput.value = formatDate(oneWeekAgo);
  endDateInput.value = formatDate(today);

  // Set initial filter state values
  filterState.startDate = oneWeekAgo;
  filterState.endDate = today;

  // Add event listeners with date validation
  startDateInput.addEventListener("change", () => {
    if (startDateInput.value) {
      // Create date and normalize time
      const date = new Date(startDateInput.value);
      date.setHours(0, 0, 0, 0);
      filterState.startDate = date;
    } else {
      filterState.startDate = null;
    }

    // Ensure end date is not before start date
    if (filterState.startDate && endDateInput.value) {
      const endDate = new Date(endDateInput.value);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < filterState.startDate) {
        endDateInput.value = startDateInput.value;
        filterState.endDate = new Date(filterState.startDate);
      }
    }
  });

  endDateInput.addEventListener("change", () => {
    if (endDateInput.value) {
      // Create date and normalize time
      const date = new Date(endDateInput.value);
      date.setHours(23, 59, 59, 999); // End of day
      filterState.endDate = date;
    } else {
      filterState.endDate = null;
    }

    // Ensure start date is not after end date
    if (filterState.endDate && startDateInput.value) {
      const startDate = new Date(startDateInput.value);
      startDate.setHours(0, 0, 0, 0);
      if (startDate > filterState.endDate) {
        startDateInput.value = endDateInput.value;
        filterState.startDate = new Date(filterState.endDate);
        filterState.startDate.setHours(0, 0, 0, 0);
      }
    }
  });
}

// Update dropdown list based on search term
function updateDropdownList(listElement, data, type, searchTerm = "") {
  // Clear previous list
  listElement.innerHTML = "";

  // Filter data based on search term
  const filteredData = data.filter(
    (item) =>
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredData.length === 0) {
    listElement.innerHTML =
      '<div class="dropdown-no-results">No results found</div>';
    return;
  }

  // Create and append list items
  const fragment = document.createDocumentFragment();

  filteredData.forEach((item) => {
    const listItem = document.createElement("div");
    listItem.className = "dropdown-item";
    listItem.innerHTML = `<strong>${item.id}</strong>: ${item.name}`;

    // Handle item selection
    listItem.addEventListener("click", () => {
      const inputField = listItem
        .closest(".dropdown-container")
        .querySelector(".dropdown-input");
      inputField.value = item.id;
      filterState[type] = item.id;
      listElement.style.display = "none";
    });

    fragment.appendChild(listItem);
  });

  listElement.appendChild(fragment);
}

// Clear all filters
function clearAllFilters() {
  // Reset filter state
  Object.keys(filterState).forEach((key) => (filterState[key] = null));

  // Clear input fields
  filterModal.querySelectorAll(".dropdown-input").forEach((input) => {
    input.value = "";
  });

  // Reset date inputs
  const dateInputs = ["#start-date", "#end-date"];
  dateInputs.forEach((selector) => {
    const input = filterModal.querySelector(selector);
    if (input) input.value = "";
  });
}

// Apply filters by fetching data from API with filters
function applyFilters() {
  hideFilterModal();

  const hasActiveFilters = Object.values(filterState).some(
    (value) => value !== null
  );

  // Get the current limit from the dropdown if available
  let selectedLimit = 10;
  const rowsSelect = document.querySelector('.rows-select');
  if (rowsSelect && rowsSelect.value) {
    selectedLimit = rowsSelect.value;
  }

  const filterParams = {
    page: 1,
    limit: parseInt(selectedLimit)
  };

  if (filterState.companyCode) filterParams.companyCode = filterState.companyCode;
  if (filterState.status) filterParams.status = filterState.status;
  if (filterState.activity) filterParams.activity = filterState.activity;
  if (filterState.startDate) filterParams.startDate = filterState.startDate;
  if (filterState.endDate) filterParams.endDate = filterState.endDate;

  fetchAndUpdateTable(filterParams);

  if (hasActiveFilters) {
    addFilterNotification();
  }
}

// Fetch data with filters and update the table
async function fetchAndUpdateTable(params) {
  try {
    const tableBody = document.querySelector(".report-table tbody");
    if (!tableBody) return console.error("Table body not found");

    // Show loading indicator
    tableBody.innerHTML =
      '<tr><td colspan="9" class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><div class="mt-2">Loading data...</div></td></tr>';

    // Fetch filtered data from API
    const result = await fetchTransactions(params);

    // Update pagination controls
    updatePagination(result.pagination);

    // Update table with new data
    updateTableWithData(result.data);
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    // Show error message in table
    const tableBody = document.querySelector(".report-table tbody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error loading data. Please try again.</td></tr>';
    }
  }
}

// Update table with new data from API
// Update table with new data from API
function updateTableWithData(transactions) {
  const tableBody = document.querySelector(".report-table tbody");
  if (!tableBody) return console.error("Table body not found");

  // Check if there are transactions; if not, show a message
  if (!transactions || transactions.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="9" class="no-records">No records found matching your criteria</td></tr>';
    return;
  }

  // Clear existing rows
  tableBody.innerHTML = "";
  
  // Rebuild table rows exactly like on the report page
  transactions.forEach((transaction) => {
    const row = document.createElement("tr");

    // Format date and time from timestamp
    let formattedDate = ''
    let formattedTime = ''
    
    if (transaction.timestamp) {
      const date = new Date(transaction.timestamp)
      formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
      
      formattedTime = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })
    } else {
      formattedDate = transaction.date || ''
      formattedTime = transaction.time || ''
    }

    // Process image_resize for thumbnail view
    let thumbnailImage = "/images/avatar.png";
    if (transaction.image_resize) {
      if (!transaction.image_resize.startsWith("data:image/webp") && !transaction.image_resize.startsWith("data:image")) {
        thumbnailImage = `data:image/webp;base64,${transaction.image_resize}`;
      } else {
        thumbnailImage = transaction.image_resize;
      }
    }
    
    // Process image_data for full-size modal view
    let fullSizeImage = "/images/avatar.png";
    if (transaction.image_data) {
      if (!transaction.image_data.startsWith("data:image/")) {
        fullSizeImage = `data:image/jpeg;base64,${transaction.image_data}`;
      } else {
        fullSizeImage = transaction.image_data;
      }
    }
  
    row.innerHTML = `
      <td>${transaction.id || transaction.transaction_no}</td>
      <td>${transaction.company_code}</td>
      <td>${transaction.employee_id}</td>
      <td>${transaction.activity || 'N/A'}</td>
      <td>${formattedDate}</td>
      <td>${formattedTime}</td>
      <td>
        <div class="profile-image-container">
          <img 
            src="${thumbnailImage}" 
            alt="Profile" 
            class="profile-image" 
            loading="lazy" 
            width="100" 
            height="100"
            onclick="openModal('${fullSizeImage}', '${transaction.score}', '${transaction.status}', '${transaction.id || transaction.transaction_no}')">
        </div>
      </td>
      <td>
        <span class="status-badge ${transaction.status.toLowerCase()}">
          ${transaction.status}
        </span>
      </td>
      <td>${transaction.score ? (typeof transaction.score === 'string' ? transaction.score : transaction.score + ' %') : ''}</td>
    `;
    tableBody.appendChild(row);
  });

  // Re-initialize any image modal triggers if needed
  initializeImageModalTriggers();
}


// Initialize image modal triggers for new rows
function initializeImageModalTriggers() {
  const thumbnails = document.querySelectorAll(".thumbnail-img");
  thumbnails.forEach((img) => {
    img.addEventListener("click", function () {
      const modalImg = document.querySelector("#imageModal .modal-image");
      if (modalImg) {
        modalImg.src = this.getAttribute("data-img-src");
      }
    });
  });
}

// Update pagination controls with new data
function updatePagination(pagination) {
  if (!pagination) return;

  const paginationContainer = document.querySelector(".pagination-container");
  if (!paginationContainer)
    return console.warn("Pagination container not found");

  // Update page info text if it exists
  const pageInfo = document.querySelector(".pagination-info");
  if (pageInfo) {
    pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalItems} items)`;
  }

  // Update pagination links
  const paginationUl = paginationContainer.querySelector("ul.pagination");
  if (!paginationUl) return;

  // Clear existing pagination links
  paginationUl.innerHTML = "";

  // Create pagination items

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${
    pagination.currentPage <= 1 ? "disabled" : ""
  }`;
  prevLi.innerHTML = `<a class="page-link" href="#" data-page="${
    pagination.currentPage - 1
  }">&laquo;</a>`;
  paginationUl.appendChild(prevLi);

  // Page links
  const maxPages = 5; // Maximum number of page links to show
  let startPage = Math.max(
    1,
    pagination.currentPage - Math.floor(maxPages / 2)
  );
  let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);

  // Adjust if at the end
  if (endPage - startPage + 1 < maxPages && startPage > 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  // First page link if not at the beginning
  if (startPage > 1) {
    const firstLi = document.createElement("li");
    firstLi.className = "page-item";
    firstLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
    paginationUl.appendChild(firstLi);

    // Add ellipsis if needed
    if (startPage > 2) {
      const ellipsisLi = document.createElement("li");
      ellipsisLi.className = "page-item disabled";
      ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
      paginationUl.appendChild(ellipsisLi);
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === pagination.currentPage ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
    paginationUl.appendChild(li);
  }

  // Last page link if not at the end
  if (endPage < pagination.totalPages) {
    // Add ellipsis if needed
    if (endPage < pagination.totalPages - 1) {
      const ellipsisLi = document.createElement("li");
      ellipsisLi.className = "page-item disabled";
      ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
      paginationUl.appendChild(ellipsisLi);
    }

    const lastLi = document.createElement("li");
    lastLi.className = "page-item";
    lastLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.totalPages}">${pagination.totalPages}</a>`;
    paginationUl.appendChild(lastLi);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    pagination.currentPage >= pagination.totalPages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<a class="page-link" href="#" data-page="${
    pagination.currentPage + 1
  }">&raquo;</a>`;
  paginationUl.appendChild(nextLi);

  // Add click event listeners to pagination links
  paginationUl.querySelectorAll("a.page-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = parseInt(this.getAttribute("data-page"));
      if (isNaN(page)) return;

      // Get current filters and update page
      const currentFilters = { ...getCurrentFilters(), page };
      fetchAndUpdateTable(currentFilters);      
    });
  });
}

// Get current filters from state
function getCurrentFilters() {
  // Attempt to retrieve the selected limit from the rows-per-page dropdown
  let selectedLimit = 10;
  const rowsSelect = document.querySelector('.rows-select');
  if (rowsSelect && rowsSelect.value) {
    selectedLimit = rowsSelect.value;
  }

  const filters = { page: 1, limit: parseInt(selectedLimit) };

  if (filterState.companyCode) filters.companyCode = filterState.companyCode;
  if (filterState.status) filters.status = filterState.status;
  if (filterState.activity) filters.activity = filterState.activity;
  if (filterState.startDate) filters.startDate = filterState.startDate;
  if (filterState.endDate) filters.endDate = filterState.endDate;

  return filters;
}


// Add a notification to show filters have been applied
function addFilterNotification() {
  let notification = document.querySelector(".filter-notification");

  if (!notification) {
    notification = document.createElement("div");
    notification.className = "filter-notification";

    // Apply styles
    Object.assign(notification.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      padding: "10px 15px",
      backgroundColor: "#4CAF50",
      color: "white",
      borderRadius: "4px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      zIndex: "1000",
      transition: "opacity 0.3s",
    });

    document.body.appendChild(notification);
  }

  // Count active filters
  const activeFilters = Object.entries(filterState).filter(
    ([_, value]) => value !== null
  ).length;

  notification.textContent = `Filters applied: ${activeFilters}`;
  notification.style.opacity = "1";

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Fetch transactions from API with filter parameters
export async function fetchTransactions(filters = {}) {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add pagination params
    queryParams.append("page", filters.page || 1);
    queryParams.append("limit", filters.limit || 10);

    // Add filter params if they exist
    const filterMapping = {
      companyCode: "company_code",
      status: "status",
      activity: "activity",
      startDate: "start_date",
      endDate: "end_date",
    };

    // Process each filter
    Object.entries(filterMapping).forEach(([key, paramName]) => {
      if (filters[key]) {
        const value = key.includes("Date")
          ? formatDateForAPI(filters[key])
          : filters[key];
        queryParams.append(paramName, value);
      }
    });

    // Fetch data
    const response = await fetch(
      `${API_BASE_URL}/transactions?${queryParams.toString()}`
    );
    if (!response.ok)
      throw new Error(`API request failed with status ${response.status}`);

    const result = await response.json();

    return {
      data: result.data,
      pagination: {
        currentPage: parseInt(result.page),
        totalPages: Math.ceil(result.total / result.limit),
        totalItems: result.total,
        pageSize: parseInt(result.limit),
      },
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
}

// Format date for API (YYYY-MM-DD)
function formatDateForAPI(date) {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toISOString().split("T")[0];
}

// Helper function to parse dates - for parsing date strings from table cells
function parseDate(dateString) {
  try {
    // Example format: "Feb 14, 2025"
    const parts = dateString.split(" ");
    if (parts.length < 3) return new Date(0);

    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const month = months[parts[0].trim()] || 0;
    const day = Number.parseInt(parts[1].replace(",", ""));
    const year = Number.parseInt(parts[2]);

    // Create date with time set to 00:00:00
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    return date;
  } catch (e) {
    console.error("Error parsing date:", e);
    return new Date(0);
  }
}
