function openModal(originalImageSrc, score, status, transactionId) {
  console.log("Opening modal with original image:", originalImageSrc, "Score:", score, "Status:", status, "Transaction ID:", transactionId);

  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const imageStatus = document.getElementById("imageStatus");
  const scoreValue = document.getElementById("scoreValue");
  const statusIcon = document.querySelector(".status-icon");
  const verificationResult = document.querySelector(".verification-result");

  // Get progress bars
  const faceBar = document.getElementById("faceBar");
  const textureBar = document.getElementById("textureBar");
  const reflectionBar = document.getElementById("reflectionBar");

  // Get score displays
  const faceScore = document.getElementById("faceScore");
  const textureScore = document.getElementById("textureScore");
  const reflectionScore = document.getElementById("reflectionScore");

  // Reset all metrics to default
  const resetMetrics = () => {
    faceBar.style.width = "0%";
    textureBar.style.width = "0%";
    reflectionBar.style.width = "0%";
    
    faceScore.textContent = "0.0 %";
    textureScore.textContent = "0.0 %";
    reflectionScore.textContent = "0.0 %";
  };

  if (modal && modalImage && imageStatus && scoreValue) {
    // Use the original image passed from the database (image_data)
    modalImage.src = originalImageSrc;

    // Format score as percentage with two decimal places
    const formattedScore = Number.parseFloat(score).toFixed(2);
    scoreValue.textContent = `${formattedScore} %`;

    // Set status text
    imageStatus.textContent = status;

    // Fetch remarks for the specific transaction
    fetch(`http://192.168.6.93:5001/api/transactions-with-remarks?transaction_id=${transactionId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Transaction details not found');
        }
        return response.json();
      })
      .then(data => {
        // Check if remarks exist
        const remarks = data.remarks && data.remarks.length > 0 ? data.remarks[0] : {};

        // Extract scores with fallback to 0
        const faceValue = remarks.face_score || 0;
        const textureValue = remarks.texture_score || 0;
        const reflectionValue = remarks.reflection_score || 0;

        // Update progress bars
        faceBar.style.width = `${faceValue}%`;
        textureBar.style.width = `${textureValue}%`;
        reflectionBar.style.width = `${reflectionValue}%`;

        // Update score displays
        faceScore.textContent = `${Number(faceValue).toFixed(1)} %`;
        textureScore.textContent = `${Number(textureValue).toFixed(1)} %`;
        reflectionScore.textContent = `${Number(reflectionValue).toFixed(1)} %`;
      })
      .catch(error => {
        console.error("Error fetching transaction details:", error);
        // Reset metrics to default on error
        resetMetrics();
      });

    // Determine theme colors based on status
    if (status.toLowerCase() === "real") {
      // Green theme for real images
      imageStatus.style.color = "#2e7d32";
      scoreValue.style.color = "#2e7d32";
      verificationResult.style.backgroundColor = "#e8f5e9";
      statusIcon.style.backgroundColor = "#4CAF50";

      // Change icon to checkmark for real images
      const icon = statusIcon.querySelector(".icon");
      if (icon) {
        icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      }

      // Change progress bars to green
      faceBar.style.backgroundColor = "#4CAF50";
      textureBar.style.backgroundColor = "#4CAF50";
      reflectionBar.style.backgroundColor = "#4CAF50";
    } else {
      // Red theme for fake images
      imageStatus.style.color = "#d32f2f";
      scoreValue.style.color = "#d32f2f";
      verificationResult.style.backgroundColor = "#ffebee";
      statusIcon.style.backgroundColor = "#f44336";

      // Change icon to X for fake images
      const icon = statusIcon.querySelector(".icon");
      if (icon) {
        icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
      }

      // Keep progress bars red
      faceBar.style.backgroundColor = "#e53935";
      textureBar.style.backgroundColor = "#e53935";
      reflectionBar.style.backgroundColor = "#e53935";
    }

    // Display the modal
    modal.style.display = "flex";
  } else {
    console.error("Modal elements not found!");
  }
}

function closeModal() {
  const modal = document.getElementById("imageModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Close modal if user clicks outside the modal content
window.onclick = (event) => {
  const modal = document.getElementById("imageModal");
  if (event.target === modal) {
    closeModal();
  }
}
