function openModal(imageSrc) {
    console.log("Opening modal with image:", imageSrc); // Debugging log
    let modal = document.getElementById("imageModal");
    let modalImage = document.getElementById("modalImage");
   
    if (modal && modalImage) {
      modalImage.src = imageSrc;
      modal.style.display = "flex";
    } else {
      console.error("Modal or image element not found!");
    }
  }
   
  function closeModal() {
    let modal = document.getElementById("imageModal");
    if (modal) {
      modal.style.display = "none";
    }
  }
   
  // Close modal if user clicks outside content
  window.onclick = function(event) {
    let modal = document.getElementById("imageModal");
    if (event.target === modal) {
      closeModal();
    }
  };