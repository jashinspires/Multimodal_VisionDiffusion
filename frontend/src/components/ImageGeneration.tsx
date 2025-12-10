"use client";

import { useState, useRef } from "react";

type GenerationType = "text-to-image" | "variation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ImageGeneration() {
  const [generationType, setGenerationType] = useState<GenerationType>("text-to-image");
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const validateGenerationInput = () => {
    if (generationType === "text-to-image" && !prompt.trim()) {
      return "Please enter a prompt for image generation";
    }

    if (generationType === "variation" && !selectedFile) {
      return "Please select an image for variation";
    }

    return null;
  };

  const buildGenerationFormData = () => {
    const formData = new FormData();

    if (generationType === "text-to-image") {
      formData.append("prompt", prompt);
    } else {
      formData.append("file", selectedFile as File);
    }

    return formData;
  };

  const submitGeneration = async (formData: FormData) => {
    const endpoint = `${API_URL}/api/generate/${generationType}`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Generation failed");
    }

    return response.json();
  };

  const generateImage = async () => {
    const validationMessage = validateGenerationInput();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const formData = buildGenerationFormData();
      const data = await submitGeneration(formData);
      setGeneratedImage(
        generationType === "text-to-image" ? data.image_url : data.variation_url
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setPrompt("");
    setSelectedFile(null);
    setPreview(null);
    setGeneratedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const examplePrompts = [
    "A serene Japanese garden with cherry blossoms and a koi pond at sunset",
    "A futuristic city with flying cars and neon lights at night",
    "A cozy cabin in the mountains covered in snow with northern lights",
    "An underwater kingdom with colorful coral reefs and mermaids",
    "A steampunk robot having tea in a Victorian parlor",
  ];

  return (
    <div className="space-y-6">
      {/* Generation Type Selection */}
      <div className="glass-panel rounded-xl p-5 border-white/10">
        <h3 className="text-lg font-semibold mb-3 tracking-tight">Select generation mode</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setGenerationType("text-to-image");
              setSelectedFile(null);
              setPreview(null);
            }}
            className={`glass-button px-4 py-2 rounded-full text-sm ${
              generationType === "text-to-image"
                ? "border-white/40 bg-white/10"
                : "border-white/10 bg-transparent text-gray-300"
            }`}
          >
            Text to image
          </button>
          <button
            onClick={() => {
              setGenerationType("variation");
              setPrompt("");
            }}
            className={`glass-button px-4 py-2 rounded-full text-sm ${
              generationType === "variation"
                ? "border-white/40 bg-white/10"
                : "border-white/10 bg-transparent text-gray-300"
            }`}
          >
            Image variation
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-3">
          {generationType === "text-to-image" && "Create a new image from your description."}
          {generationType === "variation" && "Upload an image and craft a minimal remix."}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {generationType === "text-to-image" ? (
            <>
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Describe your image
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A beautiful sunset over mountains with a lake reflection..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg glass-input text-white placeholder-gray-500 resize-none"
                />
              </div>

              {/* Example Prompts */}
              <div className="space-y-2">
                <span className="text-sm text-gray-400">Try an example:</span>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      className="text-xs px-3 py-1.5 rounded-full glass-button border-white/10 bg-transparent text-gray-200 transition-all truncate max-w-[200px]"
                      title={example}
                    >
                      {example.substring(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Image Upload for Variation */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`rounded-xl p-8 text-center cursor-pointer transition-all glass-panel border-dashed ${
                preview
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-2xl border border-white/10"
                  />
                  <p className="text-sm text-gray-400">{selectedFile?.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Upload</p>
                  <p className="text-gray-200 text-lg">Drop an image or click to browse</p>
                  <p className="text-gray-500 text-sm">
                    Upload an image to generate a variation
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={generateImage}
              disabled={
                loading ||
                (generationType === "text-to-image" ? !prompt.trim() : !selectedFile)
              }
              className={`flex-1 py-3 rounded-lg font-semibold glass-button ${
                !loading &&
                (generationType === "text-to-image" ? prompt.trim() : selectedFile)
                  ? "border-white/30"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating... (may take 15-30s)
                </span>
              ) : (
                "Generate image"
              )}
            </button>
            {(prompt || selectedFile || generatedImage) && (
              <button
                onClick={clearAll}
                className="px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:border-white/30 transition-all"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Result Section - Full Width Below */}
        <div className="glass-panel rounded-xl p-6 border-white/10 w-full">
          <h3 className="text-lg font-semibold mb-4 tracking-tight">Generated image</h3>
          {error && (
            <div className="border border-red-400/30 text-red-200 rounded-lg p-4 bg-red-500/10">
              {error}
            </div>
          )}
          {generatedImage && (
            <div className="space-y-4">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-lg shadow-2xl border border-white/10"
              />
              <a
                href={generatedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg glass-button border-white/20 text-sm"
              >
                Open full size
              </a>
            </div>
          )}
          {!generatedImage && !error && (
            <div className="text-gray-500 text-center py-12">
              <p className="uppercase tracking-[0.3em] text-xs">Idle</p>
              <p className="mt-2 text-gray-300">
                {generationType === "text-to-image"
                  ? "Enter a prompt and generate to see the output."
                  : "Upload an image and generate to craft a variation."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
