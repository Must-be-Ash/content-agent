'use client';

import { useState, useEffect } from 'react';

interface VideoJob {
  id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  model: string;
  prompt: string;
  seconds: string;
  size: string;
  created_at: number;
  error?: {
    message: string;
  };
}

export default function SoraPage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'sora-2' | 'sora-2-pro'>('sora-2-pro');
  const [seconds, setSeconds] = useState('10'); // Default for sora-2-pro
  const [size, setSize] = useState('1280x720');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Duration options based on model
  const durationOptions = {
    'sora-2': ['4', '8', '12'],
    'sora-2-pro': ['10', '15', '25'],
  };

  // Handle model change - reset duration if invalid for new model
  const handleModelChange = (newModel: 'sora-2' | 'sora-2-pro') => {
    setModel(newModel);
    const validDurations = durationOptions[newModel];
    if (!validDurations.includes(seconds)) {
      // Reset to default duration for the model
      setSeconds(newModel === 'sora-2' ? '8' : '10');
    }
  };

  // Poll for video status
  useEffect(() => {
    if (!videoJob || videoJob.status === 'completed' || videoJob.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sora/status/${videoJob.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch status');
          setIsGenerating(false);
          clearInterval(pollInterval);
          return;
        }

        setVideoJob(data);

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          setIsGenerating(false);
          // Set video URL for preview
          setVideoUrl(`/api/sora/download/${data.id}`);
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError(data.error?.message || 'Video generation failed');
        }
      } catch (err) {
        console.error('Error polling status:', err);
        setError('Failed to check video status');
        clearInterval(pollInterval);
        setIsGenerating(false);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [videoJob]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVideoJob(null);
    setVideoUrl(null);

    try {
      const response = await fetch('/api/sora/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          seconds,
          size,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create video');
        setIsGenerating(false);
        return;
      }

      setVideoJob(data);
    } catch (err) {
      console.error('Error creating video:', err);
      setError('Failed to create video');
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (videoJob?.id) {
      window.open(`/api/sora/download/${videoJob.id}`, '_blank');
    }
  };

  const getStatusText = () => {
    if (!videoJob) return '';
    switch (videoJob.status) {
      case 'queued':
        return 'Queued...';
      case 'in_progress':
        return `Processing... ${videoJob.progress || 0}%`;
      case 'completed':
        return 'Completed!';
      case 'failed':
        return 'Failed';
      default:
        return videoJob.status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Sora Video Generator</h1>
          <p className="text-gray-600 mb-8">Create videos using OpenAI's Sora models</p>

          {/* Form */}
          <div className="space-y-6">
            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                disabled={isGenerating}
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => handleModelChange(e.target.value as 'sora-2' | 'sora-2-pro')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                <option value="sora-2">Sora 2 (Fast - 4/8/12s)</option>
                <option value="sora-2-pro">Sora 2 Pro (High Quality - 10/15/25s)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                {durationOptions[model].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} seconds
                  </option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                <option value="1280x720">1280x720 (HD)</option>
                <option value="1024x1024">1024x1024 (Square)</option>
                <option value="1920x1080">1920x1080 (Full HD)</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Video'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Status Display */}
          {videoJob && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-800 font-medium">{getStatusText()}</p>
                {videoJob.status === 'in_progress' && (
                  <span className="text-blue-600 text-sm">{videoJob.progress || 0}%</span>
                )}
              </div>

              {/* Progress Bar */}
              {videoJob.status === 'in_progress' && (
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${videoJob.progress || 0}%` }}
                  />
                </div>
              )}

              {/* Video Info */}
              <div className="mt-3 text-sm text-blue-700 space-y-1">
                <p><span className="font-medium">Model:</span> {videoJob.model}</p>
                <p><span className="font-medium">Duration:</span> {videoJob.seconds}s</p>
                <p><span className="font-medium">Resolution:</span> {videoJob.size}</p>
              </div>
            </div>
          )}

          {/* Video Player and Download */}
          {videoJob?.status === 'completed' && videoUrl && (
            <div className="mt-6 space-y-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <video
                  src={videoUrl}
                  controls
                  className="w-full"
                  autoPlay
                  loop
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Download Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
