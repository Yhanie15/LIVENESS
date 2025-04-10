/* sidebar.js */
document.addEventListener("DOMContentLoaded", () => {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const wrapper = document.querySelector(".wrapper");
 
  // Scheduler and Threshold modal triggers
  const schedSidebarLink = document.getElementById("sched-sidebar-link");
  const threshSidebarLink = document.getElementById("thresh-sidebar-link");
 
  function isMobile() {
    return window.innerWidth <= 768;
  }
 
  // Initialize scheduler modal functionality
  if (schedSidebarLink) {
    schedSidebarLink.addEventListener("click", (e) => {
      e.preventDefault();
 
      // Check if the openSchedulerModal function exists
      if (typeof openSchedulerModal === 'function') {
        openSchedulerModal();
      } else {
        console.error("openSchedulerModal function not found");
      }
    });
  }
 
  // Initialize threshold modal functionality
  if (threshSidebarLink) {
    threshSidebarLink.addEventListener("click", (e) => {
      e.preventDefault();
 
      // Check if the openThresholdModal function exists
      if (typeof openThresholdModal === 'function') {
        openThresholdModal();
      } else {
        console.error("openThresholdModal function not found");
      }
    });
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
 
  // Improved submenu handling with Bootstrap collapse events
  const submenuToggles = document.querySelectorAll('[data-bs-toggle="collapse"]');
 
  // Update the icon when collapse state changes
  submenuToggles.forEach(toggle => {
    const targetId = toggle.getAttribute('data-bs-target');
    const targetElement = document.querySelector(targetId);
 
    if (targetElement) {
      // Bootstrap collapse events
      targetElement.addEventListener('show.bs.collapse', () => {
        toggle.setAttribute('aria-expanded', 'true');
        const icon = toggle.querySelector('.submenu-icon');
        if (icon) icon.style.transform = 'rotate(180deg)';
      });
 
      targetElement.addEventListener('hide.bs.collapse', () => {
        toggle.setAttribute('aria-expanded', 'false');
        const icon = toggle.querySelector('.submenu-icon');
        if (icon) icon.style.transform = 'rotate(0deg)';
      });
 
      // Initialize icons based on initial state
      if (targetElement.classList.contains('show')) {
        toggle.setAttribute('aria-expanded', 'true');
        const icon = toggle.querySelector('.submenu-icon');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    }
  });
 
  // Legacy dropdown functionality (keep for backward compatibility)
  const dropdownItems = document.querySelectorAll(".has-dropdown");
  dropdownItems.forEach((item) => {
    const link = item.querySelector(".sidebar-link");
    link.addEventListener("click", (e) => {
      // Only prevent default if it's not a Bootstrap collapse
      if (!link.hasAttribute('data-bs-toggle')) {
        e.preventDefault();
        item.classList.toggle("open");
      }
    });
  });
});
 
 