import { useEffect, useRef, useMemo } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";
import { updateVideoProgress, markVideoComplete } from "../../api/videoApi";
import { toast } from "sonner";

interface VideoPlayerProps {
    videoId: string;      // YouTube Video ID
    dbVideoId: string;    // Database Video ID
    initialProgress?: number; // Initial watched seconds
    onProgressUpdate?: (seconds: number, percent: number) => void;
    onComplete?: () => void;
    className?: string;
}

const VideoPlayer = ({
    videoId,
    dbVideoId,
    initialProgress = 0,
    onProgressUpdate,
    onComplete,
    className
}: VideoPlayerProps) => {
    const playerRef = useRef<any>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    // Save progress every 10 seconds
    useEffect(() => {
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, []);

    const saveProgress = async () => {
        if (!playerRef.current) return;

        try {
            const currentTime = await playerRef.current.getCurrentTime();
            const duration = await playerRef.current.getDuration();

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
    };

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        playerRef.current = event.target;

        if (initialProgress > 0) {
            toast.info("Resumed from where you left off");
        }
    };

    const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
        // 1 = Playing, 2 = Paused, 0 = Ended
        if (event.data === 1) {
            // Start tracking interval
            if (!progressInterval.current) {
                progressInterval.current = setInterval(saveProgress, 10000);
            }
        } else {
            // Stop tracking interval
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
            // Save progress immediately on pause
            if (event.data === 2) {
                saveProgress();
            }
        }

        // Ended
        if (event.data === 0) {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        try {
            await markVideoComplete(dbVideoId);
            if (onComplete) onComplete();
            toast.success("Video completed!");
        } catch (error) {
            console.error("Failed to mark complete", error);
        }
    };

    const opts: YouTubeProps['opts'] = useMemo(() => ({
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            start: Math.floor(initialProgress),
            rel: 0, // Only show related videos from the same channel
            modestbranding: 1, // Hide YouTube logo in control bar
        },
    }), [dbVideoId]);

    return (
        <div className={`aspect-video w-full ${className}`}>
            <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        </div>
    );
};

export default VideoPlayer;
