"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const init_1 = require("../database/init");
const router = (0, express_1.Router)();
exports.taskRoutes = router;
// Get all tasks for user
router.get('/', auth_1.authenticateToken, (req, res) => {
    const userId = req.user.id;
    init_1.db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, tasks) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(tasks);
    });
});
// Create new task
router.post('/', [
    auth_1.authenticateToken,
    (0, express_validator_1.body)('title').isLength({ min: 1 }).trim().escape(),
    (0, express_validator_1.body)('description').optional().trim().escape(),
    (0, express_validator_1.body)('priority').isIn(['low', 'medium', 'high']).optional(),
    (0, express_validator_1.body)('due_date').optional().isISO8601()
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userId = req.user.id;
    const { title, description, priority = 'medium', due_date } = req.body;
    init_1.db.run('INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)', [userId, title, description, priority, due_date], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error creating task' });
        }
        init_1.db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, task) => {
            if (err) {
                return res.status(500).json({ message: 'Error retrieving task' });
            }
            res.status(201).json(task);
        });
    });
});
// Update task
router.put('/:id', [
    auth_1.authenticateToken,
    (0, express_validator_1.body)('title').optional().isLength({ min: 1 }).trim().escape(),
    (0, express_validator_1.body)('description').optional().trim().escape(),
    (0, express_validator_1.body)('status').isIn(['pending', 'in_progress', 'completed']).optional(),
    (0, express_validator_1.body)('priority').isIn(['low', 'medium', 'high']).optional(),
    (0, express_validator_1.body)('due_date').optional().isISO8601()
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userId = req.user.id;
    const taskId = req.params.id;
    const updates = req.body;
    // Build update query dynamically
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), userId, taskId];
    init_1.db.run(`UPDATE tasks SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`, values, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating task' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        init_1.db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
            if (err) {
                return res.status(500).json({ message: 'Error retrieving task' });
            }
            res.json(task);
        });
    });
});
// Delete task
router.delete('/:id', auth_1.authenticateToken, (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;
    init_1.db.run('DELETE FROM tasks WHERE user_id = ? AND id = ?', [userId, taskId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting task' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    });
});
//# sourceMappingURL=tasks.js.map