const API_BASE_URL = "http://192.168.6.93:5001/api"
const FILTER_OPTIONS = {
  status: ["REAL", "FAKE"].map((id) => ({ id, name: id })),
  activity: ["IN", "OUT"].map((id) => ({ id, name: id })),
}

// Filter state
export const filterState = {
  startDate: null,
  endDate: null,
  companyCode: null,
  status: null,
  activity: null,
}

let filterModal = null
let companyCodesCache = null

// Initialize filter functionality
export function initFilter(filterBtn) {
  if (!filterBtn) return console.warn("Filter button not found")
  filterBtn.addEventListener("click", showFilterModal)
  fetchCompanyCodes()
}

// Create and show filter modal
export function showFilterModal() {
  if (!filterModal) {
    const template = document.getElementById("filter-modal-template")
    if (!template) return console.error("Filter modal template not found")

    filterModal = document.createElement("div")
    filterModal.className = "filter-modal-overlay"
    filterModal.innerHTML = template.innerHTML
    document.body.appendChild(filterModal)

    // Initialize components
    initDatePicker()
    initDropdowns()

    // Add event listeners for buttons
    setupModalButtons()
  }

  filterModal.style.display = "flex"
}

// Setup modal buttons
function setupModalButtons() {
  const buttons = {
    ".close-modal-btn": hideFilterModal,
    ".clear-all-btn": clearAllFilters,
    ".apply-filters-btn": applyFilters,
  }

  Object.entries(buttons).forEach(([selector, handler]) => {
    const btn = filterModal.querySelector(selector)
    if (btn) btn.addEventListener("click", handler)
  })
}

// Hide filter modal
function hideFilterModal() {
  if (filterModal) filterModal.style.display = "none"
}

// Initialize all dropdowns
function initDropdowns() {
  // Initialize company dropdown
  initCompanyDropdown()

  // Initialize status and activity dropdowns
  ;["status", "activity"].forEach((type) => {
    initFilterDropdown(type, FILTER_OPTIONS[type])
  })
}

// Generic dropdown initializer
function initFilterDropdown(type, data) {
  const container = filterModal.querySelector(`.${type}-dropdown`)
  if (!container) return console.error(`${type} dropdown container not found`)

  const input = container.querySelector(".dropdown-input")
  const list = container.querySelector(".dropdown-list")

  // Set up the dropdown list
  updateDropdownList(list, data, type, input.value)

  // Setup event listeners
  setupDropdownEvents(container, input, list, data, type)
}

// Setup dropdown event listeners
function setupDropdownEvents(container, input, list, data, type) {
  // Handle input for search/filter
  input.addEventListener("input", (e) => {
    updateDropdownList(list, data, type, e.target.value.toLowerCase())
    list.style.display = "block"
  })

  // Show dropdown on focus
  input.addEventListener("focus", () => {
    updateDropdownList(list, data, type, input.value)
    list.style.display = "block"
  })

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) list.style.display = "none"
  })
}

// Initialize company dropdown with data from API
async function initCompanyDropdown() {
  try {
    const container = filterModal.querySelector(".company-dropdown")
    if (!container) return console.error("Company dropdown container not found")

    const input = container.querySelector(".dropdown-input")
    const list = container.querySelector(".dropdown-list")

    input.placeholder = "Loading company codes..."

    const companies = await fetchCompanyCodes()
    input.placeholder = "Search by company code"

    updateDropdownList(list, companies, "company", input.value)
    setupDropdownEvents(container, input, list, companies, "company")
  } catch (error) {
    console.error("Error initializing company dropdown:", error)
    const input = filterModal.querySelector(".company-dropdown .dropdown-input")
    if (input) input.placeholder = "Error loading companies"
  }
}

// Fetch company codes from API
async function fetchCompanyCodes() {
  try {
    if (companyCodesCache) return companyCodesCache

    const response = await fetch(`${API_BASE_URL}/transactions?limit=100`)
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`)

    const data = await response.json()
    if (!data.data || !Array.isArray(data.data)) throw new Error("Invalid data format received from API")

    // Extract unique company codes and format for dropdown
    const companyCodes = [...new Set(data.data.map((item) => item.company_code))]
    companyCodesCache = companyCodes.map((code) => ({
      id: code,
      name: `Company ${code}`,
    }))

    return companyCodesCache
  } catch (error) {
    console.error("Error fetching company codes:", error)
    return []
  }
}

// Initialize date picker - FIXED to normalize dates
function initDatePicker() {
  const startDateInput = filterModal.querySelector("#start-date")
  const endDateInput = filterModal.querySelector("#end-date")

  if (!startDateInput || !endDateInput) return console.error("Date picker inputs not found")

  // Set default dates
  const today = new Date()
  const oneWeekAgo = new Date(today)
  oneWeekAgo.setDate(today.getDate() - 7)

  // Format date helper
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Set default values
  startDateInput.value = formatDate(oneWeekAgo)
  endDateInput.value = formatDate(today)

  // Add event listeners with date validation
  startDateInput.addEventListener("change", () => {
    if (startDateInput.value) {
      // Create date and normalize time
      const date = new Date(startDateInput.value)
      date.setHours(0, 0, 0, 0)
      filterState.startDate = date
    } else {
      filterState.startDate = null
    }

    // Ensure end date is not before start date
    if (filterState.startDate && endDateInput.value) {
      const endDate = new Date(endDateInput.value)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < filterState.startDate) {
        endDateInput.value = startDateInput.value
        filterState.endDate = new Date(filterState.startDate)
      }
    }
  })

  endDateInput.addEventListener("change", () => {
    if (endDateInput.value) {
      // Create date and normalize time
      const date = new Date(endDateInput.value)
      date.setHours(0, 0, 0, 0)
      filterState.endDate = date
    } else {
      filterState.endDate = null
    }

    // Ensure start date is not after end date
    if (filterState.endDate && startDateInput.value) {
      const startDate = new Date(startDateInput.value)
      startDate.setHours(0, 0, 0, 0)
      if (startDate > filterState.endDate) {
        startDateInput.value = endDateInput.value
        filterState.startDate = new Date(filterState.endDate)
      }
    }
  })
}

// Update dropdown list based on search term
function updateDropdownList(listElement, data, type, searchTerm = "") {
  // Clear previous list
  listElement.innerHTML = ""

  // Filter data based on search term
  const filteredData = data.filter(
    (item) =>
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (filteredData.length === 0) {
    listElement.innerHTML = '<div class="dropdown-no-results">No results found</div>'
    return
  }

  // Create and append list items
  const fragment = document.createDocumentFragment()

  filteredData.forEach((item) => {
    const listItem = document.createElement("div")
    listItem.className = "dropdown-item"
    listItem.innerHTML = `<strong>${item.id}</strong>: ${item.name}`

    // Handle item selection
    listItem.addEventListener("click", () => {
      const inputField = listItem.closest(".dropdown-container").querySelector(".dropdown-input")
      inputField.value = item.id
      filterState[type] = item.id
      listElement.style.display = "none"
    })

    fragment.appendChild(listItem)
  })

  listElement.appendChild(fragment)
}

// Clear all filters
function clearAllFilters() {
  // Reset filter state
  Object.keys(filterState).forEach((key) => (filterState[key] = null))

  // Clear input fields
  filterModal.querySelectorAll(".dropdown-input").forEach((input) => {
    input.value = ""
  })

  // Reset date inputs
  const dateInputs = ["#start-date", "#end-date"]
  dateInputs.forEach((selector) => {
    const input = filterModal.querySelector(selector)
    if (input) input.value = ""
  })
}

// Apply filters to the table - FIXED date comparison
function applyFilters() {
  // Get all table rows except header
  const rows = document.querySelectorAll(".report-table tbody tr")
  if (!rows.length) return hideFilterModal()

  // Check if any filters are active
  const hasActiveFilters = Object.values(filterState).some((value) => value !== null)

  // If no filters are active, show all rows
  if (!hasActiveFilters) {
    rows.forEach((row) => (row.style.display = ""))
    return hideFilterModal()
  }

  // Normalize filter dates to remove time component
  let startDateNormalized = null
  let endDateNormalized = null

  if (filterState.startDate) {
    startDateNormalized = new Date(filterState.startDate)
    startDateNormalized.setHours(0, 0, 0, 0)
  }

  if (filterState.endDate) {
    endDateNormalized = new Date(filterState.endDate)
    endDateNormalized.setHours(23, 59, 59, 999) // End of day
  }

  // Filter configuration - maps filter types to cell indices and extraction functions
  const filterConfig = {
    companyCode: {
      index: 1,
      extract: (cell) => cell.textContent.trim(),
    },
    activity: {
      index: 3,
      extract: (cell) => cell.textContent.trim(),
    },
    status: {
      index: 7,
      extract: (cell) => {
        const badge = cell.querySelector(".status-badge")
        return badge ? badge.textContent.trim() : ""
      },
    },
    date: {
      index: 4,
      extract: (cell) => {
        const text = cell.textContent.trim()
        return text ? parseDate(text) : null
      },
    },
  }

  // Process each row with the filters
  rows.forEach((row) => {
    let showRow = true

    // Check each filter type
    if (filterState.companyCode !== null) {
      const config = filterConfig.companyCode
      const cellValue = row.cells[config.index] ? config.extract(row.cells[config.index]) : ""
      if (cellValue !== filterState.companyCode) showRow = false
    }

    if (showRow && filterState.activity !== null) {
      const config = filterConfig.activity
      const cellValue = row.cells[config.index] ? config.extract(row.cells[config.index]) : ""
      if (cellValue !== filterState.activity) showRow = false
    }

    if (showRow && filterState.status !== null) {
      const config = filterConfig.status
      const cellValue = row.cells[config.index] ? config.extract(row.cells[config.index]) : ""
      if (cellValue !== filterState.status) showRow = false
    }

    // Date range filter - FIXED comparison logic
    if (showRow && (startDateNormalized !== null || endDateNormalized !== null)) {
      const config = filterConfig.date
      const rowDate = row.cells[config.index] ? config.extract(row.cells[config.index]) : null

      if (rowDate) {
        // Check start date (inclusive)
        if (startDateNormalized !== null && rowDate < startDateNormalized) {
          showRow = false
        }

        // Check end date (inclusive)
        if (showRow && endDateNormalized !== null && rowDate > endDateNormalized) {
          showRow = false
        }
      }
    }

    // Update row visibility
    row.style.display = showRow ? "" : "none"
  })

  // Hide the modal and show notification
  hideFilterModal()
  addFilterNotification()
}

// Add a notification to show filters have been applied
function addFilterNotification() {
  let notification = document.querySelector(".filter-notification")

  if (!notification) {
    notification = document.createElement("div")
    notification.className = "filter-notification"

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
    })

    document.body.appendChild(notification)
  }

  // Count active filters
  const activeFilters = Object.entries(filterState).filter(([_, value]) => value !== null).length

  notification.textContent = `Filters applied: ${activeFilters}`
  notification.style.opacity = "1"

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0"
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// Helper function to parse dates - FIXED to normalize time
function parseDate(dateString) {
  try {
    // Example format: "Feb 14, 2025"
    const parts = dateString.split(" ")
    if (parts.length < 3) return new Date(0)

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
    }

    const month = months[parts[0].trim()] || 0
    const day = Number.parseInt(parts[1].replace(",", ""))
    const year = Number.parseInt(parts[2])

    // Create date with time set to 00:00:00
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)

    return date
  } catch (e) {
    console.error("Error parsing date:", e)
    return new Date(0)
  }
}

// Fetch transactions from API with filter parameters
export async function fetchTransactions(filters = {}) {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams()

    // Add pagination params
    queryParams.append("page", filters.page || 1)
    queryParams.append("limit", filters.limit || 10)

    // Add filter params if they exist
    const filterMapping = {
      companyCode: "company_code",
      status: "status",
      startDate: "start_date",
      endDate: "end_date",
    }

    // Process each filter
    Object.entries(filterMapping).forEach(([key, paramName]) => {
      if (filters[key]) {
        const value = key.includes("Date") ? formatDateForAPI(filters[key]) : filters[key]
        queryParams.append(paramName, value)
      }
    })

    // Fetch data
    const response = await fetch(`${API_BASE_URL}/transactions?${queryParams.toString()}`)
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`)

    return await response.json()
  } catch (error) {
    console.error("Error fetching transactions:", error)
    throw error
  }
}

// Format date for API (YYYY-MM-DD)
function formatDateForAPI(date) {
  if (!(date instanceof Date)) date = new Date(date)
  return date.toISOString().split("T")[0]
}

