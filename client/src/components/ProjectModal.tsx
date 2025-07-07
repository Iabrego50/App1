import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types/Project';
import { X, ChevronLeft, ChevronRight, FileText, Image, File, Download, Plus, Trash2, Save } from 'lucide-react';
import { uploadService, UploadedFile } from '../services/uploadService';
import { projectService } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  onProjectUpdate?: (updatedProject: Project) => void;
}

interface ProjectFile {
  id: string;
  name: string;
  type: 'video' | 'image' | 'doc';
  url: string;
  thumbnail?: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose, onProjectUpdate }) => {
  const { user } = useAuth();
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showAddFile, setShowAddFile] = useState(false);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFiles, setOriginalFiles] = useState<ProjectFile[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (url.startsWith('http')) return url;
    return `${window.location.origin}${url}`;
  };

  // Initialize files from project media
  useEffect(() => {
    const files: ProjectFile[] = project.media?.map(media => ({
      id: media.id.toString(),
      name: media.filename,
      type: media.type,
      url: makeAbsoluteUrl(media.url),
      thumbnail: media.thumbnail_url ? makeAbsoluteUrl(media.thumbnail_url) : (media.type === 'image' ? makeAbsoluteUrl(media.url) : undefined)
    })) || [];
    
    setProjectFiles(files);
    setOriginalFiles(files);
  }, [project]);

  // Track changes
  useEffect(() => {
    const filesChanged = JSON.stringify(projectFiles) !== JSON.stringify(originalFiles);
    setHasChanges(filesChanged);
  }, [projectFiles, originalFiles]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (projectFiles.length <= 1) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setCurrentFileIndex((prev) => (prev - 1 + projectFiles.length) % projectFiles.length);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setCurrentFileIndex((prev) => (prev + 1) % projectFiles.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectFiles.length]);

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
      setShowAddFile(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setProjectFiles(prev => prev.filter(file => file.id !== fileId));
      if (currentFileIndex >= projectFiles.length - 1) {
        setCurrentFileIndex(Math.max(0, projectFiles.length - 2));
      }
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close without saving?');
      if (!confirmed) return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    if (!user) {
      alert('You must be logged in to save changes');
      return;
    }

    setSaving(true);
    try {
      // Get the files that were added (not in original files)
      const addedFiles = projectFiles.filter(file => 
        !originalFiles.find(original => original.id === file.id)
      );

      // Get the files that were deleted (in original but not in current)
      const deletedFiles = originalFiles.filter(original => 
        !projectFiles.find(file => file.id === original.id)
      );

      console.log('Saving changes:', { addedFiles, deletedFiles });

      // Add new files to the project
      for (const file of addedFiles) {
        console.log('Payload to addMedia:', {
          type: file.type,
          url: file.url,
          filename: file.name,
          thumbnailUrl: file.thumbnail
        });
        await projectService.addMedia(project.id, {
          type: file.type,
          url: file.url,
          filename: file.name,
          thumbnailUrl: file.thumbnail
        });
      }

      // Delete removed files from the project
      for (const file of deletedFiles) {
        if (!isNaN(Number(file.id))) {
          console.log('Deleting file:', file);
          await projectService.deleteMedia(project.id, Number(file.id));
        }
      }

      // Update the project state
      const updatedProject = await projectService.getById(project.id);
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject);
      }

      // Update local state
      setOriginalFiles(projectFiles);
      setHasChanges(false);

      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error saving project changes:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save changes';
      alert(`Failed to save changes: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const nextFile = () => {
    setCurrentFileIndex((prev) => (prev + 1) % projectFiles.length);
  };

  const prevFile = () => {
    setCurrentFileIndex((prev) => (prev - 1 + projectFiles.length) % projectFiles.length);
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && projectFiles.length > 1) {
      nextFile();
    }
    if (isRightSwipe && projectFiles.length > 1) {
      prevFile();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const renderFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const currentFile = projectFiles[currentFileIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-robinhood-dark-gray rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-robinhood-light-gray">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-robinhood-text-light flex items-center transition-colors duration-200">
              {project.title}
              {hasChanges && (
                <span className="ml-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  Unsaved Changes
                </span>
              )}
            </h2>
            <p className="text-gray-600 dark:text-robinhood-text-muted mt-1 transition-colors duration-200">Research Repository</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving || !user}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  user 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                } disabled:opacity-50`}
                title={!user ? 'You must be logged in to save changes' : ''}
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
            <button
              onClick={() => setShowAddFile(true)}
              disabled={!user}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                user 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              title={!user ? 'You must be logged in to add files' : ''}
            >
              <Plus className="h-4 w-4" />
              <span>Add File</span>
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-robinhood-text-light transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* File Carousel */}
        {projectFiles.length > 0 ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-robinhood-text-light transition-colors duration-200">Research Repository Files</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-robinhood-text-muted transition-colors duration-200">
                  {currentFileIndex + 1} of {projectFiles.length}
                </span>
              </div>
            </div>

            {/* Carousel Container */}
            <div 
              className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-robinhood-black"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* File Display */}
              <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentFileIndex * 100}%)` }}>
                {projectFiles.map((file, index) => (
                  <div key={file.id} className="w-full flex-shrink-0 p-6">
                    <div className="flex items-center justify-center mb-4">
                      {file.thumbnail ? (
                        <img 
                          src={file.thumbnail} 
                          alt={file.name}
                          className="w-64 h-64 object-cover rounded-lg border border-gray-200 dark:border-robinhood-light-gray shadow-sm"
                        />
                      ) : (
                        <div className="w-64 h-64 bg-gray-200 dark:bg-robinhood-light-gray rounded-lg flex items-center justify-center shadow-sm">
                          {renderFileIcon(file.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900 dark:text-robinhood-text-light mb-2 transition-colors duration-200">{file.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-robinhood-text-muted mb-4 transition-colors duration-200">
                        {file.type.toUpperCase()} File
                      </p>
                      
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Indicators */}
              {projectFiles.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-2">
                    {projectFiles.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFileIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          index === currentFileIndex
                            ? 'bg-blue-600 scale-110'
                            : 'bg-gray-300 dark:bg-robinhood-light-gray hover:bg-gray-400 dark:hover:bg-robinhood-text-muted'
                        }`}
                        aria-label={`Go to file ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Arrows */}
              {projectFiles.length > 1 && (
                <>
                  <button
                    onClick={prevFile}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-robinhood-dark-gray/80 hover:bg-white dark:hover:bg-robinhood-dark-gray text-gray-800 dark:text-robinhood-text-light p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Previous file"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextFile}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-robinhood-dark-gray/80 hover:bg-white dark:hover:bg-robinhood-dark-gray text-gray-800 dark:text-robinhood-text-light p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Next file"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="bg-gray-50 dark:bg-robinhood-black rounded-lg p-8">
              <File className="h-16 w-16 text-gray-400 dark:text-robinhood-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-robinhood-text-light mb-2 transition-colors duration-200">No files yet</h3>
              <p className="text-gray-600 dark:text-robinhood-text-muted mb-4 transition-colors duration-200">Add your first research file to get started</p>
              <button
                onClick={() => setShowAddFile(true)}
                disabled={!user}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto ${
                  user 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                title={!user ? 'You must be logged in to add files' : ''}
              >
                <Plus className="h-4 w-4" />
                <span>Add File</span>
              </button>
            </div>
          </div>
        )}

        {/* Add File Modal */}
        {showAddFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-robinhood-dark-gray rounded-xl p-6 w-full max-w-md transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-robinhood-text-light mb-4 transition-colors duration-200">Add File</h3>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleAddFile}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              />
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-robinhood-light-gray rounded-lg hover:border-blue-500 dark:hover:border-robinhood-green transition-colors text-gray-600 dark:text-robinhood-text-muted hover:text-blue-600 dark:hover:text-robinhood-green"
                >
                  {uploading ? 'Uploading...' : 'Click to select files'}
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddFile(false)}
                    className="flex-1 px-4 py-2 text-gray-600 dark:text-robinhood-text-muted hover:text-gray-800 dark:hover:text-robinhood-text-light transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectModal; 