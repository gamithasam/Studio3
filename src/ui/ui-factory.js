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
    overlay.id = 'resolution-selector-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: none;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: sans-serif;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #222;
      border-radius: 8px;
      padding: 20px;
      max-width: 400px;
      width: 80%;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Select Export Resolution';
    title.style.margin = '0 0 20px 0';
    
    const presets = [
      { name: 'Full HD (1920×1080)', width: 1920, height: 1080 },
      { name: 'HD (1280×720)', width: 1280, height: 720 },
      { name: '4K (3840×2160)', width: 3840, height: 2160 },
      { name: 'Square (1080×1080)', width: 1080, height: 1080 }
    ];
    
    const form = document.createElement('form');
    
    const radioGroup = document.createElement('div');
    radioGroup.style.marginBottom = '20px';
    
    presets.forEach((preset, i) => {
      const option = document.createElement('div');
      option.style.marginBottom = '8px';
      
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'resolution';
      radio.id = `resolution-${i}`;
      radio.value = i;
      radio.checked = i === 0;
      
      const label = document.createElement('label');
      label.htmlFor = `resolution-${i}`;
      label.textContent = preset.name;
      label.style.marginLeft = '8px';
      
      option.appendChild(radio);
      option.appendChild(label);
      radioGroup.appendChild(option);
    });
    
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.justifyContent = 'space-between';
    buttonGroup.style.marginTop = '20px';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.cursor = 'pointer';
    
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export';
    exportBtn.style.padding = '8px 16px';
    exportBtn.style.cursor = 'pointer';
    exportBtn.style.backgroundColor = '#4CAF50';
    exportBtn.style.color = 'white';
    exportBtn.style.border = 'none';
    
    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(exportBtn);
    
    form.appendChild(radioGroup);
    form.appendChild(buttonGroup);
    
    dialog.appendChild(title);
    dialog.appendChild(form);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    return {
      show: (outputDir) => {
        return new Promise((resolve) => {
          overlay.style.display = 'flex';
          
          cancelBtn.onclick = () => {
            overlay.style.display = 'none';
            resolve(null);
          };
          
          form.onsubmit = (e) => {
            e.preventDefault();
            const selectedIndex = parseInt(form.resolution.value);
            const selectedPreset = presets[selectedIndex];
            
            overlay.style.display = 'none';
            resolve({
              outputDir,
              width: selectedPreset.width,
              height: selectedPreset.height
            });
          };
          
          exportBtn.onclick = () => form.dispatchEvent(new Event('submit'));
        });
      },
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
