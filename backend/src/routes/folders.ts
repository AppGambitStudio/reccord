import express from 'express';
import { Folder, Recording } from '../db';

const router = express.Router();

// Get all folders
router.get('/', async (req, res) => {
    try {
        const folders = await Folder.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: Recording, attributes: ['id'] }] // Optional: count recordings
        });
        res.json(folders);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
});

// Create a new folder
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }
        const folder = await Folder.create({ name });
        res.json(folder);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// Rename a folder
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const folder = await Folder.findByPk(id);
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }
        await folder.update({ name });
        res.json(folder);
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// Delete a folder
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const folder = await Folder.findByPk(id);
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }
        // Recordings in this folder will have folderId set to null due to database constraint or we might need to handle it.
        // In our migration we set ON DELETE SET NULL, but Sequelize might need explicit handling or it relies on DB.
        // Let's rely on DB constraint or valid logic.
        await folder.destroy();
        res.json({ message: 'Folder deleted' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

export default router;
