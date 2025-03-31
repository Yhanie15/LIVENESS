// Loading Screen JavaScript
class LoadingScreen {
    constructor() {
      this.overlay = null;
      this.progressBar = null;
      this.initialized = false;
    }
  
    init() {
      if (this.initialized) return;
      
      // Create loading overlay element
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      
      // Create spinner
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      
      // Create text
      const text = document.createElement('div');
      text.className = 'loading-text';
      text.textContent = 'Loading dashboard data...';
      
      // Create progress container
      const progressContainer = document.createElement('div');
      progressContainer.className = 'loading-progress';
      
      // Create progress bar
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'loading-progress-bar';
      progressContainer.appendChild(this.progressBar);
      
      // Append all elements to overlay
      this.overlay.appendChild(spinner);
      this.overlay.appendChild(text);
      this.overlay.appendChild(progressContainer);
      
      // Append overlay to body
      document.body.appendChild(this.overlay);
      
      this.initialized = true;
    }
    
    show() {
      if (!this.initialized) this.init();
      this.overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Prevent scrolling while loading
    }
    
    hide() {
      if (!this.initialized) return;
      this.overlay.classList.add('hidden');
      document.body.style.overflow = ''; // Restore scrolling
      
      // Reset progress bar for next time
      setTimeout(() => {
        if (this.progressBar) this.progressBar.style.width = '0%';
      }, 300);
    }
    
    setProgress(percent) {
      if (!this.initialized || !this.progressBar) return;
      this.progressBar.style.width = `${percent}%`;
    }
  }
  
  // Create a global instance
  window.loadingScreen = new LoadingScreen();