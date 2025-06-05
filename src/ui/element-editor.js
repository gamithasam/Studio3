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
    
    // Resize functionality properties
    this.isResizing = false;
    this.resizeElement = null;
    this.resizePosition = null;
    this.resizeStartX = 0;
    this.resizeStartY = 0;
    this.resizeStartWidth = 0;
    this.resizeStartHeight = 0;
    this.resizeStartLeft = 0;
    this.resizeStartTop = 0;
    this.currentResizeContainer = null;
    this.currentResizingShape = null;
    
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
      if (!e.target.closest('h1, h2, p, li') && !e.target.closest('#bottomPane') && !e.target.closest('[data-editable-shape]')) {
        if (this.lastClickedElement) {
          this.lastClickedElement.classList.remove('selected-element');
          this.lastClickedElement = null;
          this.elementMetadata = null;
        }
        this.removeResizeHandles();
        this.hideBottomPane();
      }
    });
    
    // Keyboard event listener for shape deletion
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.lastClickedElement && this.lastClickedElement.hasAttribute('data-editable-shape')) {
          e.preventDefault();
          this.deleteShape(this.lastClickedElement);
        }
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
    
    // Don't handle clicks on resize handles
    if (element.classList.contains('resize-handle')) {
      return;
    }
    
    // Handle both text elements and shapes
    if (this.isEditableElement(element)) {
      e.stopPropagation();
      
      // Check if the element is in the current slide
      if (this.elementBelongsToCurrentSlide(element)) {
        // Remove highlight from previously selected element, if any
        if (this.lastClickedElement) {
          this.lastClickedElement.classList.remove('selected-element');
        }
        
        // Remove any existing resize handles
        this.removeResizeHandles();
        
        // Set and highlight the currently clicked element
        this.lastClickedElement = element;
        this.lastClickedElement.classList.add('selected-element');
        
        // Check if it's a shape or text element
        if (element.hasAttribute('data-editable-shape')) {
          // Handle shape selection
          this.addResizeHandles(element);
          this.showShapeProperties(element);
        } else {
          // Handle text element selection
          this.elementMetadata = this.getElementPath(element);
          this.showBottomPane(element);
        }
      }
    } else {
      // Clicked on empty space - remove selection and resize handles
      if (this.lastClickedElement) {
        this.lastClickedElement.classList.remove('selected-element');
        this.lastClickedElement = null;
      }
      this.removeResizeHandles();
      this.hideBottomPane();
    }
  }
  
  isEditableElement(element) {
    // Check if it's a shape element
    if (element.hasAttribute('data-editable-shape')) {
      return true;
    }
    
    // Check if it's a text element
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
    // Only start dragging on text elements and shapes, make sure it's in the current slide
    const element = e.target;
    if (!this.isEditableElement(element)) return;
    
    if (!this.elementBelongsToCurrentSlide(element)) return;

    // Mark this element as selected
    if (this.lastClickedElement) {
      this.lastClickedElement.classList.remove('selected-element');
    }
    
    this.lastClickedElement = element;
    element.classList.add('selected-element');
    
    // Show appropriate properties panel based on element type
    if (element.hasAttribute('data-editable-shape')) {
      this.showShapeProperties(element);
    } else {
      this.elementMetadata = this.getElementPath(element);
      this.showBottomPane(element);
    }
    
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
  
  // Add shape selection functionality
  selectShape(shapeElement) {
    if (!shapeElement || !shapeElement.hasAttribute('data-editable-shape')) {
      return;
    }
    
    // Remove highlight from previously selected element
    if (this.lastClickedElement) {
      this.lastClickedElement.classList.remove('selected-element');
    }
    
    // Remove any existing resize handles
    this.removeResizeHandles();
    
    // Set and highlight the currently clicked shape
    this.lastClickedElement = shapeElement;
    shapeElement.classList.add('selected-element');
    
    // Add resize handles for the shape
    this.addResizeHandles(shapeElement);
    
    // Show properties panel for shape
    this.showShapeProperties(shapeElement);
  }
  
  showShapeProperties(shapeElement) {
    const shapeType = shapeElement.getAttribute('data-shape-type');
    const shapeId = shapeElement.getAttribute('data-shape-id');
    
    // Get current styles
    const computedStyle = window.getComputedStyle(shapeElement);
    const currentWidth = parseInt(computedStyle.width) || 100;
    const currentHeight = parseInt(computedStyle.height) || 60;
    const currentBackground = computedStyle.backgroundColor || '#007acc';
    const currentColor = computedStyle.color || '#ffffff';
    const currentFontSize = parseInt(computedStyle.fontSize) || 48;
    
    // Create shape-specific property controls
    const propertyControls = document.getElementById('propertyControls');
    propertyControls.innerHTML = `
      <div class="control-group">
        <label>Shape Type</label>
        <div style="font-weight: bold; text-transform: capitalize;">${shapeType}</div>
      </div>
      
      ${this.getShapeSpecificControls(shapeType, {
        width: currentWidth,
        height: currentHeight,
        backgroundColor: currentBackground,
        color: currentColor,
        fontSize: currentFontSize
      })}
      
      <div class="control-group">
        <label>Position</label>
        <div style="display: flex; gap: 8px;">
          <input type="number" id="shapeLeft" value="${parseInt(shapeElement.style.left) || 50}" style="width: 60px;">
          <span style="color: #666;">%</span>
          <input type="number" id="shapeTop" value="${parseInt(shapeElement.style.top) || 50}" style="width: 60px;">
          <span style="color: #666;">%</span>
        </div>
      </div>
      
      <div class="control-group">
        <label>Actions</label>
        <button id="deleteShapeBtn" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Delete Shape</button>
      </div>
    `;
    
    // Add event listeners for shape property changes
    this.setupShapePropertyListeners(shapeElement);
    
    // Add delete button event listener
    const deleteBtn = document.getElementById('deleteShapeBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteShape(shapeElement);
      });
    }
    
    // Add resize handles for the shape
    this.addResizeHandles(shapeElement);
    
    // Show the bottom pane
    this.bottomPane.classList.add('visible');
  }
  
  getShapeSpecificControls(shapeType, currentValues) {
    switch (shapeType) {
      case 'rectangle':
      case 'circle':
      case 'diamond':
        return `
          <div class="control-group">
            <label>Width</label>
            <input type="number" id="shapeWidth" value="${currentValues.width}" min="10" max="500">
          </div>
          <div class="control-group">
            <label>Height</label>
            <input type="number" id="shapeHeight" value="${currentValues.height}" min="10" max="500">
          </div>
          <div class="control-group">
            <label>Background Color</label>
            <div class="color-with-text">
              <input type="color" id="shapeColorPicker" value="${this.rgbToHex(currentValues.backgroundColor)}">
              <input type="text" id="shapeColorInput" value="${this.rgbToHex(currentValues.backgroundColor)}">
            </div>
          </div>
        `;
      
      case 'triangle':
        return `
          <div class="control-group">
            <label>Size</label>
            <input type="number" id="triangleSize" value="${currentValues.width / 2 || 40}" min="10" max="200">
          </div>
          <div class="control-group">
            <label>Border Color</label>
            <div class="color-with-text">
              <input type="color" id="shapeColorPicker" value="${this.rgbToHex(currentValues.backgroundColor)}">
              <input type="text" id="shapeColorInput" value="${this.rgbToHex(currentValues.backgroundColor)}">
            </div>
          </div>
        `;
      
      case 'star':
      case 'arrow':
        return `
          <div class="control-group">
            <label>Size</label>
            <input type="number" id="shapeFontSize" value="${currentValues.fontSize}" min="12" max="200">
          </div>
          <div class="control-group">
            <label>Color</label>
            <div class="color-with-text">
              <input type="color" id="shapeColorPicker" value="${this.rgbToHex(currentValues.color)}">
              <input type="text" id="shapeColorInput" value="${this.rgbToHex(currentValues.color)}">
            </div>
          </div>
        `;
      
      default:
        return '';
    }
  }
  
  setupShapePropertyListeners(shapeElement) {
    const shapeType = shapeElement.getAttribute('data-shape-type');
    
    // Position controls
    const leftInput = document.getElementById('shapeLeft');
    const topInput = document.getElementById('shapeTop');
    
    if (leftInput) {
      leftInput.addEventListener('input', () => {
        shapeElement.style.left = leftInput.value + '%';
      });
    }
    
    if (topInput) {
      topInput.addEventListener('input', () => {
        shapeElement.style.top = topInput.value + '%';
      });
    }
    
    // Color controls
    const colorPicker = document.getElementById('shapeColorPicker');
    const colorInput = document.getElementById('shapeColorInput');
    
    if (colorPicker && colorInput) {
      colorPicker.addEventListener('input', (e) => {
        const newColor = e.target.value;
        colorInput.value = newColor;
        this.updateShapeColor(shapeElement, shapeType, newColor);
      });
      
      colorInput.addEventListener('input', (e) => {
        const newColor = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(newColor)) {
          colorPicker.value = newColor;
          this.updateShapeColor(shapeElement, shapeType, newColor);
        }
      });
    }
    
    // Size controls based on shape type
    if (shapeType === 'rectangle' || shapeType === 'circle' || shapeType === 'diamond') {
      const widthInput = document.getElementById('shapeWidth');
      const heightInput = document.getElementById('shapeHeight');
      
      if (widthInput) {
        widthInput.addEventListener('input', () => {
          shapeElement.style.width = widthInput.value + 'px';
        });
      }
      
      if (heightInput) {
        heightInput.addEventListener('input', () => {
          shapeElement.style.height = heightInput.value + 'px';
        });
      }
    } else if (shapeType === 'triangle') {
      const sizeInput = document.getElementById('triangleSize');
      if (sizeInput) {
        sizeInput.addEventListener('input', () => {
          const size = sizeInput.value;
          shapeElement.style.borderLeftWidth = size + 'px solid transparent';
          shapeElement.style.borderRightWidth = size + 'px solid transparent';
          shapeElement.style.borderBottomWidth = (size * 1.75) + 'px solid';
        });
      }
    } else if (shapeType === 'star' || shapeType === 'arrow') {
      const fontSizeInput = document.getElementById('shapeFontSize');
      if (fontSizeInput) {
        fontSizeInput.addEventListener('input', () => {
          shapeElement.style.fontSize = fontSizeInput.value + 'px';
        });
      }
    }
  }
  
  updateShapeColor(shapeElement, shapeType, color) {
    if (shapeType === 'triangle') {
      shapeElement.style.borderBottomColor = color;
    } else if (shapeType === 'star' || shapeType === 'arrow') {
      shapeElement.style.color = color;
    } else {
      shapeElement.style.backgroundColor = color;
    }
  }
  
  rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#000000';
    
    // If it's already a hex color, return it
    if (rgb.startsWith('#')) return rgb;
    
    // Convert rgb() to hex
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    return '#000000';
  }
  
  // Add resize handles functionality for shapes
  addResizeHandles(shapeElement) {
    // Remove existing resize handles first
    this.removeResizeHandles();
    
    const shapeType = shapeElement.getAttribute('data-shape-type');
    
    // Don't add resize handles for text-based shapes (star, arrow)
    if (shapeType === 'star' || shapeType === 'arrow') {
      return;
    }
    
    // Create resize handles container
    const resizeContainer = document.createElement('div');
    resizeContainer.className = 'resize-handles-container';
    resizeContainer.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 1001;
    `;
    
    // Position container to match shape element
    const rect = shapeElement.getBoundingClientRect();
    const containerRect = shapeElement.offsetParent.getBoundingClientRect();
    
    resizeContainer.style.left = (rect.left - containerRect.left) + 'px';
    resizeContainer.style.top = (rect.top - containerRect.top) + 'px';
    resizeContainer.style.width = rect.width + 'px';
    resizeContainer.style.height = rect.height + 'px';
    
    // Create 8 resize handles (corners and midpoints)
    const handles = [
      { position: 'nw', cursor: 'nw-resize', x: 0, y: 0 },
      { position: 'n', cursor: 'n-resize', x: 0.5, y: 0 },
      { position: 'ne', cursor: 'ne-resize', x: 1, y: 0 },
      { position: 'e', cursor: 'e-resize', x: 1, y: 0.5 },
      { position: 'se', cursor: 'se-resize', x: 1, y: 1 },
      { position: 's', cursor: 's-resize', x: 0.5, y: 1 },
      { position: 'sw', cursor: 'sw-resize', x: 0, y: 1 },
      { position: 'w', cursor: 'w-resize', x: 0, y: 0.5 }
    ];
    
    handles.forEach(handle => {
      const handleElement = document.createElement('div');
      handleElement.className = `resize-handle resize-handle-${handle.position}`;
      handleElement.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: #2684FF;
        border: 1px solid #fff;
        border-radius: 2px;
        cursor: ${handle.cursor};
        pointer-events: auto;
        transform: translate(-50%, -50%);
        left: ${handle.x * 100}%;
        top: ${handle.y * 100}%;
      `;
      
      // Add resize event listeners
      handleElement.addEventListener('mousedown', (e) => {
        this.startResize(e, shapeElement, handle.position);
      });
      
      resizeContainer.appendChild(handleElement);
    });
    
    // Add to the shape's parent container
    shapeElement.offsetParent.appendChild(resizeContainer);
    this.currentResizeContainer = resizeContainer;
    this.currentResizingShape = shapeElement;
  }
  
  removeResizeHandles() {
    if (this.currentResizeContainer) {
      this.currentResizeContainer.remove();
      this.currentResizeContainer = null;
      this.currentResizingShape = null;
    }
  }
  
  startResize(e, shapeElement, position) {
    e.preventDefault();
    e.stopPropagation();
    
    this.isResizing = true;
    this.resizePosition = position;
    this.resizeElement = shapeElement;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    
    const rect = shapeElement.getBoundingClientRect();
    this.resizeStartWidth = rect.width;
    this.resizeStartHeight = rect.height;
    this.resizeStartLeft = parseInt(shapeElement.style.left) || 0;
    this.resizeStartTop = parseInt(shapeElement.style.top) || 0;
    
    document.addEventListener('mousemove', this.updateResize.bind(this));
    document.addEventListener('mouseup', this.endResize.bind(this));
    
    // Add resizing class for visual feedback
    shapeElement.classList.add('resizing');
  }
  
  updateResize(e) {
    if (!this.isResizing || !this.resizeElement) return;
    
    const dx = e.clientX - this.resizeStartX;
    const dy = e.clientY - this.resizeStartY;
    
    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;
    let newLeft = this.resizeStartLeft;
    let newTop = this.resizeStartTop;
    
    // Calculate new dimensions based on resize handle position
    switch (this.resizePosition) {
      case 'nw':
        newWidth = this.resizeStartWidth - dx;
        newHeight = this.resizeStartHeight - dy;
        newLeft = this.resizeStartLeft + dx;
        newTop = this.resizeStartTop + dy;
        break;
      case 'n':
        newHeight = this.resizeStartHeight - dy;
        newTop = this.resizeStartTop + dy;
        break;
      case 'ne':
        newWidth = this.resizeStartWidth + dx;
        newHeight = this.resizeStartHeight - dy;
        newTop = this.resizeStartTop + dy;
        break;
      case 'e':
        newWidth = this.resizeStartWidth + dx;
        break;
      case 'se':
        newWidth = this.resizeStartWidth + dx;
        newHeight = this.resizeStartHeight + dy;
        break;
      case 's':
        newHeight = this.resizeStartHeight + dy;
        break;
      case 'sw':
        newWidth = this.resizeStartWidth - dx;
        newHeight = this.resizeStartHeight + dy;
        newLeft = this.resizeStartLeft + dx;
        break;
      case 'w':
        newWidth = this.resizeStartWidth - dx;
        newLeft = this.resizeStartLeft + dx;
        break;
    }
    
    // Apply minimum size constraints
    const minSize = 10;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);
    
    // Update element styles
    const shapeType = this.resizeElement.getAttribute('data-shape-type');
    
    if (shapeType === 'triangle') {
      // For triangles, update border properties
      const size = Math.min(newWidth, newHeight) / 2;
      this.resizeElement.style.borderLeftWidth = size + 'px';
      this.resizeElement.style.borderRightWidth = size + 'px';
      this.resizeElement.style.borderBottomWidth = (size * 1.75) + 'px';
    } else {
      // For other shapes, update width and height
      this.resizeElement.style.width = newWidth + 'px';
      this.resizeElement.style.height = newHeight + 'px';
    }
    
    // Update position if needed
    this.resizeElement.style.left = newLeft + 'px';
    this.resizeElement.style.top = newTop + 'px';
    
    // Update property controls if visible
    this.updateResizePropertyControls(newWidth, newHeight);
    
    // Update resize handles position
    this.updateResizeHandlesPosition();
  }
  
  endResize(e) {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    this.resizeElement.classList.remove('resizing');
    
    document.removeEventListener('mousemove', this.updateResize.bind(this));
    document.removeEventListener('mouseup', this.endResize.bind(this));
    
    // Update property controls with final values
    const rect = this.resizeElement.getBoundingClientRect();
    this.updateResizePropertyControls(rect.width, rect.height);
    
    this.resizeElement = null;
    this.resizePosition = null;
  }
  
  updateResizePropertyControls(width, height) {
    const widthInput = document.getElementById('shapeWidth');
    const heightInput = document.getElementById('shapeHeight');
    const sizeInput = document.getElementById('triangleSize');
    
    if (widthInput) widthInput.value = Math.round(width);
    if (heightInput) heightInput.value = Math.round(height);
    if (sizeInput) sizeInput.value = Math.round(Math.min(width, height) / 2);
  }
  
  updateResizeHandlesPosition() {
    if (!this.currentResizeContainer || !this.currentResizingShape) return;
    
    const rect = this.currentResizingShape.getBoundingClientRect();
    const containerRect = this.currentResizingShape.offsetParent.getBoundingClientRect();
    
    this.currentResizeContainer.style.left = (rect.left - containerRect.left) + 'px';
    this.currentResizeContainer.style.top = (rect.top - containerRect.top) + 'px';
    this.currentResizeContainer.style.width = rect.width + 'px';
    this.currentResizeContainer.style.height = rect.height + 'px';
  }
  
  deleteShape(shapeElement) {
    if (!shapeElement || !shapeElement.hasAttribute('data-editable-shape')) {
      console.warn('Invalid shape element for deletion');
      return false;
    }
    
    const shapeId = shapeElement.getAttribute('data-shape-id');
    const shapeType = shapeElement.getAttribute('data-shape-type');
    
    if (!shapeId) {
      console.error('Shape element missing data-shape-id attribute');
      return false;
    }
    
    try {
      // Remove the shape from DOM first
      shapeElement.remove();
      
      // Remove resize handles
      this.removeResizeHandles();
      
      // Hide properties panel
      this.hideBottomPane();
      
      // Clear selection
      this.lastClickedElement = null;
      
      // Remove the shape code from the slide
      const codeRemoved = this.removeShapeFromCode(shapeId);
      
      if (codeRemoved !== false) {
        console.log(`Successfully deleted ${shapeType} shape with ID: ${shapeId}`);
        
        // Show feedback to user
        this.showShapeDeletionFeedback(shapeType);
        
        return true;
      } else {
        console.error(`Failed to remove shape code for ${shapeId}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting shape:', error);
      return false;
    }
  }
  
  showShapeDeletionFeedback(shapeType) {
    // Create and show temporary feedback
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
    `;
    feedback.textContent = `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} shape deleted`;
    
    document.body.appendChild(feedback);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 2000);
  }
  
  removeShapeFromCode(shapeId) {
    try {
      // Get current slide index
      const currentSlideIndex = this.editorManager.getCurrentSlideIndex();
      if (currentSlideIndex < 0) {
        console.error('No valid slide index found');
        return false;
      }
      
      // Get current code
      const currentCode = this.editorManager.getOriginalCode();
      const slides = this.editorManager.getSlidesArray(currentCode);
      const slideCode = slides[currentSlideIndex]?.code;
      
      if (!slideCode) {
        console.error('No slide code found for current slide');
        return false;
      }
      
      // Create variable name from shape ID
      const shapeVariable = shapeId.replace(/-/g, '_');
      
      // Split into lines and filter out shape-related code
      const lines = slideCode.split('\n');
      const filteredLines = [];
      let skipShapeBlock = false;
      let blockStartIndex = -1;
      let removedLinesCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Start of shape block - look for the comment with shape type
        if (trimmedLine.includes(`// Added shape:`) && !skipShapeBlock) {
          // Check if the next lines contain our shape variable
          let foundShapeBlock = false;
          for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
            if (lines[j].includes(shapeVariable)) {
              foundShapeBlock = true;
              break;
            }
          }
          
          if (foundShapeBlock) {
            skipShapeBlock = true;
            blockStartIndex = i;
            removedLinesCount++;
            continue;
          }
        }
        
        // If we're skipping a shape block
        if (skipShapeBlock) {
          removedLinesCount++;
          
          // Look for the end of the shape block (container.appendChild line with our shape variable)
          if (trimmedLine.includes('container.appendChild') && trimmedLine.includes('shapeElement')) {
            // Check if this is the end of our specific shape block
            let isOurBlock = false;
            for (let k = blockStartIndex; k <= i; k++) {
              if (lines[k].includes(shapeVariable)) {
                isOurBlock = true;
                break;
              }
            }
            
            if (isOurBlock) {
              skipShapeBlock = false;
              blockStartIndex = -1;
              continue;
            }
          }
          // Skip all lines in the shape block
          continue;
        }
        
        // Skip any standalone lines that reference this specific shape
        if ((line.includes(shapeVariable) || line.includes(shapeId)) && !skipShapeBlock) {
          removedLinesCount++;
          continue;
        }
        
        filteredLines.push(line);
      }
      
      // Validate that we actually removed some code
      if (removedLinesCount === 0) {
        console.warn(`No shape code found to remove for shape ID: ${shapeId}`);
        return false;
      }
      
      // Clean up any extra empty lines
      const cleanedLines = [];
      let previousLineWasEmpty = false;
      
      for (const line of filteredLines) {
        const isEmpty = line.trim() === '';
        
        // Skip consecutive empty lines but keep single empty lines for formatting
        if (isEmpty && previousLineWasEmpty) {
          continue;
        }
        
        cleanedLines.push(line);
        previousLineWasEmpty = isEmpty;
      }
      
      const updatedSlideCode = cleanedLines.join('\n');
      
      // Validate that we have valid JavaScript structure
      if (updatedSlideCode.trim().length === 0) {
        console.error('Updated slide code is empty, skipping update');
        return false;
      }
      
      // Update the code in the editor
      const updatedCode = currentCode.replace(slideCode, updatedSlideCode);
      
      this.editorManager.setOriginalCode(updatedCode);
      
      // Update the editor display
      if (this.editorManager.showSingleSlide && this.editorManager.currentSlideIndex === currentSlideIndex) {
        this.editorManager.editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!this.editorManager.showSingleSlide) {
        this.editorManager.editorInstance.setValue(updatedCode);
      }
      
      // Re-run the code to reflect the changes
      if (window.mainRenderer) {
        window.mainRenderer.runUserCode(updatedCode);
      }
      
      console.log(`Successfully removed ${removedLinesCount} lines of shape code for ${shapeId} from slide ${currentSlideIndex}`);
      return true;
      
    } catch (error) {
      console.error('Error removing shape from code:', error);
      return false;
    }
  }
}
