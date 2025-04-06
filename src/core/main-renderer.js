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
    
    // Close zoom dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const zoomDropdown = document.getElementById('zoomDropdown');
      const zoomBtn = document.getElementById('zoomBtn');
      
      if (zoomDropdown.classList.contains('visible') && 
          !zoomDropdown.contains(e.target) && 
          e.target !== zoomBtn) {
        zoomDropdown.classList.remove('visible');
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