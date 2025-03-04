/**
 * Element Editor - Handles text element selection, property editing, and dragging
 */

export default class ElementEditor {
  constructor(editorManager) {
    this.editorManager = editorManager;
    this.bottomPane = document.getElementById('bottomPane');
    this.closeBottomPane = document.getElementById('closeBottomPane');
    this.fontInput = document.getElementById('fontInput');
    this.fontSizeInput = document.getElementById('fontSizeInput');
    this.colorInput = document.getElementById('colorInput');
    this.fontWeightInput = document.getElementById('fontWeightInput');
    this.colorPicker = document.getElementById('colorPicker');
    
    this.lastClickedElement = null;
    this.elementMetadata = null;
    this.isDragging = false;
    this.dragElement = null;
    this.initialX = 0;
    this.initialY = 0;
    this.initialElementX = 0;
    this.initialElementY = 0;
    this.dragThreshold = 5; // Pixels to move before considered a drag vs a click
    
    this.setupEventListeners();
    this.addDragStyles();
  }
  
  setupEventListeners() {
    // Close button for bottom pane
    this.closeBottomPane.addEventListener('click', () => {
      this.hideBottomPane();
      if (this.lastClickedElement) {
        this.lastClickedElement.classList.remove('selected-element');
        this.lastClickedElement = null;
      }
    });
    
    // Document click handler for deselecting elements
    document.addEventListener('click', (e) => {
      if (!e.target.closest('h1, h2, p, li') && !e.target.closest('#bottomPane')) {
        if (this.lastClickedElement) {
          this.lastClickedElement.classList.remove('selected-element');
          this.lastClickedElement = null;
          this.elementMetadata = null;
        }
        this.hideBottomPane();
      }
    });
    
    // Property change handlers
    this.fontInput.addEventListener('input', this.updateElementProperties.bind(this));
    this.fontSizeInput.addEventListener('input', this.updateElementProperties.bind(this));
    this.colorInput.addEventListener('input', this.updateElementProperties.bind(this));
    this.fontWeightInput.addEventListener('change', this.updateElementProperties.bind(this));
    
    // Color picker input
    this.colorPicker.addEventListener('input', (e) => {
      const newColor = e.target.value;
      this.colorInput.value = newColor;
      this.updateElementProperties(); // Trigger the update immediately
    });
    
    this.colorInput.addEventListener('input', (e) => {
      const newColor = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(newColor)) {
        this.colorPicker.value = newColor;
        this.updateElementProperties(); // Trigger the update when valid hex color is entered
      }
    });
  }
  
  setOverlayElement(overlay) {
    // Add handlers to the overlay for selecting and dragging elements
    overlay.addEventListener('click', this.handleOverlayClick.bind(this));
    
    // Add drag handlers
    overlay.addEventListener('mousedown', this.startDrag.bind(this));
    document.addEventListener('mousemove', this.updateDrag.bind(this));
    document.addEventListener('mouseup', this.endDrag.bind(this));
    
    // Double-click should reset position
    overlay.addEventListener('dblclick', this.resetElementPosition.bind(this));
  }
  
  handleOverlayClick(e) {
    const element = e.target;
    // Only show pane if a text element is clicked
    if (this.isEditableElement(element)) {
      e.stopPropagation();
      
      // Check if the element is in the current slide
      if (this.elementBelongsToCurrentSlide(element)) {
        // Remove highlight from previously selected element, if any
        if (this.lastClickedElement) {
          this.lastClickedElement.classList.remove('selected-element');
        }
        
        // Set and highlight the currently clicked element
        this.lastClickedElement = element;
        this.lastClickedElement.classList.add('selected-element');
        
        // Store element metadata for code updates
        this.elementMetadata = this.getElementPath(element);
        
        // Show properties in bottom pane
        this.showBottomPane(element);
      }
    }
  }
  
  isEditableElement(element) {
    const editableTags = ['H1', 'H2', 'H3', 'P', 'SPAN', 'DIV', 'LI', 'UL', 'OL'];
    return editableTags.includes(element.tagName);
  }
  
  elementBelongsToCurrentSlide(element) {
    const slideContainer = element.closest('[data-slide-container]');
    if (!slideContainer) return false;
    
    const slideIndex = parseInt(slideContainer.getAttribute('data-slide-container').replace('slide-', ''));
    return slideIndex === this.editorManager.getCurrentSlideIndex();
  }
  
  getElementPath(element) {
    // Find which slide container this element belongs to
    const slideContainer = element.closest('[data-slide-container]');
    if (!slideContainer) return null;
    
    const slideIndex = parseInt(slideContainer.getAttribute('data-slide-container').replace('slide-', ''));
    
    // Get element's content and tag as identifiers
    const textContent = element.textContent.trim();
    const tagName = element.tagName.toLowerCase();
    
    return { 
      slideIndex, 
      element,
      tagName,
      textContent: textContent.substring(0, 30), // First 30 chars for identification
      innerHTML: element.innerHTML
    };
  }
  
  showBottomPane(element) {
    // Show existing properties
    const style = window.getComputedStyle(element);
    this.fontInput.value = style.fontFamily.replace(/['"]/g, '');
    this.fontSizeInput.value = parseInt(style.fontSize);
    this.colorInput.value = this.rgbToHex(style.color);
    this.fontWeightInput.value = style.fontWeight;
    this.colorPicker.value = this.rgbToHex(style.color);
    
    // Show the bottom pane
    this.bottomPane.classList.add('visible');
  }
  
  hideBottomPane() {
    this.bottomPane.classList.remove('visible');
  }
  
  updateElementProperties() {
    if (!this.lastClickedElement) return;
    
    const newColor = this.colorInput.value;
    const newFontFamily = this.fontInput.value;
    const newFontSize = this.fontSizeInput.value + 'px';
    const newFontWeight = this.fontWeightInput.value;
    
    const styleChanges = {};
    
    // Only update if values are valid
    if (newFontFamily) {
      this.lastClickedElement.style.fontFamily = newFontFamily;
      styleChanges['font-family'] = `"${newFontFamily}"`;
    }
    
    if (parseInt(this.fontSizeInput.value) > 0) {
      this.lastClickedElement.style.fontSize = newFontSize;
      styleChanges['font-size'] = newFontSize;
    }
    
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      this.lastClickedElement.style.color = newColor;
      styleChanges['color'] = newColor;
    }
    
    if (newFontWeight !== 'inherit') {
      this.lastClickedElement.style.fontWeight = newFontWeight;
      styleChanges['font-weight'] = newFontWeight;
    }
    
    // Update the code
    if (Object.keys(styleChanges).length > 0) {
      this.editorManager.updateElementStyleInCode(this.elementMetadata, styleChanges);
    }
  }
  
  // Dragging functionality
  startDrag(e) {
    // Only start dragging on text elements and make sure it's in the current slide
    const element = e.target;
    if (!this.isEditableElement(element)) return;
    
    if (!this.elementBelongsToCurrentSlide(element)) return;

    // Mark this element as selected
    if (this.lastClickedElement) {
      this.lastClickedElement.classList.remove('selected-element');
    }
    
    this.lastClickedElement = element;
    element.classList.add('selected-element');
    this.elementMetadata = this.getElementPath(element);
    this.showBottomPane(element);
    
    // Store initial positions
    this.initialX = e.clientX;
    this.initialY = e.clientY;
    
    // Get current position, whether it's in transform, top/left, or margin
    const style = window.getComputedStyle(element);
    this.initialElementX = parseInt(style.left) || 0;
    this.initialElementY = parseInt(style.top) || 0;
    
    // Check if element has any position set
    if (style.position === 'static') {
      // Make element positioned if it's not already
      element.style.position = 'relative';
      this.initialElementX = 0;
      this.initialElementY = 0;
    }
    
    // Set up for drag operation
    this.dragElement = element;
    this.isDragging = false; // Start with false, will set to true after threshold
    
    // Add dragging class for visual feedback
    element.classList.add('dragging');
    
    e.preventDefault();
    e.stopPropagation();
  }

  updateDrag(e) {
    if (!this.dragElement) return;
    
    // Calculate distance moved
    const dx = e.clientX - this.initialX;
    const dy = e.clientY - this.initialY;
    
    // Only start actual dragging after threshold
    if (!this.isDragging && (Math.abs(dx) > this.dragThreshold || Math.abs(dy) > this.dragThreshold)) {
      this.isDragging = true;
    }
    
    if (this.isDragging) {
      // Update element position
      this.dragElement.style.left = `${this.initialElementX + dx}px`;
      this.dragElement.style.top = `${this.initialElementY + dy}px`;
      
      // Show position feedback
      this.showPositionFeedback(this.dragElement, this.initialElementX + dx, this.initialElementY + dy);
    }
  }

  endDrag(e) {
    if (this.dragElement) {
      this.dragElement.classList.remove('dragging');
      
      if (this.isDragging) {
        // Calculate final position
        const dx = e.clientX - this.initialX;
        const dy = e.clientY - this.initialY;
        const newX = this.initialElementX + dx;
        const newY = this.initialElementY + dy;
        
        // Hide position feedback
        this.hidePositionFeedback();
        
        // Update the code with new position
        this.editorManager.updateElementPositionInCode(this.elementMetadata, newX, newY);
        
        // Prevent click event from triggering
        e.preventDefault();
        e.stopPropagation();
      }
      
      this.dragElement = null;
      this.isDragging = false;
    }
  }

  resetElementPosition(e) {
    if (!this.isEditableElement(e.target)) return;
    
    const element = e.target;
    element.style.left = '';
    element.style.top = '';
    
    // Get metadata for the element
    const elementMetadata = this.getElementPath(element);
    
    // Update the code to remove position
    this.editorManager.updateElementPositionInCode(elementMetadata, null, null);
  }
  
  // Show a position indicator during drag
  showPositionFeedback(element, x, y) {
    let positionDisplay = document.getElementById('position-display');
    
    if (!positionDisplay) {
      positionDisplay = document.createElement('div');
      positionDisplay.id = 'position-display';
      positionDisplay.style.cssText = `
        position: absolute;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
      `;
      document.body.appendChild(positionDisplay);
    }
    
    // Position the indicator near the element
    const rect = element.getBoundingClientRect();
    positionDisplay.style.left = `${rect.right + 10}px`;
    positionDisplay.style.top = `${rect.top}px`;
    positionDisplay.textContent = `X: ${Math.round(x)}px, Y: ${Math.round(y)}px`;
    positionDisplay.style.display = 'block';
  }

  hidePositionFeedback() {
    const positionDisplay = document.getElementById('position-display');
    if (positionDisplay) {
      positionDisplay.style.display = 'none';
    }
  }
  
  // Add CSS for dragging
  addDragStyles() {
    const dragStyles = document.createElement('style');
    dragStyles.textContent = `
      .dragging {
        cursor: move !important;
        opacity: 0.8;
        outline: 2px dashed #007bff;
      }
      .selected-element {
        outline: 2px solid #007bff;
      }
      [data-slide-container] h1, [data-slide-container] h2, 
      [data-slide-container] p, [data-slide-container] li {
        cursor: pointer;
        position: relative;
      }
    `;
    document.head.appendChild(dragStyles);
  }
  
  rgbToHex(rgb) {
    // If it's already a hex value, return it
    if (rgb.startsWith('#')) return rgb;
    
    // Extract RGB values
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#ffffff';
    
    const r = parseInt(rgbValues[0]);
    const g = parseInt(rgbValues[1]);
    const b = parseInt(rgbValues[2]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}
