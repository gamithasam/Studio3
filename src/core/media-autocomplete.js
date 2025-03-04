/**
 * Monaco Editor Media Autocomplete Provider
 * Provides autocompletion for media files in the editor
 */

class MediaAutocompleteProvider {
    constructor(monaco, projectManager) {
      this.monaco = monaco;
      this.projectManager = projectManager;
      this.registerCompletionProvider();
    }
    
    registerCompletionProvider() {
      this.monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ["'", '"', '`', '/'],
        provideCompletionItems: (model, position) => {
          // Get the text up to the cursor
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });
          
          // Check if we're in a string that might be a media path
          const mediaPathMatches = [
            /'[^']*media\/([^']*)$/, // 'media/file
            /"[^"]*media\/([^"]*)$/, // "media/file
            /`[^`]*media\/([^`]*)$/, // `media/file
            /'[^']*\.\/(media\/[^']*)$/, // './media/file
            /"[^"]*\.\/(media\/[^"]*)$/, // "./media/file
            /`[^`]*\.\/(media\/[^`]*)$/  // `./media/file
          ];
          
          let match = null;
          for (const regex of mediaPathMatches) {
            match = textUntilPosition.match(regex);
            if (match) break;
          }
          
          if (!match) return { suggestions: [] };
          
          // Get all media files
          const mediaFiles = this.projectManager.getAllMediaAssets();
          
          // Filter by what the user has already typed
          const prefix = match[1] || '';
          const suggestions = mediaFiles
            .filter(file => file.name.toLowerCase().includes(prefix.toLowerCase()))
            .map(file => {
              // Create suggestion object for Monaco
              return {
                label: file.name,
                kind: this.monaco.languages.CompletionItemKind.File,
                detail: `Media file (${file.type})`,
                insertText: file.name,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column - prefix.length,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column
                }
              };
            });
            
          return { suggestions };
        }
      });
    }
  }
  
  // Fix the export statement to properly use default export
  export default MediaAutocompleteProvider;
  