"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const init_1 = require("../database/init");
const router = (0, express_1.Router)();
exports.projectRoutes = router;
// Get all projects
router.get('/', (req, res) => {
    init_1.db.all('SELECT * FROM projects ORDER BY created_at DESC', (err, projects) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        // Get media for each project
        const projectsWithMedia = projects.map((project) => {
            return new Promise((resolve) => {
                init_1.db.all('SELECT * FROM project_media WHERE project_id = ?', [project.id], (err, media) => {
                    if (err) {
                        resolve({ ...project, media: [] });
                    }
                    else {
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
router.get('/:id', (req, res) => {
    const projectId = req.params.id;
    init_1.db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        // Get project media
        init_1.db.all('SELECT * FROM project_media WHERE project_id = ?', [projectId], (err, media) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            res.json({ ...project, media });
        });
    });
});
// Create new project (admin only)
router.post('/', [
    auth_1.authenticateToken,
    (0, express_validator_1.body)('title').isLength({ min: 1 }).trim().escape(),
    (0, express_validator_1.body)('description').optional().trim().escape(),
    (0, express_validator_1.body)('thumbnail').optional()
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, thumbnail } = req.body;
    init_1.db.run('INSERT INTO projects (title, description, thumbnail) VALUES (?, ?, ?)', [title, description, thumbnail || null], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error creating project' });
        }
        init_1.db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err, project) => {
            if (err) {
                return res.status(500).json({ message: 'Error retrieving project' });
            }
            res.status(201).json({ ...project, media: [] });
        });
    });
});
// Update project
router.put('/:id', [
    auth_1.authenticateToken,
    (0, express_validator_1.body)('title').optional().isLength({ min: 1 }).trim().escape(),
    (0, express_validator_1.body)('description').optional().trim().escape(),
    (0, express_validator_1.body)('thumbnail').optional().isURL()
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const projectId = req.params.id;
    const updates = req.body;
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), projectId];
    init_1.db.run(`UPDATE projects SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating project' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        init_1.db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
            if (err) {
                return res.status(500).json({ message: 'Error retrieving project' });
            }
            res.json(project);
        });
    });
});
// Delete project
router.delete('/:id', auth_1.authenticateToken, (req, res) => {
    const projectId = req.params.id;
    init_1.db.run('DELETE FROM projects WHERE id = ?', [projectId], function (err) {
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
    auth_1.authenticateToken,
    (0, express_validator_1.body)('type').isIn(['video', 'image', 'doc']),
    (0, express_validator_1.body)('url').isURL(),
    (0, express_validator_1.body)('filename').isLength({ min: 1 })
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const projectId = req.params.id;
    const { type, url, filename } = req.body;
    init_1.db.run('INSERT INTO project_media (project_id, type, url, filename) VALUES (?, ?, ?, ?)', [projectId, type, url, filename], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error adding media' });
        }
        init_1.db.get('SELECT * FROM project_media WHERE id = ?', [this.lastID], (err, media) => {
            if (err) {
                return res.status(500).json({ message: 'Error retrieving media' });
            }
            res.status(201).json(media);
        });
    });
});
// Delete media from project
router.delete('/:id/media/:mediaId', auth_1.authenticateToken, (req, res) => {
    const { mediaId } = req.params;
    init_1.db.run('DELETE FROM project_media WHERE id = ?', [mediaId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting media' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Media not found' });
        }
        res.json({ message: 'Media deleted successfully' });
    });
});
//# sourceMappingURL=projects.js.map