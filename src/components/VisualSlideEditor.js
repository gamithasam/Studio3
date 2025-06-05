import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Triangle,
  Zap,
  RotateCcw,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCw,
  HelpCircle
} from 'lucide-react';

const VisualSlideEditor = ({ slide, onChange, 'data-testid': testId }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [activeToolGroup, setActiveToolGroup] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [showElementPalette, setShowElementPalette] = useState(false);
  const canvasRef = useRef(null);

  // Initialize slide elements if not present
  const elements = slide?.elements || [];

  // Organized tool groups for floating toolbar
  const toolGroups = {
    text: {
      name: 'Text',
      icon: Type,
      color: 'from-blue-500 to-blue-600',
      tools: [
        { id: 'text', name: 'Text', icon: Type, shortcut: 'T' },
        { id: 'heading', name: 'Heading', icon: Type, shortcut: 'H' },
      ]
    },
    shapes: {
      name: 'Shapes',
      icon: Square,
      color: 'from-red-500 to-red-600',
      tools: [
        { id: 'rectangle', name: 'Rectangle', icon: Square, shortcut: 'R' },
        { id: 'circle', name: 'Circle', icon: Circle, shortcut: 'C' },
        { id: 'triangle', name: 'Triangle', icon: Triangle, shortcut: 'Shift+T' },
        { id: 'gradient-rect', name: 'Gradient Box', icon: Square, shortcut: 'G' },
      ]
    },
    media: {
      name: 'Media',
      icon: Image,
      color: 'from-green-500 to-green-600',
      tools: [
        { id: 'image', name: 'Image', icon: Image, shortcut: 'I' },
      ]
    }
  };

  const animationTypes = [
    { id: 'fadeIn', name: 'Fade In', duration: 0.5 },
    { id: 'slideInLeft', name: 'Slide In Left', duration: 0.6 },
    { id: 'slideInRight', name: 'Slide In Right', duration: 0.6 },
    { id: 'slideInUp', name: 'Slide In Up', duration: 0.6 },
    { id: 'slideInDown', name: 'Slide In Down', duration: 0.6 },
    { id: 'scaleIn', name: 'Scale In', duration: 0.4 },
    { id: 'scaleInBounce', name: 'Scale In Bounce', duration: 0.8 },
    { id: 'rotateIn', name: 'Rotate In', duration: 0.7 },
    { id: 'flipIn', name: 'Flip In', duration: 0.8 },
    { id: 'typewriter', name: 'Typewriter', duration: 2.0 },
    { id: 'shimmer', name: 'Shimmer Effect', duration: 1.0 },
    { id: 'morphIn', name: 'Morph In', duration: 1.0 },
    { id: 'elasticIn', name: 'Elastic In', duration: 1.2 },
    { id: 'magneticReveal', name: 'Magnetic Reveal', duration: 0.9 },
    { id: 'particleForm', name: 'Particle Formation', duration: 1.5 },
    { id: 'glowPulse', name: 'Glow Pulse', duration: 0.8 },
  ];

  const handleAddElement = useCallback((elementType) => {
    console.log('🚀 handleAddElement called with:', elementType);
    console.log('📊 Current elements:', elements);
    console.log('📄 Current slide:', slide);
    
    const getElementStyle = (type) => {
      const baseStyle = {
        fontSize: type === 'heading' ? 48 : 16,
        fontWeight: type === 'heading' ? 'bold' : 'normal',
        color: '#ffffff',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        background: 'transparent',
      };

      switch (type) {
        case 'rectangle':
          return { ...baseStyle, backgroundColor: '#3b82f6' };
        case 'circle':
          return { ...baseStyle, backgroundColor: '#3b82f6', borderRadius: '50%' };
        case 'gradient-rect':
          return { 
            ...baseStyle, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px'
          };
        case 'triangle':
          return { 
            ...baseStyle, 
            backgroundColor: 'transparent',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            backgroundColor: '#6366f1'
          };
        default:
          return baseStyle;
      }
    };

    const newElement = {
      id: Date.now(),
      type: elementType.id,
      x: Math.random() * 300 + 100,
      y: Math.random() * 200 + 100,
      width: elementType.id === 'heading' ? 300 : 200,
      height: elementType.id === 'heading' ? 60 : elementType.id === 'text' ? 40 : 100,
      content: elementType.id === 'heading' ? 'Your Heading' : 
               elementType.id === 'text' ? 'Your text here' : '',
      style: getElementStyle(elementType.id),
      animation: {
        type: 'fadeIn',
        delay: 0,
        duration: 0.5,
        order: elements.length + 1 // Assign next available order
      },
      zIndex: elements.length // Start with highest z-index
    };

    const updatedSlide = {
      ...slide,
      elements: [...elements, newElement]
    };

    console.log('✨ Created new element:', newElement);
    console.log('📝 Updated slide:', updatedSlide);
    onChange(updatedSlide);
    setSelectedElement(newElement.id);
    setShowElementPalette(false);
    console.log('✅ handleAddElement completed');
  }, [slide, elements, onChange]);

  const handleElementUpdate = useCallback((elementId, updates) => {
    const updatedElements = elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );

    onChange({
      ...slide,
      elements: updatedElements
    });
  }, [elements, slide, onChange]);

  const handleBringToFront = useCallback(() => {
    if (!selectedElement) return;
    const maxZ = Math.max(...elements.map(el => el.zIndex || 0));
    handleElementUpdate(selectedElement, { zIndex: maxZ + 1 });
  }, [selectedElement, elements, handleElementUpdate]);

  const handleSendToBack = useCallback(() => {
    if (!selectedElement) return;
    const minZ = Math.min(...elements.map(el => el.zIndex || 0));
    handleElementUpdate(selectedElement, { zIndex: minZ - 1 });
  }, [selectedElement, elements, handleElementUpdate]);

  const handleElementSelect = useCallback((elementId) => {
    setSelectedElement(elementId);
  }, []);

  const handleDeleteElement = useCallback(() => {
    if (!selectedElement) return;
    const updatedElements = elements.filter(el => el.id !== selectedElement);
    onChange({ ...slide, elements: updatedElements });
    setSelectedElement(null);
  }, [selectedElement, elements, slide, onChange]);

  const handleCopyElement = useCallback(() => {
    const elementToCopy = elements.find(el => el.id === selectedElement);
    if (elementToCopy) {
      // Store in local state for simplicity (in a real app, you'd use clipboard API)
      localStorage.setItem('copiedElement', JSON.stringify(elementToCopy));
    }
  }, [selectedElement, elements]);

  const handleDuplicateElement = useCallback(() => {
    const elementToDuplicate = elements.find(el => el.id === selectedElement);
    if (elementToDuplicate) {
      const newElement = {
        ...elementToDuplicate,
        id: Date.now(),
        x: elementToDuplicate.x + 20,
        y: elementToDuplicate.y + 20,
      };
      
      const updatedSlide = {
        ...slide,
        elements: [...elements, newElement]
      };

      onChange(updatedSlide);
      setSelectedElement(newElement.id);
    }
  }, [selectedElement, elements, slide, onChange]);

  const selectedElementData = elements.find(el => el.id === selectedElement);

  // Keyboard shortcuts and interactions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedElement) return;

      // Delete element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteElement();
      }

      // Copy element
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        handleCopyElement();
      }

      // Duplicate element
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDuplicateElement();
      }

      // Arrow key movement
      const selectedEl = elements.find(el => el.id === selectedElement);
      if (selectedEl && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let newX = selectedEl.x;
        let newY = selectedEl.y;

        switch (e.key) {
          case 'ArrowLeft': newX -= step; break;
          case 'ArrowRight': newX += step; break;
          case 'ArrowUp': newY -= step; break;
          case 'ArrowDown': newY += step; break;
        }

        handleElementUpdate(selectedElement, { x: newX, y: newY });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, elements]);

  // Quick element creation shortcuts
  useEffect(() => {
    const handleQuickCreate = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Quick element creation shortcuts
      if (e.key === 't' || e.key === 'T') {
        handleAddElement({ id: 'text' });
      } else if (e.key === 'h' || e.key === 'H') {
        handleAddElement({ id: 'heading' });
      } else if (e.key === 'r' || e.key === 'R') {
        handleAddElement({ id: 'rectangle' });
      } else if (e.key === 'c' && !(e.ctrlKey || e.metaKey)) {
        handleAddElement({ id: 'circle' });
      } else if (e.key === 'i' || e.key === 'I') {
        handleAddElement({ id: 'image' });
      } else if (e.key === 'g' || e.key === 'G') {
        handleAddElement({ id: 'gradient-rect' });
      } else if (e.key === 'Escape') {
        // Deselect elements and close dialogs
        setSelectedElement(null);
        setShowElementPalette(false);
        setShowAnimationPanel(false);
        setShowHelpDialog(false);
      }
    };

    document.addEventListener('keydown', handleQuickCreate);
    return () => document.removeEventListener('keydown', handleQuickCreate);
  }, []);

  return (
    <div data-testid={testId} className="h-full flex flex-col relative">
      {/* Main Canvas Area */}
      <div className="flex-1 flex">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Visual Slide Editor</h3>
          <div className="flex items-center space-x-2">
            <motion.button
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center space-x-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Enhanced sequenced animation preview
                setSelectedElement(null);
                
                // Sort elements by animation order
                const sortedElements = [...elements].sort((a, b) => {
                  const orderA = a.animation?.order || 1;
                  const orderB = b.animation?.order || 1;
                  return orderA - orderB;
                });

                // Trigger animations in sequence
                sortedElements.forEach((el, index) => {
                  const baseDelay = (el.animation?.order || 1) * 200; // 200ms between each order level
                  const elementDelay = el.animation?.delay * 1000 || 0; // Convert to ms
                  const totalDelay = baseDelay + elementDelay;

                  setTimeout(() => {
                    const elementEl = document.querySelector(`[data-element-id="${el.id}"]`);
                    if (elementEl) {
                      // Force re-animation by removing and re-adding the element
                      const parent = elementEl.parentNode;
                      const nextSibling = elementEl.nextSibling;
                      parent.removeChild(elementEl);
                      parent.insertBefore(elementEl, nextSibling);
                    }
                  }, totalDelay);
                });
              }}
              title="Preview animations in sequence"
            >
              <Zap size={12} />
              <span>Preview</span>
            </motion.button>
            
            <motion.button
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowElementPalette(true)}
            >
              Add Element
            </motion.button>
            
            <motion.button
              className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 hover:text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHelpDialog(true)}
              title="Keyboard Shortcuts"
            >
              <HelpCircle size={14} />
            </motion.button>
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 bg-gray-900 relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, #374151 1px, transparent 0)', backgroundSize: '40px 40px' }}
        >
          {/* Slide Background */}
          <motion.div 
            className="absolute inset-4 bg-black rounded-lg shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Render Elements */}
            <AnimatePresence>
              {elements.map((element) => (
                <SlideElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElement === element.id}
                  onSelect={() => handleElementSelect(element.id)}
                  onUpdate={(updates) => handleElementUpdate(element.id, updates)}
                />
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {elements.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-center relative">
                  {/* Floating particles background */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          x: [0, Math.random() * 10 - 5, 0],
                          opacity: [0.2, 0.8, 0.2],
                        }}
                        transition={{
                          duration: 3 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                  
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <Palette className="text-white relative z-10" size={28} />
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-300 text-xl font-semibold mb-2"
                  >
                    Create Amazing Presentations
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-500 text-sm mb-4"
                  >
                    Use the floating toolbar below or press{' '}
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">T</kbd>{' '}
                    to add text
                  </motion.p>
                  
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    onClick={() => handleAddElement({ id: 'text' })}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Add Your First Element
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Floating Element Toolbar */}
          <AnimatePresence>
            {selectedElementData && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 flex items-center space-x-2 shadow-lg z-50"
              >
                <motion.button
                  onClick={handleDuplicateElement}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Duplicate (Cmd+D)"
                >
                  <Copy size={14} />
                </motion.button>
                
                <div className="w-px h-4 bg-gray-600" />
                
                <motion.button
                  onClick={handleDeleteElement}
                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Delete (Del)"
                >
                  <Trash2 size={14} />
                </motion.button>
                
                <div className="w-px h-4 bg-gray-600" />
                
                <span className="text-xs text-gray-400 px-1">
                  {selectedElementData.type.charAt(0).toUpperCase() + selectedElementData.type.slice(1)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Sidebar - Properties Panel */}
      <AnimatePresence>
        {selectedElementData && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="w-64 bg-gray-800 border-l border-gray-700 p-4"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-4">Properties</h3>
            <ElementPropertiesPanel 
              element={selectedElementData}
              onUpdate={(updates) => handleElementUpdate(selectedElement, updates)}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toolbar at Bottom */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 shadow-2xl z-50"
      >
        <div className="flex items-center space-x-4">
          {/* Tool Groups */}
          {Object.entries(toolGroups).map(([groupId, group]) => {
            const GroupIcon = group.icon;
            return (
              <div key={groupId} className="relative">
                <motion.button
                  onClick={() => setActiveToolGroup(activeToolGroup === groupId ? null : groupId)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r ${group.color} text-white hover:shadow-lg transition-all`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GroupIcon size={18} />
                  <span className="text-sm font-medium">{group.name}</span>
                  <motion.div
                    animate={{ rotate: activeToolGroup === groupId ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronUp size={14} />
                  </motion.div>
                </motion.button>
                
                {/* Dropdown for tools */}
                <AnimatePresence>
                  {activeToolGroup === groupId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-700 border border-gray-600 rounded-lg shadow-xl min-w-48"
                    >
                      <div className="p-2 space-y-1">
                        {group.tools.map((tool) => {
                          const ToolIcon = tool.icon;
                          return (
                            <motion.button
                              key={tool.id}
                              onClick={() => {
                                handleAddElement(tool);
                                setActiveToolGroup(null);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 hover:text-white rounded-md transition-colors"
                              whileHover={{ x: 4 }}
                            >
                              <ToolIcon size={16} />
                              <span>{tool.name}</span>
                              <span className="ml-auto text-xs bg-gray-800 px-2 py-1 rounded">
                                {tool.shortcut}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          {/* Divider */}
          <div className="w-px h-6 bg-gray-600" />
          
          {/* Animation Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setShowAnimationPanel(!showAnimationPanel)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap size={18} />
              <span className="text-sm font-medium">Animations</span>
              <motion.div
                animate={{ rotate: showAnimationPanel ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp size={14} />
              </motion.div>
            </motion.button>
            
            {/* Animation Dropdown */}
            <AnimatePresence>
              {showAnimationPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-700 border border-gray-600 rounded-lg shadow-xl w-56 max-h-64 overflow-y-auto"
                >
                  <div className="p-2 space-y-1">
                    {animationTypes.map((animation) => (
                      <motion.button
                        key={animation.id}
                        onClick={() => {
                          if (selectedElementData) {
                            handleElementUpdate(selectedElement, {
                              animation: { ...selectedElementData.animation, type: animation.id }
                            });
                          }
                          setShowAnimationPanel(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedElementData?.animation?.type === animation.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                        }`}
                        whileHover={{ x: 4 }}
                        disabled={!selectedElementData}
                      >
                        {animation.name}
                        <span className="text-xs opacity-70 block">{animation.duration}s</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Help Dialog */}
      <AnimatePresence>
        {showHelpDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowHelpDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Quick Create</h4>
                    <div className="space-y-1 text-gray-400">
                      <div><kbd className="bg-gray-700 px-1 rounded">T</kbd> Text</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">H</kbd> Heading</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">R</kbd> Rectangle</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">C</kbd> Circle</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">I</kbd> Image</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">G</kbd> Gradient</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Element Control</h4>
                    <div className="space-y-1 text-gray-400">
                      <div><kbd className="bg-gray-700 px-1 rounded">Del</kbd> Delete</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">Cmd+D</kbd> Duplicate</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">Cmd+C</kbd> Copy</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">↑↓←→</kbd> Move</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">Shift+↑↓←→</kbd> Move 10px</div>
                      <div><kbd className="bg-gray-700 px-1 rounded">Esc</kbd> Deselect</div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.button
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowHelpDialog(false)}
              >
                Got it!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Slide Element Component
const SlideElement = ({ element, isSelected, onSelect, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

  const getAnimationProps = (animationType) => {
    const animations = {
      fadeIn: { 
        initial: { opacity: 0 }, 
        animate: { opacity: 1 },
        transition: { duration: 0.5, ease: "easeOut" }
      },
      slideInLeft: { 
        initial: { x: -100, opacity: 0 }, 
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
      },
      slideInRight: { 
        initial: { x: 100, opacity: 0 }, 
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
      },
      slideInUp: { 
        initial: { y: 100, opacity: 0 }, 
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
      },
      slideInDown: { 
        initial: { y: -100, opacity: 0 }, 
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
      },
      scaleIn: { 
        initial: { scale: 0, opacity: 0 }, 
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.4, ease: "backOut" }
      },
      scaleInBounce: { 
        initial: { scale: 0, opacity: 0 }, 
        animate: { scale: [0, 1.2, 1], opacity: 1 },
        transition: { duration: 0.8, ease: "anticipate" }
      },
      rotateIn: { 
        initial: { rotate: -180, opacity: 0, scale: 0.5 }, 
        animate: { rotate: 0, opacity: 1, scale: 1 },
        transition: { duration: 0.7, ease: "backOut" }
      },
      flipIn: { 
        initial: { rotateY: -90, opacity: 0 }, 
        animate: { rotateY: 0, opacity: 1 },
        transition: { duration: 0.8, ease: "backOut" }
      },
      typewriter: { 
        initial: { width: 0, opacity: 1 }, 
        animate: { width: 'auto' },
        transition: { duration: 2, ease: "linear" }
      },
      shimmer: { 
        initial: { opacity: 1 },
        animate: { 
          backgroundImage: [
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          ],
          backgroundPosition: ['-200% 0', '200% 0'],
        },
        transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
      },
      morphIn: {
        initial: { 
          borderRadius: '50%', 
          scale: 0.3, 
          opacity: 0,
          filter: 'blur(10px)'
        },
        animate: { 
          borderRadius: ['50%', '25%', '4px'], 
          scale: [0.3, 1.1, 1], 
          opacity: 1,
          filter: 'blur(0px)'
        },
        transition: { duration: 1.0, ease: "anticipate" }
      },
      elasticIn: {
        initial: { scale: 0, opacity: 0 },
        animate: { 
          scale: [0, 1.4, 0.9, 1.1, 1], 
          opacity: 1 
        },
        transition: { 
          duration: 1.2, 
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" 
        }
      },
      magneticReveal: {
        initial: { 
          x: -50, 
          y: -50, 
          scale: 0.8, 
          opacity: 0,
          filter: 'blur(8px)'
        },
        animate: { 
          x: [0, 10, 0], 
          y: [0, -5, 0], 
          scale: [0.8, 1.05, 1], 
          opacity: 1,
          filter: 'blur(0px)'
        },
        transition: { 
          duration: 0.9, 
          ease: [0.68, -0.55, 0.265, 1.55] 
        }
      },
      particleForm: {
        initial: { 
          scale: 0.1, 
          opacity: 0,
          filter: 'blur(20px)',
          boxShadow: '0 0 0 rgba(59, 130, 246, 0)'
        },
        animate: { 
          scale: [0.1, 1.3, 1], 
          opacity: [0, 0.7, 1],
          filter: ['blur(20px)', 'blur(2px)', 'blur(0px)'],
          boxShadow: [
            '0 0 0 rgba(59, 130, 246, 0)',
            '0 0 30px rgba(59, 130, 246, 0.8)',
            '0 0 0 rgba(59, 130, 246, 0)'
          ]
        },
        transition: { 
          duration: 1.5,
          times: [0, 0.6, 1],
          ease: "anticipate" 
        }
      },
      glowPulse: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { 
          opacity: 1, 
          scale: 1,
          boxShadow: [
            '0 0 0 rgba(59, 130, 246, 0)',
            '0 0 20px rgba(59, 130, 246, 0.6)',
            '0 0 40px rgba(59, 130, 246, 0.4)',
            '0 0 20px rgba(59, 130, 246, 0.6)',
            '0 0 0 rgba(59, 130, 246, 0)'
          ]
        },
        transition: { 
          duration: 0.8,
          ease: "easeInOut"
        }
      }
    };
    return animations[animationType] || animations.fadeIn;
  };

  const handleResizeStart = (handle) => {
    setIsResizing(true);
    setResizeHandle(handle);
  };

  const handleResize = (info, handle) => {
    if (!isResizing) return;

    let newWidth = element.width;
    let newHeight = element.height;
    let newX = element.x;
    let newY = element.y;

    switch (handle) {
      case 'nw':
        newWidth = Math.max(20, element.width - info.delta.x);
        newHeight = Math.max(20, element.height - info.delta.y);
        newX = element.x + (element.width - newWidth);
        newY = element.y + (element.height - newHeight);
        break;
      case 'ne':
        newWidth = Math.max(20, element.width + info.delta.x);
        newHeight = Math.max(20, element.height - info.delta.y);
        newY = element.y + (element.height - newHeight);
        break;
      case 'sw':
        newWidth = Math.max(20, element.width - info.delta.x);
        newHeight = Math.max(20, element.height + info.delta.y);
        newX = element.x + (element.width - newWidth);
        break;
      case 'se':
        newWidth = Math.max(20, element.width + info.delta.x);
        newHeight = Math.max(20, element.height + info.delta.y);
        break;
      case 'n':
        newHeight = Math.max(20, element.height - info.delta.y);
        newY = element.y + (element.height - newHeight);
        break;
      case 's':
        newHeight = Math.max(20, element.height + info.delta.y);
        break;
      case 'w':
        newWidth = Math.max(20, element.width - info.delta.x);
        newX = element.x + (element.width - newWidth);
        break;
      case 'e':
        newWidth = Math.max(20, element.width + info.delta.x);
        break;
    }

    onUpdate({
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeHandle(null);
  };

  const animationProps = getAnimationProps(element.animation?.type);

  return (
    <motion.div
      className={`absolute select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      data-element-id={element.id}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex || 0,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : 'none',
        ...element.style
      }}
      onClick={onSelect}
      drag={!isResizing}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        onUpdate({
          x: element.x + info.offset.x,
          y: element.y + info.offset.y
        });
      }}
      {...animationProps}
      transition={{ duration: element.animation?.duration || 0.5 }}
    >
      {element.type === 'text' || element.type === 'heading' ? (
        <div 
          className="w-full h-full flex items-center justify-center p-2 pointer-events-none"
          style={{ 
            fontSize: element.style.fontSize,
            fontWeight: element.style.fontWeight,
            color: element.style.color,
            textAlign: 'center'
          }}
        >
          {element.content}
        </div>
      ) : element.type === 'image' ? (
        <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center pointer-events-none">
          <Image className="text-gray-400" size={32} />
        </div>
      ) : element.type === 'triangle' ? (
        <div 
          className="w-full h-full pointer-events-none"
          style={{
            clipPath: element.style.clipPath,
            backgroundColor: element.style.backgroundColor,
          }}
        />
      ) : (
        <div 
          className="w-full h-full pointer-events-none"
          style={{
            backgroundColor: element.style.backgroundColor,
            background: element.style.background,
            borderRadius: element.style.borderRadius
          }}
        />
      )}

      {/* Resize Handles */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-nw-resize"
            style={{ top: -4, left: -4 }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('nw')}
            onDrag={(e, info) => handleResize(info, 'nw')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-ne-resize"
            style={{ top: -4, right: -4 }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('ne')}
            onDrag={(e, info) => handleResize(info, 'ne')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-sw-resize"
            style={{ bottom: -4, left: -4 }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('sw')}
            onDrag={(e, info) => handleResize(info, 'sw')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-se-resize"
            style={{ bottom: -4, right: -4 }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('se')}
            onDrag={(e, info) => handleResize(info, 'se')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />

          {/* Edge handles */}
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-n-resize"
            style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('n')}
            onDrag={(e, info) => handleResize(info, 'n')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-s-resize"
            style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)' }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('s')}
            onDrag={(e, info) => handleResize(info, 's')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-w-resize"
            style={{ top: '50%', left: -4, transform: 'translateY(-50%)' }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('w')}
            onDrag={(e, info) => handleResize(info, 'w')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-e-resize"
            style={{ top: '50%', right: -4, transform: 'translateY(-50%)' }}
            drag
            dragMomentum={false}
            onDragStart={() => handleResizeStart('e')}
            onDrag={(e, info) => handleResize(info, 'e')}
            onDragEnd={handleResizeEnd}
            whileHover={{ scale: 1.2 }}
          />
        </>
      )}
    </motion.div>
  );
};

// Properties Panel Component
const ElementPropertiesPanel = ({ element, onUpdate, onBringToFront, onSendToBack }) => {
  const [gradientType, setGradientType] = useState('linear');
  const [gradientColor1, setGradientColor1] = useState('#667eea');
  const [gradientColor2, setGradientColor2] = useState('#764ba2');
  const [gradientAngle, setGradientAngle] = useState(135);

  const updateGradient = () => {
    const gradient = gradientType === 'linear' 
      ? `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`
      : `radial-gradient(circle, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
    
    onUpdate({ 
      style: { 
        ...element.style, 
        background: gradient,
        backgroundColor: 'transparent'
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Element Layering Controls */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Layer Controls</label>
        <div className="flex space-x-2">
          <motion.button
            onClick={onBringToFront}
            className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Bring to Front"
          >
            <ChevronUp size={12} />
            <span>Front</span>
          </motion.button>
          <motion.button
            onClick={onSendToBack}
            className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Send to Back"
          >
            <ChevronDown size={12} />
            <span>Back</span>
          </motion.button>
        </div>
      </div>

      {/* Content editing for text elements */}
      {(element.type === 'text' || element.type === 'heading') && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Content</label>
          <textarea
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full p-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            rows={3}
          />
        </div>
      )}

      {/* Font size */}
      {(element.type === 'text' || element.type === 'heading') && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Font Size</label>
          <input
            type="range"
            min="12"
            max="72"
            value={element.style.fontSize}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, fontSize: parseInt(e.target.value) }
            })}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{element.style.fontSize}px</span>
        </div>
      )}

      {/* Color for text elements */}
      {(element.type === 'text' || element.type === 'heading') && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Text Color</label>
          <input
            type="color"
            value={element.style.color}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, color: e.target.value }
            })}
            className="w-full h-8 rounded border border-gray-600"
          />
        </div>
      )}

      {/* Background Color for shapes */}
      {(element.type === 'rectangle' || element.type === 'circle' || element.type === 'triangle') && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Background Color</label>
          <input
            type="color"
            value={element.style.backgroundColor || '#3b82f6'}
            onChange={(e) => onUpdate({ 
              style: { 
                ...element.style, 
                backgroundColor: e.target.value,
                background: 'transparent' 
              }
            })}
            className="w-full h-8 rounded border border-gray-600"
          />
        </div>
      )}

      {/* Gradient Editor for gradient elements */}
      {element.type === 'gradient-rect' && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-400 mb-2">Gradient Settings</label>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={gradientType}
              onChange={(e) => {
                setGradientType(e.target.value);
                setTimeout(updateGradient, 0);
              }}
              className="w-full p-1 bg-gray-700 text-white text-xs rounded border border-gray-600"
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color 1</label>
              <input
                type="color"
                value={gradientColor1}
                onChange={(e) => {
                  setGradientColor1(e.target.value);
                  setTimeout(updateGradient, 0);
                }}
                className="w-full h-6 rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color 2</label>
              <input
                type="color"
                value={gradientColor2}
                onChange={(e) => {
                  setGradientColor2(e.target.value);
                  setTimeout(updateGradient, 0);
                }}
                className="w-full h-6 rounded border border-gray-600"
              />
            </div>
          </div>

          {gradientType === 'linear' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Angle: {gradientAngle}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={(e) => {
                  setGradientAngle(parseInt(e.target.value));
                  setTimeout(updateGradient, 0);
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Border Radius */}
      {(element.type === 'rectangle' || element.type === 'gradient-rect') && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Border Radius</label>
          <input
            type="range"
            min="0"
            max="50"
            value={parseInt(element.style.borderRadius) || 4}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, borderRadius: `${e.target.value}px` }
            })}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{parseInt(element.style.borderRadius) || 4}px</span>
        </div>
      )}

      {/* Rotation Control */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-2 flex items-center space-x-1">
          <RotateCw size={12} />
          <span>Rotation</span>
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={element.rotation || 0}
          onChange={(e) => onUpdate({ 
            rotation: parseInt(e.target.value)
          })}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{element.rotation || 0}°</span>
      </div>

      {/* Animation timing */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-400 mb-2 block">Animation Settings</label>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Duration</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={element.animation?.duration || 0.5}
            onChange={(e) => onUpdate({ 
              animation: { ...element.animation, duration: parseFloat(e.target.value) }
            })}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{element.animation?.duration || 0.5}s</span>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Delay</label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={element.animation?.delay || 0}
            onChange={(e) => onUpdate({ 
              animation: { ...element.animation, delay: parseFloat(e.target.value) }
            })}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{element.animation?.delay || 0}s</span>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Animation Order</label>
          <input
            type="number"
            min="1"
            max="20"
            value={element.animation?.order || 1}
            onChange={(e) => onUpdate({ 
              animation: { ...element.animation, order: parseInt(e.target.value) }
            })}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="1"
          />
          <span className="text-xs text-gray-500">Lower numbers animate first</span>
        </div>
      </div>
    </div>
  );
};

export default VisualSlideEditor;
