import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Hero Section Component
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
        <h1 className="hero-title">Premium Motion Graphics</h1>
        <p className="hero-subtitle">
          Discover thousands of high-quality motion graphics, transitions, and visual effects
          to elevate your creative projects.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary">Explore Collection</button>
          <button className="btn-secondary">Upload Your Work</button>
        </div>
      </div>
    </section>
  );
};

// Upload Modal Component
const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'transitions',
    tags: '',
    format: 'MP4'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    'transitions', 'overlays', 'backgrounds', 'text_animations', 
    'effects', 'particles', 'shapes', 'logos', 'lower_thirds', 'other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('title', formData.title);
    uploadFormData.append('description', formData.description);
    uploadFormData.append('category', formData.category);
    uploadFormData.append('tags', JSON.stringify(formData.tags.split(',').map(tag => tag.trim())));
    uploadFormData.append('format', formData.format);
    uploadFormData.append('file', file);

    try {
      await axios.post(`${API}/motion-graphics`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload();
      onClose();
      setFormData({ title: '', description: '', category: 'transitions', tags: '', format: 'MP4' });
      setFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Motion Graphics</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({...formData, format: e.target.value})}
              >
                <option value="MP4">MP4</option>
                <option value="MOV">MOV</option>
                <option value="AVI">AVI</option>
                <option value="ZIP">ZIP (Project Files)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="abstract, colorful, modern"
            />
          </div>
          <div className="form-group">
            <label>File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".mp4,.mov,.avi,.zip"
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Motion Graphics Card Component
const MotionGraphicCard = ({ motionGraphic, onDownload }) => {
  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `${API}/motion-graphics/${motionGraphic.id}/download`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', motionGraphic.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      if (onDownload) onDownload();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="motion-card">
      <div className="motion-card-thumbnail">
        {motionGraphic.thumbnail_base64 ? (
          <img 
            src={motionGraphic.thumbnail_base64} 
            alt={motionGraphic.title}
            className="thumbnail-image"
          />
        ) : (
          <div className="thumbnail-placeholder">
            <div className="play-icon">▶</div>
          </div>
        )}
        <div className="card-overlay">
          <button className="download-btn" onClick={handleDownload}>
            <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="motion-card-content">
        <h3 className="motion-title">{motionGraphic.title}</h3>
        <p className="motion-description">{motionGraphic.description}</p>
        <div className="motion-meta">
          <span className="motion-category">{motionGraphic.category.toUpperCase()}</span>
          <span className="motion-format">{motionGraphic.format}</span>
          <span className="motion-downloads">↓ {motionGraphic.download_count}</span>
        </div>
        {motionGraphic.tags && motionGraphic.tags.length > 0 && (
          <div className="motion-tags">
            {motionGraphic.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Search and Filter Component
const SearchFilter = ({ onSearch, onCategoryFilter, selectedCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = [
    'all', 'transitions', 'overlays', 'backgrounds', 'text_animations', 
    'effects', 'particles', 'shapes', 'logos', 'lower_thirds', 'other'
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="search-filter-section">
      <div className="container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search motion graphics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryFilter(category === 'all' ? '' : category)}
              className={`filter-btn ${selectedCategory === (category === 'all' ? '' : category) ? 'active' : ''}`}
            >
              {category.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [motionGraphics, setMotionGraphics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMotionGraphics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`${API}/motion-graphics?${params}`);
      setMotionGraphics(response.data);
    } catch (error) {
      console.error('Failed to fetch motion graphics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotionGraphics();
  }, [selectedCategory, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const handleUpload = () => {
    fetchMotionGraphics();
  };

  const handleDownload = () => {
    fetchMotionGraphics(); // Refresh to update download counts
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="logo">
            <h1>MotionStock</h1>
          </div>
          <nav>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              Upload
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Search and Filters */}
      <SearchFilter 
        onSearch={handleSearch}
        onCategoryFilter={handleCategoryFilter}
        selectedCategory={selectedCategory}
      />

      {/* Motion Graphics Gallery */}
      <section className="gallery-section">
        <div className="container">
          <div className="section-header">
            <h2>Motion Graphics Collection</h2>
            <p>Discover high-quality motion graphics for your creative projects</p>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading motion graphics...</p>
            </div>
          ) : (
            <div className="motion-grid">
              {motionGraphics.length > 0 ? (
                motionGraphics.map(mg => (
                  <MotionGraphicCard 
                    key={mg.id} 
                    motionGraphic={mg} 
                    onDownload={handleDownload}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <p>No motion graphics found. Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>&copy; 2025 MotionStock. Elevate your creativity with premium motion graphics.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;