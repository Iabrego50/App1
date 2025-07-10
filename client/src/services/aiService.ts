const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface AIServiceResponse {
  summary: string;
  success: boolean;
  error?: string;
}

class AIService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async generateProjectSummary(projectData: {
    title: string;
    description?: string;
    media?: Array<{
      filename: string;
      type: string;
    }>;
  }): Promise<AIServiceResponse> {
    try {
      const response = await this.makeRequest('/api/ai/generate-summary', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      return {
        summary: data.summary,
        success: true,
      };
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      
      // Fallback to client-side generation if server fails
      return this.generateFallbackSummary(projectData);
    }
  }

  private generateFallbackSummary(projectData: {
    title: string;
    description?: string;
    media?: Array<{
      filename: string;
      type: string;
    }>;
  }): AIServiceResponse {
    try {
      const { title, description, media } = projectData;
      
      let summary = `📋 ${title}`;
      
      if (description && description.length > 0) {
        // Extract key points from description
        const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const keyPoints = sentences.slice(0, 2).join('. ');
        if (keyPoints) {
          summary += ` - ${keyPoints}`;
        }
      }
      
      if (media && media.length > 0) {
        const mediaTypes = media.reduce((acc, file) => {
          acc[file.type] = (acc[file.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mediaDescriptions = Object.entries(mediaTypes).map(([type, count]) => {
          const icon = type === 'image' ? '🖼️' : type === 'video' ? '🎥' : '📄';
          return `${icon} ${count} ${type}${count > 1 ? 's' : ''}`;
        });
        
        summary += ` | Contains: ${mediaDescriptions.join(', ')}`;
      }
      
      // Ensure summary isn't too long
      if (summary.length > 120) {
        summary = summary.substring(0, 117) + '...';
      }
      
      return {
        summary,
        success: true,
      };
    } catch (error: any) {
      return {
        summary: `📋 ${projectData.title} - Research project with various media files`,
        success: false,
        error: error.message,
      };
    }
  }

  async generateBulkSummaries(projects: Array<{
    id: number;
    title: string;
    description?: string;
    media?: Array<{
      filename: string;
      type: string;
    }>;
  }>): Promise<Record<number, string>> {
    const summaries: Record<number, string> = {};
    
    // Generate summaries for all projects
    const promises = projects.map(async (project) => {
      const result = await this.generateProjectSummary(project);
      summaries[project.id] = result.summary;
    });
    
    await Promise.all(promises);
    return summaries;
  }
}

export const aiService = new AIService();
export default aiService; 