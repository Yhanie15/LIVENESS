/* header.js */
document.addEventListener("DOMContentLoaded", () => {
    // Update time and date in Philippine time (UTC+8)
    function updateDateTime() {
        const options = {
            timeZone: "Asia/Manila",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        };
 
        const dateOptions = {
            timeZone: "Asia/Manila",
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        };
 
        const now = new Date();
 
        // Format time
        const timeElement = document.getElementById("current-time");
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString("en-US", options);
        }
 
        // Format date
        const dateElement = document.getElementById("current-date");
        if (dateElement) {
            const dateStr = now.toLocaleDateString("en-US", dateOptions);
            // e.g. "Wed, Feb 26, 2025" => "Wed., Feb 26, 2025"
            const formattedDate = dateStr
                .replace(/,\s*([0-9]{4})/, ", $1")
                .replace(/(\w+),/, "$1.,");
            dateElement.textContent = formattedDate;
        }
    }
 
    // Update time every second
    updateDateTime();
    setInterval(updateDateTime, 1000);
 
   
    const avatarBtn = document.getElementById("avatar-btn");
    const dropdownMenu = document.getElementById("dropdown-menu");
 
    avatarBtn.addEventListener("click", () => {
      dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    });
 
    document.addEventListener("click", (event) => {
      if (!avatarBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = "none";
      }
    });
  });