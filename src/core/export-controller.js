/**
 * ExportController - Manages slide export process
 * Handles exporting slides to PNG format
 */

import ExportRenderer from './export-renderer.js';

export default class ExportController {
  constructor(eventBus, appState, ui) {
    this.eventBus = eventBus;
    this.appState = appState;
    this.exportProgress = ui.exportProgress;
    this.resolutionSelector = ui.resolutionSelector;
  }

  /**
   * Export slides to PNG format
   * @param {Object} options
   * @param {string} options.outputDir - Output directory
   * @param {string} options.editorContent - Editor content
   * @param {Object} options.mediaData - Media data
   */
  async exportToPNG({ outputDir, editorContent, mediaData }) {
    let renderWindowId = null;
    
    try {
      // First, show the resolution selector
      const exportConfig = await this.resolutionSelector.show(outputDir);
      
      // If user canceled, exit early
      if (!exportConfig) return;
      
      // Ensure exact pixel dimensions (no fractional pixels)
      const width = Math.round(exportConfig.width);
      const height = Math.round(exportConfig.height);
      
      console.log(`User selected export resolution: ${width}x${height}`);
      
      // Update state
      this.appState.setState({ isExporting: true });
      
      // Show export progress overlay
      this.exportProgress.show();
      this.exportProgress.updateProgress(0, 'Initializing export...');
      
      // Initialize the export in a separate window
      this.exportProgress.updateProgress(5, `Creating render window at ${width}×${height}...`);
      
      try {
        console.log(`Creating render window with exact dimensions: ${width}x${height}...`);
        // Create the invisible render window through Electron API
        renderWindowId = await window.electronAPI.createRenderWindow({
          width,
          height
        });
        console.log(`Render window created with ID: ${renderWindowId}`);
      } catch (error) {
        console.error('Detailed render window creation error:', error);
        throw new Error(`Failed to create render window: ${error.message}`);
      }
      
      if (!renderWindowId) {
        throw new Error('Failed to create render window - returned empty ID');
      }
      
      console.log(`Successfully created render window with ID: ${renderWindowId}`);
      
      // Transfer media data to render window
      this.exportProgress.updateProgress(10, 'Transferring media assets...');
      console.log(`Transferring ${mediaData.length} media items to render window...`);
      await window.electronAPI.transferMediaToRenderWindow(renderWindowId, mediaData);
      console.log('Media transfer complete');
      
      // Load slides code in render window
      this.exportProgress.updateProgress(15, 'Loading slides in render window...');
      const slidesResult = await window.electronAPI.loadSlidesInRenderWindow(renderWindowId, editorContent);
      
      if (!slidesResult.success) {
        throw new Error(`Error loading slides: ${slidesResult.error}`);
      }
      
      const slideCount = slidesResult.slideCount;
      console.log(`Total slides to export: ${slideCount}`);
      
      if (slideCount === 0) {
        throw new Error('No slides found in the presentation.');
      }
      
      this.exportProgress.updateProgress(20, `Found ${slideCount} slides to export.`);
      
      // Export all slides with progress updates
      const slides = [];
      for (let i = 0; i < slideCount; i++) {
        const progressPercent = 20 + ((i / slideCount) * 75);
        const message = `Rendering slide ${i + 1} of ${slideCount}...`;
        this.exportProgress.updateProgress(progressPercent, message);
        
        // Render slide in the invisible window and capture screenshot
        const result = await window.electronAPI.renderSlideInWindow(renderWindowId, i);
        
        slides.push({
          index: i,
          data: result.screenshot,
          success: result.success,
          error: result.error
        });
        
        console.log(`Slide ${i + 1} rendered: ${result.success ? 'Success' : 'Failed'}`);
      }
      
      // Count successfully rendered slides
      const successfullyRenderedCount = slides.filter(slide => slide.success).length;
      console.log(`Successfully rendered ${successfullyRenderedCount} out of ${slides.length} slides`);
      
      // Save all slides to the output directory
      this.exportProgress.updateProgress(95, `Saving ${successfullyRenderedCount} rendered slides at ${width}x${height}...`);
      
      const savedCount = await this.saveExportedSlides(slides, exportConfig.outputDir);
      console.log(`Successfully saved ${savedCount} out of ${successfullyRenderedCount} rendered slides`);
      
      // Close the render window
      await window.electronAPI.closeRenderWindow(renderWindowId);
      
      // Show completion message
      if (savedCount === slideCount) {
        this.exportProgress.updateProgress(100, `Successfully exported all ${savedCount} slides!`);
      } else if (savedCount === 0) {
        this.exportProgress.updateProgress(100, `Failed to export any slides.`);
      } else {
        this.exportProgress.updateProgress(100, `Exported ${savedCount} of ${slideCount} slides.`);
      }
      
      setTimeout(() => {
        this.exportProgress.hide();
        this.appState.setState({ isExporting: false });
      }, 2500);
      
    } catch (error) {
      console.error('Export error:', error);
      this.exportProgress.updateProgress(100, `Error: ${error.message}`);
      
      // Clean up render window if it was created
      if (renderWindowId) {
        try {
          await window.electronAPI.closeRenderWindow(renderWindowId);
        } catch (cleanupErr) {
          console.error('Failed to close render window during error cleanup:', cleanupErr);
        }
      }
      
      setTimeout(() => {
        this.exportProgress.hide();
        this.appState.setState({ isExporting: false });
      }, 3000);
    }
  }

  /**
   * Save exported slides to disk
   * @private
   * @param {Array} slides - Slides to save
   * @param {string} outputDir - Output directory
   * @returns {Promise<number>} Number of successfully saved slides
   */
  async saveExportedSlides(slides, outputDir) {
    let successCount = 0;
    const successfulSlides = slides.filter(slide => slide.success);
    
    console.log(`Attempting to save ${successfulSlides.length} successful slides out of ${slides.length} total`);
    
    for (let i = 0; i < successfulSlides.length; i++) {
      const slide = successfulSlides[i];
      
      // Use the slide index + 1 for the filename to maintain order
      const slideNumber = slide.index + 1;
      const fileName = `slide_${String(slideNumber).padStart(2, '0')}.png`;
      const filePath = `${outputDir}/${fileName}`;
      
      try {
        const result = await window.electronAPI.saveExportedPNG(filePath, slide.data);
        if (result.success) {
          successCount++;
          console.log(`Saved slide ${slideNumber} as ${fileName}`);
        } else {
          console.error(`Failed to save slide ${slideNumber}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error saving slide ${slideNumber}:`, error);
      }
    }
    
    return successCount;
  }
}
