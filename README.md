# Mini-Loom

Mini-Loom is a local screen recording application that allows you to capture your screen, microphone, and camera, and save recordings locally.

## Features
- **Screen Recording**: Capture your entire screen, window, or browser tab.
- **Camera Bubble**: Overlay your camera feed in a bubble during recording.
- **Microphone Audio**: Record your voice along with the screen.
- **Countdown**: 3-second countdown before recording starts.
- **Local Storage**: Recordings are saved to your local disk (`backend/recordings`).
- **Dashboard**: View and play back your recordings.

## Prerequisites
- Node.js installed (v18+ recommended).
- npm installed.

## Setup & Running

### 1. Backend
The backend runs on port **5005**.

```bash
cd backend
npm install
npm run dev
```
- API URL: `http://localhost:5005/api`
- Static Files: `http://localhost:5005/recordings`

### 2. Frontend
The frontend runs on port **5006**.

```bash
cd frontend
npm install
npm run dev
```
- App URL: `http://localhost:5006`

## Usage
1.  Open `http://localhost:5006` in your browser.
2.  Click **"New Recording"**.
3.  Grant permissions and start recording.
4.  Save your recording to view it on the dashboard.

## Troubleshooting
- **Ports**: Ensure ports 5005 and 5006 are free.
- **Permissions**: You must allow camera/microphone access in your browser.
