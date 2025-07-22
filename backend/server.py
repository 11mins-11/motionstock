from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import shutil
import mimetypes
import base64
import json
from io import BytesIO
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads" / "motion_graphics"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Create exports directory
EXPORTS_DIR = ROOT_DIR / "exports"
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class MotionGraphic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    tags: List[str] = []
    filename: str
    file_path: str
    file_size: int
    duration: Optional[float] = None
    thumbnail_base64: Optional[str] = None
    download_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    format: str

class AnimatedTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "counter", "text_animation", "progress_bar", "particles", "chart", "social_counter", "countdown", "logo_reveal", "loading"
    category: str  # "business", "social", "utility", "creative", "data"
    description: str
    preview_url: Optional[str] = None
    default_config: Dict[str, Any] = {}
    editable_params: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnimatedProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    template_id: str
    name: str
    config: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ExportRequest(BaseModel):
    project_id: str
    format: str = "mp4"  # "mp4", "gif", "webm"
    duration: int = 5000  # milliseconds
    width: int = 800
    height: int = 600
    quality: str = "high"  # "low", "medium", "high"

class MotionGraphicCreate(BaseModel):
    title: str
    description: str
    category: str
    tags: List[str] = []
    format: str

class MotionGraphicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class AnimatedProjectCreate(BaseModel):
    template_id: str
    name: str
    config: Dict[str, Any] = {}

class AnimatedProjectUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

# Categories for motion graphics
CATEGORIES = [
    "transitions",
    "overlays", 
    "backgrounds",
    "text_animations",
    "effects",
    "particles",
    "shapes",
    "logos",
    "lower_thirds",
    "other"
]

# Template categories
TEMPLATE_CATEGORIES = [
    "business",
    "social",
    "utility", 
    "creative",
    "data"
]

# Enhanced Animation Templates with new sophisticated options
DEFAULT_TEMPLATES = [
    # Business Templates
    {
        "name": "Money Counter",
        "type": "counter",
        "category": "business",
        "description": "Animated number counter with currency formatting",
        "default_config": {
            "start_value": 0,
            "end_value": 1000000,
            "duration": 3000,
            "currency": "$",
            "decimal_places": 0,
            "color": "#00ff88",
            "font_size": 48,
            "font_weight": "bold",
            "background": "#000000",
            "easing": "ease-out",
            "glow_effect": True
        },
        "editable_params": [
            {"name": "start_value", "type": "number", "label": "Start Value", "min": 0, "max": 999999999},
            {"name": "end_value", "type": "number", "label": "End Value", "min": 0, "max": 999999999},
            {"name": "duration", "type": "range", "label": "Duration (ms)", "min": 500, "max": 10000, "step": 100},
            {"name": "currency", "type": "text", "label": "Currency Symbol", "max_length": 3},
            {"name": "decimal_places", "type": "number", "label": "Decimal Places", "min": 0, "max": 4},
            {"name": "color", "type": "color", "label": "Text Color"},
            {"name": "font_size", "type": "range", "label": "Font Size", "min": 16, "max": 128, "step": 2},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "easing", "type": "select", "label": "Animation Easing", 
             "options": [
                 {"value": "linear", "label": "Linear"},
                 {"value": "ease-in", "label": "Ease In"},
                 {"value": "ease-out", "label": "Ease Out"},
                 {"value": "ease-in-out", "label": "Ease In Out"},
                 {"value": "bounce", "label": "Bounce"}
             ]},
            {"name": "glow_effect", "type": "boolean", "label": "Glow Effect"}
        ]
    },
    {
        "name": "Animated Bar Chart",
        "type": "chart",
        "category": "data",
        "description": "Animated bar chart with customizable data",
        "default_config": {
            "data": [
                {"label": "Q1", "value": 75, "color": "#8b5cf6"},
                {"label": "Q2", "value": 85, "color": "#a855f7"},
                {"label": "Q3", "value": 90, "color": "#c084fc"},
                {"label": "Q4", "value": 95, "color": "#d8b4fe"}
            ],
            "duration": 2000,
            "bar_width": 40,
            "spacing": 20,
            "background": "#1a1a2e",
            "text_color": "#ffffff",
            "show_values": True,
            "animate_bars": True,
            "animate_labels": True
        },
        "editable_params": [
            {"name": "duration", "type": "range", "label": "Animation Duration", "min": 1000, "max": 8000, "step": 200},
            {"name": "bar_width", "type": "range", "label": "Bar Width", "min": 20, "max": 80, "step": 5},
            {"name": "spacing", "type": "range", "label": "Bar Spacing", "min": 10, "max": 50, "step": 5},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "text_color", "type": "color", "label": "Text Color"},
            {"name": "show_values", "type": "boolean", "label": "Show Values"},
            {"name": "animate_bars", "type": "boolean", "label": "Animate Bars"},
            {"name": "animate_labels", "type": "boolean", "label": "Animate Labels"}
        ]
    },
    # Social Templates
    {
        "name": "Social Counter",
        "type": "social_counter",
        "category": "social",
        "description": "Social media follower/like counter with icons",
        "default_config": {
            "platform": "instagram",
            "start_count": 0,
            "end_count": 50000,
            "duration": 4000,
            "label": "Followers",
            "color": "#e4405f",
            "background": "#000000",
            "font_size": 32,
            "show_icon": True,
            "animate_icon": True
        },
        "editable_params": [
            {"name": "platform", "type": "select", "label": "Platform",
             "options": [
                 {"value": "instagram", "label": "Instagram"},
                 {"value": "youtube", "label": "YouTube"},
                 {"value": "twitter", "label": "Twitter"},
                 {"value": "tiktok", "label": "TikTok"},
                 {"value": "linkedin", "label": "LinkedIn"}
             ]},
            {"name": "start_count", "type": "number", "label": "Start Count", "min": 0},
            {"name": "end_count", "type": "number", "label": "End Count", "min": 0},
            {"name": "duration", "type": "range", "label": "Duration (ms)", "min": 1000, "max": 8000, "step": 200},
            {"name": "label", "type": "text", "label": "Label Text"},
            {"name": "color", "type": "color", "label": "Text Color"},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "font_size", "type": "range", "label": "Font Size", "min": 16, "max": 64, "step": 2},
            {"name": "show_icon", "type": "boolean", "label": "Show Platform Icon"},
            {"name": "animate_icon", "type": "boolean", "label": "Animate Icon"}
        ]
    },
    {
        "name": "Countdown Timer",
        "type": "countdown",
        "category": "utility",
        "description": "Countdown timer with customizable styling",
        "default_config": {
            "start_time": 60,
            "time_unit": "seconds",
            "color": "#ff6b35",
            "background": "#1a1a2e",
            "font_size": 48,
            "show_labels": True,
            "format": "mm:ss",
            "warning_color": "#ff3333",
            "warning_threshold": 10
        },
        "editable_params": [
            {"name": "start_time", "type": "number", "label": "Start Time", "min": 1, "max": 3600},
            {"name": "time_unit", "type": "select", "label": "Time Unit",
             "options": [
                 {"value": "seconds", "label": "Seconds"},
                 {"value": "minutes", "label": "Minutes"},
                 {"value": "hours", "label": "Hours"}
             ]},
            {"name": "color", "type": "color", "label": "Text Color"},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "font_size", "type": "range", "label": "Font Size", "min": 24, "max": 96, "step": 4},
            {"name": "show_labels", "type": "boolean", "label": "Show Time Labels"},
            {"name": "warning_color", "type": "color", "label": "Warning Color"},
            {"name": "warning_threshold", "type": "number", "label": "Warning Threshold", "min": 1, "max": 60}
        ]
    },
    # Creative Templates
    {
        "name": "Text Reveal",
        "type": "text_animation", 
        "category": "creative",
        "description": "Animated text with various reveal effects",
        "default_config": {
            "text": "Amazing Motion Graphics",
            "animation_type": "typewriter",
            "duration": 2000,
            "color": "#ffffff",
            "font_size": 36,
            "font_weight": "normal",
            "background": "#1a1a2e",
            "delay": 0,
            "letter_spacing": 2,
            "glow_intensity": 0
        },
        "editable_params": [
            {"name": "text", "type": "text", "label": "Text Content", "max_length": 100},
            {"name": "animation_type", "type": "select", "label": "Animation Type", 
             "options": [
                 {"value": "typewriter", "label": "Typewriter"},
                 {"value": "fade_in", "label": "Fade In"},
                 {"value": "slide_up", "label": "Slide Up"},
                 {"value": "bounce", "label": "Bounce"},
                 {"value": "rotate_in", "label": "Rotate In"},
                 {"value": "wave", "label": "Wave"},
                 {"value": "glitch", "label": "Glitch Effect"}
             ]},
            {"name": "duration", "type": "range", "label": "Duration (ms)", "min": 500, "max": 5000, "step": 100},
            {"name": "delay", "type": "range", "label": "Delay (ms)", "min": 0, "max": 3000, "step": 100},
            {"name": "color", "type": "color", "label": "Text Color"},
            {"name": "font_size", "type": "range", "label": "Font Size", "min": 16, "max": 96, "step": 2},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "letter_spacing", "type": "range", "label": "Letter Spacing", "min": 0, "max": 20, "step": 1},
            {"name": "glow_intensity", "type": "range", "label": "Glow Intensity", "min": 0, "max": 20, "step": 1}
        ]
    },
    {
        "name": "Logo Reveal",
        "type": "logo_reveal",
        "category": "creative", 
        "description": "Animated logo reveal with particle effects",
        "default_config": {
            "logo_text": "BRAND",
            "reveal_type": "particle_burst",
            "duration": 3000,
            "color": "#8b5cf6",
            "background": "#000000",
            "font_size": 48,
            "particle_count": 30,
            "glow_effect": True,
            "shake_intensity": 0
        },
        "editable_params": [
            {"name": "logo_text", "type": "text", "label": "Logo Text", "max_length": 20},
            {"name": "reveal_type", "type": "select", "label": "Reveal Type",
             "options": [
                 {"value": "fade_in", "label": "Fade In"},
                 {"value": "scale_up", "label": "Scale Up"},
                 {"value": "particle_burst", "label": "Particle Burst"},
                 {"value": "slide_reveal", "label": "Slide Reveal"},
                 {"value": "rotation", "label": "Rotation"}
             ]},
            {"name": "duration", "type": "range", "label": "Duration (ms)", "min": 1000, "max": 6000, "step": 200},
            {"name": "color", "type": "color", "label": "Logo Color"},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "font_size", "type": "range", "label": "Font Size", "min": 24, "max": 96, "step": 4},
            {"name": "particle_count", "type": "range", "label": "Particle Count", "min": 10, "max": 100, "step": 5},
            {"name": "glow_effect", "type": "boolean", "label": "Glow Effect"},
            {"name": "shake_intensity", "type": "range", "label": "Shake Effect", "min": 0, "max": 10, "step": 1}
        ]
    },
    # Existing templates with enhancements
    {
        "name": "Progress Bar",
        "type": "progress_bar",
        "category": "utility",
        "description": "Animated progress bar with customizable styling",
        "default_config": {
            "progress": 75,
            "duration": 2000,
            "bar_color": "#8b5cf6",
            "background_color": "#374151",
            "height": 20,
            "border_radius": 10,
            "show_percentage": True,
            "text_color": "#ffffff",
            "background": "#1f2937",
            "gradient_effect": True,
            "pulse_effect": False
        },
        "editable_params": [
            {"name": "progress", "type": "range", "label": "Progress %", "min": 0, "max": 100, "step": 1},
            {"name": "duration", "type": "range", "label": "Duration (ms)", "min": 500, "max": 5000, "step": 100},
            {"name": "bar_color", "type": "color", "label": "Bar Color"},
            {"name": "background_color", "type": "color", "label": "Track Color"},
            {"name": "height", "type": "range", "label": "Bar Height", "min": 10, "max": 50, "step": 2},
            {"name": "border_radius", "type": "range", "label": "Border Radius", "min": 0, "max": 25, "step": 1},
            {"name": "show_percentage", "type": "boolean", "label": "Show Percentage"},
            {"name": "text_color", "type": "color", "label": "Text Color"},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "gradient_effect", "type": "boolean", "label": "Gradient Effect"},
            {"name": "pulse_effect", "type": "boolean", "label": "Pulse Effect"}
        ]
    },
    {
        "name": "Particle Burst",
        "type": "particles",
        "category": "creative",
        "description": "Animated particle explosion effect",
        "default_config": {
            "particle_count": 50,
            "duration": 3000,
            "particle_color": "#fbbf24",
            "particle_size": 4,
            "spread": 200,
            "gravity": 0.5,
            "background": "#000000",
            "trigger_delay": 0,
            "particle_shape": "circle",
            "trail_effect": False
        },
        "editable_params": [
            {"name": "particle_count", "type": "range", "label": "Particle Count", "min": 10, "max": 200, "step": 5},
            {"name": "duration", "type": "range", "label": "Duration (ms)", "min": 1000, "max": 8000, "step": 200},
            {"name": "particle_color", "type": "color", "label": "Particle Color"},
            {"name": "particle_size", "type": "range", "label": "Particle Size", "min": 2, "max": 10, "step": 1},
            {"name": "spread", "type": "range", "label": "Spread", "min": 50, "max": 400, "step": 10},
            {"name": "gravity", "type": "range", "label": "Gravity", "min": 0, "max": 2, "step": 0.1},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "trigger_delay", "type": "range", "label": "Trigger Delay (ms)", "min": 0, "max": 3000, "step": 100},
            {"name": "particle_shape", "type": "select", "label": "Particle Shape",
             "options": [
                 {"value": "circle", "label": "Circle"},
                 {"value": "square", "label": "Square"},
                 {"value": "triangle", "label": "Triangle"},
                 {"value": "star", "label": "Star"}
             ]},
            {"name": "trail_effect", "type": "boolean", "label": "Trail Effect"}
        ]
    },
    {
        "name": "Loading Animation",
        "type": "loading",
        "category": "utility",
        "description": "Customizable loading spinner with various styles",
        "default_config": {
            "loading_type": "spinner",
            "color": "#8b5cf6",
            "background": "#1a1a2e",
            "size": 60,
            "speed": 1.5,
            "stroke_width": 4,
            "show_text": True,
            "loading_text": "Loading...",
            "text_color": "#ffffff"
        },
        "editable_params": [
            {"name": "loading_type", "type": "select", "label": "Loading Type",
             "options": [
                 {"value": "spinner", "label": "Spinner"},
                 {"value": "dots", "label": "Bouncing Dots"},
                 {"value": "pulse", "label": "Pulse"},
                 {"value": "wave", "label": "Wave"},
                 {"value": "orbit", "label": "Orbit"}
             ]},
            {"name": "color", "type": "color", "label": "Primary Color"},
            {"name": "background", "type": "color", "label": "Background Color"},
            {"name": "size", "type": "range", "label": "Size", "min": 30, "max": 120, "step": 5},
            {"name": "speed", "type": "range", "label": "Animation Speed", "min": 0.5, "max": 3, "step": 0.1},
            {"name": "stroke_width", "type": "range", "label": "Stroke Width", "min": 1, "max": 10, "step": 1},
            {"name": "show_text", "type": "boolean", "label": "Show Loading Text"},
            {"name": "loading_text", "type": "text", "label": "Loading Text"},
            {"name": "text_color", "type": "color", "label": "Text Color"}
        ]
    }
]

@api_router.get("/")
async def root():
    return {"message": "Motion Graphics Studio API - Enhanced Edition"}

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

@api_router.get("/template-categories")
async def get_template_categories():
    return {"categories": TEMPLATE_CATEGORIES}

# Animation Templates Endpoints
@api_router.get("/templates", response_model=List[AnimatedTemplate])
async def get_templates(category: Optional[str] = None):
    templates = await db.animated_templates.find().to_list(None)
    
    # If no templates in DB, initialize with defaults
    if not templates:
        for template_data in DEFAULT_TEMPLATES:
            template = AnimatedTemplate(**template_data)
            await db.animated_templates.insert_one(template.dict())
            templates.append(template)
    else:
        templates = [AnimatedTemplate(**t) for t in templates]
    
    # Filter by category if provided
    if category:
        templates = [t for t in templates if t.category == category]
    
    return templates

@api_router.get("/templates/{template_id}", response_model=AnimatedTemplate)
async def get_template(template_id: str):
    template = await db.animated_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return AnimatedTemplate(**template)

# Animated Projects Endpoints
@api_router.post("/projects", response_model=AnimatedProject)
async def create_project(project_data: AnimatedProjectCreate):
    # Verify template exists
    template = await db.animated_templates.find_one({"id": project_data.template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    project = AnimatedProject(**project_data.dict())
    await db.animated_projects.insert_one(project.dict())
    return project

@api_router.get("/projects", response_model=List[AnimatedProject])
async def get_projects():
    projects = await db.animated_projects.find().to_list(None)
    return [AnimatedProject(**p) for p in projects]

@api_router.get("/projects/{project_id}", response_model=AnimatedProject)
async def get_project(project_id: str):
    project = await db.animated_projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return AnimatedProject(**project)

@api_router.put("/projects/{project_id}", response_model=AnimatedProject)
async def update_project(project_id: str, update_data: AnimatedProjectUpdate):
    existing_project = await db.animated_projects.find_one({"id": project_id})
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    if update_dict:
        await db.animated_projects.update_one(
            {"id": project_id},
            {"$set": update_dict}
        )
    
    updated_project = await db.animated_projects.find_one({"id": project_id})
    return AnimatedProject(**updated_project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.animated_projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# Export functionality
@api_router.post("/export")
async def export_animation(export_request: ExportRequest):
    """Export animation as video/GIF (placeholder implementation)"""
    try:
        # Get project data
        project = await db.animated_projects.find_one({"id": export_request.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get template
        template = await db.animated_templates.find_one({"id": project["template_id"]})
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Generate export filename
        export_filename = f"{project['name'].replace(' ', '_')}_{uuid.uuid4().hex[:8]}.{export_request.format}"
        export_path = EXPORTS_DIR / export_filename
        
        # For now, create a simple placeholder file
        # In a real implementation, this would render the animation to video
        export_data = {
            "project": project,
            "template": template,
            "export_settings": export_request.dict(),
            "created_at": datetime.utcnow().isoformat(),
            "format": export_request.format,
            "dimensions": f"{export_request.width}x{export_request.height}",
            "duration": f"{export_request.duration}ms"
        }
        
        # Write export metadata (in real implementation, this would be video data)
        with open(export_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        return {
            "export_id": export_filename,
            "download_url": f"/api/exports/{export_filename}",
            "status": "completed",
            "format": export_request.format,
            "file_size": os.path.getsize(export_path)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@api_router.get("/exports/{export_id}")
async def download_export(export_id: str):
    """Download exported animation file"""
    export_path = EXPORTS_DIR / export_id
    if not export_path.exists():
        raise HTTPException(status_code=404, detail="Export file not found")
    
    return FileResponse(
        path=export_path,
        filename=export_id,
        media_type="application/octet-stream"
    )

# Original Motion Graphics Endpoints (keeping existing functionality)
@api_router.post("/motion-graphics", response_model=MotionGraphic)
async def upload_motion_graphic(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    tags: str = Form("[]"),
    format: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        tags_list = json.loads(tags)
    except json.JSONDecodeError:
        tags_list = []

    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {CATEGORIES}")

    allowed_types = ["video/mp4", "video/quicktime", "video/x-msvideo", "application/zip"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only MP4, MOV, AVI, and ZIP files are allowed.")

    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOADS_DIR / unique_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    file_size = os.path.getsize(file_path)
    thumbnail_base64 = generate_thumbnail_placeholder(category)

    motion_graphic_data = {
        "title": title,
        "description": description,
        "category": category,
        "tags": tags_list,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_size": file_size,
        "thumbnail_base64": thumbnail_base64,
        "format": format
    }
    
    motion_graphic = MotionGraphic(**motion_graphic_data)
    await db.motion_graphics.insert_one(motion_graphic.dict())
    
    return motion_graphic

@api_router.get("/motion-graphics", response_model=List[MotionGraphic])
async def get_motion_graphics(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    query = {}
    
    if category and category in CATEGORIES:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.motion_graphics.find(query).skip(offset).limit(limit)
    motion_graphics = await cursor.to_list(length=None)
    
    return [MotionGraphic(**mg) for mg in motion_graphics]

@api_router.get("/motion-graphics/{motion_graphic_id}", response_model=MotionGraphic)
async def get_motion_graphic(motion_graphic_id: str):
    motion_graphic = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not motion_graphic:
        raise HTTPException(status_code=404, detail="Motion graphics not found")
    
    return MotionGraphic(**motion_graphic)

@api_router.get("/motion-graphics/{motion_graphic_id}/download")
async def download_motion_graphic(motion_graphic_id: str):
    motion_graphic = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not motion_graphic:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    file_path = Path(motion_graphic["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    await db.motion_graphics.update_one(
        {"id": motion_graphic_id},
        {"$inc": {"download_count": 1}}
    )
    
    return FileResponse(
        path=file_path,
        filename=motion_graphic["filename"],
        media_type="application/octet-stream"
    )

@api_router.put("/motion-graphics/{motion_graphic_id}", response_model=MotionGraphic)
async def update_motion_graphic(motion_graphic_id: str, update_data: MotionGraphicUpdate):
    existing_mg = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not existing_mg:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.motion_graphics.update_one(
            {"id": motion_graphic_id},
            {"$set": update_dict}
        )
    
    updated_mg = await db.motion_graphics.find_one({"id": motion_graphic_id})
    return MotionGraphic(**updated_mg)

@api_router.delete("/motion-graphics/{motion_graphic_id}")
async def delete_motion_graphic(motion_graphic_id: str):
    motion_graphic = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not motion_graphic:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    file_path = Path(motion_graphic["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    result = await db.motion_graphics.delete_one({"id": motion_graphic_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    return {"message": "Motion graphic deleted successfully"}

@api_router.get("/stats")
async def get_stats():
    total_graphics = await db.motion_graphics.count_documents({})
    total_downloads = await db.motion_graphics.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$download_count"}}}
    ]).to_list(1)
    
    total_downloads_count = total_downloads[0]["total"] if total_downloads else 0
    
    category_stats = await db.motion_graphics.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(None)
    
    total_projects = await db.animated_projects.count_documents({})
    template_usage = await db.animated_projects.aggregate([
        {"$group": {"_id": "$template_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(None)
    
    # Template category stats
    template_category_stats = await db.animated_templates.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(None)
    
    return {
        "total_graphics": total_graphics,
        "total_downloads": total_downloads_count,
        "total_projects": total_projects,
        "total_templates": len(DEFAULT_TEMPLATES),
        "category_distribution": category_stats,
        "template_usage": template_usage,
        "template_categories": template_category_stats
    }

def generate_thumbnail_placeholder(category: str) -> str:
    """Generate a simple thumbnail placeholder based on category"""
    color_map = {
        "transitions": "#8B5CF6",
        "overlays": "#F59E0B",
        "backgrounds": "#3B82F6",
        "text_animations": "#EF4444",
        "effects": "#10B981",
        "particles": "#F97316",
        "shapes": "#8B5CF6",
        "logos": "#6366F1",
        "lower_thirds": "#EC4899",
        "other": "#6B7280"
    }
    
    color = color_map.get(category, "#6B7280")
    
    svg_content = f'''
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:{color};stop-opacity:1" />
                <stop offset="100%" style="stop-color:{color};stop-opacity:0.7" />
            </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#grad)" />
        <circle cx="150" cy="100" r="30" fill="white" opacity="0.3"/>
        <polygon points="140,85 140,115 165,100" fill="white" opacity="0.8"/>
        <text x="150" y="140" text-anchor="middle" fill="white" font-family="Arial" font-size="12" opacity="0.9">{category.upper()}</text>
    </svg>
    '''
    
    svg_bytes = svg_content.encode('utf-8')
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()