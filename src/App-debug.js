import React, { useState } from 'react';

// Test each component one by one
import CodeEditor from './components/CodeEditor';
// import SlidePreview from './components/SlidePreview';
// import Toolbar from './components/Toolbar';
// import SlideNavigation from './components/SlideNavigation';
// import PresentationMode from './components/PresentationMode';
// import TemplateSelector from './components/TemplateSelector';

function App() {
  return (
    <div className="App">
      <h1>Debug App - Testing Components</h1>
      <div style={{ width: '100%', height: '400px' }}>
        <CodeEditor 
          code="console.log('test');" 
          onChange={() => {}} 
          theme="dark"
        />
      </div>
    </div>
  );
}

export default App;
