export function initSearch(searchInput) {
    if (!searchInput) {
      console.warn("Search input not found")
      return
    }
  
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase()
  
      // Get all table rows except header
      const rows = document.querySelectorAll(".report-table tbody tr")
  
      rows.forEach((row) => {
        let rowText = ""
  
        // Get text from all cells in the row (except the image column)
        for (let i = 0; i < row.cells.length; i++) {
          // Skip the image cell (index 6)
          if (i !== 6) {
            // For status column, get text from the status badge
            if (i === 7) {
              const statusBadge = row.cells[i].querySelector(".status-badge")
              if (statusBadge) {
                rowText += statusBadge.textContent.toLowerCase() + " "
              }
            } else {
              rowText += row.cells[i].textContent.toLowerCase() + " "
            }
          }
        }
  
        // Show row if any cell contains the search term
        if (rowText.includes(searchTerm)) {
          row.style.display = ""
        } else {
          row.style.display = "none"
        }
      })
    })
  }
  
  