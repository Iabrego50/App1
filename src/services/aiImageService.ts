import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

interface AiImageConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
}

interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
}

interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  localPath?: string;
  error?: string;
}

class AiImageService {
  private config: AiImageConfig;

  constructor() {
    this.config = {
      apiKey: process.env.DEZGO_API_KEY,
      baseUrl: 'https://api.dezgo.com',
      model: 'flux_schnell' // Fast, good quality model
    };
  }

  // Generate research-focused prompts for academic/professional thumbnails
  private generateResearchPrompt(projectTitle: string, description?: string): string {
    const researchKeywords = this.extractResearchKeywords(projectTitle, description);
    
    // Create a professional, academic-style prompt
    const basePrompt = `Professional academic research illustration, ${projectTitle.toLowerCase()}`;
    
    let enhancedPrompt = basePrompt;
    
    // Add specific research context
    if (researchKeywords.length > 0) {
      enhancedPrompt += `, focusing on ${researchKeywords.slice(0, 3).join(', ')}`;
    }
    
    // Add visual style modifiers for research/academic content
    enhancedPrompt += ', clean scientific diagram style, modern minimalist design, subtle blue and white color scheme, high quality, professional, educational, informative, clear typography, research poster aesthetic, academic presentation quality, 4k, detailed illustration';
    
    return enhancedPrompt;
  }

  // Extract relevant keywords from project title and description
  private extractResearchKeywords(title: string, description?: string): string[] {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    // Common research and academic terms
    const researchTerms = [
      'analysis', 'study', 'research', 'data', 'experiment', 'methodology', 'findings',
      'algorithm', 'model', 'system', 'framework', 'approach', 'solution', 'optimization',
      'machine learning', 'artificial intelligence', 'deep learning', 'neural network',
      'statistics', 'probability', 'mathematics', 'engineering', 'science', 'technology',
      'biological', 'medical', 'clinical', 'pharmaceutical', 'chemical', 'physical',
      'environmental', 'sustainable', 'renewable', 'energy', 'climate', 'economics',
      'social', 'psychological', 'behavioral', 'cognitive', 'neuroscience', 'genomics',
      'quantum', 'computational', 'simulation', 'modeling', 'visualization', 'database'
    ];
    
    const foundTerms = researchTerms.filter(term => text.includes(term));
    
    // Also extract potential subject-specific words (longer than 4 characters, not common words)
    const words = text.split(/\s+/);
    const specificTerms = words.filter(word => 
      word.length > 4 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'may', 'she', 'use', 'your', 'they', 'have', 'this', 'that', 'with', 'will', 'would', 'could', 'should', 'about', 'after', 'before', 'other', 'through', 'where', 'while', 'during'].includes(word)
    );
    
    return [...foundTerms, ...specificTerms.slice(0, 3)];
  }

  // Generate negative prompt to avoid unwanted elements
  private generateNegativePrompt(): string {
    return 'blurry, low quality, distorted, cartoonish, childish, unprofessional, messy, cluttered, dark, gloomy, scary, violent, inappropriate, text, watermark, logo, signature, amateur, poor lighting, bad composition';
  }

  // Main method to generate AI image
  async generateProjectThumbnail(
    projectTitle: string, 
    description?: string, 
    customPrompt?: string
  ): Promise<ImageGenerationResponse> {
    try {
      const prompt = customPrompt || this.generateResearchPrompt(projectTitle, description);
      const negativePrompt = this.generateNegativePrompt();
      
      console.log('Generating AI image with prompt:', prompt);

      const response = await this.callDezgoApi({
        prompt,
        negativePrompt,
        width: 1024,
        height: 1024,
        steps: 20,
        guidance: 7.5
      });

      return response;
    } catch (error: any) {
      console.error('Error generating AI image:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate AI image'
      };
    }
  }

  // Call Dezgo API
  private async callDezgoApi(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    formData.append('negative_prompt', request.negativePrompt || '');
    formData.append('width', request.width?.toString() || '1024');
    formData.append('height', request.height?.toString() || '1024');
    formData.append('steps', request.steps?.toString() || '20');
    formData.append('guidance', request.guidance?.toString() || '7.5');
    formData.append('model', this.config.model);
    formData.append('format', 'png');

    // Add API key if provided
    if (this.config.apiKey) {
      formData.append('api_key', this.config.apiKey);
    }

    const response = await fetch(`${this.config.baseUrl}/text2image`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dezgo API error: ${response.status} - ${errorText}`);
    }

    // Save the image locally
    const imageBuffer = await response.buffer();
    const filename = `ai-generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    const uploadsDir = path.join(__dirname, '../../uploads/images');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const localPath = path.join(uploadsDir, filename);
    fs.writeFileSync(localPath, imageBuffer);

    const imageUrl = `/uploads/images/${filename}`;

    return {
      success: true,
      imageUrl,
      localPath
    };
  }

  // Test method with fallback to placeholder
  async generateOrFallback(
    projectTitle: string, 
    description?: string, 
    customPrompt?: string
  ): Promise<ImageGenerationResponse> {
    try {
      // Try AI generation first
      const result = await this.generateProjectThumbnail(projectTitle, description, customPrompt);
      
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn('AI generation failed, using fallback:', error);
    }

    // Fallback to generating a simple colored placeholder
    return this.generatePlaceholderImage(projectTitle);
  }

  // Generate a simple placeholder image as fallback
  private async generatePlaceholderImage(title: string): Promise<ImageGenerationResponse> {
    try {
      const filename = `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const uploadsDir = path.join(__dirname, '../../uploads/images');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Create a canvas for the placeholder image
      const canvas = createCanvas(1024, 1024);
      const ctx = canvas.getContext('2d');
      
      // Generate colors based on title hash
      const colors = this.generateColorsFromTitle(title);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(0.5, colors.secondary);
      gradient.addColorStop(1, colors.tertiary);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);
      
      // Add subtle pattern overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 100 + 50;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add title text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Word wrap for long titles
      const words = title.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 800 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      
      // Draw text lines
      const lineHeight = 80;
      const startY = 512 - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, 512, startY + index * lineHeight);
      });
      
      // Add "AI Generated" watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '24px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('AI Generated Placeholder', 1000, 1000);
      
      // Save the canvas as PNG
      const buffer = canvas.toBuffer('image/png');
      const localPath = path.join(uploadsDir, filename);
      fs.writeFileSync(localPath, buffer);
      
      const imageUrl = `/uploads/images/${filename}`;
      
      console.log('Generated placeholder image:', imageUrl);
      
      return {
        success: true,
        imageUrl,
        localPath
      };
    } catch (error: any) {
      console.error('Failed to generate placeholder image:', error);
      return {
        success: false,
        error: 'Failed to generate placeholder image: ' + error.message
      };
    }
  }
  
  // Generate colors based on title hash for consistent colors
  private generateColorsFromTitle(title: string): { primary: string; secondary: string; tertiary: string } {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      const char = title.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate research-appropriate colors (blues, purples, teals)
    const hue1 = Math.abs(hash % 60) + 200; // Blues to purples (200-260)
    const hue2 = (hue1 + 30) % 360;
    const hue3 = (hue1 + 60) % 360;
    
    return {
      primary: `hsl(${hue1}, 70%, 60%)`,
      secondary: `hsl(${hue2}, 65%, 55%)`,
      tertiary: `hsl(${hue3}, 60%, 50%)`
    };
  }
}

export const aiImageService = new AiImageService();
export default aiImageService; 