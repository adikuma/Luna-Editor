"use client"

import { useState, useRef } from "react";
import { X, Upload, Image, Film, FileText } from "lucide-react";

interface UploadCardProps {
  onFileSelect: (file: File) => void;
}

export default function UploadCard({ onFileSelect }: UploadCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleUpload = () => {
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => setFile(null);

  return (
    <div className="p-6">
      <div
        className={`
          relative rounded-3xl 
          bg-black/50 backdrop-blur-md
          transition-all duration-300 ease-in-out
          ${dragActive ? "border-white/20 bg-white/5" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept="image/*,video/*"
        />

        <div className="flex flex-col items-center justify-center p-4 text-center transition-all duration-300 ease-in-out">
          {!file ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/20 bg-white/5">
              <div className="relative h-36 w-36 group cursor-pointer">
                {/* Third card (back/right) */}
                <div className="absolute -right-3 top-1 transform rotate-12 bg-white backdrop-blur-xl rounded-lg p-1 border border-white/10 transition-all duration-300 ease-in-out group-hover:translate-x-4 group-hover:rotate-[24deg]">
                  <img
                    src="/images/sample-one.jpg"
                    alt="Sample 3"
                    className="w-20 h-24 object-cover rounded"
                  />
                </div>

                {/* Second card (left) */}
                <div className="absolute -left-3 top-1 transform -rotate-12 bg-white backdrop-blur-xl rounded-lg p-1 border border-white/10 transition-all duration-300 ease-in-out group-hover:-translate-x-4 group-hover:-rotate-[24deg]">
                  <img
                    src="/images/sample-two.jpg"
                    alt="Sample 2"
                    className="w-20 h-24 object-cover rounded"
                  />
                </div>

                {/* First card (center) */}
                <div className="absolute left-8 transform rotate-2 bg-white backdrop-blur-xl rounded-lg p-1 border border-white/10 transition-all duration-300 ease-in-out group-hover:-translate-y-4 shadow shadow-xl">
                  <img
                    src="/images/sample-three.jpg"
                    alt="Sample 1"
                    className="w-20 h-24 object-cover rounded"
                  />
                </div>
              </div>
              <p className="mb-3 text-xl text-white font-satoshi">
                Drag & drop files to edit
              </p>

              <div className="flex items-center gap-2 text-sm text-white/50 font-satoshi">
                <span>or</span>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  browse files
                </button>
                <span>on your computer</span>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md items-center justify-center">
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/20 mb-4 bg-white/5">
                <div className="relative h-36 w-36 group cursor-pointer">
                  {/* Third card (back/right) */}
                  <div className="absolute -right-3 top-1 transform rotate-12 bg-white backdrop-blur-xl rounded-lg p-1 border border-white/10 transition-all duration-300 ease-in-out group-hover:translate-x-4 group-hover:rotate-[24deg]">
                    <img
                      src="/images/sample-one.jpg"
                      alt="Sample 3"
                      className="w-20 h-24 object-cover rounded"
                    />
                  </div>

                  {/* Second card (left) */}
                  <div className="absolute -left-3 top-1 transform -rotate-12 bg-white backdrop-blur-xl rounded-lg p-1 border border-white/10 transition-all duration-300 ease-in-out group-hover:-translate-x-4 group-hover:-rotate-[24deg]">
                    <img
                      src="/images/sample-two.jpg"
                      alt="Sample 2"
                      className="w-20 h-24 object-cover rounded"
                    />
                  </div>

                  {/* First card (center) */}
                  <div className="absolute left-8 transform rotate-2 bg-white backdrop-blur-xl rounded-lg p-1 border border-white/10 transition-all duration-300 ease-in-out group-hover:-translate-y-4 shadow shadow-xl">
                    <img
                      src="/images/sample-three.jpg"
                      alt="Sample 1"
                      className="w-20 h-24 object-cover rounded"
                    />
                  </div>
                </div>
                <p className="mb-3 text-xl text-white font-satoshi">
                  Drag & drop files to edit
                </p>

                <div className="flex items-center gap-2 text-sm text-white/50 font-satoshi">
                  <span>or</span>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    browse files
                  </button>
                  <span>on your computer</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/20">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white font-medium truncate font-satoshi">
                      {file.name}
                    </p>
                    <p className="text-xs text-white/50 font-satoshi">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                      {file.type.split("/")[1].toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 max-w-full">
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors w-full rounded-lg"
                >
                  Upload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
