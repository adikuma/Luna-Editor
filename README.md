# Luna

A simple web application for AI-powered image editing, generation, and enhancement.

## Features

- **Image Editing**: Select regions or draw masks to edit specific areas
- **Image Generation**: Create new images from text descriptions
- **Image Enhancement**: Upscale and improve image quality
- **Responsive Design**: Clean, modern UI with smooth transitions

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS
- Lucide Icons for UI elements

Key components:
- `ImageEditor.tsx`: Main editing interface with drawing and selection tools
- `ImageEnhancer.tsx`: Image upscaling and enhancement
- `ImageGenerator.tsx`: Text-to-image generation

### Backend
- FastAPI (Python)
- GetImg.ai API integration
- PIL for image processing
- Environment variables for configuration

Key endpoints:
- `/api/edit-image`: Inpainting with masks
- `/api/upscale`: Image enhancement
- `/api/text2img`: Text-to-image generation

## Setup

1. Clone the repository
2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

3. Create `.env` file in backend directory:
```
GETIMG_API_KEY=your_api_key
```

4. Start the servers:
```bash
# Frontend
npm run dev

# Backend
uvicorn main:app --reload
```

## Usage

1. **Image Editing**
   - Upload an image
   - Use select/draw tools to mark areas
   - Enter prompt describing desired changes
   - Click Generate

2. **Image Enhancement**
   - Upload an image
   - Click Enhance for 4x upscaling

3. **Image Generation**
   - Enter text prompt
   - Click Generate for AI creation

## API Documentation

### /api/edit-image
- POST request
- Parameters: image (file), mask (file), prompt (string)
- Returns: Generated image URL/base64

### /api/upscale
- POST request
- Parameters: image (base64), scale (float)
- Returns: Enhanced image URL

### /api/text2img
- POST request
- Parameters: prompt (string)
- Returns: Generated image URL
