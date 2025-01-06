from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import os
from PIL import Image, ImageOps
import io
import base64
import requests
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    GETIMG_API_KEY: str
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

settings = Settings()

app = FastAPI(title="DoodleWhisper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/edit-image")
async def edit_image(
    image: UploadFile = File(...),
    mask: Optional[UploadFile] = File(None),
    prompt: str = Form(...),
):
    try:
        logger.info(f"Processing image edit request with prompt: {prompt}")
        
        image_contents = await image.read()
        img = Image.open(io.BytesIO(image_contents))
        
        width, height = 512, 512
        img = ImageOps.fit(img, (width, height), method=Image.Resampling.LANCZOS)
        
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        base64_image = base64.b64encode(img_buffer.getvalue()).decode('utf-8')

        base64_mask = None
        if mask:
            mask_contents = await mask.read()
            mask_img = Image.open(io.BytesIO(mask_contents))
            mask_img = ImageOps.fit(mask_img, (width, height), method=Image.Resampling.LANCZOS)
            
            mask_buffer = io.BytesIO()
            mask_img.save(mask_buffer, format="PNG")
            base64_mask = base64.b64encode(mask_buffer.getvalue()).decode('utf-8')

        api_payload = {
            "model": "realistic-vision-v5-1-inpainting",
            "prompt": prompt,
            "image": base64_image,
            "width": width,
            "height": height,
            "strength": 0.8,
            "steps": 80,
            "guidance": 10,
            "response_format": "url",
            "output_format": "jpeg"
        }
        
        if base64_mask:
            api_payload["mask_image"] = base64_mask

        logger.info("Calling GetImg.ai API")
        response = requests.post(
            "https://api.getimg.ai/v1/stable-diffusion/inpaint",
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Bearer {settings.GETIMG_API_KEY}"
            },
            json=api_payload
        )

        if response.status_code != 200:
            logger.error(f"GetImg.ai API error: {response.status_code}")
            raise HTTPException(
                status_code=response.status_code, 
                detail="Image generation failed"
            )

        result = response.json()
        
        logger.info("Fetching generated image")
        generated_image_response = requests.get(result["url"], timeout=30)
        if generated_image_response.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch generated image")
        
        generated_base64 = base64.b64encode(generated_image_response.content).decode('utf-8')
        content_type = generated_image_response.headers.get('content-type', 'image/jpeg')

        logger.info("Successfully processed image edit request")
        return JSONResponse({
            "success": True,
            "url": result["url"],
            "base64": f"data:{content_type};base64,{generated_base64}"
        })

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")
    
    
@app.post("/api/img2img")
async def img2img(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    size: str = Form("512x512")
):
    try:
        logger.info("Starting img2img processing...")
        logger.info(f"Received image: {image.filename}, content_type: {image.content_type}")
        logger.info(f"Prompt: {prompt}")
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        logger.info(f"Original image size: {img.size}, mode: {img.mode}")
        width, height = 512, 512
        img = ImageOps.fit(img, (width, height), method=Image.Resampling.LANCZOS)
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            img = img.convert('RGB')
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=95)
        buffer.seek(0)
        base64_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
        api_key = os.getenv('GETIMG_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        payload = {
            "model": "realvis-xl-v4",
            "prompt": prompt,
            "image": base64_image,
            "width": width,
            "height": height,
            "strength": 0.7,
            "response_format": "url"
        }

        logger.info("Sending request to GetImg.ai API...")
        response = requests.post(
            "https://api.getimg.ai/v1/stable-diffusion-xl/image-to-image",
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Bearer {api_key}"
            },
            json=payload,
            timeout=30
        )
        
        logger.info(f"API response status code: {response.status_code}")
        response_json = response.json()

        if response.status_code != 200:
            error_detail = response_json.get('error', {}).get('message', 'Unknown error')
            logger.error(f"API request failed: {response.status_code} {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Image generation failed: {error_detail}"
            )

        if "url" not in response_json:
            raise HTTPException(status_code=502, detail="Invalid response from image service")

        logger.info("Successfully generated image")
        return JSONResponse({"success": True, "url": response_json["url"]})

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in img2img endpoint: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")


class ImagePrompt(BaseModel):
    prompt: str

@app.post("/api/text2img")
async def text2img(prompt_data: ImagePrompt):
    try:
        logger.info("Starting text2img processing...")
        api_key = os.getenv('GETIMG_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
            
        payload = {
            "model": "flux-schnell",
            "prompt": prompt_data.prompt,
            "response_format": "url",  
            "width": 512,          
            "height": 512,           
            "steps": 4                
        }

        logger.info(f"Request payload: {payload}")
        
        logger.info("Sending request to GetImg.ai API...")
        response = requests.post(
            "https://api.getimg.ai/v1/flux-schnell/text-to-image",
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Bearer {api_key}"
            },
            json=payload,
            timeout=30
        )
        
        logger.info(f"API response status code: {response.status_code}")
        
        try:
            response_json = response.json()
            logger.info(f"API response content: {response_json}")
        except requests.exceptions.JSONDecodeError as json_err:
            logger.error(f"Failed to decode JSON response: {response.text}")
            raise HTTPException(status_code=502, detail="Invalid JSON response from image service")

        if response.status_code != 200:
            error_detail = response_json.get('error', {}).get('message', 'Unknown error')
            logger.error(f"API request failed: {response.status_code} {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Image generation failed: {error_detail}"
            )

        if "url" not in response_json:
            logger.error(f"URL not found in response. Full response: {response_json}")
            raise HTTPException(
                status_code=502, 
                detail=f"Response missing image URL. Response received: {str(response_json)}"
            )

        logger.info("Successfully generated image")
        return JSONResponse({
            "success": True, 
            "url": response_json["url"],
        })

    except requests.exceptions.Timeout:
        logger.error("Request to GetImg.ai API timed out")
        raise HTTPException(status_code=504, detail="Image generation timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to communicate with image service: {str(e)}")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in text2img endpoint: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

class UpscaleRequest(BaseModel):
    image: str
    scale: float = 4.0  
    output_format: str = "jpeg" 

@app.post("/api/upscale")
async def upscale(request_data: UpscaleRequest):
    try:
        logger.info("Starting image upscaling process...")
        api_key = os.getenv('GETIMG_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
            
        payload = {
            "model": "real-esrgan-4x",
            "image": request_data.image,
            "scale": request_data.scale,
            "output_format": request_data.output_format,
            "response_format": "url"  
        }

        logger.info("Sending request to GetImg.ai upscale API...")
        response = requests.post(
            "https://api.getimg.ai/v1/enhancements/upscale",
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Bearer {api_key}"
            },
            json=payload,
            timeout=60  
        )
        
        logger.info(f"API response status code: {response.status_code}")
        
        try:
            response_json = response.json()
            logger.info("Successfully received JSON response")
        except requests.exceptions.JSONDecodeError as json_err:
            logger.error(f"Failed to decode JSON response: {response.text}")
            raise HTTPException(status_code=502, detail="Invalid JSON response from upscale service")

        if response.status_code != 200:
            error_detail = response_json.get('error', {}).get('message', 'Unknown error')
            logger.error(f"API request failed: {response.status_code} {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Image upscaling failed: {error_detail}"
            )

        if "url" not in response_json:
            logger.error(f"URL not found in response. Full response: {response_json}")
            raise HTTPException(
                status_code=502, 
                detail=f"Response missing image URL. Response received: {str(response_json)}"
            )

        logger.info("Successfully upscaled image")
        return JSONResponse({
            "success": True,
            "url": response_json["url"],
            "cost": response_json.get("cost")  
        })

    except requests.exceptions.Timeout:
        logger.error("Request to GetImg.ai API timed out")
        raise HTTPException(status_code=504, detail="Image upscaling timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to communicate with upscale service: {str(e)}")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in upscale endpoint: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Image upscaling failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
