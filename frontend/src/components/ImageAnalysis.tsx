"use client";

import { useState, useRef } from "react";

type AnalysisType = "caption" | "vqa" | "ocr";

interface AnalysisResult {
  type: AnalysisType;
  result: string;
  question?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ImageAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("caption");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const validateAnalysisInput = () => {
    if (!selectedFile) return "Please select an image first";
    if (analysisType === "vqa" && !question.trim()) return "Please enter a question for VQA";
    return null;
  };

  const buildAnalysisFormData = () => {
    const formData = new FormData();
    formData.append("file", selectedFile as File);

    if (analysisType === "vqa") {
      formData.append("question", question);
    }

    return formData;
  };

  const submitAnalysis = async (formData: FormData) => {
    const endpoint = `${API_URL}/api/analyze/${analysisType}`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Analysis failed");
    }

    return response.json();
  };

  const analyzeImage = async () => {
    const validationMessage = validateAnalysisInput();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = buildAnalysisFormData();
      const data = await submitAnalysis(formData);

      setResult({
        type: analysisType,
        result:
          analysisType === "caption"
            ? data.caption
            : analysisType === "vqa"
            ? data.answer
            : data.extracted_text,
        question: analysisType === "vqa" ? question : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setQuestion("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Type Selection */}
      <div className="glass-panel rounded-xl p-5 border-white/10">
        <h3 className="text-lg font-semibold mb-3 tracking-tight">Select analysis mode</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAnalysisType("caption")}
            className={`glass-button px-4 py-2 rounded-full text-sm ${
              analysisType === "caption"
                ? "border-white/40 bg-white/10"
                : "border-white/10 bg-transparent text-gray-300"
            }`}
          >
            Image captioning
          </button>
          <button
            onClick={() => setAnalysisType("vqa")}
            className={`glass-button px-4 py-2 rounded-full text-sm ${
              analysisType === "vqa"
                ? "border-white/40 bg-white/10"
                : "border-white/10 bg-transparent text-gray-300"
            }`}
          >
            Visual Q&A
          </button>
          <button
            onClick={() => setAnalysisType("ocr")}
            className={`glass-button px-4 py-2 rounded-full text-sm ${
              analysisType === "ocr"
                ? "border-white/40 bg-white/10"
                : "border-white/10 bg-transparent text-gray-300"
            }`}
          >
            OCR / text
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-3">
          {analysisType === "caption" && "Generate a detailed description of your image."}
          {analysisType === "vqa" && "Ask any question about your image and get an answer."}
          {analysisType === "ocr" && "Extract all visible text from your image."}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
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
                <p className="text-gray-500 text-sm">JPEG · PNG · GIF · WebP</p>
              </div>
            )}
          </div>

          {/* VQA Question Input */}
          {analysisType === "vqa" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Your question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What objects are in this image?"
                className="w-full px-4 py-3 rounded-lg glass-input text-white placeholder-gray-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={analyzeImage}
              disabled={!selectedFile || loading}
              className={`flex-1 py-3 rounded-lg font-semibold glass-button ${
                selectedFile && !loading
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
                  Analyzing...
                </span>
              ) : (
                "Analyze image"
              )}
            </button>
            {selectedFile && (
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
          <h3 className="text-lg font-semibold mb-4 tracking-tight">Analysis result</h3>
          {error && (
            <div className="border border-red-400/30 text-red-200 rounded-lg p-4 bg-red-500/10">
              {error}
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 border border-white/15 rounded-full text-xs uppercase tracking-[0.2em] text-gray-300 bg-white/5">
                {result.type === "caption" && "Caption"}
                {result.type === "vqa" && "Visual Q&A"}
                {result.type === "ocr" && "Extracted text"}
              </div>
              {result.question && (
                <div className="rounded-lg p-3 border border-white/10 bg-white/5">
                  <span className="text-gray-400 text-sm">Question</span>
                  <p className="text-white mt-1">{result.question}</p>
                </div>
              )}
              <div className="rounded-lg p-4 border border-white/10 bg-white/5">
                <span className="text-gray-400 text-sm block mb-2">
                  {result.type === "vqa" ? "Answer" : "Result"}
                </span>
                <p className="text-white whitespace-pre-wrap leading-relaxed">{result.result}</p>
              </div>
            </div>
          )}
          {!result && !error && (
            <div className="text-gray-500 text-center py-12">
              <p className="uppercase tracking-[0.3em] text-xs">Idle</p>
              <p className="mt-2 text-gray-300">Upload an image and run analysis to see output.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
