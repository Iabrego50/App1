import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark, Send, FileText, Image, Video, Download, ExternalLink, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types/Project';
import { projectService } from '../services/projectService';
import { commentService, Comment } from '../services/commentService';
import { likeService, Like } from '../services/likeService';
import { shareService } from '../services/shareService';

interface ProjectStats {
  likes: Like[];
  comments: Comment[];
  shares: number;
  isLiked: boolean;
}

const TokMode: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

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

  useEffect(() => {
    fetchProjects();
  }, []);

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
    if (newIndex === currentIndex) return;
    
    // Handle infinite scroll logic
    let targetIndex = newIndex;
    if (newIndex >= projects.length) {
      // If we're going past the last project, wrap to the beginning
      targetIndex = 0;
    } else if (newIndex < 0) {
      // If we're going before the first project, wrap to the end
      targetIndex = projects.length - 1;
    }
    
    setCurrentIndex(targetIndex);
  }, [currentIndex, projects.length]);

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
      ref={containerRef}
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
          <div className="w-6"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-full overflow-y-auto pt-16 pb-8 w-full scroll-smooth">
        <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
          {projects.map((project, index) => {
            const stats = projectStats[index];
            
            return (
              <div
                key={`${project.id}-${index}`}
                className="flex items-center justify-center p-4 relative w-full"
                style={{ height: '400px' }}
              >
                {/* Project Card */}
                <div 
                  className="bg-gray-900 rounded-3xl p-2 w-[320px] max-w-[95vw] shadow-2xl border border-gray-800 transform transition-all duration-300 hover:scale-105 cursor-pointer hover:bg-gray-800"
                  onClick={() => handleTileClick(project)}
                >
                  {/* TLDR Section */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white text-xs sm:text-sm font-bold">TLDR</h3>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-0">
                      <p className="text-gray-300 text-xs leading-relaxed">
                        {tldrQuotes[index] || "No TLDR available for this research project."}
                      </p>
                    </div>
                  </div>

                  {/* Project Image/Thumbnail */}
                  <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-2 flex items-center justify-center overflow-hidden">
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail} 
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
                  <div className="flex items-center justify-between px-2 pb-2">
                    {/* Like Button */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(index);
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
                          setCurrentIndex(index);
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
                          setCurrentIndex(index);
                          setShowComments(true);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(index);
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
                        setCurrentIndex(index);
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

      {/* Project Modal */}
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-2xl font-bold">{selectedProject.title}</h2>
                <button
                  onClick={() => {
                    console.log('Selected project in modal:', selectedProject); // Debug log
                    console.log('Selected project media:', selectedProject.media); // Debug log
                    setShowProjectModal(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Add New File</span>
                  </button>
                </div>
                
                {selectedProject.media && selectedProject.media.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedProject.media.map((media) => (
                      <div
                        key={media.id}
                        onClick={() => handleFileClick(media)}
                        className="bg-gray-800 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-all duration-300 group border border-gray-700 hover:border-blue-500"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            {getFileIcon(media.filename)}
                          </div>
                          <div>
                            <div className="text-white font-medium truncate max-w-[250px]">
                              {media.filename}
                            </div>
                            <div className="text-gray-400 text-sm flex items-center space-x-2">
                              <span className="capitalize bg-gray-600 px-2 py-1 rounded text-xs">{media.type}</span>
                              <span>•</span>
                              <span>Click to open</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink size={18} className="text-blue-400" />
                          <Download size={18} className="text-green-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-800 rounded-xl border-2 border-dashed border-gray-600">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-4">No media files attached</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto">
                      <Plus size={18} />
                      <span>Add Your First File</span>
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