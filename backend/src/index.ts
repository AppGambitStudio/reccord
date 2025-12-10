import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDB } from './db';
import uploadRoute from './routes/upload';
import recordingsRoute from './routes/recordings';
import watermarksRoute from './routes/watermarks';
import folderRoutes from './routes/folders';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Serve recordings statically
const RECORDINGS_DIR = process.env.RECORDINGS_PATH || path.join(__dirname, '../../recordings');
if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR);
}
app.use('/recordings', express.static(RECORDINGS_DIR));
app.use('/uploads', express.static(process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api/upload', uploadRoute);
app.use('/api/recordings', recordingsRoute);
app.use('/api/watermarks', watermarksRoute);
app.use('/api/folders', folderRoutes);

app.get('/', (req, res) => {
    res.send('Reccord Backend is running');
});

// Initialize DB and start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
