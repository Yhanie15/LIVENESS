export function initSearch(searchInput) {
  if (!searchInput) {
    console.warn("Search input not found")
    return
  }

  // Create a debounce function to prevent excessive API calls
  const debounce = (func, delay) => {
    let timeoutId
    return function(...args) {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }

  // Function to handle search
  const handleSearch = debounce((searchTerm) => {
    // Get current URL and parameters
    const url = new URL(window.location.href)
    
    // Reset to page 1 when searching
    url.searchParams.set('page', '1')
    
    // Set or clear search parameter
    if (searchTerm) {
      url.searchParams.set('search', searchTerm)
    } else {
      url.searchParams.delete('search')
    }
    
    // Navigate to the new URL (this will reload the page with the new search params)
    window.location.href = url.toString()
  }, 500) // 500ms delay before search is executed

  // Add event listener for input changes
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.trim()
    handleSearch(searchTerm)
  })

  // For immediate search on page load if there's a search term in URL
  const urlParams = new URLSearchParams(window.location.search)
  const searchParam = urlParams.get('search')
  if (searchParam) {
    searchInput.value = searchParam
  }
}