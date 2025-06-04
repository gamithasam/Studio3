export const slideTemplates = {
  titleSlide: `// Studio3 Slide - Title Slide
// Use JSX-like syntax to create amazing presentations!

function Slide() {
  return (
    <div className="h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-7xl font-bold text-white animate-fade-in">
          Welcome to Studio3
        </h1>
        <p className="text-2xl text-blue-200 animate-slide-in-up" style={{animationDelay: '0.5s'}}>
          Create stunning presentations with code
        </p>
        <div className="animate-bounce-in" style={{animationDelay: '1s'}}>
          <div className="w-20 h-1 bg-blue-400 mx-auto rounded-full"></div>
        </div>
      </div>
    </div>
  );
}`,

  blankSlide: `// Studio3 Slide - Blank Template
// Customize this slide with your content

function Slide() {
  return (
    <div className="h-full bg-gradient-to-r from-gray-900 to-black flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white animate-fade-in">
          Your Title Here
        </h1>
        <p className="text-xl text-gray-300 animate-slide-in-up">
          Add your content here...
        </p>
      </div>
    </div>
  );
}`,

  bulletPoints: `// Studio3 Slide - Bullet Points
// Perfect for listing key points

function Slide() {
  const points = [
    "First key point",
    "Second important item", 
    "Third crucial element",
    "Final conclusion"
  ];

  return (
    <div className="h-full bg-gradient-to-br from-green-900 to-teal-900 p-16 flex flex-col justify-center">
      <h1 className="text-6xl font-bold text-white mb-12 animate-slide-in-left">
        Key Points
      </h1>
      <ul className="space-y-6">
        {points.map((point, index) => (
          <li 
            key={index}
            className="text-2xl text-green-100 flex items-center animate-slide-in-right"
            style={{animationDelay: \`\${index * 0.2}s\`}}
          >
            <span className="w-3 h-3 bg-green-400 rounded-full mr-6"></span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}`,

  imageSlide: `// Studio3 Slide - Image with Text
// Great for visual presentations

function Slide() {
  return (
    <div className="h-full bg-gradient-to-r from-purple-900 to-pink-900 flex">
      <div className="w-1/2 p-16 flex flex-col justify-center">
        <h1 className="text-5xl font-bold text-white mb-8 animate-slide-in-left">
          Visual Impact
        </h1>
        <p className="text-xl text-purple-200 leading-relaxed animate-fade-in" style={{animationDelay: '0.3s'}}>
          Combine powerful visuals with compelling text to create 
          presentations that captivate your audience and leave a 
          lasting impression.
        </p>
        <div className="mt-8 animate-slide-in-up" style={{animationDelay: '0.6s'}}>
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
            Learn More
          </button>
        </div>
      </div>
      <div className="w-1/2 flex items-center justify-center animate-scale-in" style={{animationDelay: '0.4s'}}>
        <div className="w-80 h-80 bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl shadow-2xl flex items-center justify-center">
          <div className="text-6xl">🚀</div>
        </div>
      </div>
    </div>
  );
}`,

  chartSlide: `// Studio3 Slide - Data Visualization
// Perfect for presenting data and charts

function Slide() {
  const data = [
    { label: "Q1", value: 65, color: "bg-blue-500" },
    { label: "Q2", value: 78, color: "bg-green-500" },
    { label: "Q3", value: 82, color: "bg-yellow-500" },
    { label: "Q4", value: 94, color: "bg-red-500" }
  ];

  return (
    <div className="h-full bg-gradient-to-br from-indigo-900 to-blue-900 p-16">
      <h1 className="text-6xl font-bold text-white mb-12 text-center animate-slide-in-down">
        2024 Growth
      </h1>
      <div className="flex items-end justify-center space-x-8 h-96">
        {data.map((item, index) => (
          <div 
            key={index}
            className="flex flex-col items-center animate-slide-in-up"
            style={{animationDelay: \`\${index * 0.2}s\`}}
          >
            <div className="text-white text-2xl font-bold mb-4">
              {item.value}%
            </div>
            <div 
              className={\`w-24 \${item.color} rounded-t-lg transition-all duration-1000\`}
              style={{height: \`\${item.value * 3}px\`}}
            ></div>
            <div className="text-blue-200 text-xl mt-4 font-semibold">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  splitContent: `// Studio3 Slide - Split Content
// Great for before/after or comparison slides

function Slide() {
  return (
    <div className="h-full flex">
      <div className="w-1/2 bg-gradient-to-br from-red-900 to-orange-900 p-16 flex flex-col justify-center">
        <h2 className="text-4xl font-bold text-white mb-8 animate-slide-in-left">
          Before
        </h2>
        <ul className="space-y-4 text-red-200 text-xl">
          <li className="animate-fade-in" style={{animationDelay: '0.2s'}}>• Manual processes</li>
          <li className="animate-fade-in" style={{animationDelay: '0.4s'}}>• Time consuming</li>
          <li className="animate-fade-in" style={{animationDelay: '0.6s'}}>• Error prone</li>
        </ul>
      </div>
      <div className="w-1/2 bg-gradient-to-br from-green-900 to-emerald-900 p-16 flex flex-col justify-center">
        <h2 className="text-4xl font-bold text-white mb-8 animate-slide-in-right">
          After
        </h2>
        <ul className="space-y-4 text-green-200 text-xl">
          <li className="animate-fade-in" style={{animationDelay: '0.8s'}}>• Automated workflows</li>
          <li className="animate-fade-in" style={{animationDelay: '1s'}}>• Lightning fast</li>
          <li className="animate-fade-in" style={{animationDelay: '1.2s'}}>• 99.9% accuracy</li>
        </ul>
      </div>
    </div>
  );
}`,

  codeShowcase: `// Studio3 Slide - Code Showcase
// Perfect for demonstrating code snippets

function Slide() {
  const codeExample = \`function createSlide() {
  return (
    <div className="slide">
      <h1>Amazing Animations</h1>
      <p>Built with React & Tailwind</p>
    </div>
  );
}\`;

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 to-slate-900 p-16 flex">
      <div className="w-1/2 pr-8 flex flex-col justify-center">
        <h1 className="text-5xl font-bold text-white mb-6 animate-slide-in-left">
          Code Made Beautiful
        </h1>
        <p className="text-xl text-gray-300 mb-8 animate-fade-in" style={{animationDelay: '0.3s'}}>
          Showcase your code with syntax highlighting and smooth animations
        </p>
        <div className="space-y-4 animate-slide-in-up" style={{animationDelay: '0.6s'}}>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-gray-300">Syntax highlighting</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300">Live code execution</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <span className="text-gray-300">Interactive demos</span>
          </div>
        </div>
      </div>
      <div className="w-1/2 animate-scale-in" style={{animationDelay: '0.4s'}}>
        <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-4">example.jsx</span>
          </div>
          <pre className="text-green-400 text-sm font-mono leading-relaxed">
            {codeExample}
          </pre>
        </div>
      </div>
    </div>
  );
}`,

  timelineSlide: `// Studio3 Slide - Timeline
// Great for showing project roadmaps or history

function Slide() {
  const timeline = [
    { year: "2023", title: "Project Started", desc: "Initial concept and planning" },
    { year: "2024", title: "Alpha Release", desc: "Core features implemented" },
    { year: "2025", title: "Beta Launch", desc: "Public testing begins" },
    { year: "2026", title: "Full Release", desc: "Production ready" }
  ];

  return (
    <div className="h-full bg-gradient-to-br from-violet-900 to-indigo-900 p-16">
      <h1 className="text-6xl font-bold text-white mb-16 text-center animate-slide-in-down">
        Project Timeline
      </h1>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-violet-400"></div>
        
        <div className="space-y-12">
          {timeline.map((item, index) => (
            <div 
              key={index}
              className={\`flex items-center \${index % 2 === 0 ? 'justify-start' : 'justify-end'} animate-fade-in\`}
              style={{animationDelay: \`\${index * 0.3}s\`}}
            >
              <div className={\`w-5/12 \${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}\`}>
                <div className="bg-violet-800 rounded-lg p-6 shadow-xl">
                  <h3 className="text-2xl font-bold text-white mb-2">{item.year}</h3>
                  <h4 className="text-xl text-violet-200 mb-3">{item.title}</h4>
                  <p className="text-violet-300">{item.desc}</p>
                </div>
              </div>
              
              {/* Timeline dot */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-violet-400 rounded-full border-4 border-violet-900"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,

  teamSlide: `// Studio3 Slide - Team Introduction
// Perfect for introducing team members

function Slide() {
  const team = [
    { name: "Alex Chen", role: "Lead Developer", avatar: "👨‍💻" },
    { name: "Sarah Kim", role: "UI/UX Designer", avatar: "👩‍🎨" },
    { name: "Mike Johnson", role: "Product Manager", avatar: "👨‍💼" },
    { name: "Lisa Wang", role: "QA Engineer", avatar: "👩‍🔬" }
  ];

  return (
    <div className="h-full bg-gradient-to-br from-emerald-900 to-teal-900 p-16">
      <h1 className="text-6xl font-bold text-white mb-16 text-center animate-slide-in-down">
        Meet Our Team
      </h1>
      <div className="grid grid-cols-2 gap-12">
        {team.map((member, index) => (
          <div 
            key={index}
            className="text-center animate-bounce-in"
            style={{animationDelay: \`\${index * 0.2}s\`}}
          >
            <div className="bg-emerald-800 rounded-2xl p-8 shadow-xl hover:scale-105 transition-transform">
              <div className="text-6xl mb-4">{member.avatar}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
              <p className="text-emerald-200 text-lg">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`
};
