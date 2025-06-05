/**
 * Main Renderer - Entry point that initializes and coordinates all components
 */

import LayoutManager from '../ui/layout-manager.js';
import EditorManager from '../editor/editor-manager.js';
import PreviewManager from '../preview/preview-manager.js';
import SlideManager from '../slides/slide-manager.js';
import ElementEditor from '../ui/element-editor.js';
import ProjectManager from './project-manager.js';
import MediaAutocompleteProvider from './media-autocomplete.js';
import EventBus from './event-bus.js';
import AppState from './app-state.js';
import UIFactory from '../ui/ui-factory.js';
import PresentationController from './presentation-controller.js';
import ExportController from './export-controller.js';
import ExportRenderer from './export-renderer.js';

export default class MainRenderer {
  constructor() {
    // Initialize event bus and state management
    this.eventBus = new EventBus();
    this.appState = new AppState(this.eventBus);
    
    // Core modules - will be initialized later
    this.layoutManager = null;
    this.editorManager = null;
    this.previewManager = null;
    this.slideManager = null;
    this.elementEditor = null;
    this.projectManager = null;
    
    // UI elements
    this.playBtn = document.getElementById('playBtn');
    this.addSlideBtn = document.getElementById('addSlideBtn');
    this.toolbarAddSlideBtn = document.getElementById('toolbarAddSlideBtn');
    this.addMediaBtn = document.getElementById('addMediaBtn');
    this.zoomBtn = document.getElementById('zoomBtn'); // Add reference to zoom button
    this.shapesBtn = document.getElementById('shapesBtn');
    this.shapesDropdownBtn = document.getElementById('shapesDropdownBtn');
    
    // Store current selected shape (default to rectangle)
    this.currentShape = 'rectangle';
    
    // Make external libraries available
    window.Water = Water;
    window.Sky = Sky;
    
    // Special handling for render window
    this.isRenderWindow = window.location.hash.includes('renderWindow');
    if (this.isRenderWindow) {
      this.initializeAsRenderWindow();
      return;
    }
  }
  
  /**
   * Initialize this window as a render window
   */
  initializeAsRenderWindow() {
    console.log('Initializing as render window');
    document.body.innerHTML = '<div id="render-window-container"></div>';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#000000';
    
    // Make external libraries available
    window.Water = Water;
    window.Sky = Sky;
    
    // Initialize export renderer with default size (will be updated later)
    const exporter = new ExportRenderer();
    exporter.initialize(1920, 1080);
    
    // Store exporter for later use
    window.studio3Exporter = exporter;
  }
  
  async init() {
    // Skip regular initialization if this is a render window
    if (this.isRenderWindow) return;
    
    // Initialize project manager
    this.projectManager = new ProjectManager();
    this.projectManager.exposeMediaToRenderer();
    
    // Initialize UI managers
    this.layoutManager = new LayoutManager();
    this.layoutManager.init();
    
    // Initialize preview manager with app state
    this.previewManager = new PreviewManager(this.appState);
    const scene = this.previewManager.init();
    
    // Initialize slide manager
    this.slideManager = new SlideManager();
    this.slideManager.init(scene);
    
    // Initialize Monaco editor
    await this.initMonacoEditor();
    
    // Initialize element editor after editor is ready
    this.elementEditor = new ElementEditor(this.editorManager);
    this.elementEditor.setOverlayElement(this.slideManager.getOverlay());
    
    // Create UI components
    this.ui = this.createUIComponents();
    
    // Initialize controllers
    this.presentationController = new PresentationController(this.eventBus, this.appState);
    this.exportController = new ExportController(this.eventBus, this.appState, this.ui);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Run initial code
    this.runUserCode(this.editorManager.getOriginalCode());
  }
  
  async initMonacoEditor() {
    return new Promise((resolve) => {
      require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' } });
      
      require(['vs/editor/editor.main'], async (monaco) => {
        // Initialize editor manager
        this.editorManager = new EditorManager();
        await this.editorManager.init(monaco, this.runUserCode.bind(this));
        
        // Set up media autocomplete provider
        this.mediaAutocompleteProvider = new MediaAutocompleteProvider(monaco, this.projectManager);
        
        resolve();
      });
    });
  }
  
  createUIComponents() {
    return {
      exportProgress: UIFactory.createExportProgressOverlay(),
      resolutionSelector: UIFactory.createResolutionSelectorDialog(),
      pausedOverlay: UIFactory.createPausedOverlay(document.querySelector('.preview-container'))
    };
  }
  
  setupEventListeners() {
    // Add slide functionality
    this.addSlideBtn.addEventListener('click', this.addNewSlide.bind(this));
    this.toolbarAddSlideBtn.addEventListener('click', this.addNewSlide.bind(this));
    
    // Add media button
    this.addMediaBtn.addEventListener('click', async () => {
      const result = await window.electronAPI.selectMediaFiles();
      if (!result.canceled && result.mediaFiles) {
        this.projectManager.importMediaFiles(result.mediaFiles);
      }
    });
    
    // Play button - start/stop presentation
    this.playBtn.addEventListener('click', this.togglePresentation.bind(this));
    
    // Zoom button - show dropdown instead of toggling zoom
    this.zoomBtn.addEventListener('click', this.toggleZoomDropdown.bind(this));
    
    // Add event listeners for zoom options
    const zoomOptions = document.querySelectorAll('.zoom-option');
    zoomOptions.forEach(option => {
      option.addEventListener('click', this.handleZoomOptionClick.bind(this));
    });
    
    // Shapes button functionality
    if (this.shapesBtn && this.shapesDropdownBtn) {
      console.log('Setting up shapes button event listeners');
      this.shapesBtn.addEventListener('click', this.addShapeToSlide.bind(this));
      this.shapesDropdownBtn.addEventListener('click', this.toggleShapesDropdown.bind(this));
      
      // Add event listeners for shape options
      const shapeOptions = document.querySelectorAll('.shape-option');
      console.log('Found', shapeOptions.length, 'shape options');
      shapeOptions.forEach(option => {
        option.addEventListener('click', this.handleShapeOptionClick.bind(this));
      });
    } else {
      console.warn('Shapes buttons not found in DOM');
      console.log('shapesBtn:', this.shapesBtn);
      console.log('shapesDropdownBtn:', this.shapesDropdownBtn);
    }
    
    // Close zoom and shapes dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const zoomDropdown = document.getElementById('zoomDropdown');
      const zoomBtn = document.getElementById('zoomBtn');
      const shapesDropdown = document.getElementById('shapesDropdown');
      const shapesContainer = document.querySelector('.shapes-dropdown-container');
      
      if (zoomDropdown.classList.contains('visible') && 
          !zoomDropdown.contains(e.target) && 
          e.target !== zoomBtn) {
        zoomDropdown.classList.remove('visible');
      }
      
      if (shapesDropdown.classList.contains('visible') && 
          !shapesContainer.contains(e.target)) {
        shapesDropdown.classList.remove('visible');
      }
    });
    
    // Key events for navigation and shortcuts
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Slide change event listener
    document.addEventListener('slide-changed', (e) => {
      this.editorManager.setCurrentSlideIndex(e.detail.slideIndex);
    });
    
    // Project loading event
    document.addEventListener('project-loaded', (e) => {
      if (e.detail && e.detail.editorContent) {
        this.editorManager.setOriginalCode(e.detail.editorContent);
        this.runUserCode(e.detail.editorContent);
      }
    });
    
    // Export to PNG handler
    window.electronAPI.onExportToPNG(this.handleExportToPNG.bind(this));
    
    // Window unload cleanup
    window.addEventListener('beforeunload', this.cleanup.bind(this));
    
    // System fonts for the editor
    window.electronAPI.getSystemFonts().then(fonts => {
      const fontList = document.getElementById('fontList');
      fontList.innerHTML = '';
      
      fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontList.appendChild(option);
      });
    });
    
    // Event bus subscriptions
    this.eventBus.on('presentation:started', () => {
      this.ui.pausedOverlay.style.display = 'flex';
      this.previewManager.pauseAnimation();
    });
    
    this.eventBus.on('presentation:stopped', () => {
      this.ui.pausedOverlay.style.display = 'none';
      this.previewManager.resumeAnimation();
    });
    
    this.eventBus.on('state:isPlaying', (data) => {
      this.playBtn.textContent = data.value ? '■ Stop' : '▶ Play';
    });

    // Add listener for aspect ratio changes from main process
    if (window.electron && window.electron.onAspectRatioChanged) {
      this.aspectRatioCleanup = window.electron.onAspectRatioChanged((aspectRatio) => {
        this.appState.setState({ aspectRatio });
      });
    }

    // Handle view mode changes from menu
    if (window.electron && window.electron.onSetViewMode) {
      this.viewModeCleanup = window.electron.onSetViewMode((mode) => {
        if (this.layoutManager) {
          // Use the layout manager to change the view mode
          this.layoutManager.setViewMode(mode);
        }
      });
    }
    
    // Initialize shapes button with default shape
    this.updateShapeButton();
    console.log('Shapes functionality initialized successfully');
  }
  
  toggleZoomDropdown(e) {
    e.stopPropagation();
    const zoomDropdown = document.getElementById('zoomDropdown');
    zoomDropdown.classList.toggle('visible');
    this.updateActiveZoomOption();
  }
  
  handleZoomOptionClick(e) {
    const zoomLevel = e.target.getAttribute('data-zoom');
    const zoomDropdown = document.getElementById('zoomDropdown');
    if (zoomLevel === 'fit') {
      this.fitSlideToView();
    } else {
      const numericZoom = parseFloat(zoomLevel);
      this.setZoomLevel(numericZoom);
    }
    zoomDropdown.classList.remove('visible');
  }
  
  setZoomLevel(level) {
    if (this.previewManager) {
      const zoomLevel = this.previewManager.setZoom(level, this.slideManager);
      this.zoomBtn.textContent = `🔍 ${Math.round(zoomLevel * 100)}%`;
      this.updateActiveZoomOption();
    }
  }
  
  fitSlideToView() {
    if (this.previewManager && this.slideManager) {
      const preview = document.getElementById('preview');
      const previewRect = preview.getBoundingClientRect();
      
      const aspectRatio = this.appState.getState('aspectRatio');
      const aspectRatioValue = aspectRatio.width / aspectRatio.height;
      
      const targetArea = 1280 * 720;
      const baseWidth = Math.sqrt(targetArea * aspectRatioValue);
      
      let fitZoom;
      if (previewRect.width / previewRect.height > aspectRatioValue) {
        fitZoom = previewRect.height / (baseWidth / aspectRatioValue);
      } else {
        fitZoom = previewRect.width / baseWidth;
      }
      
      fitZoom = fitZoom * 0.9;
      this.setZoomLevel(fitZoom);
      this.zoomBtn.textContent = `🔍 Fit`;
    }
  }
  
  updateActiveZoomOption() {
    if (!this.previewManager) return;
    const currentZoom = this.previewManager.zoomLevel;
    const zoomOptions = document.querySelectorAll('.zoom-option');
    zoomOptions.forEach(option => {
      const optionZoom = option.getAttribute('data-zoom');
      if (optionZoom === 'fit') {
        option.classList.remove('active');
      } else if (Math.abs(parseFloat(optionZoom) - currentZoom) < 0.01) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  // Shapes functionality methods
  toggleShapesDropdown(e) {
    e.stopPropagation();
    try {
      const shapesDropdown = document.getElementById('shapesDropdown');
      if (shapesDropdown) {
        shapesDropdown.classList.toggle('visible');
        this.updateActiveShapeOption();
      }
    } catch (error) {
      console.error('Error toggling shapes dropdown:', error);
    }
  }
  
  handleShapeOptionClick(e) {
    try {
      const shapeType = e.target.closest('.shape-option').getAttribute('data-shape');
      if (shapeType) {
        this.currentShape = shapeType;
        this.updateShapeButton();
        
        const shapesDropdown = document.getElementById('shapesDropdown');
        if (shapesDropdown) {
          shapesDropdown.classList.remove('visible');
        }
      }
    } catch (error) {
      console.error('Error handling shape option click:', error);
    }
  }
  
  updateShapeButton() {
    try {
      const shapeIcons = {
        'rectangle': '⬛',
        'circle': '●',
        'triangle': '▲',
        'star': '★',
        'diamond': '♦',
        'arrow': '→'
      };
      
      const shapeIcon = this.shapesBtn?.querySelector('.shape-icon');
      const shapeLabel = this.shapesBtn?.querySelector('.shape-label');
      
      if (shapeIcon && shapeLabel) {
        shapeIcon.textContent = shapeIcons[this.currentShape] || '⬛';
        shapeLabel.textContent = this.currentShape.charAt(0).toUpperCase() + this.currentShape.slice(1);
      }
    } catch (error) {
      console.error('Error updating shape button:', error);
    }
  }
  
  updateActiveShapeOption() {
    try {
      const shapeOptions = document.querySelectorAll('.shape-option');
      shapeOptions.forEach(option => {
        const optionShape = option.getAttribute('data-shape');
        if (optionShape === this.currentShape) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
    } catch (error) {
      console.error('Error updating active shape option:', error);
    }
  }
  
  addShapeToSlide() {
    try {
      if (!this.slideManager || !this.editorManager) {
        console.warn('SlideManager or EditorManager not initialized');
        return;
      }
      
      const currentSlideIndex = this.slideManager.currentSlideIndex;
      if (currentSlideIndex < 0) {
        console.warn('No slide selected');
        return;
      }
      
      console.log(`Adding ${this.currentShape} to slide ${currentSlideIndex + 1}`);
      
      // Generate shape element HTML based on current shape type
      const shapeHTML = this.generateShapeHTML(this.currentShape);
      
      // Add the shape to the current slide's code
      this.addShapeToSlideCode(currentSlideIndex, shapeHTML);
      
      // Show success message briefly
      this.showShapeAddedFeedback();
    } catch (error) {
      console.error('Error adding shape to slide:', error);
    }
  }
  
  showShapeAddedFeedback() {
    // Create or update feedback element
    let feedback = document.getElementById('shape-added-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = 'shape-added-feedback';
      feedback.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(feedback);
    }
    
    feedback.textContent = `${this.currentShape.charAt(0).toUpperCase() + this.currentShape.slice(1)} added to slide`;
    feedback.style.opacity = '1';
    
    // Hide after 2 seconds
    setTimeout(() => {
      feedback.style.opacity = '0';
    }, 2000);
  }
  
  generateShapeHTML(shapeType) {
    const shapeId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseStyles = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      cursor: pointer;
      user-select: none;
    `;
    
    // Add data attributes for shape identification and properties
    const dataAttributes = `data-shape-type="${shapeType}" data-shape-id="${shapeId}" data-editable-shape="true"`;
    
    switch (shapeType) {
      case 'rectangle':
        return `<div id="${shapeId}" ${dataAttributes} style="${baseStyles} width: 100px; height: 60px; background: #007acc; border-radius: 4px;"></div>`;
      
      case 'circle':
        return `<div id="${shapeId}" ${dataAttributes} style="${baseStyles} width: 80px; height: 80px; background: #ff6b35; border-radius: 50%;"></div>`;
      
      case 'triangle':
        return `<div id="${shapeId}" ${dataAttributes} style="${baseStyles} width: 0; height: 0; border-left: 40px solid transparent; border-right: 40px solid transparent; border-bottom: 70px solid #4caf50; background: transparent;"></div>`;
      
      case 'star':
        return `<div id="${shapeId}" ${dataAttributes} style="${baseStyles} font-size: 48px; color: #ffd700; background: transparent;">★</div>`;
      
      case 'diamond':
        return `<div id="${shapeId}" ${dataAttributes} style="${baseStyles} width: 60px; height: 60px; background: #e91e63; transform: translate(-50%, -50%) rotate(45deg);"></div>`;
      
      case 'arrow':
        return `<div id="${shapeId}" ${dataAttributes} style="${baseStyles} font-size: 48px; color: #9c27b0; background: transparent;">→</div>`;
      
      default:
        return `<div id="${shapeId}" ${dataAttributes} style="${baseStyles} width: 100px; height: 60px; background: #007acc; border-radius: 4px;"></div>`;
    }
  }
  
  addShapeToSlideCode(slideIndex, shapeHTML) {
    const slides = this.editorManager.getSlidesArray(this.editorManager.getOriginalCode());
    const slideCode = slides[slideIndex]?.code;
    
    if (!slideCode) return;
    
    // Find the container.appendChild or container.innerHTML line to add the shape after
    const lines = slideCode.split('\n');
    let insertIndex = -1;
    
    // Look for the end of the init function where we can add the shape
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.includes('container.appendChild') || line.includes('slide.appendChild')) {
        insertIndex = i + 1;
        break;
      }
      if (line.includes('return {') || line.includes('return{')) {
        insertIndex = i;
        break;
      }
    }
    
    if (insertIndex === -1) {
      // If we can't find a good insertion point, add before the return statement
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('return')) {
          insertIndex = i;
          break;
        }
      }
    }
    
    if (insertIndex !== -1) {
      // Extract shape ID for unique variable naming
      const shapeIdMatch = shapeHTML.match(/id="([^"]+)"/);
      const shapeId = shapeIdMatch ? shapeIdMatch[1] : `shape_${Date.now()}`;
      const shapeVariable = shapeId.replace(/-/g, '_');
      
      // Create the shape creation code with proper event listeners
      const shapeCreationCode = [
        '',
        `        // Added shape: ${this.currentShape}`,
        `        const ${shapeVariable} = document.createElement('div');`,
        `        ${shapeVariable}.innerHTML = \`${shapeHTML}\`;`,
        `        const shapeElement = ${shapeVariable}.firstChild;`,
        `        // Add click handler for shape selection`,
        `        shapeElement.addEventListener('click', (e) => {`,
        `          e.stopPropagation();`,
        `          // Trigger shape selection`,
        `          window.mainRenderer?.elementEditor?.selectShape?.(shapeElement);`,
        `        });`,
        `        container.appendChild(shapeElement);`
      ];
      
      // Insert the shape creation code
      lines.splice(insertIndex, 0, ...shapeCreationCode);
      
      const updatedSlideCode = lines.join('\n');
      
      // Update the code in the editor
      const updatedCode = this.editorManager.getOriginalCode().replace(
        slideCode,
        updatedSlideCode
      );
      
      this.editorManager.setOriginalCode(updatedCode);
      
      // Update the editor display
      if (this.editorManager.showSingleSlide && this.editorManager.currentSlideIndex === slideIndex) {
        this.editorManager.editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!this.editorManager.showSingleSlide) {
        this.editorManager.editorInstance.setValue(updatedCode);
      }
      
      // Re-run the code to show the new shape
      this.runUserCode(updatedCode);
      
      // Make the mainRenderer available globally for shape click handlers
      window.mainRenderer = this;
    }
  }
  
  runUserCode(code) {
    if (this.appState.getState('isPlaying')) {
      this.presentationController.updateCode(code);
      return;
    }
    try {
      this.slideManager.destroy();
      const userFn = new Function('THREE', 'gsap', 'scene', 'playSlides', code);
      userFn(THREE, gsap, this.previewManager.getScene(), this.playSlides.bind(this));
    } catch (err) {
      console.error('User Code Error:', err);
    }
  }
  
  playSlides(slides) {
    const slideCount = this.slideManager.loadSlides(slides, this.projectManager);
    console.log(`Loaded ${slideCount} slides`);
  }
  
  addNewSlide() {
    const currentCode = this.editorManager.getOriginalCode();
    const newSlideTemplate = `
    {
      init({ scene, container }) {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        return { mesh };
      },
      transitionIn({ mesh }) {
        gsap.fromTo(mesh.scale, { x: 0, y: 0, z: 0 }, { duration: 1, x: 1, y: 1, z: 1 });
      },
      transitionOut({ mesh }) {
        gsap.to(mesh.position, { duration: 1, x: 2 });
      }
    }`;
    const slides = this.slideManager.getSlidesArray();
    const lastBracketIndex = currentCode.lastIndexOf(']');
    const newCode = currentCode.slice(0, lastBracketIndex) +
      (slides.length > 0 ? ',' : '') +
      newSlideTemplate +
      currentCode.slice(lastBracketIndex);
    this.editorManager.setOriginalCode(newCode);
    this.runUserCode(newCode);
  }
  
  togglePresentation() {
    this.presentationController.toggle({
      editorContent: this.editorManager.getOriginalCode(),
      mediaData: this.projectManager.getAllMediaData(),
      slideManager: this.slideManager
    });
  }
  
  handleKeyDown(e) {
    if (e.key === 'Enter') {
    } else if (e.key === 'ArrowRight') {
      this.slideManager.nextSlide();
    } else if (e.key === 'ArrowLeft') {
      this.slideManager.prevSlide();
    }
  }
  
  async handleExportToPNG({ outputDir }) {
    await this.exportController.exportToPNG({
      outputDir,
      editorContent: this.editorManager.getOriginalCode(),
      mediaData: this.projectManager.getAllMediaData()
    });
  }
  
  cleanup() {
    if (this.aspectRatioCleanup) {
      this.aspectRatioCleanup();
    }
    
    if (this.viewModeCleanup) {
      this.viewModeCleanup();
    }
    
    if (this.presentationController) {
      this.presentationController.destroy();
    }
    
    if (this.previewManager) {
      this.previewManager.destroy();
    }
    
    if (this.slideManager) {
      this.slideManager.destroy();
    }
    
    if (this.eventBus) {
      this.eventBus.clear();
    }
  }
}