"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const init_1 = require("../database/init");
const router = (0, express_1.Router)();
exports.uploadRoutes = router;
// Upload single file
router.post('/file', auth_1.authenticateToken, upload_1.upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Determine file type based on mimetype
        let type = 'doc';
        if (req.file.mimetype.startsWith('image/')) {
            type = 'image';
        }
        else if (req.file.mimetype.startsWith('video/')) {
            type = 'video';
        }
        const fileUrl = (0, upload_1.getFileUrl)(req.file.filename, type);
        res.json({
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl,
                type: type
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error uploading file' });
    }
});
// Upload multiple files
router.post('/files', auth_1.authenticateToken, upload_1.upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        const uploadedFiles = req.files.map((file) => {
            let type = 'doc';
            if (file.mimetype.startsWith('image/')) {
                type = 'image';
            }
            else if (file.mimetype.startsWith('video/')) {
                type = 'video';
            }
            return {
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: (0, upload_1.getFileUrl)(file.filename, type),
                type: type
            };
        });
        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error uploading files' });
    }
});
// Add uploaded file to project
router.post('/project/:projectId/media', auth_1.authenticateToken, (req, res) => {
    const projectId = req.params.projectId;
    const { filename, originalname, type, url } = req.body;
    if (!filename || !originalname || !type || !url) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    init_1.db.run('INSERT INTO project_media (project_id, type, url, filename) VALUES (?, ?, ?, ?)', [projectId, type, url, originalname], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error adding media to project' });
        }
        init_1.db.get('SELECT * FROM project_media WHERE id = ?', [this.lastID], (err, media) => {
            if (err) {
                return res.status(500).json({ message: 'Error retrieving media' });
            }
            res.status(201).json(media);
        });
    });
});
//# sourceMappingURL=upload.js.map