/**
 * Editor Manager - Handles Monaco editor setup and interactions
 */

import { exampleSlidesCode } from './example-slides.js';

export default class EditorManager {
  constructor() {
    this.editorInstance = null;
    this.originalCode = '';
    this.currentSlideIndex = 0;
    this.showSingleSlide = false;
    
    // Tab elements
    this.allSlidesTab = document.getElementById('allSlidesTab');
    this.oneSlideTab = document.getElementById('oneSlideTab');
    
    // Run code callback
    this.runCodeCallback = null;
  }
  
  async init(monaco, runCodeCallback) {
    this.runCodeCallback = runCodeCallback;
    await this.initEditor(monaco);
    this.setupTabSwitching();
    this.setupKeyEvents();
    return this.editorInstance;
  }
  
  async initEditor(monaco) {
    // Create the Monaco Editor
    const editorContainer = document.getElementById('editor');
    this.editorInstance = monaco.editor.create(editorContainer, {
      value: this.getDefaultEditorContent(),
      language: 'javascript',
      automaticLayout: true,
      theme: 'vs-dark'
    });
    
    // Store original code
    this.originalCode = this.editorInstance.getValue();
    
    // Make editor instance available globally
    window.editorInstance = this.editorInstance;
    
    // Add editor content accessor to window
    window.getCurrentEditorContent = () => this.editorInstance ? this.editorInstance.getValue() : '';
    
    return this.editorInstance;
  }
  
  getDefaultEditorContent() {
    return exampleSlidesCode;
  }
  
  setupTabSwitching() {
    // Toggle tabs
    this.allSlidesTab.addEventListener('click', () => {
      if (this.showSingleSlide) {
        // Merge any one-slide changes into the overall code before switching
        this.mergeOneSlideChanges();
      }
      this.showSingleSlide = false;
      this.editorInstance.setValue(this.originalCode);
      this.allSlidesTab.classList.add('active');
      this.oneSlideTab.classList.remove('active');
    });

    this.oneSlideTab.addEventListener('click', () => {
      // If we're coming from "all slides" mode, update the master code.
      if (!this.showSingleSlide) {
        this.originalCode = this.editorInstance.getValue();
      }
      
      this.showSingleSlide = true;
      const slides = this.getSlidesArray(this.originalCode);
      if (slides.length > this.currentSlideIndex) {
        this.editorInstance.setValue(`(${slides[this.currentSlideIndex].code})`);
      } else {
        this.editorInstance.setValue('// Slide content not found');
      }
      this.oneSlideTab.classList.add('active');
      this.allSlidesTab.classList.remove('active');
    });
  }
  
  mergeOneSlideChanges() {
    let oneSlideCode = this.editorInstance.getValue();
    // Remove surrounding parentheses if present
    if (oneSlideCode.startsWith('(') && oneSlideCode.endsWith(')')) {
      oneSlideCode = oneSlideCode.slice(1, -1);
    }
    let slides = this.getSlidesArray(this.originalCode);
    if (slides.length > this.currentSlideIndex) {
      slides[this.currentSlideIndex].code = oneSlideCode;
    }
    // Rebuild the slides array content
    const rebuiltSlides = slides.map(sl => sl.code).join(',\n');
    // Replace the original slides array with the updated content
    this.originalCode = this.originalCode.replace(
      /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
      `$1\n${rebuiltSlides}\n$2`
    );
  }
  
  getSlidesArray(code) {
    // Use greedy matching to capture entire slides array
    const match = code.match(/const\s+slides\s*=\s*\[([\s\S]*)\];/);
    if (!match) return [];
  
    const slidesContent = match[1].trim();
    let slides = [];
    let bracketCount = 0;
    let currentSlide = [];
    let inString = false;
  
    for (let i = 0; i < slidesContent.length; i++) {
      const char = slidesContent[i];
      
      // Handle string literals to ignore brackets inside strings
      if (char === '"' || char === "'" || char === '`') {
        inString = !inString;
        currentSlide.push(char);
        continue;
      }
  
      if (!inString) {
        if (char === '{') {
          if (bracketCount === 0) currentSlide = [];
          bracketCount++;
        }
        else if (char === '}') {
          bracketCount--;
        }
      }
  
      currentSlide.push(char);
  
      if (bracketCount === 0 && char === '}') {
        slides.push({
          index: slides.length,
          code: currentSlide.join('').trim()
        });
        currentSlide = [];
        // Skip comma between slides
        while (i + 1 < slidesContent.length && (slidesContent[i + 1] === ',' || slidesContent[i + 1] === '\n')) i++;
      }
    }
  
    return slides;
  }
  
  setupKeyEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const userCode = this.editorInstance.getValue();
        // Save it as the new original code
        this.originalCode = userCode;
        // Run the code using the provided callback
        if (this.runCodeCallback) {
          this.runCodeCallback(userCode);
        }
      }
    });
  }
  
  setCurrentSlideIndex(index) {
    this.currentSlideIndex = index;
    
    // If in single slide mode, update editor content
    if (this.showSingleSlide) {
      const slides = this.getSlidesArray(this.originalCode);
      
      if (slides.length > index) {
        this.editorInstance.setValue(`(${slides[index].code})`);
      } else {
        this.editorInstance.setValue('// Slide content not found');
      }
    }
  }
  
  getCurrentSlideIndex() {
    return this.currentSlideIndex;
  }
  
  getOriginalCode() {
    return this.originalCode;
  }
  
  setOriginalCode(code) {
    this.originalCode = code;
    if (!this.showSingleSlide) {
      this.editorInstance.setValue(code);
    }
  }
  
  updateElementPositionInCode(elementInfo, x, y) {
    if (!elementInfo) return;
    
    const { slideIndex, tagName, textContent } = elementInfo;
    const slides = this.getSlidesArray(this.originalCode);
    const slideCode = slides[slideIndex]?.code;
    
    if (!slideCode) return;
    
    let updatedSlideCode = slideCode;
    let codeWasUpdated = false;
    
    // Position can be updated in several ways:
    
    // 1. For elements in innerHTML, update the style attribute
    const innerHTMLRegex = /(\w+)\.innerHTML\s*=\s*(`|'|")([\s\S]*?)\2/g;
    let match;
    
    while ((match = innerHTMLRegex.exec(slideCode)) !== null) {
      const containerVar = match[1];
      const quoteType = match[2];
      let htmlContent = match[3];
      
      // Look for our element in the HTML content
      const elementPattern = new RegExp(
        `(<${tagName}[^>]*?)(style=["']([^"']*)["'])?([^>]*?>)([\\s\\S]*?)</${tagName}>`, 
        'g'
      );
      
      let elementMatch;
      let updatedHtmlContent = htmlContent;
      
      while ((elementMatch = elementPattern.exec(htmlContent)) !== null) {
        const elementContent = elementMatch[5].trim();
        
        if (!textContent || elementContent.includes(textContent.substring(0, Math.min(10, textContent.length)))) {
          console.log(`Found matching ${tagName} in innerHTML`);
          
          // Extract current style or create new style attribute
          let styleAttr = elementMatch[3] || '';
          
          if (x !== null && y !== null) {
            // Update position properties
            styleAttr = this._updatePositionInStyle(styleAttr, x, y);
          } else {
            // Remove position properties
            styleAttr = this._removePositionFromStyle(styleAttr);
          }
          
          // Rebuild the element with updated style
          let updatedElement;
          if (elementMatch[2]) {
            // If element already has a style attribute
            updatedElement = `${elementMatch[1]}style="${styleAttr}"${elementMatch[4]}${elementMatch[5]}</${tagName}>`;
          } else {
            // If element doesn't have a style attribute yet
            updatedElement = `${elementMatch[1]}style="${styleAttr}" ${elementMatch[4]}${elementMatch[5]}</${tagName}>`;
          }
          
          updatedHtmlContent = updatedHtmlContent.replace(elementMatch[0], updatedElement);
        }
      }
      
      if (updatedHtmlContent !== htmlContent) {
        // Update the innerHTML in code
        const fullMatch = `${containerVar}.innerHTML = ${quoteType}${htmlContent}${quoteType}`;
        const replacement = `${containerVar}.innerHTML = ${quoteType}${updatedHtmlContent}${quoteType}`;
        
        updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
        codeWasUpdated = true;
        console.log(`- Updated position in HTML style attribute`);
      }
    }
    
    // 2. For direct elements with cssText, update the cssText
    const cssTextRegex = /(\w+)\.style\.cssText\s*=\s*(['"`])([\s\S]*?)\2/g;
    
    while ((match = cssTextRegex.exec(slideCode)) !== null) {
      const elementVar = match[1];
      const quoteType = match[2];
      let cssText = match[3];
      
      // Check if this is likely our element by looking for variables related to the element type
      const tagNameMap = {
        'h1': ['title', 'heading', 'mainTitle'],
        'h2': ['subtitle', 'subheading', 'author'],
        'p': ['description', 'text', 'paragraph'],
        'li': ['item', 'listItem']
      };
      
      const possibleNames = tagNameMap[tagName] || [];
      
      if (possibleNames.includes(elementVar) || 
          slideCode.includes(`const ${elementVar} = document.createElement('${tagName}')`)) {
        
        console.log(`Found matching variable: ${elementVar}`);
        
        if (x !== null && y !== null) {
          // Update position in cssText
          cssText = this._updatePositionInStyle(cssText, x, y);
        } else {
          // Remove position from cssText
          cssText = this._removePositionFromStyle(cssText);
        }
        
        // Update the cssText in code
        const fullMatch = `${elementVar}.style.cssText = ${quoteType}${match[3]}${quoteType}`;
        const replacement = `${elementVar}.style.cssText = ${quoteType}${cssText}${quoteType}`;
        
        updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
        codeWasUpdated = true;
        console.log(`- Updated position in cssText`);
      }
    }
    
    // Apply code updates if we made any changes
    if (codeWasUpdated) {
      slides[slideIndex].code = updatedSlideCode;
      const rebuiltSlides = slides.map(sl => sl.code).join(',\n');
      this.originalCode = this.originalCode.replace(
        /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
        `$1\n${rebuiltSlides}\n$2`
      );
      
      // Update the editor
      if (this.showSingleSlide && this.currentSlideIndex === slideIndex) {
        this.editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!this.showSingleSlide) {
        this.editorInstance.setValue(this.originalCode);
      }
      
      console.log('Position updated in code successfully!');
      return true;
    } else {
      console.warn('Could not update position in code');
      return false;
    }
  }
  
  updateElementStyleInCode(elementInfo, styleChanges) {
    if (!elementInfo) return;
    
    const { slideIndex, tagName, textContent } = elementInfo;
    const slides = this.getSlidesArray(this.originalCode);
    const slideCode = slides[slideIndex]?.code;
    
    if (!slideCode) return;
    
    let updatedSlideCode = slideCode;
    let codeWasUpdated = false;
    
    // SIMPLIFIED APPROACH: Directly look for innerHTML containing our element 
    if (tagName) {
      // First, try to find innerHTML assignments that might contain our element
      const innerHTMLRegex = /(\w+)\.innerHTML\s*=\s*(`|'|")([\s\S]*?)\2/g;
      let match;
      
      while ((match = innerHTMLRegex.exec(slideCode)) !== null) {
        const containerVar = match[1];
        const quoteType = match[2];
        let htmlContent = match[3];
        
        // Look for our element in the HTML content
        // Create a pattern that matches our tag with a style attribute
        const elementPattern = new RegExp(
          `(<${tagName}[^>]*?)(style=["']([^"']*)["'])([^>]*?>)([\\s\\S]*?)</${tagName}>`, 
          'g'
        );
        
        let elementMatch;
        let updatedHtmlContent = htmlContent;
        
        while ((elementMatch = elementPattern.exec(htmlContent)) !== null) {
          // Check if this is our element by comparing content
          const elementContent = elementMatch[5].trim();
          
          if (!textContent || elementContent.includes(textContent.substring(0, Math.min(10, textContent.length)))) {
            // Extract current style
            let styleAttr = elementMatch[3];
            let styleUpdated = false;
            
            for (const [styleProp, styleValue] of Object.entries(styleChanges)) {
              // Look for existing property in style attribute
              const propRegex = new RegExp(`(${styleProp})\\s*:\\s*([^;]*?)(;|$)`, 'g');
              const propMatch = propRegex.exec(styleAttr);
              
              if (propMatch) {
                // Replace existing property value
                styleAttr = styleAttr.replace(propRegex, `$1: ${styleValue}$3`);
                styleUpdated = true;
              } else {
                // Add new property to style attribute
                styleAttr += `${styleAttr.endsWith(';') ? ' ' : '; '}${styleProp}: ${styleValue};`;
                styleUpdated = true;
              }
            }
            
            if (styleUpdated) {
              // Replace the style attribute with updated one
              const updatedElement = `${elementMatch[1]}style="${styleAttr}"${elementMatch[4]}${elementMatch[5]}</${tagName}>`;
              updatedHtmlContent = updatedHtmlContent.replace(elementMatch[0], updatedElement);
            }
          }
        }
        
        if (updatedHtmlContent !== htmlContent) {
          // Update the innerHTML in code
          const fullMatch = `${containerVar}.innerHTML = ${quoteType}${htmlContent}${quoteType}`;
          const replacement = `${containerVar}.innerHTML = ${quoteType}${updatedHtmlContent}${quoteType}`;
          
          updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
          codeWasUpdated = true;
        }
      }

      // Also look for elements with cssText
      const cssTextRegex = /(\w+)\.style\.cssText\s*=\s*(['"`])([\s\S]*?)\2/g;
      
      while ((match = cssTextRegex.exec(slideCode)) !== null) {
        const elementVar = match[1];
        const quoteType = match[2];
        let cssText = match[3];
        
        // Check if this is likely our element
        const tagNameMap = {
          'h1': ['title', 'heading', 'mainTitle'],
          'h2': ['subtitle', 'subheading', 'author'],
          'p': ['description', 'text', 'paragraph'],
          'li': ['item', 'listItem']
        };
        
        const possibleNames = tagNameMap[tagName] || [];
        
        if (possibleNames.includes(elementVar) || 
            slideCode.includes(`const ${elementVar} = document.createElement('${tagName}')`)) {
          
          let styleUpdated = false;
          
          for (const [styleProp, styleValue] of Object.entries(styleChanges)) {
            // Look for existing property in cssText
            const propRegex = new RegExp(`(${styleProp})\\s*:\\s*([^;]*?)(;|$)`, 'g');
            const propMatch = propRegex.exec(cssText);
            
            if (propMatch) {
              // Replace existing property value
              cssText = cssText.replace(propRegex, `$1: ${styleValue}$3`);
              styleUpdated = true;
            } else {
              // Add new property to cssText
              cssText += `${cssText.endsWith(';') ? ' ' : '; '}${styleProp}: ${styleValue};`;
              styleUpdated = true;
            }
          }
          
          if (styleUpdated) {
            // Update the cssText in code
            const fullMatch = `${elementVar}.style.cssText = ${quoteType}${match[3]}${quoteType}`;
            const replacement = `${elementVar}.style.cssText = ${quoteType}${cssText}${quoteType}`;
            
            updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
            codeWasUpdated = true;
          }
        }
      }
    }
    
    // Apply code updates if we made any changes
    if (codeWasUpdated) {
      slides[slideIndex].code = updatedSlideCode;
      const rebuiltSlides = slides.map(sl => sl.code).join(',\n');
      this.originalCode = this.originalCode.replace(
        /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
        `$1\n${rebuiltSlides}\n$2`
      );
      
      // Update the editor
      if (this.showSingleSlide && this.currentSlideIndex === slideIndex) {
        this.editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!this.showSingleSlide) {
        this.editorInstance.setValue(this.originalCode);
      }
    }
  }

  // Helper method to update position in a style string
  _updatePositionInStyle(styleStr, x, y) {
    // First make sure the position is explicitly set
    if (!styleStr.includes('position:')) {
      styleStr = `position: relative; ${styleStr}`;
    }
    
    // Update or add left property
    if (styleStr.includes('left:')) {
      styleStr = styleStr.replace(/left:\s*[^;]*;?/, `left: ${x}px; `);
    } else {
      styleStr += `left: ${x}px; `;
    }
    
    // Update or add top property
    if (styleStr.includes('top:')) {
      styleStr = styleStr.replace(/top:\s*[^;]*;?/, `top: ${y}px; `);
    } else {
      styleStr += `top: ${y}px; `;
    }
    
    return styleStr;
  }
  
  // Helper method to remove position properties from a style string
  _removePositionFromStyle(styleStr) {
    return styleStr
      .replace(/left:\s*[^;]*;?\s*/g, '')
      .replace(/top:\s*[^;]*;?\s*/g, '')
      .replace(/position:\s*[^;]*;?\s*/g, '');
  }
}