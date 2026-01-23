# Studio3

A powerful presentation editor that seamlessly blends 2D and 3D content. Create stunning interactive presentations with Three.js 3D graphics, smooth GSAP animations, and intuitive Monaco editor integration.

> **⚠️ Development Status**: This project is currently under active development and is not yet finished. Once completed, bundled releases will be available for macOS and Windows.

## ✨ Features

### 🎭 Hybrid Content Creation
- **Mix 2D and 3D freely**: Combine HTML elements with Three.js 3D scenes in the same slide
- **Live code editing**: Write and preview your presentations in real-time with Monaco Editor
- **Interactive shapes**: Add and customize geometric shapes with visual properties panel
- **Smooth animations**: Powered by GSAP for professional transition effects

### 🎯 Presentation Tools
- **Split-screen editor**: Code on the left, interactive GUI editor on the right
- **Multiple view modes**: Code-only, split view, or GUI editor-only
- **Visual slide editing**: The preview mode is a full GUI editor for visual slide manipulation
- **Slide management**: Easy slide navigation, addition, and organization
- **Media support**: Import and manage images and other media assets
- **Fullscreen presentation**: Dedicated presentation window for delivering talks

### 🛠️ Development Features
- **Monaco Editor**: Full-featured code editor with syntax highlighting and IntelliSense
- **Hot reload**: Instant preview updates as you code
- **Export capabilities**: Generate PNG images of your slides
- **Project management**: Save and load presentation projects
- **Font management**: Access to system fonts for typography

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd Studio3
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the Vite development server and the Electron application.

## 📖 Usage

### Creating Your First Presentation

1. **Launch Studio3**: Run `npm run dev` to start the application
2. **Choose your view**: Use the view mode controls (Code Only, Split View, Preview Only)
3. **Write your slides**: Use the Monaco editor to define slides with JavaScript
4. **Add content**: Mix HTML elements in the `container` with Three.js objects in the `scene`
5. **Preview**: See your presentation update in real-time
6. **Present**: Click the Play button to open the fullscreen presentation window

### Basic Slide Structure

```javascript
const slides = [
  {
    init({ scene, container }) {
      // Create 2D HTML content
      const title = document.createElement('h1');
      title.textContent = 'Hello World';
      container.appendChild(title);
      
      // Create 3D content
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      return { title, cube };
    },
    
    transitionIn({ title, cube }) {
      // Animate elements entering the slide
      gsap.to(title, { duration: 1, opacity: 1 });
      gsap.to(cube.rotation, { duration: 2, y: Math.PI * 2 });
    },
    
    transitionOut({ title, cube }) {
      // Animate elements leaving the slide
      gsap.to(title, { duration: 0.5, opacity: 0 });
      gsap.to(cube.position, { duration: 0.5, y: -2 });
    }
  }
];

playSlides(slides);
```

### Adding Shapes

1. Click the **Shapes** button in the toolbar
2. Select from available shapes: Rectangle, Circle, Triangle, Star, Diamond, Arrow
3. Click anywhere on the preview to place the shape
4. Select shapes to edit properties like size, color, and position
5. Shapes are automatically added to your slide code

### Managing Media

1. Click **Add Media** in the media panel
2. Select images or other media files
3. Reference media in your slides using the media manager
4. Media files are automatically organized in your project

## 🏗️ Architecture

### Core Components

- **Main Renderer** (`src/core/main-renderer.js`): Orchestrates the entire presentation system
- **Slide Manager** (`src/slides/slide-manager.js`): Handles slide lifecycle and transitions
- **Editor Manager** (`src/editor/editor-manager.js`): Manages Monaco editor integration
- **Presentation Controller** (`src/core/presentation-controller.js`): Controls fullscreen presentation mode
- **Export Controller** (`src/core/export-controller.js`): Handles slide export functionality

### Technology Stack

- **Electron**: Desktop application framework
- **Vite**: Fast build tool and development server
- **Three.js**: 3D graphics library
- **GSAP**: Animation library
- **Monaco Editor**: Code editor (VS Code editor core)
- **HTML5 Canvas**: For 2D graphics and text rendering

### File Structure

```
Studio3/
├── src/
│   ├── main/           # Electron main process
│   ├── core/           # Core application logic
│   ├── editor/         # Code editor functionality
│   ├── slides/         # Slide management
│   ├── presentation/   # Presentation window
│   ├── ui/             # UI components
│   └── preload/        # Electron preload scripts
├── styles/             # CSS stylesheets
├── index.html          # Main application window
└── package.json        # Project configuration
```

## 🎨 Customization

### Creating Custom Transitions

Slides support custom `transitionIn` and `transitionOut` functions using GSAP:

```javascript
transitionIn({ element }) {
  gsap.fromTo(element, 
    { opacity: 0, scale: 0.8, rotation: -180 },
    { opacity: 1, scale: 1, rotation: 0, duration: 1, ease: "back.out" }
  );
}
```

### Advanced 3D Scenes

Leverage the full power of Three.js for complex 3D content:

```javascript
init({ scene }) {
  // Add lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(light);
  
  // Load 3D models, create particle systems, etc.
  // Full Three.js API available
}
```

## 📦 Building

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run start
```

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AI Development**: Built using vibe coding - rapid prototyping through AI collaboration
- **Three.js Community**: For the amazing 3D library
- **GSAP**: For smooth animation capabilities
- **Monaco Editor**: For the excellent code editing experience

---

**Studio3** - Where presentations meet the future.
