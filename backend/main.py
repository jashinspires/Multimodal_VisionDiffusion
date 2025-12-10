from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import base64

load_dotenv()

from services.ai_service import AIService
from services.database import DatabaseService
from services.storage import StorageService

app = FastAPI(title="VisionDiffusion API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4000", "http://127.0.0.1:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_service = AIService()
db_service = DatabaseService()
storage_service = StorageService()


@app.get("/")
async def root():
    return {"status": "ok", "message": "VisionDiffusion API is running!"}


@app.post("/api/analyze/caption")
async def analyze_caption(file: UploadFile = File(...)):
    """Generate a caption for an uploaded image"""
    try:
        # Read the image file
        contents = await file.read()
        
        # Convert to base64
        base64_image = base64.b64encode(contents).decode("utf-8")
        
        # Get caption from AI
        caption = await ai_service.generate_caption(base64_image, file.content_type)
        
        # Upload to storage
        image_url = await storage_service.upload_image(contents, file.filename)
        
        # Save to database
        record = await db_service.save_analysis(
            image_url=image_url,
            analysis_type="caption",
            result=caption
        )
        
        return {
            "success": True,
            "caption": caption,
            "image_url": image_url,
            "id": record.get("id") if record else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/vqa")
async def analyze_vqa(
    file: UploadFile = File(...),
    question: str = Form(...)
):
    """Answer questions about an image"""
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        
        answer = await ai_service.visual_qa(base64_image, file.content_type, question)
        image_url = await storage_service.upload_image(contents, file.filename)
        
        record = await db_service.save_analysis(
            image_url=image_url,
            analysis_type="vqa",
            result=answer,
            prompt=question
        )
        
        return {
            "success": True,
            "question": question,
            "answer": answer,
            "image_url": image_url,
            "id": record.get("id") if record else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/ocr")
async def analyze_ocr(file: UploadFile = File(...)):
    """Extract text from an image"""
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        
        extracted_text = await ai_service.extract_text_ocr(base64_image, file.content_type)
        image_url = await storage_service.upload_image(contents, file.filename)
        
        record = await db_service.save_analysis(
            image_url=image_url,
            analysis_type="ocr",
            result=extracted_text
        )
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "image_url": image_url,
            "id": record.get("id") if record else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate/text-to-image")
async def generate_text_to_image(prompt: str = Form(...)):
    """Generate an image from text"""
    try:
        image_url = await ai_service.generate_image(prompt)
        
        record = await db_service.save_generation(
            generation_type="text-to-image",
            prompt=prompt,
            result_url=image_url
        )
        
        return {
            "success": True,
            "prompt": prompt,
            "image_url": image_url,
            "id": record.get("id") if record else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate/variation")
async def generate_variation(file: UploadFile = File(...)):
    """Generate a variation of an uploaded image"""
    try:
        contents = await file.read()
        variation_url = await ai_service.generate_variation(contents)
        original_url = await storage_service.upload_image(contents, file.filename)
        
        record = await db_service.save_generation(
            generation_type="variation",
            prompt=f"Variation of {file.filename}",
            result_url=variation_url,
            source_image_url=original_url
        )
        
        return {
            "success": True,
            "original_url": original_url,
            "variation_url": variation_url,
            "id": record.get("id") if record else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/analyses")
async def get_analyses():
    """Get all past image analyses"""
    try:
        records = await db_service.get_analyses()
        return {"success": True, "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/generations")
async def get_generations():
    """Get all past image generations"""
    try:
        records = await db_service.get_generations()
        return {"success": True, "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
