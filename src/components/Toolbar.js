import React from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Eye, 
  Monitor, 
  Play, 
  Plus, 
  Sun, 
  Moon,
  Save,
  FolderOpen,
  Palette
} from 'lucide-react';

const Toolbar = ({ 
  viewMode, 
  onViewModeChange, 
  onStartPresentation, 
  onAddSlide,
  theme,
  onThemeChange 
}) => {
  const viewModes = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'code', label: 'Code Only', icon: Code },
    { id: 'split', label: 'Split View', icon: Monitor },
    { id: 'preview', label: 'Preview Only', icon: Eye },
  ];

  return (
    <div data-testid="toolbar" className="bg-dark border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S3</span>
          </div>
          <span className="text-white font-semibold">Studio3</span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                onClick={() => onViewModeChange(mode.id)}
                className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors relative ${
                  viewMode === mode.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {viewMode === mode.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600 rounded-md"
                    initial={false}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10">{mode.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* File Actions */}
        <div className="flex items-center space-x-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Open Presentation"
          >
            <FolderOpen size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Save Presentation"
          >
            <Save size={18} />
          </motion.button>
        </div>

        {/* Slide Actions */}
        <div className="w-px h-6 bg-gray-600"></div>
        
        <motion.button
          onClick={onAddSlide}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Add Slide</span>
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          whileTap={{ scale: 0.95 }}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Present Button */}
        <div className="w-px h-6 bg-gray-600"></div>
        
        <motion.button
          onClick={onStartPresentation}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Play size={16} />
          <span className="text-sm font-medium">Present</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Toolbar;
