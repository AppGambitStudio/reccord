# Reccord

Reccord is a powerful, open-source local screen recording application built with modern web technologies. It allows you to capture your screen, microphone, and camera with ease, saving everything locally for privacy and speed.

<video src="assets/demo.mp4" controls="controls" style="max-width: 100%;">
  Your browser does not support the video tag.
</video>

## Features

- **🎥 Screen Recording**: Capture your entire screen, specific window, or browser tab.
- **👤 Camera Bubble**: Overlay your camera feed in a draggable bubble during recording.
- **🎙️ Microphone Audio**: Record high-quality voiceovers along with your screen.
- **⏱️ Countdown**: 3-second countdown to get you ready.
- **💾 Local Storage**: All recordings are saved locally to your disk (`backend/recordings`) - no cloud upload required.
- **🖼️ Watermarking**: Add custom watermarks to your videos with position control.
- **📤 Video Export**: Export recordings to MP4 with optimized settings for web playback.
- **📊 Dashboard**: Manage, view, and play back your recordings in a clean interface.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Database**: [SQLite](https://www.sqlite.org/) with [Sequelize](https://sequelize.org/) ORM
- **Video Processing**: [FFmpeg](https://ffmpeg.org/) (via `fluent-ffmpeg` and `ffmpeg-static`)

## Prerequisites

- Node.js (v18+ recommended)
- npm

## Setup & Running

### 1. Backend

The backend handles file storage, database operations, and video processing. It runs on port **5005**.

```bash
cd backend
npm install
npm run dev
```
- API URL: `http://localhost:5005/api`
- Static Files: `http://localhost:5005/recordings`

### 2. Frontend

The frontend provides the user interface for recording and managing videos. It runs on port **5006**.

```bash
cd frontend
npm install
npm run dev
```
- App URL: `http://localhost:5006`

## Usage

1.  Open `http://localhost:5006` in your browser.
2.  Click **"New Recording"** to start the recording flow.
3.  Grant necessary permissions for screen and microphone access.
4.  After recording, save your video.
5.  Use the dashboard to view, watermark, or export your recordings.

## Troubleshooting

- **Ports**: Ensure ports 5005 and 5006 are free.
- **Permissions**: You must allow camera/microphone access in your browser when prompted.
- **Video Export**: Exporting uses FFmpeg. Ensure your system can run the static binaries provided by `ffmpeg-static`.

## Commercial Support & Hosting

Need a hosted version of Reccord for your team? Or looking for custom features like:
- ☁️ Cloud Storage & Sharing
- 🔐 Team Authentication (SSO)
- 📝 AI Transcriptions & Summaries
- 🎨 Custom Branding & White-labeling

Reach out to **dhaval@appgambit.com** to discuss your requirements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
