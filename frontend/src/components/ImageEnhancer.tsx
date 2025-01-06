"use client";

import { useState, useRef } from "react";
import { Upload, ArrowDownToLine, X, Sparkles, Zap } from "lucide-react";

export default function ImageEnhancer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const inputRef = useRef(null);

  const validateAndResizeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width <= 1024 && img.height <= 1024) {
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let newWidth = img.width;
        let newHeight = img.height;
        
        if (img.width > 1024) {
          newWidth = 1024;
          newHeight = (img.height * 1024) / img.width;
        }
        if (newHeight > 1024) {
          newHeight = 1024;
          newWidth = (img.width * 1024) / img.height;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file) => {
    try {
      setError(null);
      const processedFile = await validateAndResizeImage(file);
      setSelectedFile(processedFile);
      setPreview(URL.createObjectURL(processedFile));
      setGeneratedImage(null);
    } catch (err) {
      setError("Failed to process image. Please try another file.");
    }
  };

  const handleUpscale = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const base64String = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch("http://localhost:8000/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "real-esrgan-4x",
          image: base64String,
          scale: 4,
          output_format: "jpeg",
          response_format: "url"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upscale image");
      }

      const data = await response.json();
      setGeneratedImage(data.url);
    } catch (error) {
      setError(error.message || "Failed to enhance image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4 py-10">
      <div className="w-[512px] space-y-6">
        {error && (
          <div className="w-full p-4 rounded-lg bg-red-500/10 flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        
        {!preview ? (
          <div 
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-[512px] h-[512px] rounded-3xl transition-all duration-500
              ${isDragging 
                ? 'border-white bg-white/20 scale-102' 
                : 'border-white/20 hover:border-white/40 bg-white/5'
              }
              relative group overflow-hidden`}
          >
            <div className="absolute inset-0" />
            
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept="image/*"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-500" />
                <Upload className="w-8 h-8 text-white/40 relative z-10 group-hover:text-white/60 transition-colors duration-500" />
              </div>
              
              <div className="mt-6 text-center relative z-10">
                <p className="text-white/60 text-sm font-light">Drop your image here or <span className="text-white/90 hover:text-white cursor-pointer transition-colors">browse</span></p>
                <p className="text-white/40 text-xs font-light mt-2">Maximum size: 1024×1024px</p>
              </div>

              <div className="absolute bottom-6 flex items-center gap-2 text-white/30">
                <Zap className="w-4 h-4" />
                <span className="text-sm">4× Enhancement</span>
              </div>
            </div>

            <div className="absolute inset-4 border border-white/20 rounded-2xl" />
          </div>
        ) : (
          <div className="relative w-[512px] h-[512px] rounded-3xl overflow-hidden border border-white/20">
            <img
              src={generatedImage || preview}
              alt="Preview"
              className={`w-full h-full object-cover transition-all duration-700 ${
                isLoading ? "blur-xl opacity-50 scale-105" : "blur-0 opacity-100 scale-100"
              }`}
            />
            
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white/70 animate-pulse" />
                <p className="text-white/70 text-sm mt-2">Enhancing your image</p>
              </div>
            )}

            <div className="absolute inset-x-4 bottom-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                    setGeneratedImage(null);
                    setError(null);
                  }}
                  className="p-2 bg-black/50 backdrop-blur-xl rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {generatedImage && (
                  <a
                    href={generatedImage}
                    download="enhanced-image.jpg"
                    className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-xl rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span className="text-sm">Download Enhanced</span>
                  </a>
                )}

                {!generatedImage && (
                  <button
                    onClick={handleUpscale}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isLoading ? "Enhance" : "Enhance"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}