import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { db } from '../database/init';

const router = Router();

// Get all projects
router.get('/', (req: Request, res: Response) => {
  db.all('SELECT * FROM projects ORDER BY created_at DESC', (err: any, projects: any) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    // Get media for each project
    const projectsWithMedia = projects.map((project: any) => {
      return new Promise((resolve) => {
        db.all('SELECT * FROM project_media WHERE project_id = ?', [project.id], (err: any, media: any) => {
          if (err) {
            resolve({ ...project, media: [] });
          } else {
            resolve({ ...project, media: media || [] });
          }
        });
      });
    });
    
    Promise.all(projectsWithMedia).then((projectsWithMedia) => {
      res.json(projectsWithMedia);
    });
  });
});

// Get single project
router.get('/:id', (req: Request, res: Response) => {
  const projectId = req.params.id;
  
  db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err: any, project: any) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get project media
    db.all('SELECT * FROM project_media WHERE project_id = ?', [projectId], (err: any, media: any) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ ...project, media });
    });
  });
});

// Create new project (admin only)
router.post('/', [
  authenticateToken,
  body('title').isLength({ min: 1 }).trim().escape(),
  body('description').optional().trim().escape(),
  body('thumbnail').optional()
], (req: any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, thumbnail } = req.body;

  db.run('INSERT INTO projects (title, description, thumbnail) VALUES (?, ?, ?)', 
    [title, description, thumbnail || null], function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error creating project' });
    }

    db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err: any, project: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving project' });
      }
      res.status(201).json({ ...project, media: [] });
    });
  });
});

// Update project
router.put('/:id', [
  authenticateToken,
  body('title').optional().isLength({ min: 1 }).trim().escape(),
  body('description').optional().trim().escape(),
  body('thumbnail').optional().isURL()
], (req: any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const projectId = req.params.id;
  const updates = req.body;

  const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), projectId];

  db.run(`UPDATE projects SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
    values, function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error updating project' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err: any, project: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving project' });
      }
      res.json(project);
    });
  });
});

// Delete project
router.delete('/:id', authenticateToken, (req: any, res: Response) => {
  const projectId = req.params.id;

  db.run('DELETE FROM projects WHERE id = ?', [projectId], function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting project' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  });
});

// Add media to project
router.post('/:id/media', [
  authenticateToken,
  body('type').isIn(['video', 'image', 'doc']),
  body('url').isLength({ min: 1 }), // Allow relative URLs
  body('filename').isLength({ min: 1 }),
  body('thumbnailUrl').optional().isLength({ min: 1 })
], (req: any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const projectId = req.params.id;
  const { type, url, filename, thumbnailUrl } = req.body;

  console.log('Adding media to project:', { projectId, type, url, filename, thumbnailUrl });

  db.run('INSERT INTO project_media (project_id, type, url, filename, thumbnail_url) VALUES (?, ?, ?, ?, ?)', 
    [projectId, type, url, filename, thumbnailUrl || null], function(this: any, err: any) {
    if (err) {
      console.error('Database error adding media:', err);
      return res.status(500).json({ message: 'Error adding media' });
    }

    db.get('SELECT * FROM project_media WHERE id = ?', [this.lastID], (err: any, media: any) => {
      if (err) {
        console.error('Database error retrieving media:', err);
        return res.status(500).json({ message: 'Error retrieving media' });
      }
      console.log('Media added successfully:', media);
      res.status(201).json(media);
    });
  });
});

// Delete media from project
router.delete('/:id/media/:mediaId', authenticateToken, (req: any, res: Response) => {
  const { mediaId } = req.params;

  db.run('DELETE FROM project_media WHERE id = ?', [mediaId], function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting media' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Media not found' });
    }
    res.json({ message: 'Media deleted successfully' });
  });
});

// Share project via email
router.post('/:id/share', [
  authenticateToken,
  body('email').isEmail().normalizeEmail(),
  body('message').optional().trim().escape()
], (req: any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const projectId = req.params.id;
  const { email, message } = req.body;

  // Get project details
  db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err: any, project: any) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // In a real application, you would send an email here
    // For now, we'll just log the share attempt
    console.log(`Project "${project.title}" shared with ${email}`);
    if (message) {
      console.log(`Message: ${message}`);
    }

    // Return success response
    res.json({ 
      message: 'Project shared successfully',
      sharedWith: email,
      projectTitle: project.title
    });
  });
});

export { router as projectRoutes }; 