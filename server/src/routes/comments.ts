import express from 'express';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all comments for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    db.all(`
      SELECT 
        c.id,
        c.text,
        c.created_at,
        u.username as author
      FROM project_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.project_id = ?
      ORDER BY c.created_at DESC
    `, [projectId], (err, comments) => {
      if (err) {
        console.error('Error fetching comments:', err);
        return res.status(500).json({ error: 'Failed to fetch comments' });
      }
      
      res.json(comments);
    });
  } catch (error) {
    console.error('Error in GET /comments/project/:projectId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, text } = req.body;
    const userId = (req as any).user.id;
    
    if (!projectId || !text) {
      return res.status(400).json({ error: 'Project ID and text are required' });
    }
    
    db.run(`
      INSERT INTO project_comments (project_id, user_id, text)
      VALUES (?, ?, ?)
    `, [projectId, userId, text], function(err) {
      if (err) {
        console.error('Error adding comment:', err);
        return res.status(500).json({ error: 'Failed to add comment' });
      }
      
      // Get the newly created comment with user info
      db.get(`
        SELECT 
          c.id,
          c.text,
          c.created_at,
          u.username as author
        FROM project_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `, [this.lastID], (err, comment) => {
        if (err) {
          console.error('Error fetching new comment:', err);
          return res.status(500).json({ error: 'Comment added but failed to fetch details' });
        }
        
        res.status(201).json(comment);
      });
    });
  } catch (error) {
    console.error('Error in POST /comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment (only by the author)
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user.id;
    
    // First check if the comment exists and belongs to the user
    db.get(`
      SELECT id FROM project_comments 
      WHERE id = ? AND user_id = ?
    `, [commentId, userId], (err, comment) => {
      if (err) {
        console.error('Error checking comment ownership:', err);
        return res.status(500).json({ error: 'Failed to check comment ownership' });
      }
      
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or you do not have permission to delete it' });
      }
      
      // Delete the comment
      db.run('DELETE FROM project_comments WHERE id = ?', [commentId], function(err) {
        if (err) {
          console.error('Error deleting comment:', err);
          return res.status(500).json({ error: 'Failed to delete comment' });
        }
        
        res.json({ message: 'Comment deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /comments/:commentId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 