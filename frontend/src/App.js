import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Animation Components
const MoneyCounter = ({ config, isPlaying, onComplete }) => {
  const [currentValue, setCurrentValue] = useState(config.start_value || 0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      setCurrentValue(config.start_value || 0);
      return;
    }

    const startValue = config.start_value || 0;
    const endValue = config.end_value || 1000;
    const duration = config.duration || 3000;
    const steps = 60; // 60fps
    const increment = (endValue - startValue) / (duration / (1000 / steps));

    let current = startValue;
    intervalRef.current = setInterval(() => {
      current += increment;
      if (current >= endValue) {
        current = endValue;
        setCurrentValue(current);
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      } else {
        setCurrentValue(current);
      }
    }, 1000 / steps);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, config]);

  const formatValue = (value) => {
    const currency = config.currency || '$';
    const decimalPlaces = config.decimal_places || 0;
    return currency + value.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div 
      className="money-counter"
      style={{
        color: config.color || '#00ff88',
        fontSize: `${config.font_size || 48}px`,
        fontWeight: config.font_weight || 'bold',
        background: config.background || '#000000',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        fontFamily: 'monospace',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {formatValue(currentValue)}
    </div>
  );
};

const TextAnimation = ({ config, isPlaying, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [animationClass, setAnimationClass] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      setDisplayText('');
      setAnimationClass('');
      return;
    }

    const text = config.text || 'Amazing Motion Graphics';
    const animationType = config.animation_type || 'typewriter';
    const duration = config.duration || 2000;
    const delay = config.delay || 0;

    setTimeout(() => {
      if (animationType === 'typewriter') {
        let i = 0;
        const typeInterval = setInterval(() => {
          setDisplayText(text.slice(0, i + 1));
          i++;
          if (i >= text.length) {
            clearInterval(typeInterval);
            if (onComplete) onComplete();
          }
        }, duration / text.length);
      } else {
        setDisplayText(text);
        setAnimationClass(`text-${animationType}`);
        timeoutRef.current = setTimeout(() => {
          if (onComplete) onComplete();
        }, duration);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, config]);

  return (
    <div 
      className={`text-animation ${animationClass}`}
      style={{
        color: config.color || '#ffffff',
        fontSize: `${config.font_size || 36}px`,
        fontWeight: config.font_weight || 'normal',
        background: config.background || '#1a1a2e',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animationDuration: `${config.duration || 2000}ms`
      }}
    >
      {displayText}
    </div>
  );
};

const ProgressBar = ({ config, isPlaying, onComplete }) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      setCurrentProgress(0);
      return;
    }

    const targetProgress = config.progress || 75;
    const duration = config.duration || 2000;
    const steps = 60;
    const increment = targetProgress / (duration / (1000 / steps));

    let current = 0;
    const progressInterval = setInterval(() => {
      current += increment;
      if (current >= targetProgress) {
        current = targetProgress;
        setCurrentProgress(current);
        clearInterval(progressInterval);
        if (onComplete) onComplete();
      } else {
        setCurrentProgress(current);
      }
    }, 1000 / steps);

    return () => clearInterval(progressInterval);
  }, [isPlaying, config]);

  return (
    <div 
      style={{
        background: config.background || '#1f2937',
        padding: '20px',
        borderRadius: '8px',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '10px'
      }}
    >
      <div 
        style={{
          width: '100%',
          height: `${config.height || 20}px`,
          backgroundColor: config.background_color || '#374151',
          borderRadius: `${config.border_radius || 10}px`,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div 
          style={{
            width: `${currentProgress}%`,
            height: '100%',
            backgroundColor: config.bar_color || '#8b5cf6',
            transition: 'width 0.1s ease',
            borderRadius: `${config.border_radius || 10}px`
          }}
        />
      </div>
      {config.show_percentage && (
        <div 
          style={{
            color: config.text_color || '#ffffff',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          {Math.round(currentProgress)}%
        </div>
      )}
    </div>
  );
};

const ParticleBurst = ({ config, isPlaying, onComplete }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize particles
    const particleCount = config.particle_count || 50;
    const particles = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * (config.spread || 200) / 10,
        vy: (Math.random() - 0.5) * (config.spread || 200) / 10,
        size: config.particle_size || 4,
        life: 1.0,
        decay: 1 / ((config.duration || 3000) / 16.67) // 60fps
      });
    }

    particlesRef.current = particles;

    const animate = () => {
      ctx.fillStyle = config.background || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let aliveParticles = 0;

      particles.forEach(particle => {
        if (particle.life <= 0) return;

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += config.gravity || 0.5;
        particle.life -= particle.decay;

        const alpha = particle.life;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = config.particle_color || '#fbbf24';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        if (particle.life > 0) aliveParticles++;
      });

      ctx.globalAlpha = 1;

      if (aliveParticles > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    setTimeout(() => {
      animate();
    }, config.trigger_delay || 0);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, config]);

  return (
    <canvas 
      ref={canvasRef}
      style={{
        width: '100%',
        minHeight: '300px',
        background: config.background || '#000000',
        borderRadius: '8px'
      }}
    />
  );
};

// Animation Preview Component
const AnimationPreview = ({ template, config, isPlaying, onComplete }) => {
  const renderAnimation = () => {
    switch (template.type) {
      case 'counter':
        return <MoneyCounter config={config} isPlaying={isPlaying} onComplete={onComplete} />;
      case 'text_animation':
        return <TextAnimation config={config} isPlaying={isPlaying} onComplete={onComplete} />;
      case 'progress_bar':
        return <ProgressBar config={config} isPlaying={isPlaying} onComplete={onComplete} />;
      case 'particles':
        return <ParticleBurst config={config} isPlaying={isPlaying} onComplete={onComplete} />;
      default:
        return <div>Unknown animation type</div>;
    }
  };

  return (
    <div className="animation-preview">
      {renderAnimation()}
    </div>
  );
};

// Parameter Control Component
const ParameterControl = ({ param, value, onChange }) => {
  const handleChange = (newValue) => {
    onChange(param.name, newValue);
  };

  const renderControl = () => {
    switch (param.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleChange(Number(e.target.value))}
            min={param.min}
            max={param.max}
            className="param-input"
          />
        );
      case 'range':
        return (
          <div className="range-control">
            <input
              type="range"
              value={value || param.min || 0}
              onChange={(e) => handleChange(Number(e.target.value))}
              min={param.min}
              max={param.max}
              step={param.step || 1}
              className="param-range"
            />
            <span className="range-value">{value}</span>
          </div>
        );
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={param.max_length}
            className="param-input"
          />
        );
      case 'color':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleChange(e.target.value)}
            className="param-color"
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
            className="param-checkbox"
          />
        );
      case 'select':
        return (
          <select
            value={value || param.options[0].value}
            onChange={(e) => handleChange(e.target.value)}
            className="param-select"
          >
            {param.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return <span>Unknown parameter type</span>;
    }
  };

  return (
    <div className="parameter-control">
      <label className="param-label">{param.label}</label>
      {renderControl()}
    </div>
  );
};

// Animation Editor Component
const AnimationEditor = ({ template, onClose, onSave }) => {
  const [config, setConfig] = useState(template.default_config);
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState(`${template.name} Project`);

  const handleParameterChange = (paramName, value) => {
    setConfig(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleSave = async () => {
    try {
      const projectData = {
        template_id: template.id,
        name: projectName,
        config: config
      };

      await axios.post(`${API}/projects`, projectData);
      alert('Project saved successfully!');
      if (onSave) onSave();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save project');
    }
  };

  return (
    <div className="editor-modal">
      <div className="editor-content">
        <div className="editor-header">
          <div>
            <h2>Animation Editor - {template.name}</h2>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="project-name-input"
              placeholder="Project name"
            />
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="editor-body">
          <div className="editor-preview">
            <div className="preview-controls">
              <button 
                onClick={handlePlay} 
                disabled={isPlaying}
                className="btn-play"
              >
                ▶ Play
              </button>
              <button 
                onClick={handleStop} 
                disabled={!isPlaying}
                className="btn-stop"
              >
                ⏹ Stop
              </button>
            </div>
            <div className="preview-container">
              <AnimationPreview
                template={template}
                config={config}
                isPlaying={isPlaying}
                onComplete={() => setIsPlaying(false)}
              />
            </div>
          </div>

          <div className="editor-controls">
            <h3>Parameters</h3>
            <div className="parameters-grid">
              {template.editable_params.map(param => (
                <ParameterControl
                  key={param.name}
                  param={param}
                  value={config[param.name]}
                  onChange={handleParameterChange}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Project</button>
        </div>
      </div>
    </div>
  );
};

// Template Card Component
const TemplateCard = ({ template, onEdit }) => {
  return (
    <div className="template-card">
      <div className="template-preview">
        <AnimationPreview
          template={template}
          config={template.default_config}
          isPlaying={false}
          onComplete={() => {}}
        />
      </div>
      <div className="template-info">
        <h3>{template.name}</h3>
        <p>{template.description}</p>
        <button className="btn-primary" onClick={() => onEdit(template)}>
          Edit & Customize
        </button>
      </div>
    </div>
  );
};

// Hero Section Component (Updated)
const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-background">
        <img 
          src="https://images.unsplash.com/photo-1657623871947-d875ad10381c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxtb3Rpb24lMjBncmFwaGljc3xlbnwwfHx8cHVycGxlfDE3NTMxOTYzMDV8MA&ixlib=rb-4.1.0&q=85" 
          alt="Motion Graphics Background"
          className="hero-bg-image"
        />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <h1 className="hero-title">Create & Customize Motion Graphics</h1>
        <p className="hero-subtitle">
          Design stunning animated graphics with our powerful editor. Customize colors, text, timing, and more.
          Create money counters, progress bars, text animations, and particle effects.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary">Start Creating</button>
          <button className="btn-secondary">Browse Templates</button>
        </div>
      </div>
    </section>
  );
};

// Main App Component
function App() {
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchProjects()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handleCloseEditor = () => {
    setSelectedTemplate(null);
  };

  const handleSaveProject = () => {
    fetchProjects();
    setSelectedTemplate(null);
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="logo">
            <h1>MotionStock</h1>
            <span className="logo-subtitle">Creator</span>
          </div>
          <nav>
            <button 
              onClick={() => setActiveTab('templates')}
              className={activeTab === 'templates' ? 'nav-btn active' : 'nav-btn'}
            >
              Templates
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={activeTab === 'projects' ? 'nav-btn active' : 'nav-btn'}
            >
              My Projects
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <section className="main-content">
        <div className="container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading animation templates...</p>
            </div>
          ) : (
            <>
              {activeTab === 'templates' && (
                <div className="templates-section">
                  <div className="section-header">
                    <h2>Animation Templates</h2>
                    <p>Choose a template to start creating your custom animation</p>
                  </div>
                  <div className="templates-grid">
                    {templates.map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onEdit={handleEditTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="projects-section">
                  <div className="section-header">
                    <h2>My Projects</h2>
                    <p>Your saved animation projects</p>
                  </div>
                  {projects.length > 0 ? (
                    <div className="projects-grid">
                      {projects.map(project => (
                        <div key={project.id} className="project-card">
                          <h3>{project.name}</h3>
                          <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                          <button className="btn-primary">Edit</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No projects yet. Create your first animation from a template!</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Animation Editor Modal */}
      {selectedTemplate && (
        <AnimationEditor
          template={selectedTemplate}
          onClose={handleCloseEditor}
          onSave={handleSaveProject}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>&copy; 2025 MotionStock Creator. Create amazing motion graphics with ease.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;