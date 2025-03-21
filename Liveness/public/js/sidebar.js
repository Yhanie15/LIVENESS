/* sidebar.js */
document.addEventListener("DOMContentLoaded", () => {
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("sidebar");
    const wrapper = document.querySelector(".wrapper");
  
    function isMobile() {
      return window.innerWidth <= 768;
    }
  
    sidebarToggle.addEventListener("click", () => {
      if (isMobile()) {
        // Mobile behavior - just toggle mobile-open class
        sidebar.classList.toggle("mobile-open");
      } else {
        // Desktop behavior - toggle collapse
        sidebar.classList.toggle("collapsed");
        wrapper.classList.toggle("sidebar-collapsed");
      }
    });
  
    // Handle window resize
    function handleResize() {
      if (isMobile()) {
        // Reset desktop classes on mobile
        sidebar.classList.remove("collapsed");
        wrapper.classList.remove("sidebar-collapsed");
  
        // Close sidebar by default on mobile
        sidebar.classList.remove("mobile-open");
      } else {
        // Reset mobile classes on desktop
        sidebar.classList.remove("mobile-open");
      }
    }
  
    // Close sidebar on mobile when clicking outside
    document.addEventListener("click", (event) => {
      if (
        isMobile() &&
        sidebar.classList.contains("mobile-open") &&
        !sidebar.contains(event.target) &&
        !sidebarToggle.contains(event.target)
      ) {
        sidebar.classList.remove("mobile-open");
      }
    });
  
    // Prevent tooltip flicker on mobile
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    sidebarLinks.forEach((link) => {
      link.addEventListener("touchstart", function (e) {
        if (isMobile()) {
          e.preventDefault();
          this.click();
        }
      });
    });
  
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
  
    // Sidebar dropdown functionality
    const dropdownItems = document.querySelectorAll(".has-dropdown");
    dropdownItems.forEach((item) => {
      const link = item.querySelector(".sidebar-link");
      link.addEventListener("click", (e) => {
        e.preventDefault();
        item.classList.toggle("open");
      });
    });
  });
  