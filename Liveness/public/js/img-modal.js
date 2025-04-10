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

  // Reset metrics
  const resetMetrics = () => {
    faceBar.style.width = "0%";
    textureBar.style.width = "0%";
    reflectionBar.style.width = "0%";
    faceScore.textContent = "0.0 %";
    textureScore.textContent = "0.0 %";
    reflectionScore.textContent = "0.0 %";
  };

  if (modal && modalImage && imageStatus && scoreValue) {
    // Use the original image (e.g., a resized version)
    modalImage.src = originalImageSrc;

    const formattedScore = Number.parseFloat(score).toFixed(2);
    scoreValue.textContent = `${formattedScore} %`;
    imageStatus.textContent = status;

    // Fetch remarks (the updated endpoint now processes transactionId more efficiently)
    fetch(`http://192.168.6.93:5001/api/transactions-with-remarks?transaction_id=${transactionId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Transaction details not found');
        }
        return response.json();
      })
      .then(data => {
        const remarks = data.remarks && data.remarks.length > 0 ? data.remarks[0] : {};
        const faceValue = remarks.face_score || 0;
        const textureValue = remarks.texture_score || 0;
        const reflectionValue = remarks.reflection_score || 0;
        faceBar.style.width = `${faceValue}%`;
        textureBar.style.width = `${textureValue}%`;
        reflectionBar.style.width = `${reflectionValue}%`;
        faceScore.textContent = `${Number(faceValue).toFixed(1)} %`;
        textureScore.textContent = `${Number(textureValue).toFixed(1)} %`;
        reflectionScore.textContent = `${Number(reflectionValue).toFixed(1)} %`;
      })
      .catch(error => {
        console.error("Error fetching transaction details:", error);
        resetMetrics();
      });

    // Adjust styling based on the status
    if (status.toLowerCase() === "real") {
      imageStatus.style.color = "#2e7d32";
      scoreValue.style.color = "#2e7d32";
      verificationResult.style.backgroundColor = "#e8f5e9";
      statusIcon.style.backgroundColor = "#4CAF50";
      const icon = statusIcon.querySelector(".icon");
      if (icon) {
        icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      }
      faceBar.style.backgroundColor = "#4CAF50";
      textureBar.style.backgroundColor = "#4CAF50";
      reflectionBar.style.backgroundColor = "#4CAF50";
    } else {
      imageStatus.style.color = "#d32f2f";
      scoreValue.style.color = "#d32f2f";
      verificationResult.style.backgroundColor = "#ffebee";
      statusIcon.style.backgroundColor = "#f44336";
      const icon = statusIcon.querySelector(".icon");
      if (icon) {
        icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
      }
      faceBar.style.backgroundColor = "#e53935";
      textureBar.style.backgroundColor = "#e53935";
      reflectionBar.style.backgroundColor = "#e53935";
    }

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

// Close modal when clicking outside of it
window.onclick = (event) => {
  const modal = document.getElementById("imageModal");
  if (event.target === modal) {
    closeModal();
  }
}
