from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
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

@api_router.get("/")
async def root():
    return {"message": "Motion Graphics Stock API"}

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

@api_router.post("/motion-graphics", response_model=MotionGraphic)
async def upload_motion_graphic(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    tags: str = Form("[]"),  # JSON string of tags
    format: str = Form(...),
    file: UploadFile = File(...)
):
    # Parse tags from JSON string
    try:
        tags_list = json.loads(tags)
    except json.JSONDecodeError:
        tags_list = []

    # Validate category
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {CATEGORIES}")

    # Validate file type
    allowed_types = ["video/mp4", "video/quicktime", "video/x-msvideo", "application/zip"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only MP4, MOV, AVI, and ZIP files are allowed.")

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOADS_DIR / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Get file size
    file_size = os.path.getsize(file_path)

    # Generate thumbnail (simplified - using placeholder for now)
    thumbnail_base64 = generate_thumbnail_placeholder(category)

    # Create motion graphic record
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
    
    # Save to database
    await db.motion_graphics.insert_one(motion_graphic.dict())
    
    return motion_graphic

@api_router.get("/motion-graphics", response_model=List[MotionGraphic])
async def get_motion_graphics(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    # Build query
    query = {}
    
    if category and category in CATEGORIES:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    # Get motion graphics from database
    cursor = db.motion_graphics.find(query).skip(offset).limit(limit)
    motion_graphics = await cursor.to_list(length=None)
    
    return [MotionGraphic(**mg) for mg in motion_graphics]

@api_router.get("/motion-graphics/{motion_graphic_id}", response_model=MotionGraphic)
async def get_motion_graphic(motion_graphic_id: str):
    motion_graphic = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not motion_graphic:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    return MotionGraphic(**motion_graphic)

@api_router.get("/motion-graphics/{motion_graphic_id}/download")
async def download_motion_graphic(motion_graphic_id: str):
    # Get motion graphic from database
    motion_graphic = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not motion_graphic:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    file_path = Path(motion_graphic["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    # Increment download count
    await db.motion_graphics.update_one(
        {"id": motion_graphic_id},
        {"$inc": {"download_count": 1}}
    )
    
    # Return file
    return FileResponse(
        path=file_path,
        filename=motion_graphic["filename"],
        media_type="application/octet-stream"
    )

@api_router.put("/motion-graphics/{motion_graphic_id}", response_model=MotionGraphic)
async def update_motion_graphic(motion_graphic_id: str, update_data: MotionGraphicUpdate):
    # Check if motion graphic exists
    existing_mg = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not existing_mg:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    # Prepare update data
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.motion_graphics.update_one(
            {"id": motion_graphic_id},
            {"$set": update_dict}
        )
    
    # Return updated motion graphic
    updated_mg = await db.motion_graphics.find_one({"id": motion_graphic_id})
    return MotionGraphic(**updated_mg)

@api_router.delete("/motion-graphics/{motion_graphic_id}")
async def delete_motion_graphic(motion_graphic_id: str):
    # Get motion graphic to delete file
    motion_graphic = await db.motion_graphics.find_one({"id": motion_graphic_id})
    if not motion_graphic:
        raise HTTPException(status_code=404, detail="Motion graphic not found")
    
    # Delete file from filesystem
    file_path = Path(motion_graphic["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
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
    
    # Category distribution
    category_stats = await db.motion_graphics.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(None)
    
    return {
        "total_graphics": total_graphics,
        "total_downloads": total_downloads_count,
        "category_distribution": category_stats
    }

def generate_thumbnail_placeholder(category: str) -> str:
    """Generate a simple thumbnail placeholder based on category"""
    # Color mapping for different categories
    color_map = {
        "transitions": "#8B5CF6",  # Purple
        "overlays": "#F59E0B",     # Amber
        "backgrounds": "#3B82F6",  # Blue
        "text_animations": "#EF4444", # Red
        "effects": "#10B981",      # Green
        "particles": "#F97316",    # Orange
        "shapes": "#8B5CF6",       # Purple
        "logos": "#6366F1",        # Indigo
        "lower_thirds": "#EC4899", # Pink
        "other": "#6B7280"         # Gray
    }
    
    color = color_map.get(category, "#6B7280")
    
    # Create a simple SVG placeholder
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
    
    # Convert SVG to base64
    svg_bytes = svg_content.encode('utf-8')
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()