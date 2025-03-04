/**
 * UIFactory - Creates UI components
 * Centralizes UI component creation logic
 */

export default class UIFactory {
  /**
   * Create export progress overlay
   * @returns {Object} API for the export progress UI
   */
  static createExportProgressOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'export-progress-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #222;
      border-radius: 8px;
      padding: 20px;
      max-width: 400px;
      width: 80%;
      text-align: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Exporting Slides';
    title.style.margin = '0 0 20px 0';
    
    const message = document.createElement('div');
    message.id = 'export-message';
    message.textContent = 'Preparing...';
    message.style.marginBottom = '15px';
    
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      background: #333;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 15px;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.id = 'export-progress-bar';
    progressBar.style.cssText = `
      height: 100%;
      width: 0%;
      background: #4CAF50;
      transition: width 0.3s ease;
    `;
    
    progressContainer.appendChild(progressBar);
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(progressContainer);
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    return {
      show: () => { overlay.style.display = 'flex'; },
      hide: () => { overlay.style.display = 'none'; },
      updateProgress: (percent, msg) => {
        progressBar.style.width = `${percent}%`;
        if (msg) message.textContent = msg;
      }
    };
  }
  
  /**
   * Create resolution selector dialog
   * @returns {Object} API for the resolution selector UI
   */
  static createResolutionSelectorDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'resolution-selector';
    dialog.style.cssText = `
      background-color: #2a2a2a;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      width: 400px;
      max-width: 90%;
    `;
    
    const heading = document.createElement('h2');
    heading.textContent = 'Export Resolution';
    heading.style.cssText = `
      margin-top: 0;
      color: #fff;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    `;
    
    const resolutionForm = document.createElement('div');
    resolutionForm.innerHTML = `
      <p style="color: #ccc; margin-bottom: 1.5rem;">
        Choose the export resolution for your slides:
      </p>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <label style="display: flex; align-items: center;">
          <input type="radio" name="resolution" value="1920x1080" checked>
          <span style="color: #fff; margin-left: 0.5rem;">1920×1080 (Full HD)</span>
        </label>
        <label style="display: flex; align-items: center;">
          <input type="radio" name="resolution" value="3840x2160">
          <span style="color: #fff; margin-left: 0.5rem;">3840×2160 (4K UHD)</span>
        </label>
        <label style="display: flex; align-items: center;">
          <input type="radio" name="resolution" value="1280x720">
          <span style="color: #fff; margin-left: 0.5rem;">1280×720 (HD)</span>
        </label>
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem; gap: 1rem;">
        <button id="cancelExportBtn" style="padding: 0.5rem 1rem; background: #555; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button id="startExportBtn" style="padding: 0.5rem 1rem; background: #007bff; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Export</button>
      </div>
    `;
    
    dialog.appendChild(heading);
    dialog.appendChild(resolutionForm);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Function to show the dialog and return a promise
    function show(outputDir) {
      return new Promise((resolve) => {
        overlay.style.display = 'flex';
        
        // Get buttons
        const cancelBtn = document.getElementById('cancelExportBtn');
        const startBtn = document.getElementById('startExportBtn');
        
        // Handle cancel
        const onCancel = () => {
          cancelBtn.removeEventListener('click', onCancel);
          startBtn.removeEventListener('click', onStart);
          overlay.style.display = 'none';
          resolve(null);
        };
        
        // Handle start
        const onStart = () => {
          const selectedResolution = document.querySelector('input[name="resolution"]:checked').value;
          const [width, height] = selectedResolution.split('x').map(Number);
          
          cancelBtn.removeEventListener('click', onCancel);
          startBtn.removeEventListener('click', onStart);
          overlay.style.display = 'none';
          resolve({
            width,
            height,
            outputDir
          });
        };
        
        cancelBtn.addEventListener('click', onCancel);
        startBtn.addEventListener('click', onStart);
      });
    }
    
    // Return controller object
    return {
      show,
      hide: () => {
        overlay.style.display = 'none';
      }
    };
  }
  
  /**
   * Creates a paused overlay for the preview
   * @param {HTMLElement} container - Container to append the overlay to
   * @returns {HTMLElement} The created overlay element
   */
  static createPausedOverlay(container) {
    const overlay = document.createElement('div');
    overlay.className = 'paused-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      display: none;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      z-index: 1000;
    `;
    
    const message = document.createElement('div');
    message.textContent = 'Presentation Active';
    overlay.appendChild(message);
    
    if (container) {
      container.appendChild(overlay);
    }
    
    return overlay;
  }
}
