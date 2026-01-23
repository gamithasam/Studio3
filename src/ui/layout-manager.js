/**
 * Layout Manager - Handles UI layout, resizing, and view mode switching
 */

export default class LayoutManager {
  constructor() {
    // UI Elements
    this.editorSection = document.querySelector('.editor-section');
    this.previewSection = document.getElementById('preview');
    this.container = document.querySelector('.container');
    
    // Resize handles
    this.horizontalResizeHandle = document.getElementById('resizeHandle');
    this.verticalResizeHandle = document.getElementById('panelResizeHandle');
    
    // Panels
    this.mediaPanel = document.getElementById('mediaPanel');
    this.slidesPanel = document.getElementById('slidesPanel');
    this.leftPanelContainer = document.getElementById('leftPanelContainer');
    
    // View mode buttons
    this.codeOnlyBtn = document.getElementById('codeOnlyBtn');
    this.splitBtn = document.getElementById('splitBtn');
    this.previewOnlyBtn = document.getElementById('previewOnlyBtn');
    
    // Sidebar toggle
    this.sidebarToggle = document.getElementById('sidebarToggle');
    
    // State tracking
    this.isHorizontalResizing = false;
    this.isVerticalResizing = false;
  }
  
  init() {
    this.setupHorizontalResize();
    this.setupVerticalResize();
    this.setupViewModeSwitching();
    this.initLayoutFromSavedPreferences();
    this.setupSidebarToggle();
    
    // Handle window resize events
    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }
  
  handleWindowResize() {
    if (window.editorInstance) {
      window.editorInstance.layout();
    }
  }
  
  setupHorizontalResize() {
    this.horizontalResizeHandle.addEventListener('mousedown', (e) => {
      this.isHorizontalResizing = true;
      this.horizontalResizeHandle.classList.add('active');
      document.addEventListener('mousemove', this.handleHorizontalResize.bind(this));
      document.addEventListener('mouseup', this.stopHorizontalResize.bind(this));
      e.preventDefault();
    });
  }
  
  handleHorizontalResize(e) {
    if (!this.isHorizontalResizing) return;
    
    const containerRect = document.querySelector('.editor-preview-container').getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // Calculate the position relative to the container's left edge
    const offsetX = e.clientX - containerRect.left;
    
    // Calculate percentage (clamped between 20% and 80%)
    const percentage = Math.max(20, Math.min(80, (offsetX / containerWidth) * 100));
    
    // Set editor width as percentage
    this.editorSection.style.width = `${percentage}%`;
    
    // Save preference
    localStorage.setItem('editorWidthPercentage', percentage);
    
    // Force Monaco editor to update its layout
    if (window.editorInstance) {
      window.editorInstance.layout();
    }
  }
  
  stopHorizontalResize() {
    if (!this.isHorizontalResizing) return;
    
    this.isHorizontalResizing = false;
    this.horizontalResizeHandle.classList.remove('active');
    document.removeEventListener('mousemove', this.handleHorizontalResize.bind(this));
    document.removeEventListener('mouseup', this.stopHorizontalResize.bind(this));
  }
  
  setupVerticalResize() {
    this.verticalResizeHandle.addEventListener('mousedown', (e) => {
      this.isVerticalResizing = true;
      this.verticalResizeHandle.classList.add('active');
      document.addEventListener('mousemove', this.handleVerticalResize.bind(this));
      document.addEventListener('mouseup', this.stopVerticalResize.bind(this));
      e.preventDefault();
    });
  }
  
  handleVerticalResize(e) {
    if (!this.isVerticalResizing) return;
    
    const leftPanelRect = this.leftPanelContainer.getBoundingClientRect();
    const totalHeight = leftPanelRect.height;
    
    // Calculate the position relative to the panel's top edge
    const offsetY = e.clientY - leftPanelRect.top;
    
    // Calculate percentage (clamped between 20% and 80%)
    const percentage = Math.max(20, Math.min(80, (offsetY / totalHeight) * 100));
    
    // Set panel heights
    this.mediaPanel.style.height = `${percentage}%`;
    this.slidesPanel.style.height = `calc(100% - ${percentage}% - 6px)`; // Subtract the resize handle height
    
    // Save preference
    localStorage.setItem('mediaPanelHeightPercentage', percentage);
  }
  
  stopVerticalResize() {
    if (!this.isVerticalResizing) return;
    
    this.isVerticalResizing = false;
    this.verticalResizeHandle.classList.remove('active');
    document.removeEventListener('mousemove', this.handleVerticalResize.bind(this));
    document.removeEventListener('mouseup', this.stopVerticalResize.bind(this));
  }
  
  setupViewModeSwitching() {
    // Attach click handlers to view mode buttons
    this.codeOnlyBtn.addEventListener('click', () => this.setViewMode('code-only'));
    this.splitBtn.addEventListener('click', () => this.setViewMode('split'));
    this.previewOnlyBtn.addEventListener('click', () => this.setViewMode('preview-only'));
  }
  
  setViewMode(mode) {
    // Remove all mode classes first
    this.container.classList.remove('code-only', 'split', 'preview-only');
    
    // Add the appropriate class
    this.container.classList.add(mode);
    
    // Update button states
    this.codeOnlyBtn.classList.remove('active');
    this.splitBtn.classList.remove('active');
    this.previewOnlyBtn.classList.remove('active');
    
    // Activate the appropriate button
    switch (mode) {
      case 'code-only':
        this.codeOnlyBtn.classList.add('active');
        break;
      case 'preview-only':
        this.previewOnlyBtn.classList.add('active');
        break;
      default:
        this.splitBtn.classList.add('active');
        break;
    }
    
    // Save preference
    localStorage.setItem('viewMode', mode);
    
    // Force editor layout update after mode change
    setTimeout(() => {
      if (window.editorInstance) {
        window.editorInstance.layout();
      }
    }, 100);
  }
  
  setupSidebarToggle() {
    this.sidebarToggle.addEventListener('click', () => {
      const isCollapsed = this.leftPanelContainer.classList.toggle('collapsed');
      // Save state
      localStorage.setItem('leftPanelCollapsed', isCollapsed);
    });
  }
  
  initLayoutFromSavedPreferences() {
    // Set view mode from saved preference or default to split
    const savedViewMode = localStorage.getItem('viewMode') || 'split';
    this.setViewMode(savedViewMode);
    
    // Set editor width if in split mode
    if (savedViewMode === 'split') {
      const savedPercentage = localStorage.getItem('editorWidthPercentage');
      if (savedPercentage) {
        this.editorSection.style.width = `${savedPercentage}%`;
      } else {
        this.editorSection.style.width = '50%';
      }
    }
    
    // Set panel heights
    const savedMediaPanelHeight = localStorage.getItem('mediaPanelHeightPercentage');
    if (savedMediaPanelHeight) {
      this.mediaPanel.style.height = `${savedMediaPanelHeight}%`;
      this.slidesPanel.style.height = `calc(100% - ${savedMediaPanelHeight}% - 6px)`;
    } else {
      this.mediaPanel.style.height = '50%';
      this.slidesPanel.style.height = 'calc(50% - 6px)';
    }
    
    // Set left panel collapse state
    const leftPanelCollapsed = localStorage.getItem('leftPanelCollapsed') === 'true';
    if (leftPanelCollapsed) {
      this.leftPanelContainer.classList.add('collapsed');
    } else {
      this.leftPanelContainer.classList.remove('collapsed');
    }
  }
}
