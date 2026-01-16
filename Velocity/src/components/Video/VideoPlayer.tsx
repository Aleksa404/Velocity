import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";
import { updateVideoProgress, markVideoComplete } from "../../api/videoApi";
import { toast } from "sonner";
import { getFullVideoUrl, getYouTubeId, isYouTubeUrl } from "@/lib/videoUtils";

interface VideoPlayerProps {
    videoUrl: string;         // Video URL (local path or YouTube URL)
    dbVideoId: string;        // Database Video ID
    initialProgress?: number; // Initial watched seconds
    onProgressUpdate?: (seconds: number, percent: number) => void;
    onComplete?: () => void;
    className?: string;
}

const VideoPlayer = ({
    videoUrl,
    dbVideoId,
    initialProgress = 0,
    onProgressUpdate,
    onComplete,
    className
}: VideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const youtubePlayerRef = useRef<any>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const hasResumedRef = useRef(false);

    // Store start time in state to prevent re-initialization on props update
    const [startTime] = useState(initialProgress);

    const isYouTube = useMemo(() => isYouTubeUrl(videoUrl), [videoUrl]);
    const youtubeId = useMemo(() => isYouTube ? getYouTubeId(videoUrl) : null, [videoUrl, isYouTube]);
    const fullVideoUrl = useMemo(() => getFullVideoUrl(videoUrl), [videoUrl]);

    // ============== LOCAL VIDEO HANDLERS ==============
    const saveProgressLocal = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            const currentTime = video.currentTime;
            const duration = video.duration;

            if (duration > 0 && !isNaN(duration)) {
                await updateVideoProgress(dbVideoId, {
                    watchedSeconds: Math.floor(currentTime),
                    totalDuration: Math.floor(duration)
                });

                const percent = Math.min(Math.floor((currentTime / duration) * 100), 100);
                if (onProgressUpdate) {
                    onProgressUpdate(Math.floor(currentTime), percent);
                }
            }
        } catch (error) {
            console.error("Failed to save progress", error);
        }
    }, [dbVideoId, onProgressUpdate]);

    // ============== YOUTUBE HANDLERS ==============
    const saveProgressYouTube = useCallback(async () => {
        if (!youtubePlayerRef.current) return;

        try {
            const currentTime = await youtubePlayerRef.current.getCurrentTime();
            const duration = await youtubePlayerRef.current.getDuration();

            if (duration > 0) {
                await updateVideoProgress(dbVideoId, {
                    watchedSeconds: Math.floor(currentTime),
                    totalDuration: Math.floor(duration)
                });

                const percent = Math.min(Math.floor((currentTime / duration) * 100), 100);
                if (onProgressUpdate) {
                    onProgressUpdate(Math.floor(currentTime), percent);
                }
            }
        } catch (error) {
            console.error("Failed to save progress", error);
        }
    }, [dbVideoId, onProgressUpdate]);

    const onYouTubeReady: YouTubeProps['onReady'] = (event) => {
        youtubePlayerRef.current = event.target;
        if (startTime > 0 && !hasResumedRef.current) {
            hasResumedRef.current = true;
            toast.info("Resumed from where you left off");
        }
    };

    const onYouTubeStateChange: YouTubeProps['onStateChange'] = (event) => {
        // 1 = Playing, 2 = Paused, 0 = Ended
        if (event.data === 1) {
            if (!progressInterval.current) {
                progressInterval.current = setInterval(saveProgressYouTube, 10000);
            }
        } else {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
            if (event.data === 2) {
                saveProgressYouTube();
            }
        }

        if (event.data === 0) {
            handleComplete();
        }
    };

    const youtubeOpts: YouTubeProps['opts'] = useMemo(() => ({
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            start: Math.floor(startTime),
            rel: 0,
            modestbranding: 1,
        },
    }), [startTime]);

    // ============== SHARED HANDLERS ==============
    const handleComplete = useCallback(async () => {
        try {
            await markVideoComplete(dbVideoId);
            if (onComplete) onComplete();
            toast.success("Video completed!");
        } catch (error) {
            console.error("Failed to mark complete", error);
        }
    }, [dbVideoId, onComplete]);

    // Local video event listeners
    useEffect(() => {
        if (isYouTube) return;

        const video = videoRef.current;
        if (!video) return;

        const onLoadedMetadata = () => {
            if (startTime > 0 && !hasResumedRef.current) {
                video.currentTime = startTime;
                hasResumedRef.current = true;
                toast.info("Resumed from where you left off");
            }
        };

        const onPlay = () => {
            if (!progressInterval.current) {
                progressInterval.current = setInterval(saveProgressLocal, 10000);
            }
        };

        const onPause = () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
            saveProgressLocal();
        };

        const onEnded = () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
            handleComplete();
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("ended", onEnded);

        return () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("ended", onEnded);
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, [isYouTube, startTime, saveProgressLocal, handleComplete]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, []);

    // ============== RENDER ==============
    if (isYouTube && youtubeId) {
        return (
            <div className={`aspect-video w-full ${className}`}>
                <YouTube
                    videoId={youtubeId}
                    opts={youtubeOpts}
                    onReady={onYouTubeReady}
                    onStateChange={onYouTubeStateChange}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                />
            </div>
        );
    }

    return (
        <div className={`aspect-video w-full bg-black rounded-lg overflow-hidden ${className}`}>
            <video
                ref={videoRef}
                src={fullVideoUrl}
                controls
                autoPlay
                className="w-full h-full"
                playsInline
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoPlayer;
