import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SlidePreview = ({ code, slideIndex, 'data-testid': testId }) => {
  const [renderedContent, setRenderedContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) {
      setRenderedContent(null);
      setError(null);
      return;
    }

    try {
      // Instead of executing code, create a safe preview based on code patterns
      const previewContent = createSafePreview(code);
      setRenderedContent(previewContent);
      setError(null);
    } catch (err) {
      console.error('Error rendering slide:', err);
      setError(err.message);
      setRenderedContent(null);
    }
  }, [code, slideIndex]);

  // Create a safe preview without executing arbitrary code
  const createSafePreview = (code) => {
    // Extract title from h1 tags
    const titleMatch = code.match(/<h1[^>]*>(.*?)<\/h1>/s);
    const title = titleMatch ? titleMatch[1].replace(/\{.*?\}/g, '').trim() : 'Slide Title';

    // Extract subtitle from p tags
    const subtitleMatch = code.match(/<p[^>]*>(.*?)<\/p>/s);
    const subtitle = subtitleMatch ? subtitleMatch[1].replace(/\{.*?\}/g, '').trim() : '';

    // Detect background gradient pattern
    let bgClass = 'bg-gray-800';
    if (code.includes('gradient-to-br from-blue')) {
      bgClass = 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900';
    } else if (code.includes('gradient-to-r from-gray')) {
      bgClass = 'bg-gradient-to-r from-gray-900 to-black';
    } else if (code.includes('gradient-to-br from-green')) {
      bgClass = 'bg-gradient-to-br from-green-900 to-teal-900';
    } else if (code.includes('gradient-to-r from-purple')) {
      bgClass = 'bg-gradient-to-r from-purple-900 to-pink-900';
    } else if (code.includes('gradient-to-br from-indigo')) {
      bgClass = 'bg-gradient-to-br from-indigo-900 to-blue-900';
    }

    return (
      <div className={`h-full ${bgClass} flex items-center justify-center p-8`}>
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            {cleanText(title)}
          </h1>
          {subtitle && (
            <p className="text-xl text-blue-200">
              {cleanText(subtitle)}
            </p>
          )}
          {code.includes('bullet') && (
            <div className="text-left space-y-2 text-white">
              <div>• Point 1</div>
              <div>• Point 2</div>
              <div>• Point 3</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Clean text from JSX expressions
  const cleanText = (text) => {
    return text
      .replace(/\{.*?\}/g, '')
      .replace(/animate-\w+/g, '')
      .trim();
  };

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">Preview</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-400 text-lg mb-2">⚠️ Preview Error</div>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid={testId} className="h-full flex flex-col">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Preview</h3>
        <div className="text-xs text-gray-500">Slide {slideIndex + 1}</div>
      </div>
      <div className="flex-1 bg-black relative overflow-hidden">
        <motion.div
          key={slideIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {renderedContent || (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500 text-lg">
                Start coding your slide...
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SlidePreview;
