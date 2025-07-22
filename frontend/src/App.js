import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Animation Components
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
    const steps = 60;
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

  const glowStyle = config.glow_effect ? {
    textShadow: `0 0 20px ${config.color || '#00ff88'}, 0 0 40px ${config.color || '#00ff88'}`
  } : {};

  return (
    <div 
      className={`money-counter ${config.easing || 'ease-out'}`}
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
        justifyContent: 'center',
        ...glowStyle
      }}
    >
      {formatValue(currentValue)}
    </div>
  );
};

const AnimatedBarChart = ({ config, isPlaying, onComplete }) => {
  const [animatedData, setAnimatedData] = useState(config.data?.map(d => ({ ...d, animatedValue: 0 })) || []);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      setAnimatedData(config.data?.map(d => ({ ...d, animatedValue: 0 })) || []);
      return;
    }

    const duration = config.duration || 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      const progress = currentStep / steps;
      
      setAnimatedData(config.data?.map(d => ({
        ...d,
        animatedValue: d.value * Math.min(progress, 1)
      })) || []);

      currentStep++;
      if (currentStep >= steps) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isPlaying, config]);

  return (
    <div style={{
      background: config.background || '#1a1a2e',
      padding: '20px',
      borderRadius: '8px',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: `${config.spacing || 20}px`,
        height: '200px'
      }}>
        {animatedData.map((item, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <div style={{
              width: `${config.bar_width || 40}px`,
              height: `${(item.animatedValue / 100) * 180}px`,
              backgroundColor: item.color || '#8b5cf6',
              borderRadius: '4px 4px 0 0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '5px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'height 0.1s ease'
            }}>
              {config.show_values && Math.round(item.animatedValue)}
            </div>
            <div style={{
              color: config.text_color || '#ffffff',
              marginTop: '5px',
              fontSize: '12px'
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SocialCounter = ({ config, isPlaying, onComplete }) => {
  const [currentCount, setCurrentCount] = useState(config.start_count || 0);
  
  useEffect(() => {
    if (!isPlaying) {
      setCurrentCount(config.start_count || 0);
      return;
    }

    const startCount = config.start_count || 0;
    const endCount = config.end_count || 1000;
    const duration = config.duration || 3000;
    const steps = 60;
    const increment = (endCount - startCount) / (duration / (1000 / steps));

    let current = startCount;
    const interval = setInterval(() => {
      current += increment;
      if (current >= endCount) {
        current = endCount;
        setCurrentCount(current);
        clearInterval(interval);
        if (onComplete) onComplete();
      } else {
        setCurrentCount(current);
      }
    }, 1000 / steps);

    return () => clearInterval(interval);
  }, [isPlaying, config]);

  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return Math.floor(count).toString();
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      instagram: '📷',
      youtube: '▶️',
      twitter: '🐦',
      tiktok: '🎵',
      linkedin: '💼'
    };
    return icons[platform] || '📱';
  };

  return (
    <div style={{
      background: config.background || '#000000',
      padding: '30px',
      borderRadius: '8px',
      textAlign: 'center',
      minHeight: '150px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px'
    }}>
      {config.show_icon && (
        <div style={{
          fontSize: '48px',
          animation: config.animate_icon ? 'pulse 2s infinite' : 'none'
        }}>
          {getPlatformIcon(config.platform)}
        </div>
      )}
      <div style={{
        color: config.color || '#e4405f',
        fontSize: `${config.font_size || 32}px`,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif'
      }}>
        {formatCount(currentCount)}
      </div>
      <div style={{
        color: config.color || '#e4405f',
        fontSize: '16px',
        opacity: 0.8
      }}>
        {config.label || 'Followers'}
      </div>
    </div>
  );
};

const CountdownTimer = ({ config, isPlaying, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(config.start_time || 60);

  useEffect(() => {
    if (!isPlaying) {
      setTimeLeft(config.start_time || 60);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, config]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft <= (config.warning_threshold || 10);

  return (
    <div style={{
      background: config.background || '#1a1a2e',
      padding: '40px',
      borderRadius: '8px',
      textAlign: 'center',
      minHeight: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        color: isWarning ? (config.warning_color || '#ff3333') : (config.color || '#ff6b35'),
        fontSize: `${config.font_size || 48}px`,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        animation: isWarning ? 'pulse 1s infinite' : 'none'
      }}>
        {formatTime(timeLeft)}
      </div>
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

  const glowStyle = config.glow_intensity > 0 ? {
    textShadow: `0 0 ${config.glow_intensity}px ${config.color || '#ffffff'}`
  } : {};

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
        letterSpacing: `${config.letter_spacing || 2}px`,
        animationDuration: `${config.duration || 2000}ms`,
        ...glowStyle
      }}
    >
      {displayText}
    </div>
  );
};

const LogoReveal = ({ config, isPlaying, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (!isPlaying) {
      setIsVisible(false);
      setAnimationClass('');
      return;
    }

    setAnimationClass(`logo-${config.reveal_type || 'fade_in'}`);
    setIsVisible(true);

    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, config.duration || 3000);

    return () => clearTimeout(timeout);
  }, [isPlaying, config]);

  const logoStyle = {
    color: config.color || '#8b5cf6',
    fontSize: `${config.font_size || 48}px`,
    fontWeight: 'bold',
    background: config.background || '#000000',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    minHeight: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animationDuration: `${config.duration || 3000}ms`,
    textShadow: config.glow_effect ? `0 0 30px ${config.color || '#8b5cf6'}` : 'none',
    animation: config.shake_intensity > 0 ? `shake ${config.shake_intensity}s infinite` : 'none'
  };

  return (
    <div 
      className={`logo-reveal ${animationClass} ${isVisible ? 'visible' : ''}`}
      style={logoStyle}
    >
      {config.logo_text || 'BRAND'}
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

  const barStyle = {
    width: `${currentProgress}%`,
    height: '100%',
    borderRadius: `${config.border_radius || 10}px`,
    transition: 'width 0.1s ease'
  };

  if (config.gradient_effect) {
    barStyle.background = `linear-gradient(90deg, ${config.bar_color || '#8b5cf6'}, ${config.bar_color || '#8b5cf6'}dd)`;
  } else {
    barStyle.backgroundColor = config.bar_color || '#8b5cf6';
  }

  if (config.pulse_effect) {
    barStyle.animation = 'pulse 2s infinite';
  }

  return (
    <div style={{
      background: config.background || '#1f2937',
      padding: '20px',
      borderRadius: '8px',
      minHeight: '100px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '10px'
    }}>
      <div style={{
        width: '100%',
        height: `${config.height || 20}px`,
        backgroundColor: config.background_color || '#374151',
        borderRadius: `${config.border_radius || 10}px`,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={barStyle} />
      </div>
      {config.show_percentage && (
        <div style={{
          color: config.text_color || '#ffffff',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {Math.round(currentProgress)}%
        </div>
      )}
    </div>
  );
};

const LoadingAnimation = ({ config, isPlaying, onComplete }) => {
  useEffect(() => {
    if (isPlaying && onComplete) {
      // Loading animations are typically continuous, but we'll call onComplete after a delay
      const timeout = setTimeout(onComplete, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying, onComplete]);

  const renderLoadingType = () => {
    const size = config.size || 60;
    const color = config.color || '#8b5cf6';
    const speed = config.speed || 1.5;

    switch (config.loading_type) {
      case 'spinner':
        return (
          <div 
            className="loading-spinner"
            style={{
              width: size,
              height: size,
              border: `${config.stroke_width || 4}px solid transparent`,
              borderTop: `${config.stroke_width || 4}px solid ${color}`,
              borderRadius: '50%',
              animationDuration: `${1/speed}s`
            }}
          />
        );
      case 'dots':
        return (
          <div className="loading-dots" style={{ gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: size/4,
                  height: size/4,
                  backgroundColor: color,
                  borderRadius: '50%',
                  animationDelay: `${i * 0.2/speed}s`,
                  animationDuration: `${1/speed}s`
                }}
                className="bounce-dot"
              />
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div 
            className="loading-pulse"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: '50%',
              animationDuration: `${1.5/speed}s`
            }}
          />
        );
      case 'wave':
        return (
          <div className="loading-wave" style={{ gap: '4px' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  width: size/8,
                  height: size,
                  backgroundColor: color,
                  animationDelay: `${i * 0.1/speed}s`,
                  animationDuration: `${1/speed}s`
                }}
                className="wave-bar"
              />
            ))}
          </div>
        );
      case 'orbit':
        return (
          <div className="loading-orbit" style={{ width: size, height: size }}>
            <div 
              style={{
                width: size/6,
                height: size/6,
                backgroundColor: color,
                borderRadius: '50%',
                animationDuration: `${1/speed}s`
              }}
              className="orbit-dot"
            />
          </div>
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div style={{
      background: config.background || '#1a1a2e',
      padding: '40px',
      borderRadius: '8px',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px'
    }}>
      {renderLoadingType()}
      {config.show_text && (
        <div style={{
          color: config.text_color || '#ffffff',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {config.loading_text || 'Loading...'}
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
        decay: 1 / ((config.duration || 3000) / 16.67),
        shape: config.particle_shape || 'circle',
        rotation: Math.random() * Math.PI * 2
      });
    }

    particlesRef.current = particles;

    const drawParticle = (ctx, particle) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      switch (particle.shape) {
        case 'square':
          ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(-particle.size, particle.size);
          ctx.lineTo(particle.size, particle.size);
          ctx.closePath();
          ctx.fill();
          break;
        case 'star':
          // Simple star shape
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5;
            const x = Math.cos(angle) * particle.size;
            const y = Math.sin(angle) * particle.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
        default: // circle
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
      }
      
      ctx.restore();
    };

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
        particle.rotation += 0.1;

        const alpha = particle.life;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = config.particle_color || '#fbbf24';
        
        if (config.trail_effect) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = config.particle_color || '#fbbf24';
        }
        
        drawParticle(ctx, particle);

        if (particle.life > 0) aliveParticles++;
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

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

// Enhanced Animation Preview Component
const AnimationPreview = ({ template, config, isPlaying, onComplete, autoPlay = false }) => {
  const [localPlaying, setLocalPlaying] = useState(autoPlay);

  useEffect(() => {
    if (autoPlay) {
      setLocalPlaying(true);
      const timeout = setTimeout(() => {
        setLocalPlaying(false);
        setTimeout(() => setLocalPlaying(true), 1000); // Loop preview
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [autoPlay]);

  const actualPlaying = isPlaying !== undefined ? isPlaying : localPlaying;

  const renderAnimation = () => {
    switch (template.type) {
      case 'counter':
        return <MoneyCounter config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'chart':
        return <AnimatedBarChart config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'social_counter':
        return <SocialCounter config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'countdown':
        return <CountdownTimer config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'text_animation':
        return <TextAnimation config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'logo_reveal':
        return <LogoReveal config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'progress_bar':
        return <ProgressBar config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'loading':
        return <LoadingAnimation config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
      case 'particles':
        return <ParticleBurst config={config} isPlaying={actualPlaying} onComplete={onComplete} />;
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

// Enhanced Parameter Control Component
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
          <div className="color-control">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="param-color"
            />
            <span className="color-value">{value}</span>
          </div>
        );
      case 'boolean':
        return (
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
              className="param-checkbox"
            />
            <span className="checkbox-label">Enable</span>
          </label>
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

// Enhanced Animation Editor Component with Export
const AnimationEditor = ({ template, onClose, onSave }) => {
  const [config, setConfig] = useState(template.default_config);
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState(`${template.name} Project`);
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async (format = 'mp4') => {
    try {
      setExporting(true);
      
      // First save the project
      const projectData = {
        template_id: template.id,
        name: projectName,
        config: config
      };

      const projectResponse = await axios.post(`${API}/projects`, projectData);
      const projectId = projectResponse.data.id;

      // Then export it
      const exportData = {
        project_id: projectId,
        format: format,
        duration: 5000,
        width: 800,
        height: 600,
        quality: 'high'
      };

      const exportResponse = await axios.post(`${API}/export`, exportData);
      
      // Download the exported file
      const downloadUrl = `${API}${exportResponse.data.download_url}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${projectName}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Animation exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export animation');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="editor-modal">
      <div className="editor-content">
        <div className="editor-header">
          <div>
            <h2>Animation Editor - {template.name}</h2>
            <span className="template-category">{template.category}</span>
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
              <div className="export-controls">
                <button 
                  onClick={() => handleExport('mp4')} 
                  disabled={exporting}
                  className="btn-export"
                >
                  📹 Export MP4
                </button>
                <button 
                  onClick={() => handleExport('gif')} 
                  disabled={exporting}
                  className="btn-export"
                >
                  🎞️ Export GIF
                </button>
              </div>
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
            <p className="template-description">{template.description}</p>
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

// Enhanced Template Card Component with Auto-play Preview
const TemplateCard = ({ template, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="template-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="template-preview">
        <AnimationPreview
          template={template}
          config={template.default_config}
          autoPlay={isHovered}
          onComplete={() => {}}
        />
        <div className="template-overlay">
          <span className="template-category-badge">{template.category}</span>
        </div>
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

// Enhanced Hero Section Component
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
        <h1 className="hero-title">Professional Motion Graphics Studio</h1>
        <p className="hero-subtitle">
          Create stunning animated graphics with our advanced editor. Money counters, social media animations,
          data visualizations, loading spinners, and more. Customize every detail and export ready-to-use animations.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary hero-btn">🚀 Start Creating</button>
          <button className="btn-secondary hero-btn">📚 Browse Templates</button>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">9+</span>
            <span className="stat-label">Animation Types</span>
          </div>
          <div className="stat">
            <span className="stat-number">50+</span>
            <span className="stat-label">Parameters</span>
          </div>
          <div className="stat">
            <span className="stat-number">∞</span>
            <span className="stat-label">Possibilities</span>
          </div>
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [templateCategories, setTemplateCategories] = useState([]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`, {
        params: selectedCategory ? { category: selectedCategory } : {}
      });
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

  const fetchTemplateCategories = async () => {
    try {
      const response = await axios.get(`${API}/template-categories`);
      setTemplateCategories(['all', ...response.data.categories]);
    } catch (error) {
      console.error('Failed to fetch template categories:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchProjects(), fetchTemplateCategories()]);
      setLoading(false);
    };
    loadData();
  }, [selectedCategory]);

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

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === 'all' ? '' : category);
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="logo">
            <h1>MotionStock</h1>
            <span className="logo-subtitle">Studio Pro</span>
          </div>
          <nav>
            <button 
              onClick={() => setActiveTab('templates')}
              className={activeTab === 'templates' ? 'nav-btn active' : 'nav-btn'}
            >
              🎨 Templates
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={activeTab === 'projects' ? 'nav-btn active' : 'nav-btn'}
            >
              📁 My Projects
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Template Categories Filter */}
      {activeTab === 'templates' && (
        <section className="category-filter-section">
          <div className="container">
            <div className="category-filters">
              {templateCategories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`category-filter-btn ${selectedCategory === (category === 'all' ? '' : category) ? 'active' : ''}`}
                >
                  {category === 'all' ? '🌟 All' : `${getCategoryIcon(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

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
                    <h2>
                      {selectedCategory 
                        ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Templates` 
                        : 'All Animation Templates'
                      }
                    </h2>
                    <p>Hover over templates to see live previews • Click to customize</p>
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
                    <p>Your saved and exported animation projects</p>
                  </div>
                  {projects.length > 0 ? (
                    <div className="projects-grid">
                      {projects.map(project => (
                        <div key={project.id} className="project-card">
                          <h3>{project.name}</h3>
                          <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                          <p>Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
                          <div className="project-actions">
                            <button className="btn-primary">✏️ Edit</button>
                            <button className="btn-secondary">📤 Export</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🎬</div>
                      <h3>No projects yet</h3>
                      <p>Create your first animation from our professional templates!</p>
                      <button 
                        className="btn-primary"
                        onClick={() => setActiveTab('templates')}
                      >
                        Browse Templates
                      </button>
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
          <div className="footer-content">
            <div>
              <h3>MotionStock Studio Pro</h3>
              <p>Professional motion graphics creation made simple</p>
            </div>
            <div className="footer-features">
              <div className="feature">
                <span className="feature-icon">🎯</span>
                <span>9+ Animation Types</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <span>Real-time Preview</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <span>Export Ready</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 MotionStock Studio Pro. Create amazing motion graphics with ease.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function for category icons
const getCategoryIcon = (category) => {
  const icons = {
    business: '💼',
    social: '📱',
    utility: '🔧',
    creative: '🎨',
    data: '📊'
  };
  return icons[category] || '🎯';
};

export default App;