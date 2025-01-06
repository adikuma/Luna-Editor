"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/text2img", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to generate image");

      const data = await response.json();
      setGeneratedImage(data.url);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4 py-10">
      {/* Image Container */}
      <div className="w-[512px] h-[512px] rounded-2xl mb-8 relative overflow-hidden border border-white/20">
        {generatedImage ? (
          <img
            src={generatedImage}
            alt="Generated"
            className={`w-full h-full object-cover rounded-2xl transition-all duration-700 ${
              isLoading
                ? "blur-xl opacity-50 scale-105"
                : "blur-0 opacity-100 scale-100"
            }`}
          />
        ) : (
          <div className="w-full h-full rounded-2xl  bg-white/5 backdrop-blur-sm flex items-center justify-center p-8">
            <p className="text-white/30 text-center text-sm font-light">
              Create stunning images with AI
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
            <Sparkles className="w-6 h-6 text-white/70 animate-pulse" />
            <div className="text-white/70 text-sm">Generating your image</div>
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <div className="absolute bottom-36 transition-all duration-500 ease-out max-w-lg w-full">
        <div className="relative w-full">
          <div className="flex items-stretch bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20">
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
    </div>
  );
}
