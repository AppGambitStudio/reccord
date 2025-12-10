import express from 'express';
import multer from 'multer';
import path from 'path';
import { Recording } from '../db';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.RECORDINGS_PATH || path.join(__dirname, '../../../recordings');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    // @ts-ignore
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files['video']) {
        res.status(400).send('No video file uploaded.');
        return;
    }

    try {
        const videoFile = files['video'][0];
        const thumbnailFile = files['thumbnail'] ? files['thumbnail'][0] : null;
        const watermarkId = req.body.watermarkId ? parseInt(req.body.watermarkId) : null;

        // If watermark is selected, burn it in
        if (watermarkId) {
            const { Watermark } = require('../db');
            const fs = require('fs');
            const ffmpeg = require('fluent-ffmpeg');
            const ffmpegPath = require('ffmpeg-static');
            if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

            const watermark = await Watermark.findByPk(watermarkId);
            if (watermark) {
                const inputPath = videoFile.path;
                const tempOutputPath = path.join(path.dirname(inputPath), `temp-${videoFile.filename}`);
                const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../../uploads');
                const watermarkPath = path.join(uploadsPath, 'watermarks', watermark.filename);

                if (fs.existsSync(watermarkPath)) {
                    console.log(`Burning in watermark: ${watermarkPath} at ${watermark.position}`);

                    let overlayFilter = '';
                    const padding = 20;

                    switch (watermark.position) {
                        case 'top-left': overlayFilter = `overlay=${padding}:${padding}`; break;
                        case 'top-middle': overlayFilter = `overlay=(main_w-overlay_w)/2:${padding}`; break;
                        case 'top-right': overlayFilter = `overlay=main_w-overlay_w-${padding}:${padding}`; break;
                        case 'middle-left': overlayFilter = `overlay=${padding}:(main_h-overlay_h)/2`; break;
                        case 'middle-middle': overlayFilter = `overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2`; break;
                        case 'middle-right': overlayFilter = `overlay=main_w-overlay_w-${padding}:(main_h-overlay_h)/2`; break;
                        case 'bottom-left': overlayFilter = `overlay=${padding}:main_h-overlay_h-${padding}`; break;
                        case 'bottom-middle': overlayFilter = `overlay=(main_w-overlay_w)/2:main_h-overlay_h-${padding}`; break;
                        case 'bottom-right': overlayFilter = `overlay=main_w-overlay_w-${padding}:main_h-overlay_h-${padding}`; break;
                        default: overlayFilter = `overlay=main_w-overlay_w-${padding}:${padding}`;
                    }

                    await new Promise((resolve, reject) => {
                        ffmpeg(inputPath)
                            .input(watermarkPath)
                            .complexFilter([overlayFilter])
                            .outputOptions('-preset ultrafast') // Speed up burn-in
                            .output(tempOutputPath)
                            .on('end', () => {
                                // Replace original file with watermarked file
                                fs.unlinkSync(inputPath);
                                fs.renameSync(tempOutputPath, inputPath);
                                console.log('Watermark burn-in complete');
                                resolve(null);
                            })
                            .on('error', (err: any) => {
                                console.error('Watermark burn-in error:', err);
                                if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
                                reject(err);
                            })
                            .run();
                    });
                }
            }
        }

        const recording = await Recording.create({
            title: req.body.title || 'Untitled Recording',
            filename: videoFile.filename,
            thumbnailFilename: thumbnailFile ? thumbnailFile.filename : null,
            duration: req.body.duration ? parseInt(req.body.duration) : null,
            watermarkId: watermarkId,
        });
        res.json(recording);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving recording metadata.');
    }
});

export default router;
