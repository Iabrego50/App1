import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectService } from '../services/projectService';
import axios from 'axios';

const Debug: React.FC = () => {
  const { user, token } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  const addLog = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const testAuthentication = async () => {
    addLog('Testing authentication...');
    addLog(`User: ${user ? JSON.stringify(user) : 'Not logged in'}`);
    addLog(`Token: ${token ? 'Present' : 'Not present'}`);
    
    if (token) {
      try {
        const response = await axios.get('/api/users/profile');
        addLog(`Profile fetch success: ${JSON.stringify(response.data)}`);
      } catch (error: any) {
        addLog(`Profile fetch error: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const loadProjects = async () => {
    addLog('Loading projects...');
    try {
      const projectsData = await projectService.getAll();
      setProjects(projectsData);
      addLog(`Loaded ${projectsData.length} projects`);
    } catch (error: any) {
      addLog(`Error loading projects: ${error.message}`);
    }
  };

  const testAddMedia = async () => {
    if (!selectedProject) {
      addLog('Please select a project first');
      return;
    }
    
    addLog(`Testing add media to project ${selectedProject}...`);
    
    try {
      const mediaData = {
        type: 'image' as const,
        url: '/api/uploads/test-image.jpg',
        filename: 'test-image.jpg',
        thumbnailUrl: '/api/uploads/test-image-thumb.jpg'
      };
      
      addLog(`Adding media with data: ${JSON.stringify(mediaData)}`);
      const result = await projectService.addMedia(selectedProject, mediaData);
      addLog(`Add media success: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addLog(`Add media error: ${error.response?.data?.message || error.message}`);
      addLog(`Full error: ${JSON.stringify(error.response?.data || error)}`);
    }
  };

  const testProjectLoad = async () => {
    if (!selectedProject) {
      addLog('Please select a project first');
      return;
    }
    
    addLog(`Testing project load for project ${selectedProject}...`);
    
    try {
      const project = await projectService.getById(selectedProject);
      addLog(`Project loaded successfully: ${JSON.stringify(project)}`);
      addLog(`Project has ${project.media?.length || 0} media items`);
    } catch (error: any) {
      addLog(`Project load error: ${error.response?.data?.message || error.message}`);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-robinhood-black transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-robinhood-text-light mb-8">Debug Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Test */}
          <div className="bg-white dark:bg-robinhood-dark-gray rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-robinhood-text-light mb-4">Authentication Test</h2>
            <button
              onClick={testAuthentication}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Authentication
            </button>
          </div>

          {/* Media Test */}
          <div className="bg-white dark:bg-robinhood-dark-gray rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-robinhood-text-light mb-4">Media Test</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-robinhood-text-muted mb-2">
                  Select Project:
                </label>
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-robinhood-light-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-robinhood-black text-gray-900 dark:text-robinhood-text-light"
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title} (ID: {project.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={testProjectLoad}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Load Project
                </button>
                <button
                  onClick={testAddMedia}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Test Add Media
                </button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="lg:col-span-2 bg-white dark:bg-robinhood-dark-gray rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-robinhood-text-light">Test Results</h2>
              <button
                onClick={clearLogs}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Logs
              </button>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">No test results yet. Run a test to see output.</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug; 