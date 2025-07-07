"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const init_1 = require("../database/init");
const router = (0, express_1.Router)();
exports.userRoutes = router;
// Get user profile
router.get('/profile', auth_1.authenticateToken, (req, res) => {
    const userId = req.user.id;
    init_1.db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [userId], (err, user) => {
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
router.put('/profile', auth_1.authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
    }
    init_1.db.run('UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [username, email, userId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
});
//# sourceMappingURL=users.js.map