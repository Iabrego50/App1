export interface ProjectMedia {
  id: number;
  type: 'video' | 'image' | 'doc';
  url: string;
  filename: string;
  thumbnail_url?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  media: ProjectMedia[];
  created_at: string;
} 