import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { db } from '../database/init';

const router = Router();

// Get all tasks for user
router.get('/', authenticateToken, (req: any, res: Response) => {
  const userId = req.user.id;

  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId], (err: any, tasks: any) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(tasks);
  });
});

// Create new task
router.post('/', [
  authenticateToken,
  body('title').isLength({ min: 1 }).trim().escape(),
  body('description').optional().trim().escape(),
  body('priority').isIn(['low', 'medium', 'high']).optional(),
  body('due_date').optional().isISO8601()
], (req: any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.id;
  const { title, description, priority = 'medium', due_date } = req.body;

  db.run('INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)', 
    [userId, title, description, priority, due_date], function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error creating task' });
    }

    db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err: any, task: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving task' });
      }
      res.status(201).json(task);
    });
  });
});

// Update task
router.put('/:id', [
  authenticateToken,
  body('title').optional().isLength({ min: 1 }).trim().escape(),
  body('description').optional().trim().escape(),
  body('status').isIn(['pending', 'in_progress', 'completed']).optional(),
  body('priority').isIn(['low', 'medium', 'high']).optional(),
  body('due_date').optional().isISO8601()
], (req: any, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.id;
  const taskId = req.params.id;
  const updates = req.body;

  // Build update query dynamically
  const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), userId, taskId];

  db.run(`UPDATE tasks SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`, 
    values, function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error updating task' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err: any, task: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving task' });
      }
      res.json(task);
    });
  });
});

// Delete task
router.delete('/:id', authenticateToken, (req: any, res: Response) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  db.run('DELETE FROM tasks WHERE user_id = ? AND id = ?', [userId, taskId], function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting task' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

export { router as taskRoutes }; 