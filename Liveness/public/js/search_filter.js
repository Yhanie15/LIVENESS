import { initSearch } from "./searchModule.js"
import { initFilter } from "./filterModule.js"
import { initExport } from "./exportModule.js"

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const searchInput = document.querySelector(".search-input")
  const filterBtn = document.querySelector(".filter-btn")
  const exportBtn = document.querySelector(".export-btn")

  // Initialize all components
  function init() {
    // Initialize search functionality
    initSearch(searchInput)

    // Initialize filter functionality
    initFilter(filterBtn)

    // Initialize export functionality
    initExport(exportBtn)
  }

  console.log("Initializing Search, Filter, and Export modules")

  // Start the initialization
  init()
})

