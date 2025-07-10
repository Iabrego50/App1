import React, { useState } from 'react';
import { Sparkles, Download, RefreshCw, Image as ImageIcon, Wand2, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GeneratedImage {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

const AiImageGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState('');

  // Sample research prompts for inspiration
  const samplePrompts = [
    'Machine learning neural network visualization',
    'DNA sequencing laboratory research',
    'Climate change data analysis',
    'Quantum computing circuit diagram', 
    'Medical brain scan analysis',
    'Solar energy panel technology',
    'Artificial intelligence robotics',
    'Microscopic cell biology study'
  ];

  const generateImage = async () => {
    if (!projectTitle.trim() && !prompt.trim()) {
      setError('Please enter either a project title or custom prompt');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // Always use the thumbnail endpoint, but with different parameters
      const endpoint = '/api/ai/generate-thumbnail';
      const body = useCustomPrompt 
        ? { 
            title: prompt.trim(),
            description: '',
            customPrompt: prompt.trim()
          }
        : { 
            title: projectTitle.trim(), 
            description: projectDescription.trim(),
            customPrompt: prompt.trim() || undefined
          };

      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        const fullImageUrl = `http://localhost:5000${data.imageUrl}`;
        console.log('=== AI Image Generated ===');
        console.log('Raw imageUrl from API:', data.imageUrl);
        console.log('Full imageUrl constructed:', fullImageUrl);
        
        const newImage: GeneratedImage = {
          imageUrl: fullImageUrl,
          prompt: useCustomPrompt ? prompt : `Research: ${projectTitle}`,
          timestamp: Date.now()
        };
        
        console.log('New image object:', newImage);
        setGeneratedImages(prev => [newImage, ...prev]);
        
        // Clear inputs after successful generation
        if (!useCustomPrompt) {
          setProjectTitle('');
          setProjectDescription('');
        }
        setPrompt('');
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      setError('Network error. Make sure the server is running.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-yellow-400 mr-2" />
            <h1 className="text-4xl font-bold text-white">AI Image Generator</h1>
            <Wand2 className="h-8 w-8 text-purple-400 ml-2" />
          </div>
          <p className="text-gray-300 text-lg">
            Generate stunning research-focused thumbnails and custom images with AI
          </p>
          <button 
            onClick={() => navigate('/projects')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Projects
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Palette className="h-6 w-6 mr-2 text-pink-400" />
              Create Your Image
            </h2>

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setUseCustomPrompt(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !useCustomPrompt 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Research Project Mode
                </button>
                <button
                  onClick={() => setUseCustomPrompt(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    useCustomPrompt 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Custom Prompt Mode
                </button>
              </div>
            </div>

            {/* Input Fields */}
            {!useCustomPrompt ? (
              <>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g., Machine Learning in Healthcare"
                    className="w-full px-4 py-3 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Project Description (Optional)
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Brief description of your research project..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-white text-sm font-medium mb-2">
                    Custom Style (Optional)
                  </label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., futuristic, minimalist, colorful..."
                    className="w-full px-4 py-3 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">
                  Custom Prompt *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                />
                
                {/* Sample Prompts */}
                <div className="mt-4">
                  <p className="text-gray-300 text-sm mb-2">Try these research-focused prompts:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {samplePrompts.slice(0, 4).map((sample, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(sample)}
                        className="text-left p-2 bg-black/20 rounded text-sm text-gray-300 hover:bg-black/40 transition-colors"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateImage}
              disabled={generating}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate AI Image
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Debug: Test image serving */}
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-xs">
              <p className="font-medium mb-2">Debug Info:</p>
              <p>Images generated: {generatedImages.length}</p>
              {generatedImages.length > 0 && (
                <>
                  <p>Latest image URL: {generatedImages[0].imageUrl}</p>
                  <button 
                    onClick={() => window.open(generatedImages[0].imageUrl, '_blank')}
                    className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Test Latest Image URL
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <ImageIcon className="h-6 w-6 mr-2 text-green-400" />
              Generated Images
            </h2>

            {generatedImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No images generated yet</p>
                <p className="text-gray-500 text-sm mt-2">Create your first AI image above!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {generatedImages.map((image, index) => (
                  <div key={index} className="bg-black/30 rounded-lg p-4 border border-gray-600">
                    <div className="w-full h-48 rounded-lg mb-3 relative">
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full h-full object-cover rounded-lg z-10 relative"
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', image.imageUrl);
                          e.currentTarget.style.display = 'block';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'none';
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', image.imageUrl);
                          console.error('Error event:', e);
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        style={{ display: 'block' }}
                      />
                      {/* Fallback if image fails to load */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p className="font-medium">{image.prompt}</p>
                          <p className="text-xs mt-1 opacity-75">Image failed to load</p>
                          <p className="text-xs mt-1 opacity-50 text-center break-all">{image.imageUrl}</p>
                          <button 
                            onClick={() => window.open(image.imageUrl, '_blank')}
                            className="mt-2 px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                          >
                            Open Direct Link
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-white text-sm font-medium mb-2">{image.prompt}</p>
                    <p className="text-gray-400 text-xs mb-3">
                      Generated: {new Date(image.timestamp).toLocaleString()}
                    </p>
                    <button
                      onClick={() => downloadImage(image.imageUrl, image.prompt)}
                      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Image
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiImageGenerator; 