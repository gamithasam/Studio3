import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { slideTemplates } from '../data/slideTemplates';

const TemplateSelector = ({ isOpen, onClose, onSelectTemplate }) => {
  const templates = [
    { id: 'titleSlide', name: 'Title Slide', description: 'Perfect for opening presentations', color: 'from-blue-900 to-purple-900' },
    { id: 'blankSlide', name: 'Blank Slide', description: 'Start with a clean canvas', color: 'from-gray-900 to-black' },
    { id: 'bulletPoints', name: 'Bullet Points', description: 'List key information', color: 'from-green-900 to-teal-900' },
    { id: 'imageSlide', name: 'Image & Text', description: 'Visual impact with text', color: 'from-purple-900 to-pink-900' },
    { id: 'chartSlide', name: 'Data Chart', description: 'Visualize your data', color: 'from-indigo-900 to-blue-900' },
    { id: 'splitContent', name: 'Split Content', description: 'Compare two concepts', color: 'from-red-900 to-green-900' },
    { id: 'codeShowcase', name: 'Code Showcase', description: 'Display code beautifully', color: 'from-gray-900 to-slate-900' },
    { id: 'timelineSlide', name: 'Timeline', description: 'Show project milestones', color: 'from-violet-900 to-indigo-900' },
    { id: 'teamSlide', name: 'Team Introduction', description: 'Introduce your team', color: 'from-emerald-900 to-teal-900' }
  ];

  const handleSelectTemplate = (templateId) => {
    onSelectTemplate(slideTemplates[templateId]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Choose a Template</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Template Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="grid grid-cols-3 gap-6">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="cursor-pointer group"
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <div className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors">
                    {/* Template Preview */}
                    <div className={`h-32 bg-gradient-to-br ${template.color} relative flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                      <Plus 
                        size={32} 
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" 
                      />
                      <div className="absolute bottom-2 left-2 text-white text-xs opacity-75">
                        Preview
                      </div>
                    </div>
                    
                    {/* Template Info */}
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                      <p className="text-gray-400 text-sm">{template.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TemplateSelector;
