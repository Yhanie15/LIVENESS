// export.js - Handles export functionality with Excel and PDF support including images
 
// Make exportDropdown accessible outside the module
 
let exportDropdown = null;
 
const librariesLoaded = {
  xlsx: false,
 
  jspdf: false,
 
  autotable: false,
};
 
// Store base64 images globally so they can be accessed by the viewer
 
window.exportImageData = {};
 
// Initialize export functionality
 
export function initExport(exportBtn) {
  if (!exportBtn) {
    console.warn("Export button not found");
 
    return;
  }
 
  console.log("Initializing export button:", exportBtn);
 
  // Load required libraries dynamically
 
  loadExportLibraries();
 
  // Create dropdown menu elements if it doesn't exist
 
  if (!exportDropdown) {
    exportDropdown = document.createElement("div");
 
    exportDropdown.className = "export-dropdown";
 
    exportDropdown.style.display = "none";
 
    exportDropdown.style.position = "absolute";
 
    exportDropdown.style.backgroundColor = "white";
 
    exportDropdown.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
 
    exportDropdown.style.zIndex = "1000";
 
    exportDropdown.style.borderRadius = "4px";
 
    // Add PDF option
 
    const pdfOption = document.createElement("div");
 
    pdfOption.className = "export-option";
 
    pdfOption.innerHTML = '<i class="bi bi-file-pdf"></i> Export to PDF';
 
    pdfOption.style.padding = "10px 13px";
 
    pdfOption.style.cursor = "pointer";
 
    // Add Excel option
 
    const excelOption = document.createElement("div");
 
    excelOption.className = "export-option";
 
    excelOption.innerHTML = '<i class="bi bi-file-excel"></i> Export to Excel';
 
    excelOption.style.padding = "10px 10px";
 
    excelOption.style.cursor = "pointer";
 
    // Add hover effect for options
 
    const options = [pdfOption, excelOption];
 
    options.forEach((option) => {
      option.addEventListener("mouseover", function () {
        this.style.backgroundColor = "#f0f0f0";
      });
 
      option.addEventListener("mouseout", function () {
        this.style.backgroundColor = "white";
      });
    });
 
    // Add options to dropdown
 
    exportDropdown.appendChild(pdfOption);
 
    exportDropdown.appendChild(excelOption);
 
    // Add dropdown to the document
 
    document.body.appendChild(exportDropdown);
 
    // Handle export options
 
    pdfOption.addEventListener("click", () => {
      exportToPDF();
 
      exportDropdown.style.display = "none";
    });
 
    excelOption.addEventListener("click", () => {
      exportToExcel();
 
      exportDropdown.style.display = "none";
    });
 
    // Close dropdown when clicking outside
 
    document.addEventListener("click", (e) => {
      if (
        exportBtn &&
        !exportBtn.contains(e.target) &&
        !exportDropdown.contains(e.target)
      ) {
        exportDropdown.style.display = "none";
      }
    });
  }
 
  // Toggle dropdown on button click
 
  exportBtn.addEventListener("click", (e) => {
    e.stopPropagation();
 
    console.log("Export button clicked");
 
    // Position the dropdown below the button
 
    const buttonRect = exportBtn.getBoundingClientRect();
 
    exportDropdown.style.top = buttonRect.bottom + window.scrollY + "px";
 
    exportDropdown.style.left = buttonRect.left + window.scrollX + "px";
 
    // Toggle display
 
    if (exportDropdown.style.display === "none") {
      exportDropdown.style.display = "block";
 
      console.log("Export dropdown should be visible now");
    } else {
      exportDropdown.style.display = "none";
    }
  });
 
  // Add image viewer function to window object
 
  window.viewExportImage = (imageId) => {
    const imageData = window.exportImageData[imageId];
 
    if (imageData) {
      const newWindow = window.open("", "_blank");
 
      if (newWindow) {
        newWindow.document.write(`
 
          <!DOCTYPE html>
 
          <html>
 
            <head>
 
              <title>Image Viewer</title>
 
              <style>
 
                body {
 
                  margin: 0;
 
                  padding: 0;
 
                  display: flex;
 
                  justify-content: center;
 
                  align-items: center;
 
                  min-height: 100vh;
 
                  background-color: #f0f0f0;
 
                }
 
                img {
 
                  max-width: 100%;
 
                  max-height: 100vh;
 
                  object-fit: contain;
 
                }
 
              </style>
 
            </head>
 
            <body>
 
              <img src="${imageData}" alt="Full size image" />
 
            </body>
 
          </html>
 
        `);
 
        newWindow.document.close();
      } else {
        alert(
          "Pop-up blocked. Please allow pop-ups for this site to view images."
        );
      }
    } else {
      alert("Image data not found.");
    }
  };
}
 
// Load required libraries for export functionality
 
function loadExportLibraries() {
  // Load SheetJS (XLSX) for Excel export
 
  if (!window.XLSX) {
    const xlsxScript = document.createElement("script");
 
    xlsxScript.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js";
 
    xlsxScript.async = true;
 
    xlsxScript.onload = () => {
      console.log("XLSX library loaded successfully");
 
      librariesLoaded.xlsx = true;
 
      window.XLSX = XLSX; // Assign the XLSX object to the window
    };
 
    xlsxScript.onerror = () => {
      console.error("Failed to load XLSX library");
    };
 
    document.head.appendChild(xlsxScript);
  } else {
    librariesLoaded.xlsx = true;
  }
 
  // Load jsPDF for PDF export
 
  if (!window.jspdf) {
    const jsPdfScript = document.createElement("script");
 
    jsPdfScript.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
 
    jsPdfScript.async = true;
 
    jsPdfScript.onload = () => {
      console.log("jsPDF library loaded successfully");
 
      librariesLoaded.jspdf = true;
 
      // Load jsPDF-AutoTable plugin after jsPDF is loaded
 
      const autoTableScript = document.createElement("script");
 
      autoTableScript.src =
        "https://unpkg.com/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.js";
 
      autoTableScript.async = true;
 
      autoTableScript.onload = () => {
        console.log("AutoTable plugin loaded successfully");
 
        librariesLoaded.autotable = true;
      };
 
      autoTableScript.onerror = () => {
        console.error("Failed to load AutoTable plugin");
      };
 
      document.head.appendChild(autoTableScript);
    };
 
    jsPdfScript.onerror = () => {
      console.error("Failed to load jsPDF library");
    };
 
    document.head.appendChild(jsPdfScript);
  } else {
    librariesLoaded.jspdf = true;
 
    if (typeof window.jspdf.jsPDF.prototype.autoTable === "function") {
      librariesLoaded.autotable = true;
    }
  }
}
 
// Export table data to Excel (XLSX format) without image column
 
async function exportToExcel() {
  console.log("Exporting to Excel...");
 
  // Check if XLSX is loaded
 
  if (!librariesLoaded.xlsx) {
    alert(
      "Excel export library is still loading. Please try again in a moment."
    );
 
    return;
  }
 
  try {
    // Show loading indicator
 
    showLoadingIndicator(true, "Preparing Excel export...");
 
    // Get table data
 
    const tableData = await getTableDataForExcel();
 
    if (!tableData || !tableData.headers || !tableData.rows) {
      throw new Error("No table data found to export");
    }
 
    // Process data to ensure no cell exceeds Excel's character limit (32,767)
 
    const processedRows = tableData.rows.map((row) => {
      return row.map((cell) => {
        if (typeof cell === "string") {
          // Truncate long text
 
          if (cell.length > 32000) {
            return cell.substring(0, 32000) + "...";
          }
        }
 
        return cell;
      });
    });
 
    // Ensure XLSX is available before using it
 
    if (typeof XLSX === "undefined") {
      console.error("XLSX library is not loaded.");
 
      alert(
        "XLSX library is not loaded. Please refresh the page and try again."
      );
 
      return;
    }
 
    // Create worksheet
 
    const ws = XLSX.utils.aoa_to_sheet([tableData.headers, ...processedRows]);
 
    // Set column widths
 
    const colWidths = tableData.headers.map(() => ({ wch: 15 }));
 
    ws["!cols"] = colWidths;
 
    // Create workbook
 
    const wb = XLSX.utils.book_new();
 
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
 
    // Generate Excel file
 
    const fileName = `transactions_export_${formatDateForFileName(
      new Date()
    )}.xlsx`;
 
    XLSX.writeFile(wb, fileName);
 
    console.log("Excel export completed");
 
    showLoadingIndicator(false);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
 
    alert("Failed to export to Excel: " + error.message);
 
    showLoadingIndicator(false);
  }
}
 
// Export table data to PDF (landscape orientation) with embedded images
 
async function exportToPDF() {
  console.log("Exporting to PDF...");
 
  // Check if jsPDF and AutoTable are loaded
 
  if (!librariesLoaded.jspdf || !librariesLoaded.autotable) {
    alert(
      "PDF export libraries are still loading. Please try again in a moment."
    );
 
    return;
  }
 
  try {
    // Show loading indicator
 
    showLoadingIndicator(true, "Preparing PDF export...");
 
    // Get table data with images
 
    const tableData = await getTableDataWithImages();
 
    if (!tableData || !tableData.headers || !tableData.rows) {
      throw new Error("No table data found to export");
    }
 
    // Process data to handle long text
 
    const processedRows = tableData.rows.map((row) => {
      return row.map((cell, colIndex) => {
        // Skip image column as we'll handle it separately
 
        if (colIndex === 6) {
          return ""; // Placeholder for image
        }
 
        if (typeof cell === "string") {
          // Truncate long text for better PDF rendering
 
          if (cell.length > 1000) {
            return cell.substring(0, 1000) + "...";
          }
        }
 
        return cell;
      });
    });
 
    // Create new PDF document (landscape orientation)
 
    const { jsPDF } = window.jspdf;
 
    const doc = new jsPDF({
      orientation: "landscape",
 
      unit: "mm",
 
      format: "legal",
    });
 
    // Add title
 
    doc.setFontSize(16);
 
    doc.text("Transaction Report", 14, 15);
 
    // Add date
 
    doc.setFontSize(10);
 
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
 
    // Verify autoTable is available
 
    if (typeof doc.autoTable !== "function") {
      throw new Error(
        "AutoTable plugin not properly loaded. Please refresh and try again."
      );
    }
 
    // Create table with embedded images
 
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
 
      // Set column styles
 
      columnStyles: {
        6: {
          // Image column
 
          cellWidth: 40,
        },
      },
 
      // Add images to the cells
 
      didDrawCell: (data) => {
        // Only process cells in the image column (index 6) and in the body section
 
        if (data.column.index === 6 && data.cell.section === "body") {
          // Get the row index
 
          const rowIndex = data.row.index;
 
          // Check if we have an image for this cell
 
          if (tableData.imageData && tableData.imageData[rowIndex]) {
            const imageData = tableData.imageData[rowIndex];
 
            if (imageData) {
              try {
                // Dynamically calculate image dimensions to fit within the cell
 
                const maxImgWidth = data.cell.width * 0.9; // Allow some padding
 
                const maxImgHeight = data.cell.height * 0.9; // Allow some padding
 
                // Maintain aspect ratio
 
                const aspectRatio = 20 / 25.4; // Original width/height ratio
 
                let imgWidth = maxImgWidth;
 
                let imgHeight = maxImgWidth / aspectRatio;
 
                if (imgHeight > maxImgHeight) {
                  imgHeight = maxImgHeight;
 
                  imgWidth = maxImgHeight * aspectRatio;
                }
 
                // Calculate position to center the image in the cell
 
                const imgX = data.cell.x + (data.cell.width - imgWidth) / 2;
 
                const imgY = data.cell.y + (data.cell.height - imgHeight) / 2;
 
                // Add the image to the PDF
 
                doc.addImage(
                  imageData,
                  "JPEG",
 
                  imgX,
                  imgY,
 
                  imgWidth,
                  imgHeight
                );
              } catch (error) {
                console.error("Error adding image to PDF:", error);
              }
            }
          }
        }
      },
    });
 
    // Save the PDF
 
    const fileName = `transactions_report_${formatDateForFileName(
      new Date()
    )}.pdf`;
 
    doc.save(fileName);
 
    console.log("PDF export completed");
 
    showLoadingIndicator(false);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
 
    alert("Failed to export to PDF: " + error.message);
 
    showLoadingIndicator(false);
  }
}
 
// Get data from the table excluding the image column for Excel export
 
async function getTableDataForExcel() {
  try {
    // Use filterState from filterModule
 
    const { fetchTransactions, filterState } = await import(
      "./filterModule.js"
    );
 
    // Request all data (e.g. up to 10000 records)
 
    const filters = {
      ...filterState,
 
      page: 1,
 
      limit: 10000,
    };
 
    const response = await fetchTransactions(filters);
 
    const transactions = response.data;
 
    const headers = [
      "TRANSACTION NO.",
 
      "COMPANY CODE",
 
      "EMPLOYEE ID",
 
      "ACTIVITY",
 
      "DATE",
 
      "TIME",
 
      "STATUS",
 
      "SCORE",
    ];
 
    const rows = transactions.map((tx) => {
      const date = new Date(tx.timestamp);
 
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
 
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
 
      return [
        tx.id || tx.transaction_no,
 
        tx.company_code || tx.company,
 
        tx.employee_id || tx.employee,
 
        tx.activity || "N/A",
 
        formattedDate,
 
        formattedTime,
 
        tx.status,
 
        tx.score
          ? typeof tx.score === "string"
            ? tx.score
            : `${tx.score} %`
          : "",
      ];
    });
 
    return { headers, rows };
  } catch (error) {
    console.error("Error fetching data for Excel export:", error);
 
    return { headers: [], rows: [] };
  }
}
 
// Get data from the table including images for PDF
 
async function getTableDataWithImages() {
  try {
    const { fetchTransactions, filterState } = await import(
      "./filterModule.js"
    );
 
    const filters = {
      ...filterState,
 
      page: 1,
 
      limit: 10000,
    };
 
    const response = await fetchTransactions(filters);
 
    const transactions = response.data;
 
    const headers = [
      "TRANSACTION NO.",
 
      "COMPANY CODE",
 
      "EMPLOYEE ID",
 
      "ACTIVITY",
 
      "DATE",
 
      "TIME",
 
      "IMAGE",
 
      "STATUS",
 
      "SCORE",
    ];
 
    const rows = [];
 
    const imageData = [];
 
    for (let tx of transactions) {
      const date = new Date(tx.timestamp);
 
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
 
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
 
      // Image processing
 
      let base64 = tx.image_resize || tx.image_data || "";
 
      if (base64 && !base64.startsWith("data:image")) {
        base64 = `data:image/jpeg;base64,${base64}`;
      }
 
      imageData.push(base64);
 
      rows.push([
        tx.id || tx.transaction_no,
 
        tx.company_code || tx.company,
 
        tx.employee_id || tx.employee,
 
        tx.activity || "N/A",
 
        formattedDate,
 
        formattedTime,
 
        "[IMAGE]", // Placeholder for image
 
        tx.status,
 
        tx.score
          ? typeof tx.score === "string"
            ? tx.score
            : `${tx.score} %`
          : "",
      ]);
    }
 
    return { headers, rows, imageData };
  } catch (error) {
    console.error("Error fetching data for PDF export:", error);
 
    return { headers: [], rows: [], imageData: [] };
  }
}
 
// Format date for file name (YYYY-MM-DD_HH-MM-SS)
 
function formatDateForFileName(date) {
  const year = date.getFullYear();
 
  const month = String(date.getMonth() + 1).padStart(2, "0");
 
  const day = String(date.getDate()).padStart(2, "0");
 
  const hours = String(date.getHours()).padStart(2, "0");
 
  const minutes = String(date.getMinutes()).padStart(2, "0");
 
  const seconds = String(date.getSeconds()).padStart(2, "0");
 
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}
 
// Show/hide loading indicator
 
function showLoadingIndicator(show, message = "Loading...") {
  let loadingIndicator = document.querySelector(".export-loading-indicator");
 
  if (!loadingIndicator && show) {
    loadingIndicator = document.createElement("div");
 
    loadingIndicator.className = "export-loading-indicator";
 
    loadingIndicator.innerHTML = message;
 
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
    });
 
    document.body.appendChild(loadingIndicator);
  } else if (loadingIndicator && !show) {
    loadingIndicator.remove();
  } else if (loadingIndicator && show) {
    loadingIndicator.innerHTML = message;
  }
}
 