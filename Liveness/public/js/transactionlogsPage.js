import TransactionlogsService from "../../src/application/services/TransactionlogsService";

/**
 * Fetches transactionlogs based on page and search term, then updates the table and pagination.
 * @param {number} page - The page number to fetch.
 * @param {string} search - The search term.
 */
export async function fetchTransactionlogs(page, search) {
  try {
    // Optionally show a loading indicator here
    const transactionlogsData = await TransactionlogsService.getAllTransactionlogs(page, 10, search);
    updateTable(transactionlogsData.transactions);
    updatePaginationControls(transactionlogsData.pagination, search);
  } catch (error) {
    console.error("Error fetching transactionlogs:", error);
  }
}

/**
 * Updates the transactionlogs table body with fetched transactions.
 * @param {Array} transactions - The transaction data.
 */
function updateTable(transactions) {
  console.log("Updating table with transactions:", transactions);
  const tableBody = document.querySelector(".transactionlogs-table tbody");
  tableBody.innerHTML = "";
  if (transactions.length > 0) {
    transactions.forEach((transaction) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${transaction.id}</td>
        <td>${transaction.company}</td>
        <td>${transaction.employee}</td>
        <td>${transaction.activity || 'N/A'}</td>
        <td>${transaction.date}</td>
        <td>${transaction.time}</td>
        <td>
          <div class="profile-image-container">
            <img src="${transaction.image}" alt="Profile" class="profile-image" loading="lazy" width="100" height="100"
              onclick="openModal('${transaction.originalImage}', '${transaction.score}', '${transaction.status}', '${transaction.id}')">
          </div>
        </td>
        <td>
          <span class="status-badge ${transaction.status.toLowerCase()}">
            ${transaction.status}
          </span>
        </td>
        <td>${transaction.score}</td>
      `;
      tableBody.appendChild(row);
    });
  } else {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="9" class="no-records">No records found</td>`;
    tableBody.appendChild(row);
  }
}

/**
 * Updates pagination controls based on the pagination data.
 * @param {Object} pagination - The pagination data.
 * @param {string} search - The current search term.
 */
function updatePaginationControls(pagination, search) {
  // Example using next and previous buttons with classes .pagination-next and .pagination-prev
  const nextBtn = document.querySelector(".pagination-next");
  const prevBtn = document.querySelector(".pagination-prev");
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (pagination.currentPage < pagination.totalPages) {
        fetchTransactionlogs(pagination.currentPage + 1, search);
      }
    };
  }
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (pagination.currentPage > 1) {
        fetchTransactionlogs(pagination.currentPage - 1, search);
      }
    };
  }
  // Optionally update pagination display (e.g. "Page X of Y")
  const pageInfo = document.querySelector(".pagination-info");
  if (pageInfo) {
    pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
  }
}
