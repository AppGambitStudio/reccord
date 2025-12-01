'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Video, Mic, StopCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const Recorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [duration, setDuration] = useState<number>(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const router = useRouter();

    const [watermarks, setWatermarks] = useState<any[]>([]);
    const [selectedWatermarkId, setSelectedWatermarkId] = useState<number | null>(null);

    useEffect(() => {
        // Fetch watermarks
        api.get('/watermarks').then(res => setWatermarks(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        // Cleanup camera stream on unmount
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    const startRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true // System audio
            });

            const userStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: { ideal: 1280 }, height: { ideal: 720 } } // Request HD for better bubble quality
            });

            setCameraStream(userStream);

            // Determine audio tracks
            let audioTracks: MediaStreamTrack[] = [];
            let audioContext: AudioContext | null = null;

            const hasSystemAudio = screenStream.getAudioTracks().length > 0;
            const hasMicAudio = userStream.getAudioTracks().length > 0;

            if (hasSystemAudio && hasMicAudio) {
                // Mix both
                console.log("Mixing system and mic audio");
                audioContext = new AudioContext();
                await audioContext.resume();
                const destination = audioContext.createMediaStreamDestination();

                const systemSource = audioContext.createMediaStreamSource(screenStream);
                const systemGain = audioContext.createGain();
                systemGain.gain.value = 1.0;
                systemSource.connect(systemGain).connect(destination);

                const micSource = audioContext.createMediaStreamSource(userStream);
                const micGain = audioContext.createGain();
                micGain.gain.value = 1.0;
                micSource.connect(micGain).connect(destination);

                audioTracks = destination.stream.getAudioTracks();
            } else if (hasSystemAudio) {
                console.log("Using system audio only");
                audioTracks = screenStream.getAudioTracks();
            } else if (hasMicAudio) {
                console.log("Using mic audio only");
                audioTracks = userStream.getAudioTracks();
            } else {
                console.log("No audio tracks found");
            }

            console.log("Selected audio tracks:", audioTracks);

            // Countdown sequence
            setCountdown(3);
            let count = 3;

            const timer = setInterval(() => {
                count--;
                if (count > 0) {
                    setCountdown(count);
                } else {
                    clearInterval(timer);
                    setCountdown(null);
                    console.log("Starting recording with tracks:", audioTracks);
                    beginRecording(screenStream, userStream, audioTracks, audioContext);
                }
            }, 1000);

            // Handle user stopping sharing via browser UI
            screenStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

        } catch (err) {
            console.error("Error starting recording:", err);
        }
    };

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const beginRecording = (
        screenStream: MediaStream,
        userStream: MediaStream,
        audioTracks: MediaStreamTrack[],
        audioContext: AudioContext | null
    ) => {
        console.log("beginRecording called with audioTracks:", audioTracks);

        // Setup Canvas for Composition
        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }

        // Video elements for source streams
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        screenVideo.play();

        const userVideo = document.createElement('video');
        userVideo.srcObject = userStream;
        userVideo.muted = true;
        userVideo.play();

        // Wait for metadata to set canvas size
        screenVideo.onloadedmetadata = () => {
            canvas.width = screenVideo.videoWidth;
            canvas.height = screenVideo.videoHeight;

            const draw = () => {
                if (!ctx) return;

                // Draw Screen
                ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

                // Draw Camera Bubble (Bottom Right)
                const bubbleSize = Math.min(canvas.width, canvas.height) * 0.2; // 20% of screen min dimension
                const padding = 30;
                const x = canvas.width - bubbleSize - padding;
                const y = canvas.height - bubbleSize - padding;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                // Draw user video (mirrored)
                ctx.translate(x + bubbleSize, y);
                ctx.scale(-1, 1);

                // Calculate center crop to preserve aspect ratio
                const videoAspect = userVideo.videoWidth / userVideo.videoHeight;
                let sx = 0, sy = 0, sWidth = userVideo.videoWidth, sHeight = userVideo.videoHeight;

                if (videoAspect > 1) {
                    // Landscape: Crop width
                    sWidth = userVideo.videoHeight; // Make width same as height (square)
                    sx = (userVideo.videoWidth - sWidth) / 2;
                } else {
                    // Portrait: Crop height
                    sHeight = userVideo.videoWidth; // Make height same as width (square)
                    sy = (userVideo.videoHeight - sHeight) / 2;
                }

                ctx.drawImage(userVideo, sx, sy, sWidth, sHeight, 0, 0, bubbleSize, bubbleSize);

                // Add border
                ctx.restore();
                ctx.beginPath();
                ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
                ctx.lineWidth = 5;
                ctx.strokeStyle = 'white';
                ctx.stroke();
            };

            // Use setInterval instead of requestAnimationFrame to avoid background throttling
            intervalRef.current = setInterval(draw, 1000 / 30); // 30 FPS
        };

        // Capture stream from canvas
        const canvasStream = canvas.captureStream(30); // 30 FPS

        // Combine tracks: Canvas video + Audio tracks
        const tracks = [
            ...canvasStream.getVideoTracks(),
            ...audioTracks
        ];

        console.log("Combined tracks for MediaRecorder:", tracks);
        audioTracks.forEach(t => {
            console.log(`Audio track ${t.id}: enabled=${t.enabled}, readyState=${t.readyState}, muted=${t.muted}`);
        });

        const combinedStream = new MediaStream(tracks);
        streamRef.current = combinedStream;

        // Try a simpler mimeType first, let browser choose defaults if possible
        const mimeType = 'video/webm';

        console.log("Using mimeType:", mimeType);

        const mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType
        });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);

            // Stop animation loop
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // Stop all tracks
            combinedStream.getTracks().forEach(track => track.stop());
            screenStream.getTracks().forEach(track => track.stop());
            userStream.getTracks().forEach(track => track.stop());

            // Clean up video elements
            screenVideo.pause();
            screenVideo.srcObject = null;
            userVideo.pause();
            userVideo.srcObject = null;

            if (audioContext) {
                audioContext.close();
            }
            setCameraStream(null);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setStartTime(Date.now());
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (startTime) {
                const end = Date.now();
                setDuration(Math.round((end - startTime) / 1000));
            }
        }
    };

    const generateThumbnail = async (videoBlob: Blob): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(videoBlob);
            video.muted = true;
            video.currentTime = 1; // Capture at 1 second

            video.onloadeddata = () => {
                // If video is shorter than 1s, use 0
                if (video.duration < 1) video.currentTime = 0;
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        resolve(blob);
                        URL.revokeObjectURL(video.src);
                    }, 'image/jpeg', 0.8);
                } else {
                    resolve(null);
                }
            };

            video.onerror = () => {
                resolve(null);
            };
        });
    };

    const uploadRecording = async () => {
        if (!chunksRef.current.length) return;

        setUploading(true);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });

        // Generate thumbnail
        const thumbnailBlob = await generateThumbnail(blob);

        const formData = new FormData();
        formData.append('video', blob, 'recording.webm');
        if (thumbnailBlob) {
            formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
        }
        formData.append('title', `Recording ${new Date().toLocaleString()}`);
        formData.append('duration', duration.toString());
        if (selectedWatermarkId) {
            formData.append('watermarkId', selectedWatermarkId.toString());
        }

        try {
            await api.post('/upload', formData);
            router.push('/'); // Go back to dashboard
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-4 relative overflow-hidden">
            {/* Camera Bubble - Only show when NOT recording to prevent double bubble (one from screen capture, one from canvas) */}
            {cameraStream && !isRecording && (
                <div className="fixed bottom-8 right-8 w-48 h-48 rounded-full border-4 border-white shadow-2xl overflow-hidden z-50 bg-black">
                    <video
                        ref={video => {
                            if (video) video.srcObject = cameraStream;
                        }}
                        autoPlay
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-9xl font-bold text-white animate-bounce">
                        {countdown}
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl bg-white rounded-xl border border-gray-200 p-8 shadow-2xl relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-gray-700 transition-colors font-medium flex items-center gap-2"
                    >
                        &larr; Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        New Recording
                    </h1>
                    <div className="w-24" /> {/* Spacer for centering */}
                </div>

                <div className="flex flex-col items-center gap-8">
                    {previewUrl ? (
                        <div className="w-full space-y-4">
                            <video src={previewUrl} controls className="w-full rounded-lg border border-gray-200 bg-black aspect-video" />
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => {
                                        setPreviewUrl(null);
                                        chunksRef.current = [];
                                    }}
                                    className="px-6 py-2 rounded-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all font-medium shadow-sm hover:shadow-md"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={uploadRecording}
                                    disabled={uploading}
                                    className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all font-medium flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg shadow-blue-600/20"
                                >
                                    {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                    Save Recording
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-12 rounded-full bg-gray-50 border-2 border-dashed border-gray-200">
                                <Video className="w-16 h-16 text-gray-400" />
                            </div>

                            {/* Watermark Selector */}
                            {!isRecording && watermarks.length > 0 && (
                                <div className="w-full max-w-xs">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Select Watermark (Optional)</label>
                                    <select
                                        value={selectedWatermarkId || ''}
                                        onChange={(e) => setSelectedWatermarkId(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    >
                                        <option value="">None</option>
                                        {watermarks.map(w => (
                                            <option key={w.id} value={w.id}>{w.name} ({w.position})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    className="group relative px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 transition-all transform hover:scale-105 shadow-xl shadow-red-600/20 text-white"
                                >
                                    <span className="flex items-center gap-3 text-lg font-bold">
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                                        Start Recording
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="px-8 py-4 rounded-full bg-white hover:bg-gray-50 border-2 border-red-100 text-red-600 hover:text-red-700 transition-all flex items-center gap-3 font-bold shadow-lg shadow-red-500/5"
                                >
                                    <StopCircle className="w-6 h-6" />
                                    Stop Recording
                                </button>
                            )}

                            <p className="text-gray-500 text-sm">
                                {isRecording ? "Recording in progress..." : "Capture screen and microphone"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recorder;
