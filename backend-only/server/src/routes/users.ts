import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../database/init';

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, (req: any, res: Response) => {
  const userId = req.user.id;

  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [userId], (err: any, user: any) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });
});

// Update user profile
router.put('/profile', authenticateToken, (req: any, res: Response) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  db.run('UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [username, email, userId], function(this: any, err: any) {
    if (err) {
      return res.status(500).json({ message: 'Error updating user' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
});

export { router as userRoutes }; 