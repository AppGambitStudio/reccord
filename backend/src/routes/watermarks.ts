import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Watermark } from '../db';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../../uploads');
        const uploadDir = path.join(uploadsPath, 'watermarks');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all watermarks
router.get('/', async (req, res) => {
    try {
        const watermarks = await Watermark.findAll();
        res.json(watermarks);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching watermarks');
    }
});

// Create new watermark
router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) {
        res.status(400).send('No image uploaded');
        return;
    }

    try {
        const watermark = await Watermark.create({
            name: req.body.name || 'Untitled Watermark',
            filename: req.file.filename,
            position: req.body.position || 'top-right',
        });
        res.json(watermark);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating watermark');
    }
});

// Delete watermark
router.delete('/:id', async (req, res) => {
    try {
        const watermark = await Watermark.findByPk(req.params.id);
        if (!watermark) {
            res.status(404).send('Watermark not found');
            return;
        }

        // @ts-ignore
        const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../../uploads');
        // @ts-ignore
        const filePath = path.join(uploadsPath, 'watermarks', watermark.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await watermark.destroy();
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting watermark');
    }
});

export default router;
