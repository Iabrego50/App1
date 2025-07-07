import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types/Project';
import ProjectGrid from '../components/ProjectGrid';
import ProjectModal from '../components/ProjectModal';
import AddProjectModal from '../components/AddProjectModal';
import { projectService } from '../services/projectService';
import { Plus, Building2, Edit } from 'lucide-react';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [segments, setSegments] = useState<string[]>(['CCC', 'PMP', 'Facilities', 'Inventory', 'Diagnostics']);
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  
  // Edit states
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editProjectSegment, setEditProjectSegment] = useState('');
  
  const [showEditSegmentModal, setShowEditSegmentModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<string>('');
  const [editSegmentName, setEditSegmentName] = useState('');

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching research repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  const handleAddProject = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleProjectAdded = () => {
    fetchProjects();
    handleCloseAddModal();
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this research repository?')) {
      try {
        await projectService.delete(projectId);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting research repository:', error);
        alert('Failed to delete research repository');
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditProjectTitle(project.title);
    
    // Extract segment and description
    const segmentMatch = project.description?.match(/^([^:]+):/);
    const segment = segmentMatch ? segmentMatch[1] : 'CCC';
    const description = project.description?.replace(/^[^:]+:\s*/, '') || '';
    
    setEditProjectSegment(segment);
    setEditProjectDescription(description);
    setShowEditProjectModal(true);
  };

  const handleSaveProjectEdit = async () => {
    if (!editingProject || !editProjectTitle.trim()) {
      alert('Please enter a research repository title');
      return;
    }

    try {
      const updatedDescription = `${editProjectSegment}: ${editProjectDescription}`;
      await projectService.update(editingProject.id, {
        title: editProjectTitle,
        description: updatedDescription,
        thumbnail: editingProject.thumbnail
      });
      
      fetchProjects();
      setShowEditProjectModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating research repository:', error);
      alert('Failed to update research repository');
    }
  };

  const getNextSegmentNumber = (baseName: string) => {
    const existingSegments = segments.filter(seg => seg.startsWith(baseName));
    if (existingSegments.length === 0) {
      return `${baseName} 1`;
    }
    
    const numbers = existingSegments
      .map(seg => {
        const match = seg.match(new RegExp(`${baseName} (\\d+)$`));
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    const maxNumber = Math.max(...numbers, 0);
    return `${baseName} ${maxNumber + 1}`;
  };

  const handleAddSegment = () => {
    if (newSegmentName.trim()) {
      const trimmedName = newSegmentName.trim();
      
      // Check if it's a base name that should be numbered
      const baseSegments = ['CCC', 'PMP', 'Facilities', 'Inventory', 'Diagnostics'];
      let finalSegmentName = trimmedName;
      
      if (baseSegments.includes(trimmedName)) {
        finalSegmentName = getNextSegmentNumber(trimmedName);
      } else if (!segments.includes(trimmedName)) {
        finalSegmentName = trimmedName;
      } else {
        alert('Segment name already exists');
        return;
      }
      
      setSegments([...segments, finalSegmentName]);
      setNewSegmentName('');
      setShowNewSegmentModal(false);
    }
  };

  const handleEditSegment = (segment: string) => {
    setEditingSegment(segment);
    setEditSegmentName(segment);
    setShowEditSegmentModal(true);
  };

  const handleOpenEditSegmentModal = () => {
    // Default to first segment if none selected, or show a selection interface
    if (segments.length > 0) {
      setEditingSegment(segments[0]);
      setEditSegmentName(segments[0]);
    }
    setShowEditSegmentModal(true);
  };

  const handleSaveSegmentEdit = () => {
    if (!editSegmentName.trim() || editSegmentName.trim() === editingSegment) {
      setShowEditSegmentModal(false);
      return;
    }

    if (segments.includes(editSegmentName.trim())) {
      alert('Segment name already exists');
      return;
    }

    // Update segments array
    const updatedSegments = segments.map(seg => 
      seg === editingSegment ? editSegmentName.trim() : seg
    );
    setSegments(updatedSegments);

    // Update selected segment if it was the one being edited
    if (selectedSegment === editingSegment) {
      setSelectedSegment(editSegmentName.trim());
    }

    setShowEditSegmentModal(false);
    setEditingSegment('');
    setEditSegmentName('');
  };

  const handleDeleteSegment = (segment: string) => {
    if (window.confirm(`Are you sure you want to delete the "${segment}" segment?`)) {
      const updatedSegments = segments.filter(seg => seg !== segment);
      setSegments(updatedSegments);
      
      // Reset to 'all' if the deleted segment was selected
      if (selectedSegment === segment) {
        setSelectedSegment('all');
      }
    }
  };

  const filteredProjects = selectedSegment === 'all' 
    ? projects 
    : projects.filter(project => project.description?.toLowerCase().includes(selectedSegment.toLowerCase()));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-robinhood-text-light transition-colors duration-200">
            Research Repositories
          </h1>
          <p className="text-gray-600 dark:text-robinhood-text-muted mt-1 transition-colors duration-200">
            Manage your research projects and files
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/tok-mode')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Building2 className="h-4 w-4" />
            <span>Tok Mode</span>
          </button>
                      <button
              onClick={handleAddProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Projects</span>
            </button>
        </div>
      </div>

      {/* Segment Filter */}
      <div className="bg-white dark:bg-robinhood-dark-gray rounded-lg shadow-sm border border-gray-200 dark:border-robinhood-light-gray p-4 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-robinhood-text-light transition-colors duration-200">
            Filter by Segment
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowNewSegmentModal(true)}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Add Segment
            </button>
            <button
              onClick={handleOpenEditSegmentModal}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Edit Segments
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSegment('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedSegment === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-robinhood-light-gray text-gray-700 dark:text-robinhood-text-muted hover:bg-gray-200 dark:hover:bg-robinhood-text-muted hover:text-robinhood-text-light'
            }`}
          >
            All
          </button>
          {segments.map((segment) => (
            <button
              key={segment}
              onClick={() => setSelectedSegment(segment)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedSegment === segment
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-robinhood-light-gray text-gray-700 dark:text-robinhood-text-muted hover:bg-gray-200 dark:hover:bg-robinhood-text-muted hover:text-robinhood-text-light'
              }`}
            >
              {segment}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600 dark:text-robinhood-text-muted">Loading research repositories...</div>
        </div>
      ) : (
        <ProjectGrid
          projects={filteredProjects}
          onProjectClick={handleProjectClick}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
        />
      )}

      {/* Modals */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={handleCloseModal}
          onProjectUpdate={handleProjectUpdate}
        />
      )}

      {showAddModal && (
        <AddProjectModal
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          onProjectAdded={handleProjectAdded}
        />
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-robinhood-dark-gray rounded-xl p-6 w-full max-w-md transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-robinhood-text-light mb-4 transition-colors duration-200">
              Edit Research Repository
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-1 transition-colors duration-200">
                  Title
                </label>
                <input
                  type="text"
                  value={editProjectTitle}
                  onChange={(e) => setEditProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-1 transition-colors duration-200">
                  Segment
                </label>
                <select
                  value={editProjectSegment}
                  onChange={(e) => setEditProjectSegment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
                >
                  {segments.map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-1 transition-colors duration-200">
                  Description
                </label>
                <textarea
                  value={editProjectDescription}
                  onChange={(e) => setEditProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveProjectEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditProjectModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-robinhood-text-muted hover:text-gray-800 dark:hover:text-robinhood-text-light transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Segment Modal */}
      {showNewSegmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-robinhood-dark-gray rounded-xl p-6 w-full max-w-md transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-robinhood-text-light mb-4 transition-colors duration-200">
              Add New Segment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-1 transition-colors duration-200">
                  Segment Name
                </label>
                <input
                  type="text"
                  value={newSegmentName}
                  onChange={(e) => setNewSegmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
                  placeholder="Enter segment name"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddSegment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Segment
                </button>
                <button
                  onClick={() => setShowNewSegmentModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-robinhood-text-muted hover:text-gray-800 dark:hover:text-robinhood-text-light transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Segment Modal */}
      {showEditSegmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-robinhood-dark-gray rounded-xl p-6 w-full max-w-md transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-robinhood-text-light mb-4 transition-colors duration-200">
              Edit Segment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-1 transition-colors duration-200">
                  Select Segment to Edit
                </label>
                <select
                  value={editingSegment}
                  onChange={(e) => {
                    setEditingSegment(e.target.value);
                    setEditSegmentName(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
                >
                  {segments.map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-1 transition-colors duration-200">
                  New Segment Name
                </label>
                <input
                  type="text"
                  value={editSegmentName}
                  onChange={(e) => setEditSegmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light transition-colors duration-200"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveSegmentEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditSegmentModal(false)}
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
  );
};

export default Projects; 