"use client"

import { useState, useRef, useEffect } from "react";
import { Pencil, Square, Copy, Link, RefreshCcw, Sparkles, Upload, Download } from "lucide-react";
import UploadCard from "./UploadCard";


type Point = { x: number; y: number };
interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
type DrawMode = "draw" | "select" | null;

export default function ImageEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageDisplaySize, setImageDisplaySize] = useState({
    width: 0,
    height: 0,
  });
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [lastMouseX, setLastMouseX] = useState(0);
  const [lastMouseY, setLastMouseY] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [showPrompt, setShowPrompt] = useState(true);

  const handleFileSelect = async (file: File) => {
    try {
      const img = new Image();
      img.onload = () => {
        const displaySize = calculateDisplaySize();
        setImageDisplaySize(displaySize);
        setOriginalSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = URL.createObjectURL(file);

      setSelectedFile(file);
      setImage(URL.createObjectURL(file));
      setShowCanvas(true);
      setGeneratedImage(null);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const createMaskFromCanvas = () => {
    if (!canvasRef.current || !maskCanvasRef.current) return null;

    const displayCanvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");

    if (!maskCtx) return null;

    maskCanvas.width = 512;
    maskCanvas.height = 512;

    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.fillStyle = "white";

    const scaleX = 512 / displayCanvas.width;
    const scaleY = 512 / displayCanvas.height;

    if (drawMode === "draw") {
      const displayCtx = displayCanvas.getContext("2d");
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = 512;
      scaledCanvas.height = 512;
      const scaledCtx = scaledCanvas.getContext("2d");

      if (displayCtx && scaledCtx) {
        scaledCtx.scale(scaleX, scaleY);
        scaledCtx.drawImage(displayCanvas, 0, 0);
        maskCtx.drawImage(scaledCanvas, 0, 0);
      }
    } else if (selectionBox) {
      const scaledX = selectionBox.x * scaleX;
      const scaledY = selectionBox.y * scaleY;
      const scaledWidth = selectionBox.width * scaleX;
      const scaledHeight = selectionBox.height * scaleY;

      maskCtx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    }

    return maskCanvas;
  };

  const handleGenerate = async () => {
    if (!selectedFile || !prompt) return;

    setIsLoading(true);

    try {
      const maskCanvas = createMaskFromCanvas();
      if (!maskCanvas) throw new Error("Failed to create mask");

      const formData = new FormData();
      formData.append("image", selectedFile);

      const maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/png");
      });

      formData.append("mask", maskBlob, "mask.png");
      formData.append("prompt", prompt);

      const response = await fetch("http://localhost:8000/api/edit-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to generate image");

      const data = await response.json();
      setGeneratedImage(data.base64);
      clearCanvas();
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCanvas = () => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
    setSelectionBox(null);
    setDrawMode(null);
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!drawMode || !contextRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setShowPrompt(false);

    if (drawMode === "select") {
      setLastMouseX(x);
      setLastMouseY(y);
      setSelectionBox(null);
    } else if (drawMode === "draw") {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !drawMode || !contextRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMouseX(x);
    setMouseY(y);

    if (drawMode === "select") {
      const width = Math.abs(x - lastMouseX);
      const height = Math.abs(y - lastMouseY);
      const selX = x < lastMouseX ? x : lastMouseX;
      const selY = y < lastMouseY ? y : lastMouseY;

      setSelectionBox({
        x: selX,
        y: selY,
        width: width,
        height: height,
      });
    } else if (drawMode === "draw") {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
      contextRef.current.lineWidth = 60;
      contextRef.current.lineCap = "round";
      contextRef.current.lineJoin = "round";
      contextRef.current.strokeStyle = "RGBA(255, 255, 255, 0.2)";
    }
  };

  const calculateDisplaySize = () => {
    return { width: 512, height: 512 };
  };

  const stopDrawing = () => {
    if (!drawMode || !contextRef.current) return;

    if (drawMode === "draw") {
      contextRef.current.closePath();
    }

    setIsDrawing(false);
    setShowPrompt(true);
  };

  useEffect(() => {
    if (showCanvas && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = imageDisplaySize.width;
      canvas.height = imageDisplaySize.height;

      const context = canvas.getContext("2d");
      if (context) {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "white";
        context.lineWidth = 2;
        contextRef.current = context;
      }
    }
  }, [showCanvas, imageDisplaySize]);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.style.cursor =
      drawMode === "select" ? "crosshair" : "default";
  }, [drawMode]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[89vh] bg-black">
      <div
        ref={containerRef}
        className="w-full max-w-3xl aspect-[4/3] relative"
      >
        {!showCanvas ? (
          <div className= "w-full h-full rounded-lg flex flex-col items-center justify-center gap-4 ">
            <UploadCard onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-[512px] h-[512px]">
              <img
                ref={imageRef}
                src={generatedImage || image || ""}
                alt="Uploaded"
                className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-all duration-700 ${
                  isLoading
                    ? "blur-xl opacity-50 scale-105"
                    : "blur-0 opacity-100 scale-100"
                }`}
              />

              {generatedImage && (
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = generatedImage;
                    link.download = "generated-image.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="absolute right-2 top-2 flex items-center gap-2 p-3 bg-black/40 backdrop-blur-xl rounded-lg z-10"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain rounded-xl border border-white/20"
                width={512}
                height={512}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />

              <canvas
                ref={maskCanvasRef}
                className="hidden"
                width={512}
                height={512}
              />

              {/* Floating Controls */}
              <div className="absolute right-10 -bottom-16 flex items-center gap-2 animate-fade-in">
                <div className="flex items-center gap-2 p-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/20">
                  <button
                    onClick={() =>
                      setDrawMode((mode) =>
                        mode === "select" ? null : "select"
                      )
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      drawMode === "select"
                        ? "bg-white text-black"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-sm font-medium">Select</span>
                  </button>

                  <button
                    onClick={() =>
                      setDrawMode((mode) => (mode === "draw" ? null : "draw"))
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      drawMode === "draw"
                        ? "bg-white text-black"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="text-sm font-medium">Draw</span>
                  </button>

                  {/* Add Replace Image button */}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="replace-image"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      document.getElementById("replace-image")?.click()
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Replace</span>
                  </button>

                  <button
                    onClick={clearCanvas}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <RefreshCcw className="w-4 h-4 transition-transform hover:rotate-180 duration-500" />
                    <span className="text-sm font-medium">Reset</span>
                  </button>
                </div>
              </div>
              
              {/* Selection Box */}
              {selectionBox && (
                <div
                  className="absolute border-2 border-white/20 bg-white/10 pointer-events-none cursor-crosshair rounded-lg"
                  style={{
                    left: selectionBox.x,
                    top: selectionBox.y,
                    width: selectionBox.width,
                    height: selectionBox.height,
                  }}
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md px-4 py-2 rounded-full text-xs text-white/90">
                    {Math.round(selectionBox.width)} ×{" "}
                    {Math.round(selectionBox.height)}
                  </div>
                </div>
              )}

              {/* Prompt Input */}
              {(drawMode || selectionBox) && showPrompt && (
                <div className="absolute inset-x-8 bottom-6 transition-all duration-500 ease-out">
                  <div className="relative w-full">
                    <div className="flex items-stretch bg-black/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20">
                      <div className="flex-grow p-4">
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Draw a region on your canvas and describe what you want to see in this area..."
                          className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-neutral-400 min-h-[60px] resize-none"
                          rows={2}
                        />
                      </div>
                      <button
                        className={`
                          group flex items-center gap-2 px-6 bg-white/10 hover:bg-white/20 transition-colors duration-300
                          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                        onClick={handleGenerate}
                        disabled={isLoading}
                      >
                        <Sparkles className="w-4 h-4 text-white/70 group-hover:text-white transition-colors duration-300" />
                        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors duration-300">
                          {isLoading ? "Generate" : "Generate"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
