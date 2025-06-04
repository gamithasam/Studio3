import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock Monaco Editor since it requires DOM setup
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onChange, value }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, whileHover, layoutId, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileTap, whileHover, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('Studio3 Presentation App', () => {
  test('renders main application components', () => {
    render(<App />);
    
    // Check if main components are rendered
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('slide-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  test('view mode switching works', () => {
    render(<App />);
    
    // Test split view (default) - at least code editor should be present
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    
    // Switch to code-only view
    const codeButton = screen.getByText('Code Only');
    fireEvent.click(codeButton);
    
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    
    // Switch to preview-only view
    const previewButton = screen.getByText('Preview Only');
    fireEvent.click(previewButton);
    
    // In preview mode, code editor should not be visible
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument();
  });

  test('slide navigation works', () => {
    render(<App />);
    
    // Check if default slide is loaded (look for Studio3 text in title)
    expect(screen.getByText('Studio3')).toBeInTheDocument();
    
    // Check if add slide button is present (look for Add Slide text)
    expect(screen.getByText('Add Slide')).toBeInTheDocument();
  });

  test('theme toggle works', () => {
    render(<App />);
    
    // Find theme toggle button (it should have a Sun or Moon icon)
    const themeToggle = screen.getByRole('button', { name: /switch to.*theme/i });
    expect(themeToggle).toBeInTheDocument();
    
    // Click theme toggle
    fireEvent.click(themeToggle);
    
    // Theme should change (specific implementation may vary)
    // We can't easily test the actual theme change without more setup
  });

  test('presentation mode can be triggered', () => {
    render(<App />);
    
    const presentButton = screen.getByText('Present');
    expect(presentButton).toBeInTheDocument();
    
    // Note: Full presentation mode testing would require more complex setup
    // since it involves full-screen API and keyboard event handling
  });
});
