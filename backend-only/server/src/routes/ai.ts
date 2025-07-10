import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { aiImageService } from '../services/aiImageService';
import path from 'path';
import fs from 'fs';

const router = Router();

// Mock AI service - in production, this would connect to OpenAI or similar
const generateProjectSummary = async (projectData: {
  title: string;
  description?: string;
  media?: Array<{
    filename: string;
    type: string;
  }>;
}): Promise<string> => {
  // This is a mock implementation - replace with actual AI service
  const { title, description, media } = projectData;
  
  let summary = `🔬 ${title}`;
  
  // Extract key insights from description
  if (description && description.length > 0) {
    const words = description.toLowerCase().split(/\s+/);
    const keyTerms = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'from', 'they', 'were', 'been', 'have', 'will', 'would', 'could', 'should'].includes(word)
    );
    
    if (keyTerms.length > 0) {
      const topTerms = keyTerms.slice(0, 3).join(', ');
      summary += ` | Key focus: ${topTerms}`;
    }
    
    // Add brief insight
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      const insight = sentences[0].trim().substring(0, 60) + '...';
      summary += ` | ${insight}`;
    }
  }
  
  // Add media summary
  if (media && media.length > 0) {
    const mediaTypes = media.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mediaDescriptions = Object.entries(mediaTypes).map(([type, count]) => {
      const icon = type === 'image' ? '📊' : type === 'video' ? '🎥' : '📋';
      return `${icon}${count}`;
    });
    
    summary += ` | Resources: ${mediaDescriptions.join(' ')}`;
  }
  
  // Add research insights
  const insights = [
    '💡 Novel approach to existing problem',
    '🔍 Comprehensive data analysis',
    '📈 Significant findings documented',
    '🎯 Practical applications identified',
    '🔬 Experimental validation completed'
  ];
  
  const randomInsight = insights[Math.floor(Math.random() * insights.length)];
  summary += ` | ${randomInsight}`;
  
  // Ensure summary isn't too long
  if (summary.length > 140) {
    summary = summary.substring(0, 137) + '...';
  }
  
  return summary;
};

// Generate AI summary for a project
router.post('/generate-summary', authenticateToken, async (req, res) => {
  try {
    const { title, description, media } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    
    const summary = await generateProjectSummary({
      title,
      description,
      media
    });
    
    res.json({ summary });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ error: 'Failed to generate AI summary' });
  }
});

// Generate AI thumbnail image for a project
router.post('/generate-thumbnail', authenticateToken, async (req, res) => {
  try {
    const { title, description, customPrompt } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    
    console.log('=== AI Thumbnail Generation Request ===');
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Custom Prompt:', customPrompt);
    
    const result = await aiImageService.generateOrFallback(title, description, customPrompt);
    
    console.log('=== AI Thumbnail Generation Result ===');
    console.log('Success:', result.success);
    console.log('Image URL:', result.imageUrl);
    console.log('Local Path:', result.localPath);
    console.log('Error:', result.error);
    
    if (result.success) {
      res.json({ 
        success: true,
        imageUrl: result.imageUrl,
        message: 'AI thumbnail generated successfully'
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: result.error || 'Failed to generate AI thumbnail'
      });
    }
  } catch (error: any) {
    console.error('Error generating AI thumbnail:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate AI thumbnail' 
    });
  }
});

// Test AI image generation (no auth required for testing)
router.post('/test-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for testing' });
    }
    
    console.log('=== AI Test Image Generation Request ===');
    console.log('Prompt:', prompt);
    
    // Use the prompt as the title for better image generation
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    const result = await aiImageService.generateOrFallback(title, undefined, prompt);
    
    console.log('=== AI Test Image Generation Result ===');
    console.log('Success:', result.success);
    console.log('Image URL:', result.imageUrl);
    console.log('Local Path:', result.localPath);
    console.log('Error:', result.error);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error in test image generation:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to test AI image generation'
    });
  }
});

// Test thumbnail generation without auth (for debugging)
router.post('/test-thumbnail', async (req, res) => {
  try {
    const { title, description, customPrompt } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required for testing' });
    }
    
    console.log('=== AI Test Thumbnail Generation Request ===');
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Custom Prompt:', customPrompt);
    
    const result = await aiImageService.generateOrFallback(title, description, customPrompt);
    
    console.log('=== AI Test Thumbnail Generation Result ===');
    console.log('Success:', result.success);
    console.log('Image URL:', result.imageUrl);
    console.log('Local Path:', result.localPath);
    console.log('Error:', result.error);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error in test thumbnail generation:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to test thumbnail generation'
    });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/images');
    const uploadsExists = fs.existsSync(uploadsDir);
    
    if (!uploadsExists) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Test placeholder generation
    const testResult = await aiImageService.generateOrFallback('Test Health Check');
    
    res.json({
      status: 'OK',
      uploadsDirectory: uploadsDir,
      uploadsExists: fs.existsSync(uploadsDir),
      testGeneration: {
        success: testResult.success,
        imageUrl: testResult.imageUrl,
        error: testResult.error
      },
      message: 'AI service is running'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      message: 'AI service health check failed'
    });
  }
});

export default router; 