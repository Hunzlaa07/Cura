import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Lightbulb } from 'lucide-react';

export default function CaseStudyLoadingScreen({ isLoading, progress = 0, message = '' }) {
  const [dotCount, setDotCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const phases = [
    { label: 'Analyzing job requirements', icon: '📋' },
    { label: 'Generating case scenarios', icon: '🎯' },
    { label: 'Creating questions', icon: '❓' },
    { label: 'Finalizing content', icon: '✨' }
  ];

  // Initialize timer when loading starts
  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
      setCurrentPhase(0);
    }
  }, [isLoading, startTime]);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Progress phases based on elapsed time
  useEffect(() => {
    if (!isLoading || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const phaseTime = 8000; // 8 seconds per phase
      const newPhase = Math.min(Math.floor(elapsed / phaseTime), phases.length - 1);
      setCurrentPhase(newPhase);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, startTime, phases.length]);

  const dots = '.'.repeat(dotCount);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md mx-auto">
        {/* Animated Header */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            {/* Outer rotating circle */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#C8F55A] border-r-[#C8F55A]"
              style={{
                animation: 'spin 2s linear infinite'
              }}
            />
            {/* Middle rotating circle - opposite direction */}
            <div 
              className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#75A400] border-l-[#75A400]"
              style={{
                animation: 'spin 3s linear reverse infinite'
              }}
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#75A400]" style={{
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            </div>
          </div>
        </div>

        {/* Main text */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Generating Case Studies
        </h2>
        
        {/* Animated dots */}
        <p className="text-center text-gray-600 mb-8 min-h-6">
          <span>{phases[currentPhase].icon}</span>
          {' '}
          <span className="font-semibold">{phases[currentPhase].label}</span>
          <span className="inline-block w-8">{dots}</span>
        </p>

        {/* Progress phases */}
        <div className="space-y-3 mb-8">
          {phases.map((phase, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                index <= currentPhase ? 'bg-[#C8F55A] w-6' : 'bg-gray-300'
              }`} />
              <span className={`text-sm transition-all duration-300 ${
                index <= currentPhase ? 'text-gray-900 font-medium' : 'text-gray-400'
              }`}>
                {phase.label}
              </span>
              {index < currentPhase && (
                <span className="text-[#75A400] font-bold ml-auto">✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#C8F55A] to-[#75A400] rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(currentPhase * 25 + 15, 95)}%`
            }}
          />
        </div>

        {/* Tips section */}
        <div className="bg-gradient-to-r from-lime-50 to-amber-50 rounded-lg p-4 border border-lime-200">
          <div className="flex gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              We're crafting unique, tailored case studies based on your job requirements. This usually takes 30-60 seconds.
            </p>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  );
}