// export.js - Handles export functionality with Excel and PDF support including images

// Make exportDropdown accessible outside the module
let exportDropdown = null
const librariesLoaded = {
  xlsx: false,
  jspdf: false,
  autotable: false,
}

// Initialize export functionality
export function initExport(exportBtn) {
  if (!exportBtn) {
    console.warn("Export button not found")
    return
  }

  console.log("Initializing export button:", exportBtn)

  // Load required libraries dynamically
  loadExportLibraries()

  // Create dropdown menu elements if it doesn't exist
  if (!exportDropdown) {
    exportDropdown = document.createElement("div")
    exportDropdown.className = "export-dropdown"
    exportDropdown.style.display = "none"
    exportDropdown.style.position = "absolute"
    exportDropdown.style.backgroundColor = "white"
    exportDropdown.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)"
    exportDropdown.style.zIndex = "1000"
    exportDropdown.style.borderRadius = "4px"

    // Add PDF option
    const pdfOption = document.createElement("div")
    pdfOption.className = "export-option"
    pdfOption.innerHTML = '<i class="bi bi-file-pdf"></i> Export to PDF'
    pdfOption.style.padding = "10px 15px"
    pdfOption.style.cursor = "pointer"

    // Add Excel option
    const excelOption = document.createElement("div")
    excelOption.className = "export-option"
    excelOption.innerHTML = '<i class="bi bi-file-excel"></i> Export to Excel'
    excelOption.style.padding = "10px 15px"
    excelOption.style.cursor = "pointer"

    // Add hover effect for options
    const options = [pdfOption, excelOption]
    options.forEach((option) => {
      option.addEventListener("mouseover", function () {
        this.style.backgroundColor = "#f0f0f0"
      })
      option.addEventListener("mouseout", function () {
        this.style.backgroundColor = "white"
      })
    })

    // Add options to dropdown
    exportDropdown.appendChild(pdfOption)
    exportDropdown.appendChild(excelOption)

    // Add dropdown to the document
    document.body.appendChild(exportDropdown)

    // Handle export options
    pdfOption.addEventListener("click", () => {
      exportToPDF()
      exportDropdown.style.display = "none"
    })

    excelOption.addEventListener("click", () => {
      exportToExcel()
      exportDropdown.style.display = "none"
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (exportBtn && !exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
        exportDropdown.style.display = "none"
      }
    })
  }

  // Toggle dropdown on button click
  exportBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    console.log("Export button clicked")

    // Position the dropdown below the button
    const buttonRect = exportBtn.getBoundingClientRect()
    exportDropdown.style.top = buttonRect.bottom + window.scrollY + "px"
    exportDropdown.style.left = buttonRect.left + window.scrollX + "px"

    // Toggle display
    if (exportDropdown.style.display === "none") {
      exportDropdown.style.display = "block"
      console.log("Export dropdown should be visible now")
    } else {
      exportDropdown.style.display = "none"
    }
  })
}

// Load required libraries for export functionality
function loadExportLibraries() {
  // Load SheetJS (XLSX) for Excel export
  if (!window.XLSX) {
    const xlsxScript = document.createElement("script")
    xlsxScript.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js"
    xlsxScript.async = true
    xlsxScript.onload = () => {
      console.log("XLSX library loaded successfully")
      librariesLoaded.xlsx = true
      window.XLSX = XLSX // Assign the XLSX object to the window
    }
    xlsxScript.onerror = () => {
      console.error("Failed to load XLSX library")
    }
    document.head.appendChild(xlsxScript)
  } else {
    librariesLoaded.xlsx = true
  }

  // Load jsPDF for PDF export
  if (!window.jspdf) {
    const jsPdfScript = document.createElement("script")
    jsPdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    jsPdfScript.async = true
    jsPdfScript.onload = () => {
      console.log("jsPDF library loaded successfully")
      librariesLoaded.jspdf = true

      // Load jsPDF-AutoTable plugin after jsPDF is loaded
      const autoTableScript = document.createElement("script")
      autoTableScript.src = "https://unpkg.com/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.js"
      autoTableScript.async = true
      autoTableScript.onload = () => {
        console.log("AutoTable plugin loaded successfully")
        librariesLoaded.autotable = true
      }
      autoTableScript.onerror = () => {
        console.error("Failed to load AutoTable plugin")
      }
      document.head.appendChild(autoTableScript)
    }
    jsPdfScript.onerror = () => {
      console.error("Failed to load jsPDF library")
    }
    document.head.appendChild(jsPdfScript)
  } else {
    librariesLoaded.jspdf = true
    if (typeof window.jspdf.jsPDF.prototype.autoTable === "function") {
      librariesLoaded.autotable = true
    }
  }
}

// Export table data to Excel (XLSX format) with images
async function exportToExcel() {
  console.log("Exporting to Excel...")

  // Check if XLSX is loaded
  if (!librariesLoaded.xlsx) {
    alert("Excel export library is still loading. Please try again in a moment.")
    return
  }

  try {
    // Show loading indicator
    showLoadingIndicator(true, "Preparing Excel export...")

    // Get table data with images
    const tableData = await getTableDataWithImages()

    if (!tableData || !tableData.headers || !tableData.rows) {
      throw new Error("No table data found to export")
    }

    // Process data to ensure no cell exceeds Excel's character limit (32,767)
    const processedRows = tableData.rows.map((row) => {
      return row.map((cell) => {
        if (typeof cell === "string") {
          // Truncate long text
          if (cell.length > 32000) {
            return cell.substring(0, 32000) + "..."
          }
        }
        return cell
      })
    })

    // Ensure XLSX is available before using it
    if (typeof XLSX === "undefined") {
      console.error("XLSX library is not loaded.")
      alert("XLSX library is not loaded. Please refresh the page and try again.")
      return
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([tableData.headers, ...processedRows])

    // Set column widths
    const colWidths = tableData.headers.map((h, i) => {
      // Make image column wider
      return i === 6 ? { wch: 30 } : { wch: 15 }
    })
    ws["!cols"] = colWidths

    // Add images to the worksheet
    if (tableData.images && tableData.images.length > 0) {
      // Excel doesn't directly support embedding images through the SheetJS library
      // We'll need to use a workaround or a different approach
      console.log("Note: Images will be represented as URLs in Excel")
    }

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transactions")

    // Generate Excel file
    const fileName = `transactions_export_${formatDateForFileName(new Date())}.xlsx`
    XLSX.writeFile(wb, fileName)

    console.log("Excel export completed")
    showLoadingIndicator(false)
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    alert("Failed to export to Excel: " + error.message)
    showLoadingIndicator(false)
  }
}

// Export table data to PDF (landscape orientation) with images
async function exportToPDF() {
  console.log("Exporting to PDF...")

  // Check if jsPDF and AutoTable are loaded
  if (!librariesLoaded.jspdf || !librariesLoaded.autotable) {
    alert("PDF export libraries are still loading. Please try again in a moment.")
    return
  }

  try {
    // Show loading indicator
    showLoadingIndicator(true, "Preparing PDF export...")

    // Get table data with images
    const tableData = await getTableDataWithImages()

    if (!tableData || !tableData.headers || !tableData.rows) {
      throw new Error("No table data found to export")
    }

    // Process data to handle long text
    const processedRows = tableData.rows.map((row) => {
      return row.map((cell) => {
        if (typeof cell === "string") {
          // Truncate long text for better PDF rendering
          if (cell.length > 1000) {
            return cell.substring(0, 1000) + "..."
          }
        }
        return cell
      })
    })

    // Create new PDF document (landscape orientation)
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "legal",
    })

    // Add title
    doc.setFontSize(16)
    doc.text("Transaction Report", 14, 15)

    // Add date
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)

    // Verify autoTable is available
    if (typeof doc.autoTable !== "function") {
      throw new Error("AutoTable plugin not properly loaded. Please refresh and try again.")
    }

    // Create table with images
    doc.autoTable({
      head: [tableData.headers],
      body: processedRows,
      startY: 30,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      // Handle image column
      columnStyles: {
        6: {
          // Assuming image is in column index 6
          cellWidth: 30, // Increase from 20 to 30mm for more space
        },
      },
      // Custom cell renderer for images
      didDrawCell: (data) => {
        // Only process cells in the image column (index 6) and in the body section
        if (data.column.index === 6 && data.cell.section === "body") {
          // Get the row and column indices
          const rowIndex = data.row.index

          // Check if we have an image for this cell
          if (tableData.images && tableData.images[rowIndex]) {
            const imgData = tableData.images[rowIndex]

            if (imgData) {
              // Calculate position and size for the image
              const cellWidth = data.cell.width
              const cellHeight = data.cell.height

              // Passport size dimensions (approximately 35mm x 45mm, but scaled to fit cell)
              // Use 80% of cell width/height to leave some padding
              const maxWidth = cellWidth * 0.8
              const maxHeight = cellHeight * 0.8

              // Calculate dimensions while maintaining aspect ratio
              const imgWidth = maxWidth
              const imgHeight = maxHeight

              // Center the image in the cell
              const xPos = data.cell.x + (cellWidth - imgWidth) / 2
              const yPos = data.cell.y + (cellHeight - imgHeight) / 2

              // Add the image to the PDF
              try {
                doc.addImage(imgData, "JPEG", xPos, yPos, imgWidth, imgHeight)
              } catch (e) {
                console.error("Error adding image to PDF:", e)
                // Add a placeholder text if image fails
                doc.setFontSize(6)
                doc.text("[Image]", data.cell.x + 5, data.cell.y + 5)
              }
            }
          }
        }
      },
    })

    // Save the PDF
    const fileName = `transactions_report_${formatDateForFileName(new Date())}.pdf`
    doc.save(fileName)

    console.log("PDF export completed")
    showLoadingIndicator(false)
  } catch (error) {
    console.error("Error exporting to PDF:", error)
    alert("Failed to export to PDF: " + error.message)
    showLoadingIndicator(false)
  }
}

// Get data from the table including images
async function getTableDataWithImages() {
  const table = document.querySelector(".report-table")
  if (!table) {
    console.error("Table not found")
    return null
  }

  // Get headers
  const headerCells = table.querySelectorAll("thead th")
  const headers = Array.from(headerCells).map((cell) => cell.textContent.trim())

  // Get rows
  const rows = []
  const images = []
  const rowElements = table.querySelectorAll("tbody tr")

  // Process each row
  for (let i = 0; i < rowElements.length; i++) {
    const row = rowElements[i]

    // Skip hidden rows
    if (row.style.display === "none") continue

    const rowData = []
    const cells = row.querySelectorAll("td")

    // Process each cell in the row
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j]

      // For cells with status badges
      const statusBadge = cell.querySelector(".status-badge")
      if (statusBadge) {
        rowData.push(statusBadge.textContent.trim())
        continue
      }

      // For cells with images
      const img = cell.querySelector("img")
      if (img) {
        try {
          // For the row data, use a placeholder
          rowData.push("[Image]")

          // Store the image data for later use
          if (j === 6) {
            // Assuming image is in column index 6
            // Use the new function with passport-like dimensions
            const imgData = await getImageAsBase64WithSize(img.src, 300, 400)
            images[i] = imgData
          }
        } catch (error) {
          console.error("Error processing image:", error)
          rowData.push("[Image Error]")
        }
        continue
      }

      // Regular cells
      rowData.push(cell.textContent.trim())
    }

    rows.push(rowData)
  }

  return { headers, rows, images }
}

// Convert image URL to base64
function getImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    // Create a canvas element
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    // Create an image element
    const img = new Image()
    img.crossOrigin = "Anonymous" // To avoid CORS issues

    img.onload = () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width
      canvas.height = img.height

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0)

      try {
        // Convert canvas to base64 data URL
        const dataURL = canvas.toDataURL("image/jpeg", 0.95) // Increase quality from 0.8 to 0.95
        resolve(dataURL)
      } catch (e) {
        reject(e)
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    // Set the source of the image
    img.src = url
  })
}

// Show/hide loading indicator
function showLoadingIndicator(show, message = "Loading...") {
  let loadingIndicator = document.querySelector(".export-loading-indicator")

  if (!loadingIndicator && show) {
    loadingIndicator = document.createElement("div")
    loadingIndicator.className = "export-loading-indicator"
    loadingIndicator.innerHTML = message

    // Style the loading indicator
    Object.assign(loadingIndicator.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      padding: "15px 20px",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      borderRadius: "4px",
      zIndex: "2000",
      fontWeight: "bold",
    })

    document.body.appendChild(loadingIndicator)
  } else if (loadingIndicator && !show) {
    loadingIndicator.remove()
  } else if (loadingIndicator && show) {
    loadingIndicator.innerHTML = message
  }
}

// Format date for file name (YYYY-MM-DD_HH-MM-SS)
function formatDateForFileName(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
}

// Add a new function to handle image resizing with proper aspect ratio
function getImageAsBase64WithSize(url, maxWidth = 300, maxHeight = 400) {
  return new Promise((resolve, reject) => {
    // Create a canvas element
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    // Create an image element
    const img = new Image()
    img.crossOrigin = "Anonymous" // To avoid CORS issues

    img.onload = () => {
      // Calculate dimensions while maintaining aspect ratio
      let width = img.width
      let height = img.height

      // Calculate the scaling factor
      const widthRatio = maxWidth / width
      const heightRatio = maxHeight / height
      const scaleFactor = Math.min(widthRatio, heightRatio)

      // Set new dimensions
      width = width * scaleFactor
      height = height * scaleFactor

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw the image on the canvas with the new dimensions
      ctx.drawImage(img, 0, 0, width, height)

      try {
        // Convert canvas to base64 data URL
        const dataURL = canvas.toDataURL("image/jpeg", 0.95)
        resolve(dataURL)
      } catch (e) {
        reject(e)
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    // Set the source of the image
    img.src = url
  })
}

