
## High-level architecture

### Features to aim for (local Loom v1):

- Record:
    - Screen (a window, tab, or entire screen)
    - Optional camera bubble
    - Microphone audio
    - Preview recording

- Save recording:
    - Either directly to file from browser (no backend) or
    - Upload to Node.js, store in /recordings folder and serve it back via URL


## Application structure

### Frontend Tech

- navigator.mediaDevices.getDisplayMedia() – capture screen
- navigator.mediaDevices.getUserMedia() – capture camera + mic
- MediaRecorder – record streams as chunks (WebM)
- URL.createObjectURL() – local preview of Blob
- fetch() – upload recording to Node backend

### Backend Tech

- express – simple HTTP server
- multer or raw stream handling – accept file uploads
- File system (fs) – save recordings to disk
- Serve /recordings as static files

## Authentication

- Let's start with No Authentication for now, we can add one later

## Database

- Let's start with a local sqlite database for now for all the settings, user data and recording metadata

## Making it feel more “Loom-like”

### Once core recording works, you can polish:

- Camera bubble overlay
- Use a separate getUserMedia stream, render it in <video> positioned at bottom-right.
- You don’t have to mix it into the recorded stream initially; just visually overlay it.

### Countdown & UX

- Show 3…2…1… before starting recording.
- Visual red dot indicator during recording.

### Recording list page

- Store metadata in a small JSON/SQLite.
- API GET /api/recordings to list all recordings stored in recordings/.

### Transcode to MP4 (optional)

- Install FFmpeg on local machine.
- After upload, spawn ffmpeg process from Node to convert .webm → .mp4.

### “Share link” (local)

- You already have http://localhost:4000/recordings/<id>.webm
- For real sharing beyond your laptop, you’d eventually deploy to a server / tunnel (ngrok, etc.), but for now local URLs are enough.