import React from 'react';
import { Project } from '../types/Project';
import { Building2, Trash2, Edit } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  onEdit?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete, onEdit }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(project.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(project);
    }
  };

  // Extract segment from description if it exists
  const getSegment = (description?: string) => {
    if (!description) return null;
    const match = description.match(/^([^:]+):/);
    return match ? match[1] : null;
  };

  const segment = getSegment(project.description);
  const cleanDescription = project.description?.replace(/^[^:]+:\s*/, '') || '';

  return (
    <div
      className="bg-white dark:bg-robinhood-dark-gray rounded-xl shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-200 flex flex-col relative group border border-gray-200 dark:border-robinhood-light-gray"
      onClick={() => onClick(project)}
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
        {onEdit && (
          <button
            onClick={handleEdit}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            title="Edit Project"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-robinhood-green dark:to-robinhood-green-dark relative overflow-hidden">
        {project.thumbnail ? (
          <img 
            src={project.thumbnail} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-16 w-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Segment Badge */}
        {segment && (
          <div className="absolute top-3 left-3 bg-white dark:bg-robinhood-black bg-opacity-90 dark:bg-opacity-90 text-gray-800 dark:text-robinhood-text-light px-3 py-1 rounded-full text-sm font-medium">
            {segment}
          </div>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-robinhood-text-light mb-2 line-clamp-2 transition-colors duration-200">
          {project.title}
        </h3>
        
        <p className="text-gray-600 dark:text-robinhood-text-muted text-sm mb-4 flex-1 line-clamp-3 transition-colors duration-200">
          {cleanDescription || 'No description available'}
        </p>
        
                  <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-400 dark:text-robinhood-text-muted" />
              <span className="text-sm text-gray-500 dark:text-robinhood-text-muted">
                {project.media?.length || 0} {project.media?.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            
            <div className="text-sm text-blue-600 dark:text-robinhood-green font-medium transition-colors duration-200">
              View Details →
            </div>
          </div>
      </div>
    </div>
  );
};

export default ProjectCard; 