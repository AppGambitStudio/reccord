import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { Recording, Watermark } from '../db';

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

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
    const startTime = Date.now();
    console.log('[UPLOAD] Request received');
    // @ts-ignore
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files['video']) {
        console.log('[UPLOAD] No video file in request');
        res.status(400).send('No video file uploaded.');
        return;
    }

    console.log('[UPLOAD] Video file received, size:', files['video'][0].size, 'bytes');

    try {
        const videoFile = files['video'][0];
        const thumbnailFile = files['thumbnail'] ? files['thumbnail'][0] : null;
        const watermarkId = req.body.watermarkId ? parseInt(req.body.watermarkId) : null;
        const folderId = req.body.folderId && req.body.folderId !== 'null' ? parseInt(req.body.folderId) : null;

        // Create the recording record immediately
        const recording = await Recording.create({
            title: req.body.title || 'Untitled Recording',
            filename: videoFile.filename,
            thumbnailFilename: thumbnailFile ? thumbnailFile.filename : null,
            duration: req.body.duration ? parseInt(req.body.duration) : null,
            watermarkId: watermarkId,
            folderId: folderId,
            status: watermarkId ? 'processing' : 'completed'
        });

        console.log(`[UPLOAD] Recording record created: ID=${recording.get('id')}, title=${recording.get('title')}, status=${recording.get('status')}, folderId=${recording.get('folderId')}`);

        // Respond to the client immediately
        res.json(recording);
        console.log(`[UPLOAD] Response sent in ${Date.now() - startTime}ms for ID=${recording.get('id')}`);

        // If watermark is selected, burn it in in the background
        if (watermarkId) {
            setImmediate(async () => {
                const bgStartTime = Date.now();
                console.log(`[BACKGROUND] Starting processing for recording ${recording.get('id')}`);
                try {
                    const watermark = await Watermark.findByPk(watermarkId);
                    if (watermark) {
                        const inputPath = videoFile.path;
                        const tempOutputPath = path.join(path.dirname(inputPath), `temp-${videoFile.filename}`);
                        const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../../uploads');
                        const watermarkPath = path.join(uploadsPath, 'watermarks', (watermark as any).filename);

                        if (fs.existsSync(watermarkPath)) {
                            console.log(`[BACKGROUND] Burning in watermark: ${watermarkPath} at ${(watermark as any).position} for recording ${recording.get('id')}`);

                            let overlayFilter = '';
                            const padding = 20;

                            switch ((watermark as any).position) {
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
                                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                                        fs.renameSync(tempOutputPath, inputPath);
                                        console.log(`[BACKGROUND] Watermark burn-in complete for recording ${recording.get('id')} in ${Date.now() - bgStartTime}ms`);
                                        resolve(null);
                                    })
                                    .on('error', (err: any) => {
                                        console.error(`[BACKGROUND] Watermark burn-in error for recording ${recording.get('id')}:`, err);
                                        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
                                        reject(err);
                                    })
                                    .run();
                            });
                        }
                    }
                    // Update status to completed
                    await recording.update({ status: 'completed' });
                } catch (err) {
                    console.error(`[BACKGROUND] Error processing recording ${recording.get('id')}:`, err);
                    await recording.update({ status: 'failed' });
                }
            });
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).send('Error saving recording metadata.');
        }
    }
});

export default router;
