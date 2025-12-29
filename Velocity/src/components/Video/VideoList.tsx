import { useEffect, useState } from "react";
import { getVideos } from "../../api/videoApi";
import { type Video } from "../../Types/Video";
import VideoCard from "./VideoCard";

const VideoList = ({ workshopId, refreshTrigger = 0 }: { workshopId: string, refreshTrigger?: number }) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

    const fetchVideos = async () => {
        // loading not set to true here to avoid UI flicker on background refresh
        const result = await getVideos(workshopId);
        if (result.success) {
            setVideos(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true); // Only show loading spinner on initial mount
        fetchVideos();
    }, [refreshTrigger]);

    const handleProgressUpdate = (videoId: string, watchedSeconds: number, percent: number) => {
        setVideos(prevVideos => {
            return prevVideos.map(v => {
                if (v.id === videoId) {
                    const currentProgress = v.watchProgress?.[0] || {
                        id: "temp",
                        userId: "", // We might not have user ID here easily but it doesn't matter for UI
                        videoId: videoId,
                        watchedSeconds: 0,
                        totalDuration: 0,
                        percentWatched: 0,
                        isCompleted: false,
                        lastWatchedAt: new Date().toISOString()
                    };

                    return {
                        ...v,
                        watchProgress: [{
                            ...currentProgress,
                            watchedSeconds,
                            percentWatched: percent,
                            lastWatchedAt: new Date().toISOString()
                        }]
                    };
                }
                return v;
            });
        });
    };



    if (loading) {
        return <div className="text-center py-10">Loading videos...</div>;
    }

    if (videos.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No videos posted yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
                <VideoCard
                    key={video.id}
                    video={video}
                    isPlaying={playingVideoId === video.id}
                    onPlay={() => setPlayingVideoId(video.id)}
                    onComplete={() => {
                        fetchVideos(); // Refresh list to show "Watched" badge immediately
                    }}
                    onProgressUpdate={(seconds, percent) =>
                        handleProgressUpdate(video.id, seconds, percent)
                    }
                />
            ))}
        </div>
    );
};

export default VideoList;
