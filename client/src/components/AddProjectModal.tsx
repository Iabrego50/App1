import React, { useState, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { projectService } from '../services/projectService';
import { uploadService, UploadedFile } from '../services/uploadService';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectAdded: () => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onProjectAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    segment: 'CCC'
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const segments = ['CCC', 'PMP', 'Facilities', 'Inventory', 'Diagnostics'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const fileArray = Array.from(files);
      const uploaded = await uploadService.uploadFiles(fileArray);
      setUploadedFiles(prev => [...prev, ...uploaded]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingThumbnail(true);
    try {
      const fileArray = Array.from(files);
      const uploaded = await uploadService.uploadFiles(fileArray);
      if (uploaded.length > 0) {
        setFormData(prev => ({ ...prev, thumbnail: uploaded[0].url }));
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a research repository title');
      return;
    }

    try {
      // Include segment in the description for filtering
      const description = `${formData.segment}: ${formData.description}`;
      
      await projectService.create({
        title: formData.title,
        description: description,
        thumbnail: formData.thumbnail || undefined
      });
      
      onProjectAdded();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        thumbnail: '',
        segment: 'CCC'
      });
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error creating research repository:', error);
      alert('Failed to create research repository');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-robinhood-dark-gray rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-robinhood-text-light transition-colors duration-200">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-robinhood-text-light transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-2 transition-colors duration-200">
              Research Repository Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
              placeholder="Enter research repository title"
              required
            />
          </div>

          <div>
            <label htmlFor="segment" className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-2 transition-colors duration-200">
              Segment *
            </label>
            <select
              id="segment"
              name="segment"
              value={formData.segment}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
              required
            >
              {segments.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-2 transition-colors duration-200">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
              placeholder="Enter research repository description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-2 transition-colors duration-200">
              Research Repository Thumbnail
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploadingThumbnail}
                className="px-4 py-2 bg-gray-100 dark:bg-robinhood-light-gray text-gray-700 dark:text-robinhood-text-light rounded-lg hover:bg-gray-200 dark:hover:bg-robinhood-text-muted transition-colors disabled:opacity-50"
              >
                {uploadingThumbnail ? 'Uploading...' : 'Choose Thumbnail'}
              </button>
              {formData.thumbnail && (
                <div className="flex items-center space-x-2">
                  <img 
                    src={formData.thumbnail} 
                    alt="Thumbnail preview" 
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-2 transition-colors duration-200">
              Upload Files
            </label>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-robinhood-light-gray text-gray-700 dark:text-robinhood-text-light rounded-lg hover:bg-gray-200 dark:hover:bg-robinhood-text-muted transition-colors disabled:opacity-50"
              >
                {uploadingFiles ? 'Uploading...' : 'Choose Files'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-robinhood-text-muted">Uploaded Files:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-robinhood-black rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-robinhood-text-muted truncate">
                          {file.originalname}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-robinhood-text-muted hover:text-gray-800 dark:hover:text-robinhood-text-light transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal; 