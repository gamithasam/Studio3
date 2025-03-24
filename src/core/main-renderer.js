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
    
    // Zoom button - toggle zoom levels
    this.zoomBtn.addEventListener('click', this.handleZoomToggle.bind(this));
    
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
  }
  
  runUserCode(code) {
    // Don't re-run if in presentation mode, update the presentation instead
    if (this.appState.getState('isPlaying')) {
      this.presentationController.updateCode(code);
      return;
    }
    
    try {
      // Reset the scene and slide manager
      this.slideManager.destroy();
      
      // Run the code in a sandboxed function
      const userFn = new Function('THREE', 'gsap', 'scene', 'playSlides', code);
      userFn(THREE, gsap, this.previewManager.getScene(), this.playSlides.bind(this));
    } catch (err) {
      console.error('User Code Error:', err);
    }
  }
  
  playSlides(slides) {
    // Load slides into the slide manager
    const slideCount = this.slideManager.loadSlides(slides, this.projectManager);
    console.log(`Loaded ${slideCount} slides`);
  }
  
  addNewSlide() {
    const currentCode = this.editorManager.getOriginalCode();
    const newSlideTemplate = `
    {
      init({ scene, container }) {
        // New Slide
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
    
    // Insert new slide into the code
    const slides = this.slideManager.getSlidesArray();
    const lastBracketIndex = currentCode.lastIndexOf(']');
    const newCode = currentCode.slice(0, lastBracketIndex) +
      (slides.length > 0 ? ',' : '') +
      newSlideTemplate +
      currentCode.slice(lastBracketIndex);
    
    // Update editor and run code
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
      // Run/re-run the code when Enter is pressed
      // The editor manager already handles this via its setupKeyEvents method
    } else if (e.key === 'ArrowRight') {
      // Move to next slide
      this.slideManager.nextSlide();
    } else if (e.key === 'ArrowLeft') {
      // Move to previous slide
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
    // Clean up aspect ratio listener if it exists
    if (this.aspectRatioCleanup) {
      this.aspectRatioCleanup();
    }
    
    // Clean up controllers
    if (this.presentationController) {
      this.presentationController.destroy();
    }
    
    // Clean up managers that need explicit cleanup
    if (this.previewManager) {
      this.previewManager.destroy();
    }
    
    if (this.slideManager) {
      this.slideManager.destroy();
    }
    
    // Clear event bus
    if (this.eventBus) {
      this.eventBus.clear();
    }
  }

  // Add handler for zoom button clicks
  handleZoomToggle() {
    if (this.previewManager) {
      const zoomLevel = this.previewManager.toggleZoom(this.slideManager);
      // Update zoom button text to show current zoom level
      this.zoomBtn.textContent = `🔍 ${zoomLevel.toFixed(1)}x`;
    }
  }
}