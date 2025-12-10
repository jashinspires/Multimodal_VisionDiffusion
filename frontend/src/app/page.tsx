"use client";

import { useState } from "react";
import ImageAnalysis from "@/components/ImageAnalysis";
import ImageGeneration from "@/components/ImageGeneration";

type Tab = "analysis" | "generation";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  return (
    <div className="relative min-h-screen text-gray-100">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/4 via-white/0 to-white/6" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm flex items-center justify-center text-xs tracking-[0.2em]">
                VD
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">VisionDiffusion</h1>
                <p className="text-sm text-gray-400">Image Analysis & Generation</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-xs uppercase tracking-[0.2em] text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Image Intelligence Suite
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`glass-button px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === "analysis"
                  ? "border-white/40 bg-white/10"
                  : "border-white/10 bg-white/0 text-gray-300"
              }`}
            >
              Image Analysis
            </button>
            <button
              onClick={() => setActiveTab("generation")}
              className={`glass-button px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === "generation"
                  ? "border-white/40 bg-white/10"
                  : "border-white/10 bg-white/0 text-gray-300"
              }`}
            >
              Image Generation
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="glass-panel rounded-2xl p-6 md:p-8 border-white/10">
          {activeTab === "analysis" ? <ImageAnalysis /> : <ImageGeneration />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 text-center text-gray-500 text-sm">
          VisionDiffusion © 2025
        </div>
      </footer>
    </div>
  );
}
