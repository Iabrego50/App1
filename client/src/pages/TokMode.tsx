import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark, Send, FileText, Image, Video, Download, ExternalLink, Users, Plus, Trash2, Save, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types/Project';
import { projectService } from '../services/projectService';
import { commentService, Comment } from '../services/commentService';
import { likeService, Like } from '../services/likeService';
import { shareService } from '../services/shareService';
import { uploadService, UploadedFile } from '../services/uploadService';
import { aiService } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

interface ProjectStats {
  likes: Like[];
  comments: Comment[];
  shares: number;
  isLiked: boolean;
}

interface ProjectFile {
  id: string;
  name: string;
  type: 'video' | 'image' | 'doc';
  url: string;
  thumbnail?: string;
}

const TokMode: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Create infinite projects array for seamless scrolling
  const infiniteProjects = React.useMemo(() => {
    if (projects.length === 0) return [];
    
    // Create a larger array by repeating the projects multiple times
    const repetitions = 10; // Repeat projects 10 times to create infinite effect
    const infinite: Project[] = [];
    
    for (let i = 0; i < repetitions; i++) {
      infinite.push(...projects);
    }
    
    return infinite;
  }, [projects]);

  const [projectStats, setProjectStats] = useState<{ [key: number]: ProjectStats }>({});
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingTldr, setEditingTldr] = useState<number | null>(null);
  const [tldrQuotes, setTldrQuotes] = useState<{ [key: number]: string }>({});
  const [generatingSummaries, setGeneratingSummaries] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  // File upload states
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFiles, setOriginalFiles] = useState<ProjectFile[]>([]);

  // File upload helper functions
  const allowedTypes = ['video', 'image', 'doc'] as const;
  
  function isAllowedType(type: string): type is 'video' | 'image' | 'doc' {
    return allowedTypes.includes(type as any);
  }

  function mapFileType(file: UploadedFile): 'video' | 'image' | 'doc' {
    if (file.mimetype.startsWith('image/')) return 'image';
    if (file.mimetype.startsWith('video/')) return 'video';
    return 'doc';
  }

  const makeAbsoluteUrl = (url: string) => {
    if (url.startsWith('http')) {
      // Convert server URLs to use the client's proxy
      return url.replace('http://localhost:5000', '');
    }
    // For relative URLs, return as-is (they'll be proxied)
    return url;
  };

  // Initialize files when project is selected
  useEffect(() => {
    if (selectedProject) {
      const files: ProjectFile[] = selectedProject.media?.map(media => ({
        id: media.id.toString(),
        name: media.filename,
        type: media.type,
        url: makeAbsoluteUrl(media.url),
        thumbnail: media.thumbnail_url ? makeAbsoluteUrl(media.thumbnail_url) : (media.type === 'image' ? makeAbsoluteUrl(media.url) : undefined)
      })) || [];
      
      setProjectFiles(files);
      setOriginalFiles(files);
      setHasChanges(false);
    }
  }, [selectedProject]);

  // Track changes
  useEffect(() => {
    const filesChanged = JSON.stringify(projectFiles) !== JSON.stringify(originalFiles);
    setHasChanges(filesChanged);
  }, [projectFiles, originalFiles]);

  // File upload handler
  const handleAddFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      alert('You must be logged in to add files');
      return;
    }

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadedFiles: UploadedFile[] = await uploadService.uploadFiles(fileArray);
      
      // Add new files to the project
      const newFiles: ProjectFile[] = uploadedFiles.map(file => {
        const mappedType = mapFileType(file);
        const absUrl = makeAbsoluteUrl(file.url);
        const thumbnailUrl = file.thumbnailUrl ? makeAbsoluteUrl(file.thumbnailUrl) : undefined;
        
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.originalname,
          type: mappedType,
          url: absUrl,
          thumbnail: thumbnailUrl || (mappedType === 'image' ? absUrl : undefined)
        };
      });

      setProjectFiles(prev => [...prev, ...newFiles]);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Delete file handler
  const handleDeleteFile = (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setProjectFiles(prev => prev.filter(file => file.id !== fileId));
    }
  };

  // Save changes handler
  const handleSave = async () => {
    if (!hasChanges || !selectedProject) return;
    
    if (!user) {
      alert('You must be logged in to save changes');
      return;
    }

    setSaving(true);
    try {
      // Find new files (files that weren't in original)
      const newFiles = projectFiles.filter(file => 
        !originalFiles.some(originalFile => originalFile.id === file.id)
      );

      // Add new files to the project
      for (const file of newFiles) {
        await projectService.addMedia(selectedProject.id, {
          type: file.type,
          url: file.url,
          filename: file.name,
          thumbnailUrl: file.thumbnail
        });
      }

      // Update the projects list
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, media: [...(p.media || []), ...newFiles.map(f => ({
              id: parseInt(f.id),
              type: f.type,
              url: f.url,
              filename: f.name,
              thumbnail_url: f.thumbnail
            }))] }
          : p
      );
      
      setProjects(updatedProjects);
      setOriginalFiles(projectFiles);
      setHasChanges(false);
      
      alert('Changes saved successfully!');
    } catch (error: any) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Initialize currentIndex to middle of infinite array when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && currentIndex === 0) {
      const middleStart = Math.floor(infiniteProjects.length / 2 - projects.length / 2);
      setCurrentIndex(middleStart);
    }
  }, [projects.length, infiniteProjects.length, currentIndex]);

  // Auto-scroll to current index
  useEffect(() => {
    if (containerRef.current && infiniteProjects.length > 0) {
      const cardHeight = 505; // 500px card height + 5px gap
      const scrollTop = currentIndex * cardHeight;
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, infiniteProjects.length]);

  // Generate AI summaries when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && Object.keys(tldrQuotes).length === 0) {
      generateAISummaries();
    }
  }, [projects.length]);

  const fetchProjects = async () => {
    try {
      const fetchedProjects = await projectService.getAll();
      console.log('Fetched projects in TokMode:', fetchedProjects); // Debug log
      setProjects(fetchedProjects);
      
      // Initialize stats for each project
      const initialStats: { [key: number]: ProjectStats } = {};
      
      for (let i = 0; i < fetchedProjects.length; i++) {
        const project = fetchedProjects[i];
        console.log(`Project ${i} media:`, project.media); // Debug log
        
        try {
          // Fetch comments and likes for each project
          const [comments, likes] = await Promise.all([
            commentService.getComments(project.id),
            likeService.getLikes(project.id)
          ]);
          
          // Check if current user has liked this project
          const likeStatus = await likeService.checkLikeStatus(project.id);
          
          initialStats[i] = {
            likes,
            comments,
            shares: Math.floor(Math.random() * 100) + 10, // Keep shares as mock data for now
            isLiked: likeStatus.liked
          };
        } catch (error) {
          console.error(`Error fetching data for project ${project.id}:`, error);
          // Initialize with empty data if fetch fails
          initialStats[i] = {
            likes: [],
            comments: [],
            shares: Math.floor(Math.random() * 100) + 10,
            isLiked: false
          };
        }
      }
      
      setProjectStats(initialStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const smoothScrollTo = useCallback((newIndex: number) => {
    if (newIndex === currentIndex || infiniteProjects.length === 0) return;
    
    let targetIndex = newIndex;
    
    // Handle infinite scroll logic - ensure we stay within bounds of infinite array
    if (newIndex >= infiniteProjects.length) {
      // If we're going past the end, continue from the beginning
      targetIndex = newIndex % projects.length;
    } else if (newIndex < 0) {
      // If we're going before the beginning, continue from the end
      targetIndex = infiniteProjects.length + newIndex;
    }
    
    // Reset to middle section if we get too far from the original range
    const middleStart = Math.floor(infiniteProjects.length / 2 - projects.length / 2);
    if (targetIndex < projects.length || targetIndex >= infiniteProjects.length - projects.length) {
      targetIndex = middleStart + (targetIndex % projects.length);
    }
    
    setCurrentIndex(targetIndex);
  }, [currentIndex, infiniteProjects.length, projects.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;

    if (isUpSwipe) {
      // Swipe up - go to next project
      smoothScrollTo(currentIndex + 1);
    } else if (isDownSwipe) {
      // Swipe down - go to previous project
      smoothScrollTo(currentIndex - 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.deltaY > 0) {
      // Scroll down - go to next project
      smoothScrollTo(currentIndex + 1);
    } else if (e.deltaY < 0) {
      // Scroll up - go to previous project
      smoothScrollTo(currentIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      // Go to next project
      smoothScrollTo(currentIndex + 1);
    } else if (e.key === 'ArrowUp') {
      // Go to previous project
      smoothScrollTo(currentIndex - 1);
    } else if (e.key === 'Escape') {
      navigate('/projects');
    }
  };

  const handleLike = async (index: number) => {
    console.log('Like button clicked for index:', index);
    const project = projects[index];
    if (!project) return;
    
    try {
      const result = await likeService.toggleLike(project.id);
      
      // Refresh likes for this project
      const updatedLikes = await likeService.getLikes(project.id);
      
      setProjectStats(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          isLiked: result.liked,
          likes: updatedLikes
        }
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      const project = projects[currentIndex];
      if (!project) return;
      
      try {
        const newCommentData = await commentService.addComment(project.id, newComment.trim());
        
        setProjectStats(prev => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            comments: [newCommentData, ...prev[currentIndex].comments]
          }
        }));
        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.deleteComment(commentId);
      
      setProjectStats(prev => ({
        ...prev,
        [currentIndex]: {
          ...prev[currentIndex],
          comments: prev[currentIndex].comments.filter(comment => comment.id !== commentId)
        }
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleShare = (index: number) => {
    console.log('Share button clicked for index:', index);
    setCurrentIndex(index);
    setShowShare(true);
  };

  const handleEmailShare = async () => {
    if (shareEmail.trim()) {
      const project = projects[currentIndex];
      if (!project) return;
      
      try {
        // Try to use the API share method first
        await shareService.shareProject(project.id, { 
          email: shareEmail.trim(),
          message: shareMessage.trim() || undefined
        });
        
        // Update share count
        setProjectStats(prev => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            shares: prev[currentIndex].shares + 1
          }
        }));
        
        setShareEmail('');
        setShareMessage('');
        setShowShare(false);
        alert(`Project "${project.title}" shared with ${shareEmail}!`);
      } catch (error) {
        console.error('API share failed, falling back to mailto:', error);
        
        // Fallback to mailto method
        const projectUrl = `${window.location.origin}/projects/${project.id}`;
        shareService.shareViaEmail(project.title, projectUrl, shareMessage.trim());
        
        setShareEmail('');
        setShareMessage('');
        setShowShare(false);
        alert(`Opening email client to share "${project.title}"`);
      }
    }
  };

  const handleTileClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image size={20} className="text-blue-400" />;
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'wmv':
        return <Video size={20} className="text-purple-400" />;
      case 'pdf':
        return <FileText size={20} className="text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText size={20} className="text-blue-600" />;
      case 'ppt':
      case 'pptx':
        return <FileText size={20} className="text-orange-400" />;
      case 'xls':
      case 'xlsx':
        return <FileText size={20} className="text-green-400" />;
      default:
        return <FileText size={20} className="text-gray-400" />;
    }
  };

  const handleFileClick = (media: any) => {
    // Open file in new tab/window - construct the correct URL
    const fullUrl = media.url.startsWith('http') ? media.url : `http://localhost:5000${media.url}`;
    window.open(fullUrl, '_blank');
  };

  const handleCommentClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // Prevent tile click
    setCurrentIndex(index);
    setShowComments(true);
  };

  // Generate AI summaries for all projects
  const generateAISummaries = async () => {
    if (projects.length === 0) return;
    
    setGeneratingSummaries(true);
    try {
      const summaries = await aiService.generateBulkSummaries(projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        media: project.media?.map(m => ({ filename: m.filename, type: m.type }))
      })));
      
      setTldrQuotes(summaries);
    } catch (error) {
      console.error('Error generating AI summaries:', error);
    } finally {
      setGeneratingSummaries(false);
    }
  };

  // Regenerate AI summary for a specific project
  const regenerateAISummary = async (projectIndex: number) => {
    const project = projects[projectIndex];
    if (!project) return;
    
    setRegeneratingIndex(projectIndex);
    try {
      const result = await aiService.generateProjectSummary({
        title: project.title,
        description: project.description,
        media: project.media?.map(m => ({ filename: m.filename, type: m.type }))
      });
      
      setTldrQuotes(prev => ({
        ...prev,
        [projectIndex]: result.summary
      }));
    } catch (error) {
      console.error('Error regenerating AI summary:', error);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">No projects available</h2>
          <button 
            onClick={() => navigate('/projects')}
            className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/projects')}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-semibold">Tok Mode</h1>
          <button
            onClick={generateAISummaries}
            disabled={generatingSummaries}
            className="text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            title="Regenerate AI Summaries"
          >
            {generatingSummaries ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span className="text-xs">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span className="text-xs">AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="relative h-full overflow-y-auto pt-16 pb-8 w-full scroll-smooth">
        <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '20px' }}>
          {infiniteProjects.map((project, index) => {
            // Map to original project index for stats
            const originalIndex = index % projects.length;
            const stats = projectStats[originalIndex];
            
            return (
              <div
                key={`${project.id}-${index}`}
                className="flex items-center justify-center p-1 relative w-full min-h-[500px]"
              >
                {/* Project Card */}
                <div 
                  className="bg-gray-900 rounded-3xl p-3 w-[320px] max-w-[95vw] shadow-2xl border border-gray-800 transform transition-all duration-300 hover:scale-105 cursor-pointer hover:bg-gray-800 max-h-[480px] overflow-hidden"
                  onClick={() => handleTileClick(project)}
                >
                  {/* TLDR Section */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <h3 className="text-white text-xs sm:text-sm font-bold">TLDR</h3>
                        <Sparkles size={10} className="text-purple-400" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          regenerateAISummary(originalIndex);
                        }}
                        disabled={regeneratingIndex === originalIndex || generatingSummaries}
                        className="text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate AI Summary"
                      >
                        <RefreshCw 
                          size={12} 
                          className={regeneratingIndex === originalIndex ? 'animate-spin' : ''} 
                        />
                      </button>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-2 min-h-[40px] max-h-[60px] overflow-hidden flex items-center">
                      {regeneratingIndex === originalIndex ? (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <RefreshCw size={12} className="animate-spin" />
                          <span className="text-xs">Generating AI summary...</span>
                        </div>
                      ) : generatingSummaries ? (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Sparkles size={12} className="animate-pulse" />
                          <span className="text-xs">AI is analyzing...</span>
                        </div>
                      ) : (
                        <p className="text-gray-300 text-xs leading-relaxed" style={{ 
                          display: '-webkit-box', 
                          WebkitLineClamp: 3, 
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {tldrQuotes[originalIndex] || "Generating AI summary..."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Project Image/Thumbnail */}
                  <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail.startsWith('http://localhost:5000') ? project.thumbnail.replace('http://localhost:5000', '') : project.thumbnail} 
                        alt={project.title}
                        className="w-full h-full object-cover rounded-2xl transition-transform duration-300 hover:scale-110"
                      />
                    ) : (
                      <div className="text-white text-2xl sm:text-3xl font-bold">
                        {project.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Project Title */}
                  <div className="text-center mb-3">
                    <h2 className="text-white text-base sm:text-lg font-bold">{project.title}</h2>
                  </div>

                  {/* Interaction Buttons */}
                  <div className="flex items-center justify-between px-3 pb-3">
                    {/* Like Button */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(originalIndex);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Heart 
                          size={20} 
                          className={stats?.isLiked ? 'text-red-500 fill-current' : ''}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(originalIndex);
                          setShowLikes(true);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                        disabled={!stats?.likes?.length}
                      >
                        {stats?.likes?.length || 0}
                      </button>
                    </div>

                    {/* Comments Button */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(originalIndex);
                          setShowComments(true);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(originalIndex);
                          setShowComments(true);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors text-sm"
                        disabled={!stats?.comments?.length}
                      >
                        {stats?.comments?.length || 0}
                      </button>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(originalIndex);
                        setShowShare(true);
                      }}
                      className="flex items-center space-x-1 text-gray-400 hover:text-green-500 transition-colors"
                    >
                      <Share size={20} />
                      <span className="text-sm">{stats?.shares || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-gray-900 rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Comments</h3>
                <button
                  onClick={() => {
                    setShowComments(false);
                    setNewComment('');
                  }}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {projectStats[currentIndex]?.comments.length > 0 ? (
                projectStats[currentIndex]?.comments.map((comment, index) => (
                  <div key={comment.id} className="mb-4 flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {comment.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-300 text-sm bg-gray-800 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-white mb-1">{comment.author}</div>
                          {comment.author === localStorage.getItem('username') && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <div>{comment.text}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Likes Modal */}
      {showLikes && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-gray-900 rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Who liked this</h3>
                <button
                  onClick={() => setShowLikes(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {projectStats[currentIndex]?.likes && projectStats[currentIndex]?.likes.length > 0 ? (
                projectStats[currentIndex]?.likes.map((like, index) => (
                  <div key={like.id} className="mb-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {like.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{like.author}</div>
                    </div>
                    <Heart size={16} className="text-red-500" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">No likes yet. Be the first to like!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-gray-900 rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Share Project</h3>
                <button
                  onClick={() => setShowShare(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">
                  Share via Email
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleEmailShare}
                  disabled={!shareEmail.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={() => {
                    setShowShare(false);
                    setShareEmail('');
                    setShareMessage('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        style={{ display: 'none' }}
        onChange={handleAddFile}
      />

      {/* Project Modal */}
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-2xl font-bold">{selectedProject.title}</h2>
                <div className="flex items-center space-x-3">
                  {hasChanges && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Save size={16} />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (hasChanges) {
                        const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close without saving?');
                        if (!confirmed) return;
                      }
                      setShowProjectModal(false);
                      setSelectedProject(null);
                      setProjectFiles([]);
                      setOriginalFiles([]);
                      setHasChanges(false);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Project Header with Date */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white text-lg font-semibold">Project Details</h3>
                  <div className="text-gray-400 text-sm">
                    {selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : 'Date not available'}
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {selectedProject.description || 'No description available'}
                </p>
              </div>

              {/* Media Files Section - Main Highlight */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-xl font-bold">Media Files</h3>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>{uploading ? 'Uploading...' : 'Add New File'}</span>
                  </button>
                </div>
                
                {projectFiles && projectFiles.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {projectFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-gray-800 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-all duration-300 group border border-gray-700 hover:border-blue-500"
                      >
                        <div 
                          className="flex items-center space-x-4 flex-1"
                          onClick={() => handleFileClick({ url: file.url, filename: file.name })}
                        >
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                            {file.type === 'doc' && file.name.toLowerCase().endsWith('.pdf') ? (
                              <div className="text-red-400 text-lg">📄</div>
                            ) : file.thumbnail && (file.type === 'image' || file.type === 'video') ? (
                              <img 
                                src={file.thumbnail} 
                                alt={file.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              getFileIcon(file.name)
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium truncate max-w-[250px]">
                              {file.name}
                            </div>
                            <div className="text-gray-400 text-sm flex items-center space-x-2">
                              <span className="capitalize bg-gray-600 px-2 py-1 rounded text-xs">{file.type}</span>
                              <span>•</span>
                              <span>Click to open</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <ExternalLink size={18} className="text-blue-400" />
                          <Download size={18} className="text-green-400" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete file"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-800 rounded-xl border-2 border-dashed border-gray-600">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-4">No media files attached</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Plus size={18} />
                      <span>{uploading ? 'Uploading...' : 'Add Your First File'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-800">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowProjectModal(false);
                    navigate('/projects');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl transition-colors"
                >
                  View in Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokMode; 