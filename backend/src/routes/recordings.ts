import express from 'express';
import { Recording, Watermark } from '../db';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const recordings = await Recording.findAll({
            order: [['createdAt', 'DESC']],
            include: [Watermark]
        });
        res.json(recordings);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching recordings.');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const recording = await Recording.findByPk(id);
        if (!recording) {
            res.status(404).send('Recording not found');
            return;
        }
        await recording.update({ title });
        res.json(recording);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating recording.');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const recording = await Recording.findByPk(id);
        if (!recording) {
            res.status(404).send('Recording not found');
            return;
        }

        // Delete file
        // @ts-ignore
        const filename = recording.filename;
        const filePath = path.join(__dirname, '../../../recordings', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await recording.destroy();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting recording.');
    }
});

router.get('/:id/export', async (req, res) => {
    try {
        const { id } = req.params;
        const recording = await Recording.findByPk(id);
        if (!recording) {
            res.status(404).send('Recording not found');
            return;
        }

        // @ts-ignore
        const filename = recording.filename;
        // @ts-ignore
        const watermarkId = recording.watermarkId;

        const inputPath = path.join(__dirname, '../../../recordings', filename);
        const outputPath = path.join(__dirname, '../../../recordings', `export-${id}.mp4`);

        if (!fs.existsSync(inputPath)) {
            res.status(404).send('Source file not found');
            return;
        }

        console.log(`Starting export for ${id} to ${outputPath}`);

        // Watermark is already burned in at upload time
        let command = ffmpeg(inputPath);

        command
            .output(outputPath)
            .format('mp4')
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions('-preset medium') // Safer preset for stability
            .outputOptions('-crf 23') // Reasonable quality
            .outputOptions('-r 30') // Force Constant Frame Rate (CFR)
            .outputOptions('-g 60') // Force keyframe every 2 seconds (at 30fps)
            .outputOptions('-profile:v main') // High compatibility profile
            .outputOptions('-level 3.1') // High compatibility level
            .outputOptions('-vf scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p') // Ensure even dimensions and correct pixel format
            .outputOptions('-movflags +faststart') // Enable fast start for web playback
            .on('end', () => {
                console.log('Conversion finished');
                res.download(outputPath, `${filename.replace('.webm', '')}.mp4`, (err) => {
                    if (err) console.error("Download error:", err);
                    // Cleanup temp file
                    if (fs.existsSync(outputPath)) {
                        fs.unlinkSync(outputPath);
                    }
                });
            })
            .on('error', (err: any) => {
                console.error('Conversion error:', err);
                res.status(500).send('Error converting file');
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            })
            .run();

    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting recording.');
    }
});

export default router;
