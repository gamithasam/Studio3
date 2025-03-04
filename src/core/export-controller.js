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
    try {
      // First, show the resolution selector
      const exportConfig = await this.resolutionSelector.show(outputDir);
      
      // If user canceled, exit early
      if (!exportConfig) return;
      
      // Update state
      this.appState.setState({ isExporting: true });
      
      // Show export progress overlay
      this.exportProgress.show();
      this.exportProgress.updateProgress(0, 'Initializing export...');
      
      // Initialize the export renderer with selected dimensions
      const exporter = new ExportRenderer();
      exporter.initialize(exportConfig.width, exportConfig.height);
      
      // Log export resolution
      console.log(`Exporting slides at ${exportConfig.width}×${exportConfig.height}`);
      this.exportProgress.updateProgress(5, `Preparing ${exportConfig.width}×${exportConfig.height} export...`);
      
      // Load slides data
      const totalSlideCount = exporter.loadSlideData(editorContent, mediaData);
      
      // Double-check the actual slide count from the renderer's internal data
      const actualSlideData = exporter.getSlideData ? exporter.getSlideData() : [];
      const actualSlideCount = actualSlideData.length || totalSlideCount;
      
      console.log(`Total slides to export: ${actualSlideCount} (reported: ${totalSlideCount})`);
      
      if (actualSlideCount === 0) {
        throw new Error('No slides found in the presentation.');
      }
      
      this.exportProgress.updateProgress(10, `Found ${actualSlideCount} slides to export.`);
      
      // Export all slides with progress updates
      const slides = await exporter.exportAllSlides(progress => {
        const percent = 10 + ((progress.current / progress.total) * 85);
        this.exportProgress.updateProgress(percent, progress.message);
      });
      
      console.log(`Rendered slides array length: ${slides.length}`);
      
      // Count successfully rendered slides
      const successfullyRenderedCount = slides.filter(slide => slide.success).length;
      console.log(`Successfully rendered ${successfullyRenderedCount} out of ${slides.length} slides`);
      
      // Save all slides to the output directory
      this.exportProgress.updateProgress(95, `Saving ${successfullyRenderedCount} rendered slides...`);
      
      // Create a map of slide indices for consistent numbering
      const slideIndexMap = new Map();
      slides.forEach((slide, i) => {
        slideIndexMap.set(slide.index, i);
      });
      
      const savedCount = await this.saveExportedSlides(slides, exportConfig.outputDir, slideIndexMap);
      console.log(`Successfully saved ${savedCount} out of ${successfullyRenderedCount} rendered slides`);
      
      // Clean up export renderer resources
      exporter.destroy();
      
      // Use the actual total slide count from the beginning for accuracy
      if (savedCount === actualSlideCount) {
        this.exportProgress.updateProgress(100, `Successfully exported all ${savedCount} slides!`);
      } else if (savedCount === 0) {
        this.exportProgress.updateProgress(100, `Failed to export any slides.`);
      } else {
        this.exportProgress.updateProgress(100, `Exported ${savedCount} of ${actualSlideCount} slides.`);
      }
      
      setTimeout(() => {
        this.exportProgress.hide();
        this.appState.setState({ isExporting: false });
      }, 2500);
      
    } catch (error) {
      console.error('Export error:', error);
      this.exportProgress.updateProgress(100, `Error: ${error.message}`);
      setTimeout(() => {
        this.exportProgress.hide();
        this.appState.setState({ isExporting: false });
      }, 3000);
    }
  }

  /**
   * Save exported slides to disk with accurate indexing
   * @private
   * @param {Array} slides - Slides to save
   * @param {string} outputDir - Output directory
   * @param {Map} slideIndexMap - Map of slide indices to array indices
   * @returns {Promise<number>} Number of successfully saved slides
   */
  async saveExportedSlides(slides, outputDir, slideIndexMap) {
    let successCount = 0;
    const successfulSlides = slides.filter(slide => slide.success);
    
    console.log(`Attempting to save ${successfulSlides.length} successful slides out of ${slides.length} total`);
    
    for (let i = 0; i < successfulSlides.length; i++) {
      const slide = successfulSlides[i];
      
      // Use the original slide index + 1 for the filename to maintain order
      const slideNumber = slideIndexMap ? slideIndexMap.get(slide.index) + 1 : slide.index + 1;
      
      // Ensure we have consistent slide numbering
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
