/**
 * PresentationController - Manages presentation window
 * Handles opening, communicating with, and closing the presentation window
 */

export default class PresentationController {
  constructor(eventBus, appState) {
    this.eventBus = eventBus;
    this.appState = appState;
    this.presentationWindow = null;
    this.messageHandler = this.handlePresentationMessage.bind(this);
  }

  /**
   * Toggle presentation mode on/off
   * @param {Object} options
   * @param {string} options.editorContent - Current editor content
   * @param {Object} options.mediaData - Project media data
   * @param {Function} options.onPresentationClosed - Callback when presentation is closed
   * @returns {boolean} New presentation state
   */
  toggle(options = {}) {
    const isPlaying = !this.appState.getState('isPlaying');
    
    if (isPlaying) {
      this.startPresentation(options);
    } else {
      this.stopPresentation();
    }
    
    this.appState.setState({ isPlaying });
    return isPlaying;
  }

  /**
   * Start presentation mode
   * @private
   */
  startPresentation({ editorContent, mediaData, slideManager }) {
    // Open the presentation window
    this.presentationWindow = window.open(
      `./src/presentation/presentation.html`, 
      'presentation',
      'fullscreen=yes,menubar=no,toolbar=no,location=no'
    );
    
    if (this.presentationWindow) {
      // Set up message listener
      window.addEventListener('message', this.messageHandler);
      
      // Reset to first slide if needed
      if (slideManager && slideManager.getCurrentSlideIndex() !== 0) {
        slideManager.transitionOutSlide(slideManager.getCurrentSlideIndex());
        slideManager.transitionInSlide(0);
        slideManager.updateSlidesThumbnails();
      }
      
      // Store data to send when the presentation window is ready
      this.pendingData = {
        editorContent,
        mediaData
      };
      
      // Focus on the presentation window
      this.presentationWindow.focus();
      
      this.eventBus.emit('presentation:started');
    } else {
      // If we couldn't open the window (e.g., popup blocked)
      alert('Failed to open presentation. Please allow popups for this site.');
      this.appState.setState({ isPlaying: false });
      this.eventBus.emit('presentation:failed');
    }
  }

  /**
   * Stop presentation mode
   * @private
   */
  stopPresentation() {
    if (this.presentationWindow && !this.presentationWindow.closed) {
      this.presentationWindow.close();
    }
    
    window.removeEventListener('message', this.messageHandler);
    this.presentationWindow = null;
    this.eventBus.emit('presentation:stopped');
  }

  /**
   * Update the presentation with new code
   * @param {string} code - Updated editor content
   */
  updateCode(code) {
    if (this.presentationWindow && !this.presentationWindow.closed && this.appState.getState('isPlaying')) {
      this.presentationWindow.postMessage({
        type: 'slide-update',
        code: code
      }, '*');
    }
  }

  /**
   * Handle messages from the presentation window
   * @private
   */
  handlePresentationMessage(e) {
    if (e.data.type === 'presentation-closed') {
      this.appState.setState({ isPlaying: false });
      window.removeEventListener('message', this.messageHandler);
      this.presentationWindow = null;
      this.eventBus.emit('presentation:stopped');
    } else if (e.data.type === 'presentation-ready') {
      // When the presentation window signals it's ready, send the slide data and media data
      if (this.pendingData && this.presentationWindow) {
        this.presentationWindow.postMessage({
          type: 'slide-data',
          code: this.pendingData.editorContent,
          media: this.pendingData.mediaData
        }, '*');
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopPresentation();
  }
}
