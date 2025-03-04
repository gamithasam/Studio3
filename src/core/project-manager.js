/**
 * Project Manager
 * Handles saving, loading, and managing project files (.hime)
 */

class ProjectManager {
    constructor() {
      this.mediaAssets = [];
      this.slides = [];
      this.projectPath = null;
      this.projectName = "Untitled Presentation";
      this.unsavedChanges = false;
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Setup media interceptors for direct path support
      this.setupMediaInterceptors();
    }
  
    initEventListeners() {
      // Listen for project-related events from the main process
      window.electronAPI.onNewProject(() => {
        this.newProject();
      });
  
      window.electronAPI.onProjectOpened((data) => {
        this.loadProject(data.filePath, data.data);
      });
  
      window.electronAPI.onSaveProject((data) => {
        this.saveProject(data.filePath);
      });
  
      window.electronAPI.onMediaImported((mediaFiles) => {
        this.importMediaFiles(mediaFiles);
      });
      
      // Listen for slides data requests (when saving)
      document.addEventListener('request-slides-data', (e) => {
        if (e.detail && typeof e.detail.callback === 'function') {
          // Get the current editor content to extract slides
          const editorContent = window.getCurrentEditorContent();
          const slides = this.extractSlidesFromEditorContent(editorContent);
          e.detail.callback(slides);
        }
      });
    }
    
    // Extract slides data from editor content
    extractSlidesFromEditorContent(content) {
      try {
        // Match the slides array definition
        const match = content.match(/const\s+slides\s*=\s*\[([\s\S]*)\];/);
        if (!match) return [];
        
        // Return the raw slides content - we'll store it verbatim
        return match[1];
      } catch (error) {
        console.error("Error extracting slides:", error);
        return [];
      }
    }
  
    // Create a new empty project
    newProject() {
      if (this.unsavedChanges) {
        // You might want to show a confirmation dialog here
        console.log("Unsaved changes will be lost!");
      }
  
      this.mediaAssets = [];
      this.slides = [];
      this.projectPath = null;
      this.projectName = "Untitled Presentation";
      
      // Reset the UI
      document.getElementById('mediaList').innerHTML = '';
      
      // Notify any listeners that a new project was created
      const event = new CustomEvent('project-new');
      document.dispatchEvent(event);
      
      this.unsavedChanges = false;
      
      // Update the title bar
      document.querySelector('.title-bar-text').textContent = "Animotion - Untitled";
    }
  
    // Load a project from file
    loadProject(filePath, fileData) {
      try {
        console.log("Loading project from:", filePath);
        const project = JSON.parse(fileData);
        
        // Update project properties
        this.projectPath = filePath;
        // Fix: extract filename without using path module
        const pathParts = filePath.split('/');
        this.projectName = project.name || pathParts[pathParts.length - 1].replace('.hime', '');
        
        // Load media assets
        this.mediaAssets = project.media || [];
        
        // Load slides content
        const slidesContent = project.slidesContent || "";
        
        // Update the title bar with project name
        document.querySelector('.title-bar-text').textContent = 
          `Animotion - ${this.projectName}`;
        
        // Update the media panel
        this.updateMediaPanel();
        
        // Build the full editor content
        const editorContent = this.buildEditorContentFromSlides(slidesContent);
        
        // Notify any listeners that a project was loaded
        const event = new CustomEvent('project-loaded', { 
          detail: { 
            editorContent: editorContent,
            media: this.mediaAssets
          }
        });
        document.dispatchEvent(event);
        
        this.unsavedChanges = false;
      } catch (error) {
        console.error("Error loading project:", error);
        alert(`Failed to load project: ${error.message}`);
      }
    }
    
    // Build full editor content from slides data
    buildEditorContentFromSlides(slidesContent) {
      return `// Modify the code and press Enter or click Play to run it.
  // This example defines slides that can mix 2D and 3D content freely.
  
  const slides = [${slidesContent}];
  
  playSlides(slides);`;
    }
  
    // Save the project to a file
    async saveProject(filePath) {
      try {
        // Get the latest editor content
        const editorContent = window.getCurrentEditorContent();
        
        // Extract slides content
        const slidesContent = this.extractSlidesFromEditorContent(editorContent);
        
        // Extract file name from path for the project name
        const pathParts = filePath.split('/');
        const fileName = pathParts[pathParts.length - 1].replace('.hime', '');
        
        // Update project path and name
        this.projectPath = filePath;
        this.projectName = fileName;
        
        // Create the project data structure
        const projectData = {
          format: "hime-1.0",
          name: this.projectName,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          media: this.mediaAssets,
          slidesContent: slidesContent
        };
        
        // Save to file using the main process
        const result = await window.electronAPI.saveProjectFile(filePath, projectData);
        
        if (result.success) {
          console.log("Project saved successfully to", filePath);
          
          // Update the title bar
          document.querySelector('.title-bar-text').textContent = 
            `Animotion - ${this.projectName}`;
          
          this.unsavedChanges = false;
        } else {
          throw new Error(result.error || "Unknown error");
        }
      } catch (error) {
        console.error("Error saving project:", error);
        alert(`Failed to save project: ${error.message}`);
      }
    }
  
    // Import media files into the project
    importMediaFiles(mediaFiles) {
      if (!Array.isArray(mediaFiles)) return;
      
      // Add the new media files to our collection
      for (const file of mediaFiles) {
        // Check if file with same name already exists
        const existing = this.mediaAssets.findIndex(m => m.name === file.name);
        
        if (existing >= 0) {
          // Replace existing file
          this.mediaAssets[existing] = file;
        } else {
          // Add new file
          this.mediaAssets.push(file);
        }
      }
      
      // Update the media panel
      this.updateMediaPanel();
      
      // Mark project as having unsaved changes
      this.unsavedChanges = true;
    }
  
    // Update the media panel with current assets
    updateMediaPanel() {
      const mediaList = document.getElementById('mediaList');
      
      // Clear the list first
      mediaList.innerHTML = '';
      
      // Add each media item if available, else show empty state
      if (this.mediaAssets && this.mediaAssets.length > 0) {
        this.mediaAssets.forEach((asset, index) => {
          const mediaItem = document.createElement('div');
          mediaItem.className = 'media-item';
          mediaItem.setAttribute('data-media-index', index);
          
          // Create the preview based on file type
          const preview = document.createElement('div');
          preview.className = 'media-item-preview';
          
          const fileType = asset.type.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
            // Image preview with corrected MIME type
            const img = document.createElement('img');
            const mimeType = fileType === 'jpg' ? 'jpeg' : fileType;
            img.src = `data:image/${mimeType};base64,${asset.data}`;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            preview.appendChild(img);
          } else if (['mp4', 'mov', 'webm'].includes(fileType)) {
            // Video preview (thumbnail)
            preview.innerHTML = `
              <svg width="24" height="24" viewBox="0 0 24 24" style="margin: 13px auto; display: block;">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
              </svg>
            `;
          } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
            // Audio preview
            preview.innerHTML = `
              <svg width="24" height="24" viewBox="0 0 24 24" style="margin: 13px auto; display: block;">
                <path fill="currentColor" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
              </svg>
            `;
          } else {
            // Generic file preview
            preview.innerHTML = `
              <svg width="24" height="24" viewBox="0 0 24 24" style="margin: 13px auto; display: block;">
                <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
              </svg>
            `;
          }
          
          mediaItem.appendChild(preview);
          
          // Add filename
          const name = document.createElement('div');
          name.className = 'media-item-name';
          name.textContent = asset.name;
          mediaItem.appendChild(name);
          
          // Add event listeners
          mediaItem.addEventListener('click', (e) => {
            // Select the media item
            document.querySelectorAll('.media-item').forEach(el => 
              el.classList.remove('selected-media'));
            mediaItem.classList.add('selected-media');
          });
          
          // Context menu for media item (right click)
          mediaItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMediaContextMenu(e, index);
          });
          
          mediaList.appendChild(mediaItem);
        });
      } else {
        // Show empty state message when no media
        const emptyState = document.createElement('div');
        emptyState.style.cssText = 'padding: 20px; text-align: center; color: #666; width: 100%;';
        emptyState.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 24 24" style="margin: 0 auto 10px;">
            <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
          </svg>
          <p>No media files yet.<br>Import media from the Media menu.</p>
        `;
        mediaList.appendChild(emptyState);
      }
    }
    
    // Show context menu for a media item
    showMediaContextMenu(event, mediaIndex) {
      // Remove any existing context menus
      const existingMenu = document.querySelector('.context-menu');
      if (existingMenu) {
        existingMenu.remove();
      }
      
      const media = this.mediaAssets[mediaIndex];
      if (!media) return;
      
      // Create the context menu
      const menu = document.createElement('div');
      menu.className = 'context-menu';
      menu.style.left = `${event.clientX}px`;
      menu.style.top = `${event.clientY}px`;
      
      // Copy reference path
      const copyPath = document.createElement('div');
      copyPath.className = 'context-menu-item';
      copyPath.textContent = 'Copy Reference';
      copyPath.onclick = () => {
        // Copy a reference path to the clipboard
        navigator.clipboard.writeText(`media/${media.name}`)
          .then(() => {
            console.log('Media reference copied to clipboard');
            menu.remove();
          })
          .catch(err => {
            console.error('Failed to copy media reference:', err);
          });
      };
      
      // Delete item
      const deleteItem = document.createElement('div');
      deleteItem.className = 'context-menu-item';
      deleteItem.textContent = 'Delete';
      deleteItem.onclick = () => {
        // Remove the media item
        this.mediaAssets.splice(mediaIndex, 1);
        this.updateMediaPanel();
        this.unsavedChanges = true;
        menu.remove();
      };
      
      // Add menu items
      menu.appendChild(copyPath);
      menu.appendChild(deleteItem);
      
      // Add the menu to the document
      document.body.appendChild(menu);
      
      // Remove the menu when clicking elsewhere
      const removeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', removeMenu);
        }
      };
      
      // Set a timeout so the current click doesn't trigger the removal
      setTimeout(() => {
        document.addEventListener('click', removeMenu);
      }, 0);
    }
    
    // Get media asset by name
    getMediaAssetByName(name) {
      return this.mediaAssets.find(asset => asset.name === name);
    }
    
    // Get all media assets
    getAllMediaAssets() {
      return this.mediaAssets.slice();
    }
    
    // Mark project as having unsaved changes
    markUnsaved() {
      this.unsavedChanges = true;
    }
  
    // Add a helper function to convert media URLs to data URLs
    getMediaDataUrl(mediaPath) {
      if (!mediaPath || !mediaPath.startsWith('media/')) {
        return null;
      }
      
      const fileName = mediaPath.replace('media/', '');
      const mediaAsset = this.getMediaAssetByName(fileName);
      
      if (!mediaAsset) {
        console.warn(`Media asset not found: ${fileName}`);
        return null;
      }
      
      return `data:image/${mediaAsset.type};base64,${mediaAsset.data}`;
    }
  
    // Add this method to expose media to the slide renderer
    exposeMediaToRenderer() {
      // Add a global media loader function for slides to use
      window.loadMediaFromProject = (mediaPath) => {
        return this.getMediaDataUrl(mediaPath);
      };
    }
  
    // Add this method to process all media references in an HTML element
    processMediaReferences(element) {
      if (!element) return;
      
      // Process all images with media/ references
      const images = element.querySelectorAll('img[src^="media/"]');
      images.forEach(img => {
        const src = img.getAttribute('src');
        const mediaAsset = this.getMediaAssetByName(src.replace('media/', ''));
        if (mediaAsset) {
          img.setAttribute('src', `data:image/${mediaAsset.type};base64,${mediaAsset.data}`);
        } else {
          console.warn(`Media asset not found: ${src}`);
          // Set a placeholder for missing images
          img.setAttribute('src', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjZmZmIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+');
        }
      });
      
      // You could also process background images in CSS here if needed
    }
  
    // Replace or update the setupMediaInterceptors method to include more extensive observation
    setupMediaInterceptors() {
      // Check if THREE is available first to prevent errors
      if (typeof THREE === 'undefined') {
        console.warn('THREE.js not loaded yet. Will try again later.');
        // Try again after a delay
        setTimeout(() => this.setupMediaInterceptors(), 1000);
        return;
      }
  
      try {
        // Save original methods
        const originalTextureLoader = THREE.TextureLoader.prototype.load;
        const self = this;
        
        // Override THREE.TextureLoader to intercept media/ paths
        THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
          // Check if this is a media reference
          if (typeof url === 'string' && url.startsWith('media/')) {
            const mediaAsset = self.getMediaAssetByName(url.replace('media/', ''));
            if (mediaAsset) {
              // Convert to data URL
              url = `data:image/${mediaAsset.type};base64,${mediaAsset.data}`;
            }
          }
          // Call the original method with potentially modified URL
          return originalTextureLoader.call(this, url, onLoad, onProgress, onError);
        };
        
        // Add observer for both elements and attributes
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            // Watch for attribute changes (src attributes on existing images)
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'src' && 
                mutation.target.tagName === 'IMG') {
              
              const img = mutation.target;
              const src = img.getAttribute('src');
              
              if (src && src.startsWith('media/')) {
                const mediaAsset = this.getMediaAssetByName(src.replace('media/', ''));
                if (mediaAsset) {
                  // Set the data URL directly
                  img.setAttribute('src', `data:image/${mediaAsset.type};base64,${mediaAsset.data}`);
                }
              }
            }
            
            // Watch for new nodes (for innerHTML changes)
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  // Process any new elements that might contain media references
                  this.processMediaReferences(node);
                }
              });
            }
          }
        });
        
        // Store observer reference for cleanup if needed
        this.mediaObserver = observer;
        
        // Start observing once the DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, { 
            attributes: true, 
            subtree: true, 
            childList: true,
            attributeFilter: ['src'] 
          });
        });
        
        // Ensure the observer is correctly bound to this instance
        this.mediaObserver.observe = this.mediaObserver.observe.bind(this.mediaObserver);
      } catch (err) {
        console.error('Error setting up media interceptors:', err);
      }
    }
  
    // Add a method to get all media data for the presentation
    getAllMediaData() {
      return this.mediaAssets.map(item => ({
        id: item.id || item.name, // Use name as fallback ID if no ID is present
        name: item.name,
        type: item.type,
        data: item.data
      }));
    }
  }
  
  // Export the class
  export default ProjectManager;
  