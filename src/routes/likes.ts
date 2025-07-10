import express from 'express';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get likes for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    db.all(`
      SELECT 
        l.id,
        l.created_at,
        u.username as author
      FROM project_likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.project_id = ?
      ORDER BY l.created_at DESC
    `, [projectId], (err, likes) => {
      if (err) {
        console.error('Error fetching likes:', err);
        return res.status(500).json({ error: 'Failed to fetch likes' });
      }
      
      res.json(likes);
    });
  } catch (error) {
    console.error('Error in GET /likes/project/:projectId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle like for a project
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = (req as any).user.id;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    // Check if user already liked the project
    db.get(`
      SELECT id FROM project_likes 
      WHERE project_id = ? AND user_id = ?
    `, [projectId, userId], (err, existingLike) => {
      if (err) {
        console.error('Error checking existing like:', err);
        return res.status(500).json({ error: 'Failed to check existing like' });
      }
      
      if (existingLike) {
        // Unlike the project
        db.run('DELETE FROM project_likes WHERE project_id = ? AND user_id = ?', 
          [projectId, userId], function(err) {
          if (err) {
            console.error('Error removing like:', err);
            return res.status(500).json({ error: 'Failed to remove like' });
          }
          
          res.json({ liked: false, message: 'Like removed' });
        });
      } else {
        // Like the project
        db.run('INSERT INTO project_likes (project_id, user_id) VALUES (?, ?)', 
          [projectId, userId], function(err) {
          if (err) {
            console.error('Error adding like:', err);
            return res.status(500).json({ error: 'Failed to add like' });
          }
          
          res.json({ liked: true, message: 'Project liked' });
        });
      }
    });
  } catch (error) {
    console.error('Error in POST /likes/toggle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if current user has liked a project
router.get('/check/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    
    db.get(`
      SELECT id FROM project_likes 
      WHERE project_id = ? AND user_id = ?
    `, [projectId, userId], (err, like) => {
      if (err) {
        console.error('Error checking like status:', err);
        return res.status(500).json({ error: 'Failed to check like status' });
      }
      
      res.json({ liked: !!like });
    });
  } catch (error) {
    console.error('Error in GET /likes/check/:projectId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 